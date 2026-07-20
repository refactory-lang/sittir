import type { NodeMap } from '../compiler/types.ts';
import type {
	AssembledNonterminal,
	AssembledNode,
	AssembledSupertype,
	UnresolvedRef
} from '../compiler/model/node-map.ts';
import { isNodeRef, isUnresolvedRef } from '../compiler/model/node-map.ts';

/**
 * Classification of a transport slot by its type width.
 *
 * - `concrete`      — exactly one known kind; emit `<Kind>Transport` directly.
 *                     `typeName` is the assembled node's typeName (PascalCase,
 *                     leading-underscore-stripped) used to derive the Rust
 *                     struct name and render fn name. Falls back to the kind
 *                     string when nodeMap is unavailable (test / exported path).
 * - `supertype`     — kind set is a subset of a known assembled supertype's
 *                     resolved subtypes; emit `<Supertype>Transport` enum.
 *                     `supertypeName` is the supertype's `typeName` (PascalCase).
 * - `heterogeneous` — no grammar-bound type (theoretically unreachable in
 *                     sittir's pipeline; retained as a compile-safety escape).
 */
export type SlotClass =
	| { readonly tag: 'concrete'; readonly kind: string; readonly typeName: string }
	| { readonly tag: 'supertype'; readonly supertypeName: string }
	| { readonly tag: 'heterogeneous'; readonly useBox?: boolean };

/**
 * Classify a slot's kind set against the supertype registry.
 *
 * Single source of derivation for slot class — all emitters (field type,
 * children type, render call, list buffer) MUST call this. DRY constraint.
 *
 * Tiebreak when multiple supertypes cover the kinds: the narrower supertype
 * (smallest `subtypes.size`) wins. If tied, Map insertion order (grammar order)
 * is the tiebreak — deterministic across runs.
 *
 * @param kinds - the kind set for this slot (projection.kinds for fields;
 *   deriveChildrenKinds result for children)
 * @param supertypeMap - result of `buildSupertypeTransportSet(nodeMap)`; when
 *   absent (test path / no nodeMap) multi-kind slots fall back to `heterogeneous`.
 */
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
		// Exact-set match: the slot's kind set must EQUAL the supertype's full
		// resolved subtype set, not merely be a subset. A proper subset would
		// collapse the slot onto a wider supertype transport than it actually
		// ranges over — and when that supertype is large and self-recursive
		// (e.g. match_arm's `{attribute_item, inner_attribute_item}` is a
		// 2-of-21 subset of `declaration_statement`, which transitively
		// references match_arm again) the generated `FromNapiValue` recurses
		// through the whole statement graph and overflows the native stack.
		// Subset slots instead fall through to `heterogeneous`, which emits a
		// per-slot enum of exactly their kinds.
		if (kindSet.size === subtypes.size && [...kindSet].every((k) => subtypes.has(k))) {
			if (bestMatch === undefined || subtypes.size < bestMatch.size) {
				bestMatch = { supertypeName, size: subtypes.size };
			}
		}
	}
	if (bestMatch !== undefined) {
		return { tag: 'supertype', supertypeName: bestMatch.supertypeName };
	}
	return { tag: 'heterogeneous' };
}

/**
 * Build a registry of supertype typeName → resolved concrete subtype set
 * from the assembled node map.
 *
 * @param nodeMap - the assembled node map for the grammar
 */
