import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const withoutSpace = (text: string): string => text.replace(/\s+/g, '');

const engines = {
	arena: await sharedEngine(() => createEngine(language, { api: 'strict', nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(language, { api: 'strict', nodeStorage: 'object' }))
};

describe.each(Object.entries(engines))('an expression statement in %s storage', (_, engine) => {
	it.each([
		['<-c', 'expression.unary'],
		['a + b', 'expression.binary']
	])('%s reads as its expression and rebuilds', async (statement, path) => {
		const runtime = await portableRuntime(engine);
		const parsed = engine.parse(`package p\nfunc f() {\n${statement}\n}\n`);
		const holder = [...parsed.$query().$descendants.ofType(engine.kinds.ExpressionStatement)][0]!;
		const read = runtime.read(holder) as { readonly $path: string };
		expect(read.$path.startsWith(path)).toBe(true);
		expect(withoutSpace(String(engine.render(runtime.build(read as never) as never)))).toBe(withoutSpace(statement));
	});
});
