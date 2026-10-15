import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';

const rust = await createEngine(await languageByName('rust'));
const python = await createEngine(await languageByName('python'));

const rustParameters = () => {
	const fn = rust.parse('fn process(input: &str, b: u8) {}\n').statements()[0]!;
	if (!rust.is.functionItem(fn)) throw new Error('expected a function item');
	const list = fn.parameters().elements();
	if (list === undefined || !rust.is.parametersElements(list)) throw new Error('not an ordinary list');
	return list.items();
};

describe('a loose builder takes every argument its strict builder takes', () => {
	it('rust: parameters spreads its elements into the list it wraps', () => {
		const [a, b] = rustParameters();
		expect(rust.render(rust.build.parameters(rust.build.parametersElements(a!, b!))).toString()).toBe('(input: &str, b: u8)');
	});

	it('rust: a built element mixes with parsed ones', () => {
		const [a] = rustParameters();
		const built = rust.build.parameter({ name: 'verbose', type: 'bool' });
		expect(rust.render(rust.build.parameters(rust.build.parametersElements(a!, built))).toString()).toBe('(input: &str, verbose: bool)');
	});

	it('python: parameters spreads its elements into the list it wraps', () => {
		const fn = python.parse('def f(a, b):\n    pass\n').statements()[0]!;
		if (!python.is.functionDefinition(fn)) throw new Error('expected a function definition');
		const [a, b] = fn.parameters().elements()!.items();
		expect(python.render(python.build.parameters(a!, b!)).toString()).toBe('(a, b)');
	});

	it('rust: an untagged bag mixed with parsed elements throws what the bag alone throws', () => {
		const [a] = rustParameters();
		const bag = { name: 'verbose', type: 'bool' };
		const alone = (() => {
			try {
				rust.build.parametersElements(bag as never);
			} catch (error) {
				return (error as Error).message;
			}
			return undefined;
		})();
		expect(alone).toBeDefined();
		expect(() => rust.build.parametersElements(a!, bag)).toThrow(alone!);
	});

	it('rust: a kind-tagged bag mixed with parsed elements builds its element', () => {
		const [a, b] = rustParameters();
		const tagged = { $type: rust.kinds.Parameter, name: 'verbose', type: 'bool' } as const;
		const built = rust.build.parameters(rust.build.parametersElements(a!, b!, tagged));
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

	it('rust: a nested sub-factory route takes its full arity and refuses one more', () => {
		const x = rust.build.identifier('x');
		expect(rust.render(rust.build.expressionStatement.withSemi(x)).toString()).toBe('x;');
		const call = rust.build.expressionStatement.withSemi as (...args: unknown[]) => unknown;
		expect(() => call(x, {})).toThrow('expressionStatement.withSemi: takes at most 1 argument, got 2');
	});

	it('rust: a flattened-variant route takes its full arity and refuses one more', () => {
		expect(rust.render(rust.build.charLiteral.plain('a')).toString()).toBe("'a'");
		const call = rust.build.charLiteral.plain as (...args: unknown[]) => unknown;
		expect(() => call('a', {})).toThrow('charLiteralPlain: takes at most 1 argument, got 2');
	});
});
