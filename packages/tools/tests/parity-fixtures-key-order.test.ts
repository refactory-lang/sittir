import { describe, expect, it } from 'vitest';
import { serializeFixtures, serializeLeftOut, type ParityFixture } from '../src/validate/parity-fixtures.ts';

describe('a serialized fixture file does not depend on the order its keys were written in', () => {
	it('writes every object of a fixture with its keys sorted', () => {
		const input = { _statements: [{ _name: { $type: 2, $text: 'f' }, $type: 3 }], $type: 1, $errors: [] };
		const reordered = { $errors: [], $type: 1, _statements: [{ $type: 3, _name: { $text: 'f', $type: 2 } }] };
		const fixture = (data: object) => ({ pattern: 'source_file', kind: 'render', input: data, expectedOutput: 'fn f() {}' }) as unknown as ParityFixture;
		expect(serializeFixtures([fixture(input)])).toBe(serializeFixtures([fixture(reordered)]));
		expect(serializeFixtures([fixture(input)])).toContain('"$errors": [],\n      "$type": 1,\n      "_statements"');
	});

	it('writes the left-out counts by kind in sorted order', () => {
		expect(serializeLeftOut({ b: 1, a: 2 })).toBe(serializeLeftOut({ a: 2, b: 1 }));
	});
});
