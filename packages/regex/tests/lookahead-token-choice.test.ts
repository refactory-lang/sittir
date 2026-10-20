import { expect, it } from 'vitest';
import regex from '../src/index.ts';
import { ir as irBuilders } from '../src/ir.ts';

const is = regex.is as unknown as Record<string, any>;
const ir = irBuilders as unknown as Record<string, any>;

it('a token-choice value arm builds through ir and has no is guard', () => {
	expect(typeof ir.lookaheadAssertion.eq).toBe('function');
	expect(is.lookaheadAssertion?.eq).toBeUndefined();
});
