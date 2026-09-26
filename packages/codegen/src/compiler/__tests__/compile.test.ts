import { describe, it, expect } from 'vitest';
import type { RawGrammar, LinkedGrammar, NormalizedGrammar } from '../types.ts';
import type { AssembledNodeMap } from '../assemble.ts';
import { DiagnosticSink, EmitHaltedError } from '../../types/diagnostics.ts';
import { GrammarDiagnosticError } from '../diagnostics/grammar-diagnostics.ts';
import { assertCompilation, type Compilation } from '../compile.ts';

function makeCompilation(overrides: Partial<Compilation> = {}): Compilation {
	return {
		grammar: 'synth',
		raw: {} as RawGrammar,
		linked: {} as LinkedGrammar,
		normalized: {} as NormalizedGrammar,
		nodeMap: {} as AssembledNodeMap,
		diagnostics: new DiagnosticSink(),
		slotGroupingDiagnostics: [],
		grammarDiagnostics: [],
		...overrides
	};
}

describe('assertCompilation', () => {
	it('does not throw for an empty compilation (inert)', () => {
		expect(() => assertCompilation(makeCompilation())).not.toThrow();
	});

	it('does not throw for grammarDiagnostics with only canProceed:true items', () => {
		const compilation = makeCompilation({
			grammarDiagnostics: [
				{ scope: 'grammar', code: 'W1', severity: 'warning', grammar: 'synth', message: 'a warning', canProceed: true }
			]
		});
		expect(() => assertCompilation(compilation)).not.toThrow();
	});

	it('throws EmitHaltedError when the compiler diagnostics sink contains a fail diagnostic', () => {
		const diagnostics = new DiagnosticSink();
		diagnostics.fail({ code: 'HALT', message: 'fatal problem' });
		const compilation = makeCompilation({ diagnostics });
		expect(() => assertCompilation(compilation)).toThrow(EmitHaltedError);
	});

	it('throws GrammarDiagnosticError when a grammarDiagnostics entry has canProceed:false', () => {
		const compilation = makeCompilation({
			grammarDiagnostics: [
				{
					scope: 'grammar',
					code: 'parsekind-noninjective',
					severity: 'warning',
					grammar: 'synth',
					message: 'collision',
					canProceed: false
				}
			]
		});
		expect(() => assertCompilation(compilation)).toThrow(GrammarDiagnosticError);
	});

	it('does not throw when a blocking grammarDiagnostics code is in the allow list', () => {
		const compilation = makeCompilation({
			grammarDiagnostics: [
				{
					scope: 'grammar',
					code: 'parsekind-noninjective',
					severity: 'warning',
					grammar: 'synth',
					message: 'collision',
					canProceed: false
				}
			]
		});
		expect(() =>
			assertCompilation(compilation, { allowDiagnostics: new Set(['parsekind-noninjective']) })
		).not.toThrow();
	});
});
