import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { emitTests } from '../test.ts';

// ---------------------------------------------------------------------------
// Same synthetic grammar shape as overlays/polymorphs.ts's own test fixture:
// `comment` — envelope, sole choice slot, two kind arms (residual ∅,
// positional parent) — so its sub-factories are `doc` and `plain`.
// ---------------------------------------------------------------------------

function buildNodeMap(rules: Record<string, Rule<'evaluate'>>): NodeMap {
	const raw: RawGrammar = {
		name: 'synth',
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		extras: [],
		externals: [],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
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
