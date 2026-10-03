import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngine } from '@sittir/common';
import { languageByName } from '../languages.ts';

const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

export const CODEMOD_CORPUS = join(REPO_ROOT, 'tests', 'acceptance', 'fixtures', 'codemod-sample');

export interface CodemodCorpusOptions {
	readonly corpus: string;
	readonly json: boolean;
}

export interface CodemodCorpusFile {
	readonly file: string;
	readonly insertions: number;
	readonly identical: boolean;
}

export interface CodemodCorpusResult {
	readonly identical: number;
	readonly total: number;
	readonly files: readonly CodemodCorpusFile[];
}

const MAX_BODY_LINES = 5;

/** What `inlineAnchor` reads of a node, in the caller's own node vocabulary. */
export interface InlineSelectionView<T> {
	readonly isAttribute: (node: T) => boolean;
	readonly text: (node: T) => string;
	readonly body: (node: T) => string | undefined;
}

/**
 * Where the inline codemod inserts `#[inline]` before the function at
 * `siblings[index]`: the first of the attribute items (outer or inner)
 * directly before it, or the function itself when there are none. A function
 * is left alone when it has no body, when its body spans more than
 * `MAX_BODY_LINES` lines, or when one of those attributes is already
 * `#[inline]` or `#![inline]`.
 */
export function inlineAnchor<T>(siblings: readonly T[], index: number, view: InlineSelectionView<T>): number | undefined {
	const body = view.body(siblings[index]!);
	if (body === undefined || body.split('\n').length > MAX_BODY_LINES) return undefined;
	let anchor = index;
	while (anchor > 0 && view.isAttribute(siblings[anchor - 1]!)) {
		if (/^#!?\[\s*inline\b/.test(view.text(siblings[anchor - 1]!))) return undefined;
		anchor--;
	}
	return anchor;
}

function sliceBytes(source: Buffer, span: { readonly start: number; readonly end: number }): string {
	return source.subarray(span.start, span.end).toString('utf8');
}

function spanOf(node: unknown): { readonly start: number; readonly end: number } | undefined {
	return (node as { readonly $span?: { readonly start: number; readonly end: number } }).$span;
}

export async function rewriteWithInline(source: string): Promise<{ readonly output: string; readonly insertions: number }> {
	const rs = await createEngine(await languageByName('rust'));
	const bytes = Buffer.from(source, 'utf8');
	const root = rs.parse(source);
	const inline = rs.parse('#[inline]\nfn f() {}\n').statements()[0];
	if (inline === undefined || typeof inline === 'number' || !rs.is.attributeItem(inline)) {
		throw new Error('codemod-corpus: `#[inline]` did not parse as an attribute item');
	}
	const statements = [...root.statements()];
	const textOf = (node: unknown): string => {
		const span = spanOf(node);
		return span === undefined ? '' : sliceBytes(bytes, span);
	};
	const isNode = (node: unknown): node is Exclude<(typeof statements)[number], number | undefined> => node !== undefined && typeof node !== 'number';
	const view: InlineSelectionView<unknown> = {
		isAttribute: (node) => isNode(node) && (rs.is.attributeItem(node) || rs.is.innerAttributeItem(node)),
		text: textOf,
		body: (node) => (isNode(node) && rs.is.functionItem(node) ? textOf(node.body()) : undefined)
	};
	const anchors = new Set<number>();
	statements.forEach((_, index) => {
		const anchor = inlineAnchor(statements, index, view);
		if (anchor !== undefined) anchors.add(anchor);
	});
	if (anchors.size === 0) return { output: source, insertions: 0 };
	const rewritten = statements.flatMap((statement, index) => (anchors.has(index) ? [inline, statement] : [statement]));
	return { output: root.$with.statements(...(rewritten as typeof statements)).$render(), insertions: anchors.size };
}

export async function runCodemodCorpus(corpus: string): Promise<CodemodCorpusResult> {
	const names = readdirSync(corpus)
		.filter((name) => name.endsWith('.rs'))
		.sort();
	const files: CodemodCorpusFile[] = [];
	for (const name of names) {
		const source = readFileSync(join(corpus, name), 'utf8');
		const baseline = readFileSync(join(corpus, 'baseline', name), 'utf8');
		const { output, insertions } = await rewriteWithInline(source);
		files.push({ file: name, insertions, identical: output === baseline });
	}
	return { identical: files.filter((file) => file.identical).length, total: files.length, files };
}

export async function run(options: CodemodCorpusOptions): Promise<number> {
	const result = await runCodemodCorpus(resolve(options.corpus));
	if (options.json) {
		console.log(JSON.stringify(result));
		return 0;
	}
	console.log(`identical ${result.identical} / ${result.total}`);
	for (const file of result.files) {
		if (!file.identical) console.log(`  differs: ${file.file} (${file.insertions} insertion${file.insertions === 1 ? '' : 's'})`);
	}
	return 0;
}
