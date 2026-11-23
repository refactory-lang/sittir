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
		['foo();', 'expression.call'],
		['x = 1;', 'expression.assignment'],
		['i++;', 'expression.update']
	])('%s reads as its expression and rebuilds through its block', async (statement, path) => {
		const runtime = await portableRuntime(engine);
		const parsed = engine.parse(`class C { void f() { ${statement} } }`);
		const block = [...parsed.$query().$descendants.ofType(engine.kinds.Block)][0]!;
		const read = runtime.read(block) as { readonly statements: readonly { readonly $path: string }[] };
		expect(read.statements[0]!.$path.startsWith(path)).toBe(true);
		expect(withoutSpace(String(engine.render(runtime.build(read as never) as never)))).toBe(withoutSpace(`{ ${statement} }`));
	});
});
