import { CHOICE, FIELD, PATTERN, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
import { AssembledPattern, AssembledSeparatedList, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { Repeat1Rule, RenderRule, Rule, SimplifiedRule } from '../../types/rule.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

// A bare SYMBOL rule is structurally identical across compiler phases, but
// `simplifiedRule`/`renderRule` are nominally branded (SimplifiedRule/RenderRule
// each carry a distinct `__brand?: never` marker) — one Rule<'link'>-typed
// constant can't satisfy both, so each gets its own phase-typed declaration.
const MEMBER_ELEMENT_SIMPLIFIED_RULE: SimplifiedRule = { type: SYMBOL, name: 'member' };
const MEMBER_ELEMENT_RENDER_RULE: RenderRule = { type: SYMBOL, name: 'member' };

function makeMemberNodeMap(rule: Repeat1Rule, opts: { separatorRule: Rule<'link'> | undefined }) {
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'member_list',
		new AssembledSeparatedList('member_list', rule, undefined, {
			separatorRule: opts.separatorRule,
			simplifiedRule: MEMBER_ELEMENT_SIMPLIFIED_RULE,
			renderRule: MEMBER_ELEMENT_RENDER_RULE
		})
	);
	nodes.set('member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

const KIND_ENTRIES: KindEnumEntry[] = [
	{ id: 1, kind: 'member_list', member: 'MemberList' },
	{ id: 2, kind: 'member', member: 'Member' },
	{ id: 3, kind: 'comma', member: 'Comma', symbolName: ',', anon: true },
	{ id: 4, kind: 'semi', member: 'Semi', symbolName: ';', anon: true }
];

describe('wrap emitter — separatedList', () => {
	it('emits _member/_separator_kind/_leading_sep/_trailing_sep for a nonterminal separator with both flanks optional', () => {
		// Storage/accessor key is the model's OWN derived slot name (`_member`,
		// from the element kind — see AssembledSeparatedList.fields / Bug B fix),
		// NOT a hardcoded `_content`/`content()`. `_content` remains only as an
		// internal local var feeding `_hasSeparatorFlank`/`_separatorKindOf`.
		const sepChoice: Rule<'link'> = {
			type: CHOICE,
			members: [
				{ type: STRING, value: ',' },
				{ type: STRING, value: ';' }
			]
		};
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: sepChoice, trailing: 'optional', leading: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: sepChoice });
		const emitted = emitWrap({ grammar: 'test', nodeMap, kindEntries: KIND_ENTRIES });

		expect(emitted).toContain('_member:');
		expect(emitted).toContain('member() {');
		expect(emitted).toContain('_separator_kind:');
		expect(emitted).toContain('_leading_sep:');
		expect(emitted).toContain('_trailing_sep:');
		expect(emitted).toContain('_separatorKindOf(data, [TSKindId.Comma, TSKindId.Semi])');
	});

	it('omits _separator_kind and _leading_sep for a literal-separator node with only an optional trailing flank', () => {
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitWrap({ grammar: 'test', nodeMap, kindEntries: KIND_ENTRIES });

		expect(emitted).toContain('_member:');
		expect(emitted).not.toContain('_separator_kind:');
		expect(emitted).not.toContain('_leading_sep:');
		expect(emitted).toContain('_trailing_sep:');
	});

	it('routes a MULTI-field separatedList (each repeated element is itself a key/value pair) through the exact per-field drilling logic emitFieldCarryingWrap uses, not one shared bucket', () => {
		// Each repeated element is a two-FIELD seq (`field('key', ...)` +
		// `field('value', ...)`) — deriveSlots yields TWO separate real slots
		// (`_key`/`_value`) from this shape, mirroring a dict-pattern-shaped
		// separatedList (e.g. python's DictPatternGroup1) whose elements route
		// to more than one real slot, not one shared `_content` bucket.
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: {
				type: SEQ,
				members: [
					{ type: FIELD, name: 'key', content: { type: SYMBOL, name: 'key_item' } },
					{ type: FIELD, name: 'value', content: { type: SYMBOL, name: 'val_item' } }
				]
			},
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		// Post-wrapper-deletion (normalize/simplify) view of the same content:
		// FIELD wrappers are gone — `fieldName` is stamped directly onto each
		// leaf instead (see RuleBase's NormalizedPhase branch, types/rule.ts).
		const normalizedContentRule: SimplifiedRule = {
			type: SEQ,
			members: [
				{ type: SYMBOL, name: 'key_item', fieldName: 'key' },
				{ type: SYMBOL, name: 'val_item', fieldName: 'value' }
			]
		};
		const nodes = new Map<string, AssembledNode>();
		nodes.set(
			'multi_field_list',
			new AssembledSeparatedList('multi_field_list', rule, undefined, {
				separatorRule: undefined,
				simplifiedRule: normalizedContentRule,
				renderRule: normalizedContentRule
			})
		);
		nodes.set('key_item', new AssembledPattern('key_item', { type: PATTERN, value: '[a-z]+' }));
		nodes.set('val_item', new AssembledPattern('val_item', { type: PATTERN, value: '[0-9]+' }));
		const nodeMap = makeNodeMapWith(nodes);
		const entries: KindEnumEntry[] = [
			{ id: 1, kind: 'multi_field_list', member: 'MultiFieldList' },
			{ id: 2, kind: 'key_item', member: 'KeyItem' },
			{ id: 3, kind: 'val_item', member: 'ValItem' }
		];
		const emitted = emitWrap({ grammar: 'test', nodeMap, kindEntries: entries });

		// Each real per-field slot gets its OWN storage assignment + accessor —
		// NOT a single hardcoded `_content`/`content()` bucket.
		expect(emitted).toContain('_key:');
		expect(emitted).toContain('key() {');
		expect(emitted).toContain('_value:');
		expect(emitted).toContain('value() {');
		expect(emitted).not.toContain('_content:');
		expect(emitted).not.toContain('content() {');
	});
});
