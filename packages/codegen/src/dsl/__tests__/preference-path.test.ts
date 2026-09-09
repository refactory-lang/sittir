import { describe, it, expect } from 'vitest';
import {
	parsePreferencePath,
	formatPreferencePath,
	comparePreferencePaths,
	isSideSegment
} from '../primitives/preference-path.ts';

describe('preference paths', () => {
	it('round-trips through parse and format', () => {
		for (const path of [
			'(block)/"{"/after',
			'body/before',
			'(source_file)/statements:/(_)/after',
			'(token_tree_punctuation)/"/="/before'
		]) {
			expect(formatPreferencePath(parsePreferencePath(path))).toBe(path);
		}
	});

	it('orders a prefix before its descendants', () => {
		const parent = parsePreferencePath('(block)/"{"');
		const child = parsePreferencePath('(block)/"{"/after');
		expect(comparePreferencePaths(parent, child)).toBeLessThan(0);
	});

	it('keeps every descendant of a prefix contiguous', () => {
		const paths = ['(block)/"a"', '(block)/"a"/after', '(block)/"a"/before', '(block)/"ab"'].map(
			parsePreferencePath
		);
		const sorted = [...paths].sort(comparePreferencePaths).map(formatPreferencePath);
		expect(sorted).toEqual(['(block)/"a"', '(block)/"a"/before', '(block)/"a"/after', '(block)/"ab"']);
	});

	it('orders sides in render order, not alphabetically', () => {
		const before = parsePreferencePath('(block)/before');
		const after = parsePreferencePath('(block)/after');
		expect(comparePreferencePaths(before, after)).toBeLessThan(0);
	});

	it('sorts a side after a sibling that is not one', () => {
		const side = parsePreferencePath('(block)/after');
		const child = parsePreferencePath('(block)/"{"');
		expect(comparePreferencePaths(child, side)).toBeLessThan(0);
	});

	it('recognises the side segments', () => {
		expect(isSideSegment(parsePreferencePath('before')[0]!)).toBe(true);
		expect(isSideSegment(parsePreferencePath('separator')[0]!)).toBe(true);
		expect(isSideSegment(parsePreferencePath('(block)')[0]!)).toBe(false);
	});
});
