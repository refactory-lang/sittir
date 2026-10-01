import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';
import { Delimiter } from '@sittir/common/utils';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

it('the emitted Options type is pinned', async () => {
	expect(readFileSync(new URL('../src/options.ts', import.meta.url), 'utf8')).toMatchSnapshot();
});

it('types every site by kind id at its address and rejects a wrong member at compile time', async () => {
	const ok: Options = {
		array: { elements: { separator: { comma: { after: ts.kinds.Newline } }, start: ts.kinds.Tight, end: ts.kinds.Tight } },
		formalParametersElements: {
			formalParameter: { separator: { comma: { after: ts.kinds.Space } }, delimiter: Delimiter.Trailing }
		},
		objectTypeContent: {
			members: { separator: { kind: ts.kinds.Semi, after: ts.kinds.Newline }, delimiter: Delimiter.Trailing }
		},
		enumBodyElements: { element: { separator: { comma: { after: ts.kinds.Newline } }, delimiter: Delimiter.Trailing } },
		statements: { terminator: ts.kinds.AutomaticSemicolon },
		quotes: { style: ts.kinds.StringSingle },
		classBody: { lbrace: { after: ts.kinds.Indent }, rbrace: { before: ts.kinds.Dedent } },
		indent: '\t'
	};
	const bad: Options = {
		// @ts-expect-error a semicolon is not a whitespace kind
		array: { elements: { separator: { comma: { after: ts.kinds.Semi } } } },
		formalParametersElements: {
			// @ts-expect-error the leading flank is fixed here
			formalParameter: { delimiter: Delimiter.Leading }
		},
		// @ts-expect-error a separator is one of its literal kinds
		objectTypeContent: { members: { separator: { kind: ts.kinds.Colon } } },
		// @ts-expect-error a brace has no 'sideways' edge
		classBody: { lbrace: { sideways: ts.kinds.Space } }
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});

it('engine options set the spacing of a built list and per-call options override them', async () => {
	const tight = await createEngine(typescript, { render: { array: { elements: { separator: { comma: { after: ts.kinds.Tight } } } } } });
	const spaced = await createEngine(typescript, { render: { array: { elements: { separator: { comma: { after: ts.kinds.Space } } } } } });
	const list = ts.build.array({ elements: ['a', 'b'] });
	expect(tight.render(list).toString()).toBe('[a,b]');
	expect(spaced.render(list).toString()).toBe('[a, b]');
	expect(
		tight.render(list, { array: { elements: { separator: { comma: { after: ts.kinds.Newline } } } } }).toString()
	).toBe('[a,\nb]');
	expect(
		spaced.render(list, { array: { elements: { separator: { comma: { before: ts.kinds.Space } } } } }).toString()
	).toBe('[a , b]');
});

it('an unknown key, an address naming no site, and a value a site does not admit are refused at construction', async () => {
	await expect(createEngine(typescript, { render: { nope: 1 } as never })).rejects.toThrow(/unknown key nope/);
	await expect(createEngine(typescript, { render: { array: { elements: { sideways: ts.kinds.Space } } } as never })).rejects.toThrow(
		/\(array\)\/elements:\/sideways names no site/
	);
	await expect(createEngine(typescript, { render: { array: { elements: { separator: { comma: { after: ts.kinds.Semi } } } } } as never })
	).rejects.toThrow(/does not admit kind id/);
});

it('an omitted registered choice option renders the arm the options resolve, and a set one renders as set', async () => {
	const semi = await createEngine(typescript);
	const automatic = await createEngine(typescript, { render: { statements: { terminator: ts.kinds.AutomaticSemicolon } } });
	const omitted = ts.build.returnStatement.strict(ts.build.identifier('r'));
	expect(semi.render(omitted).toString()).toBe('return r;');
	expect(automatic.render(omitted).toString()).toBe('return r\n');
	expect(automatic.render(omitted, { statements: { terminator: ts.kinds.Semi } }).toString()).toBe('return r;');
	const set = ts.build.returnStatement.strict(ts.build.identifier('r'), { terminator: ts.kinds.Semi });
	expect(semi.render(set).toString()).toBe('return r;');
	expect(automatic.render(set).toString()).toBe('return r;');
});
