import { isParserHiddenName, terminalContentOf, type SymbolFacts, type SymbolSource } from './rule-patterns.ts';
import type { KindParserMetadata } from '../compiler/types.ts';

export interface ParserSymbolTable {
	readonly symbols: ReadonlyMap<string, CEnumEntry>;
	readonly names: ReadonlyMap<string, string>;
	readonly facts: ParserSymbolFacts;
}

export function kindTableOfSymbolTable(table: ParserSymbolTable, grammarJson: unknown): Map<string, GeneratedIdEntry> {
	const symbolTextFacts = resolveSymbolTextFacts(table.names, collectGrammarFacts(grammarJson));
	return joinIdNames(
		table.symbols,
		table.names,
		deriveSymbolRuntimeName(symbolTextFacts),
		symbolTextFacts,
		table.facts,
		collectLexicalRanks(grammarJson)
	);
}

interface GrammarFacts {
	readonly aliasTargets: ReadonlyMap<string, ReadonlySet<string>>;
	readonly literalRules: ReadonlyMap<string, string>;
}

function collectGrammarFacts(grammarJson: unknown): GrammarFacts {
	const aliasTargets = new Map<string, Set<string>>();
	const literalRules = new Map<string, string>();
	const rules = (grammarJson as { rules?: Record<string, unknown> } | undefined)?.rules;
	if (rules) {
		for (const [name, rule] of Object.entries(rules)) {
			const literalValue = literalRuleValue(rule);
			if (literalValue !== undefined) literalRules.set(name, literalValue);
		}
		for (const rule of Object.values(rules)) {
			walkGrammarNode(rule, aliasTargets, literalRules);
		}
	}
	return { aliasTargets, literalRules };
}

function literalRuleValue(rule: unknown): string | undefined {
	if (rule === null || typeof rule !== 'object') return undefined;
	const record = rule as Record<string, unknown>;
	if (record.type === 'STRING' && typeof record.value === 'string') return record.value;
	if (record.type === 'ALIAS' && record.named === false && typeof record.value === 'string') return record.value;
	return undefined;
}

function walkGrammarNode(
	node: unknown,
	aliasTargets: Map<string, Set<string>>,
	literalRules: Map<string, string>
): void {
	if (Array.isArray(node)) {
		for (const child of node) walkGrammarNode(child, aliasTargets, literalRules);
		return;
	}
	if (node === null || typeof node !== 'object') return;
	const record = node as Record<string, unknown>;
	if (record.type === 'ALIAS' && record.named === true && typeof record.value === 'string') {
		const literals = aliasTargets.get(record.value) ?? new Set<string>();
		for (const literal of aliasedLiterals(record.content)) literals.add(literal);
		aliasTargets.set(record.value, literals);
	}
	if (record.type === 'ALIAS' && record.named === false && typeof record.value === 'string') {
		const content = record.content as Record<string, unknown> | undefined;
		if (content?.type === 'SYMBOL' && typeof content.name === 'string')
			literalRules.set(content.name, record.value as string);
	}
	for (const value of Object.values(record)) walkGrammarNode(value, aliasTargets, literalRules);
}

const LITERAL_WRAPPERS = new Set(['TOKEN', 'IMMEDIATE_TOKEN', 'PREC', 'PREC_LEFT', 'PREC_RIGHT', 'PREC_DYNAMIC']);

function aliasedLiterals(content: unknown): readonly string[] {
	if (content === null || typeof content !== 'object') return [];
	const record = content as Record<string, unknown>;
	if (record.type === 'STRING' && typeof record.value === 'string') return [record.value];
	if ((record.type === 'CHOICE' || record.type === 'SEQ') && Array.isArray(record.members)) {
		return record.members.flatMap(aliasedLiterals);
	}
	if (typeof record.type === 'string' && LITERAL_WRAPPERS.has(record.type)) return aliasedLiterals(record.content);
	return [];
}

