import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { loadWebTreeSitter } from '../engine-loader.ts';
import { grammarPackageDir } from '../grammars.ts';
import { type KindParserMetadata } from './types.ts';
import { isParserHiddenName } from '../dsl/rule-patterns.ts';
import type * as TS from 'web-tree-sitter';
import {
	joinIdNames,
	kindTableOfSymbolTable,
	type CEnumEntry,
	type ParserSymbolFacts,
	type ParserSymbolTable
} from '../dsl/symbol-table.ts';

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

export interface TreeSitterLanguageMetadata {
	readonly nodeTypeCount: number;
	readonly fieldCount: number;
	nodeTypeForId(id: number): string | null;
	nodeTypeIsVisible(id: number): boolean;
	nodeTypeIsNamed(id: number): boolean;
	fieldNameForId(id: number): string | null;
}

export async function loadGeneratedIdTables(grammar: string): Promise<GeneratedIdTables | undefined> {
	const parserCPath = join(grammarPackageDir(grammar), '.sittir', 'src', 'parser.c');
	if (existsSync(parserCPath)) {
		const grammarJsonPath = join(dirname(parserCPath), 'grammar.json');
		const grammarJson = existsSync(grammarJsonPath) ? JSON.parse(readFileSync(grammarJsonPath, 'utf8')) : undefined;
		return deriveGeneratedIdTablesFromParserCSource(
			readFileSync(parserCPath, 'utf8'),
			`packages/${grammar}/.sittir/src/parser.c`,
			grammarJson
		);
	}

	const wasmPath = join(grammarPackageDir(grammar), '.sittir', 'parser.wasm');
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
	const table: ParserSymbolTable = {
		symbols: symbolIds,
		names: symbolNames,
		facts: {
			aliasedNonTerminals: collectAliasedNonTerminals(parser, source),
			tokenCount: collectTokenCount(source),
			...collectSymbolFlags(parser, source)
		}
	};

	return {
		kindIds: kindTableOfSymbolTable(table, grammarJson),
		fieldIds: joinIdNames(fieldIds, fieldNames, deriveFieldRuntimeName),
		sourceArtifact
	};
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

function collectTokenCount(source: string): number | undefined {
	const match = /^#define TOKEN_COUNT (\d+)$/m.exec(source);
	return match === null ? undefined : Number(match[1]);
}

function collectSymbolFlags(
	parser: CParser,
	source: string
): Pick<ParserSymbolFacts, 'visible' | 'named' | 'supertypes'> {
	const visible = new Map<string, boolean>();
	const named = new Map<string, boolean>();
	const supertypes = new Set<string>();
	const block = sliceCBlock(source, 'static const TSSymbolMetadata ts_symbol_metadata[]');
	if (!block) return { visible, named, supertypes };
	const tree = parser.parse(block);
	if (!tree) return { visible, named, supertypes };
	walkCNodes(tree.rootNode, (node) => {
		if (node.type !== 'initializer_pair') return;
		const designator = node.childForFieldName('designator');
		const value = node.childForFieldName('value');
		const cName = designator?.type === 'subscript_designator' ? firstChildText(designator, 'identifier') : undefined;
		if (!cName || value?.type !== 'initializer_list') return;
		let isVisible = false;
		let isNamed = false;
		walkCNodes(value, (flag) => {
			if (flag.type !== 'initializer_pair') return;
			const name = flag.childForFieldName('designator')?.text;
			const isTrue = flag.childForFieldName('value')?.text === 'true';
			if (name === '.visible') isVisible = isTrue;
			else if (name === '.named') isNamed = isTrue;
			else if (name === '.supertype' && isTrue) supertypes.add(cName);
		});
		visible.set(cName, isVisible);
		named.set(cName, isNamed);
	});
	return { visible, named, supertypes };
}

function collectAliasedNonTerminals(parser: CParser, source: string): Set<string> {
	const block = sliceCBlock(source, 'static const uint16_t ts_non_terminal_alias_map[]');
	if (!block) return new Set();
	const tree = parser.parse(block);
	if (!tree) return new Set();
	const values: string[] = [];
	walkCNodes(tree.rootNode, (node) => {
		if (node.parent?.type === 'initializer_list' && (node.type === 'identifier' || node.type === 'number_literal'))
			values.push(node.text);
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
