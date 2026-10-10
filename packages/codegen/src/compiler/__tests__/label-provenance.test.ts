import { beforeAll, describe, expect, it } from 'vitest';
import { evaluatePackage } from '../evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { loadGeneratedIdTables } from '../generated-metadata.ts';
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
		const raw = await evaluatePackage(grammarPackage('python'));
		const ids = await loadGeneratedIdTables('python');
		nodeMap = assemble(AssembleCtx.from(normalizeGrammar(link(raw, { generatedIdTables: ids })), ids));
	});

	it('carries an authored variant label to the assembled refs as authored', () => {
		const refs = labelledRefsOf(nodeMap, 'match_block');
		expect(refs.map((ref) => ref.variant).sort()).toEqual(['block', 'empty']);
		expect(new Set(refs.map((ref) => ref.definedBy))).toEqual(new Set(['override']));
	});

	it('carries an automatic label to the assembled refs as automatic', () => {
		const refs = labelledRefsOf(nodeMap, '_simple_statement');
		expect(refs.length).toBeGreaterThan(0);
		expect(new Set(refs.map((ref) => ref.definedBy))).toEqual(new Set(['enrich']));
	});
});
