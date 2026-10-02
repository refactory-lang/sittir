import { beforeAll, describe, expect, it } from 'vitest';
import { evaluatePackage } from '../../compiler/evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';

type Node = { readonly type: string; readonly name?: string; readonly immediate?: boolean; readonly annotations?: unknown; readonly content?: Node; readonly members?: readonly Node[] };

type Evaluated = Awaited<ReturnType<typeof evaluatePackage>>;

let python: Evaluated;
let rust: Evaluated;

beforeAll(async () => {
	python = await evaluatePackage(grammarPackage('python'));
});

beforeAll(async () => {
	rust = await evaluatePackage(grammarPackage('rust'));
});

describe('the text-token mint runs in enrich', () => {
	it('a patch landing on a minted reference rewrites the minted rule and keeps the reference', () => {
		const raw = python;
		const rules = raw.rules as unknown as Record<string, Node>;
		expect(rules.format_specifier_text).toMatchObject({ type: 'TOKEN', immediate: true, content: { type: 'PATTERN' } });
		const reference = rules.format_specifier!.members![1]!.content!.content!.members![0]!;
		expect(reference.name).toBe('format_specifier_text');
		expect(reference.annotations).toEqual({ variantOf: 'format_specifier' });
	});

	it('a variant() on a minted reference lifts the token under the authored variant name', () => {
		const raw = rust;
		const rules = raw.rules as unknown as Record<string, Node>;
		expect(rules.line_comment_regular).toMatchObject({ type: 'TOKEN', immediate: true, content: { type: 'PATTERN', value: '.*' } });
		expect(raw.textTokens).not.toContain('line_comment_text3');
	});

	it('names a site after its upstream owner, not the rule a variant lifts it into', () => {
		const raw = rust;
		expect(raw.textTokens?.filter((name) => name.startsWith('line_comment'))).toEqual(['line_comment_text1', 'line_comment_text2']);
	});
});

describe('a variant() over a sole reference', () => {
	it('mints the variant rule when the reference names a hidden terminal', () => {
		const raw = rust;
		const rules = raw.rules as unknown as Record<string, Node>;
		expect(rules.block_comment_regular).toMatchObject({ type: 'SYMBOL', name: '_block_comment_content' });
		const arms = rules.block_comment!.members![1]!.content!.members!;
		expect(arms[2]).toMatchObject({ type: 'SYMBOL', name: 'block_comment_regular' });
	});
});
