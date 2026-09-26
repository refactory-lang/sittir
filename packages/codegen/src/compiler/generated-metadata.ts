import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { loadWebTreeSitter } from '../engine-loader.ts';
import { type KindParserMetadata } from './types.ts';
import type * as TS from 'web-tree-sitter';

export interface GeneratedIdEntry {
	readonly id?: number;
	readonly parseId?: number;
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
	readonly symbolName?: string;
	readonly literalText?: string;
	readonly anon?: boolean;
	readonly literalRule?: boolean;
	readonly alias?: boolean;
	readonly hidden?: boolean;
	readonly keyword?: boolean;
	readonly aliasedNonTerminal?: boolean;
	readonly lexicalRank?: number;
}

export interface TreeSitterLanguageMetadata {
	readonly nodeTypeCount: number;
	readonly fieldCount: number;
	nodeTypeForId(id: number): string | null;
	nodeTypeIsVisible(id: number): boolean;
	nodeTypeIsNamed(id: number): boolean;
	fieldNameForId(id: number): string | null;
}

export async function loadGeneratedIdTables(grammar: string): Promise<GeneratedIdTables | undefined> {
	const parserCPath = join(process.cwd(), 'packages', grammar, '.sittir', 'src', 'parser.c');
	if (existsSync(parserCPath)) {
		const grammarJsonPath = join(dirname(parserCPath), 'grammar.json');
		const grammarJson = existsSync(grammarJsonPath) ? JSON.parse(readFileSync(grammarJsonPath, 'utf8')) : undefined;
		return deriveGeneratedIdTablesFromParserCSource(
			readFileSync(parserCPath, 'utf8'),
			`packages/${grammar}/.sittir/src/parser.c`,
			grammarJson
		);
	}

	const wasmPath = join(process.cwd(), 'packages', grammar, '.sittir', 'parser.wasm');
	if (!existsSync(wasmPath)) return undefined;

	const { Language } = await loadWebTreeSitter();
	const language = (await Language.load(wasmPath)) as TreeSitterLanguageMetadata;
	return deriveGeneratedIdTablesFromLanguage(language, `packages/${grammar}/.sittir/parser.wasm`);
}

export function deriveGeneratedIdTablesFromLanguage(
	language: TreeSitterLanguageMetadata,
	sourceArtifact: string
): GeneratedIdTables {
	return {
		kindIds: collectKindIds(language),
		fieldIds: collectFieldIds(language),
		sourceArtifact
	};
}

export async function deriveGeneratedIdTablesFromParserCSource(
	source: string,
	sourceArtifact: string,
	grammarJson?: unknown
): Promise<GeneratedIdTables> {
	const parser = await loadCParser();
	const symbolIds = collectEnumIds(parser, source, 'enum ts_symbol_identifiers');
	const fieldIds = collectEnumIds(parser, source, 'enum ts_field_identifiers');
	const symbolNames = collectNameTable(parser, source, 'static const char * const ts_symbol_names[]');
	const fieldNames = collectNameTable(parser, source, 'static const char * const ts_field_names[]');
	const aliasedNonTerminals = collectAliasedNonTerminals(parser, source);
	const symbolTextFacts = resolveSymbolTextFacts(symbolNames, collectGrammarFacts(grammarJson));
	const lexicalRanks = collectLexicalRanks(grammarJson);

	return {
		kindIds: joinIdNames(symbolIds, symbolNames, deriveSymbolRuntimeName(symbolTextFacts), symbolTextFacts, aliasedNonTerminals, lexicalRanks),
		fieldIds: joinIdNames(fieldIds, fieldNames, deriveFieldRuntimeName),
		sourceArtifact
	};
}

interface GrammarFacts {
	readonly aliasTargetNames: ReadonlySet<string>;
	readonly stringLiterals: ReadonlySet<string>;
	readonly literalRules: ReadonlyMap<string, string>;
}

