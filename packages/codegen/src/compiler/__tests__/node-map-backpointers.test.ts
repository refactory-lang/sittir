import { PATTERN } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { choice, field, seq } from '../evaluate.ts';
import { buildRuleCatalog } from '../rule-catalog.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import type { AssembledBranch } from '../model/node-map.ts';
import type { RawGrammar } from '../types.ts';
import type { ChoiceRule, FieldRule, RenderRule, Rule } from '../../types/rule.ts';

/**
 * PR0 Task 1.3 — NodeMap back-pointer maps.
 *
 * `nodeByRuleId` / `slotByRuleId` let downstream consumers (the new
 * template emitter, etc.) look up an AssembledNode / AssembledNonterminal
 * from a rule's `id` without owner traversal. See
 * feedback_ruleid_backpointer.
 */
describe('NodeMap back-pointer maps', () => {
	function buildFixture() {
		// Minimal grammar with a branch (call_expression) that carries a
		// field('function') wrapping a symbol — exercises both the kind
		// root id and a slot's source rule id. The seq has multiple members
		// so simplify doesn't collapse it down to the bare field — keeps
		// the field rule's identity addressable via `rules.call_expression`
		// for the third assertion.
		const { rules, ruleCatalog } = buildRuleCatalog({
			call_expression: seq(
				field('function', { type: 'SYMBOL', name: 'identifier' }),
				field('args', { type: 'SYMBOL', name: 'identifier' })
			),
			identifier: { type: PATTERN, value: '[a-z_]\\w*' }
		});
		const raw: RawGrammar = {
			name: 'synth',
			rules,
			ruleCatalog,
			extras: [],
			externals: [],
			supertypes: [],
			inline: [],
			conflicts: [],
			word: null,
			references: []
		};
		const linked = link(raw);
		const optimized = normalizeGrammar(linked);
		const nodeMap = assemble(optimized, AssembleCtx.from(optimized));
		// Return the post-optimize rules — that's what assemble walks, so
		// the ids on these rules are what nodeByRuleId / slotByRuleId key
		// off. The raw input rules may have stale ids after link/optimize
		// shape rewrites.
		return { rules: optimized.rules, nodeMap };
	}

	function buildNodeMap(
		rules: Record<string, Rule<'evaluate'>>
	): ReturnType<typeof normalizeGrammar> & { nodeMap: ReturnType<typeof assemble> } {
		const { rules: catalogRules, ruleCatalog } = buildRuleCatalog(rules);
		const raw: RawGrammar = {
			name: 'synth',
			rules: catalogRules,
			ruleCatalog,
			extras: [],
			externals: [],
			supertypes: [],
			inline: [],
			conflicts: [],
			word: null,
			references: []
		};
		const linked = link(raw);
		const optimized = normalizeGrammar(linked);
		return { ...optimized, nodeMap: assemble(optimized, AssembleCtx.from(optimized)) };
	}

	it('nodeMap.nodeByRuleId is populated with kind roots when ids survive the pipeline', () => {
		const { rules, nodeMap } = buildFixture();
		expect(nodeMap.nodeByRuleId).toBeInstanceOf(Map);
		// `identifier` is a pattern rule — pass-through case in `resolveRule`
		// (`...rule, content: ...` shape via the `pattern` arm), so the root
		// id survives link/optimize and registers in nodeByRuleId. Branch-
		// shaped roots (top-level seq/choice) currently lose their id in
		// link's resolveRule rebuild — that's a pre-existing pipeline gap
		// outside Task 1.3's scope.
		const identRootId = rules.identifier?.id;
		expect(identRootId).toBeTruthy();
		const identNode = nodeMap.nodeByRuleId.get(identRootId!);
		expect(identNode).toBeDefined();
		expect(identNode!.kind).toBe('identifier');
	});

	it('nodeMap.slotByRuleId is populated with slot source rules', () => {
		const { nodeMap } = buildFixture();
		expect(nodeMap.slotByRuleId).toBeInstanceOf(Map);
		expect(nodeMap.slotByRuleId.size).toBeGreaterThan(0);
	});

	it('slotByRuleId.get(fieldRule.id) returns the slot whose name matches fieldRule.name', () => {
		const { rules, nodeMap } = buildFixture();
		// Reach into the call_expression rule to find the inner field rule
		// (the seq has one member: field('function', symbol('identifier'))).
		const callRule = rules.call_expression;
		expect(callRule?.type).toBe('SEQ');
		const seqMembers = (callRule as { members: readonly { type: string }[] }).members;
		const fieldRule = seqMembers.find((m) => m.type === 'FIELD') as FieldRule | undefined;
		expect(fieldRule).toBeDefined();
		expect(fieldRule!.id).toBeTruthy();

		const slot = nodeMap.slotByRuleId.get(fieldRule!.id!);
		expect(slot).toBeDefined();
		expect(slot!.name).toBe(fieldRule!.name);
	});

	it('slot.sourceRuleIds accumulates merged simplified-rule contributors and maps each id back to the slot', () => {
		const { simplifiedRules, nodeMap } = buildNodeMap({
			test: seq(
				field('parameter', { type: 'SYMBOL', name: 'identifier' }),
				field('parameter', { type: 'SYMBOL', name: 'number' })
			),
			identifier: { type: PATTERN, value: '[a-z_]\\w*' },
			number: { type: PATTERN, value: '[0-9]+' }
		});

		const slot = (nodeMap.nodes.get('test') as AssembledBranch | undefined)?.slots.parameter;
		expect(slot).toBeDefined();

		const simplifiedIds = ((simplifiedRules.test as { members: readonly { id?: string }[] }).members)
			.map((member) => member.id)
			.filter((id): id is string => Boolean(id));

		expect(slot!.sourceRuleIds).toEqual(expect.arrayContaining(simplifiedIds));
		for (const id of slot!.sourceRuleIds) {
			expect(nodeMap.slotByRuleId.get(id)).toBe(slot);
		}
	});

	it('slot.sourceRuleIds includes both simplified and render-view ids when the views diverge', () => {
		const { simplifiedRules, renderRules, nodeMap } = buildNodeMap({
			test: seq(
				field('lhs', { type: 'SYMBOL', name: 'identifier' }),
				choice(
					seq({ type: 'STRING', value: '+' }, field('rhs', { type: 'SYMBOL', name: 'identifier' })),
					seq({ type: 'STRING', value: '-' }, field('rhs', { type: 'SYMBOL', name: 'number' }))
				)
			),
			identifier: { type: PATTERN, value: '[a-z_]\\w*' },
			number: { type: PATTERN, value: '[0-9]+' }
		});

		const slot = (nodeMap.nodes.get('test') as AssembledBranch | undefined)?.slots.rhs;
		expect(slot).toBeDefined();

		const simplifiedChoiceId = (simplifiedRules.test as { members: readonly { id?: string }[] }).members[1]?.id;
		const renderChoice = ((renderRules.test as RenderRule & { members: readonly Rule[] }).members[1] as ChoiceRule);
		const renderIds = renderChoice.members
			.map((member) => (member as { members?: readonly { id?: string }[] }).members?.[1]?.id)
			.filter((id): id is string => Boolean(id));
		const expectedIds = [simplifiedChoiceId, ...renderIds].filter((id): id is string => Boolean(id));

		expect(expectedIds.length).toBeGreaterThanOrEqual(3);
		expect(slot!.sourceRuleIds).toEqual(expect.arrayContaining(expectedIds));
		for (const id of expectedIds) {
			expect(nodeMap.slotByRuleId.get(id)).toBe(slot);
		}
	});
});
