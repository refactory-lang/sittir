import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import { collectKindEntries, findKindEntryForLiteral, type KindEnumEntry } from './kind-discriminant.ts';
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

export function relaxedDisplayIds(nodeMap: NodeMap, entries: readonly KindEnumEntry[]): [number, number[]][] {
	return Object.entries(nodeMap.relaxedDisplayLiterals ?? {}).flatMap(([display, literals]) => {
		const shown = findEntryForKindName(entries, `_${display}`) ?? findEntryForKindName(entries, display);
		const ids = literals.flatMap((literal) => {
			const entry = findKindEntryForLiteral(entries, literal);
			return entry === undefined ? [] : [entry.id];
		});
		return shown === undefined || ids.length === 0 ? [] : [[shown.id, ids] as [number, number[]]];
	});
}

export interface RelaxationTable {
	/** The word rule's own display id and the keyword tokens aliased to it. */
	readonly word?: { readonly display: number; readonly tokens: readonly number[] };
	/** Each display that is an alias of the word rule, with the keyword tokens aliased to it. */
	readonly displays: readonly { readonly display: number; readonly tokens: readonly number[] }[];
}

export function relaxationTable(nodeMap: NodeMap, entries: readonly KindEnumEntry[]): RelaxationTable {
	const wordId = nodeMap.word === null || nodeMap.word === undefined ? undefined : findEntryForKindName(entries, nodeMap.word)?.id;
	const tokens = relaxedKeywordIds(nodeMap, entries);
	return {
		...(wordId === undefined || tokens.length === 0 ? {} : { word: { display: wordId, tokens } }),
		displays: relaxedDisplayIds(nodeMap, entries).map(([display, ids]) => ({ display, tokens: ids }))
	};
}

export function emitKindIdRust(config: EmitKindIdRustConfig): string {
	const { grammar, nodeMap, generatedIdTables } = config;
	const entries = collectKindEntries(nodeMap, generatedIdTables);

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
	lines.push(`const _: () = assert!(${kindConstName(errorEntry)}.get() == KindId::ERROR.get());`);
	lines.push('');
	lines.push(`/// The surface kinds: list kinds, whose items the surface exposes in their place, unit kinds, which it exposes as a kind id, the extras that are layout members, which it assigns as layout, and the depth members a layout run's excess indentation reads as.`);
	lines.push(`pub const SURFACE_KINDS: ::sittir_core::trivia_table::SurfaceKinds = ::sittir_core::trivia_table::SurfaceKinds {`);
	const kindIds = (ids: readonly number[]): string => ids.map((id) => `KindId(${id})`).join(', ');
	lines.push(`    lists: &[${kindIds(listKindIds(nodeMap))}],`);
	lines.push(`    units: &[${kindIds(unitKindIds(nodeMap))}],`);
	lines.push(`    layout: &[${kindIds(layoutMemberKindIds(nodeMap))}],`);
	const members = depthMembersOf(nodeMap);
	const [indent, dedent] = [members.indent, members.dedent].map((kind) => (kind === undefined ? 0 : (findEntryForKindName(entries, kind)?.id ?? 0)));
	lines.push(`    indent: KindId(${indent}),`, `    dedent: KindId(${dedent}),`);
	lines.push(`    depth: super::options::DEPTH_REGIONS,`);
	lines.push(`};`);
	lines.push('');
	lines.push(`/// The grammar's root kinds: a render whose root is one of them is a document.`);
	lines.push(`pub const ROOT_KINDS: &[KindId] = &[${rootKindIds(nodeMap).map((id) => `KindId(${id})`).join(', ')}];`);

	const table = relaxationTable(nodeMap, entries);
	lines.push('');
	lines.push(`/// The keyword tokens the grammar aliases to its word rule: a node of one of them, displayed as the word rule, reads as the word rule.`);
	lines.push(`pub const RELAXED_KEYWORDS: &[KindId] = &[${(table.word?.tokens ?? []).map((id) => `KindId(${id})`).join(', ')}];`);
	lines.push('');
	lines.push(`/// The display ids that stand for the word rule (an alias of it) and the keyword tokens aliased to each.`);
	lines.push(`pub const RELAXED_DISPLAYS: &[(KindId, &[KindId])] = &[${table.displays.map(({ display, tokens }) => `(KindId(${display}), &[${tokens.map((id) => `KindId(${id})`).join(', ')}])`).join(', ')}];`);
	lines.push('');
	lines.push(`/// Whether a node with this grammar id and display id is a relaxed keyword (\`ReadCtx::relaxes\`).`);
	lines.push(`#[must_use]`);
	lines.push(`pub fn relaxes(grammar: KindId, display: KindId) -> bool {`);
	const wordClause = table.word === undefined ? undefined : `display == KindId(${table.word.display}) && RELAXED_KEYWORDS.contains(&grammar)`;
	const displayClause = table.displays.length === 0 ? undefined : `RELAXED_DISPLAYS.iter().any(|(shown, tokens)| *shown == display && tokens.contains(&grammar))`;
	const clauses = [wordClause, displayClause].filter((clause): clause is string => clause !== undefined);
	lines.push(clauses.length === 0 ? `    let _ = (grammar, display);\n    false` : `    ${clauses.join(' || ')}`);
	lines.push(`}`);
	lines.push('');
	lines.push(`/// Map a \`KindId\` back to its grammar kind string for diagnostics.`);
	lines.push(`/// Returns \`"<unknown>"\` for ids not in this grammar's symbol table.`);
	lines.push(`#[must_use]`);
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
