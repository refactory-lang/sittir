import { describe, expect, expectTypeOf, it } from 'vitest';
import { peelPrecs, unwrapPrec, unwrapPrecAndOptional } from '../rule-patterns.ts';
import type { AnyRule, PrecRule } from '../../types/rule.ts';

const leaf = { type: 'PATTERN', value: 'x' } as unknown as AnyRule;
const wrap = (type: string, content: unknown) => ({ type, value: 1, content }) as unknown as AnyRule;
const optional = (content: unknown) => ({ type: 'CHOICE', members: [content, { type: 'BLANK' }] }) as unknown as AnyRule;

describe('the one precedence peeler', () => {
	it.each(['PREC', 'PREC_LEFT', 'PREC_RIGHT', 'PREC_DYNAMIC', 'RESERVED'])('peels %s', (type) => {
		expect(unwrapPrec(wrap(type, leaf))).toBe(leaf);
	});

	it('peels any nesting of wrapper types, and leaves other rules alone', () => {
		expect(unwrapPrec(wrap('PREC', wrap('PREC_RIGHT', wrap('PREC_DYNAMIC', leaf))))).toBe(leaf);
		expect(unwrapPrec(leaf)).toBe(leaf);
		expect(unwrapPrec({ type: 'TOKEN', content: leaf })).toEqual({ type: 'TOKEN', content: leaf });
		expect(unwrapPrec(undefined)).toBeUndefined();
	});

	it('returns the wrappers it peeled, outermost first', () => {
		const inner = wrap('PREC_LEFT', leaf);
		const outer = wrap('PREC', inner);
		expect(peelPrecs(outer)).toEqual({ precs: [outer, inner], core: leaf });
		expect(peelPrecs(leaf)).toEqual({ precs: [], core: leaf });
	});

	it('also peels optional wrappers, interleaved with precedence', () => {
		expect(unwrapPrecAndOptional(wrap('PREC', optional(wrap('PREC_LEFT', optional(leaf)))))).toBe(leaf);
		expect(unwrapPrecAndOptional(leaf)).toBe(leaf);
	});

	it('types what is under a wrapper as its content, never as the wrapper', () => {
		const prec = wrap('PREC', leaf) as unknown as PrecRule<'evaluate'>;
		expectTypeOf(unwrapPrec(prec)).toEqualTypeOf<PrecRule<'evaluate'>['content']>();
		expectTypeOf(peelPrecs(prec).core).not.toEqualTypeOf<PrecRule<'evaluate'>>();
		expectTypeOf(peelPrecs(prec).precs).toEqualTypeOf<PrecRule<'evaluate'>[]>();
		expect(unwrapPrec(prec)).toBe(leaf);
	});
});
