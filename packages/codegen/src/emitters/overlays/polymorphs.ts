import type { NodeMap } from '../../compiler/types.ts';
import type { GeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { type AssembledNode } from '../../compiler/model/node-map.ts';
import { classifyFactoryEmission, classifyFromEmission, resolveDirectFactorySlot, resolveFieldStorageInfo } from '../shared.ts';
import { kindEnumConfigValue } from '../factories.ts';
import { collectCatalogKinds, collectKindEntries, type KindEnumEntry } from '../kind-discriminant.ts';
import { armConfigKeys, armIsConfigShaped, subFactoriesOf, type SubFactory } from './sub-factories.ts';
import { bundleEntries, overlayFrame, overlayImportPath } from './module.ts';

interface FlavorRefs {
	readonly strict: string;
	readonly coerce?: string;
}

type CoerceEmitted = (node: AssembledNode) => boolean;

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
	if (sub.arm.via !== 'kind') return undefined;
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

function methodName(parentKey: string, subName: string): string {
	return `${parentKey}$${subName.replace(/[^A-Za-z0-9_$]/g, '_')}`;
}

const PF = 'PF extends (config: never) => unknown';
const PFV = 'PF extends (value: never) => unknown';
const CF = 'CF extends (...args: never[]) => unknown';
const CALL_P = '(parent as unknown as (arg: unknown) => ReturnType<PF>)';
const CALL_C = '(child as unknown as (...args: readonly unknown[]) => unknown)';

interface WireShape {
	readonly method: readonly string[];
	readonly paramFor: (parentRef: string, childRef: string | undefined) => string;
}

function shape(sub: SubFactory, k: string, positional: boolean, mergeKeys: readonly string[] | undefined, m: string): WireShape {
	if (sub.arm.via === 'literal') {
		if (sub.residual.length === 0) {
			return {
				method: positional
					? [`const ${m} = <${PFV}>(parent: PF, value: Parameters<PF>[0]) => (): ReturnType<PF> => ${CALL_P}(value);`]
					: [
							`const ${m} = <${PF}>(parent: PF, value: unknown) => (): ReturnType<PF> => ${CALL_P}({ ${k}: value });`
						],
				paramFor: () => '()'
			};
		}
		return {
			method: [
				`const ${m} = <${PF}>(parent: PF, value: unknown) =>`,
				`	(config: Omit<Parameters<PF>[0], '${k}'>): ReturnType<PF> => ${CALL_P}({ ...config, ${k}: value });`
			],
			paramFor: (p) => `(config: Omit<Parameters<typeof ${p}>[0], '${k}'>)`
		};
	}
	if (sub.residual.length === 0) {
		return {
			method: positional
				? [
						`const ${m} = <${PFV}, ${CF}>(parent: PF, child: CF) =>`,
						`	(...args: Parameters<CF>): ReturnType<PF> => ${CALL_P}(${CALL_C}(...args));`
					]
				: [
						`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
						`	(...args: Parameters<CF>): ReturnType<PF> => ${CALL_P}({ ${k}: ${CALL_C}(...args) });`
					],
			paramFor: (_p, c) => `(...args: Parameters<typeof ${c}>)`
		};
	}
	if (mergeKeys !== undefined) {
		const keyTests = mergeKeys.map((key) => `key === ${JSON.stringify(key)}`).join(' || ') || 'false';
		return {
			method: [
				`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
				`	(config: Omit<Parameters<PF>[0], '${k}'> & Parameters<CF>[0]): ReturnType<PF> => {`,
				`		const rest: Record<string, unknown> = {};`,
				`		const inner: Record<string, unknown> = {};`,
				`		for (const [key, value] of Object.entries(config as Record<string, unknown>)) {`,
				`			if (${keyTests}) inner[key] = value;`,
				`			else rest[key] = value;`,
				`		}`,
				`		return ${CALL_P}({ ...rest, ${k}: (child as unknown as (arg: unknown) => unknown)(inner) });`,
				`	};`
			],
			paramFor: (p, c) => `(config: Omit<Parameters<typeof ${p}>[0], '${k}'> & Parameters<typeof ${c}>[0])`
		};
	}
	return {
		method: [
			`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
			`	(config: Omit<Parameters<PF>[0], '${k}'> & { ${k}: Parameters<CF> }): ReturnType<PF> => {`,
			`		const { ${k}: seated, ...rest } = config;`,
			`		return ${CALL_P}({ ...rest, ${k}: ${CALL_C}(...(seated as readonly unknown[])) });`,
			`	};`
		],
		paramFor: (p, c) => `(config: Omit<Parameters<typeof ${p}>[0], '${k}'> & { ${k}: Parameters<typeof ${c}> })`
	};
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
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	keyByKind: ReadonlyMap<string, string>,
	isEmitted: (kind: string) => boolean,
	coerceEmitted: CoerceEmitted
): SubEmission | undefined {
	const m = methodName(parentKey, sub.name);
	const p = parentRefs(parent, coerceEmitted);
	const k = sub.slot.configKey;
	const positional = resolveDirectFactorySlot(parent, nodeMap) !== undefined;

	if (sub.arm.via === 'literal') {
		const slotIsKindEnum = resolveFieldStorageInfo(sub.slot, nodeMap).kind === 'kindEnum';
		const val = kindEnumConfigValue(sub.arm.literal, !positional && slotIsKindEnum ? kindEntries : undefined);
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

	const c = childRefs(sub, keyByKind, coerceEmitted);
	if (c === undefined) return undefined;
	const mergeKeys =
		sub.arm.path.length === 0 && sub.residual.length > 0 && armIsConfigShaped(sub, nodeMap, { isEmitted })
			? armConfigKeys(sub, nodeMap, { isEmitted })
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

	const blocks: string[] = [];
	const emitted = new Set<string>();
	const visiting = new Set<string>();
	let usesKindId = false;

	function visit(node: AssembledNode): void {
		if (emitted.has(node.kind) || visiting.has(node.kind)) return;
		const parentKey = keyByKind.get(node.kind);
		const set = parentKey === undefined ? undefined : subFactoriesOf(node, nodeMap, { isEmitted });
		if (set === undefined || (set.entries.length === 0 && set.diagnostics.length === 0)) {
			emitted.add(node.kind);
			return;
		}
		visiting.add(node.kind);
		for (const sub of set.entries) {
			if (sub.arm.via === 'kind' && sub.arm.path.length > 0) visit(sub.arm.child);
		}
		visiting.delete(node.kind);
		for (const d of set.diagnostics) {
			console.warn(`[codegen] ${node.kind}: sub-factory ${d.name} skipped (${d.reason}): ${d.claimants.join(', ')}`);
		}
		const wires: string[] = [];
		const wireTypes: string[] = [];
		const methods: string[] = [];
		for (const sub of set.entries) {
			const emission = emitSub(node, parentKey!, sub, nodeMap, kindEntries, keyByKind, isEmitted, coerceEmitted);
			if (emission === undefined) continue;
			methods.push(...emission.method);
			if (emission.strictApply.includes('TSKindId.') || emission.coerceApply?.includes('TSKindId.')) usesKindId = true;
			if (emission.coerceApply === undefined) {
				wires.push(`	${sub.name}: { strict: ${emission.strictApply} },`);
				wireTypes.push(`	${sub.name}: { strict: ${emission.strictType} };`);
			} else {
				wires.push(`	${sub.name}: { strict: ${emission.strictApply}, coerce: ${emission.coerceApply} },`);
				wireTypes.push(`	${sub.name}: { strict: ${emission.strictType}; coerce: ${emission.coerceType} };`);
			}
		}
		if (wires.length > 0) {
			blocks.push(...methods);
			blocks.push(`export const ${parentKey}: typeof B.${parentKey} & {`);
			blocks.push(...wireTypes);
			blocks.push(`} = {`);
			blocks.push(`	...B.${parentKey},`);
			blocks.push(...wires);
			blocks.push('};', '');
		}
		emitted.add(node.kind);
	}

	for (const node of nodeMap.nodes.values()) visit(node);

	const extraImports = [
		"import * as F from '../raw.js';",
		"import * as C from '../coerce.js';",
		...(usesKindId ? ["import { TSKindId } from '../../types.js';"] : [])
	];
	return [...overlayFrame(overlayImportPath(1), extraImports), ...blocks].join('\n');
}
