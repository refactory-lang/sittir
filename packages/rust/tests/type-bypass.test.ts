import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const trusting = await createEngine(rust);
const verifying = await createEngine(rust, { verifyStructure: 'runtime' });

const returning = (engine: typeof trusting, value: unknown) => (engine.build.returnExpression.strict as unknown as (v: unknown) => { $render(): string })(value);

describe('a value the strict types refuse, given anyway: the default mode trusts the types', () => {
	it('bare text in a node slot is refused in runtime mode', () => {
		expect(() => returning(verifying, 'x')).toThrow(/ReturnExpression\.expression: a strict factory takes a built node, not a string; expected a built /);
	});

	it('by default the native decode reads the text as verbatim', () => {
		expect(returning(trusting, 'x').$render()).toBe('return x');
	});
});
