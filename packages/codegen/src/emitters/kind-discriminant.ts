import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import { findEntryForKindName, findEntryForLiteralText } from '../compiler/generated-metadata.ts';

export function toPascal(kind: string): string {
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
	readonly parseId?: number;
	readonly symbolName?: string;
	readonly anon?: boolean;
}

export function kindIdMemberName(nodeMap: NodeMap, kind: string): string {
	const typeName = nodeMap.nodes.get(kind)?.typeName;
	if (typeName) return typeName;
	const prefix = kind.match(/^_+/)?.[0] ?? '';
	return `${prefix}${toPascal(kind)}`;
}

export function collectCatalogKinds(generatedIdTables: GeneratedIdTables): readonly string[] {
	return [...toIdMap(generatedIdTables.kindIds).keys()];
}

export function collectKindEntries(
	allKinds: readonly string[],
	nodeMap: NodeMap,
	generatedIdTables: GeneratedIdTables
): KindEnumEntry[] {
	const fullCatalog = toCatalogMap(generatedIdTables.kindIds);
	const entries: KindEnumEntry[] = [];
	const seenMembers = new Map<string, string>();
	for (const kind of allKinds) {
		const row = fullCatalog.get(kind);
		if (row === undefined || row.id === undefined) continue;
		let member = kindIdMemberName(nodeMap, kind);
		const existing = seenMembers.get(member);
		if (existing !== undefined && existing !== kind) {
			member = `${member}_${row.id}`;
		}
		seenMembers.set(member, kind);
		const symbolName =
			row.parser?.symbolName !== undefined && row.parser.symbolName !== kind ? row.parser.symbolName : undefined;
		const anon = row.parser?.anon ?? false;
		entries.push({ kind, member, id: row.id, parseId: row.parseId, symbolName, anon: anon || undefined });
	}
	entries.sort((a, b) => a.id - b.id || a.kind.localeCompare(b.kind));
	return entries;
}

export function findKindEntry(kindEntries: readonly KindEnumEntry[], kind: string): KindEnumEntry | undefined {
	return findEntryForKindName(kindEntries, kind);
}

export function findKindEntryForLiteral(
	kindEntries: readonly KindEnumEntry[],
	literalText: string
): KindEnumEntry | undefined {
	return findEntryForLiteralText(kindEntries, literalText);
}

export function hasCatalogEntry(kindEntries: readonly KindEnumEntry[] | undefined, kind: string): boolean {
	if (!kindEntries) return false;
	return findKindEntry(kindEntries, kind) !== undefined;
}

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
