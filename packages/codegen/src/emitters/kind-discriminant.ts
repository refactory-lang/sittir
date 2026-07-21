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
import { findEntryForKindName, findEntryForLiteralText } from '../compiler/generated-metadata.ts';

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
	/**
	 * Symbol name from `ts_symbol_names[]`, when distinct from `kind`.
	 * Anonymous tokens (`anon_sym_PLUS`) carry the literal text (`"+"`)
	 * here while `kind` is the parser symbol name (`"PLUS"`). Used to
	 * emit additional `kindIdFromName` switch arms so JS callers passing
	 * the literal text can also resolve to the correct id.
	 */
	readonly symbolName?: string;
	/** True when this entry came from an `anon_sym_*` parser symbol. */
	readonly anon?: boolean;
}

/**
 * Map a kind name to its `TSKindId.X` member name. Prefers the
 * AssembledNode's `typeName` when available (so `_function_item`
 * becomes `FunctionItem`), falls back to PascalCase of the raw kind.
 *
 * For catalog kinds NOT in `nodeMap.nodes` (children-only named kinds
 * like `empty_statement`, anonymous tokens like `PLUS`), the PascalCase
 * fallback applied to the catalog `parserName` produces a valid TS
 * identifier — `EmptyStatement`, `PLUS` (already-uppercase
 * passes-through). This is exactly what we want.
 */
export function kindIdMemberName(nodeMap: NodeMap, kind: string): string {
	const typeName = nodeMap.nodes.get(kind)?.typeName;
	if (typeName) return typeName;
	// toPascal strips leading underscores (`_literal` → `Literal`). For
	// hidden kinds this creates member-name collisions with visible kinds
	// that have the same base name (`literal` → `Literal`). Preserve the
	// leading underscore so hidden kinds get a distinct member:
	// `_literal` → `_Literal`, `_primitive_type` → `_PrimitiveType`.
	const prefix = kind.match(/^_+/)?.[0] ?? '';
	return `${prefix}${toPascal(kind)}`;
}

/**
 * Return the canonical superset of parser-symbol-bearing kinds —
 * iterates `generatedIdTables.kindIds` directly so the catalog includes
 * (a) named kinds in `nodeMap.nodes`, (b) named kinds that appear only
 * as transport children (`empty_statement`, `never_type`), and (c)
 * anonymous tokens (`PLUS`, `EQ_EQ`, ...). This is the DRY source for
 * `TSKindId` / `kindIdFromName` / `kind_ids.rs` / `AnyTransport`
 * dispatch — they MUST share the same kind universe.
 */
export function collectCatalogKinds(generatedIdTables: GeneratedIdTables): readonly string[] {
	return [...toIdMap(generatedIdTables.kindIds).keys()];
}

/**
 * Collect catalog entries that should appear in `TSKindId`. Skips
 * kinds whose parser symbol is absent (`TSGrammar`-only-without-
 * `TSInternals` per the design).
 *
 * Pass `collectCatalogKinds(generatedIdTables)` for the runtime-
 * dispatch surfaces (TSKindId, kindIdFromName, AnyTransport,
 * kind_ids.rs); pass `collectAllKinds(nodeMap)` only for emitter
 * surfaces that intentionally restrict to user-facing rule names
 * (`is.kind()` guards — see `is.ts`).
 */
export function collectKindEntries(
	allKinds: readonly string[],
	nodeMap: NodeMap,
	generatedIdTables: GeneratedIdTables
): KindEnumEntry[] {
	const fullCatalog = toCatalogMap(generatedIdTables.kindIds);
	const entries: KindEnumEntry[] = [];
	const seenMembers = new Map<string, string>(); // member → first kind that claimed it
	for (const kind of allKinds) {
		const row = fullCatalog.get(kind);
		if (row === undefined || row.id === undefined) continue;
		let member = kindIdMemberName(nodeMap, kind);
		// Disambiguate member-name collisions. Two different catalog keys
		// can produce the same PascalCase member (e.g. `_literal` typeName
		// `Literal` and anon token `literal` → `Literal`). Append the
		// numeric id to the second occurrence so the enum compiles.
		const existing = seenMembers.get(member);
		if (existing !== undefined && existing !== kind) {
			member = `${member}_${row.id}`;
		}
		seenMembers.set(member, kind);
		const symbolName =
			row.parser?.symbolName !== undefined && row.parser.symbolName !== kind ? row.parser.symbolName : undefined;
		const anon = row.parser?.anon ?? false;
		entries.push({ kind, member, id: row.id, symbolName, anon: anon || undefined });
	}
	entries.sort((a, b) => a.id - b.id || a.kind.localeCompare(b.kind));
	return entries;
}

