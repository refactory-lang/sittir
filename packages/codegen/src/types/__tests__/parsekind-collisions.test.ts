import { describe, expect, it } from 'vitest';
import { alias, buildRuleCatalog, choice, seq } from '../../compiler/evaluate.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { diagnoseParseKindCollisions } from '../parsekind-collisions.ts';

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
	const normalized = normalizeGrammar(link(raw));
	return assemble(AssembleCtx.from(normalized));
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
			code: 'parsekind-noninjective',
			ownerKind: '_suite',
			slotName: 'content',
			shape: 'propose-distinct-alias'
		});
		expect(result.diagnostics[0]!.proposal).toContain('block');
	});

	it('assemble wires the pass and collapses identical parseKind collisions before slot naming', () => {
		const nodeMap = buildNodeMap({
			host: choice(
				alias({ type: 'SYMBOL', name: 'left' }, { type: 'SYMBOL', name: 'shared' }),
				{ type: 'SYMBOL', name: 'shared' },
				alias({ type: 'SYMBOL', name: 'right' }, { type: 'SYMBOL', name: 'shared' })
			),
			left: { type: 'PATTERN', value: '[a-z]+' },
			shared: { type: 'PATTERN', value: '[a-z]+' },
			right: { type: 'PATTERN', value: '[a-z]+' }
		});

		const host = nodeMap.nodes.get('host');
		expect(host?.modelType).toBe('branch');
		const slot = Object.values(
			(host as { slots: Record<string, { name: string; values: readonly unknown[] }> }).slots
		)[0];
		expect(slot?.name).toBe('shared');
		expect(slot?.values).toHaveLength(1);
	});

	it('assemble preserves non-mergeable parseKind collisions as distinct slot values', () => {
		const nodeMap = buildNodeMap({
			host: choice(
				alias({ type: 'SYMBOL', name: 'left' }, { type: 'SYMBOL', name: 'shared' }),
				{ type: 'SYMBOL', name: 'shared' },
				alias({ type: 'SYMBOL', name: 'right' }, { type: 'SYMBOL', name: 'shared' })
			),
			left: { type: 'PATTERN', value: '[a-z]+' },
			shared: {
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: 'identifier', fieldName: 'body' },
					{ type: 'SYMBOL', name: 'identifier2', fieldName: 'tail' }
				]
			},
			right: { type: 'PATTERN', value: '[0-9]+' },
			identifier: { type: 'PATTERN', value: '[a-z_]\\w*' },
			identifier2: { type: 'PATTERN', value: '[A-Z_]\\w*' }
		});

		const host = nodeMap.nodes.get('host');
		expect(host?.modelType).toBe('branch');
		const slot = Object.values((host as { slots: Record<string, { values: readonly unknown[] }> }).slots)[0];
		expect(slot?.values).toHaveLength(3);
	});

	it('assemble preserves collisions that differ only by anonymous delimiters', () => {
		const nodeMap = buildNodeMap({
			host: choice(
				alias({ type: 'SYMBOL', name: 'left' }, { type: 'SYMBOL', name: 'shared' }),
				{ type: 'SYMBOL', name: 'shared' },
				alias({ type: 'SYMBOL', name: 'right' }, { type: 'SYMBOL', name: 'shared' })
			),
			left: seq('(', { type: 'SYMBOL', name: 'identifier' }, ')'),
			shared: seq('[', { type: 'SYMBOL', name: 'identifier' }, ']'),
			right: seq('{', { type: 'SYMBOL', name: 'identifier' }, '}'),
			identifier: { type: 'PATTERN', value: '[a-z_]\\w*' }
		});

		const host = nodeMap.nodes.get('host');
		expect(host?.modelType).toBe('branch');
		const slot = Object.values((host as { slots: Record<string, { values: readonly unknown[] }> }).slots)[0];
		expect(slot?.values).toHaveLength(3);
	});
});
