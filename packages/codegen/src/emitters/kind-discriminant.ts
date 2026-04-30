/**
 * Shared helpers for emitting `$type` discriminants per the KindID
 * runtime migration design (2026-04-30): runtime objects carry numeric
 * `TSKindId.X` discriminants where `X` is the parser.c-derived ID.
 *
 * Kinds without a parser symbol (TSGrammar-only inlined rules) fall
 * back to string-literal discriminants — they never carry a runtime
 * `$type` on a parsed tree, but emitter sites that reference them
 * still need *some* expression.
 *
 * Used by both `types.ts` (interface declarations) and `factories.ts`
 * (factory body literals) so both surfaces agree on the same
 * discriminant expression for each kind.
 */

import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';

function toPascal(kind: string): string {
	return kind
		.replace(/^_/, '')
		.split('_')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join('');
}

export interface KindEnumEntry {
	readonly kind: string;
	readonly member: string;
	readonly id: number;
}

/**
 * Map a kind name to its `TSKindId.X` member name. Prefers the
 * AssembledNode's `typeName` when available (so `_function_item`
 * becomes `FunctionItem`), falls back to PascalCase of the raw kind.
 */
export function kindIdMemberName(nodeMap: NodeMap, kind: string): string {
	return nodeMap.nodes.get(kind)?.typeName ?? toPascal(kind);
}

/**
 * Collect catalog entries that should appear in `TSKindId`. Skips
 * kinds whose parser symbol is absent (`TSGrammar`-only-without-
 * `TSRuntime` per the design).
 */
export function collectKindEntries(
	allKinds: readonly string[],
	nodeMap: NodeMap,
	generatedIdTables: GeneratedIdTables
): KindEnumEntry[] {
	const kindIds = toIdMap(generatedIdTables.kindIds);
	const entries: KindEnumEntry[] = [];
	const seenMembers = new Set<string>();
	for (const kind of allKinds) {
		const id = kindIds.get(kind);
		if (id === undefined) continue;
		const member = kindIdMemberName(nodeMap, kind);
		if (seenMembers.has(member)) continue;
		seenMembers.add(member);
		entries.push({ kind, member, id });
	}
	entries.sort((a, b) => a.id - b.id || a.kind.localeCompare(b.kind));
	return entries;
}

/**
 * Render the runtime discriminant expression for a given kind: always
 * `TSKindId.<Member>`. Throws at codegen time when the kind has no
 * parser symbol — kinds without runtime presence (TSGrammar-only,
 * tree-sitter-inlined) must not reach a TSKindId reference. Per the
 * user's direction (2026-04-30): if there is a TSKindId, it should
 * always resolve; the inverse is a loud error, not a silent string
 * fallback.
 *
 * Used by `types.ts` for interface `$type` declarations and by
 * `factories.ts` for factory body `$type` values, so both surfaces
 * resolve to the same expression.
 */
export function kindDiscriminantExpr(
	kind: string,
	nodeMap: NodeMap,
	kindEntries?: readonly KindEnumEntry[]
): string {
	if (!kindEntries) {
		throw new Error(
			`kindDiscriminantExpr: kindEntries is required (KindID runtime migration, 2026-04-30). ` +
				`Pass loadGeneratedIdTables(...) into the emitter so TSKindId can be emitted from real metadata.`
		);
	}
	const hasEntry = kindEntries.some((e) => e.kind === kind);
	if (!hasEntry) {
		throw new Error(
			`kindDiscriminantExpr: kind '${kind}' has no parser symbol (TSGrammar-only). ` +
				`Tree-sitter inlined this rule during parser compilation; it can never carry a runtime $type. ` +
				`Either remove the codegen surface that references it, or add a synthetic parser-symbol entry to the catalog.`
		);
	}
	return `TSKindId.${kindIdMemberName(nodeMap, kind)}`;
}

function toIdMap(
	ids: GeneratedIdTables['kindIds']
): Map<string, number> {
	if (!ids) return new Map();
	const entries = ids instanceof Map ? [...ids.entries()] : Object.entries(ids);
	return new Map(
		entries.map(([k, v]) => [k, typeof v === 'number' ? v : v.id ?? -1] as const)
	);
}
