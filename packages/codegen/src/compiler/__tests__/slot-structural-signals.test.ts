import { describe, expect, it } from 'vitest';
import { seq, field } from '../evaluate.ts';
import { buildRuleCatalog } from '../rule-catalog.ts';
import { link } from '../link.ts';
import { optimize } from '../optimize.ts';
import { assemble } from '../assemble.ts';
import type { RawGrammar } from '../types.ts';

function buildNodeMap(rules: Record<string, unknown>) {
	const { rules: catalogRules, ruleCatalog } = buildRuleCatalog(rules as never);
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
		references: [],
	};
	return assemble(optimize(link(raw)));
}

describe('slot structural signals', () => {
	it('treats fieldless slots as unnamed without consulting origin', () => {
		const nodeMap = buildNodeMap({
			box: seq({ type: 'symbol', name: 'identifier' }),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' },
		});
		const slot = nodeMap.nodes.get('box')?.fields[0];
		expect(slot?.fieldName).toBeUndefined();
		expect(slot?.isUnnamed).toBe(true);
	});

	it('keeps parseNames on structural facts without a slot-level alias map', () => {
		const nodeMap = buildNodeMap({
			host: seq(field('value', { type: 'symbol', name: 'identifier' })),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' },
		});
		const slot = nodeMap.nodes.get('host')?.fields[0];
		expect(slot?.parseNames).toEqual(['value']);
		expect('aliasSources' in (slot ?? {})).toBe(false);
	});
});
