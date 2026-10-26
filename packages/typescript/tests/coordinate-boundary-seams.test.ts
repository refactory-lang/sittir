import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import type { TreeHandle } from '@sittir/common/utils';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

const edited = (source: string, text: string) => {
	const tree = ts.diagnostics.parseAndRead(source).tree as TreeHandle;
	const end = (tree.read!(0, 1) as { $_layout: { at: { $end: number } } }).$_layout.at.$end;
	const index = Array.from({ length: end }, (_, at) => at).find((at) => {
		const read = tree.read!(at, 1) as { $_layout?: { at?: { $span: { start: number; end: number } } } };
		const span = typeof read === 'object' ? read.$_layout?.at?.$span : undefined;
		return span !== undefined && source.slice(span.start, span.end) === text;
	});
	if (index === undefined) throw new Error(`no node spells ${JSON.stringify(text)}`);
	tree.writeTriviaSide!(index, 'inner', [...(tree.triviaSide!(index, 'inner') ?? [])]);
	return tree.read!(index, 1);
};

describe('an untouched list in an edited node meets its braces as its template renders it', () => {
	it.each([
		['export type { UserType }\n', '{ UserType }'],
		['export type { UserType } from "./User.js";\n', '{ UserType }'],
		["export type { A, B, C as D } from 'mymodule';\n", '{ A, B, C as D }'],
		["export type { A } from './z.ts';\n", '{ A }']
	])('keeps the spaces inside the braces of %j', (source, text) => {
		expect(ts.render(edited(source, text) as never).toString()).toBe(text);
	});
});
