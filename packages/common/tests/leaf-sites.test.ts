import { describe, expect, it } from 'vitest';
import { leafSitesOf, moveLeafSite, placeLeaf } from '../src/built-ref.ts';

describe('leaf placement sites', () => {
	it('drops dead holders during placement', () => {
		const leaf = {};
		placeLeaf(leaf, 1, 2, 0);
		placeLeaf(leaf, 2, 3, 0, (holder) => holder !== 1);
		expect(leafSitesOf(leaf)).toEqual([2, 3, 0]);
	});

	it('keeps the visible prefixes of spread copies independent', () => {
		const leaf = {};
		placeLeaf(leaf, 1, 2, 0);
		placeLeaf(leaf, 2, 3, 0);
		const copy = { ...leaf };
		const before = leafSitesOf(leaf);
		placeLeaf(leaf, 3, 4, 0);
		placeLeaf(copy, 4, 5, 0);
		expect(before).toEqual([1, 2, 0, 2, 3, 0]);
		expect(leafSitesOf(leaf)).toEqual([1, 2, 0, 2, 3, 0, 3, 4, 0]);
		expect(leafSitesOf(copy)).toEqual([1, 2, 0, 2, 3, 0, 4, 5, 0]);
		moveLeafSite(copy, 2, 7, 3, 0);
		expect(leafSitesOf(leaf)).toEqual([1, 2, 0, 2, 3, 0, 3, 4, 0]);
		expect(leafSitesOf(copy)).toEqual([1, 2, 0, 7, 3, 0, 4, 5, 0]);
	});

	it('prunes all dead sites before a side write', () => {
		const leaf = {};
		placeLeaf(leaf, 1, 2, 0);
		placeLeaf(leaf, 2, 3, 0);
		expect(leafSitesOf(leaf, () => false)).toBeUndefined();
		expect(leafSitesOf(leaf)).toBeUndefined();
	});

	it('filters only the visible prefix of a spread copy', () => {
		const leaf = {};
		placeLeaf(leaf, 1, 2, 0);
		placeLeaf(leaf, 2, 3, 0);
		const copy = { ...leaf };
		placeLeaf(leaf, 3, 4, 0);
		expect(leafSitesOf(copy, () => true)).toEqual([1, 2, 0, 2, 3, 0]);
		expect(leafSitesOf(leaf, () => true)).toEqual([1, 2, 0, 2, 3, 0, 3, 4, 0]);
	});
});
