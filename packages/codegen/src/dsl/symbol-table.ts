import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
	IMMEDIATE_TOKEN,
	INDENT,
	NEWLINE,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	TOKEN
} from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule } from '../types/rule.ts';
import type { GrammarRule } from '../grammar-shapes/grammar-json.ts';
import { assertNever } from '../polymorph-variant.ts';
import {
	isParserHiddenName,
	terminalContentOf,
	type RuleListEntry,
	type SymbolFacts,
	symbolFactsOf,
	type SymbolSource
} from './rule-patterns.ts';
import type { KindParserMetadata, ReservedWordsets } from '../compiler/types.ts';
import { grammarRootNames } from '../util/reachable-rules.ts';
import { ERROR_KIND_ID, ERROR_KIND_NAME } from '@sittir/common/error-kind';

export interface ParserSymbolTable {
	readonly symbols: ReadonlyMap<string, CEnumEntry>;
	readonly names: ReadonlyMap<string, string>;
	readonly facts: ParserSymbolFacts;
}

export function kindTableOfSymbolTable(table: ParserSymbolTable, grammarJson: unknown): JoinedIds {
	const symbolTextFacts = resolveSymbolTextFacts(table.names, collectGrammarFacts(grammarJson));
	const joined = joinIdNames(
		table.symbols,
		table.names,
		deriveSymbolRuntimeName(symbolTextFacts),
		symbolTextFacts,
		table.facts,
		collectLexicalRanks(grammarJson)
	);
	joined.ids.set(ERROR_KIND_NAME, ERROR_KIND_ROW);
	return joined;
}

export const ERROR_KIND_ROW: GeneratedIdEntry = {
	id: ERROR_KIND_ID,
	parser: {
		cSymbol: 'ts_builtin_sym_error',
		parserName: ERROR_KIND_NAME,
		symbolName: ERROR_KIND_NAME,
		anon: false,
		aux: false,
		alias: false,
		hidden: false
	}
};

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

