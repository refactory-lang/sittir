import { describe, expect, it } from 'vitest';
import { applyHost } from '@sittir/common';
import { findReparsedNodeAtOffset, hostlessReason, loadRenderReparseContext } from '../src/validate/read-render-parse.ts';
import { loadLanguageForGrammar, loadNativeEngine, wrapForReparse } from '../src/validate/common.ts';

async function contextFor(grammar: 'python' | 'regex' | 'rust' | 'typescript') {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	return loadRenderReparseContext(grammar, parser, await loadNativeEngine(grammar));
}

const hostFor = (grammar: string, kind: string, ctx: Awaited<ReturnType<typeof contextFor>>) =>
	wrapForReparse('x', kind, grammar, ctx.kindToSupertypes, { adoptedVariantKinds: ctx.adoptedVariantKinds, root: ctx.root });

describe('a kind with no declared host is hosted through a parent that is', () => {
	it('python: statements reach the declared statement hosts, a match block a derived one', async () => {
		const ctx = await contextFor('python');
		for (const kind of ['return_statement', 'match_statement', 'match_block', 'block', 'suite_block']) {
			expect(hostFor('python', kind, ctx), kind).not.toBeNull();
		}
	}, 120_000);

	it('regex: a kind whose corpus holds zero-width instances is still hosted through its parent', async () => {
		const ctx = await contextFor('regex');
		for (const kind of ['term_group', 'character_class', 'count_quantifier']) {
			expect(hostFor('regex', kind, ctx), kind).not.toBeNull();
		}
	}, 120_000);

	it('typescript: a kind only a parent contains has a host', async () => {
		const ctx = await contextFor('typescript');
		expect(hostFor('typescript', 'object_type_content', ctx)).not.toBeNull();
	}, 120_000);

	it('a kind with no node of its own is excluded as hidden, not as hostless', async () => {
		const ctx = await contextFor('python');
		expect(hostlessReason('_simple_statements', '_simple_statements', ctx)).toBe('hidden-kind');
		expect(hostlessReason('return_statement', 'return_statement', ctx)).toBe('no-reparse-wrapper');
	}, 120_000);
});

describe('the reparsed node is found by grammar id', () => {
	it('python: the named yield and the yield keyword it wraps are told apart', async () => {
		const { Parser, lang } = await loadLanguageForGrammar('python');
		const parser = new Parser();
		parser.setLanguage(lang);
		const tree = parser.parse('yield\n')!;
		const named = tree.rootNode.descendantsOfType('yield').find((n) => n.isNamed)!;
		const keyword = named.child(0)!;
		expect(keyword.isNamed).toBe(false);
		const hosted = { text: 'yield\n', offset: 0 };
		expect(findReparsedNodeAtOffset(tree, named.grammarId, hosted)?.isNamed).toBe(true);
		expect(findReparsedNodeAtOffset(tree, keyword.grammarId, hosted)?.isNamed).toBe(false);
	}, 120_000);

	it('python: a node that starts at the line break before the hole is found', async () => {
		const { Parser, lang } = await loadLanguageForGrammar('python');
		const parser = new Parser();
		parser.setLanguage(lang);
		const text = 'match x:\n    case 1:\n        pass\n';
		const tree = parser.parse(text)!;
		const block = tree.rootNode.descendantsOfType('match_block')[0]!;
		const offset = text.indexOf('case');
		expect(block.startIndex).toBeLessThan(offset);
		expect(findReparsedNodeAtOffset(tree, block.grammarId, { text, offset })).not.toBeNull();
		expect(findReparsedNodeAtOffset(tree, 'match_block', { text, offset })?.type).toBe('match_block');
	}, 120_000);

	it('python: a multi-line string keeps its inside when the render is indented into a block', async () => {
		const { Parser, lang } = await loadLanguageForGrammar('python');
		const parser = new Parser();
		parser.setLanguage(lang);
		const rendered = 'x = 1\nreturn f\"\"\"\n{y}\n  tail\"\"\"';
		const parse = (text: string) => parser.parse(text);
		expect(applyHost('def f():\n    $r', rendered).text).toBe('def f():\n    x = 1\n    return f\"\"\"\n    {y}\n      tail\"\"\"');
		expect(applyHost('def f():\n    $r', rendered, parse).text).toBe('def f():\n    x = 1\n    return f\"\"\"\n{y}\n  tail\"\"\"');
	}, 120_000);
});
