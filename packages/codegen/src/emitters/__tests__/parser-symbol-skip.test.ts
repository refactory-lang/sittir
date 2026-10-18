import { afterEach, describe, expect, it, vi } from 'vitest';
import { reportSkippedParserSymbol } from '../shared.ts';

describe('reportSkippedParserSymbol', () => {
	afterEach(() => vi.restoreAllMocks());

	it('skips a kind with no parser symbol silently: the phantom-kind ratchet counts those', () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		reportSkippedParserSymbol('_layout', 'wrap', 'skip-missing-parser-symbol');
		reportSkippedParserSymbol('comment', 'factory', 'skip-missing-parser-symbol');
		expect(log).not.toHaveBeenCalled();
		expect(warn).not.toHaveBeenCalled();
	});

	it('names a kind skipped because the grammar inlines it, on stdout: the skip is by design, not a warning', () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		reportSkippedParserSymbol('_expression', 'wrap', 'skip-inline-kind');
		expect(log).toHaveBeenCalledOnce();
		expect(warn).not.toHaveBeenCalled();
	});
});
