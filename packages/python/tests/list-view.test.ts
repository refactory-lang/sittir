import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

const dictionaryOf = (source: string) => {
	const statement = py.parse(source).statements()[0] as any;
	const dictionary = statement.elements()[0].content();
	expect(dictionary.$type).toBe(py.kinds.Dictionary);
	return dictionary;
};

describe('a dictionary reads as a ReadonlyArray of its entries', () => {
	it('reads its list slot as elements, leaving entries() to the array method', () => {
		const dictionary = dictionaryOf('{a: 1, b: 2}\n');
		expect(dictionary.elements().length).toBe(2);
		expect([...dictionary.entries()].map(([index]: [number, unknown]) => index)).toEqual([0, 1]);
		expect(dictionary.map((pair: { $render(): string }) => pair.$render())).toEqual(['a: 1', 'b: 2']);
	});

	it('takes its entries back through the builder arguments', () => {
		const dictionary = dictionaryOf('{a: 1, b: 2}\n');
		const [first, second] = dictionary;
		expect(dictionary.$with.elements(second, first).$render()).toBe('{b: 2, a: 1}');
	});
});
