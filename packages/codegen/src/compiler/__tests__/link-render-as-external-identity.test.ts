import { FIELD, SEQ, STRING, SYMBOL, TOKEN } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { canonicalizeRuleLiterals, stampStaticRenderAs } from '../link.ts';
import type { Rule } from '../../types/rule.ts';

/**
 * A `renderAs` body gives an external token the text it renders as; the
 * parser still produces the external's own symbol. The literal that stands in
 * for a reference keeps that symbol's id through the link's literal stamp, so
 * the reader matches the node by the grammar id the parser gives it.
 */
const entries = [
	{ kind: '_marker', id: 163, hidden: true },
	{ kind: 'star', id: 9, anon: true, symbolName: '*', literalText: '*' }
];
const misses = () => ({ symbols: new Set<string>(), literals: new Set<string>(), aliasTargets: new Set<string>() });
const renderAs: Record<string, Rule<'link'>> = { _marker: { type: TOKEN, immediate: true, content: { type: STRING, value: '*' } } as Rule<'link'> };

describe('a renderAs literal standing in for an external token', () => {
	it("carries the external's parser symbol, not its text's", () => {
		const rules: Record<string, Rule<'link'>> = { doc: { type: SEQ, members: [{ type: SYMBOL, name: '_marker' }, { type: STRING, value: '*' }] } as Rule<'link'> };
		const stamped = stampStaticRenderAs(rules, renderAs, entries);
		const out = canonicalizeRuleLiterals(stamped['doc']!, entries, false, misses());
		expect(out).toMatchObject({
			type: SEQ,
			members: [
				{ type: TOKEN, content: { type: STRING, value: '*', resolvedKindId: 163 } },
				{ type: STRING, value: '*', resolvedKindId: 9 }
			]
		});
	});

	it('rewrites under a field into a reference to the external', () => {
		const rule = { type: FIELD, name: 'marker', content: { type: STRING, value: '*', resolvedKindId: 163 } } as Rule<'link'>;
		const out = canonicalizeRuleLiterals(rule, entries, false, misses());
		expect(out).toMatchObject({ type: FIELD, content: { type: SYMBOL, name: '_marker', literal: '*', kindId: 163 } });
	});
});
