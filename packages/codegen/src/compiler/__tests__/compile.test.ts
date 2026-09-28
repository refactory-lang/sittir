import { describe, it, expect } from 'vitest';
import type { RawGrammar, LinkedGrammar, NormalizedGrammar } from '../types.ts';
import type { AssembledNodeMap } from '../assemble.ts';
import { DiagnosticSink, EmitHaltedError } from '../../types/diagnostics.ts';
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
		diagnosticRecords: [],
		...overrides
	};
}

describe('assertCompilation', () => {
	it('does not throw for an empty compilation (inert)', () => {
		expect(() => assertCompilation(makeCompilation())).not.toThrow();
	});

	it('leaves grammar diagnostics to the compile gate', () => {
		const compilation = makeCompilation({
			grammarDiagnostics: [
				{ scope: 'grammar', code: 'B1', severity: 'error', grammar: 'synth', message: 'a blocking record', canProceed: false }
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
});
