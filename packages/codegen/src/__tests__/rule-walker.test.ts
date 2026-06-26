/**
 * Unit tests for the live `findRepeatFlag` helper in
 * `compiler/template-walker.ts`. The `renderRuleTemplate` / `deriveWalkSlots`
 * pipeline was deleted in PR3 step 1; only the three `findRepeat*` query
 * functions remain in that module.
 */

import { CHOICE, FIELD, OPTIONAL, SEQ, STRING, SYMBOL } from '../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../types/rule.ts';
import { findRepeatFlag } from '../dsl/rule-transforms.ts';

// ---------------------------------------------------------------------------
// Tiny Rule-tree builders — keep tests readable.
// ---------------------------------------------------------------------------

const str = (value: string): Rule => ({ type: STRING, value });
const sym = (name: string): Rule => ({ type: SYMBOL, name });
const field = (name: string, content: Rule): Rule => ({
	type: FIELD,
	name,
	content
});
const seq = (...members: Rule[]): Rule => ({ type: SEQ, members });
const choice = (...members: Rule[]): Rule => ({ type: CHOICE, members });
const optional = (content: Rule): Rule => ({ type: OPTIONAL, content });

describe('findRepeatFlag', () => {
	// Direct unit coverage for the metadata walker that feeds the
	// joinByTrailing / joinByLeading template hints. Previously only
	// observable via templates.yaml diffs — a refactor that breaks
	// the nested-wrapper traversal would silently drop the hint.
	const repeatWith = (extras: Partial<Rule>): Rule =>
		({ type: 'repeat', content: sym('X'), separator: ',', ...extras }) as Rule;

	it('returns true for `repeat.trailing = true`', () => {
		expect(findRepeatFlag(repeatWith({ trailing: true }), 'trailing')).toBe(true);
		expect(findRepeatFlag(repeatWith({ trailing: true }), 'leading')).toBe(false);
	});

	it('returns true for `repeat.leading = true`', () => {
		expect(findRepeatFlag(repeatWith({ leading: true }), 'leading')).toBe(true);
		expect(findRepeatFlag(repeatWith({ leading: true }), 'trailing')).toBe(false);
	});

	it('returns false for plain repeat with no flag', () => {
		expect(findRepeatFlag(repeatWith({}), 'trailing')).toBe(false);
		expect(findRepeatFlag(repeatWith({}), 'leading')).toBe(false);
	});

	it('descends through seq / choice / optional / field wrappers', () => {
		const trailingRepeat = repeatWith({ trailing: true });
		const shape = field('list', optional(seq(str('['), trailingRepeat, str(']'))));
		expect(findRepeatFlag(shape, 'trailing')).toBe(true);
		const choiceShape = choice(sym('other'), trailingRepeat);
		expect(findRepeatFlag(choiceShape, 'trailing')).toBe(true);
	});

	it('returns false when no repeat is reachable', () => {
		const shape = seq(str('('), sym('X'), str(')'));
		expect(findRepeatFlag(shape, 'trailing')).toBe(false);
		expect(findRepeatFlag(shape, 'leading')).toBe(false);
	});
});
