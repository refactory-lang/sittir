import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';

const rust = await createEngine(await languageByName('rust'));
const python = await createEngine(await languageByName('python'));

const rustParameters = () => {
	const fn = rust.parse('fn process(input: &str, b: u8) {}\n').statements()[0]!;
	if (!rust.is.functionItem(fn)) throw new Error('expected a function item');
	return fn.parameters().parametersElements()!.elements();
};

describe('a loose builder takes every argument its strict builder takes', () => {
	it('rust: parameters spreads its elements into the list it wraps', () => {
		const [a, b] = rustParameters();
		expect(rust.render(rust.build.parameters(a!, b!)).toString()).toBe('(input: &str, b: u8)');
	});

	it('rust: a built element mixes with parsed ones', () => {
		const [a] = rustParameters();
		const built = rust.build.parameter({ name: 'verbose', type: 'bool' });
		expect(rust.render(rust.build.parameters(a!, built)).toString()).toBe('(input: &str, verbose: bool)');
	});

	it('python: parameters spreads its elements into the list it wraps', () => {
		const fn = python.parse('def f(a, b):\n    pass\n').statements()[0]!;
		if (!python.is.functionDefinition(fn)) throw new Error('expected a function definition');
		const [a, b] = fn.parameters().elements()!.parameters();
		expect(python.render(python.build.parameters(a!, b!)).toString()).toBe('(a, b)');
	});

	it('rust: an untagged bag mixed with parsed elements throws what the bag alone throws', () => {
		const [a] = rustParameters();
		const bag = { name: 'verbose', type: 'bool' };
		const alone = (() => {
			try {
				rust.build.parameters(bag as never);
			} catch (error) {
				return (error as Error).message;
			}
			return undefined;
		})();
		expect(alone).toBeDefined();
		expect(() => (rust.build.parameters as (...args: unknown[]) => unknown)(a, bag)).toThrow(alone!);
	});

	it.fails('rust: a kind-tagged bag mixed with parsed elements builds its element', () => {
		const [a, b] = rustParameters();
		const tagged = { kind: rust.kinds.Parameter, name: 'verbose', type: 'bool' };
		const built = (rust.build.parameters as (...args: unknown[]) => Parameters<typeof rust.render>[0])(a, b, tagged);
		expect(rust.render(built).toString()).toBe('(input: &str, b: u8, verbose: bool)');
	});
});

describe('a hoisted builder refuses more arguments than it takes', () => {
	it('rust: an overlay-wrapped builder takes its full arity and refuses one more', () => {
		const x = rust.build.identifier('x');
		expect(rust.render(rust.build.expressionStatement(x)).toString()).toBe('x;');
		const call = rust.build.expressionStatement as (...args: unknown[]) => unknown;
		expect(() => call(x, {})).toThrow('expressionStatement: takes at most 1 argument, got 2');
		expect(() => call(x, undefined)).toThrow('expressionStatement: takes at most 1 argument, got 2');
	});
});
