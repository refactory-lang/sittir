import type { NodeMap } from '../../compiler/types.ts';
import type { GeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { AbstractAssembledCompound, AssembledList, type AssembledNode } from '../../compiler/model/node-map.ts';
import {
	classifyFactoryEmission,
	classifyFromEmission,
	isValidIdent,
	resolveDirectFactorySlot,
	resolveFieldStorageInfo,
	classifyFactoryShape
} from '../shared.ts';
import { valueStorageExpr } from '../factories.ts';
import { collectCatalogKinds, collectKindEntries, type KindEnumEntry } from '../kind-discriminant.ts';
import {
	armConfigKeys,
	armIsConfigShaped,
	configKeysOf,
	elementsSeatOf,
	spliceSeatOf,
	tupleSeatOf,
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
	coerceEmitted: CoerceEmitted,
	seated?: (kind: string) => boolean,
	wires?: PolymorphWires
): FlavorRefs | undefined {
	if (sub.arm.via !== 'node') return undefined;
	const { child, path } = sub.arm;
	if (path.length > 0) {
		const childKey = keyByKind.get(child.kind);
		if (childKey === undefined) return undefined;
		const spelled = wires === undefined ? [...path] : emittedArmPath(child.kind, path, wires);
		const base = `${childKey}.${spelled.join('.')}`;
		return { strict: `${base}.strict`, coerce: `${base}.coerce` };
	}
	const childKey = keyByKind.get(child.kind);
	if (childKey !== undefined && seated?.(child.kind) === true) {
		return { strict: `${childKey}.strict`, coerce: `${childKey}.coerce` };
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
	readonly tuples?: readonly SpliceSeat[];
}

export interface PolymorphWires {
	readonly order: readonly string[];
	readonly byKind: ReadonlyMap<string, PolymorphWireSet>;
	readonly kindEntries: readonly KindEnumEntry[] | undefined;
	readonly isEmitted: (kind: string) => boolean;
	readonly coerceEmitted: CoerceEmitted;
	readonly keyByKind: ReadonlyMap<string, string>;
	/** Kinds the bundle exports, so their overlay entry carries a `strict` of its own. */
	readonly bundledKinds: ReadonlySet<string>;
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
	const bundledKinds = new Set(keyByKind.keys());
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
			if (sub.arm.via === 'node') visit(sub.arm.child);
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
		const claimed = new Set(subs.map((sub) => sub.slot));
		const tuples = tupleSeatOf(node, nodeMap).filter((e) => isEmitted(e.group.kind) && !claimed.has(e.slot));
		visiting.add(node.kind);
		for (const s of [...(splice ? [splice] : []), ...elements, ...tuples]) visit(s.group);
		visiting.delete(node.kind);
		if (subs.length > 0 || aliases.length > 0 || splice !== undefined || elements.length > 0 || tuples.length > 0) {
			order.push(node.kind);
			byKind.set(node.kind, {
				parentKey,
				node,
				subs,
				aliases,
				...(splice ? { splice } : {}),
				...(elements.length > 0 ? { elements } : {}),
				...(tuples.length > 0 ? { tuples } : {})
			});
		}
		seen.add(node.kind);
	}

	for (const node of nodeMap.nodes.values()) visit(node);
	return { order, byKind, kindEntries, isEmitted, coerceEmitted, keyByKind, bundledKinds };
}

/**
 * A child whose own overlay entry carries seats must be reached through that
 * entry, not its raw builder: the raw builder takes the unseated shape, so a
 * mount or seat wired to it would hand a seated argument (a group's config, a
 * tuple) straight to a slot that cannot take it. A seat is also what puts a
 * `strict` on the entry: a wire set of arms alone is a bare mount namespace
 * with none, and a leaf has no `strict` at all because its strict and loose
 * forms are one.
 *
 * A child in a cycle with its parent cannot be declared first, so it keeps
 * its raw builder: the seated form has no spelling that would resolve there.
 */
function seatBearing(wires: PolymorphWires, kind: string, parentKind: string): boolean {
	const set = wires.byKind.get(kind);
	if (set === undefined) return false;
	if (set.splice === undefined && (set.elements ?? []).length === 0 && (set.tuples ?? []).length === 0) return false;
	const at = wires.order.indexOf(kind);
	return at !== -1 && at < wires.order.indexOf(parentKind);
}

interface ArmEntry {
	readonly sub: SubFactory;
	readonly line: string;
	readonly type: string;
	readonly children: Map<string, ArmEntry>;
}

function renderArm(name: string, entry: ArmEntry): { line: string; type: string } {
	const parts = [entry.line];
	const typeParts = [entry.type];
	for (const [key, child] of entry.children) {
		const rendered = renderArm(key, child);
		parts.push(rendered.line);
		typeParts.push(rendered.type);
	}
	return { line: `${name}: { ${parts.join(', ')} }`, type: `${name}: { ${typeParts.join('; ')} }` };
}

/** Every arm entry a kind emits, nested ones included, with the key path each sits at. */
function walkArms(entries: ReadonlyMap<string, ArmEntry>): ArmEntry[] {
	const out: ArmEntry[] = [];
	for (const entry of entries.values()) {
		out.push(entry, ...walkArms(entry.children));
	}
	return out;
}

/**
 * Arms of one slot chain onto arms of another. A kind with two arm-seated
 * slots has to name both in one call — python `except a, b:` needs the
 * exception's `list` and the suite's `block` — and each arm on its own is a
 * whole route wrapping the parent, so a caller could otherwise pick only one.
 * A later slot's arms are emitted again under each earlier arm, applied to it:
 * `ir.exceptClause.exception.list.block.strict(…)`. The applied route needs a
 * name, since a call expression has no `typeof` for the parameter types.
 */
function composeAcrossSlots(
	wireSet: PolymorphWireSet,
	wires: PolymorphWires,
	nodeMap: NodeMap,
	seated: FlavorRefs | undefined,
	armEntries: Map<string, ArmEntry>,
	methods: string[]
): void {
	const slots = wireSet.node instanceof AbstractAssembledCompound ? wireSet.node.slots : [];
	const indexOf = (sub: SubFactory): number => slots.indexOf(sub.slot);
	const bySlot = new Set(wireSet.subs.map(indexOf));
	if (bySlot.size < 2) return;
	for (const host of walkArms(armEntries)) {
		const outer = host.sub;
		const applied = emitSub(wireSet.node, wireSet.parentKey, outer, wires, nodeMap, seated);
		if (applied === undefined || applied.coerceApply === undefined || applied.coerceType === undefined) continue;
		const strictName = `${methodName(wireSet.parentKey, outer.name)}$applied`;
		const coerceName = `${strictName}Coerce`;
		let named = false;
		for (const inner of wireSet.subs) {
			if (indexOf(inner) <= indexOf(outer)) continue;
			const chained = emitSub(
				wireSet.node,
				wireSet.parentKey,
				inner,
				wires,
				nodeMap,
				{ strict: strictName, coerce: coerceName },
				`${outer.name}$${inner.name}`
			);
			if (chained === undefined || chained.coerceApply === undefined || chained.coerceType === undefined) continue;
			if (host.children.has(inner.name)) continue;
			if (!named) {
				methods.push(`const ${strictName}: ${applied.strictType} = ${applied.strictApply};`);
				methods.push(`const ${coerceName}: ${applied.coerceType} = ${applied.coerceApply};`);
				named = true;
			}
			methods.push(...chained.method);
			host.children.set(inner.name, {
				sub: inner,
				line: `strict: ${chained.strictApply}, coerce: ${chained.coerceApply}`,
				type: `strict: ${chained.strictType}; coerce: ${chained.coerceType}`,
				children: new Map()
			});
		}
	}
}

interface SeatedParent {
	readonly refs: FlavorRefs;
	readonly wireLine: string;
	readonly wireType: string;
}

/**
 * Fold a kind's seats onto its own factory and give the result a name. Every
 * mount route then builds on that name instead of the raw factory, so a mount
 * carries the parent's seats rather than dropping them: `case_clause` seats
 * its patterns as a tuple AND mounts its suite, and both spellings must work
 * in one call.
 */
function composeSeats(
	seats: readonly SeatEmission[],
	wireSet: PolymorphWireSet,
	wires: PolymorphWires,
	methods: string[]
): SeatedParent | undefined {
	if (seats.length === 0) return undefined;
	const p = parentRefs(wireSet.node, wires.coerceEmitted);
	const spread = seats.some((seat) => seat.spread);
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
	const strictName = `${wireSet.parentKey}$seated`;
	methods.push(`const ${strictName}: ${strictParams} => ReturnType<typeof ${p.strict}> = ${strictExpr};`);
	if (coerceExpr === undefined) {
		return {
			refs: { strict: strictName, coerce: undefined },
			wireLine: `	strict: ${strictName},`,
			wireType: `	strict: typeof ${strictName};`
		};
	}
	const coerceName = `${wireSet.parentKey}$seatedCoerce`;
	methods.push(`const ${coerceName}: ${coerceParams} => ReturnType<typeof ${p.coerce}> = ${coerceExpr};`);
	return {
		refs: { strict: strictName, coerce: coerceName },
		wireLine: `	strict: ${strictName}, coerce: ${coerceName},`,
		wireType: `	strict: typeof ${strictName}; coerce: typeof ${coerceName};`
	};
}

/**
 * The arm a flattened grand-arm nests under: the direct arm that reaches the
 * same child. A variant minted inside another variant's rule is spelled
 * inside it too — `ir.visibilityModifier.pub.inPath`, not a flat
 * `ir.visibilityModifier.inPath` that reads as its sibling. A grand-arm whose
 * child no parent arm reaches stays flat, since there is nothing to nest it
 * under. The nested key is the child's own arm name, since the flattened
 * name's prefix is exactly the arm it now sits under.
 */
/**
 * How an arm of `kind` is actually spelled on its emitted entry: one segment
 * when it sits at the top, two when it nests under the arm that reaches its
 * child. A reference into a child's arms has to follow the same nesting the
 * child was emitted with, or it names a key that is not there.
 */
export function emittedArmPath(kind: string, path: readonly string[], wires: PolymorphWires): string[] {
	const set = wires.byKind.get(kind);
	const head = path[0];
	if (set === undefined || head === undefined) return [...path];
	const sub = set.subs.find((candidate) => candidate.name === head);
	if (sub === undefined) return [...path];
	const under = nestingArmOf(sub, set.subs);
	const spelled = under === undefined ? [sub.name] : [under.host, under.key];
	const rest = path.slice(1);
	if (rest.length === 0) return spelled;
	const next = sub.arm.via === 'node' ? sub.arm.child.kind : undefined;
	return next === undefined ? [...spelled, ...rest] : [...spelled, ...emittedArmPath(next, rest, wires)];
}

function nestingArmOf(sub: SubFactory, subs: readonly SubFactory[]): { host: string; key: string } | undefined {
	if (sub.arm.via !== 'node' || sub.arm.path.length === 0) return undefined;
	const child = sub.arm.child;
	const host = subs.find((d) => d.arm.via === 'node' && d.arm.path.length === 0 && d.arm.child === child);
	if (host === undefined) return undefined;
	const key = sub.arm.path[sub.arm.path.length - 1]!;
	const collides = subs.some(
		(other) =>
			other !== sub &&
			other.arm.via === 'node' &&
			other.arm.path.length > 0 &&
			other.arm.child === child &&
			other.arm.path[other.arm.path.length - 1] === key
	);
	return { host: host.name, key: collides ? sub.name : key };
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

function spliceShape(
	k: string,
	mergeKeys: readonly string[],
	m: string,
	positional: boolean,
	directKey: string | undefined
): SeatShape {
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
	const groupConfig = (c: string): string =>
		directKey === undefined ? `ArgsOf<${c}>[0]` : `{ ${directKey}: ArgsOf<${c}>[0] }`;
	const spliced = (p: string, c: string): string =>
		`${p} | (OmitEach<NonNullable<${p}>, '${k}'> & (${groupConfig(c)} | NoneOf<${groupConfig(c)}>))`;
	const buildGroup = directKey === undefined ? `${CALL_C}(inner)` : `${CALL_C}(inner[${JSON.stringify(directKey)}])`;
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
			`		return ${CALL_P}(seated ? { ...rest, ${k}: ${buildGroup} } : rest);`,
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

/**
 * The method behind a tuple seat. The child's whole argument list rides the
 * parent's slot as an array, so a separated list keeps both its options bag
 * and its elements. An already-built child still passes through: an array in
 * that slot is the seated form, anything else is the parent's own input.
 */
function tupleShape(k: string, m: string): SeatShape {
	const seated = (p: string, c: string): string =>
		`${p} | (OmitEach<NonNullable<${p}>, '${k}'> & { ${k}: ArgsOf<${c}> })`;
	return {
		method: [
			`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) => {`,
			`	return (config: ${seated('ArgsOf<PF>[0]', 'CF')}): ReturnType<PF> => {`,
			`		if (config === undefined) return ${CALL_P}(config);`,
			`		const seat = _o(config)[${JSON.stringify(k)}];`,
			`		if (!Array.isArray(seat)) return ${CALL_P}(config);`,
			`		return ${CALL_P}({ ..._o(config), ${k}: ${CALL_C}(...seat) });`,
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
	kind: 'splice' | 'elements' | 'tuple',
	wires: PolymorphWires,
	nodeMap: NodeMap
): SeatEmission {
	const m = methodName(parentKey, kind === 'splice' ? 'splice' : seat.slot.configKey);
	const direct = resolveDirectFactorySlot(parent, nodeMap) !== undefined;
	const childKey = wires.keyByKind.get(seat.group.kind);
	const child: FlavorRefs =
		childKey !== undefined && seatBearing(wires, seat.group.kind, parent.kind)
			? { strict: `${childKey}.strict`, coerce: `${childKey}.coerce` }
			: {
					strict: `F.${seat.group.rawFactoryName}`,
					coerce: wires.coerceEmitted(seat.group) ? `C.${seat.group.fromFunctionName}` : undefined
				};
	const s =
		kind === 'tuple'
			? tupleShape(seat.slot.configKey, m)
			: kind === 'splice'
			? spliceShape(seat.slot.configKey, configKeysOf(seat.group), m, direct, seat.directKey)
			: elementsShape(
					seat.slot.configKey,
					configKeysOf(seat.group),
					m,
					parent instanceof AssembledList || classifyFactoryShape(parent, nodeMap) === 'spread'
				);
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
	nodeMap: NodeMap,
	parentOverride?: FlavorRefs,
	methodKey?: string
): SubEmission | undefined {
	const m = methodName(parentKey, methodKey ?? sub.name);
	const p = parentOverride ?? parentRefs(parent, wires.coerceEmitted);
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

	const c = childRefs(sub, wires.keyByKind, wires.coerceEmitted, (kind) => seatBearing(wires, kind, parent.kind), wires);
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
		const seats: SeatEmission[] = [
			...(wireSet.splice ? [seatEmission(wireSet.node, wireSet.parentKey, wireSet.splice, 'splice', wires, nodeMap)] : []),
			...(wireSet.elements ?? []).map((e) => seatEmission(wireSet.node, wireSet.parentKey, e, 'elements', wires, nodeMap)),
			...(wireSet.tuples ?? []).map((e) => seatEmission(wireSet.node, wireSet.parentKey, e, 'tuple', wires, nodeMap))
		];
		const seated = composeSeats(seats, wireSet, wires, methods);
		const armEntries = new Map<string, ArmEntry>();
		const flat: { line: string; type: string }[] = [];
		for (const sub of wireSet.subs) {
			const emission = emitSub(wireSet.node, wireSet.parentKey, sub, wires, nodeMap, seated?.refs);
			if (emission === undefined) continue;
			methods.push(...emission.method);
			if (emission.strictApply.includes('TSKindId.') || emission.coerceApply?.includes('TSKindId.')) usesKindId = true;
			const body =
				emission.coerceApply === undefined
					? `strict: ${emission.strictApply}`
					: `strict: ${emission.strictApply}, coerce: ${emission.coerceApply}`;
			const bodyType =
				emission.coerceType === undefined
					? `strict: ${emission.strictType}`
					: `strict: ${emission.strictType}; coerce: ${emission.coerceType}`;
			const under = nestingArmOf(sub, wireSet.subs);
			const entry: ArmEntry = { sub, line: body, type: bodyType, children: new Map() };
			if (under === undefined) {
				armEntries.set(sub.name, entry);
			} else {
				const host = armEntries.get(under.host);
				if (host === undefined) {
					flat.push({ line: `	${sub.name}: { ${body} },`, type: `	${sub.name}: { ${bodyType} };` });
				} else {
					host.children.set(under.key, entry);
				}
			}
		}
		composeAcrossSlots(wireSet, wires, nodeMap, seated?.refs, armEntries, methods);
		for (const [name, entry] of armEntries) {
			const rendered = renderArm(name, entry);
			wireLines.push(`	${rendered.line},`);
			wireTypes.push(`	${rendered.type};`);
		}
		for (const f of flat) {
			wireLines.push(f.line);
			wireTypes.push(f.type);
		}
		if (seated !== undefined) {
			wireLines.push(seated.wireLine);
			wireTypes.push(seated.wireType);
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
