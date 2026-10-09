// Every read goes through the typed read: a written node renders what was
// written while an untouched sibling keeps its tokens in order, and a read
// text leaf crosses plain.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { treeTokenOf } from '@sittir/common/utils';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

describe('the typed read', () => {
	it('renders a trivia write on a read function item, and its untouched sibling with its tokens in order', () => {
		const source = 'fn a() {}\nfn   b( )  {}\n';
		const root = rs.parse(source);
		const [first] = root.statements();
		if (first === undefined || !rs.is.functionItem(first)) throw new Error('expected a function item');
		first.$trivia.leading(rs.build.lineComment.regular(' new'));
		const rendered = root.$render().toString();
		expect(rendered.startsWith('// new\nfn a() {}\n')).toBe(true);
		const sibling = rendered.slice('// new\nfn a() {}\n'.length);
		expect(sibling.replace(/\s+/g, '')).toBe('fnb(){}');
	});

	it('reads a let declaration at depth one with its value a plain identifier transport', () => {
		const source = 'let x = a;';
		const letDecl = rs.parse(source).statements()[0];
		if (letDecl === undefined || !rs.is.letDeclaration(letDecl)) throw new Error('expected a let declaration');
		const value = letDecl.value() as unknown as Record<string, unknown>;
		expect(value.$type).toBe(rs.kinds.Identifier);
		expect(value.$text).toBe('a');
		expect(value.$_layout).toMatchObject({ at: { $span: { start: 8, end: 9 }, $type: rs.kinds.Identifier } });
		expect(treeTokenOf(value)).toBeDefined();
		expect(value.$render).toBeUndefined();
		expect(letDecl.$render().toString()).toBe(source);
	});
});
