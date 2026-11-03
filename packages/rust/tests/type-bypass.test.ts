import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const trusting = await createEngine(rust, { api: 'strict' });
const verifying = await createEngine(rust, { api: 'strict', verifyStructure: 'runtime' });

const returning = (engine: typeof trusting, value: unknown) => (engine.build.returnExpression as unknown as (v: unknown) => { $render(): string })(value);

describe('a value the strict types refuse, given anyway: the default mode trusts the types', () => {
	it('bare text in a node slot is refused in runtime mode', () => {
		expect(() => returning(verifying, 'x')).toThrow(/ReturnExpression\.expression: a strict factory takes a built node, not a string; expected a built /);
	});

	it('a list at a slot that holds one value is refused in runtime mode', () => {
		const list = [verifying.build.identifier('a'), verifying.build.identifier('b')];
		expect(() => returning(verifying, list)).toThrow(/ReturnExpression\.expression: holds one value, not a list/);
	});

	it('by default the native decode reads the text as verbatim', () => {
		expect(returning(trusting, 'x').$render()).toBe('return x');
	});
});
