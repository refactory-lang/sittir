import type { NodeMap } from '../compiler/types.ts';
import type { AssembledNode, AssembledNonterminal } from '../compiler/model/node-map.ts';
import { AssembledSupertype, concreteKindsOf, isNodeRef, kindsOf, storageKindOfRef } from '../compiler/model/node-map.ts';

export type SlotClass =
	| { readonly tag: 'concrete'; readonly kind: string; readonly typeName: string }
	| { readonly tag: 'supertype'; readonly supertypeName: string }
	| { readonly tag: 'heterogeneous'; readonly useBox?: boolean };

export function classifySlot(
	kinds: readonly string[],
	supertypeMap: ReadonlyMap<string, ReadonlySet<string>> = new Map()
): SlotClass {
	if (kinds.length === 1) {
		const kind = kinds[0]!;
		return { tag: 'concrete', kind, typeName: kind };
	}
	if (kinds.length === 0) {
		return { tag: 'heterogeneous' };
	}
	const kindSet = new Set(kinds);
	let bestMatch: { supertypeName: string; size: number } | undefined;
	for (const [supertypeName, subtypes] of supertypeMap) {
		if (!coversExactly(kindSet, subtypes)) continue;
		if (bestMatch === undefined || subtypes.size < bestMatch.size) {
			bestMatch = { supertypeName, size: subtypes.size };
		}
	}
	if (bestMatch !== undefined) {
		return { tag: 'supertype', supertypeName: bestMatch.supertypeName };
	}
	return { tag: 'heterogeneous' };
}

function coversExactly(kindSet: ReadonlySet<string>, subtypes: ReadonlySet<string>): boolean {
	return kindSet.size === subtypes.size && [...kindSet].every((k) => subtypes.has(k));
}

function addVisibleAliasNameOfHiddenKind(out: Set<string>, nodeMap: NodeMap, kind: string): void {
	const aliasTarget = nodeMap.aliasedHiddenKinds?.get(kind);
	if (aliasTarget !== undefined) out.add(aliasTarget);
}

export function buildSupertypeTransportSet(nodeMap: NodeMap): Map<string, ReadonlySet<string>> {
	const result = new Map<string, ReadonlySet<string>>();
	const expandSupertypeKinds = (kind: string, seen: Set<string> = new Set()): Set<string> => {
		if (seen.has(kind)) return new Set();
		seen.add(kind);
		const members = new Set<string>([kind]);
		const node = nodeMap.nodes.get(kind);
		if (!(node instanceof AssembledSupertype)) return members;
		for (const subtype of node.subtypeNames) {
			members.add(subtype);
			for (const nested of expandSupertypeKinds(subtype, seen)) members.add(nested);
		}
		return members;
	};
	for (const [, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype)) continue;
		result.set(node.typeName, expandSupertypeKinds(node.kind));
	}
	return result;
}

function expandWrapRuntimeKinds(kind: string, nodeMap: NodeMap | undefined, seen: Set<string>): string[] {
	if (seen.has(kind)) return [];
	seen.add(kind);
	if (!nodeMap) return [kind];
	const node = nodeMap.nodes.get(kind);
	if (!node) return [kind];
	if (node instanceof AssembledSupertype) {
		const members = new Set<string>([kind]);
		for (const subtype of node.subtypeNames) {
			members.add(subtype);
			for (const member of expandWrapRuntimeKinds(subtype, nodeMap, seen)) members.add(member);
		}
		return [...members];
	}
	return [kind];
}

export function acceptedTransportKinds(
	kind: string,
	nodeMap?: NodeMap,
	parseAliases?: Readonly<Record<string, string>>
): string[] {
	if (!nodeMap) return [kind];
	const node = nodeMap.nodes.get(kind);
	if (!node) return [kind];
	const out = new Set<string>([kind]);
	addVisibleAliasNameOfHiddenKind(out, nodeMap, kind);
	if (parseAliases) {
		for (const [target, source] of Object.entries(parseAliases)) {
			if (source === kind) out.add(target);
		}
	}
	return [...out];
}

export function deriveChildrenKinds(
	child: AssembledNonterminal,
	nodeMap?: NodeMap,
	seen: Set<string> = new Set()
): string[] {
	const kinds = new Set<string>();
	for (const v of child.values) {
		if (!isNodeRef(v)) continue;
		const kind = storageKindOfRef(v.node);
		for (const expanded of expandWrapRuntimeKinds(kind, nodeMap, seen)) kinds.add(expanded);
	}
	return [...kinds];
}

export const RUST_KEYWORDS = new Set([
	'as',
	'break',
	'const',
	'continue',
	'crate',
	'else',
	'enum',
	'extern',
	'false',
	'fn',
	'for',
	'if',
	'impl',
	'in',
	'let',
	'loop',
	'match',
	'mod',
	'move',
	'mut',
	'pub',
	'ref',
	'return',
	'self',
	'Self',
	'static',
	'struct',
	'super',
	'trait',
	'true',
	'type',
	'unsafe',
	'use',
	'where',
	'while',
	'async',
	'await',
	'dyn',
	'abstract',
	'become',
	'box',
	'do',
	'final',
	'macro',
	'override',
	'priv',
	'typeof',
	'unsized',
	'virtual',
	'yield',
	'try',
	'union'
]);

