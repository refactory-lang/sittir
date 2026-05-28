import { describe, expect, it } from 'vitest';
import {
	collectGrammarDiagnostics,
	GrammarDiagnosticError
} from '../compiler/grammar-diagnostics.ts';

describe('grammar diagnostics preflight', () => {
	it('emits parsekind-noninjective records for structurally distinct collisions', () => {
		const result = collectGrammarDiagnostics({
			grammar: 'synth',
			parseKindCollisions: [
				{
					code: 'parsekind-noninjective',
					ownerKind: '_suite',
					slotName: 'content',
					shape: 'propose-distinct-alias',
					parseKind: 'block',
					storageKinds: ['_simple_statements', 'block', '_newline'],
					proposal: 'Give each colliding arm a distinct alias.'
				}
			]
		});

		expect(result.diagnostics).toEqual([
			expect.objectContaining({
				code: 'parsekind-noninjective',
				grammar: 'synth',
				ownerKind: '_suite',
				slotName: 'content',
				canProceed: false
			})
		]);
	});

	it('captures diagnostic codes in GrammarDiagnosticError', () => {
		const { diagnostics } = collectGrammarDiagnostics({
			grammar: 'synth',
			parseKindCollisions: [
				{
					code: 'parsekind-noninjective',
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
