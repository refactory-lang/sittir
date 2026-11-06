import type { KindParserMetadata, NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables, GeneratedKindEntry } from '../dsl/symbol-table.ts';
import { collectGeneratedKindEntries, findEntryForKindName, findEntryForLiteralText, findOwnKindEntry, modelKindOfEntry } from '../dsl/symbol-table.ts';
import { kindIdText } from '../compiler/model/node-map.ts';
import { compareOrdinal } from './shared.ts';
import { kindTypeName } from '../compiler/model/casing.ts';
import { ERROR_KIND_ID, ERROR_KIND_NAME } from '@sittir/common/error-kind';


export interface KindEnumEntry extends GeneratedKindEntry {
	readonly member: string;
}

export function kindIdMemberName(nodeMap: NodeMap, kind: string): string {
	const typeName = nodeMap.nodes.get(kind)?.typeName;
	if (typeName) return typeName;
	const prefix = kind.match(/^_+/)?.[0] ?? '';
	return `${prefix}${kindTypeName(kind)}`;
}

export function collectCatalogKinds(generatedIdTables: GeneratedIdTables): readonly string[] {
	return [...toIdMap(generatedIdTables.kindIds).keys()];
}

export function collectKindEntries(nodeMap: NodeMap, generatedIdTables: GeneratedIdTables): KindEnumEntry[] {
	const rows = collectGeneratedKindEntries(generatedIdTables);
	const entries: KindEnumEntry[] = [];
	const seenMembers = new Map<string, string>();
	for (const row of rows) {
		const member = kindIdMemberName(nodeMap, modelKindOfEntry(row, rows));
		const existing = seenMembers.get(member);
		if (existing !== undefined && existing !== row.kind) {
			throw new Error(`TSKindId: kinds '${existing}' and '${row.kind}' both name member '${member}'`);
		}
		seenMembers.set(member, row.kind);
		entries.push({ ...row, member });
	}
	entries.sort((a, b) => a.id - b.id || compareOrdinal(a.kind, b.kind));
	return entries;
}

export function findKindEntry(kindEntries: readonly KindEnumEntry[], kind: string): KindEnumEntry | undefined {
	return findEntryForKindName(kindEntries, kind);
}

export function errorKindEntry(kindEntries: readonly KindEnumEntry[], where: string): KindEnumEntry {
	const entry = kindEntries.find((candidate) => candidate.id === ERROR_KIND_ID);
	if (entry === undefined) throw new Error(`${where}: the kind catalog has no ${ERROR_KIND_NAME} entry`);
	return entry;
}

export function findKindEntryForLiteral(
	kindEntries: readonly KindEnumEntry[],
	literalText: string
): KindEnumEntry | undefined {
	return findEntryForLiteralText(kindEntries, literalText);
}

export function hasCatalogEntry(kindEntries: readonly KindEnumEntry[], kind: string): boolean {
	return findKindEntry(kindEntries, kind) !== undefined;
}

export function hasKindId(kind: string, kindEntries: readonly KindEnumEntry[]): boolean {
	return findOwnKindEntry(kindEntries, kind) !== undefined;
}

export function fixedTextKinds(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): (readonly [kind: string, text: string])[] {
	return [...nodeMap.nodes].flatMap(([kind, node]) => {
		const text = kindIdText(node);
		return text !== undefined && hasKindId(kind, kindEntries) ? [[kind, text] as const] : [];
	});
}

export function kindDiscriminantExpr(kind: string, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): string {
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

export function kindDiscriminantExprForId(id: number, kindEntries: readonly KindEnumEntry[]): string | undefined {
	const entry = kindEntries.find((e) => e.id === id);
	return entry === undefined ? undefined : `TSKindId.${entry.member}`;
}

export function kindDiscriminantExprForLiteral(literalText: string, kindEntries: readonly KindEnumEntry[]): string {
	const entry = findKindEntryForLiteral(kindEntries, literalText);
	if (!entry) {
		throw new Error(
			`kindDiscriminantExprForLiteral: literal '${literalText}' has no parser symbol (TSGrammar-only). ` +
				`See kindDiscriminantExpr for the loud-error rationale.`
		);
	}
	return `TSKindId.${entry.member}`;
}

function toIdMap(ids: GeneratedIdTables['kindIds']): Map<string, number> {
	const result = new Map<string, number>();
	for (const [name, row] of toCatalogMap(ids)) {
		if (row.id !== undefined) result.set(name, row.id);
	}
	return result;
}

interface CatalogRow {
	readonly id?: number;
	readonly parseId?: number;
	readonly parseName?: string;
	readonly parser?: KindParserMetadata;
}

function toCatalogMap(ids: GeneratedIdTables['kindIds']): Map<string, CatalogRow> {
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
