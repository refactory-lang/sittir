import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(language, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(language, { nodeStorage: 'object' }))
};

describe.each(Object.entries(engines))('a C# method with no body, in %s storage', (_, engine) => {
	const kinds = engine.kinds as unknown as Record<string, number>;
	const ir = engine.build as unknown as Record<string, (config?: unknown) => unknown>;
	const tokens = (node: unknown) => String(engine.render(node as never)).replace(/\s+/g, '');

	it('reads no body and builds through the arm that ends in ;', () => {
		const parsed = engine.parse('abstract class C { abstract int M(int a); }');
		expect(parsed.$errors).toHaveLength(0);
		const read = [...parsed.$query().$descendants.ofType(kinds.MethodDeclaration as never)][0] as unknown as Record<
			string,
			() => unknown
		>;
		expect(read.body!()).toBeUndefined();
		const built = ir.methodDeclaration!({ returns: read.returns!(), name: 'M', parameters: read.parameters!() });
		expect(tokens(built)).toBe('intM(inta);');
		expect(engine.parse(`abstract class C { abstract ${String(engine.render(built as never))} }`).$errors).toHaveLength(
			0
		);
	});
});
