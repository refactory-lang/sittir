import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a hoisted slot admits its items, its hoisted kind and its wrapper, %s storage', (nodeStorage) => {
	const open = async () => {
		const e = await createEngine(typescript, { nodeStorage });
		return { e, [Symbol.dispose]: () => e[Symbol.dispose]() };
	};

	it('builds parameters from their items', async () => {
		using opened = await open();
		const { e } = opened;
		const { build } = e;
		const fn = build.functionDeclaration({ name: 'f', parameters: [build.requiredParameter({ name: 'a' }), build.requiredParameter({ name: 'b' })], body: build.statementBlock() });
		expect(String(e.render(fn))).toBe('function f(a, b) {}');
	});

	it('admits the hoisted list node and the wrapper that holds it', async () => {
		using opened = await open();
		const { e } = opened;
		const { build } = e;
		const param = build.requiredParameter({ name: 'a' });
		const asList = build.functionDeclaration({ name: 'f', parameters: build.formalParametersElements(param), body: build.statementBlock() });
		const asWrapper = build.functionDeclaration({ name: 'f', parameters: build.formalParameters(param), body: build.statementBlock() });
		expect(String(e.render(asList))).toBe('function f(a) {}');
		expect(String(e.render(asWrapper))).toBe('function f(a) {}');
	});

	it('refuses a node of an unrelated kind', async () => {
		using opened = await open();
		const { build } = opened.e;
		// @ts-expect-error a statement block is neither the parameters nor an item of them
		build.functionDeclaration({ name: 'f', parameters: build.statementBlock(), body: build.statementBlock() });
	});
});