function resolveAliasedTokenLiterals(
	names: ReadonlyMap<string, string>,
	aliasTargets: ReadonlyMap<string, ReadonlySet<string>>
): ReadonlyMap<string, string> {
	const byDisplay = new Map<string, string[]>();
	for (const [cName, displayName] of names) {
		if (!cName.startsWith('anon_sym_') || !aliasTargets.has(displayName)) continue;
		if (cName.slice('anon_sym_'.length) === displayName) continue;
		byDisplay.set(displayName, [...(byDisplay.get(displayName) ?? []), cName]);
	}
	const resolved = new Map<string, string>();
	for (const [displayName, cNames] of byDisplay) {
		const literals = aliasTargets.get(displayName)!;
		const unresolved: string[] = [];
		for (const cName of cNames) {
			const suffix = cName.slice('anon_sym_'.length);
			if (literals.has(suffix)) resolved.set(cName, suffix);
			else unresolved.push(cName);
		}
		const claimed = new Set(cNames.map((c) => resolved.get(c)).filter((l) => l !== undefined));
		const candidates = [...literals].filter((l) => !claimed.has(l));
		for (const cName of unresolved) {
			if (candidates.length !== 1 || unresolved.length !== 1) {
				throw new Error(
					`generated-metadata: aliased token ${cName} (display ${JSON.stringify(displayName)}) has no verbatim literal` +
						` — unclaimed literals aliased to it: ${JSON.stringify(candidates)}`
				);
			}
			resolved.set(cName, candidates[0]!);
		}
	}
	return resolved;
}

interface SymbolTextFacts {
	readonly literalText: string;
	readonly literalRule?: boolean;
}

function resolveSymbolTextFacts(
	names: ReadonlyMap<string, string>,
	grammar: GrammarFacts
): ReadonlyMap<string, SymbolTextFacts> {
	const result = new Map<string, SymbolTextFacts>();
	const aliasedLiterals = resolveAliasedTokenLiterals(names, grammar.aliasTargets);
	for (const [cName, displayName] of names) {
		if (cName.startsWith('anon_sym_')) {
			const aliasedLiteralText = aliasedLiterals.get(cName);
			if (aliasedLiteralText !== undefined) {
				result.set(cName, { literalText: aliasedLiteralText });
				continue;
			}
			result.set(cName, { literalText: displayName });
			continue;
		}
		if (cName.startsWith('sym_')) {
			const ruleName = cName.slice('sym_'.length);
			const literalValue = grammar.literalRules.get(ruleName);
			if (literalValue === undefined) continue;
			const isNamedAliasTarget = grammar.aliasTargets.has(displayName);
			if (isNamedAliasTarget) continue;
			result.set(cName, { literalText: literalValue, literalRule: true });
		}
	}
	return result;
}

export interface CEnumEntry {
	readonly cName: string;
	readonly id: number;
}

export interface ParserSymbolFacts {
	readonly aliasedNonTerminals: ReadonlySet<string>;
	readonly visible: ReadonlyMap<string, boolean>;
	readonly named: ReadonlyMap<string, boolean>;
	readonly supertypes: ReadonlySet<string>;
	readonly tokenCount: number | undefined;
}

export function joinIdNames(
	ids: ReadonlyMap<string, CEnumEntry>,
	names: ReadonlyMap<string, string>,
	fallbackName: (cName: string) => string,
	symbolTextFacts?: ReadonlyMap<string, SymbolTextFacts>,
	symbolFacts?: ParserSymbolFacts,
	lexicalRanks?: ReadonlyMap<string, number>
): Map<string, GeneratedIdEntry> {
	const result = new Map<string, GeneratedIdEntry>();
	for (const entry of ids.values()) {
		const key = fallbackName(entry.cName);
		const parser = createParserMetadata(entry, key, names, symbolTextFacts, symbolFacts, lexicalRanks);
		const existing = result.get(key);
		if (!existing || !existing.parser) {
			result.set(key, { id: entry.id, parser });
			continue;
		}
		if (existing.parser.cSymbol === entry.cName) {
			result.set(key, { id: entry.id, parser });
			continue;
		}
		if (existing.parser.anon !== parser.anon) {
			const anonSide = existing.parser.anon ? existing.parser : parser;
			const namedSide = existing.parser.anon ? parser : existing.parser;
			throw new Error(
				`generated-metadata: key '${key}' names both anonymous token ${JSON.stringify(anonSide.symbolName)} (${anonSide.cSymbol}) and kind '${key}' (${namedSide.cSymbol})`
			);
		}
		if (!shouldReplaceSymbol(existing.parser.cSymbol, entry.cName)) {
			if (parser.alias) {
				if (parser.symbolName !== undefined && parser.symbolName !== existing.parser.symbolName) {
					result.set(key, {
						id: existing.id,
						parseId: entry.id,
						parseName: parser.symbolName,
						parser: existing.parser
					});
				}
				continue;
			}
			throw new Error(`generated-metadata: key '${key}' names both '${existing.parser.cSymbol}' and '${entry.cName}'`);
		}
		result.set(key, { id: entry.id, parser });
	}
	return result;
}

