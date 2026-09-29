// The indent unit is a string of the characters the grammar's whitespace
// admits (`IndentChar`, here ' ' and '\t'): checked whole at compile time
// where the unit is a literal, and at engine construction for any string.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

const fn = () =>
	rs.build.functionItem({
		name: 'f',
		parameters: rs.build.parameters(),
		body: rs.build.block({ statements: [rs.build.expressionStatement(rs.build.identifier('a'))] })
	});

describe('indent option', () => {
	it('indents with a tab, and the tab-indented text reads back to the same render', async () => {
		const engine = await createEngine(rust, { render: { indent: '\t' } });
		const text = engine.render(fn()).toString();
		expect(text).toBe('fn f() {\n\ta;\n}');
		expect(engine.render(engine.parse(`${text}\n`) as never).toString()).toBe(`${text}\n`);
	});

	it('keeps the four-space default when no unit is given', () => {
		expect(rs.render(fn()).toString()).toBe('fn f() {\n    a;\n}');
	});

	it('takes any non-empty run of admitted characters, per engine or per call', async () => {
		expect((await createEngine(rust, { render: { indent: '\t\t' } })).render(fn()).toString()).toBe('fn f() {\n\t\ta;\n}');
		expect((await createEngine(rust, { render: { indent: '    ' } })).render(fn()).toString()).toBe('fn f() {\n    a;\n}');
		expect(rs.render(fn(), { indent: '  ' }).toString()).toBe('fn f() {\n  a;\n}');
	});

	it('refuses a unit that is empty or holds a character the whitespace does not admit', async () => {
		// @ts-expect-error 'x' is not an indent character
		await expect(createEngine(rust, { render: { indent: 'x' } })).rejects.toThrow(/indent "x" is not a unit of \[' ', '\\t'\]/);
		// @ts-expect-error a line break is not an indent character
		await expect(createEngine(rust, { render: { indent: ' \n' } })).rejects.toThrow(/is not a unit of/);
		// @ts-expect-error an empty unit indents nothing
		await expect(createEngine(rust, { render: { indent: '' } })).rejects.toThrow(/is not a unit of/);
		// @ts-expect-error per-call units are checked the same way
		expect(() => rs.render(fn(), { indent: 'x' }).toString()).toThrow(/is not a unit of/);
		const wide: string = 'x';
		await expect(createEngine(rust, { render: { indent: wide } })).rejects.toThrow(/is not a unit of/);
	});
});
