import { describe, expect, it } from 'vitest';
import { printRecordLines } from '../record-lines.ts';

describe('printRecordLines', () => {
	it('prints each element of an array on its own line', () => {
		expect(printRecordLines([{ b: 1, a: [2, 3] }, { c: 'x' }])).toBe('[\n\t{"b":1,"a":[2,3]},\n\t{"c":"x"}\n]\n');
	});

	it('prints an empty array on one line', () => {
		expect(printRecordLines([])).toBe('[]\n');
	});

	it('opens every section holding an array, one key per line, and keeps its key order', () => {
		expect(printRecordLines({ hash: 'h', rows: [{ a: 1 }], bound: { hash: 'g', rows: [{ b: 2 }, { b: 3 }] } })).toBe(
			'{\n\t"hash": "h",\n\t"rows": [\n\t\t{"a":1}\n\t],\n\t"bound": {\n\t\t"hash": "g",\n\t\t"rows": [\n\t\t\t{"b":2},\n\t\t\t{"b":3}\n\t\t]\n\t}\n}\n'
		);
	});

	it('prints a map one entry per line, sorted by key', () => {
		expect(printRecordLines({ name: 'g', variants: { zeta: { to: 'z' }, alpha: { to: 'a' } } })).toBe(
			'{\n\t"name": "g",\n\t"variants": {\n\t\t"alpha": {"to":"a"},\n\t\t"zeta": {"to":"z"}\n\t}\n}\n'
		);
	});

	it('reads back as the value it printed', () => {
		const value = { name: 'g', root: null, nodes: [{ kind: 'a' }, { kind: 'b', slots: [] }], maps: { y: { k: [1] }, x: {} } };
		expect(JSON.parse(printRecordLines(value))).toEqual(value);
	});
});
