import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import rust from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(rust, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(rust, { nodeStorage: 'object' }))
};

describe.each(Object.keys(engines) as (keyof typeof engines)[])('a macro_rules token repetition built from nothing (%s storage)', (storage) => {
	const engine = engines[storage];
	const { build } = engine;
	const rendered = (node: object): string => engine.render(node as never).toString();

	it('holds a semicolon to the token before it, and its operator to the closing paren', () => {
		expect(rendered(build.tokenRepetition({ tokens: [build.metavariable('x'), engine.kinds.Semi], operator: '*' }))).toBe('$($x;)*');
	});

	it('spaces two tokens that are words', () => {
		expect(rendered(build.tokenRepetition({ tokens: [build.metavariable('a'), build.metavariable('b')], operator: '+' }))).toBe('$($a $b)+');
	});

	it('holds a pattern repetition operator to the closing paren', () => {
		expect(rendered(build.tokenRepetitionPattern({ tokenPatterns: [build.tokenBindingPattern({ name: build.metavariable('y'), fragment: 'expr' })], operator: '*' }))).toBe('$($y:expr)*');
	});

	it('spaces two bindings of a pattern repetition', () => {
		expect(
			rendered(
				build.tokenRepetitionPattern({
					tokenPatterns: [build.tokenBindingPattern({ name: build.metavariable('a'), fragment: 'expr' }), build.tokenBindingPattern({ name: build.metavariable('b'), fragment: 'ident' })],
					operator: '?'
				})
			)
		).toBe('$($a:expr $b:ident)?');
	});
});
