import { describe, expect, it } from 'vitest';
import { computeUncoveredContentCensus } from '../../src/validate/uncovered-content.ts';

describe('uncovered-content census', () => {
	it('finds a format spec whose text only an unnamed pattern token holds', async () => {
		const census = await computeUncoveredContentCensus('python');
		const row = census.rows.find(({ kind }) => kind === 'format_specifier');
		expect(row?.texts.map(({ text }) => text)).toContain('#06x');
		expect(row?.producers).toEqual([expect.stringMatching(/^unnamed immediate_token .*\[\^\{\}\\\\n\]\+/)]);
	});

	it('names the hidden external that holds a block comment body', async () => {
		const census = await computeUncoveredContentCensus('rust');
		expect(census.rows.find(({ kind }) => kind === 'block_comment')?.producers).toEqual(['external _block_comment_content']);
	});

	it('finds nothing in a grammar whose every byte sits in a visible node', async () => {
		const census = await computeUncoveredContentCensus('typescript');
		expect(census.rows).toEqual([]);
	});
});
