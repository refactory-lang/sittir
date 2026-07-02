/**
 * Tests for the spec-013 `simplifyRule` transformation pipeline.
 *
 * Each test freezes the canonical shape produced for a minimal input
 * fragment. The simplifyRule function is idempotent — running it
 * twice produces the same output — and shape-preserving for rules
 * that are already canonical or don't match the merge-compatible
 * pattern.
 *
 * Note: `simplifyRule`'s input must be field-node-free (see simplify.ts
 * JSDoc). Field-containing inputs are now passed directly to
 * `mergeBranchesForChoice` (which still handles them) rather than going
 * through `simplifyRule`, matching the actual production call graph
 * (simplifyChoiceRule calls mergeBranchesForChoice with already-simplified
 * field-free members).
 */

import { CHOICE, FIELD, OPTIONAL, REPEAT1, SEQ, STRING, SUPERTYPE, SYMBOL, VARIANT } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { ChoiceRule } from '../../types/rule.ts';
import { simplifyRule, attributeBuilder, makeDefaultCtx } from '../simplify.ts';
import { hoistInnerFieldFromWrapperForField, mergeBranchesForChoice } from '../simplify.ts';
import { applyWrapperDeletion } from '../wrapper-deletion.ts';

const str = (value: string): Rule => ({ type: STRING, value });
const sym = (name: string): Rule => ({ type: SYMBOL, name });
const sup = (name: string): Rule => ({ type: SUPERTYPE, name, subtypes: [] });
const field = (name: string, content: Rule): Rule => ({
	type: FIELD,
	name,
	content
});
const seq = (...members: Rule[]): Rule => ({ type: SEQ, members });
const choice = (...members: Rule[]): Rule => ({ type: CHOICE, members });
const variant = (name: string, content: Rule): Rule => ({
	type: VARIANT,
	name,
	content
});
const optional = (content: Rule): Rule => ({ type: OPTIONAL, content });
const repeat1 = (content: Rule, separator?: string): Rule =>
	separator !== undefined ? { type: REPEAT1, content, separator } : { type: REPEAT1, content };

/**
 * Helper: result of pushing a field wrapper down to its content as leaf attrs,
 * exactly as `applyWrapperDeletion(field(name, content))` produces.
 */
const fieldAttrs = (name: string, content: Rule): Rule => ({
	...content,
	fieldName: name,
	nonterminal: true,
});

