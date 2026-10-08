import { describe, expect, it } from 'vitest';
import { createGapMeter, lossyShapeOf } from '../src/validate/gap-census.ts';

describe('lossyShapeOf', () => {
	const shape = (source: [string, string], rendered: [string, string]) =>
		lossyShapeOf({ lead: source[0], trail: source[1] }, { lead: rendered[0], trail: rendered[1] });

	it('names the group of the source side that changed', () => {
		expect(shape(['', '  '], ['', ' '])).toBe('multi-space');
		expect(shape(['', '\t'], ['', ' '])).toBe('tabs');
		expect(shape(['', '\r\n'], ['', '\n'])).toBe('crlf');
		expect(shape([' \n', ''], ['\n', ''])).toBe('trailing-before-break');
		expect(shape(['\n\n\n\n', ''], ['\n\n\n', ''])).toBe('wide-break-run');
		expect(shape(['', '\n'], ['', ' '])).toBe('break-lost');
		expect(shape(['', ''], ['', ' '])).toBe('tight-lost');
		expect(shape(['\n    ', ''], ['\n  ', ''])).toBe('indent-after-break');
	});
});

describe('gap census on a real grammar', () => {
	it('measures a rebuilt list against the gaps its source spelled', async () => {
		const meter = await createGapMeter('typescript');
		const measure = meter('probe', 'f(a ,  b,\tc);\n');
		expect(measure.status).toBe('measured');
		expect(measure.gaps).toBe(2);
		expect(measure.lossy.map((row) => [row.shape, row.source, row.rendered])).toEqual([
			['multi-space', { lead: ' ', trail: '  ' }, { lead: ' ', trail: ' ' }],
			['tabs', { lead: '', trail: '\t' }, { lead: '', trail: ' ' }]
		]);
	}, 120_000);

	it('keeps a gap that holds a comment out of the list gaps', async () => {
		const meter = await createGapMeter('typescript');
		const measure = meter('probe', 'f(a /* c */, b);\n');
		expect(measure.commented).toBe(1);
		expect(measure.gaps).toBe(0);
	}, 120_000);
});
