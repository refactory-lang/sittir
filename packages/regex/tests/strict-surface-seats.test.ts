import { describe, expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

const reStrict = await createEngine(regex, { api: 'strict' });
const checkedStrict = await createEngine(regex, { verifyStructure: 'runtime', api: 'strict' });

describe('a seated forwarded group is reached through its parent mount', () => {
	it('builds a count quantifier range through the group mount', () => {
		const built = reStrict.build.countQuantifier.arm.countQuantifierGroup({
			content: [{ decimalDigits: reStrict.build.decimalDigits('2'), countQuantifierGroup: reStrict.build.decimalDigits('3') }]
		});
		expect(built.$render()).toBe('{2,3}');
	});

	it('builds a unicode property value through the group mount', () => {
		const built = reStrict.build.unicodePropertyValueExpression.unicodePropertyValueExpressionGroup({
			unicodePropertyValue: reStrict.build.unicodePropertyValue('Greek'),
			unicodePropertyValueExpressionGroup: reStrict.build.unicodePropertyName('Script')
		});
		expect(built.$render()).toBe('Script=Greek');
	});
});

describe('a strict arm takes its group as a built node', () => {
	it('refuses a string, a config and a bare leaf at compile time', () => {
		const refuse = () => [
			// @ts-expect-error a strict slot takes a built group, not text
			reStrict.build.countQuantifier.arm({ decimalDigits: reStrict.build.decimalDigits('2'), countQuantifierGroup: '3' }),
			// @ts-expect-error a strict slot takes a built group, not a config
			reStrict.build.countQuantifier.arm({ decimalDigits: reStrict.build.decimalDigits('2'), countQuantifierGroup: { decimalDigits: reStrict.build.decimalDigits('2') } }),
			// @ts-expect-error a strict slot takes a built group, not its content
			reStrict.build.countQuantifier.arm({ decimalDigits: reStrict.build.decimalDigits('2'), countQuantifierGroup: reStrict.build.decimalDigits('2') })
		];
		expect(refuse).toBeDefined();
	});

	it('refuses a string and a config at the writer of a checked engine', () => {
		const build = (group: unknown) => () =>
			checkedStrict.build.countQuantifier.arm({ decimalDigits: checkedStrict.build.decimalDigits('2'), countQuantifierGroup: group as never });
		expect(build('3')).toThrow('a strict factory takes a built node');
		expect(build({ decimalDigits: checkedStrict.build.decimalDigits('2') })).toThrow('a strict factory takes a built node');
	});

	it('refuses a built node of another kind at the writer of a checked engine', () => {
		const build = () =>
			checkedStrict.build.countQuantifier.arm({
				decimalDigits: checkedStrict.build.decimalDigits('2'),
				countQuantifierGroup: checkedStrict.build.decimalDigits('2') as never
			});
		expect(build).toThrow('CountQuantifierArm.countQuantifierGroup: a strict factory takes a built CountQuantifierGroup, not a node of kind');
	});
});
