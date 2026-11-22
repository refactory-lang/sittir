import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const forms = ['new int[3]', 'new int[3][]', 'new int[3][4]', 'new int[]{1, 2}', 'new int[][]{{1}, {2}}', 'new @A int[3]', 'new Foo[n]'];
const withoutSpace = (text: string): string => text.replace(/\s+/g, '');

const engines = {
	arena: await sharedEngine(() => createEngine(language, { api: 'strict', nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(language, { api: 'strict', nodeStorage: 'object' }))
};

describe.each(Object.entries(engines))('an array creation in %s storage', (_, engine) => {
	it.each(forms)('%s reads as a list and rebuilds through its holder', async (form) => {
		const runtime = await portableRuntime(engine);
		const statement = `return ${form};`;
		const parsed = engine.parse(`class C { Object f() { ${statement} } }`);
		const holder = [...parsed.$query().$descendants.ofType(engine.kinds.ReturnStatement)][0]!;
		const read = runtime.read(holder) as { readonly expression: { readonly $path: string } };
		expect(read.expression.$path).toBe('expression.collection.list');
		expect(withoutSpace(String(engine.render(runtime.build(read as never) as never)))).toBe(withoutSpace(statement));
	});
});
