import { readFileSync } from 'node:fs';
import type * as TS from 'web-tree-sitter';
import { sha256 } from './util/content-hash.ts';

const INIT = Symbol.for('sittir.web-tree-sitter.init');
const LANGUAGES = Symbol.for('sittir.web-tree-sitter.languages');

interface InitSlot {
	[INIT]?: Promise<void>;
	[LANGUAGES]?: Map<string, Promise<TS.Language>>;
}

export async function loadWebTreeSitter(): Promise<{
	Parser: typeof TS.Parser;
	Language: typeof TS.Language;
}> {
	const mod = await import('web-tree-sitter');
	const Parser = mod.Parser ?? (mod.default && 'Parser' in mod.default ? mod.default.Parser : undefined);
	const Language = mod.Language ?? (mod.default && 'Language' in mod.default ? mod.default.Language : undefined);
	if (!Parser || !Language) {
		throw new Error('web-tree-sitter: could not locate `Parser` or `Language` export');
	}
	const slot: typeof Parser & InitSlot = Parser;
	await (slot[INIT] ??= Parser.init());
	return { Parser, Language };
}

export interface ParserLanguage {
	readonly Parser: typeof TS.Parser;
	readonly language: TS.Language;
}

export interface ParsedTree extends Disposable {
	readonly root: TS.Node;
}

export interface TreeParser extends Disposable {
	parse(source: string): ParsedTree;
}

export interface HeldTrees extends Disposable {
	hold(tree: ParsedTree): TS.Node;
}

export function heldTrees(): HeldTrees {
	const trees: ParsedTree[] = [];
	return {
		hold(tree) {
			trees.push(tree);
			return tree.root;
		},
		[Symbol.dispose]: () => {
			for (const tree of trees.splice(0)) tree[Symbol.dispose]();
		}
	};
}

export async function languageOf(wasm: Uint8Array, digest: string = sha256(wasm)): Promise<ParserLanguage> {
	const { Parser, Language } = await loadWebTreeSitter();
	const slot: typeof Parser & InitSlot = Parser;
	const languages = (slot[LANGUAGES] ??= new Map());
	let language = languages.get(digest);
	if (language === undefined) {
		language = Language.load(wasm);
		languages.set(digest, language);
	}
	return { Parser, language: await language };
}

export async function languageAt(wasmPath: string): Promise<ParserLanguage> {
	return languageOf(new Uint8Array(readFileSync(wasmPath)));
}

export function treeParser({ Parser, language }: ParserLanguage, log?: TS.LogCallback): TreeParser {
	const parser = new Parser();
	try {
		parser.setLanguage(language);
		if (log !== undefined) parser.setLogger(log);
	} catch (error) {
		parser.delete();
		throw error;
	}
	return {
		parse(source) {
			const tree = parser.parse(source);
			if (tree === null) throw new Error('web-tree-sitter: returned no tree for a parse with its language set');
			return { root: tree.rootNode, [Symbol.dispose]: () => tree.delete() };
		},
		[Symbol.dispose]: () => parser.delete()
	};
}
