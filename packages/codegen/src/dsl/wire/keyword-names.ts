import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { isBlank, rulesEqual } from '../rule-patterns.ts';
import { spelledTokenText } from '../symbol-table.ts';
import { renameRule } from './symbol-renames.ts';

export interface KeywordMintHolder {
	readonly keywordMints: ReadonlyMap<string, string>;
	readonly baseRuleBodies: Readonly<Record<string, RuntimeRule>>;
	readonly deposits: Map<string, RuntimeRule>;
	readonly syntheticInline: Set<string>;
}

export function keywordRuleName(fieldName: string): string {
	return `_kw_${fieldName}`;
}

export function spelledKeywordRuleName(fieldName: string, text: string): string {
	return `${keywordRuleName(fieldName)}_${spelledTokenText(text)}`;
}

export function resolveKeywordNames(bodies: Map<string, unknown>, holder: KeywordMintHolder): void {
	const renames = keywordRenames(bodies, holder);
	if (renames.size === 0) return;
	for (const [mint, bare] of renames) {
		renameEntry(bodies, mint, bare);
		renameEntry(holder.deposits, mint, bare);
		renameMember(holder.syntheticInline, mint, bare);
	}
	for (const [name, body] of bodies) bodies.set(name, renameRule(body, renames));
}

function renameEntry<V>(entries: Map<string, V>, from: string, to: string): void {
	if (!entries.has(from)) return;
	if (entries.has(to)) {
		entries.set(to, entries.get(from) as V);
		entries.delete(from);
		return;
	}
	const ordered = [...entries];
	entries.clear();
	for (const [name, value] of ordered) entries.set(name === from ? to : name, value);
}

function renameMember(members: Set<string>, from: string, to: string): void {
	if (!members.has(from)) return;
	if (members.has(to)) {
		members.delete(from);
		return;
	}
	const ordered = [...members];
	members.clear();
	for (const name of ordered) members.add(name === from ? to : name);
}

function keywordRenames(bodies: ReadonlyMap<string, unknown>, holder: KeywordMintHolder): ReadonlyMap<string, string> {
	const mintsByField = new Map<string, string[]>();
	for (const [mint, fieldName] of holder.keywordMints) mintsByField.set(fieldName, [...(mintsByField.get(fieldName) ?? []), mint]);
	const renames = new Map<string, string>();
	for (const [fieldName, [mint, ...others]] of mintsByField) {
		if (mint === undefined || others.length > 0) continue;
		const bare = keywordRuleName(fieldName);
		const held = (bodies.get(bare) ?? holder.baseRuleBodies[bare]) as RuntimeRule | undefined;
		if (held === undefined || isBlank(held) || rulesEqual(held, bodies.get(mint) as RuntimeRule)) renames.set(mint, bare);
	}
	return renames;
}