function createParserMetadata(
	entry: CEnumEntry,
	parserName: string,
	names: ReadonlyMap<string, string>,
	symbolTextFacts?: ReadonlyMap<string, SymbolTextFacts>,
	symbolFacts?: ParserSymbolFacts,
	lexicalRanks?: ReadonlyMap<string, number>
): KindParserMetadata {
	const facts = symbolTextFacts?.get(entry.cName);
	const lexicalRank = lexicalRanks?.get(grammarNameOfSymbol(entry.cName));
	return {
		cSymbol: entry.cName,
		parserName,
		symbolName: names.get(entry.cName),
		literalText: facts?.literalText,
		literalRule: facts?.literalRule,
		anon: symbolFacts?.named.get(entry.cName) === false,
		aux: entry.cName.startsWith('aux_sym_'),
		alias: entry.cName.startsWith('alias_sym_'),
		hidden: symbolFacts?.visible.get(entry.cName) === false,
		...(symbolFacts?.supertypes.has(entry.cName) ? { supertype: true as const } : {}),
		...(symbolFacts?.tokenCount !== undefined && entry.id < symbolFacts.tokenCount ? { terminal: true as const } : {}),
		...(keywordTextOf(entry.cName, symbolTextFacts) === undefined ? {} : { keyword: true as const }),
		...(symbolFacts?.aliasedNonTerminals.has(entry.cName) ? { aliasedNonTerminal: true as const } : {}),
		...(lexicalRank === undefined ? {} : { lexicalRank })
	};
}

function grammarNameOfSymbol(cName: string): string {
	return cName.replace(/^(?:alias_sym|aux_sym|anon_sym|sym)_/, '');
}

function shouldReplaceSymbol(existingCName: string | undefined, nextCName: string): boolean {
	if (!existingCName) return true;
	return existingCName.startsWith('anon_sym_') && !nextCName.startsWith('anon_sym_');
}

function keywordTextOf(
	cName: string,
	symbolTextFacts: ReadonlyMap<string, SymbolTextFacts> | undefined
): string | undefined {
	const text = symbolTextFacts?.get(cName)?.literalText;
	return text !== undefined && cName === `anon_sym_${text}` && /[^_]/.test(text) ? text : undefined;
}

function deriveSymbolRuntimeName(symbolTextFacts: ReadonlyMap<string, SymbolTextFacts>): (cName: string) => string {
	return (cName) => {
		if (cName.startsWith('sym_')) return cName.slice('sym_'.length);
		if (cName.startsWith('anon_sym_')) {
			const base = cName.slice('anon_sym_'.length).toLowerCase();
			if (keywordTextOf(cName, symbolTextFacts) !== undefined) return `${base}_keyword`;
			const text = symbolTextFacts.get(cName)?.literalText;
			if (text === undefined || cName !== `anon_sym_${text}`) return base;
			return text.length <= 1 ? 'underscore' : `underscore${text.length}`;
		}
		if (cName.startsWith('aux_sym_')) return cName.slice('aux_sym_'.length);
		if (cName.startsWith('alias_sym_')) return `_${cName.slice('alias_sym_'.length)}`;
		return cName;
	};
}

type LexicalKey = readonly number[];

function compareLexicalKeys(a: LexicalKey, b: LexicalKey): number {
	for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i]! - b[i]!;
	return a.length - b.length;
}

function tokenLexicalPrec(rule: GrammarJsonRule | undefined): number {
	if (rule?.type !== 'TOKEN' && rule?.type !== 'IMMEDIATE_TOKEN') return 0;
	return rule.content?.type === 'PREC' && typeof rule.content.value === 'number' ? rule.content.value : 0;
}

function isFixedTextRule(rule: GrammarJsonRule | undefined): boolean {
	let current = rule;
	while (current?.type === 'TOKEN' || current?.type === 'IMMEDIATE_TOKEN' || current?.type === 'PREC')
		current = current.content;
	return current?.type === 'STRING';
}

interface GrammarJsonRule {
	readonly type?: string;
	readonly name?: string;
	readonly value?: unknown;
	readonly named?: boolean;
	readonly content?: GrammarJsonRule;
	readonly members?: readonly GrammarJsonRule[];
	readonly metadata?: { readonly symbolSource?: string };
}

