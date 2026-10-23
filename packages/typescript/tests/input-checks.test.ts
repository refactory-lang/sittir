import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const trusting = await createEngine(typescript);
const verifying = await createEngine(typescript, { verifyStructure: 'runtime' });

type Loose = (input: unknown) => { $render(): string };
type Strict = (...input: unknown[]) => { $render(): string };
const switchCase = (engine: typeof trusting) => engine.build.switchCase.strict as unknown as Loose;
const coerceSwitchCase = (engine: typeof trusting) => engine.build.switchCase.coerce as unknown as Loose;
const coerceSwitchBody = (engine: typeof trusting) => engine.build.switchBody.coerce as unknown as Loose;
const block = (engine: typeof trusting) => engine.build.statementBlock as unknown as Strict;
const array = (engine: typeof trusting) => engine.build.array as unknown as Strict;

describe("verifyStructure: 'runtime' refuses what a builder was not given a place for", () => {
	it('refuses a config key the kind does not declare, at the call', () => {
		const value = verifying.build.identifier('a');
		expect(() => switchCase(verifying)({ value, body: [] })).toThrow("switch_case: undeclared config key 'body'");
		expect(() => coerceSwitchCase(verifying)({ value, body: [] })).toThrow("switch_case: undeclared config key 'body'");
	});

	it('refuses an undeclared key in a config nested in a parent', () => {
		const value = verifying.build.identifier('a');
		expect(() => coerceSwitchBody(verifying)([{ $type: verifying.kinds.SwitchCase, value, body: [] }])).toThrow(
			"switch_case: undeclared config key 'body'"
		);
	});

	it('refuses an absent item in a list the builder takes as rest arguments', () => {
		const statement = verifying.build.expressionStatement.strict(verifying.build.identifier('a'));
		expect(() => block(verifying)(statement, null)).toThrow('statement_block.statements: absent item at index 1');
		expect(() => block(verifying)(undefined)).toThrow('statement_block.statements: absent item at index 0');
	});

	it('refuses an absent item in a list held by a config key', () => {
		const value = verifying.build.identifier('a');
		expect(() => switchCase(verifying)({ value, bodies: [null] })).toThrow('switch_case.bodies: absent item at index 0');
	});

	it('refuses an absent item behind a leading options argument', () => {
		const statement = verifying.build.expressionStatement.strict(verifying.build.identifier('a'));
		const coerceBlock = verifying.build.statementBlock.coerce as unknown as Strict;
		expect(() => coerceBlock({}, [statement, null])).toThrow('statement_block.statements: absent item at index 1');
		expect(() => coerceBlock({}, { statements: [statement, null] })).toThrow('statement_block.statements: absent item at index 1');
	});

	it('refuses an undeclared key through a refine form', () => {
		const curly = verifying.build.objectType.curly.strict as unknown as Loose;
		expect(() => curly({ stray: 1 })).toThrow("object_type: undeclared config key 'stray'");
	});

	it('accepts the declared key and a list of built items', () => {
		const value = verifying.build.identifier('a');
		expect(switchCase(verifying)({ value, bodies: [] }).$render()).toBe('case a:');
	});

	it('accepts an absent item in a list that holds holes', () => {
		const a = verifying.build.identifier('a');
		expect(array(verifying)(a, undefined, a).$render()).toBe('[a,, a]');
	});
});

describe("verifyStructure: 'compileTimeOnly' stays silent on the same input", () => {
	it('builds past an undeclared key and an absent item', () => {
		const value = trusting.build.identifier('a');
		expect(coerceSwitchCase(trusting)({ value, body: [] }).$render()).toBe('case a:');
		expect(switchCase(trusting)({ value, bodies: [null] }).$render()).toBe('case a:');
		expect(coerceSwitchBody(trusting)([{ $type: trusting.kinds.SwitchCase, value, body: [] }]).$render()).toBe('{\n  case a:\n}');
	});
});