describe('mergeBranchesForChoice — field-merging (directly via mergeBranchesForChoice)', () => {
	// These tests call mergeBranchesForChoice directly because simplifyRule's
	// input must be field-node-free (fields must be wrapper-deleted first).
	// mergeBranchesForChoice itself still accepts field-containing input so
	// the production path (simplifyChoiceRule → mergeBranchesForChoice) can
	// handle pre-wrapper-deleted rules in tests. The output uses the
	// attribute-push pattern: `fieldName`+`nonterminal` on the content
	// node rather than a FieldRule wrapper — exercised by passing
	// `attributeBuilder` (the production builder) to mergeBranchesForChoice.

	it("merges same-shape branches that differ only in one field's literal", () => {
		// Pattern: binary_expression. Each arm same seq shape with
		// different literal for operator.
		const input = choice(
			seq(field('left', sym('expr')), field('op', str('&&')), field('right', sym('expr'))),
			seq(field('left', sym('expr')), field('op', str('||')), field('right', sym('expr'))),
			seq(field('left', sym('expr')), field('op', str('+')), field('right', sym('expr')))
		) as ChoiceRule;
		const result = mergeBranchesForChoice(input, makeDefaultCtx());
		expect(result.type).toBe('seq');
		const members = (result as { members: Rule[] }).members;
		expect(members).toHaveLength(3);
		// Position 0: left field — attrs pushed onto sym('expr')
		expect(members[0]).toEqual(fieldAttrs('left', sym('expr')));
		// Position 1: op field — attrs pushed onto choice of literals
		expect(members[1]).toEqual(fieldAttrs('op', choice(str('&&'), str('||'), str('+'))) );
		// Position 2: right field — attrs pushed onto sym('expr')
		expect(members[2]).toEqual(fieldAttrs('right', sym('expr')));
	});

	it('merges two-branch choice with identical shape + differing field content', () => {
		const input = choice(
			seq(field('kind', str('var'))),
			seq(field('kind', str('let'))),
			seq(field('kind', str('const')))
		) as ChoiceRule;
		const result = mergeBranchesForChoice(input, makeDefaultCtx());
		// seq of one position — mergeBranchesForChoice returns the single merged member
		// (a choice node with fieldName+nonterminal attrs pushed by attributeBuilder).
		expect((result as any).fieldName).toBe('kind');
		expect((result as any).nonterminal).toBe(true);
		// The merged content is a choice of the three literals
		const members = (result as any).members;
		expect(members).toHaveLength(3);
	});

	it('preserves non-field positions as-is when identical across branches', () => {
		const input = choice(
			seq(sym('expr'), field('op', str('+')), sym('expr')),
			seq(sym('expr'), field('op', str('-')), sym('expr'))
		) as ChoiceRule;
		const result = mergeBranchesForChoice(input, makeDefaultCtx());
		expect(result.type).toBe('seq');
		const members = (result as { members: Rule[] }).members;
		expect(members).toHaveLength(3);
		expect(members[0]).toEqual(sym('expr'));
		expect((members[1] as any).fieldName).toBe('op');
		expect(members[2]).toEqual(sym('expr'));
	});

	it('does NOT merge when branches differ in FIELD NAME at a position', () => {
		// function_modifiers-style: each branch has a DIFFERENT field
		// name. Not mergeable.
		const input = choice(
			field('async', sym('_kw_async')),
			field('const', sym('_kw_const')),
			field('unsafe', sym('_kw_unsafe'))
		) as ChoiceRule;
		const result = mergeBranchesForChoice(input);
		// liftSharedArmAttrs fires but branches stay as-is (no seq structure to merge).
		expect(result.type).toBe('choice');
		expect((result as { members: Rule[] }).members.length).toBe(3);
	});

	it('does NOT merge when branches differ in MEMBER KIND at a position', () => {
		// One branch has field, another has symbol at same position.
		const input = choice(seq(field('op', str('='))), seq(sym('assignment_expression'))) as ChoiceRule;
		const result = mergeBranchesForChoice(input);
		expect(result.type).toBe('choice');
	});

	it('does NOT merge variant-wrapped branches — variants preserve identity', () => {
		// tagVariants wraps choice members in variant() to mark them as
		// polymorph-distinct. mergeBranchesForChoice must NEVER collapse those —
		// doing so drops the variant names and turns a polymorph into
		// a bare seq.
		const input = choice(
			variant('a', seq(field('op', str('+')), field('r', sym('expr')))),
			variant('b', seq(field('op', str('-')), field('r', sym('expr'))))
		) as ChoiceRule;
		const result = mergeBranchesForChoice(input);
		expect(result.type).toBe('choice');
		const members = (result as { members: Rule[] }).members;
		expect(members).toHaveLength(2);
		expect(members[0]!.type).toBe('variant');
		expect(members[1]!.type).toBe('variant');
	});

	it('dedupes identical contents across branches', () => {
		// Two branches have the same literal. Merged content shouldn't
		// have duplicates.
		const input = choice(
			seq(field('op', str('+')), field('r', sym('expr'))),
			seq(field('op', str('+')), field('r', sym('expr'))),
			seq(field('op', str('-')), field('r', sym('expr')))
		) as ChoiceRule;
		const result = mergeBranchesForChoice(input, makeDefaultCtx());
		expect(result.type).toBe('seq');
		const members = (result as { members: Rule[] }).members;
		// op: deduplicated choice of '+' and '-' (not '+', '+', '-')
		// attributeBuilder pushes fieldName+nonterminal onto the choice node.
		const opMember = members[0]!;
		expect((opMember as any).fieldName).toBe('op');
		const choiceMembers = (opMember as any).members;
		// dedupe: choice('+', '-') not choice('+', '+', '-')
		expect(choiceMembers).toHaveLength(2);
	});

	it('leaves homogeneous-collapsed choices alone (choice of bare symbols)', () => {
		const input = choice(sym('a'), sym('b'), sym('c')) as ChoiceRule;
		// No seq structure to merge — stays as a choice. Supertype /
		// enum classification handles this kind downstream.
		const result = mergeBranchesForChoice(input);
		expect(result.type).toBe('choice');
		expect((result as { members: Rule[] }).members).toHaveLength(3);
	});
});

