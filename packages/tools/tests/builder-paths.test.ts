import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadNodeModel } from '../src/validate/common.ts';

const GRAMMARS = ['rust', 'typescript', 'python', 'scm', 'regex'] as const;

function at(root: unknown, path: readonly string[]): unknown {
	return path.reduce<unknown>((value, key) => (value == null ? undefined : (value as Record<string, unknown>)[key]), root);
}

async function irOf(grammar: string): Promise<Record<string, unknown>> {
	return ((await import(`../../${grammar}/src/ir.ts`)) as { ir: Record<string, unknown> }).ir;
}

describe.each(GRAMMARS)('%s builder paths', (grammar) => {
	it('resolves every builder path on ir', async () => {
		const model = await loadNodeModel(grammar);
		const ir = await irOf(grammar);
		expect(Object.keys(model.builderPaths).length).toBeGreaterThan(0);
		expect(Object.entries(model.builderPaths).filter(([, path]) => at(ir, path) === undefined)).toEqual([]);
	});

	it('names an ir member with every ir key', async () => {
		const model = await loadNodeModel(grammar);
		const ir = await irOf(grammar);
		expect(Object.entries(model.irKeys).filter(([, key]) => !(key in ir))).toEqual([]);
	});

	it('names no missing ir builder in the generated coercers', async () => {
		const ir = await irOf(grammar);
		const coerce = readFileSync(new URL(`../../${grammar}/src/factories/coerce.ts`, import.meta.url), 'utf8');
		const named = new Set([...coerce.matchAll(/\bir\.([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)/g)].map((match) => match[1]!));
		expect([...named].filter((path) => at(ir, path.split('.')) === undefined)).toEqual([]);
	});
});

it('builds a seated rust comment form through the comment that owns it', async () => {
	const model = await loadNodeModel('rust');
	expect(model.builderPaths.line_comment_doc_outer).toEqual(['lineComment', 'docOuter']);
	expect(model.builderPaths.block_comment_doc_inner).toEqual(['blockComment', 'docInner']);
});

it('builds a kind two hosts declare through the first host and records the other', async () => {
	const model = await loadNodeModel('python');
	expect(model.builderPaths.parenthesized_import_list).toEqual(['futureImportStatement', 'parenthesizedImportList']);
	expect(model.builderPathAlternates.parenthesized_import_list).toEqual([['importFromStatement', 'parenthesizedImportList']]);
});

it('builds a seated arm through the envelope that declares it', async () => {
	const model = await loadNodeModel('python');
	expect(model.builderPaths.simple_pattern_negative).toEqual(['simplePattern', 'negative']);
});

it('builds a kind through its own flat key first and keeps its owner route as an alternate', async () => {
	const model = await loadNodeModel('python');
	expect(model.builderPaths.match_block_block).toEqual(['matchBlockBlock']);
	expect(model.builderPathAlternates.match_block_block).toEqual([['matchBlock', 'block']]);
	expect(model.builderPaths.integer_hex).toEqual(['integerHex']);
	expect(model.builderPathAlternates.integer_hex).toEqual([['integer', 'hex']]);
});
