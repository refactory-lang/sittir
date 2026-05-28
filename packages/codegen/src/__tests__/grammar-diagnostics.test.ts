import { describe, expect, it } from 'vitest';
import { alias, choice } from '../compiler/evaluate.ts';
import { buildRuleCatalog } from '../compiler/rule-catalog.ts';
import {
	collectGrammarDiagnostics,
	collectGrammarDiagnosticsForGrammar,
	GrammarDiagnosticError
} from '../compiler/grammar-diagnostics.ts';
import type { DeriveShapeDiagnostic } from '../compiler/diagnose-derive-shapes.ts';
import type { RawGrammar } from '../compiler/types.ts';

function buildRawGrammar(rules: Record<string, unknown>): RawGrammar {
	const { rules: catalogRules, ruleCatalog } = buildRuleCatalog(rules as never);
	return {
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
}

describe('grammar diagnostics preflight', () => {
	it('emits parsekind-noninjective records from compiler-produced collisions', () => {
		const result = collectGrammarDiagnosticsForGrammar({
			rawGrammar: buildRawGrammar({
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
		});

		expect(result.nodeMap.parseKindCollisions).toEqual([
			expect.objectContaining({
				code: 'parsekind-noninjective',
				ownerKind: 'host',
				slotName: 'content',
				parseKind: 'shared'
			})
		]);
		expect(result.diagnostics).toEqual([
			expect.objectContaining({
				scope: 'grammar',
				code: 'parsekind-noninjective',
				grammar: 'synth',
				ownerKind: 'host',
				slotName: 'content',
				canProceed: false
			})
		]);
	});

	it('keeps identical-structure collisions auto-merged without diagnostics', () => {
		const result = collectGrammarDiagnosticsForGrammar({
			rawGrammar: buildRawGrammar({
				host: choice(
					alias({ type: 'symbol', name: 'left' }, { type: 'symbol', name: 'shared' }),
					{ type: 'symbol', name: 'shared' },
					alias({ type: 'symbol', name: 'right' }, { type: 'symbol', name: 'shared' })
				),
				left: { type: 'pattern', value: '[a-z]+' },
				shared: { type: 'pattern', value: '[a-z]+' },
				right: { type: 'pattern', value: '[a-z]+' }
			})
		});

		const host = result.nodeMap.nodes.get('host');
		const slot = Object.values((host as { slots: Record<string, { values: readonly unknown[] }> }).slots)[0];
		expect(result.nodeMap.parseKindCollisions).toEqual([]);
		expect(result.diagnostics).toEqual([]);
		expect(slot?.values).toHaveLength(1);
	});

	it('includes derive-shape diagnostics in the shared batch', () => {
		const deriveD: DeriveShapeDiagnostic = {
			code: 'seq-with-nested-seq',
			severity: 'error',
			ownerKind: 'host',
			message: "Kind 'host' still contains a nested seq that should have been flattened, grouped, or normalized before derive.",
			canProceed: false,
			details: { rawShape: 'seq-with-nested-seq', ruleType: 'seq', context: 'fields' },
		};
		const result = collectGrammarDiagnostics({
			grammar: 'synth',
			parseKindCollisions: [],
			deriveShapeDiagnostics: [deriveD],
		});
		expect(result.diagnostics).toEqual([
			expect.objectContaining({
				scope: 'grammar',
				code: 'seq-with-nested-seq',
				grammar: 'synth',
				ownerKind: 'host',
				canProceed: true,
			}),
		]);
	});

	it('captures diagnostic codes in GrammarDiagnosticError', () => {
		const { diagnostics } = collectGrammarDiagnostics({
			grammar: 'synth',
			parseKindCollisions: [
				{
					code: 'parsekind-noninjective',
					severity: 'error',
					message: "Slot 'content' of kind '_suite' collapses [_simple_statements, block] onto parse kind 'block'.",
					canProceed: false,
					ownerKind: '_suite',
					slotName: 'content',
					shape: 'propose-distinct-alias',
					parseKind: 'block',
					storageKinds: ['_simple_statements', 'block'],
					proposal: 'Give each colliding arm a distinct alias.'
				}
			]
		});

		const error = new GrammarDiagnosticError(diagnostics);
		expect(error.name).toBe('GrammarDiagnosticError');
		expect(error.codes).toEqual(['parsekind-noninjective']);
		expect(error.message).toContain('parsekind-noninjective');
	});
});
