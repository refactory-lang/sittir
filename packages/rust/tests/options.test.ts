import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';
import { Delimiter, TSKindId } from '../src/types.ts';
import { createEngine, ir } from '../src/index.ts';

it('the emitted Options type is pinned', () => {
	expect(readFileSync(new URL('../src/options.ts', import.meta.url), 'utf8')).toMatchSnapshot();
});

it('types every site by kind id at its address and rejects a wrong member at compile time', () => {
	const ok: Options = {
		arguments_elements: {
			element: { separator: { comma: { before: TSKindId.Tight, after: TSKindId.Newline } }, delimiter: Delimiter.Trailing }
		},
		binary_expression: { operator: { before: TSKindId.Space, after: TSKindId.Space } },
		parameters: { lparen: { after: TSKindId.Tight } },
		body: { before: TSKindId.Indent, after: TSKindId.Dedent },
		block: { lbrace: { after: TSKindId.Indent }, rbrace: { before: TSKindId.Dedent } },
		abstract_type: { for: { before: TSKindId.Space } },
		token_tree_punctuation: { slash: { after: TSKindId.Tight }, colon_colon: { after: TSKindId.Tight } },
		indent: '    '
	};
	const bad: Options = {
		arguments_elements: {
			element: {
				// @ts-expect-error a comma is not a whitespace kind, and a separator admits no indent
				separator: { comma: { after: TSKindId.Comma, before: TSKindId.Indent } },
				// @ts-expect-error the leading flank is fixed here
				delimiter: Delimiter.Leading
			}
		},
		// @ts-expect-error a brace has no 'sideways' edge
		block: { lbrace: { sideways: TSKindId.Space } },
		// @ts-expect-error a comma is not a whitespace kind
		abstract_type: { for: { before: TSKindId.Comma } }
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
	expect(ok.block?.lbrace?.after).toBe(TSKindId.Indent);
	expect(ok.token_tree_punctuation?.colon_colon?.after).toBe(TSKindId.Tight);
});

it('engine options set the spacing of a built separated list and per-call options override them', () => {
	const args = ir.arguments(ir.argumentsElements(ir.identifier('a'), ir.identifier('b')));
	const tight = createEngine({ options: { arguments_elements: { element: { separator: { comma: { after: TSKindId.Tight } } } } } });
	const spaced = createEngine({ options: { arguments_elements: { element: { separator: { comma: { after: TSKindId.Space } } } } } });
	expect(tight.render(args).toString()).toBe('(a,b)');
	expect(spaced.render(args).toString()).toBe('(a, b)');
	expect(
		tight
			.render(args, { options: { arguments_elements: { element: { separator: { comma: { after: TSKindId.Newline } } } } } })
			.toString()
	).toBe('(a,\nb)');
});

it('a kind-scoped separator override applies only to its own kind, leaving an unconfigured kind at the engine default', () => {
	const args = ir.arguments(ir.argumentsElements(ir.identifier('a'), ir.identifier('b')));
	const lifetimes = ir.lifetimes(ir.lifetime('a'), ir.lifetime('b'));
	const engine = createEngine({
		options: { lifetimes: { lifetime: { separator: { comma: { after: TSKindId.Tight } } } } }
	});
	expect(engine.render(lifetimes).toString()).toBe("'a,'b");
	expect(engine.render(args).toString()).toBe('(a, b)');
});

it('two adjacent seam requests at the same gap coalesce to a single line break', () => {
	const args = ir.arguments(ir.argumentsElements(ir.identifier('a'), ir.identifier('b')));
	const engine = createEngine({
		options: {
			arguments_elements: {
				element: {
					attributed_argument: { after: TSKindId.Newline },
					separator: { comma: { before: TSKindId.Newline } }
				}
			}
		}
	});
	expect(engine.render(args).toString()).toBe('(a\n, b)');
});
