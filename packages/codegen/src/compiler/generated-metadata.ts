import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { loadWebTreeSitter } from '../engine-loader.ts';
import { grammarPackageDir } from '../grammars.ts';
import type * as TS from 'web-tree-sitter';
import {
	joinIdNames,
	kindTableOfSymbolTable,
	type CEnumEntry,
	type ParserSymbolFacts,
	type GeneratedIdTables,
	type JoinedIds,
	type ParserSymbolTable
} from '../dsl/symbol-table.ts';

export async function loadGeneratedIdTables(grammar: string): Promise<GeneratedIdTables | undefined> {
	const parserCPath = join(grammarPackageDir(grammar), '.sittir', 'src', 'parser.c');
	if (!existsSync(parserCPath)) return undefined;
	const grammarJsonPath = join(dirname(parserCPath), 'grammar.json');
	const grammarJson = existsSync(grammarJsonPath) ? JSON.parse(readFileSync(grammarJsonPath, 'utf8')) : undefined;
	return deriveGeneratedIdTablesFromParserCSource(readFileSync(parserCPath, 'utf8'), `packages/${grammar}/.sittir/src/parser.c`, grammarJson);
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
		kindIds: collisionFreeIds(kindTableOfSymbolTable(table, grammarJson), sourceArtifact),
		fieldIds: collisionFreeIds(joinIdNames(fieldIds, fieldNames, deriveFieldRuntimeName), sourceArtifact),
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
