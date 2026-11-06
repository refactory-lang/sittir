import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { grammarPackage } from '../../grammars.ts';
import { compileGrammar } from '../compile.ts';
import { AbstractAssembledCompound, AssembledSupertype } from '../model/node-map.ts';
import type { NodeMap } from '../types.ts';

function labelledRefsOf(nodeMap: NodeMap, owner: string): readonly { readonly variant?: string; readonly definedBy?: string }[] {
	const out: { readonly variant?: string; readonly definedBy?: string }[] = [];
	for (const node of nodeMap.nodes.values()) {
		const values = [
			...(node instanceof AbstractAssembledCompound ? node.slots.flatMap((slot) => slot.values) : []),
			...(node instanceof AssembledSupertype ? node.subtypes : [])
		];
		for (const value of values) if (value.variantOf === owner) out.push(value);
	}
	return out;
}

describe('label provenance', () => {
	let nodeMap: NodeMap;

	beforeAll(async () => {
		nodeMap = (await compileGrammar({ package: grammarPackage('python') })).nodeMap;
	}, FULL_PIPELINE_TIMEOUT);

	it('carries an authored variant label to the assembled refs as authored', () => {
		const refs = labelledRefsOf(nodeMap, 'with_clause');
		expect(refs.map((ref) => ref.variant).sort()).toEqual(['bare', 'paren']);
		expect(new Set(refs.map((ref) => ref.definedBy))).toEqual(new Set(['override']));
	});

	it('carries an automatic label to the assembled refs as automatic', () => {
		const refs = labelledRefsOf(nodeMap, '_simple_statement');
		expect(refs.length).toBeGreaterThan(0);
		expect(new Set(refs.map((ref) => ref.definedBy))).toEqual(new Set(['enrich']));
	});
});
