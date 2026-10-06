import { describe, expect, it } from 'vitest';
import { emptySlotKey, LISTED_EMPTY_SLOTS, staleListedRows } from '../validate/typed-read-parity.ts';

describe('typed-read-parity listed empty-slot rows', () => {
	it('a listed row the corpus no longer shows is stale', () => {
		const listed = [emptySlotKey('Or patterns', 'DelimTokenTreeParenTransport', 'delim_tokens'), emptySlotKey('Attribute macros', 'DelimTokenTreeParenTransport', 'delim_tokens')];
		const observed = [{ entry: 'Or patterns', kind: 'DelimTokenTreeParenTransport', slot: 'delim_tokens' }];
		expect(staleListedRows(listed, observed)).toEqual([listed[1]]);
	});

	it('every listed row seen leaves none stale, and a row seen twice counts once', () => {
		const row = { entry: 'Or patterns', kind: 'DelimTokenTreeParenTransport', slot: 'delim_tokens' };
		expect(staleListedRows([emptySlotKey(row.entry, row.kind, row.slot)], [row, row])).toEqual([]);
	});

	it('lists no row twice', () => {
		for (const rows of Object.values(LISTED_EMPTY_SLOTS)) expect(new Set(rows).size).toBe(rows.length);
	});
});