function collectGrammarFacts(grammarJson: unknown): GrammarFacts {
	const aliasTargetNames = new Set<string>();
	const stringLiterals = new Set<string>();
	const literalRules = new Map<string, string>();
	const rules = (grammarJson as { rules?: Record<string, unknown> } | undefined)?.rules;
	if (rules) {
		for (const [name, rule] of Object.entries(rules)) {
			const literalValue = literalRuleValue(rule);
			if (literalValue !== undefined) literalRules.set(name, literalValue);
		}
		for (const rule of Object.values(rules)) {
			walkGrammarNode(rule, aliasTargetNames, stringLiterals, literalRules);
		}
	}
	return { aliasTargetNames, stringLiterals, literalRules };
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
	aliasTargetNames: Set<string>,
	stringLiterals: Set<string>,
	literalRules: Map<string, string>
): void {
	if (Array.isArray(node)) {
		for (const child of node) walkGrammarNode(child, aliasTargetNames, stringLiterals, literalRules);
		return;
	}
	if (node === null || typeof node !== 'object') return;
	const record = node as Record<string, unknown>;
	if (record.type === 'STRING' && typeof record.value === 'string') stringLiterals.add(record.value);
	if (record.type === 'ALIAS' && record.named === true && typeof record.value === 'string') {
		aliasTargetNames.add(record.value);
	}
	if (record.type === 'ALIAS' && record.named === false && typeof record.value === 'string') {
		const content = record.content as Record<string, unknown> | undefined;
		if (content?.type === 'SYMBOL' && typeof content.name === 'string') literalRules.set(content.name, record.value as string);
	}
	for (const value of Object.values(record)) walkGrammarNode(value, aliasTargetNames, stringLiterals, literalRules);
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
	for (const [cName, displayName] of names) {
		if (cName.startsWith('anon_sym_')) {
			if (grammar.aliasTargetNames.has(displayName)) {
				const rawSuffix = cName.slice('anon_sym_'.length);
				if (!grammar.stringLiterals.has(rawSuffix)) {
					throw new Error(
						`generated-metadata: aliased token ${cName} (display ${JSON.stringify(displayName)}) has no verbatim literal`
					);
				}
				result.set(cName, { literalText: rawSuffix });
				continue;
			}
			result.set(cName, { literalText: displayName });
			continue;
		}
		if (cName.startsWith('sym_')) {
			const ruleName = cName.slice('sym_'.length);
			const literalValue = grammar.literalRules.get(ruleName);
			if (literalValue === undefined) continue;
			const isNamedAliasTarget = grammar.aliasTargetNames.has(displayName);
			if (isNamedAliasTarget) continue;
			result.set(cName, { literalText: literalValue, literalRule: true });
		}
	}
	return result;
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
}

export function findEntryForKindName<T extends KindEntryLike>(entries: readonly T[], name: string): T | undefined {
	return (
		entries.find((entry) => entry.kind === name && entry.alias !== true) ??
		entries.find((entry) => entry.kind === `_${name}`) ??
		entries.find((entry) => entry.anon === true && entry.symbolName === name) ??
		entries.find((entry) => entry.anon !== true && entry.symbolName === name) ??
		undefined
	);
}

export function modelKindOfEntry(entry: { readonly kind: string; readonly symbolName?: string; readonly alias?: boolean }): string {
	return entry.alias === true && entry.symbolName !== undefined ? entry.symbolName : entry.kind;
}

export function findOwnKindEntry<T extends KindEntryLike>(entries: readonly T[], kind: string): T | undefined {
	const entry = findEntryForKindName(entries, kind);
	return entry !== undefined && modelKindOfEntry(entry) === kind ? entry : undefined;
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
		entries.find((entry) => entry.literalRule === true && entry.literalText === text)
	);
}

export function findEntryForPatternValue<T extends KindEntryLike>(entries: readonly T[], value: string): T | undefined {
	return findEntryForLiteralText(entries, value) ?? findEntryForKindName(entries, value);
}

function collectKindIds(language: TreeSitterLanguageMetadata): Map<string, number> {
	const result = new Map<string, number>();
	const namedness = new Map<string, boolean>();

	for (let id = 0; id < language.nodeTypeCount; id += 1) {
		if (!language.nodeTypeIsVisible(id)) continue;
		const name = language.nodeTypeForId(id);
		if (!name) continue;

		const isNamed = language.nodeTypeIsNamed(id);
		const existingIsNamed = namedness.get(name);
		if (existingIsNamed === true) continue;
		if (existingIsNamed === undefined || isNamed) {
			result.set(name, id);
			namedness.set(name, isNamed);
		}
	}

	return result;
}

function collectFieldIds(language: TreeSitterLanguageMetadata): Map<string, number> {
	const result = new Map<string, number>();

	for (let id = 1; id <= language.fieldCount; id += 1) {
		const name = language.fieldNameForId(id);
		if (name) result.set(name, id);
	}

	return result;
}

function toEntries(input: GeneratedIdTable | undefined): readonly (readonly [string, GeneratedIdEntry])[] {
	if (!input) return [];
	const entries = input instanceof Map ? [...input.entries()] : Object.entries(input);
	return entries.map(([name, entry]) => [name, typeof entry === 'number' ? { id: entry } : entry]);
}

type CParser = TS.Parser;
type CNode = TS.Node;

interface CEnumEntry {
	readonly cName: string;
	readonly id: number;
}

async function loadCParser(): Promise<CParser> {
	const { Parser, Language } = await loadWebTreeSitter();
	const parser = new Parser();
	const language = (await Language.load(resolveTreeSitterCWasmPath())) as TS.Language;
	parser.setLanguage(language);
	return parser;
}

