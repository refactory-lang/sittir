import { describe, expect, it } from 'vitest';
import { choice, alias, seq } from './evaluate.ts';
import { buildRuleCatalog } from './rule-catalog.ts';
import { link } from './link.ts';
import { optimize } from './optimize.ts';
import { assemble } from './assemble.ts';
import type { RawGrammar } from './types.ts';
import { AssembledNonterminal, AssembledPolymorph } from './node-map.ts';
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

	it('assemble fails on non-mergeable parseKind collisions', () => {
		expect(() =>
			buildNodeMap({
				host: choice(
					alias({ type: 'symbol', name: 'left' }, { type: 'symbol', name: 'shared' }),
					{ type: 'symbol', name: 'shared' },
					alias({ type: 'symbol', name: 'right' }, { type: 'symbol', name: 'shared' })
				),
				left: { type: 'pattern', value: '[a-z]+' },
				shared: {
					type: 'seq',
					members: [
						{ type: 'symbol', name: 'identifier', fieldName: 'body' },
						{ type: 'symbol', name: 'identifier2', fieldName: 'tail' }
					]
				},
				right: { type: 'pattern', value: '[0-9]+' },
				identifier: { type: 'pattern', value: '[a-z_]\\w*' },
				identifier2: { type: 'pattern', value: '[A-Z_]\\w*' }
			})
		).toThrow(/propose-distinct-alias/);
	});

	it('assemble fails when collisions differ only by anonymous delimiters', () => {
		expect(() =>
			buildNodeMap({
				host: choice(
					alias({ type: 'symbol', name: 'left' }, { type: 'symbol', name: 'shared' }),
					{ type: 'symbol', name: 'shared' },
					alias({ type: 'symbol', name: 'right' }, { type: 'symbol', name: 'shared' })
				),
				left: seq('(', { type: 'symbol', name: 'identifier' }, ')'),
				shared: seq('[', { type: 'symbol', name: 'identifier' }, ']'),
				right: seq('{', { type: 'symbol', name: 'identifier' }, '}'),
				identifier: { type: 'pattern', value: '[a-z_]\\w*' }
			})
		).toThrow(/propose-distinct-alias/);
	});

	it('assemble fails when a polymorph parent introduces a non-injective merged slot', () => {
		const mkSlot = (storageKind: string) =>
			new AssembledNonterminal({
				fieldName: 'value',
				values: [
					{
						kind: 'node-ref',
						node: { kind: 'unresolved-ref', name: storageKind },
						parseKind: { kind: 'unresolved-ref', name: 'shared' },
						multiplicity: 'single',
					},
				],
				hasTrailing: false,
				hasLeading: false,
				source: 'grammar',
				sourceRuleIds: [],
			});

		const forms = [
			{ slots: { shared: mkSlot('left') } },
			{ slots: { shared: mkSlot('shared') } },
			{ slots: { shared: mkSlot('right') } },
		] as any;

		expect(
			() =>
				new AssembledPolymorph(
					'host',
					{
						type: 'polymorph',
						source: 'promoted',
						forms: [],
					} as any,
					forms,
					{
						source: 'promoted',
						parseKindCollisionContext: {
							ruleSignatures: {
								left: 'pattern:[a-z]+',
								shared: 'seq(field:body)',
								right: 'pattern:[0-9]+',
							},
							failOnDiagnostic: true,
						},
					}
				)
		).toThrow(/propose-distinct-alias/);
	});
});
