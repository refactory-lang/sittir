import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { loadWebTreeSitter } from '../engine-loader.ts';
import { grammarPackage, REPO_ROOT, sittirDirOf, type GrammarPackage } from '../grammars.ts';
import type * as TS from 'web-tree-sitter';
import { fromMissingParserTables, fromStaleParser, GrammarDiagnosticError } from './diagnostics/grammar-diagnostics.ts';
import { builtParserWasm } from '../transpile/compile-parser.ts';
import { sha256 } from '../util/content-hash.ts';
import {
	deriveFieldRuntimeName,
	joinIdNames,
	collectLexicalRanks,
	kindTableOfSymbolTable,
	type CEnumEntry,
	type ParserSymbolFacts,
	type GeneratedIdTables,
	type JoinedIds,
	type ParserSymbolTable,
	type TreeShape
} from '../dsl/symbol-table.ts';

export async function loadPackageIdTables(pkg: GrammarPackage): Promise<GeneratedIdTables> {
	const parserCPath = join(sittirDirOf(pkg), 'src', 'parser.c');
	if (!existsSync(parserCPath)) {
		const missing = fromMissingParserTables(pkg.name, relative(REPO_ROOT, parserCPath));
		throw new GrammarDiagnosticError([missing], [missing]);
	}
	const grammarJsonPath = join(dirname(parserCPath), 'grammar.json');
	const grammarJson = existsSync(grammarJsonPath) ? JSON.parse(readFileSync(grammarJsonPath, 'utf8')) : undefined;
	const tables = await deriveGeneratedIdTablesFromParserCSource(readFileSync(parserCPath, 'utf8'), relative(REPO_ROOT, parserCPath), grammarJson);
	return { ...tables, parser: await loadTreeShape(pkg) };
}

async function loadTreeShape(pkg: GrammarPackage): Promise<TreeShape> {
	const wasm = builtParserWasm(pkg.dir);
	if (!wasm.fresh) {
		const stale = fromStaleParser(pkg.name, relative(REPO_ROOT, wasm.wasmPath), wasm.reason);
		throw new GrammarDiagnosticError([stale], [stale]);
	}
	const language = await languageOf(wasm.digest, wasm.bytes);
	return (source) => parsing(language, (parse) => parse(source, (root) => root.toString()));
}

type ReadTree = <T>(source: string, read: (root: TS.Node) => T) => T;

interface ParserLanguage {
	readonly Parser: typeof TS.Parser;
	readonly language: TS.Language;
}

const languages = new Map<string, Promise<TS.Language>>();

async function languageOf(digest: string, wasm: Uint8Array): Promise<ParserLanguage> {
	const { Parser, Language } = await loadWebTreeSitter();
	let language = languages.get(digest);
	if (language === undefined) {
		language = Language.load(wasm);
		languages.set(digest, language);
	}
	return { Parser, language: await language };
}

function parsing<T>({ Parser, language }: ParserLanguage, use: (parse: ReadTree) => T): T {
	const parser = new Parser();
	try {
		parser.setLanguage(language);
		return use((source, read) => {
			const tree = parser.parse(source);
			if (tree === null) throw new Error('generated-metadata: web-tree-sitter returned no tree for a parse with its language set');
			try {
				return read(tree.rootNode);
			} finally {
				tree.delete();
			}
		});
	} finally {
		parser.delete();
	}
}

export function foldedSymbols(parserC: string): ReadonlyMap<string, string> {
	const start = parserC.indexOf('ts_symbol_map[]');
	const block = start < 0 ? '' : parserC.slice(start, parserC.indexOf('};', start));
	const folds = new Map<string, string>();
	for (const [, raw, publicSymbol] of block.matchAll(/\[(\w+)\] = (\w+),/g)) {
		if (raw !== publicSymbol) folds.set(raw!, publicSymbol!);
	}
	return folds;
}

export async function loadGeneratedIdTables(grammar: string): Promise<GeneratedIdTables> {
	return loadPackageIdTables(grammarPackage(grammar));
}

