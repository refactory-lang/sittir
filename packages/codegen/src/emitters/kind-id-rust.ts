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
import { collectKindEntries, kindIdMemberName } from './kind-discriminant.ts';

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
 * has a parser symbol (TSRuntime presence), sorted by numeric id.
 *
 * @returns The complete Rust source as a single string, ready to write to
 *   `rust/crates/sittir-{grammar}/src/render/kind_ids.rs` (or equivalent).
 */
export function emitKindIdRust(config: EmitKindIdRustConfig): string {
	const { grammar, nodeMap, generatedIdTables } = config;
	const allKinds = [...nodeMap.nodes.keys()];
	const entries = collectKindEntries(allKinds, nodeMap, generatedIdTables);

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

	// Trailing newline — Rust convention.
	lines.push('');

	return lines.join('\n');
}