export function rustTypeIdent(name: string): string {
	const replaced = name.replace(/[^A-Za-z0-9_]/g, '_');
	const withStart = /^[A-Za-z_]/.test(replaced) ? replaced : `Transport${replaced}`;
	const ident = withStart.length > 0 ? withStart : 'Transport';
	return RUST_KEYWORDS.has(ident) ? `${ident}_` : ident;
}

export function rustFieldIdent(id: string): string {
	if (RUST_KEYWORDS.has(id)) return `${id}_`;
	return id;
}

export const RESERVED_SUPERTYPE_ENUM_NAMES = new Set(['LiteralTransport']);

export function isReservedSupertypeTransportNode(node: AssembledNode): node is AssembledSupertype {
	return (
		node instanceof AssembledSupertype && RESERVED_SUPERTYPE_ENUM_NAMES.has(`${rustTypeIdent(node.typeName)}Transport`)
	);
}

export function classifySlotForEmit(kinds: readonly string[], nodeMap: NodeMap): SlotClass {
	const supertypeMap = buildSupertypeTransportSet(nodeMap);
	const cls = classifySlot(kinds, supertypeMap);
	if (cls.tag === 'concrete') {
		const node = nodeMap.nodes.get(cls.kind);
		if (node === undefined) return { tag: 'heterogeneous' };
		if (node instanceof AssembledSupertype) {
			const enumName = `${rustTypeIdent(node.typeName)}Transport`;
			if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) return { tag: 'heterogeneous' };
			return { tag: 'supertype', supertypeName: node.typeName };
		}
		return { tag: 'concrete', kind: cls.kind, typeName: node.typeName };
	}
	if (cls.tag === 'supertype') {
		const enumName = `${rustTypeIdent(cls.supertypeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) return { tag: 'heterogeneous' };
	}
	return cls;
}

let supertypeKindByTypeNameCache: WeakMap<NodeMap, Map<string, string>> = new WeakMap();
export function findSupertypeKindByTypeName(supertypeName: string, nodeMap: NodeMap): string | undefined {
	let map = supertypeKindByTypeNameCache.get(nodeMap);
	if (map === undefined) {
		map = new Map<string, string>();
		for (const [kind, node] of nodeMap.nodes) {
			if (node instanceof AssembledSupertype) {
				map.set(node.typeName, kind);
			}
		}
		supertypeKindByTypeNameCache.set(nodeMap, map);
	}
	return map.get(supertypeName);
}

export interface SupertypeTransportShape {
	readonly kinds: readonly string[];
	readonly suppressed: readonly string[];
	readonly parseNames: ReadonlyMap<string, string>;
}

export function supertypeTransportKinds(
	node: AssembledSupertype,
	nodeMap: NodeMap,
	seen: Set<string> = new Set(),
	state: { kinds: string[]; suppressed: Set<string>; parseNames: Map<string, string> } = {
		kinds: [],
		suppressed: new Set(),
		parseNames: new Map()
	}
): SupertypeTransportShape {
	if (seen.has(node.kind)) return { kinds: state.kinds, suppressed: [...state.suppressed], parseNames: state.parseNames };
	seen.add(node.kind);
	for (const [storage, parse] of Object.entries(node.subtypeParseNames ?? {})) {
		if (!state.parseNames.has(storage)) state.parseNames.set(storage, parse);
	}
	for (const subKind of node.subtypeNames) {
		const subNode = nodeMap.nodes.get(subKind);
		if (subNode === undefined) continue;
		if (isReservedSupertypeTransportNode(subNode)) {
			state.suppressed.add(subKind);
			supertypeTransportKinds(subNode, nodeMap, seen, state);
			continue;
		}
		if (!state.kinds.includes(subKind)) state.kinds.push(subKind);
	}
	return { kinds: state.kinds, suppressed: [...state.suppressed], parseNames: state.parseNames };
}

export function slotElementKinds(slot: AssembledNonterminal, nodeMap: NodeMap): string[] {
	const kinds = kindsOf(slot);
	const cls = classifySlotForEmit(kinds, nodeMap);
	if (cls.tag === 'supertype') {
		const kind = findSupertypeKindByTypeName(cls.supertypeName, nodeMap);
		const node = kind === undefined ? undefined : nodeMap.nodes.get(kind);
		return node instanceof AssembledSupertype ? [...supertypeTransportKinds(node, nodeMap).kinds] : [];
	}
	if (cls.tag === 'concrete') return [cls.kind];
	if (cls.tag !== 'heterogeneous') return [];
	const out: string[] = [];
	for (const kind of kinds) for (const concrete of concreteKindsOf(kind, nodeMap)) {
		if (!out.includes(concrete)) out.push(concrete);
	}
	return out;
}