function collectLexicalRanks(grammarJson: unknown): ReadonlyMap<string, number> {
	const grammar = grammarJson as
		| { rules?: Record<string, GrammarJsonRule>; externals?: readonly GrammarJsonRule[] }
		| undefined;
	const rules = grammar?.rules ?? {};
	const ruleNames = Object.keys(rules);
	const externals = (grammar?.externals ?? []).flatMap((external) =>
		typeof external.name === 'string' ? [external.name] : []
	);
	const mintSources = new Map<string, { readonly owner: string; readonly arm: number }>();
	const aliasStorage = new Map<string, string>();
	for (const owner of ruleNames) {
		let arm = 0;
		const walk = (node: GrammarJsonRule | undefined): void => {
			if (node === undefined) return;
			if (
				node.type === 'SYMBOL' &&
				typeof node.name === 'string' &&
				node.metadata?.symbolSource === 'group-lift' &&
				!mintSources.has(node.name)
			) {
				mintSources.set(node.name, { owner, arm: ++arm });
			}
			if (
				node.type === 'ALIAS' &&
				node.named === true &&
				typeof node.value === 'string' &&
				node.content?.type === 'SYMBOL' &&
				typeof node.content.name === 'string' &&
				!aliasStorage.has(node.value)
			) {
				aliasStorage.set(node.value, node.content.name);
			}
			walk(node.content);
			for (const member of node.members ?? []) walk(member);
		};
		walk(rules[owner]);
	}
	const positions = new Map<string, LexicalKey>();
	const positionOf = (name: string, seen: ReadonlySet<string>): LexicalKey => {
		const known = positions.get(name);
		if (known !== undefined) return known;
		const source = mintSources.get(name);
		const position =
			source !== undefined && !seen.has(source.owner)
				? [...positionOf(source.owner, new Set([...seen, name])), source.arm]
				: [externals.includes(name) ? externals.indexOf(name) : ruleNames.indexOf(name)];
		positions.set(name, position);
		return position;
	};
	const keyOf = (name: string): LexicalKey => {
		const rule = rules[name];
		return [
			externals.includes(name) ? 0 : 1,
			-tokenLexicalPrec(rule),
			isFixedTextRule(rule) ? 0 : 1,
			...positionOf(name, new Set())
		];
	};
	const keys = new Map<string, LexicalKey>();
	for (const name of [...externals, ...ruleNames]) keys.set(name, keyOf(name));
	for (const [display, storage] of aliasStorage) {
		const storageKey = keys.get(storage);
		if (!(display in rules) && storageKey !== undefined) keys.set(display, storageKey);
	}
	const ordered = [...keys].sort(([a, ka], [b, kb]) => compareLexicalKeys(ka, kb) || (a < b ? -1 : a > b ? 1 : 0));
	return new Map(ordered.map(([name], rank) => [name, rank]));
}

export interface GeneratedIdEntry {
	readonly id?: number;
	readonly parseId?: number;
	readonly parseName?: string;
	readonly parser?: KindParserMetadata;
}

export type GeneratedIdTable =
	| ReadonlyMap<string, number | GeneratedIdEntry>
	| Record<string, number | GeneratedIdEntry>;

export interface GeneratedIdTables {
	readonly kindIds?: GeneratedIdTable;
	readonly fieldIds?: GeneratedIdTable;
	readonly sourceArtifact: string;
}

export interface GeneratedKindEntry {
	readonly kind: string;
	readonly id: number;
	readonly parseId?: number;
	readonly parseName?: string;
	readonly symbolName?: string;
	readonly literalText?: string;
	readonly anon?: boolean;
	readonly literalRule?: boolean;
	readonly alias?: boolean;
	readonly hidden?: boolean;
	readonly keyword?: boolean;
	readonly aliasedNonTerminal?: boolean;
	readonly supertype?: boolean;
	readonly terminal?: boolean;
	readonly visibleExternal?: boolean;
	readonly lexicalRank?: number;
}

export function stampVisibleExternals(
	tables: GeneratedIdTables | undefined,
	grammar: { readonly visibleExternals?: Readonly<Record<string, unknown>> }
): GeneratedIdTables | undefined {
	const declared = Object.keys(grammar.visibleExternals ?? {});
	if (tables?.kindIds === undefined || declared.length === 0) return tables;
	const stamped = new Map(toEntries(tables.kindIds));
	for (const name of declared) {
		const row = stamped.get(name);
		if (row?.parser === undefined || row.parser.visibleExternal === true) continue;
		stamped.set(name, { ...row, parser: { ...row.parser, visibleExternal: true } });
	}
	return { ...tables, kindIds: stamped };
}

