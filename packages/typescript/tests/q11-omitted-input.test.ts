import { afterAll, describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';

const engines = {
	object: await typescript.createEngine({ nodeStorage: 'object' }),
	records: await typescript.createEngine()
};

afterAll(() => {
	for (const engine of Object.values(engines)) engine.dispose();
});

type Builder = (...args: unknown[]) => unknown;
type Builders = { readonly finallyClause: Builder; readonly typeQueryCallExpression: Builder; readonly classStaticBlock: Builder };

const render = (node: unknown): string => String((node as { $render(): unknown }).$render());

describe.each(Object.entries(engines))('an omitted input in the %s storage', (_, engine) => {
	const b = engine.build as unknown as Builders;
	const options = { staticKeyword: { after: undefined } };

	it('a spread target (a statement block inside a finally clause) builds its default with no value or undefined', () => {
		expect(render(b.finallyClause())).toBe('finally {}');
		expect(render(b.finallyClause(undefined))).toBe('finally {}');
	});

	it('a spread target (an argument list inside a type query call) builds its default with no value or undefined', () => {
		expect(render(b.typeQueryCallExpression())).toBe('import()');
		expect(render(b.typeQueryCallExpression(undefined))).toBe('import()');
	});

	it('a value-plus-options target (a class static block) builds its default and keeps the options passed alongside undefined', () => {
		expect(render(b.classStaticBlock())).toBe('static {}');
		expect(render(b.classStaticBlock(undefined))).toBe('static {}');
		expect(render(b.classStaticBlock(undefined, options))).toBe('static {}');
	});
});
