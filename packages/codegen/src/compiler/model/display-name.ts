import type { NodeMap } from '../types.ts';
import { findAnonEntryForLiteralText, type KindEntryLike } from '../generated-metadata.ts';
import { aliasTargetOf, storageNameOf, type SymbolRule } from '../../types/rule.ts';
import { isParserHiddenName } from '../../dsl/rule-patterns.ts';

export type DisplaySource = 'catalog' | 'supertype' | 'phantom';

export type RowlessDisplaySource = Exclude<DisplaySource, 'catalog'>;

export interface DisplayStamp {
	readonly name: string;
	readonly source: DisplaySource;
}

export function stampDisplay(
	kind: string,
	own: KindEntryLike | undefined,
	kindEntries: readonly KindEntryLike[],
	rowless: RowlessDisplaySource
): DisplayStamp {
	if (own !== undefined) return { name: displayNameOfEntry(own, kindEntries), source: 'catalog' };
	return { name: displayOfParserName(kind), source: rowless };
}

export function displayNameOfEntry(entry: KindEntryLike, kindEntries: readonly KindEntryLike[]): string {
	if (entry.anon !== true && entry.hidden === true && entry.literalText !== undefined && entry.symbolName === entry.literalText) {
		return displayOfParserName((findAnonEntryForLiteralText(kindEntries, entry.literalText) ?? entry).kind);
	}
	return displayOfParserName(entry.anon === true ? entry.kind : (entry.symbolName ?? entry.kind));
}

export function displayOfParserName(name: string): string {
	return isParserHiddenName(name) ? undisplayedKindAddress(name) : name;
}

export function undisplayedKindAddress(symbol: string): string {
	return symbol.replace(/^_+/, '');
}

export function displayNameOf(kind: string, nodeMap: NodeMap): string {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined) throw new Error(`display name: '${kind}' is not a kind of this grammar`);
	return node.display.name;
}

export function ownsItsDisplay(kind: string, nodeMap: NodeMap): boolean {
	return displayNameOf(kind, nodeMap) === kind;
}

export function displayedKinds(nodeMap: NodeMap): ReadonlySet<string> {
	return new Set([...nodeMap.nodes.values()].map((node) => node.display.name));
}

export function displayNameOfRef(ref: SymbolRule<'link'>): string {
	return aliasTargetOf(ref) ?? storageNameOf(ref);
}