export function symbolNameIsNotable(
	symbolName: string | undefined,
	kind: string,
	literalRule: boolean | undefined
): boolean {
	return symbolName !== undefined && (symbolName !== kind || literalRule === true);
}

export function collectGeneratedKindEntries(tables: GeneratedIdTables | undefined): readonly GeneratedKindEntry[] {
	if (!tables?.kindIds) return [];
	return toEntries(tables.kindIds)
		.filter(([, entry]) => entry.id !== undefined)
		.map(([kind, entry]) => ({
			kind,
			id: entry.id!,
			parseId: entry.parseId,
			parseName: entry.parseName,
			symbolName: symbolNameIsNotable(entry.parser?.symbolName, kind, entry.parser?.literalRule)
				? entry.parser?.symbolName
				: undefined,
			literalText: entry.parser?.literalText,
			anon: entry.parser?.anon || undefined,
			literalRule: entry.parser?.literalRule || undefined,
			alias: entry.parser?.alias || undefined,
			hidden: entry.parser?.hidden || undefined,
			keyword: entry.parser?.keyword || undefined,
			aliasedNonTerminal: entry.parser?.aliasedNonTerminal || undefined,
			supertype: entry.parser?.supertype || undefined,
			terminal: entry.parser?.terminal || undefined,
			visibleExternal: entry.parser?.visibleExternal || undefined,
			lexicalRank: entry.parser?.lexicalRank
		}));
}

export interface KindEntryLike {
	readonly kind: string;
	readonly symbolName?: string;
	readonly literalText?: string;
	readonly anon?: boolean;
	readonly literalRule?: boolean;
	readonly alias?: boolean;
	readonly hidden?: boolean;
	readonly supertype?: boolean;
	readonly terminal?: boolean;
	readonly visibleExternal?: boolean;
	readonly aliasedNonTerminal?: boolean;
	readonly parseId?: number;
	readonly parseName?: string;
}

export function findEntryForKindName<T extends KindEntryLike>(entries: readonly T[], name: string): T | undefined {
	return (
		entries.find((entry) => entry.kind === name && entry.alias !== true) ??
		entries.find((entry) => entry.kind === `_${name}`) ??
		entries.find((entry) => entry.anon === true && entry.symbolName === name) ??
		entries.find((entry) => entry.anon !== true && (entry.symbolName === name || entry.parseName === name)) ??
		undefined
	);
}

const visibleTreeNameCounts = new WeakMap<readonly KindEntryLike[], ReadonlyMap<string, number>>();

function visibleTreeNameCount(entries: readonly KindEntryLike[], name: string): number {
	let counts = visibleTreeNameCounts.get(entries);
	if (counts === undefined) {
		const tally = new Map<string, number>();
		for (const entry of entries) {
			if (entry.anon === true || entry.hidden === true) continue;
			const treeName = entry.symbolName ?? entry.kind;
			tally.set(treeName, (tally.get(treeName) ?? 0) + 1);
		}
		counts = tally;
		visibleTreeNameCounts.set(entries, counts);
	}
	return counts.get(name) ?? 0;
}

export function isRenamedEntry(entry: KindEntryLike, entries: readonly KindEntryLike[]): boolean {
	return (
		entry.alias !== true &&
		entry.anon !== true &&
		entry.literalRule !== true &&
		entry.visibleExternal !== true &&
		entry.hidden !== true &&
		entry.parseId === undefined &&
		entry.symbolName !== undefined &&
		entry.symbolName !== entry.kind &&
		visibleTreeNameCount(entries, entry.symbolName) === 1
	);
}

export function modelKindOfEntry(entry: KindEntryLike, entries: readonly KindEntryLike[]): string {
	return entry.symbolName !== undefined && (entry.alias === true || isRenamedEntry(entry, entries))
		? entry.symbolName
		: entry.kind;
}

export function parserHiddenOf(entry: KindEntryLike | undefined, kind: string): boolean {
	return entry === undefined ? isParserHiddenName(kind) : entry.alias !== true && entry.hidden === true;
}

