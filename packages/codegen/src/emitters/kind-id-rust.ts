import type { NodeMap } from '../compiler/types.ts';
import { findEntryForLiteralText, type GeneratedIdTables } from '../compiler/generated-metadata.ts';
import { AbstractAssembledCompound, hasOptionalElements, isMultiple, type AssembledNode } from '../compiler/model/node-map.ts';
import { CHOICE, SEQ, STRING } from '../types/rule-types.ts'; // @rule-type-consts
import type { RenderRule } from '../types/rule.ts';
import { collectKindEntries, collectCatalogKinds } from './kind-discriminant.ts';
import { slotSeparatorTexts } from './shared.ts';

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

	const textKindIds = [
		...new Set(
			entries
				.filter((entry) => {
					const modelType = nodeMap.nodes.get(entry.kind)?.modelType;
					return modelType === 'pattern' || modelType === 'enum';
				})
				.map((entry) => entry.id)
		)
	].sort((a, b) => a - b);
	lines.push('');
	lines.push('/// Whether the reader captures a named node of this kind as text: its');
	lines.push("/// template renders from that text, so the text is the node's content —");
	lines.push('/// free text for a pattern kind, the literal it holds for an enum kind.');
	lines.push('pub fn is_text_kind(kind: KindId) -> bool {');
	lines.push(`    matches!(kind.0, ${textKindIds.length > 0 ? textKindIds.join(' | ') : 'u16::MAX if false'})`);
	lines.push('}');

	const separatorRows: string[] = [];
	for (const [, node] of nodeMap.nodes) {
		const parentId = entries.find((entry) => entry.kind === node.kind)?.id;
		if (parentId === undefined) continue;
		const taggedLiterals = fieldTaggedLiteralTexts(node);
		for (const slot of node.slots) {
			if (slot.fieldName === undefined) continue;
			const texts = new Set<string>(taggedLiterals.get(slot.fieldName) ?? []);
			if (isMultiple(slot) && !hasOptionalElements(slot)) {
				for (const text of slotSeparatorTexts(slot, false)) texts.add(text);
			}
			const ids = [
				...new Set(
					[...texts].map((text) => findEntryForLiteralText(entries, text)?.id).filter((id): id is number => id !== undefined)
				)
			].sort((a, b) => a - b);
			if (ids.length === 0) continue;
			separatorRows.push(`    (${parentId}, ${JSON.stringify(slot.fieldName)}, &[${ids.join(', ')}]),`);
		}
	}
	lines.push('');
	lines.push('/// (parent kind id, tree-sitter field name, punctuation kind ids) for every');
	lines.push('/// slot the parser field-tags a literal into: the separator of a repeated');
	lines.push('/// slot, or a literal a rule puts beside a singular slot under the same');
	lines.push('/// field. The template prints such a token itself, so the reader drops the');
	lines.push('/// child instead of seating it, and a native read and a wrapped read hand');
	lines.push('/// back the same slot contents.');
	lines.push('static SLOT_SEPARATORS: &[(u16, &str, &[u16])] = &[');
	lines.push(...separatorRows);
	lines.push('];');
	lines.push('');
	lines.push('pub fn is_slot_separator(parent: KindId, field: &str, child: KindId) -> bool {');
	lines.push('    SLOT_SEPARATORS');
	lines.push('        .iter()');
	lines.push('        .any(|(p, f, seps)| *p == parent.0 && *f == field && seps.contains(&child.0))');
	lines.push('}');

	lines.push('');

	return lines.join('\n');
}

export function fieldTaggedLiteralTexts(node: AssembledNode): ReadonlyMap<string, readonly string[]> {
	const out = new Map<string, string[]>();
	const walk = (rule: RenderRule, field: string | undefined): void => {
		const own = (rule as { fieldName?: string }).fieldName ?? field;
		switch (rule.type) {
			case STRING:
				if (own !== undefined && own !== (rule as { fieldName?: string }).fieldName) {
					const list = out.get(own) ?? [];
					if (!list.includes(rule.value)) list.push(rule.value);
					out.set(own, list);
				}
				return;
			case SEQ:
			case CHOICE:
				for (const member of rule.members) walk(member, own);
				return;
			default:
				return;
		}
	};
	if (node instanceof AbstractAssembledCompound) walk(node.renderRule, undefined);
	return out;
}

