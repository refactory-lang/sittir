import { describe, expect, it } from 'vitest';
import { choice, alias } from './evaluate.ts';
import { buildRuleCatalog } from './rule-catalog.ts';
import { link } from './link.ts';
import { optimize } from './optimize.ts';
import { assemble } from './assemble.ts';
import type { RawGrammar } from './types.ts';
import { diagnoseParseKindCollisions } from './diagnose-parsekind-collisions.ts';

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
		references: []
	};
	return assemble(optimize(link(raw)));
}

describe('diagnoseParseKindCollisions', () => {
	it('merges structurally identical relabels that share one parseKind', () => {
		const result = diagnoseParseKindCollisions({
			ownerKind: 'host',
			slotName: 'content',
			values: [
				{
					original: 'left',
					parseKind: 'shared',
					storageKind: 'left',
					structuralSignature: 'pattern:[a-z]+'
				},
				{
					original: 'shared',
					parseKind: 'shared',
					storageKind: 'shared',
					structuralSignature: 'pattern:[a-z]+',
					preferRepresentative: true
				},
				{
					original: 'right',
					parseKind: 'shared',
					storageKind: 'right',
					structuralSignature: 'pattern:[a-z]+'
				}
			]
		});

		expect(result.diagnostics).toEqual([]);
		expect(result.values).toEqual(['shared']);
	});

	it('diagnoses structurally distinct storage kinds sharing one parseKind', () => {
		const result = diagnoseParseKindCollisions({
			ownerKind: '_suite',
			slotName: 'content',
			values: [
				{
					original: '_simple_statements',
					parseKind: 'block',
					storageKind: '_simple_statements',
					structuralSignature: 'pattern:[a-z]+'
				},
				{
					original: 'block',
					parseKind: 'block',
					storageKind: 'block',
					structuralSignature: 'seq(field:body)'
				},
				{
					original: '_newline',
					parseKind: 'block',
					storageKind: '_newline',
					structuralSignature: 'pattern:\\n'
				}
			]
		});

		expect(result.values).toEqual(['_simple_statements', 'block', '_newline']);
		expect(result.diagnostics).toHaveLength(1);
		expect(result.diagnostics[0]).toMatchObject({
			ownerKind: '_suite',
			slotName: 'content',
			shape: 'propose-distinct-alias'
		});
		expect(result.diagnostics[0]!.proposal).toContain('block');
	});

	it('assemble wires the pass and collapses identical parseKind collisions before slot naming', () => {
		const nodeMap = buildNodeMap({
			host: choice(
				alias({ type: 'symbol', name: 'left' }, { type: 'symbol', name: 'shared' }),
				{ type: 'symbol', name: 'shared' },
				alias({ type: 'symbol', name: 'right' }, { type: 'symbol', name: 'shared' })
			),
			left: { type: 'pattern', value: '[a-z]+' },
			shared: { type: 'pattern', value: '[a-z]+' },
			right: { type: 'pattern', value: '[a-z]+' }
		});

		const host = nodeMap.nodes.get('host');
		expect(host?.modelType).toBe('branch');
		const slot = Object.values((host as { slots: Record<string, { name: string; values: readonly unknown[] }> }).slots)[0];
		expect(slot?.name).toBe('shared');
		expect(slot?.values).toHaveLength(1);
	});
});
