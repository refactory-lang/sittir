/**
 * Tests for `countSlots` — the shared slot-count primitive built on
 * `isNonterminalRuleType` (Table 1).
 *
 * Distribution semantics mirror `collectSlots`:
 *   - seq       → sum of member counts (distribute)
 *   - choice    → 1 (union slot — do NOT distribute)
 *   - symbol / supertype / pattern / enum → 1
 *   - field / optional / repeat / repeat1 → 1 boundary
 *   - variant / group / clause            → transparent recurse
 *   - string / terminal / indent / dedent / newline → 0
 */

import { describe, it, expect } from 'vitest';
import { countSlots } from './slot-count.ts';

const sym = (name: string) => ({ type: 'symbol', name }) as any;
const str = (v: string) => ({ type: 'string', value: v }) as any;
const seq = (...m: any[]) => ({ type: 'seq', members: m }) as any;
const choice = (...m: any[]) => ({ type: 'choice', members: m }) as any;
const repeat = (content: any) => ({ type: 'repeat', content }) as any;
const field = (fieldName: string, content: any) => ({ type: 'field', fieldName, content }) as any;

describe('countSlots — Table 1 distribution', () => {
	it('symbol = 1', () => expect(countSlots(sym('x'))).toBe(1));
	it('bare literal = 0', () => expect(countSlots(str(','))).toBe(0));
	it('seq distributes nested seq', () =>
		expect(countSlots(seq(str('('), seq(sym('a'), str(','), sym('b')), str(')')))).toBe(2));
	it('choice is ONE union slot (not distributed)', () =>
		expect(countSlots(choice(sym('a'), sym('b'), str('lit')))).toBe(1));
	it('literal-only choice still 1 slot', () =>
		expect(countSlots(choice(str('<'), str('>')))).toBe(1));
	it('field = 1', () => expect(countSlots(field('n', seq(sym('a'), sym('b'))))).toBe(1));
	it('repeat of single symbol = 1', () => expect(countSlots(repeat(sym('x')))).toBe(1));
	it('seq of only literals = 0', () => expect(countSlots(seq(str(','), str(';')))).toBe(0));
});
