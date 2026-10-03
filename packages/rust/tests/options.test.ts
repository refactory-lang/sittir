import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';
import { Delimiter } from '@sittir/common/utils';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

it('the emitted Options type is pinned', async () => {
	expect(readFileSync(new URL('../src/options.ts', import.meta.url), 'utf8')).toMatchSnapshot();
});

it('types every site by kind id at its address and rejects a wrong member at compile time', async () => {
	const ok: Options = {
		argumentsElements: {
			item: { separator: { comma: { before: rs.kinds.Tight, after: rs.kinds.Newline } }, delimiter: Delimiter.Trailing }
		},
		binaryExpression: { operator: { before: rs.kinds.Space, after: rs.kinds.Space } },
		parameters: { lparen: { after: rs.kinds.Tight } },
		body: { before: rs.kinds.Indent, after: rs.kinds.Dedent },
		block: { lbrace: { after: rs.kinds.Indent }, rbrace: { before: rs.kinds.Dedent } },
		abstractType: { forKeyword: { before: rs.kinds.Space } },
		tokenTreePunctuation: { slash: { after: rs.kinds.Tight }, colonColon: { after: rs.kinds.Tight } },
		indent: '    '
	};
	const bad: Options = {
		argumentsElements: {
			item: {
				// @ts-expect-error a comma is not a whitespace kind, and a separator admits no indent
				separator: { comma: { after: rs.kinds.Comma, before: rs.kinds.Indent } },
				// @ts-expect-error the leading flank is fixed here
				delimiter: Delimiter.Leading
			}
		},
		// @ts-expect-error a brace has no 'sideways' edge
		block: { lbrace: { sideways: rs.kinds.Space } },
		// @ts-expect-error a comma is not a whitespace kind
		abstractType: { forKeyword: { before: rs.kinds.Comma } }
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
	expect(ok.block?.lbrace?.after).toBe(rs.kinds.Indent);
	expect(ok.tokenTreePunctuation?.colonColon?.after).toBe(rs.kinds.Tight);
});

it('engine options set the spacing of a built separated list and per-call options override them', async () => {
	const args = rs.build.arguments(rs.build.argumentsElements(rs.build.identifier('a'), rs.build.identifier('b')));
	const tight = await createEngine(rust, { render: { argumentsElements: { item: { separator: { comma: { after: rs.kinds.Tight } } } } } });
	const spaced = await createEngine(rust, { render: { argumentsElements: { item: { separator: { comma: { after: rs.kinds.Space } } } } } });
	expect(tight.render(args).toString()).toBe('(a,b)');
	expect(spaced.render(args).toString()).toBe('(a, b)');
	expect(
		tight
			.render(args, { argumentsElements: { item: { separator: { comma: { after: rs.kinds.Newline } } } } })
			.toString()
	).toBe('(a,\nb)');
});

it('a built list with no delimiter takes the engine option, a per-call option overrides it, and a delimiter set on the list wins over both', async () => {
	const unset = rs.build.arguments(rs.build.argumentsElements(rs.build.identifier('a'), rs.build.identifier('b')));
	const none = rs.build.arguments(
		rs.build.argumentsElements({ delimiter: Delimiter.None }, rs.build.identifier('a'), rs.build.identifier('b'))
	);
	const trailing = await createEngine(rust, { render: { argumentsElements: { item: { delimiter: Delimiter.Trailing } } } });
	expect(rs.render(unset).toString()).toBe('(a, b)');
	expect(trailing.render(unset).toString()).toBe('(a, b,)');
	expect(trailing.render(unset, { argumentsElements: { item: { delimiter: Delimiter.None } } }).toString()).toBe('(a, b)');
	expect(rs.render(unset, { argumentsElements: { item: { delimiter: Delimiter.Trailing } } }).toString()).toBe('(a, b,)');
	expect(trailing.render(none).toString()).toBe('(a, b)');
});

it('a kind-scoped separator override applies only to its own kind, leaving an unconfigured kind at the engine default', async () => {
	const args = rs.build.arguments(rs.build.argumentsElements(rs.build.identifier('a'), rs.build.identifier('b')));
	const lifetimes = rs.build.lifetimes(rs.build.lifetime('a'), rs.build.lifetime('b'));
	const engine = await createEngine(rust, {
		render: { lifetimes: { item: { separator: { comma: { after: rs.kinds.Tight } } } } }
	});
	expect(engine.render(lifetimes).toString()).toBe("'a,'b");
	expect(engine.render(args).toString()).toBe('(a, b)');
});

it('two adjacent seam requests at the same gap coalesce to a single line break', async () => {
	const args = rs.build.arguments(rs.build.argumentsElements(rs.build.identifier('a'), rs.build.identifier('b')));
	const engine = await createEngine(rust, {
		render: {
			argumentsElements: {
				item: {
					attributedArgument: { after: rs.kinds.Newline },
					separator: { comma: { before: rs.kinds.Newline } }
				}
			}
		}
	});
	expect(engine.render(args).toString()).toBe('(a\n, b)');
});
