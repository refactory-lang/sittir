import { describe, expect, it } from 'vitest';
import { seq } from '../evaluate.ts';
import { buildRuleCatalog } from '../rule-catalog.ts';
import { link } from '../link.ts';
import { optimize } from '../optimize.ts';
import { assemble } from '../assemble.ts';
import type { RawGrammar } from '../types.ts';
import type { AssembledBranch } from '../node-map.ts';

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

function getBranch(nodeMap: ReturnType<typeof buildNodeMap>, kind: string): AssembledBranch {
	const node = nodeMap.nodes.get(kind);
	expect(node?.modelType).toBe('branch');
	if (!node || node.modelType !== 'branch') {
		throw new Error(`expected '${kind}' to assemble as a branch`);
	}
	return node;
}

describe('slot structural signals', () => {
	it('treats fieldless slots as unnamed without consulting origin', () => {
		const nodeMap = buildNodeMap({
			box: seq({ type: 'symbol', name: 'identifier' }),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' },
		});
		const slot = getBranch(nodeMap, 'box').fields[0];
		expect(slot?.fieldName).toBeUndefined();
		expect(slot?.isUnnamed).toBe(true);
	});

	it('projects unnamed-slot parseNames from per-value parseKind, not slot aliasSources', () => {
		const nodeMap = buildNodeMap({
			box: seq({
				type: 'alias',
				content: { type: 'symbol', name: 'interface_body' },
				named: true,
				value: 'object_type',
			}),
			interface_body: seq({ type: 'symbol', name: 'identifier' }),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' },
		});
		const slot = getBranch(nodeMap, 'box').fields[0];
		expect(slot?.isUnnamed).toBe(true);
		expect(slot?.values.map((value) => value.parseKind?.name)).toEqual(['object_type']);
		expect(slot?.parseNames).toEqual(['object_type']);
	});
});
