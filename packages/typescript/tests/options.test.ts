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
		array: { elements: { separator: { comma: { after: TSKindId.Newline } }, start: TSKindId.Tight, end: TSKindId.Tight } },
		formal_parameters_elements: {
			formal_parameter: { separator: { comma: { after: TSKindId.Space } }, delimiter: Delimiter.Trailing }
		},
		object_type_content: {
			content: { separator: { kind: TSKindId.Semi, after: TSKindId.Newline }, delimiter: Delimiter.Trailing }
		},
		enum_body_elements: { content: { separator: { comma: { after: TSKindId.Newline } }, delimiter: Delimiter.Trailing } },
		statements: { terminator: TSKindId.AutomaticSemicolon },
		quotes: { style: TSKindId.StringSingle },
		class_body: { lbrace: { after: TSKindId.Indent }, rbrace: { before: TSKindId.Dedent } },
		indent: '\t'
	};
	const bad: Options = {
		// @ts-expect-error a semicolon is not a whitespace kind
		array: { elements: { separator: { comma: { after: TSKindId.Semi } } } },
		formal_parameters_elements: {
			// @ts-expect-error the leading flank is fixed here
			formal_parameter: { delimiter: Delimiter.Leading }
		},
		// @ts-expect-error a separator is one of its literal kinds
		object_type_content: { content: { separator: { kind: TSKindId.Colon } } },
		// @ts-expect-error a brace has no 'sideways' edge
		class_body: { lbrace: { sideways: TSKindId.Space } }
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});

it('engine options set the spacing of a built list and per-call options override them', () => {
	const tight = createEngine({ options: { array: { elements: { separator: { comma: { after: TSKindId.Tight } } } } } });
	const spaced = createEngine({ options: { array: { elements: { separator: { comma: { after: TSKindId.Space } } } } } });
	const list = ir.array({ elements: ['a', 'b'] });
	expect(tight.render(list).toString()).toBe('[a,b]');
	expect(spaced.render(list).toString()).toBe('[a, b]');
	expect(
		tight.render(list, { options: { array: { elements: { separator: { comma: { after: TSKindId.Newline } } } } } }).toString()
	).toBe('[a,\nb]');
	expect(
		spaced.render(list, { options: { array: { elements: { separator: { comma: { before: TSKindId.Space } } } } } }).toString()
	).toBe('[a , b]');
});

it('an unknown key, an address naming no site, and a value a site does not admit are refused at construction', () => {
	expect(() => createEngine({ options: { nope: 1 } as never })).toThrow(/unknown key nope/);
	expect(() => createEngine({ options: { array: { elements: { sideways: TSKindId.Space } } } as never })).toThrow(
		/\(array\)\/elements:\/sideways names no site/
	);
	expect(() =>
		createEngine({ options: { array: { elements: { separator: { comma: { after: TSKindId.Semi } } } } } as never })
	).toThrow(/does not admit kind id/);
});
