import { describe, it, expect, vi } from 'vitest';
import type { RawGrammar, LinkedGrammar, NormalizedGrammar } from '../types.ts';
import type { AssembledNodeMap } from '../assemble.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import type { Compilation } from '../compile.ts';

// generate() alone rejects every compilation assertCompilation rejects: a
// library caller gets the same gate as the CLI, from the one compile.
const blockingCompilation: Compilation = {
	grammar: 'rust',
	raw: {} as RawGrammar,
	linked: {} as LinkedGrammar,
	normalized: {} as NormalizedGrammar,
	nodeMap: {} as AssembledNodeMap,
	diagnostics: new DiagnosticSink(),
	slotGroupingDiagnostics: [],
	grammarDiagnostics: [
		{
			scope: 'grammar',
			code: 'parsekind-noninjective',
			severity: 'warning',
			grammar: 'rust',
			ownerKind: 'host',
			message: 'two branches parse into the same kind at slot `content`',
			canProceed: false
		}
	]
};

vi.mock('../compile.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../compile.ts')>();
	return { ...actual, compileGrammar: vi.fn().mockResolvedValue(blockingCompilation) };
});

describe('generate() rejects a grammar the preflight rejects, on its own', () => {
	it('throws GrammarDiagnosticError for a parsekind-noninjective compilation, before reaching emission', async () => {
		const { generate } = await import('../generate.ts');
		const { GrammarDiagnosticError } = await import('../diagnostics/grammar-diagnostics.ts');
		await expect(generate({ grammar: 'rust', outputDir: 'unused' })).rejects.toThrow(GrammarDiagnosticError);
	});
});
