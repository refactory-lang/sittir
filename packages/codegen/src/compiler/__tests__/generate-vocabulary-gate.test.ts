import { describe, expect, it, vi } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import type { GrammarInput } from '../../bindings/routes.ts';
import { generate } from '../generate.ts';
import { GrammarDiagnosticError } from '../diagnostics/grammar-diagnostics.ts';

const UNDECLARED = 'statement.nowhere';

const withUndeclaredClaim = (input: GrammarInput): GrammarInput => ({
	...input,
	bindings: { ...input.bindings, claims: [...input.bindings.claims, { ...input.bindings.claims[0]!, vocab: UNDECLARED }] }
});

vi.mock('../../bindings/input.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../../bindings/input.ts')>();
	return {
		...actual,
		grammarInput: async (...args: Parameters<typeof actual.grammarInput>) => {
			const input = await actual.grammarInput(...args);
			return input === undefined ? undefined : withUndeclaredClaim(input);
		}
	};
});

const failureOf = (allowDiagnostics?: ReadonlySet<string>): Promise<unknown> =>
	generate({ grammar: 'python', outputDir: 'unused', ...(allowDiagnostics === undefined ? {} : { allowDiagnostics }) }).then(
		() => undefined,
		(error: unknown) => error
	);

describe('generate on a claim the vocabulary does not declare', () => {
	it('halts, naming the path', async () => {
		const failure = await failureOf();
		expect(failure).toBeInstanceOf(GrammarDiagnosticError);
		const { diagnostics } = failure as GrammarDiagnosticError;
		expect(diagnostics.map(({ code, message }) => [code, message])).toEqual([['vocabulary-disagreement', `${UNDECLARED}: claimed, but no vocabulary interface has this kind`]]);
	}, FULL_PIPELINE_TIMEOUT);

	it('passes the check when the run allows its code by name', async () => {
		const failure = await failureOf(new Set(['vocabulary-disagreement']));
		const codes = failure instanceof GrammarDiagnosticError ? failure.codes : [];
		expect(codes).not.toContain('vocabulary-disagreement');
	}, FULL_PIPELINE_TIMEOUT);
});
