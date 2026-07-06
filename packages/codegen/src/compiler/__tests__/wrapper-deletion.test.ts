/**
 * Tests for applyWrapperDeletion (PR1 Task 2.A2).
 *
 * Verifies that wrapper rules (optional / field / repeat / repeat1) are
 * pushed down to RuleBase modifier attributes (multiplicity / fieldName /
 * separator) on the leaf rule, and that structural rules (seq / choice)
 * are recursed into so all wrappers are eliminated throughout the tree.
 */

import { CHOICE, FIELD, OPTIONAL, REPEAT, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import { deleteWrapper, applyWrapperDeletion } from '../wrapper-deletion.ts';
import type {
	Rule,
	RuleBase,
	OptionalRule,
	RepeatRule,
	Repeat1Rule,
	FieldRule,
	SymbolRule,
	SeqRule,
} from '../../types/rule.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sym = (name: string): SymbolRule => ({ type: SYMBOL, name });

// ---------------------------------------------------------------------------
// deleteWrapper — single-rule form
// ---------------------------------------------------------------------------

describe('deleteWrapper — optional', () => {
	it('lifts optional → multiplicity: "optional" on inner symbol', () => {
		const wrapped: OptionalRule = { type: OPTIONAL, content: sym('expression') };
		const out = deleteWrapper(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.multiplicity).toBe('optional');
		expect((out as SymbolRule).name).toBe('expression');
	});

	it('does not stamp multiplicity: "single" (default)', () => {
		// A bare symbol (no wrapper) should not have multiplicity set at all
		const out = deleteWrapper(sym('foo'));
		expect(out.multiplicity).toBeUndefined();
	});
});

describe('deleteWrapper — field', () => {
	it('lifts field → fieldName on inner symbol', () => {
		const wrapped: FieldRule = { type: FIELD, name: 'value', content: sym('expression') };
		const out = deleteWrapper(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.fieldName).toBe('value');
		expect(out.multiplicity).toBeUndefined();
	});
});

describe('deleteWrapper — repeat', () => {
	it('lifts repeat → multiplicity: "array" on inner symbol', () => {
		const wrapped: RepeatRule = { type: REPEAT, content: sym('item') };
		const out = deleteWrapper(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.multiplicity).toBe('array');
	});

	it('lifts repeat with nested separator → carries the object across unchanged', () => {
		const wrapped: RepeatRule = {
			type: REPEAT,
			content: sym('item'),
			separator: { value: { type: 'STRING', value: ',' } },
		};
		const out = deleteWrapper(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.multiplicity).toBe('array');
		expect(out.separator).toEqual({ value: { type: 'STRING', value: ',' } });
	});

	it('lifts repeat with separator + trailing/leading → nested object rides along for free', () => {
		// wrapper-deletion's REPEAT case does NOT reconstruct trailing/leading
		// from separate fields — it carries the whole `separator` object across
		// unchanged, since RepeatRule<'link'> already nests them (PR-S).
		const wrapped: RepeatRule = {
			type: REPEAT,
			content: sym('item'),
			separator: { value: { type: 'STRING', value: ',' }, trailing: true, leading: false },
		};
		const out = deleteWrapper(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.multiplicity).toBe('array');
		expect(out.separator).toEqual({
			value: { type: 'STRING', value: ',' },
			trailing: true,
			leading: false,
		});
	});

	it('an orphan trailing/leading-without-a-separator state is structurally impossible', () => {
		// There is no way to construct a RepeatRule with `trailing`/`leading` set
		// but no `separator` — they only exist nested INSIDE `separator` now.
		const wrapped: RepeatRule = { type: REPEAT, content: sym('item') };
		expect(wrapped.separator).toBeUndefined();
		const out = deleteWrapper(wrapped);
		expect(out.separator).toBeUndefined();

		// Compile-time pin: the invariant above is a TYPE guarantee, not just a
		// runtime observation — `true` under the OLD sibling shape too (a bare
		// symbol legitimately had no `trailing`/`leading` either). What actually
		// changed is that the old orphan literal (top-level `trailing`/`leading`
		// alongside `separator: undefined`) no longer type-checks at all: those
		// fields only exist nested inside `separator` now. If a future change
		// reintroduces unused top-level siblings on RuleBase<NormalizedPhase>,
		// this assignment would stop erroring and `@ts-expect-error` itself would
		// fail (checked by `tsgo --noEmit`, not by vitest's transform-only run).
		// @ts-expect-error — trailing/leading are not top-level RuleBase siblings; they only exist nested inside `separator`.
		const orphan: RuleBase<'normalize'> = { separator: undefined, trailing: true };
		void orphan;
	});
});

describe('deleteWrapper — repeat1', () => {
	it('lifts repeat1 → multiplicity: "nonEmptyArray" on inner symbol', () => {
		const wrapped: Repeat1Rule = { type: REPEAT1, content: sym('item') };
		const out = deleteWrapper(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.multiplicity).toBe('nonEmptyArray');
	});
});

// ---------------------------------------------------------------------------
// Structural recursion
// ---------------------------------------------------------------------------

describe('deleteWrapper — seq recursion', () => {
	it('recurses into seq members and deletes wrappers inside', () => {
		const a: OptionalRule = { type: OPTIONAL, content: sym('a') };
		const b: SymbolRule = sym('b');
		const seq: SeqRule<'link'> = { type: SEQ, members: [a, b] };
		const out = deleteWrapper(seq);
		expect(out.type).toBe('SEQ');
		const members = (out as SeqRule).members;
		expect(members).toHaveLength(2);
		expect(members[0]!.type).toBe('SYMBOL');
		expect(members[0]!.multiplicity).toBe('optional');
		expect(members[1]!.type).toBe('SYMBOL');
		expect(members[1]!.multiplicity).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// Stacked wrappers
// ---------------------------------------------------------------------------

describe('deleteWrapper — stacked wrappers', () => {
	it('field(optional(symbol)) → symbol with fieldName AND multiplicity:optional', () => {
		const inner: OptionalRule = { type: OPTIONAL, content: sym('expr') };
		const wrapped: FieldRule = { type: FIELD, name: 'value', content: inner };
		const out = deleteWrapper(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.fieldName).toBe('value');
		expect(out.multiplicity).toBe('optional');
	});

	it('optional(field(symbol)) → symbol with fieldName AND multiplicity:optional', () => {
		const inner: FieldRule = { type: FIELD, name: 'value', content: sym('expr') };
		const wrapped: OptionalRule = { type: OPTIONAL, content: inner };
		const out = deleteWrapper(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.fieldName).toBe('value');
		expect(out.multiplicity).toBe('optional');
	});
});

// ---------------------------------------------------------------------------
// Idempotence
// ---------------------------------------------------------------------------

describe('deleteWrapper — idempotence', () => {
	it('applying twice yields same result as applying once', () => {
		const wrapped: OptionalRule = { type: OPTIONAL, content: sym('expression') };
		const once = deleteWrapper(wrapped);
		const twice = deleteWrapper(once as Rule);
		expect(twice).toEqual(once);
	});
});

// ---------------------------------------------------------------------------
// applyWrapperDeletion — map form
// ---------------------------------------------------------------------------

describe('applyWrapperDeletion — map form', () => {
	it('transforms every rule in the map', () => {
		const rules: Record<string, Rule<'link'>> = {
			foo: { type: OPTIONAL, content: sym('bar') } as OptionalRule,
			baz: sym('qux'),
		};
		const result = applyWrapperDeletion(rules);
		expect(result['foo']!.type).toBe('SYMBOL');
		expect(result['foo']!.multiplicity).toBe('optional');
		expect(result['baz']!.type).toBe('SYMBOL');
		expect(result['baz']!.multiplicity).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// deleteWrapper — separator sub-rule recursion (PR-S task 4)
// ---------------------------------------------------------------------------

describe('separator sub-rules get the same push-down as ordinary content', () => {
	it('pushes a FIELD wrapper inside a choice-shaped separator down to a leaf attribute', () => {
		const rule = {
			type: REPEAT,
			content: sym('item'),
			separator: {
				value: {
					type: CHOICE,
					members: [
						{ type: FIELD, name: 'sep_kind', content: { type: STRING, value: ',' } },
						{ type: STRING, value: ';' },
					],
				},
			},
		} as unknown as Rule<'link'>;
		const out = deleteWrapper(rule) as unknown as {
			separator: { value: { members: { fieldName?: string; type: string }[] } };
		};
		expect(out.separator.value.members[0]!.fieldName).toBe('sep_kind');
		expect(out.separator.value.members[0]!.type).toBe('STRING');
	});
});