/**
 * Find the catalog entry for a given kind name, matching on either
 * `entry.kind` (the catalog key, e.g. `_expression_statement_tuple`) or
 * `entry.symbolName` (the symbol name, e.g. `expression_statement_tuple`).
 *
 * Some grammar kinds appear in node-types.json under their symbol name
 * (no leading underscore) while the parser.c symbol has a hidden prefix
 * (`sym__expression_statement_tuple` → catalog key `_expression_statement_tuple`,
 * symbol name `expression_statement_tuple`). Anonymous tokens are similar:
 * catalog key `rparen`, symbol name `)`. Both spellings must resolve to the
 * same catalog entry so emission-point guards can match the nodeMap kind name.
 *
 * @param kindEntries - The catalog entries from `collectKindEntries`.
 * @param kind - The nodeMap kind name to look up.
 * @returns The matching entry, or `undefined` if the kind has no parser symbol.
 */
export function findKindEntry(kindEntries: readonly KindEnumEntry[], kind: string): KindEnumEntry | undefined {
	// Delegates to THE shared kind-name chain (PR-K1 — see KindEntryLike in
	// compiler/generated-metadata.ts for the full step documentation,
	// including why step 3 is anon-scoped: the `_as_pattern` shadowing bug).
	// Behavior delta vs this module's historical inline chain: a step 4
	// (named-symbolName fallback for hidden compound tokens like `_is_not` ←
	// `"is not"`) is now present, reachable only when steps 1-3 all miss —
	// previously such lookups returned undefined here while the
	// compiler-side chain resolved them.
	return findEntryForKindName(kindEntries, kind);
}

/**
 * Resolve a LITERAL TOKEN TEXT (a `STRING` rule's value — e.g. `'type'`,
 * `'+'`) to its catalog entry. The anon-scoped symbolName match runs FIRST:
 * the caller holds a literal, so the anonymous token (`anon_sym_*`,
 * tree-sitter `named: false`) is the correct identity even when a NAMED
 * rule shares the same spelling (#129: python's `'type'` keyword literal
 * was resolved through {@link findKindEntry}, whose exact-catalog-key step
 * matched the `type` RULE first — the factory then stamped the rule's kind
 * id where the transport expects the anon token's, failing every
 * `ir.typeAliasStatement` render with "Missing field `_content`").
 *
 * Falls back to {@link findKindEntry} for literals with no anonymous twin —
 * tree-sitter compiles some keyword literals to named terminal symbols
 * (rust's `'crate'`/`'self'`), and those stamps were already correct via
 * the named match.
 *
 * Deliberately a SEPARATE function: the anon-first ordering is only sound
 * when the caller is known to hold literal text. Reordering
 * {@link findKindEntry} itself would reintroduce the `_as_pattern`
 * shadowing bug its step-3 comment records.
 */
export function findKindEntryForLiteral(
	kindEntries: readonly KindEnumEntry[],
	literalText: string
): KindEnumEntry | undefined {
	// Delegates to THE shared literal-text chain (PR-K1).
	return findEntryForLiteralText(kindEntries, literalText);
}

/**
 * Return true when a kind has a parser symbol in the catalog — matches on
 * the catalog key (`entry.kind`) only, NOT on `entry.symbolName`.
 *
 * Using `entry.kind` only prevents phantom kinds (TSGrammar-only inlined
 * rules) from being treated as real kinds via a coincidental symbolName
 * match. Transport alternative lists must only include kinds that have a
 * parser symbol so `kindIdFromName` is always safe to call at runtime.
 *
 * @param kindEntries - The catalog entries from `collectKindEntries`.
 * @param kind - The nodeMap kind name to check.
 */
