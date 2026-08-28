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
	readonly anon?: boolean;
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
		return deriveGeneratedIdTablesFromParserCSource(
			readFileSync(parserCPath, 'utf8'),
			`packages/${grammar}/.sittir/src/parser.c`
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
	sourceArtifact: string
): Promise<GeneratedIdTables> {
	const parser = await loadCParser();
	const symbolIds = collectEnumIds(parser, source, 'enum ts_symbol_identifiers');
	const fieldIds = collectEnumIds(parser, source, 'enum ts_field_identifiers');
	const symbolNames = collectNameTable(parser, source, 'static const char * const ts_symbol_names[]');
	const fieldNames = collectNameTable(parser, source, 'static const char * const ts_field_names[]');

	return {
		kindIds: joinIdNames(symbolIds, symbolNames, deriveSymbolRuntimeName),
		fieldIds: joinIdNames(fieldIds, fieldNames, deriveFieldRuntimeName),
		sourceArtifact
	};
}

export function collectGeneratedKindEntries(tables: GeneratedIdTables | undefined): readonly GeneratedKindEntry[] {
	if (!tables?.kindIds) return [];
	return toEntries(tables.kindIds)
		.filter(([, entry]) => entry.id !== undefined)
		.map(([kind, entry]) => ({
			kind,
			id: entry.id!,
			parseId: entry.parseId,
			symbolName:
				entry.parser?.symbolName !== undefined && entry.parser.symbolName !== kind
					? entry.parser.symbolName
					: undefined,
			anon: entry.parser?.anon || undefined
		}));
}

export interface KindEntryLike {
	readonly kind: string;
	readonly symbolName?: string;
	readonly anon?: boolean;
}

export function findEntryForKindName<T extends KindEntryLike>(entries: readonly T[], name: string): T | undefined {
	return (
		entries.find((entry) => entry.kind === name) ??
		entries.find((entry) => entry.kind === `_${name}`) ??
		entries.find((entry) => entry.anon === true && entry.symbolName === name) ??
		entries.find((entry) => entry.anon !== true && entry.symbolName === name) ??
		undefined
	);
}

export function findEntryForLiteralText<T extends KindEntryLike>(entries: readonly T[], text: string): T | undefined {
	return (
		entries.find((entry) => entry.anon === true && entry.symbolName === text) ?? findEntryForKindName(entries, text)
	);
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
	fallbackName: (cName: string) => string
): Map<string, GeneratedIdEntry> {
	const result = new Map<string, GeneratedIdEntry>();
	for (const entry of ids.values()) {
		const key = fallbackName(entry.cName);
		const parser = createParserMetadata(entry, key, names);
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
			if (existing.parser.anon) {
				const anonKey = disambiguateAnonKey(key, result, existing.id ?? entry.id);
				result.set(anonKey, {
					id: existing.id,
					parser: {
						...existing.parser,
						parserName: anonKey,
						hidden: anonKey.startsWith('_')
					}
				});
				result.set(key, { id: entry.id, parser });
			} else {
				const anonKey = disambiguateAnonKey(key, result, entry.id);
				result.set(anonKey, {
					id: entry.id,
					parser: {
						...parser,
						parserName: anonKey,
						hidden: anonKey.startsWith('_')
					}
				});
			}
			continue;
		}
		if (!shouldReplaceSymbol(existing.parser.cSymbol, entry.cName)) {
			if (parser.alias && parser.symbolName !== undefined && parser.symbolName !== existing.parser.symbolName) {
				result.set(key, {
					id: existing.id,
					parseId: entry.id,
					parser: { ...existing.parser, symbolName: parser.symbolName }
				});
			}
			continue;
		}
		result.set(key, { id: entry.id, parser });
	}
	return result;
}

function createParserMetadata(
	entry: CEnumEntry,
	parserName: string,
	names: ReadonlyMap<string, string>
): KindParserMetadata {
	return {
		cSymbol: entry.cName,
		parserName,
		symbolName: names.get(entry.cName),
		anon: entry.cName.startsWith('anon_sym_'),
		aux: entry.cName.startsWith('aux_sym_'),
		alias: entry.cName.startsWith('alias_sym_'),
		hidden: parserName.startsWith('_')
	};
}

function disambiguateAnonKey(baseKey: string, existing: ReadonlyMap<string, GeneratedIdEntry>, id: number): string {
	const preferred = `anon_${baseKey}`;
	if (!existing.has(preferred)) return preferred;
	return `${preferred}_${id}`;
}

function shouldReplaceSymbol(existingCName: string | undefined, nextCName: string): boolean {
	if (!existingCName) return true;
	return existingCName.startsWith('anon_sym_') && !nextCName.startsWith('anon_sym_');
}

function deriveSymbolRuntimeName(cName: string): string {
	if (cName.startsWith('sym_')) return cName.slice('sym_'.length);
	if (cName.startsWith('anon_sym_')) {
		return cName.slice('anon_sym_'.length).toLowerCase();
	}
	if (cName.startsWith('aux_sym_')) return cName.slice('aux_sym_'.length);
	if (cName.startsWith('alias_sym_')) return `_${cName.slice('alias_sym_'.length)}`;
	return cName;
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
