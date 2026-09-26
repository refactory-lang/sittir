import { describe, expect, it } from 'vitest';
import { dedupeMismatchesByContainment, loadCorpusEntries, parseCorpus } from '../common.ts';

describe('dedupeMismatchesByContainment', () => {
	it('drops an ancestor mismatch whose span strictly contains a descendant mismatch in the same entry', () => {
		const outer = { entry: 'e1', start: 0, end: 20, kind: 'tuple_expression' };
		const inner = { entry: 'e1', start: 4, end: 10, kind: 'expression' };
		expect(dedupeMismatchesByContainment([outer, inner])).toEqual([inner]);
	});

	it('keeps both mismatches when spans are disjoint', () => {
		const a = { entry: 'e1', start: 0, end: 5, kind: 'a' };
		const b = { entry: 'e1', start: 6, end: 10, kind: 'b' };
		expect(dedupeMismatchesByContainment([a, b])).toEqual([a, b]);
	});

	it('keeps both mismatches when spans are equal (not a strict-containment relationship)', () => {
		const a = { entry: 'e1', start: 0, end: 10, kind: 'a' };
		const b = { entry: 'e1', start: 0, end: 10, kind: 'b' };
		expect(dedupeMismatchesByContainment([a, b])).toEqual([a, b]);
	});

	it('keeps identical spans across different entries — containment is scoped per entry', () => {
		const a = { entry: 'e1', start: 0, end: 20, kind: 'a' };
		const b = { entry: 'e2', start: 4, end: 10, kind: 'b' };
		expect(dedupeMismatchesByContainment([a, b])).toEqual([a, b]);
	});

	it('collapses a three-level ancestor chain to only the innermost mismatch', () => {
		const grandparent = { entry: 'e1', start: 0, end: 30, kind: 'program' };
		const parent = { entry: 'e1', start: 2, end: 20, kind: 'statement' };
		const child = { entry: 'e1', start: 4, end: 10, kind: 'expression' };
		expect(dedupeMismatchesByContainment([grandparent, parent, child])).toEqual([child]);
	});
});

describe('parseCorpus', () => {
	const corpus = (...tests: string[]) => tests.join('\n');

	it('slices the input from the header end to the divider, minus one trailing newline', () => {
		const entries = parseCorpus(
			corpus('==========', 'Shebang', '==========', '', '#!/usr/bin/env x', '', '---', '', '(source_file)', '')
		);
		expect(entries).toEqual([{ name: 'Shebang', source: '\n#!/usr/bin/env x\n' }]);
	});

	it('keeps only headers and dividers whose suffix matches the first header', () => {
		const text = corpus(
			'===|||',
			'Suffixed',
			'===|||',
			'a',
			'----',
			'b',
			'---|||',
			'(x)',
			'===|||',
			'Second',
			'===|||',
			'c',
			'---|||',
			'(y)',
			''
		);
		expect(parseCorpus(text)).toEqual([
			{ name: 'Suffixed', source: 'a\n----\nb' },
			{ name: 'Second', source: 'c' }
		]);
	});

	it('splits at the longest matching divider, the last one on ties', () => {
		const text = corpus('===', 'Dividers', '===', 'a', '---', 'b', '-----', 'c', '-----', '(x)', '');
		expect(parseCorpus(text)).toEqual([{ name: 'Dividers', source: 'a\n---\nb\n-----\nc' }]);
	});

	it('measures a divider by its hyphens, not its line ending', () => {
		const text = '===\nCRLF\n===\na\n----\nb\n---\r\n(x)\n';
		expect(parseCorpus(text)).toEqual([{ name: 'CRLF', source: 'a' }]);
	});

	it('skips :error entries and entries whose expected tree has ERROR or MISSING', () => {
		const text = corpus(
			'===',
			'Marked',
			':error',
			'===',
			'a',
			'---',
			'',
			'===',
			'Errored',
			'===',
			'b',
			'---',
			'(ERROR)',
			'===',
			'Missing',
			'===',
			'c',
			'---',
			'(x (MISSING y))',
			'===',
			'Kept',
			'===',
			'd',
			'---',
			'(x)',
			''
		);
		expect(parseCorpus(text).map((e) => e.name)).toEqual(['Kept']);
	});

	it('keeps an entry declared for another language only when no grammar filter is given', () => {
		const text = corpus('===', 'Other', ':language(python)', '===', 'a', '---', '(x)', '');
		expect(parseCorpus(text, 'rust')).toEqual([]);
		expect(parseCorpus(text, 'python').map((e) => e.name)).toEqual(['Other']);
		expect(parseCorpus(text).map((e) => e.name)).toEqual(['Other']);
	});

	it('skips a blank input', () => {
		expect(parseCorpus(corpus('===', 'Blank', '===', '', '---', '(x)', ''))).toEqual([]);
	});
});

describe('loadCorpusEntries', () => {
	it('throws, naming the fetch command, for a grammar with no corpus', () => {
		expect(() => loadCorpusEntries('no-such-grammar')).toThrow(/tool fetch-corpus --grammar no-such-grammar/);
	});
});