describe('simplifyRule — field-free input (wrapper-deleted)', () => {
	// simplifyRule's input must be field-node-free. These tests use
	// applyWrapperDeletion to convert field wrappers to attributes first,
	// then call simplifyRule.

	it('is idempotent on field-free choice-of-seqs', () => {
		const raw = choice(
			seq(field('op', str('+')), field('r', sym('expr'))),
			seq(field('op', str('-')), field('r', sym('expr')))
		);
		const fieldFree = applyWrapperDeletion({ x: raw }).x!;
		const once = simplifyRule(fieldFree as Rule);
		const twice = simplifyRule(once);
		expect(twice).toEqual(once);
	});

	it('collapses a single-member choice to its member', () => {
		const raw = choice(sym('a'));
		const fieldFree = applyWrapperDeletion({ x: raw }).x!;
		const result = simplifyRule(fieldFree as Rule);
		expect(result.type).toBe('symbol');
	});

	it('simplifyRule throws on a raw OPTIONAL node (deleted handler — use attributeBuilder instead)', () => {
		// simplifyOptionalRule was deleted: OPTIONAL nodes must be converted to
		// multiplicity attrs by applyWrapperDeletion before reaching simplify, or
		// built via ctx.builder (attributeBuilder) at construction sites within
		// simplify (e.g. the empty-match fold in simplifyChoiceRule). A raw OPTIONAL
		// hitting simplifyRule is a bug and now throws immediately.
		const raw = optional(str(','));
		expect(() => simplifyRule(raw as Rule)).toThrow(/unexpected rule type 'optional'/);
	});

	it('attributeBuilder.optional strips bare anonymous string delimiters (replaces simplifyOptionalRule)', () => {
		// The behavior previously in simplifyOptionalRule is now in attributeBuilder.optional.
		// optional(',') without nonterminal → bare delimiter → collapses to empty-seq attrs.
		const result = attributeBuilder.optional(str(','));
		// deleteWrapper({type:OPTIONAL, content: str(',')}) on a non-slot-promoted string
		// produces empty-seq (no leaves carry multiplicity when the content is stripped).
		// The STRING is bare (no nonterminal), so the content is treated as a delimiter.
		// Result: {type:SEQ, members:[]} sentinel.
		expect(result.type).toBe('seq');
		expect((result as { members: Rule[] }).members).toHaveLength(0);
	});

	it('preserves slot-promoted literals (nonterminal=true) inside optional', () => {
		// A string with nonterminal:true (from a field wrapper) is
		// slot-data and must survive simplify. Simulate slot-promotion by using
		// a field wrapper: field('kw', str('static')) → wrapper-deleted →
		// str('static', {fieldName:'kw', nonterminal:true}).
		const wrapped = { x: optional(field('kw', str('static'))) };
		const fieldFree = applyWrapperDeletion(wrapped).x!;
		const result = simplifyRule(fieldFree as Rule);
		// The optional wraps a nonterminal string → stays as optional (not stripped)
		expect(result.type).not.toBe('seq');
	});
});

