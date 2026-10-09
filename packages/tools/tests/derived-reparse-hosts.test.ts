import { describe, expect, it } from 'vitest';
import { hostlessReason, loadRenderReparseContext } from '../src/validate/read-render-parse.ts';
import { loadLanguageForGrammar, loadNativeEngine, wrapForReparse } from '../src/validate/common.ts';

async function contextFor(grammar: 'python' | 'rust' | 'typescript') {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	return loadRenderReparseContext(grammar, parser, await loadNativeEngine(grammar));
}

const hostFor = (grammar: string, kind: string, ctx: Awaited<ReturnType<typeof contextFor>>) =>
	wrapForReparse('x', kind, grammar, ctx.kindToSupertypes, { adoptedVariantKinds: ctx.adoptedVariantKinds, root: ctx.root });

describe('a kind with no declared host is hosted through a parent that is', () => {
	it('python: statements reach the declared statement hosts, blocks and match clauses a derived one', async () => {
		const ctx = await contextFor('python');
		for (const kind of ['return_statement', 'match_statement', 'block', 'case_clause']) {
			expect(hostFor('python', kind, ctx), kind).not.toBeNull();
		}
	}, 120_000);

	it('typescript: a kind only a parent contains has a host', async () => {
		const ctx = await contextFor('typescript');
		expect(hostFor('typescript', 'object_type_content', ctx)).not.toBeNull();
	}, 120_000);

	it('a kind with no node of its own is excluded as hidden, not as hostless', async () => {
		const ctx = await contextFor('python');
		expect(hostlessReason('_simple_statements', '_simple_statements', ctx)).toBe('hidden-kind');
		expect(hostlessReason('block', 'block', ctx)).toBe('no-reparse-wrapper');
	}, 120_000);
});
