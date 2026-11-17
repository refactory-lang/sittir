import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

describe.each(['arena', 'object'] as const)('the typescript hoist sets through its wrappers, %s storage', (nodeStorage) => {
	const open = async (code: string) => {
		const e = await createEngine(typescript, { nodeStorage });
		return { e, root: e.parse(code) };
	};

	it('replaces the parts inside the backticks of a tagged template', async () => {
		const { e, root } = await open('tag`a${b}c`;\ntag`x`;\n');
		const [first, second] = root.statements();
		const call = (statement: unknown) => {
			const expression = (statement as { expression(): unknown }).expression();
			if (!e.is.callExpressionTemplateCall(expression as never)) throw new Error('expected a tagged template');
			return expression as ReturnType<typeof e.parse> & { $with: { arguments(...parts: unknown[]): unknown }; arguments(): readonly unknown[] };
		};
		const edited = call(first).$with.arguments(...call(second).arguments());
		expect(String(e.render(edited as never))).toBe('tag`x`');
		e[Symbol.dispose]();
	});

	it('sets the members of an object type through its content and keeps the braces', async () => {
		const { e, root } = await open('type A = { a: string };\ntype B = { b: number; c: number };\n');
		const [a, b] = root.statements();
		const objectType = (statement: unknown) => {
			const value = (statement as { value(): unknown }).value();
			if (!e.is.objectType(value as never)) throw new Error('expected an object type');
			return value as { $with: { members(...items: unknown[]): unknown }; members(): readonly unknown[] };
		};
		const edited = objectType(a).$with.members(...objectType(b).members());
		expect(String(e.render(edited as never)).replace(/\s+/g, ' ')).toBe('{ b: number; c: number }');
		e[Symbol.dispose]();
	});

	it('replaces the single parameter of a setter signature inside the parentheses', async () => {
		const { e, root } = await open('class A { set x(v: number) {} }\nclass B { set y(w: string) {} }\n');
		const methodOf = (statement: unknown) => {
			const body = (statement as { body(): readonly unknown[] }).body();
			const method = (body[0] as { methodDefinition(): unknown }).methodDefinition();
			if (!e.is.methodDefinitionSetter(method as never)) throw new Error('expected a method');
			return method as { $with: { parameters(...items: unknown[]): unknown }; parameters(): unknown };
		};
		const [a, b] = root.statements();
		const edited = methodOf(a).$with.parameters(methodOf(b).parameters());
		expect(String(e.render(edited as never))).toBe('set x(w: string) {}');
		e[Symbol.dispose]();
	});
});
