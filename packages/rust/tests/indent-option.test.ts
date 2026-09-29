// The indent unit is a string of the characters the grammar's whitespace
// admits (`IndentChar`, here ' ' and '\t'): checked whole at compile time
// where the unit is a literal, and at engine construction for any string.
import { describe, expect, it } from 'vitest';
import { createEngine, ir } from '../src/index.ts';

const fn = () =>
	ir.functionItem({ name: 'f', parameters: ir.parameters(), body: ir.block({ statements: [ir.expressionStatement(ir.identifier('a'))] }) });

describe('indent option', () => {
	it('indents with a tab, and the tab-indented text reads back to the same render', () => {
		const engine = createEngine({ options: { indent: '\t' } });
		const text = engine.render(fn()).toString();
		expect(text).toBe('fn f() {\n\ta;\n}');
		expect(engine.render(engine.parse(`${text}\n`) as never).toString()).toBe(`${text}\n`);
	});

	it('keeps the four-space default when no unit is given', () => {
		expect(createEngine().render(fn()).toString()).toBe('fn f() {\n    a;\n}');
	});

	it('takes any non-empty run of admitted characters, per engine or per call', () => {
		expect(createEngine({ options: { indent: '\t\t' } }).render(fn()).toString()).toBe('fn f() {\n\t\ta;\n}');
		expect(createEngine({ options: { indent: '    ' } }).render(fn()).toString()).toBe('fn f() {\n    a;\n}');
		expect(createEngine().render(fn(), { options: { indent: '  ' } }).toString()).toBe('fn f() {\n  a;\n}');
	});

	it('refuses a unit that is empty or holds a character the whitespace does not admit', () => {
		// @ts-expect-error 'x' is not an indent character
		expect(() => createEngine({ options: { indent: 'x' } })).toThrow(/indent "x" is not a unit of \[' ', '\\t'\]/);
		// @ts-expect-error a line break is not an indent character
		expect(() => createEngine({ options: { indent: ' \n' } })).toThrow(/is not a unit of/);
		// @ts-expect-error an empty unit indents nothing
		expect(() => createEngine({ options: { indent: '' } })).toThrow(/is not a unit of/);
		// @ts-expect-error per-call units are checked the same way
		expect(() => createEngine().render(fn(), { options: { indent: 'x' } }).toString()).toThrow(/is not a unit of/);
		const wide: string = 'x';
		expect(() => createEngine({ options: { indent: wide } })).toThrow(/is not a unit of/);
	});
});
