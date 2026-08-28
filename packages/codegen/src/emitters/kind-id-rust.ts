import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import { collectKindEntries, collectCatalogKinds } from './kind-discriminant.ts';

export interface EmitKindIdRustConfig {
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables: GeneratedIdTables;
}

export function toScreamingSnakeCase(memberName: string, rawKind: string): string {
	const prefix = rawKind.match(/^_+/)?.[0] ?? '';
	const cleaned = memberName.replace(/^_+/, '');

	if (!/[a-z]/.test(cleaned)) {
		return `${prefix}${cleaned}`;
	}

	const snake = cleaned
		.replace(/([A-Z])/g, '_$1')
		.replace(/^_/, '')
		.toUpperCase();

	return `${prefix}${snake}`;
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

	for (const entry of entries) {
		const constName = toScreamingSnakeCase(entry.member, entry.kind);
		lines.push(`pub const ${constName}: KindId = KindId(${entry.id});`);
	}

	lines.push('');
	lines.push(`/// Map a \`KindId\` back to its grammar kind string for diagnostics.`);
	lines.push(`/// Returns \`"<unknown>"\` for ids not in this grammar's symbol table.`);
	lines.push(`pub fn kind_name_from_id(id: KindId) -> &'static str {`);
	lines.push(`    match id.0 {`);
	for (const entry of entries) {
		const displayStr = entry.symbolName ?? entry.kind;
		lines.push(`        ${entry.id} => ${JSON.stringify(displayStr)}, // ${JSON.stringify(entry.kind)}`);
	}
	lines.push(`        _ => "<unknown>",`);
	lines.push(`    }`);
	lines.push(`}`);

	lines.push('');

	return lines.join('\n');
}
