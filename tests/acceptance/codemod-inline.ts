/**
 * Codemod helper for the US1 acceptance suite (T050 / T051).
 *
 * Reads each `.rs` file in a sample corpus, finds every short
 * (≤5-line) `function_item` whose attribute list does not already
 * contain `#[inline]`, and inserts `#[inline]\n` before the function.
 *
 * Goes through `@sittir/rust`'s public surface — specifically the
 * `applyEdits` boundary shim from `boundary.ts` — so the active
 * backend chosen by `getActiveBackend()` is exercised on every run.
 *
 * Tree traversal uses web-tree-sitter (the same parser the codegen
 * validators run on), so the codemod is portable across native /
 * typescript backends without depending on the deferred ast-grep
 * `findMatches` integration (T033 stub).
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadLanguageForGrammar } from '../../packages/codegen/src/validate/common.ts';
import { applyEdits } from '@sittir/rust';
import type { Edit } from '@sittir/types';

/** A function_item match marked for inlining. */
interface InlineMatch {
	/** Byte offset of the first character of the function (or its
	 *  first existing attribute, if any). The `#[inline]\n` is
	 *  spliced in here. */
	startByte: number;
	/** Indentation prefix preceding the function on its line, used so
	 *  the inserted attribute sits on its own at the same indent. */
	indent: string;
}

/** Result of processing one source file. */
export interface CodemodResult {
	/** Path of the source file (echoed for diagnostics). */
	path: string;
	/** Modified source. Identical to input when no functions matched. */
	output: string;
	/** Number of insertions applied (for assertions / reporting). */
	insertions: number;
}

/**
 * Run the codemod on a single source string. Returns the rewritten
 * source and the number of insertions performed.
 */
export async function runCodemodOnSource(
	source: string
): Promise<{ output: string; insertions: number }> {
	const { Parser, lang } = await loadLanguageForGrammar('rust');
	const parser = new Parser();
	parser.setLanguage(lang);
	const tree = parser.parse(source);
	if (tree === null) {
		throw new Error('rust parser returned null tree');
	}
	const matches = findInlineCandidates(tree.rootNode, source);
	parser.delete();
	tree.delete();
	if (matches.length === 0) return { output: source, insertions: 0 };
	const edits: Edit[] = matches.map((m) => ({
		startPos: m.startByte,
		endPos: m.startByte,
		insertedText: `#[inline]\n${m.indent}`
	}));
	return { output: applyEdits(source, edits), insertions: edits.length };
}

/**
 * Walk the tree, collect every function_item whose body has ≤ 5 lines
 * AND whose existing attribute_item siblings don't already include
 * `#[inline]`. The byte offset returned is the start of the first
 * existing attribute (or the function itself when there are none) so
 * the new `#[inline]` lands above any existing attributes.
 */
function findInlineCandidates(rootNode: any, source: string): InlineMatch[] {
	const out: InlineMatch[] = [];
	const cursor = rootNode.walk();
	visit(cursor, source, out);
	cursor.delete();
	return out;
}

function visit(cursor: any, source: string, out: InlineMatch[]): void {
	const node = cursor.currentNode;
	if (node.type === 'function_item') {
		const candidate = considerFunction(node, source);
		if (candidate !== null) out.push(candidate);
		// Don't recurse into function bodies — nested fn defs are
		// unusual and dropping them keeps the codemod readable.
	} else if (cursor.gotoFirstChild()) {
		do {
			visit(cursor, source, out);
		} while (cursor.gotoNextSibling());
		cursor.gotoParent();
	}
}

/**
 * Decide whether a function_item is a codemod candidate. Returns the
 * splice-anchor + indent on success, null on skip.
 *
 * Skip conditions: missing block body; body line count > 5; existing
 * `#[inline]` attribute on the function or its containing
 * declaration_list (any `attribute_item` immediately before whose text
 * starts with `#[inline]` or `#[inline(`).
 */
function considerFunction(node: any, source: string): InlineMatch | null {
	const body = node.childForFieldName('body');
	if (body === null || body.type !== 'block') return null;
	const bodyText = source.slice(body.startIndex, body.endIndex);
	const lineCount = bodyText.split('\n').length;
	if (lineCount > 5) return null;

	// Walk preceding attribute_item siblings looking for #[inline].
	// Attribute items in tree-sitter-rust attach as siblings via the
	// declaration_list / source_file parent (they're not children of
	// function_item), so we scan parent.namedChildren BEFORE this fn.
	const parent = node.parent;
	if (parent === null) return null;
	const siblings: any[] = [];
	for (let i = 0; i < parent.namedChildCount; i++) {
		siblings.push(parent.namedChild(i));
	}
	const myIdx = siblings.findIndex((s) => s.id === node.id);
	if (myIdx < 0) return null;
	let firstAttrIdx = myIdx;
	for (let i = myIdx - 1; i >= 0; i--) {
		const sib = siblings[i];
		if (sib.type === 'attribute_item' || sib.type === 'inner_attribute_item') {
			const text = source.slice(sib.startIndex, sib.endIndex);
			if (/^#!?\[\s*inline\b/.test(text)) return null;
			firstAttrIdx = i;
			continue;
		}
		break;
	}

	const anchorNode = siblings[firstAttrIdx];
	const startByte = anchorNode.startIndex;
	// Indent = whitespace from the start of the line containing
	// anchorNode up to its first column. Lets the inserted attribute
	// align with the function (top-level functions get '', nested
	// ones inside an impl block get the impl's indentation).
	const lineStart = source.lastIndexOf('\n', startByte - 1) + 1;
	const indent = source.slice(lineStart, startByte);
	return { startByte, indent };
}

/**
 * Apply the codemod to every `.rs` file in `corpusDir` (non-recursive,
 * sorted by filename). Returns one entry per file.
 */
export async function runCodemodOnDir(
	corpusDir: string
): Promise<CodemodResult[]> {
	const entries = readdirSync(corpusDir, { withFileTypes: true })
		.filter((e) => e.isFile() && e.name.endsWith('.rs'))
		.map((e) => e.name)
		.sort();
	const results: CodemodResult[] = [];
	for (const name of entries) {
		const path = join(corpusDir, name);
		const source = readFileSync(path, 'utf-8');
		const { output, insertions } = await runCodemodOnSource(source);
		results.push({ path, output, insertions });
	}
	return results;
}
