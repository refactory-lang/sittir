import { findOwnKindEntry } from '../dsl/symbol-table.ts';
import type { NodeMap } from '../compiler/types.ts';
import { modelKindOfEntry, type GeneratedIdTables, type KindEntryLike } from '../dsl/symbol-table.ts';
import { AbstractAssembledCompound } from '../compiler/model/node-map.ts';
import { collectKindEntries, collectCatalogKinds } from './kind-discriminant.ts';
import { wireRoutesOf } from './shared.ts';
import { toScreamingSnakeCase } from '../compiler/model/casing.ts';
import { ERROR_KIND_ID, ERROR_KIND_NAME } from '@sittir/common/error-kind';

export interface EmitKindIdRustConfig {
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables: GeneratedIdTables;
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
	const errorEntry = entries.find((entry) => entry.id === ERROR_KIND_ID);
	if (errorEntry === undefined) throw new Error(`kind_ids.rs: ${grammar} has no ${ERROR_KIND_NAME} kind entry`);
	lines.push(`const _: () = assert!(${toScreamingSnakeCase(errorEntry.member, errorEntry.kind)}.0 == KindId::ERROR.0);`);

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

	const textKindIds = [
		...new Set(
			entries
				.filter((entry) => {
					const node = nodeMap.nodes.get(modelKindOfEntry(entry, entries));
					return (
						node?.modelType === 'pattern' ||
						node?.modelType === 'enum' ||
						(node instanceof AbstractAssembledCompound && node.lexedInterior)
					);
				})
				.map((entry) => entry.id)
		)
	].sort((a, b) => a - b);
	lines.push('');
	lines.push('/// Whether the reader captures a named node of this kind as text: its');
	lines.push("/// template renders from that text, so the text is the node's content —");
	lines.push('/// free text for a pattern kind, the literal it holds for an enum kind.');
	lines.push(...kindIdSetFn('is_text_kind', textKindIds));

	lines.push('');
	lines.push('/// The model slot a child is stored under where its name differs from the');
	lines.push("/// parser's key: a field-tagged child by (parent kind id, field), a named");
	lines.push("/// child without a field by (parent kind id, the child's kind name).");
	lines.push("/// `None` keeps the parser's key.");
	lines.push("pub fn wire_slot(parent: KindId, field: Option<&str>, child: &str) -> Option<&'static str> {");
	lines.push('    match (parent.0, field, child) {');
	for (const route of wireSlotRows(nodeMap, entries)) {
		const fieldPattern = route.field === undefined ? 'None' : `Some(${JSON.stringify(route.field)})`;
		const childPattern = route.child === undefined ? '_' : JSON.stringify(route.child);
		lines.push(`        (${route.parentId}, ${fieldPattern}, ${childPattern}) => Some(${JSON.stringify(route.slot)}),`);
	}
	lines.push('        _ => None,');
	lines.push('    }');
	lines.push('}');

	lines.push('');
	lines.push('/// The gap an extra occupies inside a node with no named child to own it,');
	lines.push('/// by (kind id, anonymous tokens before the extra): the model slot whose');
	lines.push('/// position the gap holds. `None` when the model has no slot there.');
	lines.push("pub fn inner_gap_key(kind: KindId, preceding_tokens: u16) -> Option<&'static str> {");
	lines.push('    match (kind.0, preceding_tokens) {');
	for (const row of innerGapRows(nodeMap, entries)) {
		lines.push(`        (${row.kindId}, ${row.precedingTokens}) => Some(${JSON.stringify(row.key)}),`);
	}
	lines.push('        _ => None,');
	lines.push('    }');
	lines.push('}');

	lines.push('/// Whether the model stores a `child` of a `parent` node, reached under the');
	lines.push('/// parser field `field` (`None` for an untagged child), as a scalar: a');
	lines.push('/// presence flag or a kind id rather than a node. Such a child keeps no');
	lines.push('/// trivia, so the reader never makes it an owner.');
	lines.push('pub fn stores_scalar(parent: KindId, field: Option<&str>, child: KindId) -> bool {');
	lines.push('    match (parent.0, field) {');
	for (const row of scalarChildRows(nodeMap, entries)) {
		const fieldPattern = row.field === undefined ? 'None' : `Some(${JSON.stringify(row.field)})`;
		lines.push(`        (${row.parentId}, ${fieldPattern}) => matches!(child.0, ${row.childIds.join(' | ')}),`);
	}
	lines.push('        _ => false,');
	lines.push('    }');
	lines.push('}');

