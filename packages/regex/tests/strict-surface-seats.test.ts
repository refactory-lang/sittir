import { describe, expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

const re = await createEngine(regex);
const checked = await createEngine(regex, { verifyStructure: 'runtime' });

describe('a seated forwarded group is reached through its parent mount', () => {
	it('builds a count quantifier range through the group mount', () => {
		const built = re.build.countQuantifier.arm.countQuantifierGroup.strict({
			content: [{ decimalDigits: re.build.decimalDigits('2'), countQuantifierGroup: re.build.decimalDigits('3') }]
		});
		expect(built.$render()).toBe('{2,3}');
	});

	it('builds a unicode property value through the group mount', () => {
		const built = re.build.unicodePropertyValueExpression.unicodePropertyValueExpressionGroup.strict({
			unicodePropertyValue: re.build.unicodePropertyValue('Greek'),
			unicodePropertyValueExpressionGroup: re.build.unicodePropertyValue('Script')
		});
		expect(built.$render()).toBe('Script=Greek');
	});
});

describe('a strict arm takes its group as a built node', () => {
	const digits = (engine: typeof re) => engine.build.decimalDigits('2');

	it('refuses a string, a config and a bare leaf at compile time', () => {
		const refuse = () => [
			// @ts-expect-error a strict slot takes a built group, not text
			re.build.countQuantifier.arm.strict({ decimalDigits: digits(re), countQuantifierGroup: '3' }),
			// @ts-expect-error a strict slot takes a built group, not a config
			re.build.countQuantifier.arm.strict({ decimalDigits: digits(re), countQuantifierGroup: { decimalDigits: digits(re) } }),
			// @ts-expect-error a strict slot takes a built group, not its content
			re.build.countQuantifier.arm.strict({ decimalDigits: digits(re), countQuantifierGroup: digits(re) })
		];
		expect(refuse).toBeDefined();
	});

	it('refuses a string and a config at the writer of a checked engine', () => {
		const build = (group: unknown) => () =>
			checked.build.countQuantifier.arm.strict({ decimalDigits: digits(checked), countQuantifierGroup: group as never });
		expect(build('3')).toThrow('a strict factory takes a built node');
		expect(build({ decimalDigits: digits(checked) })).toThrow('a strict factory takes a built node');
	});

	it('refuses a built node of another kind at the writer of a checked engine', () => {
		const build = () =>
			checked.build.countQuantifier.arm.strict({
				decimalDigits: digits(checked),
				countQuantifierGroup: digits(checked) as never
			});
		expect(build).toThrow('CountQuantifierArm.countQuantifierGroup: a strict factory takes a built CountQuantifierGroup, not a node of kind');
	});
});
