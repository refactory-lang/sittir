import { afterEach, describe, expect, it, vi } from 'vitest';
import { warnSkippedParserSymbol } from '../shared.ts';

describe('warnSkippedParserSymbol', () => {
	afterEach(() => vi.restoreAllMocks());

	it('skips a kind with no parser symbol silently: the phantom-kind ratchet counts those', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		warnSkippedParserSymbol('_layout', 'wrap', 'skip-missing-parser-symbol');
		warnSkippedParserSymbol('comment', 'factory', 'skip-missing-parser-symbol');
		expect(warn).not.toHaveBeenCalled();
	});

	it('still names a kind skipped because the grammar inlines it', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		warnSkippedParserSymbol('_expression', 'wrap', 'skip-inline-kind');
		expect(warn).toHaveBeenCalledOnce();
	});
});
