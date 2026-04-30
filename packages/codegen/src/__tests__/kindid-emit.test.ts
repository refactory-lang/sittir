import { describe, expect, it } from 'vitest';

import { field, seq } from '../compiler/evaluate.ts';
import { buildRuleCatalog } from '../compiler/rule-catalog.ts';
import { assemble } from '../compiler/assemble.ts';
import { link } from '../compiler/link.ts';
import { optimize } from '../compiler/optimize.ts';
import { emitTypes } from '../emitters/types.ts';
import type { RawGrammar } from '../compiler/types.ts';

function makeMinimalGrammar(): RawGrammar {
	const { rules, ruleCatalog } = buildRuleCatalog({
		call_expression: seq(
			field('function', { type: 'symbol', name: 'identifier' })
		),
		identifier: { type: 'pattern', value: '[a-z_]\\w*' }
	});

	return {
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
}

describe('KindId emission', () => {
	it('emits numeric runtime discriminants and lookup helpers', () => {
		const raw = makeMinimalGrammar();
		const linked = link(raw);
		const optimized = optimize(linked);
		const nodeMap = assemble(optimized);
		const contents = emitTypes({ grammar: 'synth', nodeMap });

		expect(contents).toContain('export const enum TSKindId {');
		expect(contents).toContain('$type: TSKindId.CallExpression;');
		expect(contents).toContain('export function kindNameFromId(');
		expect(contents).toContain('export function kindIdFromName(');
		expect(contents).not.toContain("$type: 'call_expression'");
	});
});
