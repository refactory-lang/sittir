import { describe, expect, it } from 'vitest';
import { emitConfig } from '../config.ts';
import { isStableGrammar } from '../../grammars.ts';

describe('emitConfig', () => {
	it('lets an unstable grammar package run with no tests yet', () => {
		expect(emitConfig({ grammar: 'scm', stable: false })).toContain('passWithNoTests: true');
	});

	it('fails a stable grammar package whose tests go missing', () => {
		expect(emitConfig({ grammar: 'rust', stable: true })).not.toContain('passWithNoTests');
	});

	it('reads stability from the grammar package manifest', () => {
		expect(['rust', 'python', 'typescript'].every(isStableGrammar)).toBe(true);
		expect(['regex', 'scm', 'no-such-grammar'].some(isStableGrammar)).toBe(false);
	});
});
