import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { prefixNamedSuffix } from '../../compiler/variant-structural.ts';
import { emitTests } from '../test.ts';

// ---------------------------------------------------------------------------
// Same synthetic grammar shape as overlays/polymorphs.ts's own test fixture:
// `comment` — envelope, sole choice slot, two kind arms (residual ∅,
// positional parent) — so its sub-factories are `doc` and `plain`.
// ---------------------------------------------------------------------------

function labelArms(rules: Record<string, Rule<'evaluate'>>): Record<string, Rule<'evaluate'>> {
	const label = (owner: string, arm: Rule<'evaluate'>): Rule<'evaluate'> => {
		const display = arm.type === SYMBOL ? arm.name.replace(/^_+/, '') : arm.type === STRING ? arm.value : undefined;
		const variant = display === undefined ? undefined : (prefixNamedSuffix(owner, display) ?? display);
		return variant === undefined || arm.annotations?.variant !== undefined ? arm : ({ ...arm, annotations: { ...arm.annotations, variant, variantOf: owner } } as Rule<'evaluate'>);
	};
	const visit = (owner: string, rule: Rule<'evaluate'>): Rule<'evaluate'> => {
		const r = rule as { members?: Rule<'evaluate'>[]; content?: Rule<'evaluate'> };
		if (rule.type === CHOICE && r.members !== undefined && r.members.length >= 2) return { ...rule, members: r.members.map((m) => (m.type === CHOICE ? visit(owner, m) : label(owner, m))) } as Rule<'evaluate'>;
		if (r.members !== undefined) return { ...rule, members: r.members.map((m) => visit(owner, m)) } as Rule<'evaluate'>;
		if (r.content !== undefined) return { ...rule, content: visit(owner, r.content) } as Rule<'evaluate'>;
		return rule;
	};
	return Object.fromEntries(Object.entries(rules).map(([owner, rule]) => [owner, visit(owner, rule)]));
}

function buildNodeMap(rules: Record<string, Rule<'evaluate'>>): NodeMap {
	const raw: RawGrammar = {
		name: 'synth',
		rules: labelArms(rules),
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		extras: [],
		externals: [],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
		precedences: [],
		word: null,
		references: []
	};
	const linked = link(raw);
	const normalized = normalizeGrammar(linked);
	return assemble(AssembleCtx.from(normalized));
}

function commentNodeMap(): NodeMap {
	return buildNodeMap({
		comment: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'comment_doc' },
				{ type: SYMBOL, name: 'comment_plain' }
			]
		},
		comment_doc: {
			type: SEQ,
			members: [
				{ type: STRING, value: '///' },
				{ type: FIELD, name: 'text', content: { type: SYMBOL, name: 'comment_text' } }
			]
		},
		comment_plain: {
			type: SEQ,
			members: [
				{ type: STRING, value: '//' },
				{ type: FIELD, name: 'text', content: { type: SYMBOL, name: 'comment_text' } }
			]
		},
		comment_text: { type: PATTERN, value: '[a-z]+' }
	});
}

describe('emitTests sub-factories', () => {
	it('emits a sub-factories describe block with one test per sub-factory', () => {
		const nodeMap = commentNodeMap();
		const text = emitTests({ grammar: 'synth', nodeMap });

		expect(text).toContain("describe('comment sub-factories'");
		expect(text).toContain('ir.comment.doc(');
		expect(text).toContain('ir.comment.plain(');
		expect(text).toContain("it('doc builds the parent'");
		expect(text).toContain('expect(node.$render!().length).toBeGreaterThan(0);');
	});

	it('pins a known-failing sub-factory case with it.skip and a reason comment', () => {
		const nodeMap = commentNodeMap();
		const text = emitTests({
			grammar: 'synth',
			nodeMap,
			expectTestFailures: { 'comment.doc': 'render omits doc marker' }
		});

		expect(text).toContain('// known-failing: render omits doc marker');
		expect(text).toContain("it.skip('doc builds the parent'");
	});
});