const LITERAL_WRAPPERS = new Set([
	'TOKEN',
	'IMMEDIATE_TOKEN',
	'PREC',
	'PREC_LEFT',
	'PREC_RIGHT',
	'PREC_DYNAMIC',
	'OPTIONAL',
	'REPEAT',
	'REPEAT1',
	'FIELD'
]);

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
		const literalOfCName = new Map([...literals].map((literal) => [sanitizeCIdentifier(literal), literal]));
		const unresolved: string[] = [];
		for (const cName of cNames) {
			const literal = literalOfCName.get(cName.slice('anon_sym_'.length));
			if (literal !== undefined) resolved.set(cName, literal);
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

export interface KindKeyCollision {
	readonly key: string;
	readonly symbols: readonly [string, string];
}

export interface JoinedIds {
	readonly ids: Map<string, GeneratedIdEntry>;
	readonly collisions: readonly KindKeyCollision[];
}

export const KEYWORD_KEY_SUFFIX = '_keyword';
export const PUNCTUATION_KEY_SUFFIX = '_punctuation';

type ParsedIdEntry = GeneratedIdEntry & { readonly parser: KindParserMetadata };

export function joinIdNames(
	ids: ReadonlyMap<string, CEnumEntry>,
	names: ReadonlyMap<string, string>,
	fallbackName: (cName: string) => string,
	symbolTextFacts?: ReadonlyMap<string, SymbolTextFacts>,
	symbolFacts?: ParserSymbolFacts,
	lexicalRanks?: ReadonlyMap<string, number>
): JoinedIds {
	const result = new Map<string, GeneratedIdEntry>();
	const collisions: KindKeyCollision[] = [];
	const place = (key: string, row: ParsedIdEntry): void => {
		const existing = result.get(key);
		const existingParser = existing?.parser;
		if (existing === undefined || existingParser === undefined || existingParser.cSymbol === row.parser.cSymbol) {
			result.set(key, row);
			return;
		}
		if (existingParser.anon !== row.parser.anon) {
			const existingRow: ParsedIdEntry = { ...existing, parser: existingParser };
			const [named, anonymous] = existingParser.anon ? [row, existingRow] : [existingRow, row];
			result.set(key, named);
			if (anonymous.parser.keyword === true) {
				collisions.push({ key, symbols: [named.parser.cSymbol, anonymous.parser.cSymbol] });
				return;
			}
			place(`${key}${PUNCTUATION_KEY_SUFFIX}`, anonymous);
			return;
		}
		if (!shouldReplaceSymbol(existingParser.cSymbol, row.parser.cSymbol)) {
			if (row.parser.alias) {
				if (row.parser.symbolName !== undefined && row.parser.symbolName !== existingParser.symbolName) {
					result.set(key, { id: existing.id, parseId: row.id, parseName: row.parser.symbolName, parser: existingParser });
				}
				return;
			}
			collisions.push({ key, symbols: [existingParser.cSymbol, row.parser.cSymbol] });
			return;
		}
		result.set(key, row);
	};
	for (const entry of ids.values()) {
		const key = fallbackName(entry.cName);
		place(key, { id: entry.id, parser: createParserMetadata(entry, key, names, symbolTextFacts, symbolFacts, lexicalRanks) });
	}
	return { ids: result, collisions };
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
			const spelled = cName.slice('anon_sym_'.length);
			if (keywordTextOf(cName, symbolTextFacts) !== undefined) return `${spelled}${KEYWORD_KEY_SUFFIX}`;
			const text = symbolTextFacts.get(cName)?.literalText;
			if (text !== undefined && cName === `anon_sym_${text}`) return text.length <= 1 ? 'underscore' : `underscore${text.length}`;
			if (text !== undefined && spelled === sanitizeCIdentifier(text)) return sanitizeCIdentifier(text, (word) => word.toLowerCase());
			return spelled.toLowerCase();
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

export interface ReservedWordset {
	readonly words: readonly string[];
	readonly nonLiteral: readonly string[];
}

export function reservedWordset(
	reserved: ReservedWordsets | undefined,
	wordset: string,
	entries: readonly KindEntryLike[]
): ReservedWordset {
	const words: string[] = [];
	const nonLiteral: string[] = [];
	for (const member of reserved?.[wordset] ?? []) {
		const text =
			member.type === STRING
				? member.value
				: member.type === SYMBOL
					? findEntryForKindName(entries, member.name)?.literalText
					: undefined;
		if (text === undefined) nonLiteral.push(member.type === SYMBOL ? member.name : member.type);
		else words.push(text);
	}
	return { words, nonLiteral };
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
		hasSymbol: (name) => entryOf(name) !== undefined,
		isTerminal,
		isInlined,
		isHidden: (name) => parserHiddenOf(entryOf(name), name),
		isSupertype: (name) => parserSupertypeOf(entryOf(name), name, facts.supertypes),
		isVisibleExternal: (name) => entryOf(name)?.visibleExternal === true
	};
}

export type PredictorRule = AnyRule | GrammarRule;

export interface PredictedGrammar {
	readonly rules: Readonly<Record<string, PredictorRule>>;
	readonly extras: readonly RuleListEntry[];
	readonly externals: readonly RuleListEntry[];
	readonly supertypes: readonly string[];
	readonly inline: readonly string[];
	readonly word: string | null;
}

interface AliasFact {
	readonly value: string;
	readonly named: boolean;
}

interface MetaParams {
	token?: true;
	immediate?: true;
	alias?: AliasFact;
	field?: string;
	prec?: Record<string, number | string>;
}

type InternedRule =
	| { readonly type: 'BLANK' }
	| { readonly type: 'STRING'; readonly value: string }
	| { readonly type: 'PATTERN'; readonly value: string }
	| { readonly type: 'SYM'; readonly key: string }
	| { readonly type: 'SEQ' | 'CHOICE'; readonly members: readonly InternedRule[] }
	| { readonly type: 'REPEAT'; readonly content: InternedRule }
	| { readonly type: 'META'; readonly params: MetaParams; readonly rule: InternedRule };

type VariableKind = 'named' | 'hidden' | 'anonymous' | 'auxiliary';

interface Variable {
	name: string;
	kind: VariableKind;
	rule: InternedRule;
}

interface ProductionStep {
	readonly key: string;
	alias?: AliasFact;
}

const BLANK_RULE: InternedRule = { type: 'BLANK' };

function sameShape(a: unknown, b: unknown): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

function withMeta(content: InternedRule, set: (params: MetaParams) => void): InternedRule {
	if (content.type === 'META' && content.params.token !== true) {
		const params = { ...content.params };
		set(params);
		return { type: 'META', params, rule: content.rule };
	}
	const params: MetaParams = {};
	set(params);
	return { type: 'META', params, rule: content };
}

function internRule(rule: PredictorRule, resolve: (name: string) => string): InternedRule {
	switch (rule.type) {
		case 'BLANK':
			return BLANK_RULE;
		case OPTIONAL:
			return { type: 'CHOICE', members: [internRule(rule.content, resolve), BLANK_RULE] };
		case STRING:
			return { type: 'STRING', value: rule.value };
		case PATTERN:
			return { type: 'PATTERN', value: rule.value };
		case SYMBOL:
			return { type: 'SYM', key: resolve(rule.name) };
		case SEQ:
		case CHOICE:
			return rule.members.length === 0
				? BLANK_RULE
				: { type: rule.type, members: rule.members.map((member) => internRule(member, resolve)) };
		case REPEAT:
			return { type: 'CHOICE', members: [{ type: 'REPEAT', content: internRule(rule.content, resolve) }, BLANK_RULE] };
		case REPEAT1:
			return { type: 'REPEAT', content: internRule(rule.content, resolve) };
		case TOKEN:
			return withMeta(internRule(rule.content, resolve), (params) => {
				params.token = true;
				if ('immediate' in rule && rule.immediate === true) params.immediate = true;
			});
		case IMMEDIATE_TOKEN:
			return withMeta(internRule(rule.content, resolve), (params) => {
				params.token = true;
				params.immediate = true;
			});
		case ALIAS:
			return withMeta(internRule(rule.content, resolve), (params) => {
				params.alias = { value: rule.value, named: rule.named };
			});
		case FIELD:
			return withMeta(internRule(rule.content, resolve), (params) => {
				params.field = rule.name;
			});
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
			return withMeta(internRule(rule.content, resolve), (params) => {
				params.prec = { ...params.prec, [rule.type]: rule.value };
			});
		case SUPERTYPE:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			throw new Error(`symbol-table: a ${rule.type} rule has no parser symbol to predict`);
		default:
			return assertNever(rule);
	}
}

class TokenExtractor {
	readonly lexical: Variable[] = [];
	readonly usage: number[] = [];
	#owner = '';
	#count = 0;

	extractFrom(owner: string, rule: InternedRule): InternedRule {
		this.#owner = owner;
		this.#count = 0;
		return this.#extractIn(rule);
	}

	#extractIn(rule: InternedRule): InternedRule {
		switch (rule.type) {
			case 'STRING':
				return this.#extract(rule, rule.value);
			case 'PATTERN':
				return this.#extract(rule, undefined);
			case 'META': {
				if (rule.params.token !== true) return { type: 'META', params: rule.params, rule: this.#extractIn(rule.rule) };
				const { token: _token, ...params } = rule.params;
				const text = rule.rule.type === 'STRING' ? rule.rule.value : undefined;
				return this.#extract(Object.keys(params).length === 0 ? rule.rule : rule, text);
			}
			case 'REPEAT':
				return { type: 'REPEAT', content: this.#extractIn(rule.content) };
			case 'SEQ':
			case 'CHOICE':
				return { type: rule.type, members: rule.members.map((member) => this.#extractIn(member)) };
			default:
				return rule;
		}
	}

	#extract(rule: InternedRule, text: string | undefined): InternedRule {
		const existing = this.lexical.findIndex((variable) => sameShape(variable.rule, rule));
		if (existing >= 0) {
			this.usage[existing]!++;
			return { type: 'SYM', key: `t:${existing}` };
		}
		this.lexical.push(
			text === undefined
				? { name: `${this.#owner}_token${++this.#count}`, kind: 'auxiliary', rule }
				: { name: text, kind: 'anonymous', rule }
		);
		this.usage.push(1);
		return { type: 'SYM', key: `t:${this.lexical.length - 1}` };
	}
}

function mapSymbolKeys(rule: InternedRule, map: (key: string) => string): InternedRule {
	switch (rule.type) {
		case 'SYM':
			return { type: 'SYM', key: map(rule.key) };
		case 'META':
			return { ...rule, rule: mapSymbolKeys(rule.rule, map) };
		case 'REPEAT':
			return { ...rule, content: mapSymbolKeys(rule.content, map) };
		case 'SEQ':
		case 'CHOICE':
			return { ...rule, members: rule.members.map((member) => mapSymbolKeys(member, map)) };
		default:
			return rule;
	}
}

function productionsOf(rule: InternedRule, alias?: AliasFact): ProductionStep[][] {
	switch (rule.type) {
		case 'BLANK':
			return [[]];
		case 'SYM':
			return [[alias === undefined ? { key: rule.key } : { key: rule.key, alias }]];
		case 'META':
			return productionsOf(rule.rule, rule.params.alias ?? alias);
		case 'CHOICE': {
			const productions: ProductionStep[][] = [];
			for (const member of rule.members) {
				for (const production of productionsOf(member, alias)) {
					if (!productions.some((known) => sameShape(known, production))) productions.push(production);
				}
			}
			return productions;
		}
		case 'SEQ': {
			let productions: ProductionStep[][] = [[]];
			for (const member of rule.members) {
				const tails = productionsOf(member, alias);
				productions = productions.flatMap((head) => tails.map((tail) => [...head, ...tail]));
			}
			return productions;
		}
		default:
			throw new Error(`symbol-table: a ${rule.type} survived token extraction`);
	}
}

const C_SYMBOL_CHARACTER_NAMES: Readonly<Record<string, string>> = {
	'~': 'TILDE',
	'`': 'BQUOTE',
	'!': 'BANG',
	'@': 'AT',
	'#': 'POUND',
	$: 'DOLLAR',
	'%': 'PERCENT',
	'^': 'CARET',
	'&': 'AMP',
	'*': 'STAR',
	'(': 'LPAREN',
	')': 'RPAREN',
	'-': 'DASH',
	'+': 'PLUS',
	'=': 'EQ',
	'{': 'LBRACE',
	'}': 'RBRACE',
	'[': 'LBRACK',
	']': 'RBRACK',
	'\\': 'BSLASH',
	'|': 'PIPE',
	':': 'COLON',
	';': 'SEMI',
	'"': 'DQUOTE',
	"'": 'SQUOTE',
	'<': 'LT',
	'>': 'GT',
	',': 'COMMA',
	'.': 'DOT',
	'?': 'QMARK',
	'/': 'SLASH',
	'\n': 'LF',
	'\r': 'CR',
	'\t': 'TAB',
	'\0': 'NULL'
};

const C_CONTROL_CHARACTER_NAMES = [
	'NULL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL', 'BS', 'TAB', 'LF', 'VTAB', 'FF', 'CR', 'SO', 'SI',
	'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB', 'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US'
] as const;

function sanitizeCIdentifier(name: string, spellReplacement: (word: string) => string = (word) => word): string {
	let identifier = '';
	for (const character of name) {
		if (/[A-Za-z0-9_]/.test(character)) {
			identifier += character;
			continue;
		}
		const codePoint = character.codePointAt(0)!;
		const replacement =
			character === ' ' && name.length === 1
				? 'SPACE'
				: (C_SYMBOL_CHARACTER_NAMES[character] ?? C_CONTROL_CHARACTER_NAMES[codePoint]);
		if (replacement !== undefined) {
			if (identifier.length > 0 && !identifier.endsWith('_')) identifier += '_';
			identifier += spellReplacement(replacement);
			continue;
		}
		for (let unit = 0; unit < character.length; unit++) {
			identifier += `u${character.charCodeAt(unit).toString(16).padStart(4, '0')}`;
		}
	}
	return identifier;
}

function referencedNames(rule: PredictorRule, into: string[]): void {
	if (rule.type === SYMBOL) into.push(rule.name);
	if ('members' in rule) for (const member of rule.members) referencedNames(member, into);
	if ('content' in rule) referencedNames(rule.content, into);
}

function liveRuleNames(grammar: PredictedGrammar): ReadonlySet<string> {
	const live = new Set<string>();
	const pending = grammarRootNames(grammar);
	while (pending.length > 0) {
		const name = pending.pop()!;
		if (live.has(name) || !(name in grammar.rules)) continue;
		live.add(name);
		referencedNames(grammar.rules[name]!, pending);
	}
	return live;
}

function expandRepeats(variables: Variable[]): Variable[] {
	const auxiliaries: Variable[] = [];
	const expansions = new Map<string, string>();
	for (const variable of variables) {
		let count = 0;
		const repeatOf = (key: string, inner: InternedRule): InternedRule => ({
			type: 'CHOICE',
			members: [{ type: 'SEQ', members: [{ type: 'SYM', key }, { type: 'SYM', key }] }, inner]
		});
		const expand = (rule: InternedRule): InternedRule => {
			switch (rule.type) {
				case 'REPEAT': {
					const inner = expand(rule.content);
					const known = expansions.get(JSON.stringify(inner));
					if (known !== undefined) return { type: 'SYM', key: known };
					const name = `${variable.name}_repeat${++count}`;
					const key = `nt:${name}`;
					expansions.set(JSON.stringify(inner), key);
					auxiliaries.push({ name, kind: 'auxiliary', rule: repeatOf(key, inner) });
					return { type: 'SYM', key };
				}
				case 'META':
					return { ...rule, rule: expand(rule.rule) };
				case 'SEQ':
				case 'CHOICE':
					return { ...rule, members: rule.members.map(expand) };
				default:
					return rule;
			}
		};
		if (variable.kind === 'hidden' && variable.rule.type === 'REPEAT') {
			variable.rule = repeatOf(`nt:${variable.name}`, expand(variable.rule.content));
			variable.kind = 'auxiliary';
		} else variable.rule = expand(variable.rule);
	}
	return [...variables, ...auxiliaries];
}

function defaultAliasesOf(
	productions: ReadonlyMap<string, ProductionStep[][]>,
	reachable: ReadonlySet<string>,
	inline: ReadonlySet<string>
): ReadonlyMap<string, AliasFact> {
	const uses = new Map<string, { unaliased: boolean; readonly counts: [AliasFact, number][] }>();
	for (const [owner, ownerProductions] of productions) {
		if (!reachable.has(owner)) continue;
		for (const step of ownerProductions.flat()) {
			if (inline.has(step.key)) continue;
			const use = uses.get(step.key) ?? { unaliased: false, counts: [] };
			uses.set(step.key, use);
			if (step.alias === undefined) {
				use.unaliased = true;
				continue;
			}
			const counted = use.counts.find(([alias]) => sameShape(alias, step.alias));
			if (counted !== undefined) counted[1]++;
			else use.counts.push([step.alias, 1]);
		}
	}
	const defaults = new Map<string, AliasFact>();
	for (const [key, use] of uses) {
		if (use.unaliased || use.counts.length === 0) continue;
		let best = use.counts[0]!;
		for (const counted of use.counts) if (counted[1] > best[1]) best = counted;
		defaults.set(key, best[0]);
	}
	return defaults;
}

function clearDefaultAliases(
	productions: ReadonlyMap<string, ProductionStep[][]>,
	defaults: ReadonlyMap<string, AliasFact>
): void {
	for (const ownerProductions of productions.values()) {
		const cleared: ProductionStep[] = [];
		ownerProductions.forEach((production, index) =>
			production.forEach((step, position) => {
				if (step.alias === undefined || !sameShape(step.alias, defaults.get(step.key))) return;
				const conflicts = ownerProductions.some(
					(other, otherIndex) =>
						otherIndex !== index &&
						other.length > position &&
						other[position]!.alias !== undefined &&
						!sameShape(other[position]!.alias, step.alias)
				);
				if (!conflicts) cleared.push(step);
			})
		);
		for (const step of cleared) delete step.alias;
	}
}

export interface PredictedSymbolTable extends ParserSymbolTable {
	readonly undefinedNames: readonly string[];
}

export function predictSymbolTable(grammar: PredictedGrammar): PredictedSymbolTable {
	const live = liveRuleNames(grammar);
	const supertypes = new Set(grammar.supertypes);
	const undefinedNames = new Set<string>();
	const resolve = (name: string): string => {
		if (live.has(name)) return `nt:${name}`;
		const index = grammar.externals.findIndex((entry) => entry.type === SYMBOL && entry.name === name);
		if (index >= 0) return `ext:${index}`;
		undefinedNames.add(name);
		return `undef:${name}`;
	};
	let variables: Variable[] = Object.keys(grammar.rules)
		.filter((name) => live.has(name))
		.map((name) => ({
			name,
			kind: supertypes.has(name) || name.startsWith('_') ? 'hidden' : 'named',
			rule: internRule(grammar.rules[name]!, resolve)
		}));
	const externals: Variable[] = grammar.externals.map((entry, index) =>
		entry.type === SYMBOL
			? {
					name: entry.name,
					kind: entry.name.startsWith('_') ? 'hidden' : 'named',
					rule: { type: 'SYM', key: entry.name in grammar.rules ? `nt:${entry.name}` : `ext:${index}` }
				}
			: { name: entry.value, kind: 'anonymous', rule: { type: entry.type, value: entry.value } }
	);

	const tokens = new TokenExtractor();
	const wordFirst = [...variables].sort((a, b) => Number(b.name === grammar.word) - Number(a.name === grammar.word));
	for (const variable of wordFirst) variable.rule = tokens.extractFrom(variable.name, variable.rule);
	for (const external of externals) external.rule = tokens.extractFrom(external.name, external.rule);
	const replaced = new Map<string, string>();
	variables = variables.filter((variable, index) => {
		if (index === 0 || variable.rule.type !== 'SYM' || !variable.rule.key.startsWith('t:')) return true;
		const tokenIndex = Number(variable.rule.key.slice(2));
		const token = tokens.lexical[tokenIndex]!;
		if (tokens.usage[tokenIndex] !== 1 || (token.kind !== 'auxiliary' && variable.kind === 'hidden')) return true;
		token.kind = variable.kind;
		token.name = variable.name;
		replaced.set(`nt:${variable.name}`, variable.rule.key);
		return false;
	});
	const replace = (key: string): string => replaced.get(key) ?? key;
	for (const variable of [...variables, ...externals]) variable.rule = mapSymbolKeys(variable.rule, replace);

	const extraKeys = grammar.extras.flatMap((entry) => {
		if (entry.type === SYMBOL) return [replace(resolve(entry.name))];
		const lexical = internRule(entry, resolve);
		const index = tokens.lexical.findIndex((token) => sameShape(token.rule, lexical));
		return index < 0 ? [] : [`t:${index}`];
	});
	const externalKey = (index: number): string => {
		const rule = externals[index]!.rule;
		return rule.type === 'SYM' && rule.key.startsWith('t:') ? rule.key : `ext:${index}`;
	};
	const canonical = (key: string): string => (key.startsWith('ext:') ? externalKey(Number(key.slice(4))) : key);
	for (const variable of variables) variable.rule = mapSymbolKeys(variable.rule, canonical);

	const syntax = expandRepeats(variables);
	const byKey = new Map(syntax.map((variable) => [`nt:${variable.name}`, variable]));
	const productions = new Map(syntax.map((variable) => [`nt:${variable.name}`, productionsOf(variable.rule)]));
	const inline = new Set(grammar.inline.filter((name) => live.has(name)).map((name) => replace(resolve(name))));
	const reachable = new Set<string>();
	const queue = [`nt:${variables[0]!.name}`, ...extraKeys];
	while (queue.length > 0) {
		const key = queue.shift()!;
		if (reachable.has(key)) continue;
		reachable.add(key);
		for (const step of (productions.get(key) ?? []).flat()) queue.push(step.key);
	}
	externals.forEach((_, index) => reachable.add(externalKey(index)));

	const defaults = defaultAliasesOf(productions, reachable, inline);
	clearDefaultAliases(productions, defaults);
	const variableOf = (key: string): Variable =>
		key.startsWith('nt:')
			? byKey.get(key)!
			: key.startsWith('t:')
				? tokens.lexical[Number(key.slice(2))]!
				: externals[Number(key.slice(4))]!;
	const displayOf = (key: string): { readonly name: string; readonly named: boolean; readonly visible: boolean } => {
		const alias = defaults.get(key);
		if (alias !== undefined) return { name: alias.value, named: alias.named, visible: true };
		const { name, kind } = variableOf(key);
		return { name, named: kind === 'named' || kind === 'hidden', visible: kind === 'named' || kind === 'anonymous' };
	};

	const order = [
		...tokens.lexical.map((_, index) => `t:${index}`).filter((key) => reachable.has(key)),
		...externals.map((_, index) => externalKey(index)).filter((key) => key.startsWith('ext:') && reachable.has(key)),
		...syntax.map((variable) => `nt:${variable.name}`).filter((key) => reachable.has(key) && !inline.has(key))
	];
	const tokenCount = 1 + order.filter((key) => !key.startsWith('nt:')).length;
	const usedCNames = new Set<string>();
	const uniqueCName = (base: string): string => {
		let cName = base;
		for (let suffix = 2; usedCNames.has(cName); suffix++) cName = `${base}${suffix}`;
		usedCNames.add(cName);
		return cName;
	};
	const cNameOf = new Map(
		order.map((key) => {
			const { name, kind } = variableOf(key);
			const prefix = kind === 'anonymous' ? 'anon_sym_' : kind === 'auxiliary' ? 'aux_sym_' : 'sym_';
			return [key, uniqueCName(prefix + sanitizeCIdentifier(name))];
		})
	);

	const aliasedNonTerminals = new Set<string>();
	const aliasSymbols: AliasFact[] = [];
	for (const [owner, ownerProductions] of productions) {
		if (!reachable.has(owner)) continue;
		for (const step of ownerProductions.flat()) {
			if (step.alias === undefined) continue;
			if (step.key.startsWith('nt:') && !sameShape(step.alias, defaults.get(step.key))) aliasedNonTerminals.add(step.key);
			const alias = step.alias;
			const named = order.some((key) => {
				const display = displayOf(key);
				return display.name === alias.value && display.named === alias.named;
			});
			if (!named && !aliasSymbols.some((known) => sameShape(known, alias))) aliasSymbols.push(alias);
		}
	}

	const symbols = new Map<string, CEnumEntry>();
	const names = new Map<string, string>();
	const visible = new Map<string, boolean>();
	const namedFlags = new Map<string, boolean>();
	const supertypeCNames = new Set<string>();
	const aliasedNonTerminalCNames = new Set<string>();
	for (const key of order) {
		const cName = cNameOf.get(key)!;
		const display = displayOf(key);
		symbols.set(cName, { cName, id: symbols.size + 1 });
		names.set(cName, display.name);
		visible.set(cName, display.visible);
		namedFlags.set(cName, display.named);
		if (key.startsWith('nt:') && supertypes.has(variableOf(key).name)) supertypeCNames.add(cName);
		if (aliasedNonTerminals.has(key)) aliasedNonTerminalCNames.add(cName);
	}
	aliasSymbols.sort((a, b) => (a.value < b.value ? -1 : a.value > b.value ? 1 : Number(a.named) - Number(b.named)));
	for (const alias of aliasSymbols) {
		const cName = uniqueCName(`alias_sym_${sanitizeCIdentifier(alias.value)}`);
		symbols.set(cName, { cName, id: symbols.size + 1 });
		names.set(cName, alias.value);
		visible.set(cName, true);
		namedFlags.set(cName, alias.named);
	}
	return {
		symbols,
		names,
		facts: {
			aliasedNonTerminals: aliasedNonTerminalCNames,
			visible,
			named: namedFlags,
			supertypes: supertypeCNames,
			tokenCount
		},
		undefinedNames: [...undefinedNames]
	};
}

export type PredictedKinds =
	| { readonly entries: readonly GeneratedKindEntry[]; readonly keyCollisions: readonly KindKeyCollision[] }
	| { readonly failure: string; readonly undefinedNames: readonly string[] };

export function undefinedNamesOf(kinds: PredictedKinds | undefined): readonly string[] {
	return kinds !== undefined && 'failure' in kinds ? kinds.undefinedNames : [];
}

export function predictedEntriesOf(kinds: PredictedKinds | undefined): readonly GeneratedKindEntry[] {
	return kinds !== undefined && 'entries' in kinds ? kinds.entries : [];
}

const PREDICTED_KIND_FIELDS = [
	'id',
	'parseId',
	'symbolName',
	'literalText',
	'anon',
	'literalRule',
	'alias',
	'hidden',
	'keyword',
	'aliasedNonTerminal',
	'supertype',
	'terminal',
	'visibleExternal',
	'parseName'
] as const satisfies readonly (keyof GeneratedKindEntry)[];

export function assertPredictedKindEntries(
	predicted: readonly GeneratedKindEntry[],
	catalog: readonly GeneratedKindEntry[]
): void {
	const predictedByKind = new Map(predicted.map((entry) => [entry.kind, entry]));
	const catalogKinds = new Set(catalog.map((entry) => entry.kind));
	const disagreements: string[] = [];
	for (const entry of catalog) {
		const row = predictedByKind.get(entry.kind);
		if (row === undefined) {
			disagreements.push(`${entry.kind}: in the catalog, not predicted`);
			continue;
		}
		for (const field of PREDICTED_KIND_FIELDS) {
			if (row[field] !== entry[field]) {
				disagreements.push(
					`${entry.kind}.${field}: predicted ${JSON.stringify(row[field])}, catalog ${JSON.stringify(entry[field])}`
				);
			}
		}
	}
	for (const entry of predicted) {
		if (!catalogKinds.has(entry.kind)) disagreements.push(`${entry.kind}: predicted, not in the catalog`);
	}
	if (disagreements.length > 0) {
		throw new Error(`symbol-table: the predicted kind catalog disagrees with the parser's:\n  ${disagreements.join('\n  ')}`);
	}
}

export interface PredictedKindCatalog {
	readonly entries: readonly GeneratedKindEntry[];
	readonly undefinedNames: readonly string[];
	readonly keyCollisions: readonly KindKeyCollision[];
}

export function predictKindCatalog(
	grammar: PredictedGrammar & { readonly visibleExternals?: Readonly<Record<string, unknown>> }
): PredictedKindCatalog {
	const table = predictSymbolTable(grammar);
	const { ids: kindIds, collisions } = kindTableOfSymbolTable(table, grammar);
	const entries = collectGeneratedKindEntries(stampVisibleExternals({ kindIds, sourceArtifact: 'predicted' }, grammar)).map(
		({ lexicalRank: _lexicalRank, ...entry }) => entry
	);
	return { entries, undefinedNames: table.undefinedNames, keyCollisions: collisions };
}

export function predictedKindsOf(
	grammar: PredictedGrammar & { readonly visibleExternals?: Readonly<Record<string, unknown>> }
): PredictedKinds {
	try {
		const { entries, undefinedNames, keyCollisions } = predictKindCatalog(grammar);
		if (undefinedNames.length === 0) return { entries, keyCollisions };
		return {
			failure: `symbol-table: ${undefinedNames.map((name) => `'${name}'`).join(', ')} name no rule and no external`,
			undefinedNames
		};
	} catch (error) {
		return { failure: error instanceof Error ? error.message : String(error), undefinedNames: [] };
	}
}

export function kindCatalogOf(
	tables: GeneratedIdTables | undefined,
	grammar: { readonly predictedKinds?: PredictedKinds }
): readonly GeneratedKindEntry[] {
	return tables === undefined
		? predictedEntriesOf(grammar.predictedKinds)
		: collectGeneratedKindEntries(tables);
}

export function catalogRenames(names: Iterable<string>, entries: readonly KindEntryLike[]): ReadonlyMap<string, string> {
	const renames = new Map<string, string>();
	for (const name of names) {
		const entry = findEntryForKindName(entries, name);
		if (entry === undefined || entry.kind !== name || entry.symbolName === undefined || !isRenamedEntry(entry, entries)) {
			continue;
		}
		renames.set(name, entry.symbolName);
	}
	return renames;
}

export function renameAwareSymbolSource(facts: CatalogSymbolFacts): SymbolSource {
	const renames = catalogRenames([...Object.keys(facts.rules), ...facts.externals], facts.kindEntries);
	const catalog = catalogSymbolSource(facts);
	const asked = (name: string): string => renames.get(name) ?? name;
	return {
		rules: catalog.rules,
		externals: catalog.externals,
		hasSymbol: (name) => catalog.hasSymbol(asked(name)),
		isTerminal: (name) => catalog.isTerminal(asked(name)),
		isInlined: (name) => catalog.isInlined(asked(name)),
		isHidden: (name) => catalog.isHidden(asked(name)),
		isSupertype: (name) => catalog.isSupertype(asked(name)),
		isVisibleExternal: (name) => catalog.isVisibleExternal(asked(name))
	};
}

export function predictedSymbolSourceOf(
	grammar: PredictedGrammar & {
		readonly rules: Readonly<Record<string, AnyRule>>;
		readonly visibleExternals?: Readonly<Record<string, unknown>>;
	}
): SymbolSource {
	return renameAwareSymbolSource({ ...symbolFactsOf(grammar), kindEntries: predictKindCatalog(grammar).entries });
}
