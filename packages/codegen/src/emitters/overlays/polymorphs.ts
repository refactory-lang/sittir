import type { NodeMap } from '../../compiler/types.ts';
import type { GeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { AbstractAssembledCompound, AssembledList, type AssembledNode } from '../../compiler/model/node-map.ts';
import {
	classifyFactoryEmission,
	classifyFromEmission,
	isValidIdent,
	resolveDirectFactorySlot,
	resolveFieldStorageInfo
} from '../shared.ts';
import { valueStorageExpr } from '../factories.ts';
import { collectCatalogKinds, collectKindEntries, type KindEnumEntry } from '../kind-discriminant.ts';
import {
	armConfigKeys,
	armIsConfigShaped,
	configKeysOf,
	elementsSeatOf,
	spliceSeatOf,
	subFactoriesOf,
	type SpliceSeat,
	type SubFactory
} from './sub-factories.ts';
import { bundleEntries, overlayFrame, overlayImportPath } from './module.ts';
import { camelCase } from '../refine-emit.ts';

interface FlavorRefs {
	readonly strict: string;
	readonly coerce?: string;
}

type CoerceEmitted = (node: AssembledNode) => boolean;

function isHoistedCompound(node: AssembledNode): boolean {
	return (
		node instanceof AbstractAssembledCompound && !(node instanceof AssembledList) && node.annotations?.hoisted === true
	);
}

function parentRefs(node: AssembledNode, coerceEmitted: CoerceEmitted): FlavorRefs {
	return {
		strict: `F.${node.rawFactoryName}`,
		coerce: coerceEmitted(node) ? `C.${node.fromFunctionName}` : undefined
	};
}

function childRefs(
	sub: SubFactory,
	keyByKind: ReadonlyMap<string, string>,
	coerceEmitted: CoerceEmitted
): FlavorRefs | undefined {
	if (sub.arm.via !== 'node') return undefined;
	const { child, path } = sub.arm;
	if (path.length > 0) {
		const childKey = keyByKind.get(child.kind);
		if (childKey === undefined) return undefined;
		const base = `${childKey}.${path.join('.')}`;
		return { strict: `${base}.strict`, coerce: `${base}.coerce` };
	}
	const strict = `F.${child.rawFactoryName}`;
	return { strict, coerce: coerceEmitted(child) ? `C.${child.fromFunctionName}` : strict };
}

export interface AliasWire {
	readonly name: string;
	readonly child: AssembledNode;
}

function variantAliasWires(
	node: AssembledNode,
	nodeMap: NodeMap,
	isEmitted: (kind: string) => boolean,
	subs: readonly SubFactory[]
): readonly AliasWire[] {
	if (!(node instanceof AbstractAssembledCompound)) return [];
	const claimedNames = new Set(subs.map((s) => s.name));
	const claimedKinds = new Set(subs.flatMap((s) => (s.arm.via === 'node' ? [s.arm.child.kind] : [])));
	const aliases: AliasWire[] = [];
	for (const variantChild of node.variantChildKinds) {
		const visible = variantChild.kind;
		const child = nodeMap.nodes.get(visible) ?? nodeMap.nodes.get(`_${visible}`);
		if (child === undefined || child.rawFactoryName === undefined) continue;
		if (!isEmitted(child.kind) || claimedKinds.has(child.kind)) continue;
		const name = camelCase(variantChild.name);
		if (claimedNames.has(name)) continue;
		aliases.push({ name, child });
	}
	return aliases;
}

export interface PolymorphWireSet {
	readonly parentKey: string;
	readonly node: AssembledNode;
	readonly subs: readonly SubFactory[];
	readonly aliases: readonly AliasWire[];
	readonly splice?: SpliceSeat;
	readonly elements?: readonly SpliceSeat[];
}

export interface PolymorphWires {
	readonly order: readonly string[];
	readonly byKind: ReadonlyMap<string, PolymorphWireSet>;
	readonly kindEntries: readonly KindEnumEntry[] | undefined;
	readonly isEmitted: (kind: string) => boolean;
	readonly coerceEmitted: CoerceEmitted;
	readonly keyByKind: ReadonlyMap<string, string>;
}

export function collectPolymorphWires(
	nodeMap: NodeMap,
	generatedIdTables?: GeneratedIdTables,
	options: { silent?: boolean } = {}
): PolymorphWires {
	const kindEntries = generatedIdTables
		? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
		: undefined;
	const isEmitted = (kind: string): boolean => {
		const node = nodeMap.nodes.get(kind);
		return node !== undefined && classifyFactoryEmission(kind, node, { nodeMap, kindEntries }) === 'emit';
	};
	const coerceEmitted: CoerceEmitted = (node) =>
		node.fromFunctionName !== undefined && classifyFromEmission(node.kind, node, { nodeMap, kindEntries }) === 'emit';
	const keyByKind = new Map(bundleEntries(nodeMap, generatedIdTables).map((e) => [e.node.kind, e.exportName]));
	for (const [kind, node] of nodeMap.nodes) {
		if (!isHoistedCompound(node) || node.factoryName === undefined || !isValidIdent(node.factoryName)) continue;
		if (node.rawFactoryName === undefined || !isEmitted(kind) || keyByKind.has(kind)) continue;
		keyByKind.set(kind, node.factoryName);
	}
	const warn = options.silent ? () => {} : (message: string) => console.warn(message);

	const order: string[] = [];
	const byKind = new Map<string, PolymorphWireSet>();
	const seen = new Set<string>();
	const visiting = new Set<string>();

	function visit(node: AssembledNode): void {
		if (seen.has(node.kind) || visiting.has(node.kind)) return;
		const parentKey = keyByKind.get(node.kind);
		if (parentKey === undefined) {
			seen.add(node.kind);
			return;
		}
		const set = subFactoriesOf(node, nodeMap, { isEmitted });
		visiting.add(node.kind);
		for (const sub of set.entries) {
			if (sub.arm.via === 'node' && sub.arm.path.length > 0) visit(sub.arm.child);
		}
		visiting.delete(node.kind);
		for (const d of set.diagnostics) {
			warn(`[codegen] ${node.kind}: sub-factory ${d.name} skipped (${d.reason}): ${d.claimants.join(', ')}`);
		}
		const subs = set.entries.filter((sub) => {
			if (sub.arm.via === 'value') return true;
			if (sub.arm.path.length > 0) {
				const emitted = byKind.get(sub.arm.child.kind);
				const step = sub.arm.path[0]!;
				const present =
					emitted !== undefined &&
					(emitted.subs.some((e) => e.name === step) || emitted.aliases.some((a) => a.name === step));
				if (!present) {
					warn(
						`[codegen] ${node.kind}: sub-factory ${sub.name} skipped (context-mismatch): ${sub.arm.child.kind}.${sub.arm.path.join('.')}`
					);
					return false;
				}
			}
			return childRefs(sub, keyByKind, coerceEmitted) !== undefined;
		});
		const aliases = variantAliasWires(node, nodeMap, isEmitted, subs);
		const seat = spliceSeatOf(node, nodeMap);
		const splice = seat !== undefined && isEmitted(seat.group.kind) ? seat : undefined;
		const elements = elementsSeatOf(node, nodeMap).filter((e) => isEmitted(e.group.kind));
		if (subs.length > 0 || aliases.length > 0 || splice !== undefined || elements.length > 0) {
			order.push(node.kind);
			byKind.set(node.kind, {
				parentKey,
				node,
				subs,
				aliases,
				...(splice ? { splice } : {}),
				...(elements.length > 0 ? { elements } : {})
			});
		}
		seen.add(node.kind);
	}

	for (const node of nodeMap.nodes.values()) visit(node);
	return { order, byKind, kindEntries, isEmitted, coerceEmitted, keyByKind };
}

function methodName(parentKey: string, subName: string): string {
	return `${parentKey}$${subName.replace(/[^A-Za-z0-9_$]/g, '_')}`;
}

const PF = 'PF extends (config: never) => unknown';
const PFV = 'PF extends (value: never) => unknown';
const CF = 'CF extends (...args: never[]) => unknown';
const CALL_P = '_p<ReturnType<PF>>(parent)';
const CALL_C = '_c(child)';
const ERASED_HELPERS = [
	'// Erased applications, centralized: TS cannot infer a Cfg type parameter',
	'// constrained by another inference variable in a contravariant position,',
	'// so the pair below carries the one sanctioned dsl-bridging double cast;',
	'// every wire method routes through these two sites.',
	'const _p = <R,>(f: unknown) => f as (arg: unknown) => R;',
	'const _c = (f: unknown) => f as (...a: readonly unknown[]) => unknown;',
	'const _s = <R,>(f: unknown) => f as (...a: readonly unknown[]) => R;',
	"// A kind's Config is a declared interface, and those are not assignable",
	'// to an index signature — so reading or spreading one generically needs',
	'// an erasure. It lives here, once, rather than at every method that',
	'// merges or partitions a config.',
	'const _o = (config: unknown) => config as Record<string, unknown>;',
	'const _m = (config: unknown, extra: Record<string, unknown>): Record<string, unknown> =>',
	'\t({ ..._o(config), ...extra });',
	'// A spliced group is present as a whole or absent as a whole: the second',
	'// overload forbids every one of its keys.',
	'type NoneOf<T> = { [K in keyof T]?: never };',
	'const _built = (v: unknown): boolean => typeof v === \'object\' && v !== null && \'$type\' in v;',
	''
];

interface WireShape {
	readonly method: readonly string[];
	readonly paramFor: (parentRef: string, childRef: string | undefined) => string;
}

function shape(
	sub: SubFactory,
	k: string,
	positional: boolean,
	mergeKeys: readonly string[] | undefined,
	m: string
): WireShape {
	if (sub.arm.via === 'value') {
		if (sub.residual.length === 0) {
			return {
				method: positional
					? [`const ${m} = <${PFV}>(parent: PF, value: ArgsOf<PF>[0]) => (): ReturnType<PF> => ${CALL_P}(value);`]
					: [`const ${m} = <${PF}>(parent: PF, value: unknown) => (): ReturnType<PF> => ${CALL_P}({ ${k}: value });`],
				paramFor: () => '()'
			};
		}
		return {
			method: [
				`const ${m} = <${PF}>(parent: PF, value: unknown) =>`,
				`	(config: OmitEach<ArgsOf<PF>[0], '${k}'>): ReturnType<PF> => ${CALL_P}({ ...config, ${k}: value });`
			],
			paramFor: (p) => `(config: OmitEach<ArgsOf<typeof ${p}>[0], '${k}'>)`
		};
	}
	if (sub.residual.length === 0) {
		return {
			method: positional
				? [
						`const ${m} = <${PFV}, ${CF}>(parent: PF, child: CF) =>`,
						`	(...args: ArgsOf<CF>): ReturnType<PF> => ${CALL_P}(${CALL_C}(...args));`
					]
				: [
						`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
						`	(...args: ArgsOf<CF>): ReturnType<PF> => ${CALL_P}({ ${k}: ${CALL_C}(...args) });`
					],
			paramFor: (_p, c) => `(...args: ArgsOf<typeof ${c}>)`
		};
	}
	if (mergeKeys !== undefined) {
		if (mergeKeys.length === 0) {
			// No key routes to the child, so the partition below would send
			// every key to `rest` and hand the child an empty object. Say
			// that directly instead of emitting a loop guarded by `false`.
			return {
				method: [
					`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
					`	(config: OmitEach<ArgsOf<PF>[0], '${k}'> & ArgsOf<CF>[0]): ReturnType<PF> =>`,
					`		${CALL_P}(_m(config, { ${k}: ${CALL_C}({}) }));`
				],
				paramFor: (p, c) => `(config: OmitEach<ArgsOf<typeof ${p}>[0], '${k}'> & ArgsOf<typeof ${c}>[0])`
			};
		}
		const keyTests = mergeKeys.map((key) => `key === ${JSON.stringify(key)}`).join(' || ');
		return {
			method: [
				`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
				`	(config: OmitEach<ArgsOf<PF>[0], '${k}'> & ArgsOf<CF>[0]): ReturnType<PF> => {`,
				`		const rest: Record<string, unknown> = {};`,
				`		const inner: Record<string, unknown> = {};`,
				`		for (const [key, value] of Object.entries(_o(config))) {`,
				`			if (${keyTests}) inner[key] = value;`,
				`			else rest[key] = value;`,
				`		}`,
				`		return ${CALL_P}({ ...rest, ${k}: ${CALL_C}(inner) });`,
				`	};`
			],
			paramFor: (p, c) => `(config: OmitEach<ArgsOf<typeof ${p}>[0], '${k}'> & ArgsOf<typeof ${c}>[0])`
		};
	}
	return {
		method: [
			`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
			`	(config: OmitEach<ArgsOf<PF>[0], '${k}'> & { ${k}: ArgsOf<CF> }): ReturnType<PF> => {`,
			`		const { ${k}: seated, ...rest } = config;`,
			`		return ${CALL_P}({ ...rest, ${k}: ${CALL_C}(...(seated as readonly unknown[])) });`,
			`	};`
		],
		paramFor: (p, c) => `(config: OmitEach<ArgsOf<typeof ${p}>[0], '${k}'> & { ${k}: ArgsOf<typeof ${c}> })`
	};
}

interface SeatShape {
	readonly method: readonly string[];
	readonly paramFor: (parentParamType: string, childRef: string) => string;
	readonly spread?: true;
}

function spliceShape(k: string, mergeKeys: readonly string[], m: string, positional: boolean): SeatShape {
	if (positional) {
		return {
			method: [
				`const ${m} = <${PFV}, ${CF}>(parent: PF, child: CF) =>`,
				`	(config: ArgsOf<PF>[0] | ArgsOf<CF>[0]): ReturnType<PF> =>`,
				`		config === undefined || _built(config) ? ${CALL_P}(config) : ${CALL_P}(${CALL_C}(config));`
			],
			paramFor: (p, c) => `(config: ${p} | ArgsOf<typeof ${c}>[0])`
		};
	}
	const keyTests = mergeKeys.map((key) => `key === ${JSON.stringify(key)}`).join(' || ');
	const spliced = (p: string, c: string): string =>
		`${p} | (OmitEach<NonNullable<${p}>, '${k}'> & (ArgsOf<${c}>[0] | NoneOf<ArgsOf<${c}>[0]>))`;
	return {
		method: [
			`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
			`	(config: ${spliced('ArgsOf<PF>[0]', 'CF')}): ReturnType<PF> => {`,
			`		if (config === undefined) return ${CALL_P}(config);`,
			`		const rest: Record<string, unknown> = {};`,
			`		const inner: Record<string, unknown> = {};`,
			`		let seated = false;`,
			`		for (const [key, value] of Object.entries(_o(config))) {`,
			`			if (${keyTests}) {`,
			`				inner[key] = value;`,
			`				seated = seated || value !== undefined;`,
			`			} else rest[key] = value;`,
			`		}`,
			`		return ${CALL_P}(seated ? { ...rest, ${k}: ${CALL_C}(inner) } : rest);`,
			`	};`
		],
		paramFor: (p, c) => `(config: ${spliced(p, `typeof ${c}`)})`
	};
}

const PFS = 'PF extends (...args: never[]) => unknown';

function configTest(keys: readonly string[]): string {
	const keyTests = keys.map((key) => `key === ${JSON.stringify(key)}`).join(' || ') || 'false';
	return `(e: unknown): boolean => typeof e === 'object' && e !== null && !('$type' in e) && Object.keys(e).every((key) => ${keyTests})`;
}

function elementsShape(k: string, groupKeys: readonly string[], m: string, spread: boolean): SeatShape {
	if (spread) {
		return {
			method: [
				`const ${m} = <${PFS}, ${CF}>(parent: PF, child: CF) => {`,
				`	const isConfig = ${configTest(groupKeys)};`,
				`	return (...args: ReadonlyArray<ArgsOf<PF>[number] | ArgsOf<CF>[0]>): ReturnType<PF> =>`,
				`		_s<ReturnType<PF>>(parent)(...args.map((e) => (isConfig(e) ? ${CALL_C}(e) : e)));`,
				`};`
			],
			paramFor: (p, c) => `(...args: ReadonlyArray<${p} | ArgsOf<typeof ${c}>[0]>)`,
			spread: true
		};
	}
	const seated = (p: string, c: string): string =>
		`${p} | (OmitEach<NonNullable<${p}>, '${k}'> & { ${k}: ReadonlyArray<ArgsOf<${c}>[0] | (NonNullable<${p}> extends { readonly ${k}?: infer E } ? (E extends readonly (infer I)[] ? I : never) : never)> })`;
	return {
		method: [
			`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) => {`,
			`	const isConfig = ${configTest(groupKeys)};`,
			`	return (config: ${seated('ArgsOf<PF>[0]', 'CF')}): ReturnType<PF> => {`,
			`		if (config === undefined) return ${CALL_P}(config);`,
			`		const seat = _o(config)[${JSON.stringify(k)}];`,
			`		if (!Array.isArray(seat)) return ${CALL_P}(config);`,
			`		return ${CALL_P}({ ..._o(config), ${k}: seat.map((e) => (isConfig(e) ? ${CALL_C}(e) : e)) });`,
			`	};`,
			`};`
		],
		paramFor: (p, c) => `(config: ${seated(p, `typeof ${c}`)})`
	};
}

interface SeatEmission {
	readonly method: readonly string[];
	readonly apply: (parentExpr: string, childRef: string) => string;
	readonly paramFor: (parentParamType: string, childRef: string) => string;
	readonly child: FlavorRefs;
	readonly spread: boolean;
}

function seatEmission(
	parent: AssembledNode,
	parentKey: string,
	seat: SpliceSeat,
	kind: 'splice' | 'elements',
	wires: PolymorphWires,
	nodeMap: NodeMap
): SeatEmission {
	const m = methodName(parentKey, kind === 'splice' ? 'splice' : seat.slot.configKey);
	const child: FlavorRefs = {
		strict: `F.${seat.group.rawFactoryName}`,
		coerce: wires.coerceEmitted(seat.group) ? `C.${seat.group.fromFunctionName}` : undefined
	};
	const s =
		kind === 'splice'
			? spliceShape(
					seat.slot.configKey,
					configKeysOf(seat.group),
					m,
					resolveDirectFactorySlot(parent, nodeMap) !== undefined
				)
			: elementsShape(seat.slot.configKey, configKeysOf(seat.group), m, parent instanceof AssembledList);
	return { method: s.method, apply: (pe, c) => `${m}(${pe}, ${c})`, paramFor: s.paramFor, child, spread: s.spread === true };
}

interface SubEmission {
	readonly method: readonly string[];
	readonly strictApply: string;
	readonly strictType: string;
	readonly coerceApply?: string;
	readonly coerceType?: string;
}

function emitSub(
	parent: AssembledNode,
	parentKey: string,
	sub: SubFactory,
	wires: PolymorphWires,
	nodeMap: NodeMap
): SubEmission | undefined {
	const m = methodName(parentKey, sub.name);
	const p = parentRefs(parent, wires.coerceEmitted);
	const k = sub.slot.configKey;
	const positional = resolveDirectFactorySlot(parent, nodeMap) !== undefined;

	if (sub.arm.via === 'value') {
		const val = valueStorageExpr(sub.arm.storage, resolveFieldStorageInfo(sub.slot, nodeMap), wires.kindEntries);
		const s = shape(sub, k, positional, undefined, m);
		const typeFor = (ref: string): string => `${s.paramFor(ref, undefined)} => ReturnType<typeof ${ref}>`;
		return {
			method: s.method,
			strictApply: `${m}(${p.strict}, ${val})`,
			strictType: typeFor(p.strict),
			coerceApply: p.coerce ? `${m}(${p.coerce}, ${val})` : undefined,
			coerceType: p.coerce ? typeFor(p.coerce) : undefined
		};
	}

	const c = childRefs(sub, wires.keyByKind, wires.coerceEmitted);
	if (c === undefined) return undefined;
	const mergeKeys =
		sub.arm.path.length === 0 &&
		sub.residual.length > 0 &&
		armIsConfigShaped(sub, nodeMap, { isEmitted: wires.isEmitted })
			? armConfigKeys(sub, nodeMap, { isEmitted: wires.isEmitted })
			: undefined;
	const s = shape(sub, k, positional, mergeKeys, m);
	const typeFor = (pRef: string, cRef: string): string => `${s.paramFor(pRef, cRef)} => ReturnType<typeof ${pRef}>`;
	return {
		method: s.method,
		strictApply: `${m}(${p.strict}, ${c.strict})`,
		strictType: typeFor(p.strict, c.strict),
		coerceApply: p.coerce && c.coerce ? `${m}(${p.coerce}, ${c.coerce})` : undefined,
		coerceType: p.coerce && c.coerce ? typeFor(p.coerce, c.coerce) : undefined
	};
}

export function emitPolymorphsOverlay(config: { nodeMap: NodeMap; generatedIdTables?: GeneratedIdTables }): string {
	const { nodeMap, generatedIdTables } = config;
	const wires = collectPolymorphWires(nodeMap, generatedIdTables);

	const blocks: string[] = [];
	let usesKindId = false;
	let emittedHelpers = false;

	for (const kind of wires.order) {
		const wireSet = wires.byKind.get(kind)!;
		const wireLines: string[] = [];
		const wireTypes: string[] = [];
		const methods: string[] = [];
		for (const sub of wireSet.subs) {
			const emission = emitSub(wireSet.node, wireSet.parentKey, sub, wires, nodeMap);
			if (emission === undefined) continue;
			methods.push(...emission.method);
			if (emission.strictApply.includes('TSKindId.') || emission.coerceApply?.includes('TSKindId.')) usesKindId = true;
			if (emission.coerceApply === undefined) {
				wireLines.push(`	${sub.name}: { strict: ${emission.strictApply} },`);
				wireTypes.push(`	${sub.name}: { strict: ${emission.strictType} };`);
			} else {
				wireLines.push(`	${sub.name}: { strict: ${emission.strictApply}, coerce: ${emission.coerceApply} },`);
				wireTypes.push(`	${sub.name}: { strict: ${emission.strictType}; coerce: ${emission.coerceType} };`);
			}
		}
		const seats: SeatEmission[] = [
			...(wireSet.splice ? [seatEmission(wireSet.node, wireSet.parentKey, wireSet.splice, 'splice', wires, nodeMap)] : []),
			...(wireSet.elements ?? []).map((e) => seatEmission(wireSet.node, wireSet.parentKey, e, 'elements', wires, nodeMap))
		];
		if (seats.length > 0) {
			const p = parentRefs(wireSet.node, wires.coerceEmitted);
			const spread = seats.some((s) => s.spread);
			let strictExpr = p.strict;
			let strictParam = spread ? `ArgsOf<typeof ${p.strict}>[number]` : `ArgsOf<typeof ${p.strict}>[0]`;
			let strictParams = '';
			let coerceExpr = p.coerce;
			let coerceParam = p.coerce ? (spread ? `ArgsOf<typeof ${p.coerce}>[number]` : `ArgsOf<typeof ${p.coerce}>[0]`) : undefined;
			let coerceParams = '';
			const inner = (params: string): string => params.slice(params.indexOf(': ') + 2, -1);
			for (const seat of seats) {
				methods.push(...seat.method);
				strictParams = seat.paramFor(strictParam, seat.child.strict);
				strictParam = inner(strictParams);
				strictExpr = seat.apply(strictExpr, seat.child.strict);
				if (coerceExpr !== undefined && coerceParam !== undefined && seat.child.coerce !== undefined) {
					coerceParams = seat.paramFor(coerceParam, seat.child.coerce);
					coerceParam = inner(coerceParams);
					coerceExpr = seat.apply(coerceExpr, seat.child.coerce);
				} else {
					coerceExpr = undefined;
					coerceParam = undefined;
				}
			}
			if (coerceExpr === undefined) {
				wireLines.push(`	strict: ${strictExpr},`);
				wireTypes.push(`	strict: ${strictParams} => ReturnType<typeof ${p.strict}>;`);
			} else {
				wireLines.push(`	strict: ${strictExpr}, coerce: ${coerceExpr},`);
				wireTypes.push(
					`	strict: ${strictParams} => ReturnType<typeof ${p.strict}>; coerce: ${coerceParams} => ReturnType<typeof ${p.coerce}>;`
				);
			}
		}
		for (const alias of wireSet.aliases) {
			const strictRef = `F.${alias.child.rawFactoryName}`;
			const coerceRef = wires.coerceEmitted(alias.child) ? `C.${alias.child.fromFunctionName}` : undefined;
			if (coerceRef === undefined) {
				wireLines.push(`	${alias.name}: { strict: ${strictRef} },`);
				wireTypes.push(`	${alias.name}: { strict: typeof ${strictRef} };`);
			} else {
				wireLines.push(`	${alias.name}: { strict: ${strictRef}, coerce: ${coerceRef} },`);
				wireTypes.push(`	${alias.name}: { strict: typeof ${strictRef}; coerce: typeof ${coerceRef} };`);
			}
		}
		if (wireLines.length > 0) {
			if (!emittedHelpers && methods.length > 0) {
				blocks.push(...ERASED_HELPERS);
				emittedHelpers = true;
			}
			blocks.push(...methods);
			if (isHoistedCompound(wireSet.node)) {
				blocks.push(`const ${wireSet.parentKey}: {`);
				blocks.push(...wireTypes);
				blocks.push(`} = {`);
			} else {
				blocks.push(`export const ${wireSet.parentKey}: typeof B.${wireSet.parentKey} & {`);
				blocks.push(...wireTypes);
				blocks.push(`} = {`);
				blocks.push(`	...B.${wireSet.parentKey},`);
			}
			blocks.push(...wireLines);
			blocks.push('};', '');
		}
	}

	const extraImports = [
		"import * as F from '../raw.js';",
		"import * as C from '../coerce.js';",
		"import type { ArgsOf, OmitEach } from '../../utils.js';",
		...(usesKindId ? ["import { TSKindId } from '../../types.js';"] : [])
	];
	return [...overlayFrame(overlayImportPath(1), blocks, extraImports), ...blocks].join('\n');
}
