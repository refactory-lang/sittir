/**
 * Tests for flattenRules.
 *
 * Verifies that wrapper rules (optional / field / repeat / repeat1) are
 * pushed down to RuleBase modifier attributes (multiplicity / fieldName /
 * separator) on the leaf rule, and that structural rules (seq / choice)
 * are recursed into so all wrappers are eliminated throughout the tree.
 */

import { CHOICE, FIELD, OPTIONAL, REPEAT, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import { flatten, flattenRules } from '../flatten.ts';
import type {
	Rule,
	RuleBase,
	OptionalRule,
	RepeatRule,
	Repeat1Rule,
	FieldRule,
	SymbolRule,
	SeqRule
} from '../../types/rule.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sym = (name: string): SymbolRule => ({ type: SYMBOL, name });

// ---------------------------------------------------------------------------
// flatten — single-rule form
// ---------------------------------------------------------------------------

describe('flatten — optional', () => {
	it('lifts optional → multiplicity: "optional" on inner symbol', () => {
		const wrapped: OptionalRule = { type: OPTIONAL, content: sym('expression') };
		const out = flatten(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.multiplicity).toBe('optional');
		expect((out as SymbolRule).name).toBe('expression');
	});

	it('does not stamp multiplicity: "single" (default)', () => {
		// A bare symbol (no wrapper) should not have multiplicity set at all
		const out = flatten(sym('foo'));
		expect(out.multiplicity).toBeUndefined();
	});
});

describe('flatten — field', () => {
	it('lifts field → fieldName on inner symbol', () => {
		const wrapped: FieldRule = { type: FIELD, name: 'value', content: sym('expression') };
		const out = flatten(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.fieldName).toBe('value');
		expect(out.multiplicity).toBeUndefined();
	});
});

describe('flatten — repeat', () => {
	it('lifts repeat → multiplicity: "array" on inner symbol', () => {
		const wrapped: RepeatRule = { type: REPEAT, content: sym('item') };
		const out = flatten(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.multiplicity).toBe('array');
	});

	it('lifts repeat with nested separator → carries the object across unchanged', () => {
		const wrapped: RepeatRule = {
			type: REPEAT,
			content: sym('item'),
			separator: { value: { type: 'STRING', value: ',' } }
		};
		const out = flatten(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.multiplicity).toBe('array');
		expect(out.separator).toEqual({ value: { type: 'STRING', value: ',', nonterminal: false } });
	});

	it('lifts repeat with separator + trailing/leading → nested object rides along for free', () => {
		// wrapper-deletion's REPEAT case does NOT reconstruct trailing/leading
		// from separate fields — it carries the whole `separator` object across
		// unchanged, since RepeatRule<'link'> already nests them.
		const wrapped: RepeatRule = {
			type: REPEAT,
			content: sym('item'),
			separator: { value: { type: 'STRING', value: ',' }, trailing: 'optional', leading: 'mandatory' }
		};
		const out = flatten(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.multiplicity).toBe('array');
		expect(out.separator).toEqual({
			value: { type: 'STRING', value: ',', nonterminal: false },
			trailing: 'optional',
			leading: 'mandatory'
		});
	});

	it('an orphan trailing/leading-without-a-separator state is structurally impossible', () => {
		// There is no way to construct a RepeatRule with `trailing`/`leading` set
		// but no `separator` — they only exist nested INSIDE `separator` now.
		const wrapped: RepeatRule = { type: REPEAT, content: sym('item') };
		expect(wrapped.separator).toBeUndefined();
		const out = flatten(wrapped);
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

describe('flatten — repeat1', () => {
	it('lifts repeat1 → multiplicity: "nonEmptyArray" on inner symbol', () => {
		const wrapped: Repeat1Rule = { type: REPEAT1, content: sym('item') };
		const out = flatten(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.multiplicity).toBe('nonEmptyArray');
	});
});

// ---------------------------------------------------------------------------
// Structural recursion
// ---------------------------------------------------------------------------

describe('flatten — seq recursion', () => {
	it('recurses into seq members and deletes wrappers inside', () => {
		const a: OptionalRule = { type: OPTIONAL, content: sym('a') };
		const b: SymbolRule = sym('b');
		const seq: SeqRule<'link'> = { type: SEQ, members: [a, b] };
		const out = flatten(seq);
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

describe('flatten — stacked wrappers', () => {
	it('field(optional(symbol)) → symbol with fieldName AND multiplicity:optional', () => {
		const inner: OptionalRule = { type: OPTIONAL, content: sym('expr') };
		const wrapped: FieldRule = { type: FIELD, name: 'value', content: inner };
		const out = flatten(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.fieldName).toBe('value');
		expect(out.multiplicity).toBe('optional');
	});

	it('optional(field(symbol)) → symbol with fieldName AND multiplicity:optional', () => {
		const inner: FieldRule = { type: FIELD, name: 'value', content: sym('expr') };
		const wrapped: OptionalRule = { type: OPTIONAL, content: inner };
		const out = flatten(wrapped);
		expect(out.type).toBe('SYMBOL');
		expect(out.fieldName).toBe('value');
		expect(out.multiplicity).toBe('optional');
	});
});

// ---------------------------------------------------------------------------
// Idempotence
// ---------------------------------------------------------------------------

describe('flatten — idempotence', () => {
	it('applying twice yields same result as applying once', () => {
		const wrapped: OptionalRule = { type: OPTIONAL, content: sym('expression') };
		const once = flatten(wrapped);
		const twice = flatten(once as Rule);
		expect(twice).toEqual(once);
	});
});

// ---------------------------------------------------------------------------
// flattenRules — map form
// ---------------------------------------------------------------------------

describe('flattenRules — map form', () => {
	it('transforms every rule in the map', () => {
		const rules: Record<string, Rule<'link'>> = {
			foo: { type: OPTIONAL, content: sym('bar') } as OptionalRule,
			baz: sym('qux')
		};
		const result = flattenRules(rules);
		expect(result['foo']!.type).toBe('SYMBOL');
		expect(result['foo']!.multiplicity).toBe('optional');
		expect(result['baz']!.type).toBe('SYMBOL');
		expect(result['baz']!.multiplicity).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// flatten — separator sub-rule recursion
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
						{ type: STRING, value: ';' }
					]
				}
			}
		} as unknown as Rule<'link'>;
		const out = flatten(rule) as unknown as {
			separator: { value: { members: { fieldName?: string; type: string }[] } };
		};
		expect(out.separator.value.members[0]!.fieldName).toBe('sep_kind');
		expect(out.separator.value.members[0]!.type).toBe('STRING');
	});
});

describe('flatten — rule identity', () => {
	it('an outer wrapper id wins over its content id', () => {
		const out = flatten({ type: OPTIONAL, id: 'outer', content: { ...sym('x'), id: 'inner' } } as Rule<'link'>);
		expect(out.id).toBe('outer');
	});

	it('a built node keeps its own id when the wrapper has none', () => {
		const out = flatten({ type: OPTIONAL, content: { ...sym('x'), id: 'inner' } } as Rule<'link'>);
		expect(out.id).toBe('inner');
	});

	it('a singleton seq collapses onto its member and carries the seq id', () => {
		const out = flatten({ type: 'SEQ', id: 'seq', members: [{ ...sym('x'), id: 'inner' }] } as Rule<'link'>);
		expect(out.type).toBe('SYMBOL');
		expect(out.id).toBe('seq');
	});
});

describe('flatten — rule-id precedence', () => {
	it('a SEQ keeps its own id; the id is never overwritten by a member id', () => {
		const wrapped = {
			type: SEQ,
			id: 'rule:x:root',
			members: [{ ...sym('a'), id: 'rule:x:members.0' }]
		} as unknown as SeqRule;
		const out = flatten(wrapped);
		expect(out.id).toBe('rule:x:root');
	});

	it('an OPTIONAL wrapper id survives onto the flattened leaf', () => {
		const wrapped = {
			type: OPTIONAL,
			id: 'rule:x:opt',
			content: { ...sym('b'), id: 'rule:x:inner' }
		} as unknown as OptionalRule;
		const out = flatten(wrapped);
		expect(out.id).toBe('rule:x:opt');
		expect(out.multiplicity).toBe('optional');
	});

	it('a FIELD wrapper id survives onto the flattened leaf', () => {
		const wrapped = {
			type: FIELD,
			id: 'rule:x:field',
			name: 'v',
			content: { ...sym('c'), id: 'rule:x:inner' }
		} as unknown as FieldRule;
		const out = flatten(wrapped);
		expect(out.id).toBe('rule:x:field');
		expect(out.fieldName).toBe('v');
	});
});


describe('shared literals factored out of a choice of seqs', () => {
	const lit = (value: string): Rule<'link'> => ({ type: STRING, value, nonterminal: false }) as Rule<'link'>;
	const seq = (...members: Rule<'link'>[]): Rule<'link'> => ({ type: SEQ, members }) as Rule<'link'>;
	const choice = (...members: Rule<'link'>[]): Rule<'link'> => ({ type: CHOICE, members }) as Rule<'link'>;
	const shape = (rule: RuleBase & { type: string }): string => {
		const r = rule as { type: string; value?: string; name?: string; members?: (RuleBase & { type: string })[] };
		if (r.type === STRING) return `'${r.value}'`;
		if (r.type === SYMBOL) return r.name!;
		const inner = (r.members ?? []).map(shape);
		return r.type === CHOICE ? `(${inner.join(' | ')})` : `[${inner.join(' ')}]`;
	};

	it("keeps a literal of one arm's middle: `{ n }` and `{ , m }` read as `{`, a choice of `n` and `, m`, then `}`", () => {
		const out = flattenRules({ count: choice(seq(lit('{'), sym('n'), lit('}')), seq(lit('{'), lit(','), sym('m'), lit('}'))) });
		expect(shape(out['count']!)).toBe("['{' (n | [',' m]) '}']");
	});

	it('keeps the keyword in each middle of a choice whose arms share only their brackets: `( T x in e )` and `( e in e )`', () => {
		const out = flattenRules({
			header: choice(
				seq(lit('('), sym('type'), sym('name'), lit('in'), sym('expression'), lit(')')),
				seq(lit('('), sym('expression'), lit('in'), sym('expression'), lit(')'))
			)
		});
		expect(shape(out['header']!)).toBe("['(' ([type name 'in' expression] | [expression 'in' expression]) ')']");
	});
});

describe('a factored choice keeps its identity', () => {
	const lit = (value: string, id?: string): Rule<'link'> => ({ type: STRING, value, nonterminal: false, ...(id === undefined ? {} : { id }) }) as Rule<'link'>;
	const named = (name: string, id: string): Rule<'link'> => ({ type: SYMBOL, name, id }) as Rule<'link'>;
	const seq = (id: string, ...members: Rule<'link'>[]): Rule<'link'> => ({ type: SEQ, id, members }) as Rule<'link'>;
	const choice = (id: string, ...members: Rule<'link'>[]): Rule<'link'> => ({ type: CHOICE, id, members }) as Rule<'link'>;
	type Out = { type: string; id?: string; absorbedIds?: readonly string[]; members?: Out[] };

	it("a choice of seqs that differ at one member becomes the seq around a choice that carries the source choice's id", () => {
		const out = flattenRules({
			k: choice('C', seq('S', lit('(', 'p'), named('x', 'x'), lit(')', 'q')), seq('S', lit('(', 'p'), named('y', 'y'), lit(')', 'q')))
		})['k'] as unknown as Out;
		expect(out.type).toBe(SEQ);
		expect(out.id).toBe('S');
		expect(out.absorbedIds ?? []).not.toContain('C');
		expect(out.members![1]!.type).toBe(CHOICE);
		expect(out.members![1]!.id).toBe('C');
	});

	it("a choice whose arms share their edge literals becomes the seq around a choice that carries the source choice's id", () => {
		const out = flattenRules({
			k: choice('C', seq('S', lit('{', 'o'), named('n', 'n'), lit('}', 'c')), seq('S', lit('{', 'o'), lit(',', 'm0'), named('m', 'm'), lit('}', 'c')))
		})['k'] as unknown as Out;
		expect(out.type).toBe(SEQ);
		expect(out.id).toBe('S');
		expect(out.absorbedIds ?? []).not.toContain('C');
		const inner = out.members![1]!;
		expect(inner.type).toBe(CHOICE);
		expect(inner.id).toBe('C');
		expect(inner.members!.map((arm) => arm.id)).toEqual(['n', undefined]);
	});

	it('a seq factored from some arms of a choice, and the choice inside it, take ids that name the source choice and those arms', () => {
		const out = flattenRules({
			k: choice(
				'rule:k:root',
				named('z', 'rule:k:members.0'),
				seq('rule:k:members.1', lit('(', 'rule:k:members.1/members.0'), named('x', 'rule:k:members.1/members.1'), lit(')', 'rule:k:members.1/members.2')),
				seq('rule:k:members.2', lit('(', 'rule:k:members.2/members.0'), named('y', 'rule:k:members.2/members.1'), lit(')', 'rule:k:members.2/members.2'))
			)
		})['k'] as unknown as Out;
		expect(out.type).toBe(CHOICE);
		expect(out.id).toBe('rule:k:root');
		const factored = out.members!.find((arm) => arm.type === SEQ)!;
		expect(factored.id).toBe('rule:k:members.1.2');
		expect(factored.absorbedIds).toEqual(expect.arrayContaining(['rule:k:members.1', 'rule:k:members.2']));
		expect(factored.members![1]!.type).toBe(CHOICE);
		expect(factored.members![1]!.id).toBe('rule:k:members.1.2/members.1');
	});

	it('a seq factored out of arms that are different seqs carries no id of its own and absorbs theirs', () => {
		const out = flattenRules({
			k: choice('C', seq('S1', lit('(', 'p'), named('x', 'x'), lit(')', 'q')), seq('S2', lit('(', 'p2'), named('y', 'y'), lit(')', 'q2')))
		})['k'] as unknown as Out;
		expect(out.type).toBe(SEQ);
		expect(out.id).toBeUndefined();
		expect(out.absorbedIds).toEqual(expect.arrayContaining(['S1', 'S2']));
		expect(out.members![1]!.id).toBe('C');
	});
});

describe("a factoring loses none of its arms' stamped attributes", () => {
	type Attrs = Record<string, unknown>;
	type Out = Attrs & { type: string; id?: string; members?: Out[] };
	const lit = (value: string, id: string): Rule<'link'> => ({ type: STRING, value, nonterminal: false, id }) as Rule<'link'>;
	const named = (name: string, id: string, attrs: Attrs = {}): Rule<'link'> => ({ type: SYMBOL, name, id, ...attrs }) as Rule<'link'>;
	const seq = (id: string, attrs: Attrs, ...members: Rule<'link'>[]): Rule<'link'> => ({ type: SEQ, id, ...attrs, members }) as Rule<'link'>;
	const choice = (id: string, ...members: Rule<'link'>[]): Rule<'link'> => ({ type: CHOICE, id, members }) as Rule<'link'>;
	const flat = (rule: Rule<'link'>): Out => flattenRules({ k: rule })['k'] as unknown as Out;
	const comma = { value: { type: STRING, value: ',', nonterminal: false } };
	const semi = { value: { type: STRING, value: ';', nonterminal: false } };
	const stamped: readonly (readonly [string, unknown, unknown])[] = [
		['fieldName', 'f', 'g'],
		['multiplicity', 'optional', 'array'],
		['separator', comma, semi],
		['optionalElement', true, undefined],
		['tokenized', true, undefined],
		['immediate', true, undefined]
	];
	const armsOf = (a: Attrs, b: Attrs) => [
		seq('rule:k:members.1', a, lit('(', 'rule:k:members.1/members.0'), named('x', 'rule:k:members.1/members.1')),
		seq('rule:k:members.2', b, lit('(', 'rule:k:members.2/members.0'), named('y', 'rule:k:members.2/members.1'))
	];
	const edgeArmsOf = (a: Attrs, b: Attrs) => [
		seq('A', a, lit('{', 'o'), named('n', 'n'), lit('}', 'c')),
		seq('B', b, lit('{', 'o2'), lit(',', 'm0'), named('m', 'm'), lit('}', 'c2'))
	];

	for (const [attr, value, other] of stamped) {
		const has = (v: unknown): Attrs => (v === undefined ? {} : { [attr]: v });

		it(`${attr} every arm shares stays on the seq when the whole choice factors`, () => {
			const out = flat(choice('rule:k:root', ...armsOf(has(value), has(value))));
			expect(out.type).toBe(SEQ);
			expect(out[attr]).toEqual(value);
			expect(out.members![1]!.type).toBe(CHOICE);
		});

		it(`arms that disagree on ${attr} do not factor`, () => {
			const out = flat(choice('rule:k:root', ...armsOf(has(value), has(other))));
			expect(out.type).toBe(CHOICE);
			expect(out.members!.map((arm) => arm[attr])).toEqual([value, other]);
		});

		it(`${attr} the factored arms share stays on the seq beside a choice's other arms`, () => {
			const out = flat(choice('rule:k:root', named('z', 'rule:k:members.0'), ...armsOf(has(value), has(value))));
			const factored = out.members!.find((arm) => arm.type === SEQ)!;
			expect(out.members).toHaveLength(2);
			expect(factored.id).toBe('rule:k:members.1.2');
			expect(factored[attr]).toEqual(value);
		});

		it(`some arms that disagree on ${attr} do not factor beside a choice's other arms`, () => {
			const out = flat(choice('rule:k:root', named('z', 'rule:k:members.0'), ...armsOf(has(value), has(other))));
			expect(out.members).toHaveLength(3);
			expect(out.members!.slice(1).map((arm) => arm[attr])).toEqual([value, other]);
		});

		it(`${attr} every arm shares stays on the seq when shared literals factor, and leaves the remainders`, () => {
			const out = flat(choice('C', ...edgeArmsOf(has(value), has(value))));
			expect(out.type).toBe(SEQ);
			expect(out[attr]).toEqual(value);
			const inner = out.members![1]!;
			expect(inner.type).toBe(CHOICE);
			expect(inner.members![1]![attr]).toBeUndefined();
		});

		it(`arms that disagree on ${attr} keep their shared literals`, () => {
			const out = flat(choice('C', ...edgeArmsOf(has(value), has(other))));
			expect(out.type).toBe(CHOICE);
			expect(out.members!.map((arm) => arm[attr])).toEqual([value, other]);
		});
	}

	it('arms in either order that disagree on a field do not fold into one seq', () => {
		const out = flat(
			choice(
				'C',
				seq('A', { fieldName: 'f' }, named('a', 'a0'), named('b', 'b0', { multiplicity: 'optional' })),
				seq('B', { fieldName: 'g' }, named('b', 'b1'), named('a', 'a1', { multiplicity: 'optional' }))
			)
		);
		expect(out.type).toBe(CHOICE);
		expect(out.members!.map((arm) => arm['fieldName'])).toEqual(['f', 'g']);
	});

	it('arms that share a field but disagree with the choice around them do not factor', () => {
		const fielded = { ...choice('rule:k:root', ...armsOf({ fieldName: 'f' }, { fieldName: 'f' })), fieldName: 'h' };
		const out = flat(fielded as Rule<'link'>);
		expect(out.type).toBe(CHOICE);
		expect(out['fieldName']).toBe('h');
		expect(out.members!.map((arm) => arm['fieldName'])).toEqual(['f', 'f']);
	});
});

describe('a factoring loses no fact of its arms', () => {
	type Facts = Record<string, unknown>;
	type Out = Facts & { type: string; id?: string; members?: Out[] };
	const lit = (value: string, id: string): Rule<'link'> => ({ type: STRING, value, nonterminal: false, id }) as Rule<'link'>;
	const named = (name: string, id: string, facts: Facts = {}): Rule<'link'> => ({ type: SYMBOL, name, id, ...facts }) as Rule<'link'>;
	const seq = (id: string, facts: Facts, ...members: Rule<'link'>[]): Rule<'link'> => ({ type: SEQ, id, ...facts, members }) as Rule<'link'>;
	const choice = (id: string, facts: Facts, ...members: Rule<'link'>[]): Rule<'link'> => ({ type: CHOICE, id, ...facts, members }) as Rule<'link'>;
	const flat = (rule: Rule<'link'>): Out => flattenRules({ k: rule })['k'] as unknown as Out;
	const facts: readonly (readonly [string, unknown, unknown])[] = [
		['annotations', { variant: 'a' }, { variant: 'b' }],
		['metadata', { fieldSource: 'a' }, { fieldSource: 'b' }],
		['inlinedFrom', '_a', '_b'],
		['splicedBody', true, undefined],
		['variantArms', ['a'], ['b']],
		['lexed', true, undefined]
	];
	const armsOf = (a: Facts, b: Facts) => [
		seq('rule:k:members.1', a, lit('(', 'rule:k:members.1/members.0'), named('x', 'rule:k:members.1/members.1')),
		seq('rule:k:members.2', b, lit('(', 'rule:k:members.2/members.0'), named('y', 'rule:k:members.2/members.1'))
	];
	const edgeArmsOf = (a: Facts, b: Facts) => [
		seq('A', a, lit('{', 'o'), named('n', 'n'), lit('}', 'c')),
		seq('B', b, lit('{', 'o2'), lit(',', 'm0'), named('m', 'm'), lit('}', 'c2'))
	];
	const eitherOrderOf = (a: Facts, b: Facts) => [
		seq('A', a, named('p', 'p0'), named('q', 'q0', { multiplicity: 'optional' })),
		seq('B', b, named('q', 'q1'), named('p', 'p1', { multiplicity: 'optional' }))
	];

	for (const [fact, value, other] of facts) {
		const has = (v: unknown): Facts => (v === undefined ? {} : { [fact]: v });

		it(`${fact} every arm shares stays on the seq when the whole choice factors`, () => {
			const out = flat(choice('rule:k:root', {}, ...armsOf(has(value), has(value))));
			expect(out.type).toBe(SEQ);
			expect(out[fact]).toEqual(value);
		});

		it(`arms that differ on ${fact} do not factor`, () => {
			const out = flat(choice('rule:k:root', {}, ...armsOf(has(value), has(other))));
			expect(out.type).toBe(CHOICE);
			expect(out.members!.map((arm) => arm[fact])).toEqual([value, other]);
		});

		it(`${fact} the factored arms share stays on the seq beside a choice's other arms`, () => {
			const out = flat(choice('rule:k:root', {}, named('z', 'rule:k:members.0'), ...armsOf(has(value), has(value))));
			expect(out.members!.find((arm) => arm.type === SEQ)![fact]).toEqual(value);
		});

		it(`some arms that differ on ${fact} do not factor beside a choice's other arms`, () => {
			const out = flat(choice('rule:k:root', {}, named('z', 'rule:k:members.0'), ...armsOf(has(value), has(other))));
			expect(out.members).toHaveLength(3);
		});

		it(`${fact} every arm shares stays on the seq when shared literals factor, and leaves the remainders`, () => {
			const out = flat(choice('C', {}, ...edgeArmsOf(has(value), has(value))));
			expect(out.type).toBe(SEQ);
			expect(out[fact]).toEqual(value);
			expect(out.members![1]!.members![1]![fact]).toBeUndefined();
		});

		it(`arms that differ on ${fact} keep their shared literals`, () => {
			expect(flat(choice('C', {}, ...edgeArmsOf(has(value), has(other)))).type).toBe(CHOICE);
		});

		it(`arms in either order that differ on ${fact} do not fold`, () => {
			expect(flat(choice('C', {}, ...eitherOrderOf(has(value), has(other)))).type).toBe(CHOICE);
		});
	}

	for (const multiplicity of ['array', 'nonEmptyArray']) {
		const repeated = { multiplicity };

		it(`arms that each repeat (${multiplicity}) do not factor, since (a x)* | (a y)* is not (a (x|y))*`, () => {
			expect(flat(choice('rule:k:root', {}, ...armsOf(repeated, repeated))).type).toBe(CHOICE);
			expect(flat(choice('rule:k:root', {}, named('z', 'rule:k:members.0'), ...armsOf(repeated, repeated))).members).toHaveLength(3);
			expect(flat(choice('C', {}, ...edgeArmsOf(repeated, repeated))).type).toBe(CHOICE);
			expect(flat(choice('C', {}, ...eitherOrderOf(repeated, repeated))).type).toBe(CHOICE);
		});

		it(`copies of one repeated seq (${multiplicity}) factor back into that seq`, () => {
			const out = flat(
				choice('C', {}, seq('S', repeated, lit('(', 'p'), named('x', 'x')), seq('S', repeated, lit('(', 'p'), named('y', 'y')))
			);
			expect(out.type).toBe(SEQ);
			expect(out.id).toBe('S');
			expect(out['multiplicity']).toBe(multiplicity);
		});
	}

	it("the choice's own facts stay on the inner choice when its arms factor, beside the arms' on the seq", () => {
		const own = { inlinedFrom: '_choice', metadata: { fieldSource: 'choice' } };
		const out = flat(seq('rule:k:root', {}, lit('x', 'h'), choice('C', own, ...armsOf({ inlinedFrom: '_arm' }, { inlinedFrom: '_arm' }))));
		const factored = out.members![1]!;
		expect(factored.type).toBe(SEQ);
		expect(factored['inlinedFrom']).toBe('_arm');
		const inner = factored.members![1]!;
		expect(inner.type).toBe(CHOICE);
		expect(inner.id).toBe('C');
		expect(inner['inlinedFrom']).toBe('_choice');
		expect(inner['metadata']).toEqual({ fieldSource: 'choice' });
	});

	it("the choice's own facts stay on the choice of remainders when shared literals factor", () => {
		const own = { inlinedFrom: '_choice' };
		const out = flat(seq('rule:k:root', {}, lit('x', 'h'), choice('C', own, ...edgeArmsOf({ inlinedFrom: '_arm' }, { inlinedFrom: '_arm' }))));
		const factored = out.members![1]!;
		expect(factored['inlinedFrom']).toBe('_arm');
		expect(factored.members![1]!['inlinedFrom']).toBe('_choice');
	});
});

describe('a kind is not a variant of itself', () => {
	type Out = { type: string; annotations?: Record<string, unknown>; members?: Out[] };
	const own = { variantOf: 'k', definedBy: 'enrich' };
	const lit = (value: string, id: string): Rule<'link'> => ({ type: STRING, value, nonterminal: false, id }) as Rule<'link'>;
	const named = (name: string, id: string, annotations?: Record<string, unknown>): Rule<'link'> =>
		({ type: SYMBOL, name, id, ...(annotations === undefined ? {} : { annotations }) }) as Rule<'link'>;
	const seq = (id: string, annotations: Record<string, unknown> | undefined, ...members: Rule<'link'>[]): Rule<'link'> =>
		({ type: SEQ, id, ...(annotations === undefined ? {} : { annotations }), members }) as Rule<'link'>;
	const flat = (rule: Rule<'link'>): Out => flattenRules({ k: rule })['k'] as unknown as Out;

	it("a seq that is k's root drops variantOf k and its definedBy", () => {
		expect(flat(seq('S', own, lit('(', 'p'), named('x', 'x'))).annotations).toBeUndefined();
	});

	it("a seq factored into k's root from arms labelled as k's variants drops the label", () => {
		const out = flat({
			type: CHOICE,
			id: 'C',
			members: [seq('A', own, lit('(', 'p'), named('x', 'x')), seq('B', own, lit('(', 'q'), named('y', 'y'))]
		} as Rule<'link'>);
		expect(out.type).toBe(SEQ);
		expect(out.annotations).toBeUndefined();
	});

	it('other annotations on the root stay', () => {
		expect(flat(seq('S', { ...own, hoisted: true }, lit('(', 'p'), named('x', 'x'))).annotations).toEqual({ hoisted: true });
	});

	it('a seq labelled as a variant of another kind keeps its label', () => {
		const label = { variantOf: 'other', definedBy: 'enrich' };
		expect(flat(seq('S', label, lit('(', 'p'), named('x', 'x'))).annotations).toEqual(label);
	});

	it("a symbol root keeps its label, since it names a real variant child", () => {
		expect(flat(named('x', 'x', { variant: 'v', variantOf: 'k', definedBy: 'enrich' })).annotations).toEqual({ variant: 'v', variantOf: 'k', definedBy: 'enrich' });
	});

	it('a seq arm below the root keeps its label', () => {
		const out = flat({ type: CHOICE, id: 'C', members: [named('z', 'z'), seq('T', own, named('x', 'x'), named('y', 'y'))] } as Rule<'link'>);
		expect(out.type).toBe(CHOICE);
		expect(out.members![1]!.annotations).toEqual(own);
	});
});

describe("a kind root's facts stay on the root when its choice factors", () => {
	type Out = Record<string, unknown> & { type: string; members?: Out[] };
	const kindFacts = { hidden: true, inlinedFrom: '_root', annotations: { hoisted: true } };
	const lit = (value: string, id: string): Rule<'link'> => ({ type: STRING, value, nonterminal: false, id }) as Rule<'link'>;
	const named = (name: string, id: string): Rule<'link'> => ({ type: SYMBOL, name, id }) as Rule<'link'>;
	const seq = (id: string, ...members: Rule<'link'>[]): Rule<'link'> => ({ type: SEQ, id, members }) as Rule<'link'>;
	const rootChoice = (...members: Rule<'link'>[]): Rule<'link'> => ({ type: CHOICE, id: 'C', ...kindFacts, members }) as Rule<'link'>;
	const flat = (rule: Rule<'link'>): Out => flattenRules({ k: rule })['k'] as unknown as Out;
	const expectOnRootOnly = (out: Out): void => {
		expect(out.type).toBe(SEQ);
		expect(out['hidden']).toBe(true);
		expect(out['annotations']).toEqual({ hoisted: true });
		expect(out['inlinedFrom']).toBeUndefined();
		const inner = out.members![1]!;
		expect(inner.type).toBe(CHOICE);
		expect(inner.id).toBe('C');
		expect(inner['hidden']).toBeUndefined();
		expect(inner['annotations']).toBeUndefined();
		expect(inner['inlinedFrom']).toBe('_root');
	};

	it('when arms that differ at one member factor', () => {
		expectOnRootOnly(flat(rootChoice(seq('A', lit('(', 'p'), named('x', 'x')), seq('B', lit('(', 'q'), named('y', 'y')))));
	});

	it('when shared literals factor', () => {
		expectOnRootOnly(flat(rootChoice(seq('A', lit('{', 'o'), named('n', 'n'), lit('}', 'c')), seq('B', lit('{', 'o2'), lit(',', 'm0'), named('m', 'm'), lit('}', 'c2')))));
	});

	it('a root that does not factor keeps its facts', () => {
		const out = flat(rootChoice(named('x', 'x'), named('y', 'y')));
		expect(out.type).toBe(CHOICE);
		expect(out['inlinedFrom']).toBe('_root');
		expect(out['annotations']).toEqual({ hoisted: true });
	});
});