	lines.push('');

	return lines.join('\n');
}

function kindIdSetFn(name: string, ids: readonly number[]): string[] {
	return ids.length === 0
		? [`pub fn ${name}(_kind: KindId) -> bool {`, '    false', '}']
		: [`pub fn ${name}(kind: KindId) -> bool {`, `    matches!(kind.0, ${ids.join(' | ')})`, '}'];
}

interface InnerGapRow {
	readonly kindId: number;
	readonly precedingTokens: number;
	readonly key: string;
}

function innerGapRows(
	nodeMap: NodeMap,
	entries: readonly (KindEntryLike & { readonly id: number })[]
): readonly InnerGapRow[] {
	return [...nodeMap.nodes.values()]
		.filter((node) => node instanceof AbstractAssembledCompound)
		.flatMap((node) => {
			const kindId = findOwnKindEntry(entries, node.kind)?.id;
			return kindId === undefined ? [] : node.innerGaps.map((gap) => ({ kindId, ...gap }));
		})
		.sort((a, b) => a.kindId - b.kindId || a.precedingTokens - b.precedingTokens);
}

const SCALAR_STORAGE: ReadonlySet<string> = new Set(['boolean', 'bitflag', 'kindEnum', 'mixedEnum']);

export interface ScalarChildRow {
	readonly parentId: number;
	readonly field?: string;
	readonly childIds: readonly number[];
}

export function scalarChildRows(
	nodeMap: NodeMap,
	entries: readonly (KindEntryLike & { readonly id: number })[]
): readonly ScalarChildRow[] {
	const rows = new Map<string, { parentId: number; field?: string; childIds: Set<number> }>();
	for (const [, node] of nodeMap.nodes) {
		const parentId = findOwnKindEntry(entries, node.kind)?.id;
		if (parentId === undefined) continue;
		for (const slot of node.slots) {
			const info = slot.storageInfo;
			if (info === undefined || !SCALAR_STORAGE.has(info.kind) || info.enumKindsById.size === 0) continue;
			const field = slot.fieldName;
			const key = `${parentId} ${field ?? ''}`;
			const row = rows.get(key) ?? { parentId, ...(field === undefined ? {} : { field }), childIds: new Set<number>() };
			for (const id of info.enumKindsById.values()) row.childIds.add(id);
			rows.set(key, row);
		}
	}
	return [...rows.values()]
		.map((row) => ({ ...row, childIds: [...row.childIds].sort((a, b) => a - b) }))
		.sort((a, b) => a.parentId - b.parentId || (a.field ?? '').localeCompare(b.field ?? ''));
}

export interface WireSlotRow {
	readonly parentId: number;
	readonly field?: string;
	readonly child?: string;
	readonly slot: string;
}

export function wireSlotRows(
	nodeMap: NodeMap,
	entries: readonly (KindEntryLike & { readonly id: number })[]
): readonly WireSlotRow[] {
	const rows = new Map<string, WireSlotRow>();
	const claim = (kind: string, row: WireSlotRow): void => {
		const key = `${row.parentId} ${row.field ?? ''} ${row.child ?? ''}`;
		const claimed = rows.get(key);
		if (claimed !== undefined && claimed.slot !== row.slot) {
			const by = row.field !== undefined ? `field '${row.field}'` : `untagged kind '${row.child}'`;
			throw new Error(`kind-id-rust: '${kind}' routes ${by} to two slots ('${claimed.slot}', '${row.slot}')`);
		}
		rows.set(key, row);
	};
	for (const [, node] of nodeMap.nodes) {
		const parentId = findOwnKindEntry(entries, node.kind)?.id;
		if (parentId === undefined) continue;
		for (const slot of node.slots) {
			const routes = wireRoutesOf(slot, nodeMap);
			for (const field of routes.fields) claim(node.kind, { parentId, field, slot: slot.storageName });
			for (const child of routes.kinds) claim(node.kind, { parentId, child, slot: slot.storageName });
		}
	}
	const order = (row: WireSlotRow): string => `${row.field ?? ''}\u0000${row.child ?? ''}`;
	return [...rows.values()]
		.filter((row) => (row.field ?? row.child) !== row.slot)
		.sort((a, b) => a.parentId - b.parentId || (order(a) < order(b) ? -1 : order(a) > order(b) ? 1 : 0));
}