export async function deriveGeneratedIdTablesFromParserCSource(
	source: string,
	sourceArtifact: string,
	grammarJson?: unknown
): Promise<Omit<GeneratedIdTables, 'parser'>> {
	const { symbolIds, fieldIds, symbolNames, fieldNames, facts } = parsing(await cLanguage(), (parse) => ({
		symbolIds: collectEnumIds(parse, source, SYMBOL_ENUM_MARKER),
		fieldIds: collectEnumIds(parse, source, 'enum ts_field_identifiers'),
		symbolNames: collectNameTable(parse, source, 'static const char * const ts_symbol_names[]'),
		fieldNames: collectNameTable(parse, source, 'static const char * const ts_field_names[]'),
		facts: {
			aliasedNonTerminals: collectAliasedNonTerminals(parse, source),
			tokenCount: collectTokenCount(parse, source),
			...collectSymbolFlags(parse, source)
		}
	}));
	const table: ParserSymbolTable = { symbols: symbolIds, names: symbolNames, facts };

	const folds = new Map<number, number[]>();
	for (const [raw, publicSymbol] of foldedSymbols(source)) {
		const rawId = symbolIds.get(raw)?.id;
		const publicId = symbolIds.get(publicSymbol)?.id;
		if (rawId !== undefined && publicId !== undefined) folds.set(publicId, [...(folds.get(publicId) ?? []), rawId]);
	}
	return {
		kindIds: collisionFreeIds(kindTableOfSymbolTable(table, grammarJson, collectLexicalRanks(grammarJson)), sourceArtifact),
		fieldIds: collisionFreeIds(joinIdNames(fieldIds, fieldNames, deriveFieldRuntimeName), sourceArtifact),
		folds,
		sourceArtifact
	};
}

function collisionFreeIds({ ids, collisions }: JoinedIds, sourceArtifact: string): JoinedIds['ids'] {
	const [first] = collisions;
	if (first !== undefined) {
		throw new Error(
			`generated-metadata: ${sourceArtifact} derives key '${first.key}' for both ${first.symbols[0]} and ${first.symbols[1]}, a kind-key-collision the evaluate-time gate blocks`
		);
	}
	return ids;
}

const SYMBOL_ENUM_MARKER = 'enum ts_symbol_identifiers';

type CNode = TS.Node;

async function cLanguage(): Promise<ParserLanguage> {
	const wasm = new Uint8Array(readFileSync(resolveTreeSitterCWasmPath()));
	return languageOf(sha256(wasm), wasm);
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

function collectEnumIds(parse: ReadTree, source: string, marker: string): Map<string, CEnumEntry> {
	const block = sliceCBlock(source, marker);
	const result = new Map<string, CEnumEntry>();
	if (!block) return result;
	parse(block, (root) =>
		walkCNodes(root, (node) => {
			if (node.type !== 'enumerator') return;
			const cName = node.childForFieldName('name')?.text;
			const value = node.childForFieldName('value')?.text;
			if (!cName || !value) return;
			const id = Number.parseInt(value, 10);
			if (Number.isNaN(id)) return;
			result.set(cName, { cName, id });
		})
	);
	return result;
}

function collectTokenCount(parse: ReadTree, source: string): number | undefined {
	const end = source.indexOf(SYMBOL_ENUM_MARKER);
	let count: number | undefined;
	parse(end < 0 ? source : source.slice(0, end), (root) =>
		walkCNodes(root, (node) => {
			if (node.type !== 'preproc_def' || node.childForFieldName('name')?.text !== 'TOKEN_COUNT') return;
			const value = Number.parseInt(node.childForFieldName('value')?.text ?? '', 10);
			if (!Number.isNaN(value)) count = value;
		})
	);
	return count;
}

function collectSymbolFlags(
	parse: ReadTree,
	source: string
): Pick<ParserSymbolFacts, 'visible' | 'named' | 'supertypes'> {
	const visible = new Map<string, boolean>();
	const named = new Map<string, boolean>();
	const supertypes = new Set<string>();
	const block = sliceCBlock(source, 'static const TSSymbolMetadata ts_symbol_metadata[]');
	if (!block) return { visible, named, supertypes };
	parse(block, (root) => walkCNodes(root, (node) => {
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
	}));
	return { visible, named, supertypes };
}

function collectAliasedNonTerminals(parse: ReadTree, source: string): Set<string> {
	const block = sliceCBlock(source, 'static const uint16_t ts_non_terminal_alias_map[]');
	if (!block) return new Set();
	const values: string[] = [];
	parse(block, (root) =>
		walkCNodes(root, (node) => {
			if (node.parent?.type === 'initializer_list' && (node.type === 'identifier' || node.type === 'number_literal'))
				values.push(node.text);
		})
	);
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

function collectNameTable(parse: ReadTree, source: string, marker: string): Map<string, string> {
	const block = sliceCBlock(source, marker);
	const result = new Map<string, string>();
	if (!block) return result;
	parse(block, (root) =>
		walkCNodes(root, (node) => {
			if (node.type !== 'initializer_pair') return;
			const designator = node.childForFieldName('designator');
			const value = node.childForFieldName('value');
			const cName = designator ? firstChildText(designator, 'identifier') : undefined;
			if (!cName || !value || value.type !== 'string_literal') return;
			result.set(cName, decodeCStringLiteral(value.text));
		})
	);
	return result;
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
