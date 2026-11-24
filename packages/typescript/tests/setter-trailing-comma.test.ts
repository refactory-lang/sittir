// A setter's single parameter may end with a comma. The comma is admitted only
// there: a two-parameter setter with a trailing comma stays a parse error.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

describe('setter_trailing_comma', () => {
	it.each([
		['class setter', 'class A { set x(v: number,) {} }\n'],
		['object setter', 'const o = { set y(v: number,) {} };\n']
	])('parses a %s with a trailing comma without errors, and renders it unedited', async (_label, source) => {
		await using ts = await createEngine(typescript);
		const tree = ts.parse(source);
		expect(tree.$errors).toHaveLength(0);
		expect(tree.$render()).toBe(source);
	});

	it('still refuses a trailing comma after a two-parameter setter', async () => {
		await using ts = await createEngine(typescript);
		expect(ts.parse('class A { set x(v: number, w: number,) {} }\n').$errors.length).toBeGreaterThan(0);
	});

	it('builds a setter that renders the comma when the option is set, and reads it back', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		const b = ts.build as Record<string, any>;
		const K = ts.kinds as Record<string, number>;
		const body = [...ts.parse('function f() {}').$query().$descendants.ofType(K.StatementBlock as never)][0];
		const parameter = b.setterParameter({ pattern: K.This });
		const parameters = b.formalParametersSetAccessorSignature(parameter, { trailingComma: K.Comma });
		const setter = b.classBodyMemberMethod.setter({ name: b.identifier('x'), parameters, body });
		expect(setter.$render()).toBe('set x(this,) {}');
		expect(setter.methodDefinition().parameters().trailingComma()).toBe(K.Comma);
	});
});