export function buildSupertypeTransportSet(nodeMap: NodeMap): Map<string, ReadonlySet<string>> {
	const result = new Map<string, ReadonlySet<string>>();
	const expandSupertypeKinds = (kind: string, seen: Set<string> = new Set()): Set<string> => {
		if (seen.has(kind)) return new Set();
		seen.add(kind);
		const members = new Set<string>([kind]);
		const node = nodeMap.nodes.get(kind);
		if (!node || node.modelType !== 'supertype') return members;
		for (const subtype of (node as AssembledSupertype).subtypes) {
			members.add(subtype);
			for (const nested of expandSupertypeKinds(subtype, seen)) members.add(nested);
		}
		return members;
	};
	for (const [, node] of nodeMap.nodes) {
		if (node.modelType !== 'supertype') continue;
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
	if (node.modelType === 'supertype') {
		const members = new Set<string>([kind]);
		for (const subtype of (node as AssembledSupertype).subtypes) {
			members.add(subtype);
			for (const member of expandWrapRuntimeKinds(subtype, nodeMap, seen)) members.add(member);
		}
		return [...members];
	}
	return [kind];
}

/**
 * @param parseAliases - Optional per-slot `parseKind -> storageKind` pairs
 *   (see `aliasTargetToSourceMapOf`, node-map.ts) for the specific slot
 *   `kind` was drawn from. Covers the VISIBLE-to-visible alias case a
 *   reference site canonicalizes to its storage/source kind (e.g.
 *   `alias($.identifier, $.type_identifier)` used inline at a CHOICE
 *   member — the value's `node` resolves to `identifier`, but its
 *   `parseKind` — the wire `$type` tree-sitter actually stamps — is
 *   `type_identifier`). This is the SAME kind of "runtime id diverges
 *   from the modeled storage kind" fact `aliasedHiddenKinds` covers for
 *   HIDDEN alias-source rules, just carried per-value (on `NodeOrTerminal.
 *   parseKind`) instead of globally keyed by hidden rule name — a
 *   visible-to-visible alias reference site has no hidden rule name to key
 *   `aliasedHiddenKinds` by, so it can only be recovered from the slot
 *   that actually saw the alias. Any entry whose source equals `kind` adds
 *   its target id too.
 */
export function acceptedTransportKinds(
	kind: string,
	nodeMap?: NodeMap,
	parseAliases?: Readonly<Record<string, string>>
): string[] {
	if (!nodeMap) return [kind];
	const node = nodeMap.nodes.get(kind);
	if (!node) return [kind];
	const out = new Set<string>([kind]);
	// A hidden kind that's also the CONTENT of a named alias
	// (`alias(symbol(_X), $.visible)`) shares its runtime kind id with
	// that alias's visible name — the generated id catalog (KIND_NAMES,
	// see emitters/types.ts) records the id under the visible name, not
	// the raw hidden kind key. Without this, `kindIdByKind.get(kind)`
	// (the hidden key) misses entirely and the id arm silently drops —
	// see native-transport-emit.test.ts's "accepts visible alias kind
	// ids for hidden-wrapper child enums".
	const aliasTarget = nodeMap.aliasedHiddenKinds?.get(kind);
	if (aliasTarget !== undefined) out.add(aliasTarget);
	if (parseAliases) {
		for (const [target, source] of Object.entries(parseAliases)) {
			if (source === kind) out.add(target);
		}
	}
	return [...out];
}

/**
 * Extract the kind set from an `AssembledNonterminal.values` array.
 * Parallel to `AssembledNonterminal.projection.kinds` for field slots.
 * Terminal values (inline string literals) are skipped — they do not
 * contribute to the transport type.
 *
 * Unresolved refs are included using their `name` (the grammar kind string,
 * e.g. `_expression`) — mirroring how `AssembledNonterminal.projection.kinds`
 * is built in `deriveSlotsRaw`.
 *
 * @param child - any AssembledNonterminal (field or children slot)
 * @returns deduplicated list of resolved kind names
 */
export function deriveChildrenKinds(
	child: AssembledNonterminal,
	nodeMap?: NodeMap,
	seen: Set<string> = new Set()
): string[] {
	const kinds = new Set<string>();
	for (const v of child.values) {
		if (!isNodeRef(v)) continue;
		const kind = isUnresolvedRef(v.node) ? (v.node as UnresolvedRef).name : (v.node as AssembledNode).kind;
		for (const expanded of expandWrapRuntimeKinds(kind, nodeMap, seen)) kinds.add(expanded);
	}
	return [...kinds];
}
