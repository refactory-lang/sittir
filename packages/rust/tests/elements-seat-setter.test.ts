import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);
const { kinds } = rs;

const parametersOf = (source: string) => {
	const item = rs.parse(source).statements()[0]!;
	if (!rs.is.functionItem(item)) throw new Error('not a function');
	return item.parameters();
};

const attributedConfig = () => {
	const donor = parametersOf('fn f(#[x] a: i32, b: i32) {}\n').elements();
	if (donor === undefined || !rs.is.parametersElements(donor)) throw new Error('not an ordinary list');
	const attributed = donor[0]!;
	if (typeof attributed === 'number' || attributed.$type !== kinds.AttributedParameter) throw new Error('not attributed');
	return { attributeItem: attributed.attributeItem(), content: attributed.content() };
};

describe('a list owner takes the element config objects its config surface takes', () => {
	it('builds an element from a config object through $with', () => {
		const target = parametersOf('fn g(c: i32) {}\n');
		expect(target.$with.elements(rs.build.parametersElements(attributedConfig())).$render()).toBe('(#[x] a: i32)');
	});

	it('mixes built nodes and config objects, and reads the items back as nodes', () => {
		const target = parametersOf('fn g(c: i32) {}\n');
		const list = target.elements();
		if (list === undefined || !rs.is.parametersElements(list)) throw new Error('not an ordinary list');
		const [first] = list;
		const rebuilt = target.$with.elements(rs.build.parametersElements(first!, attributedConfig()));
		expect(rebuilt.$render()).toBe('(c: i32, #[x] a: i32)');
		expect(rebuilt.elements()).toHaveLength(2);
	});
});