export function surfaceHiddenOf(entry: KindEntryLike | undefined, kind: string): boolean {
	return (
		(parserHiddenOf(entry, kind) && entry?.supertype !== true) || (entry?.anon === true && entry.literalRule === true)
	);
}

export function isSurfaceHiddenKind(kind: string, entries: readonly KindEntryLike[]): boolean {
	return surfaceHiddenOf(findOwnKindEntry(entries, kind), kind);
}

export function isAliasedHiddenStorage(kind: string, entries: readonly KindEntryLike[]): boolean {
	const entry = findOwnKindEntry(entries, kind);
	return entry?.aliasedNonTerminal === true && surfaceHiddenOf(entry, kind);
}

export function isParserHiddenKind(kind: string, entries: readonly KindEntryLike[]): boolean {
	return parserHiddenOf(findOwnKindEntry(entries, kind), kind);
}

export function parserSupertypeOf(
	entry: KindEntryLike | undefined,
	kind: string,
	declaredSupertypes: ReadonlySet<string>
): boolean {
	return entry === undefined ? declaredSupertypes.has(kind) : entry.supertype === true;
}

const modelKindOwners = new WeakMap<readonly KindEntryLike[], ReadonlyMap<string, KindEntryLike>>();

function modelKindOwner(entries: readonly KindEntryLike[], kind: string): KindEntryLike | undefined {
	let owners = modelKindOwners.get(entries);
	if (owners === undefined) {
		const index = new Map<string, KindEntryLike>();
		for (const entry of entries) {
			const modelKind = modelKindOfEntry(entry, entries);
			if (!index.has(modelKind)) index.set(modelKind, entry);
		}
		owners = index;
		modelKindOwners.set(entries, owners);
	}
	return owners.get(kind);
}

export function findOwnKindEntry<T extends KindEntryLike>(entries: readonly T[], kind: string): T | undefined {
	const owner = modelKindOwner(entries, kind);
	if (owner === undefined) return undefined;
	const entry = findEntryForKindName(entries, kind);
	if (entry !== undefined && modelKindOfEntry(entry, entries) === kind) return entry;
	throw new Error(
		`generated-metadata: kind '${kind}' has catalog row '${owner.kind}' but resolves to ${entry === undefined ? 'no row' : `'${entry.kind}'`}`
	);
}

export function findAnonEntryForLiteralText<T extends KindEntryLike>(
	entries: readonly T[],
	text: string
): T | undefined {
	return entries.find((entry) => entry.anon === true && entry.literalText === text);
}

export function findEntryForLiteralText<T extends KindEntryLike>(entries: readonly T[], text: string): T | undefined {
	return (
		findAnonEntryForLiteralText(entries, text) ??
		entries.find((entry) => entry.literalRule === true && entry.literalText === text) ??
		entries.find((entry) => entry.terminal === true && entry.literalText === text)
	);
}

export function findEntryForPatternValue<T extends KindEntryLike>(entries: readonly T[], value: string): T | undefined {
	return findEntryForLiteralText(entries, value) ?? findEntryForKindName(entries, value);
}

function toEntries(input: GeneratedIdTable | undefined): readonly (readonly [string, GeneratedIdEntry])[] {
	if (!input) return [];
	const entries = input instanceof Map ? [...input.entries()] : Object.entries(input);
	return entries.map(([name, entry]) => [name, typeof entry === 'number' ? { id: entry } : entry]);
}

export interface CatalogSymbolFacts extends SymbolFacts {
	readonly kindEntries: readonly KindEntryLike[];
}

export function catalogSymbolSource(facts: CatalogSymbolFacts): SymbolSource {
	const entryOf = (name: string): KindEntryLike | undefined => findOwnKindEntry(facts.kindEntries, name);
	const isInlined = (name: string): boolean =>
		facts.inline.has(name) && entryOf(name) === undefined;
	const isTerminal = (name: string): boolean => {
		if (!isInlined(name)) return entryOf(name)?.terminal === true;
		const body = facts.rules[name];
		return body !== undefined && terminalContentOf(body, isTerminal);
	};
	return {
		rules: facts.rules,
		externals: facts.externals,
		isTerminal,
		isInlined,
		isHidden: (name) => parserHiddenOf(entryOf(name), name),
		isSupertype: (name) => parserSupertypeOf(entryOf(name), name, facts.supertypes),
		isVisibleExternal: (name) => entryOf(name)?.visibleExternal === true
	};
}
