/**
 * Per-grammar Rust `KindId` constants emitter (Phase B prep, 2026-04-30).
 *
 * Outputs a single `kind_ids.rs` source that exports one `pub const`
 * per kind in `kindEntries`, matching the TS-side `TSKindId` enum values.
 *
 * Keys use SCREAMING_SNAKE_CASE derived from the PascalCase `typeName`
 * that `kindIdMemberName` returns. Leading underscores are preserved for
 * hidden-kind sources (e.g. `_FieldIdentifier` → `_FIELD_IDENTIFIER`).
 *
 * This emitter is intentionally **not wired into `generate.ts`** yet —
 * Phase A is still landing. Export-only; the CLI will wire it after Phase A
 * merges to avoid concurrent-edit conflicts on `generate.ts`.
 *
 * Reuses `collectKindEntries` + `kindIdMemberName` from `kind-discriminant.ts`.
 * No logic is duplicated — those two helpers are the single source of truth
 * for the kind-to-member mapping.
 */

import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import {
	collectKindEntries,
	collectCatalogKinds,
	kindIdMemberName
} from './kind-discriminant.ts';

export interface EmitKindIdRustConfig {
	/** Grammar name, e.g. `'rust'` | `'typescript'` | `'python'`. */
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables: GeneratedIdTables;
}

/**
 * Convert a PascalCase `typeName` (as returned by `kindIdMemberName`) into
 * SCREAMING_SNAKE_CASE, preserving any leading underscore that marks the
 * kind as a hidden alias source.
 *
 * @param memberName - PascalCase member name, e.g. `'CallExpression'` or
 *   `'FieldIdentifier'` (already had its leading underscore stripped by
 *   `kindIdMemberName`; hidden kinds arrive here as `'FieldIdentifier'`).
 * @param rawKind - The original grammar kind string, used to detect whether
 *   a leading underscore must be re-attached (hidden kinds start with `_`).
 * @returns SCREAMING_SNAKE_CASE constant name, e.g. `'CALL_EXPRESSION'` or
 *   `'_FIELD_IDENTIFIER'`.
 */
export function toScreamingSnakeCase(memberName: string, rawKind: string): string {
	// Re-attach leading underscore when the original grammar kind is hidden
	// (`_field_identifier` → member `FieldIdentifier` → const `_FIELD_IDENTIFIER`).
	const prefix = rawKind.startsWith('_') ? '_' : '';

	// Defense for all-uppercase input (e.g. `LPAREN`, `PLUS`): a memberName
	// with no lowercase letters has no word boundaries to split on. Treat it
	// as a single token and pass it through. The regex split below assumes
	// PascalCase (`CallExpression` → `Call_Expression`); applying it to
	// `LPAREN` would produce `L_P_A_R_E_N`. The catalog now lowercases
	// `anon_sym_*` names upstream so this branch should rarely trigger;
	// kept defensively so any other source of uppercase memberName (future
	// emitters, edge cases) doesn't silently break.
	if (!/[a-z]/.test(memberName)) {
		return `${prefix}${memberName}`;
	}

	// Insert an underscore before each interior uppercase letter, then
	// upper-case the whole string.
	const snake = memberName
		.replace(/([A-Z])/g, '_$1')
		.replace(/^_/, '') // remove leading underscore added by replace
		.toUpperCase();

	return `${prefix}${snake}`;
}

/**
 * Emit the Rust source for `kind_ids.rs` — one `pub const` per kind that
 * has a parser symbol (TSRuntime presence), sorted by numeric id, plus a
 * `kind_name_from_id(KindId) -> &'static str` diagnostic helper.
 *
 * @returns The complete Rust source as a single string, ready to write to
 *   `rust/crates/sittir-{grammar}/src/render/kind_ids.rs` (or equivalent).
 */
export function emitKindIdRust(config: EmitKindIdRustConfig): string {
	const { grammar, nodeMap, generatedIdTables } = config;
	// Source from the catalog superset so `kind_ids.rs` constants match
	// the AnyTransport::FromNapiValue dispatch (which sources from the
	// same superset). Coverage gap fix (Phase B).
	const entries = collectKindEntries(
		collectCatalogKinds(generatedIdTables),
		nodeMap,
		generatedIdTables
	);

	const lines: string[] = [
		`// @generated from packages/${grammar}/.sittir/src/parser.c — do not hand-edit.`,
		`// Per-kind numeric ID constants matching the TS-side \`TSKindId\` enum.`,
		`//`,
		`// IDs come from \`enum ts_symbol_identifiers\` in parser.c (KindID`,
		`// runtime migration design, 2026-04-30). Use these constants when`,
		`// matching on \`KindId\` values; the inner u16 is the parser.c-derived`,
		`// symbol id.`,
		``,
		`use ::sittir_core::types::KindId;`,
		``,
	];

	for (const entry of entries) {
		const constName = toScreamingSnakeCase(entry.member, entry.kind);
		lines.push(`pub const ${constName}: KindId = KindId(${entry.id});`);
	}

	// Emit kind_name_from_id diagnostic helper — maps a KindId back to its
	// grammar kind string. Sourced from the same `entries` list as the constants
	// above (DRY: one source, one derivation). Used for error messages in
	// render_dispatch where NodeData.type_: KindId shows a numeric id.
	lines.push('');
	lines.push(`/// Map a \`KindId\` back to its grammar kind string for diagnostics.`);
	lines.push(`/// Returns \`"<unknown>"\` for ids not in this grammar's symbol table.`);
	lines.push(`pub fn kind_name_from_id(id: KindId) -> &'static str {`);
	lines.push(`    match id.0 {`);
	for (const entry of entries) {
		// For anonymous tokens use displayName when available (shows literal text),
		// otherwise fall back to the canonical kind string.
		const displayStr = entry.displayName ?? entry.kind;
		lines.push(`        ${entry.id} => ${JSON.stringify(displayStr)}, // ${JSON.stringify(entry.kind)}`);
	}
	lines.push(`        _ => "<unknown>",`);
	lines.push(`    }`);
	lines.push(`}`);

	// Trailing newline — Rust convention.
	lines.push('');

	return lines.join('\n');
}
