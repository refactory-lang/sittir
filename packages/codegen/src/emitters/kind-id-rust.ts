import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import { collectKindEntries, collectCatalogKinds } from './kind-discriminant.ts';
import { toScreamingSnakeCase } from '../compiler/model/casing.ts';
import { ERROR_KIND_ID, ERROR_KIND_NAME } from '@sittir/common/error-kind';

export interface EmitKindIdRustConfig {
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables: GeneratedIdTables;
}

export function kindConstName(entry: { readonly member: string; readonly kind: string }): string {
	return toScreamingSnakeCase(entry.member, entry.kind);
}

export interface KindConstant {
	readonly name: string;
	readonly id: number;
}

export function kindConstants(
	entries: readonly { readonly member: string; readonly kind: string; readonly id: number; readonly parseId?: number; readonly parseName?: string }[]
): readonly KindConstant[] {
	const constants: KindConstant[] = entries.map((entry) => ({ name: kindConstName(entry), id: entry.id }));
	const names = new Set(constants.map((constant) => constant.name));
	const ids = new Set(constants.map((constant) => constant.id));
	for (const entry of entries) {
		if (entry.parseId === undefined || entry.parseName === undefined || ids.has(entry.parseId)) continue;
		const name = toScreamingSnakeCase(entry.parseName, entry.parseName);
		if (names.has(name)) {
			throw new Error(`kind_ids.rs: the alias '${entry.parseName}' (kind ${entry.parseId}) would take the constant ${name}, which another kind already has`);
		}
		names.add(name);
		ids.add(entry.parseId);
		constants.push({ name, id: entry.parseId });
	}
	return constants;
}

export function emitKindIdRust(config: EmitKindIdRustConfig): string {
	const { grammar, nodeMap, generatedIdTables } = config;
	const entries = collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);

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
		``
	];

	for (const { name, id } of kindConstants(entries)) lines.push(`pub const ${name}: KindId = KindId(${id});`);
	const errorEntry = entries.find((entry) => entry.id === ERROR_KIND_ID);
	if (errorEntry === undefined) throw new Error(`kind_ids.rs: ${grammar} has no ${ERROR_KIND_NAME} kind entry`);
	lines.push(`const _: () = assert!(${kindConstName(errorEntry)}.0 == KindId::ERROR.0);`);

	lines.push('');
	lines.push(`/// Map a \`KindId\` back to its grammar kind string for diagnostics.`);
	lines.push(`/// Returns \`"<unknown>"\` for ids not in this grammar's symbol table.`);
	lines.push(`pub fn kind_name_from_id(id: KindId) -> &'static str {`);
	lines.push(`    match id.0 {`);
	for (const entry of entries) {
		const displayStr = entry.symbolName ?? entry.kind;
		lines.push(`        ${entry.id} => ${JSON.stringify(displayStr)}, // ${JSON.stringify(entry.kind)}`);
		if (entry.parseId !== undefined && entry.parseId !== entry.id && entry.parseName !== undefined) {
			lines.push(`        ${entry.parseId} => ${JSON.stringify(entry.parseName)}, // ${JSON.stringify(entry.kind)}`);
		}
	}
	lines.push(`        _ => "<unknown>",`);
	lines.push(`    }`);
	lines.push(`}`);

	lines.push('');

	return lines.join('\n');
}
