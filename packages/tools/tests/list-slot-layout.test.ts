import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';

const rs = await createEngine(rust);
const ts = await createEngine(typescript);

/** The array a rust `let` statement binds, in the source's statement `at`. */
function rustArray(source: string, at = 0) {
	const item = rs.parse(source).statements()[at];
	if (item === undefined || !rs.is.letDeclaration(item)) throw new Error('expected a let declaration');
	const value = item.value();
	if (value === undefined || !rs.is.arrayExpressionList(value)) throw new Error('expected an array');
	return value;
}

/** The items of a rust array. */
function elementsOf(array: ReturnType<typeof rustArray>) {
	return array.elements()?.items() ?? [];
}

/** The object type a typescript type alias names, in the source's statement `at`. */
function objectType(source: string, at = 0) {
	const statement = ts.parse(source).statements()[at];
	if (statement === undefined || typeof statement === 'number' || !ts.is.typeAliasDeclaration(statement)) throw new Error('expected a type alias');
	const value = statement.value();
	if (!ts.is.objectType(value)) throw new Error('expected an object type');
	return value;
}

/** The members of a typescript object type. */
function membersOf(type: ReturnType<typeof objectType>) {
	return type.members()?.items() ?? [];
}

/** The item at `index`, which the test's source holds. */
function at<T>(items: readonly T[], index: number): T {
	const item = items[index];
	if (item === undefined) throw new Error(`expected an item at ${index}`);
	return item;
}

const nine = () => rs.build.integerLiteral('9');

describe("a list slot's separator gaps take the class most of them have", () => {
	it.each([
		['let a = [1,2,3];\n', '[1,2,3]', '[1,2,9,3]'],
		['let a = [1, 2, 3];\n', '[1, 2, 3]', '[1, 2, 9, 3]'],
		['let a = [1,\n    2,\n    3];\n', '[1,\n    2,\n    3]', '[1,\n    2,\n    9,\n    3]'],
		['let a = [1\n    , 2\n    , 3];\n', '[1\n    , 2\n    , 3]', '[1\n    , 2\n    , 9\n    , 3]'],
		['let a = [\n    1,\n    2,\n    3,\n];\n', '[\n    1,\n    2,\n    3,\n]', '[\n    1,\n    2,\n    9,\n    3,\n]']
	])('rust %j snapshots to its source, and an item inserted after its second takes the slot class', (source, snapshot, inserted) => {
		const array = rustArray(source);
		const items = elementsOf(array);
		expect(rs.render(array.$snapshot()).toString()).toBe(snapshot);
		expect(array.$with.elements(...items.slice(0, 2), nine(), ...items.slice(2)).$render()).toBe(inserted);
	});

	it('keeps a hand-made break among one-line gaps, and an insert beside it takes the one-line class', () => {
		const array = rustArray('let a = [1, 2, 3,\n    4];\n');
		const items = elementsOf(array);
		expect(rs.render(array.$snapshot()).toString()).toBe('[1, 2, 3,\n    4]');
		expect(array.$with.elements(...items.slice(0, 2), nine(), ...items.slice(2)).$render()).toBe('[1, 2, 9, 3,\n    4]');
	});

	it("breaks a tie that holds the options' class with the options' class, storing nothing for the slot", () => {
		const array = rustArray('let a = [1,2, 3];\n');
		const items = elementsOf(array);
		expect(rs.render(array.$snapshot()).toString()).toBe('[1,2, 3]');
		expect(array.$with.elements(...items, nine()).$render()).toBe('[1,2, 3, 9]');
	});

	it("breaks a tie without the options' class with the first gap's class", () => {
		const array = rustArray('let a = [1,2,\n    3];\n');
		const items = elementsOf(array);
		expect(rs.render(array.$snapshot()).toString()).toBe('[1,2,\n    3]');
		expect(array.$with.elements(at(items, 0), nine(), ...items.slice(1)).$render()).toBe('[1,9,2,\n    3]');
	});

	it("gives an item moved into another list the target's slot class", () => {
		const one = rustArray('let a = [1,2,3];\nlet b = [\n    4,\n    5,\n];\n');
		const other = rustArray('let a = [1,2,3];\nlet b = [\n    4,\n    5,\n];\n', 1);
		const [four, five] = [at(elementsOf(other), 0), at(elementsOf(other), 1)];
		const two = at(elementsOf(one), 1);
		expect(other.$with.elements(four, two, five).$render()).toBe('[\n    4,\n    2,\n    5,\n]');
		expect(one.$with.elements(...elementsOf(one), five).$render()).toBe('[1,2,3,5]');
	});
});

describe("a list slot's separator is the one most of its gaps use", () => {
	const z = () => at(membersOf(objectType('type U = { z: string };\n')), 0);

	it.each([
		['type T = { a: string, b: number };\n', '{ a: string, b: number }', '{ a: string, z: string, b: number }'],
		['type T = { a: string; b: number };\n', '{ a: string; b: number }', '{ a: string; z: string; b: number }']
	])('typescript %j snapshots to its source, and an inserted member takes its separator', (source, snapshot, inserted) => {
		const type = objectType(source);
		const members = membersOf(type);
		const [a, rest] = [at(members, 0), members.slice(1)];
		expect(ts.render(type.$snapshot()).toString()).toBe(snapshot);
		expect(type.$with.members(a, z(), ...rest).$render()).toBe(inserted);
	});

	it('keeps an outlier separator on the member after it', () => {
		const type = objectType('type T = { a: string, b: number; c: boolean, d: null };\n');
		const members = membersOf(type);
		const [a, rest] = [at(members, 0), members.slice(1)];
		expect(ts.render(type.$snapshot()).toString()).toBe('{ a: string, b: number; c: boolean, d: null }');
		expect(type.$with.members(a, z(), ...rest).$render()).toBe('{ a: string, z: string, b: number; c: boolean, d: null }');
	});
});