function resolveTreeSitterCWasmPath(): string {
	const require = createRequire(import.meta.url);
	try {
		return require.resolve('tree-sitter-c/tree-sitter-c.wasm');
	} catch {
		const packageJsonPath = findPnpmPackageFile('tree-sitter-c', 'package.json');
		return join(dirname(packageJsonPath), 'tree-sitter-c.wasm');
	}
}

function findPnpmPackageFile(packageName: string, fileName: string): string {
	const pnpmDir = join(process.cwd(), 'node_modules', '.pnpm');
	for (const entry of readdirSync(pnpmDir)) {
		if (!entry.startsWith(`${packageName}@`)) continue;
		const candidate = join(pnpmDir, entry, 'node_modules', packageName, fileName);
		if (existsSync(candidate)) return candidate;
	}
	throw new Error(`Could not locate ${packageName}/${fileName}`);
}

function collectEnumIds(parser: CParser, source: string, marker: string): Map<string, CEnumEntry> {
	const block = sliceCBlock(source, marker);
	if (!block) return new Map();
	const tree = parser.parse(block);
	if (!tree) return new Map();
	const result = new Map<string, CEnumEntry>();

	walkCNodes(tree.rootNode, (node) => {
		if (node.type !== 'enumerator') return;
		const cName = node.childForFieldName('name')?.text;
		const value = node.childForFieldName('value')?.text;
		if (!cName || !value) return;
		const id = Number.parseInt(value, 10);
		if (Number.isNaN(id)) return;
		result.set(cName, { cName, id });
	});

	return result;
}

function collectAliasedNonTerminals(parser: CParser, source: string): Set<string> {
	const block = sliceCBlock(source, 'static const uint16_t ts_non_terminal_alias_map[]');
	if (!block) return new Set();
	const tree = parser.parse(block);
	if (!tree) return new Set();
	const values: string[] = [];
	walkCNodes(tree.rootNode, (node) => {
		if (node.parent?.type === 'initializer_list' && (node.type === 'identifier' || node.type === 'number_literal')) values.push(node.text);
	});
	const result = new Set<string>();
	for (let i = 0; i + 1 < values.length; ) {
		const symbol = values[i]!;
		const count = Number.parseInt(values[i + 1]!, 10);
		if (symbol === '0' || Number.isNaN(count)) break;
		result.add(symbol);
		i += 2 + count;
	}
	return result;
}

function collectNameTable(parser: CParser, source: string, marker: string): Map<string, string> {
	const block = sliceCBlock(source, marker);
	if (!block) return new Map();
	const tree = parser.parse(block);
	if (!tree) return new Map();
	const result = new Map<string, string>();

	walkCNodes(tree.rootNode, (node) => {
		if (node.type !== 'initializer_pair') return;
		const designator = node.childForFieldName('designator');
		const value = node.childForFieldName('value');
		const cName = designator ? firstChildText(designator, 'identifier') : undefined;
		if (!cName || !value || value.type !== 'string_literal') return;
		result.set(cName, decodeCStringLiteral(value.text));
	});

	return result;
}

function joinIdNames(
	ids: ReadonlyMap<string, CEnumEntry>,
	names: ReadonlyMap<string, string>,
	fallbackName: (cName: string) => string,
	symbolTextFacts?: ReadonlyMap<string, SymbolTextFacts>,
	aliasedNonTerminals?: ReadonlySet<string>,
	lexicalRanks?: ReadonlyMap<string, number>
): Map<string, GeneratedIdEntry> {
	const result = new Map<string, GeneratedIdEntry>();
	for (const entry of ids.values()) {
		const key = fallbackName(entry.cName);
		const parser = createParserMetadata(entry, key, names, symbolTextFacts, aliasedNonTerminals, lexicalRanks);
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
						parser: { ...existing.parser, symbolName: parser.symbolName }
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
	aliasedNonTerminals?: ReadonlySet<string>,
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
		anon: entry.cName.startsWith('anon_sym_'),
		aux: entry.cName.startsWith('aux_sym_'),
		alias: entry.cName.startsWith('alias_sym_'),
		hidden: parserName.startsWith('_'),
		...(keywordTextOf(entry.cName, symbolTextFacts) === undefined ? {} : { keyword: true as const }),
		...(aliasedNonTerminals?.has(entry.cName) ? { aliasedNonTerminal: true as const } : {}),
		...(lexicalRank === undefined ? {} : { lexicalRank })
	};
}

