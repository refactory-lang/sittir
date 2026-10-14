import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import { collectKindEntries, collectCatalogKinds, findKindEntryForLiteral, type KindEnumEntry } from './kind-discriminant.ts';
import { toScreamingSnakeCase } from '../compiler/model/casing.ts';
import { ERROR_KIND_ID, ERROR_KIND_NAME } from '@sittir/common/error-kind';
import { findEntryForKindName } from '../dsl/symbol-table.ts';
import { depthMembersOf } from '../compiler/model/layout-kinds.ts';
import { layoutMemberKindIds, listKindIds, rootKindIds, unitKindIds } from './wrap.ts';

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

export function relaxedKeywordIds(nodeMap: NodeMap, entries: readonly KindEnumEntry[]): number[] {
	return (nodeMap.relaxedLiterals ?? []).flatMap((literal) => {
		const entry = findKindEntryForLiteral(entries, literal);
		return entry === undefined ? [] : [entry.id];
	});
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
	lines.push(`/// The surface kinds: list kinds, whose items the surface exposes in their place, unit kinds, which it exposes as a kind id, the extras that are layout members, which it assigns as layout, and the depth members a layout run's excess indentation reads as.`);
	lines.push(`pub const SURFACE_KINDS: ::sittir_core::trivia_table::SurfaceKinds = ::sittir_core::trivia_table::SurfaceKinds {`);
	lines.push(`    lists: &[${listKindIds(nodeMap).join(', ')}],`);
	lines.push(`    units: &[${unitKindIds(nodeMap).join(', ')}],`);
	lines.push(`    layout: &[${layoutMemberKindIds(nodeMap).join(', ')}],`);
	const members = depthMembersOf(nodeMap);
	const [indent, dedent] = [members.indent, members.dedent].map((kind) => (kind === undefined ? 0 : (findEntryForKindName(entries, kind)?.id ?? 0)));
	lines.push(`    indent: ${indent},`, `    dedent: ${dedent},`);
	lines.push(`    depth: super::options::DEPTH_REGIONS,`);
	lines.push(`};`);
	lines.push('');
	lines.push(`/// The grammar's root kinds: a render whose root is one of them is a document.`);
	lines.push(`pub const ROOT_KINDS: &[KindId] = &[${rootKindIds(nodeMap).map((id) => `KindId(${id})`).join(', ')}];`);

	const wordId = nodeMap.word === null || nodeMap.word === undefined ? undefined : findEntryForKindName(entries, nodeMap.word)?.id;
	const relaxedIds = relaxedKeywordIds(nodeMap, entries);
	lines.push('');
	lines.push(`/// The keyword tokens the grammar aliases to its word rule: a node of one of them, displayed as the word rule, reads as the word rule.`);
	lines.push(`pub const RELAXED_KEYWORDS: &[KindId] = &[${relaxedIds.map((id) => `KindId(${id})`).join(', ')}];`);
	lines.push('');
	lines.push(`/// Whether a node with this grammar id and display id is a relaxed keyword (\`ReadCtx::relaxes\`).`);
	lines.push(`pub fn relaxes(grammar: KindId, display: KindId) -> bool {`);
	lines.push(wordId === undefined || relaxedIds.length === 0 ? `    let _ = (grammar, display);\n    false` : `    display.0 == ${wordId} && RELAXED_KEYWORDS.contains(&grammar)`);
	lines.push(`}`);
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
