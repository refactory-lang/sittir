import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

describe('a class static block takes its statement block as an optional value', () => {
	it('keeps its options when the value is undefined', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		const built = ts.build.classStaticBlock(undefined, { terminator: ts.kinds.AutomaticSemicolon });
		expect(built.terminator()).toBe(ts.kinds.AutomaticSemicolon);
	});

	it('is admitted with no value, and builds an empty block', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		expect(ts.build.classStaticBlock().$render()).toBe('static {}');
	});

	it('types a value that is not a statement block as an error (negative control)', async () => {
		await using ts = await createEngine(typescript, { api: 'strict' });
		// @ts-expect-error a value, when given, must be a statement block
		const refused = ts.build.classStaticBlock(ts.build.identifier('x'));
		expect(refused).toBeDefined();
	});
});