function grammarNameOfSymbol(cName: string): string {
	return cName.replace(/^(?:alias_sym|aux_sym|anon_sym|sym)_/, '');
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
	while (current?.type === 'TOKEN' || current?.type === 'IMMEDIATE_TOKEN' || current?.type === 'PREC') current = current.content;
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

export function collectLexicalRanks(grammarJson: unknown): ReadonlyMap<string, number> {
	const grammar = grammarJson as { rules?: Record<string, GrammarJsonRule>; externals?: readonly GrammarJsonRule[] } | undefined;
	const rules = grammar?.rules ?? {};
	const ruleNames = Object.keys(rules);
	const externals = (grammar?.externals ?? []).flatMap((external) => (typeof external.name === 'string' ? [external.name] : []));
	const mintSources = new Map<string, { readonly owner: string; readonly arm: number }>();
	const aliasStorage = new Map<string, string>();
	for (const owner of ruleNames) {
		let arm = 0;
		const walk = (node: GrammarJsonRule | undefined): void => {
			if (node === undefined) return;
			if (node.type === 'SYMBOL' && typeof node.name === 'string' && node.metadata?.symbolSource === 'group-lift' && !mintSources.has(node.name)) {
				mintSources.set(node.name, { owner, arm: ++arm });
			}
			if (node.type === 'ALIAS' && node.named === true && typeof node.value === 'string' && node.content?.type === 'SYMBOL' && typeof node.content.name === 'string' && !aliasStorage.has(node.value)) {
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
		return [externals.includes(name) ? 0 : 1, -tokenLexicalPrec(rule), isFixedTextRule(rule) ? 0 : 1, ...positionOf(name, new Set())];
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

function shouldReplaceSymbol(existingCName: string | undefined, nextCName: string): boolean {
	if (!existingCName) return true;
	return existingCName.startsWith('anon_sym_') && !nextCName.startsWith('anon_sym_');
}

function keywordTextOf(cName: string, symbolTextFacts: ReadonlyMap<string, SymbolTextFacts> | undefined): string | undefined {
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

function deriveFieldRuntimeName(cName: string): string {
	return cName.startsWith('field_') ? cName.slice('field_'.length) : cName;
}

function walkCNodes(node: CNode, visit: (node: CNode) => void): void {
	visit(node);
	for (let i = 0; i < node.childCount; i += 1) {
		const child = node.child(i);
		if (child) walkCNodes(child, visit);
	}
}

function firstChildText(node: CNode, type: string): string | undefined {
	if (node.type === type) return node.text;
	for (let i = 0; i < node.childCount; i += 1) {
		const child = node.child(i);
		if (!child) continue;
		const found = firstChildText(child, type);
		if (found) return found;
	}
	return undefined;
}

function sliceCBlock(source: string, marker: string): string | undefined {
	const start = source.indexOf(marker);
	if (start < 0) return undefined;
	const open = source.indexOf('{', start);
	if (open < 0) return undefined;

	let depth = 0;
	let stringQuote: '"' | "'" | undefined;
	let inLineComment = false;
	let inBlockComment = false;

	for (let i = open; i < source.length; i += 1) {
		const ch = source[i]!;
		const next = source[i + 1];

		if (inLineComment) {
			if (ch === '\n') inLineComment = false;
			continue;
		}
		if (inBlockComment) {
			if (ch === '*' && next === '/') {
				inBlockComment = false;
				i += 1;
			}
			continue;
		}
		if (stringQuote) {
			if (ch === '\\') {
				i += 1;
				continue;
			}
			if (ch === stringQuote) stringQuote = undefined;
			continue;
		}

		if (ch === '/' && next === '/') {
			inLineComment = true;
			i += 1;
			continue;
		}
		if (ch === '/' && next === '*') {
			inBlockComment = true;
			i += 1;
			continue;
		}
		if (ch === '"' || ch === "'") {
			stringQuote = ch;
			continue;
		}
		if (ch === '{') {
			depth += 1;
			continue;
		}
		if (ch !== '}') continue;

		depth -= 1;
		if (depth === 0) {
			return source.slice(start, i + 2);
		}
	}

	return undefined;
}

function decodeCStringLiteral(literal: string): string {
	let body = literal.trim();
	if (body.startsWith('"') && body.endsWith('"')) body = body.slice(1, -1);

	let result = '';
	for (let i = 0; i < body.length; i += 1) {
		const ch = body[i]!;
		if (ch !== '\\') {
			result += ch;
			continue;
		}
		i += 1;
		const escaped = body[i];
		switch (escaped) {
			case undefined:
				result += '\\';
				break;
			case 'n':
				result += '\n';
				break;
			case 'r':
				result += '\r';
				break;
			case 't':
				result += '\t';
				break;
			case '0':
				result += '\0';
				break;
			case '\\':
			case '"':
			case "'":
			case '?':
				result += escaped;
				break;
			default:
				result += escaped;
				break;
		}
	}
	return result;
}
