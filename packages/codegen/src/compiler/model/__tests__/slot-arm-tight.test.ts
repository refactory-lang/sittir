import { describe, expect, it } from 'vitest';
import type { RenderRule, RuleId } from '../../../types/rule.ts';
import type { SeamRole } from '../../../types/spacing.ts';
import type { GrammarRule } from '../../../grammar-shapes/grammar-json.ts';
import { AssembledNonterminal, tightSlotArmsOf, type AssembledNode } from '../node-map.ts';
import { forEachSeamKey } from '../join-seams/grammar-view.ts';

const sym = (name: string, extra: object = {}): RenderRule => ({ type: 'SYMBOL', name, nonterminal: true, ...extra }) as unknown as RenderRule;
const str = (value: string, extra: object = {}): RenderRule => ({ type: 'STRING', value, nonterminal: false, ...extra }) as unknown as RenderRule;
const seq = (...members: RenderRule[]): RenderRule => ({ type: 'SEQ', members, nonterminal: true }) as unknown as RenderRule;
const choice = (members: RenderRule[], extra: object = {}): RenderRule => ({ type: 'CHOICE', members, nonterminal: true, ...extra }) as unknown as RenderRule;

const nodes = new Map(['string', 'a', 'b'].map((kind) => [kind, { kind } as unknown as AssembledNode]));
const parts = (multiplicity: 'array' | 'single', sourceRuleIds: readonly RuleId[]): AssembledNonterminal =>
	new AssembledNonterminal({
		values: ['a', 'b'].map((kind) => ({ node: { kind: 'unresolved-ref', name: kind }, multiplicity })) as never,
		fieldName: 'parts',
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		sourceRuleIds
	});
const tight = (entries: Record<string, SeamRole>): ReadonlyMap<RuleId, ReadonlySet<SeamRole>> =>
	new Map(Object.entries(entries).map(([id, role]) => [id as RuleId, new Set([role])]));

describe('tightSlotArmsOf', () => {
	const list = choice([sym('a', { id: 'r1a' }), sym('b', { id: 'r1b' }), str('-', { id: 'r1c' })], { id: 'r1', absorbedIds: ['r1e'], multiplicity: 'array' });
	const rules = (a: RenderRule = seq(str('x'))): Record<string, RenderRule> => ({ string: seq(str('"'), list, str('"')), a, b: seq(str('y')) });
	const arms = (entries: Record<string, SeamRole>, a?: RenderRule) =>
		tightSlotArmsOf({ owner: 'string', slot: parts('array', ['r1', 'r1a', 'r1b', 'r1c']) }, { nodes, rules: rules(a), tight: tight(entries) });
	const dash = { kind: 'dash', text: '-' };

	it('glues every arm of a list whose elements the join seams prove tight', () => {
		const starts = arms({ r1e: 'element' });
		expect([starts.kind('a'), starts.kind('b'), starts.literal(dash), starts.verbatim()]).toEqual([true, true, true, true]);
	});

	it('does not glue the arms of a list whose start alone is tight', () => {
		const starts = arms({ r1: 'before' });
		expect([starts.kind('a'), starts.kind('b'), starts.literal(dash), starts.verbatim()]).toEqual([false, false, false, false]);
	});

	it('glues the one arm whose own member is tight', () => {
		const starts = arms({ r1a: 'before' });
		expect([starts.kind('a'), starts.kind('b'), starts.literal(dash)]).toEqual([true, false, false]);
	});

	it('glues a literal arm whose own member is tight', () => {
		const starts = arms({ r1c: 'before' });
		expect([starts.kind('a'), starts.literal(dash)]).toEqual([false, true]);
	});

	it('glues an arm whose kind starts with an immediate token', () => {
		const starts = arms({}, seq(str('x', { immediate: true })));
		expect([starts.kind('a'), starts.kind('b')]).toEqual([true, false]);
	});

	it('reads a holder at its own position', () => {
		const holder = choice([sym('a', { id: 'r2a' }), sym('b', { id: 'r2b' })], { id: 'r2' });
		const starts = tightSlotArmsOf(
			{ owner: 'string', slot: parts('single', ['r2', 'r2a', 'r2b']) },
			{ nodes, rules: { string: seq(str('"'), holder), a: seq(str('x')), b: seq(str('y')) }, tight: tight({ r2: 'before' }) }
		);
		expect([starts.kind('a'), starts.kind('b'), starts.verbatim()]).toEqual([true, true, true]);
	});

	describe('a slot at two positions', () => {
		const twice = (entries: Record<string, SeamRole>) =>
			tightSlotArmsOf(
				{ owner: 'string', slot: parts('single', ['r3', 'r4']) },
				{ nodes, rules: { string: seq(sym('a', { id: 'r3' }), str(','), sym('a', { id: 'r4' })), a: seq(str('x')) }, tight: tight(entries) }
			);

		it('glues an arm tight at both and leaves one tight at neither', () => {
			expect(twice({ r3: 'before', r4: 'before' }).kind('a')).toBe(true);
			expect(twice({}).kind('a')).toBe(false);
		});

		it('refuses an arm tight at one position and not the other, naming the slot and both positions', () => {
			expect(() => twice({ r3: 'before' }).kind('a')).toThrow(/string\.parts: the a arm starts tight at \[r3\] but not at \[r4\]/);
		});
	});
});

describe('forEachSeamKey', () => {
	it('gives the content of a repeat the element role, through the wrappers around it', () => {
		const rules = {
			string: {
				type: 'SEQ',
				members: [
					{ type: 'STRING', value: '"' },
					{ type: 'REPEAT', content: { type: 'FIELD', name: 'part', content: { type: 'CHOICE', members: [{ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'b' }] } } }
				]
			},
			list: { type: 'PREC_RIGHT', value: 0, content: { type: 'REPEAT1', content: { type: 'SYMBOL', name: 'a' } } }
		} as unknown as Record<string, GrammarRule>;
		const roles = new Map<string, SeamRole>();
		forEachSeamKey(rules, (_, __, key, role) => roles.set(key, role));
		expect(Object.fromEntries(roles)).toEqual({
			'string:root': 'before',
			'string:members.0': 'before',
			'string:members.1': 'before',
			'string:members.1/content': 'element',
			'string:members.1/content/members.0': 'before',
			'string:members.1/content/members.1': 'before',
			'list:root': 'before',
			'list:content': 'element'
		});
	});
});