describe('simplifyRule — hoistInnerFieldFromWrapperForField', () => {
	// Tree-sitter flattens nested-field-paths to top-level on the parent
	// kind. The hoist drops an OUTER `field('outer', ...)` wrapper when
	// its content carries an inner `field('inner', X)` reachable through
	// structural-only wrappers (no named-symbol siblings). After the
	// hoist the inner field is the top-level reference the walker sees,
	// matching tree-sitter's parse-tree shape.
	//
	it('hoists an inner field out of `field(outer, optional(seq(literal, field(inner))))`', () => {
		// Pre-clause-detection shape of typescript `infer_type`.
		const input = field('constraint', optional(seq(str('extends'), field('type', sym('type')))));
		const expected = optional(seq(str('extends'), field('type', sym('type'))));
		expect(hoistInnerFieldFromWrapperForField(input)).toEqual(expected);
	});

	it('hoists through `optional(repeat1(choice(field, symbol), sep))` (typescript enum_body)', () => {
		// The inner `symbol(enum_assignment)` is a CHOICE ARM, not a
		// seq sibling of the inner field — the hoist guard sees no
		// named sibling and proceeds.
		const input = field(
			'opening',
			optional(repeat1(choice(field('name', sym('_property_name')), sym('enum_assignment')), ','))
		);
		const result = hoistInnerFieldFromWrapperForField(input);
		expect(result.type).toBe('optional');
	});

	it('does NOT hoist when the inner field has a NAMED-symbol sibling in the enclosing seq', () => {
		// python `comparison_operator` family: the seq enclosing the
		// inner field also carries a `symbol(primary_expression)` —
		// dropping the outer `comparators` wrapper would strip the
		// label tree-sitter put on `primary_expression` and the
		// expression children would render via `$$$CHILDREN`.
		const input = field(
			'comparators',
			repeat1(seq(field('operators', choice(str('<'), str('>'))), sym('primary_expression')))
		);
		expect(hoistInnerFieldFromWrapperForField(input)).toEqual(input);
	});

	it('does NOT hoist when the outer field directly wraps another field (no structural scaffolding)', () => {
		// `field('outer', field('inner', X))` direct nesting is a
		// direct outer-inner wrap, not the scaffolded case this hoist
		// handles. We bail to keep the two hoists from racing.
		const input = field('outer', field('inner', sym('x')));
		expect(hoistInnerFieldFromWrapperForField(input)).toEqual(input);
	});

	it('does NOT hoist when the outer field has no inner field at exposable depth', () => {
		// Plain `field('name', symbol(X))` — no inner field to hoist.
		const input = field('name', sym('identifier'));
		expect(hoistInnerFieldFromWrapperForField(input)).toEqual(input);
	});

	it('does NOT hoist when the inner field is hidden behind a `symbol` reference', () => {
		// Tree-sitter's flattening does NOT cross symbol boundaries —
		// the inner field belongs to the referenced rule, not the
		// current kind. Dropping the outer wrapper would lose the
		// outer label without recovering anything.
		const input = field('module_name', sym('dotted_name'));
		expect(hoistInnerFieldFromWrapperForField(input)).toEqual(input);
	});

	it('preserves anonymous-string siblings (literal "extends" stays in the hoisted seq)', () => {
		// The structural literal that previously rode inside the
		// outer field's content must survive the hoist — the walker
		// emits it as template text.
		const input = field('constraint', optional(seq(str('extends'), field('type', sym('type')))));
		const result = hoistInnerFieldFromWrapperForField(input);
		// Walk into the optional → seq → first member: the literal.
		expect(result.type).toBe('optional');
		const optInner = (result as { type: 'optional'; content: Rule }).content;
		expect(optInner.type).toBe('seq');
		const seqMembers = (optInner as { members: Rule[] }).members;
		expect(seqMembers[0]).toEqual(str('extends'));
		expect(seqMembers[1]?.type).toBe('field');
	});

	it('integration: a NAMED supertype sibling also blocks the hoist', () => {
		const input = field('outer', seq(sup('expression'), field('inner', sym('identifier'))));
		expect(hoistInnerFieldFromWrapperForField(input)).toEqual(input);
	});

	it('idempotent: running the hoist twice is a no-op on the hoisted shape', () => {
		const input = field('constraint', optional(seq(str('extends'), field('type', sym('type')))));
		const once = hoistInnerFieldFromWrapperForField(input);
		const twice = hoistInnerFieldFromWrapperForField(once);
		expect(twice).toEqual(once);
	});
});