export function hasCatalogEntry(kindEntries: readonly KindEnumEntry[] | undefined, kind: string): boolean {
	if (!kindEntries) return false;
	return findKindEntry(kindEntries, kind) !== undefined;
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
 * Matches the kind against both the catalog key and the symbol name
 * (via `findKindEntry`) so nodeMap kinds that use the symbol spelling
 * (e.g. `expression_statement_tuple`) resolve to the same entry as
 * the catalog key (`_expression_statement_tuple`).
 *
 * Used by `types.ts` for interface `$type` declarations and by
 * `factories.ts` for factory body `$type` values, so both surfaces
 * resolve to the same expression.
 */
export function kindDiscriminantExpr(kind: string, nodeMap: NodeMap, kindEntries?: readonly KindEnumEntry[]): string {
	if (!kindEntries) {
		throw new Error(
			`kindDiscriminantExpr: kindEntries is required (KindID runtime migration, 2026-04-30). ` +
				`Pass loadGeneratedIdTables(...) into the emitter so TSKindId can be emitted from real metadata.`
		);
	}
	const entry = findKindEntry(kindEntries, kind);
	if (!entry) {
		throw new Error(
			`kindDiscriminantExpr: kind '${kind}' has no parser symbol (TSGrammar-only). ` +
				`Tree-sitter inlined this rule during parser compilation; it can never carry a runtime $type. ` +
				`Either remove the codegen surface that references it, or add a synthetic parser-symbol entry to the catalog.`
		);
	}
	return `TSKindId.${entry.member}`;
}

/**
 * {@link kindDiscriminantExpr} for call sites holding a LITERAL TOKEN TEXT
 * (a `STRING` rule's value) rather than a kind/rule name — resolves via
 * {@link findKindEntryForLiteral} so the anonymous token wins over a
 * same-spelled named rule (#129). The grammar's own rule-type
 * discrimination (STRING vs SYMBOL) decides which of the two functions a
 * call site uses; this must never be called with a rule name.
 */
/**
 * {@link kindDiscriminantExpr} for call sites holding a mint-time PARSER ID
 * stamp (`NodeRef.resolvedKindId`, PR-K3a). The id is the collision-free
 * identity — a link-minted `resolvedKind` NAME can collide with a rule name
 * (`'type'` the keyword vs `type` the rule), but the stamped id cannot
 * (0 intra-catalog id collisions, all grammars). Returns undefined when the
 * id has no catalog row (emitter catalog narrower than the mint's).
 */
export function kindDiscriminantExprForId(id: number, kindEntries: readonly KindEnumEntry[]): string | undefined {
	const entry = kindEntries.find((e) => e.id === id);
	return entry === undefined ? undefined : `TSKindId.${entry.member}`;
}

export function kindDiscriminantExprForLiteral(
	literalText: string,
	kindEntries: readonly KindEnumEntry[]
): string {
	const entry = findKindEntryForLiteral(kindEntries, literalText);
	if (!entry) {
		throw new Error(
			`kindDiscriminantExprForLiteral: literal '${literalText}' has no parser symbol (TSGrammar-only). ` +
				`See kindDiscriminantExpr for the loud-error rationale.`
		);
	}
	return `TSKindId.${entry.member}`;
}

/**
 * Subset of `toCatalogMap` — drops TSGrammar-only entries (those whose
 * `id` is undefined). Substituting a `-1` sentinel would let them
 * survive the `id === undefined` filter in `collectKindEntries` and
 * emit `_kindIdByKind` / `TSKindId.X` entries that match nothing at
 * runtime (silent never-match). Filter them here so the catalog only
 * contains real parser-symbol ids.
 */
function toIdMap(ids: GeneratedIdTables['kindIds']): Map<string, number> {
	const result = new Map<string, number>();
	for (const [name, row] of toCatalogMap(ids)) {
		if (row.id !== undefined) result.set(name, row.id);
	}
	return result;
}

interface CatalogRow {
	readonly id?: number;
	readonly parser?: {
		readonly cSymbol: string;
		readonly parserName: string;
		readonly symbolName?: string;
		readonly anon: boolean;
		readonly aux: boolean;
		readonly alias: boolean;
		readonly hidden: boolean;
	};
}

function toCatalogMap(ids: GeneratedIdTables['kindIds']): Map<string, CatalogRow> {
	if (!ids) return new Map();
	const entries = ids instanceof Map ? [...ids.entries()] : Object.entries(ids);
	const result = new Map<string, CatalogRow>();
	for (const [name, value] of entries) {
		if (typeof value === 'number') {
			result.set(name, { id: value });
		} else {
			result.set(name, value);
		}
	}
	return result;
}
