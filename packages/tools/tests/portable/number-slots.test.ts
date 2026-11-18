import { resolveRoutes } from '@sittir/codegen/bindings';
import { describe, expect, it } from 'vitest';
import { loadInputs } from '../../src/inventory/index.ts';

interface Classes {
	readonly options: readonly string[];
	readonly value: readonly string[];
	readonly slots: readonly string[];
}

const classesOf = async (grammar: 'python' | 'rust' | 'typescript'): Promise<Readonly<Record<string, Classes>>> => {
	const [input] = await loadInputs([grammar]);
	const { vocabulary, model } = input!;
	const scalarValued = (path: string): boolean => vocabulary.kinds.has(path) && vocabulary.slots(path).get('$value')?.scalar !== undefined;
	const kinds = [...resolveRoutes(input!).vocabOf].filter(([, path]) => scalarValued(path)).map(([kind]) => kind);
	return Object.fromEntries(
		kinds.sort().flatMap((kind) => {
			const slots = model.get(kind)?.slots ?? [];
			const named = (test: (slot: (typeof slots)[number]) => boolean): readonly string[] => slots.filter(test).map((slot) => slot.name);
			return slots.length === 0
				? []
				: [[kind, { options: named((slot) => slot.registered === true), value: named((slot) => slot.valueSource === true), slots: named((slot) => slot.registered !== true && slot.valueSource !== true) }]];
		})
	);
};

const LOADS = 120_000;

const integer = (options: readonly string[], slots: readonly string[] = []): Classes => ({ options, value: ['content'], slots });

describe('the slots of a kind on a scalar path, from the model', () => {
	it('python: options are the radix prefix and the markers, the value is written from the digits, sign and exponent, and imaginary is a slot of its own', async () => {
		const float = (value: readonly string[]): Classes => ({ options: ['marker'], value, slots: ['imaginary'] });
		expect(await classesOf('python')).toEqual({
			float_leading_point: float(['integer', 'fraction', 'exponent_sign', 'exponent']),
			float_point: float(['integer', 'fraction', 'exponent_sign', 'exponent']),
			float_scientific: float(['integer', 'exponent_sign', 'exponent']),
			integer_binary_long: integer(['radix_prefix', 'marker']),
			integer_binary_plain: integer(['radix_prefix']),
			integer_decimal_long: integer(['marker']),
			integer_hex_long: integer(['radix_prefix', 'marker']),
			integer_hex_plain: integer(['radix_prefix']),
			integer_legacy_octal_long: integer(['marker']),
			integer_legacy_octal_plain: integer([]),
			integer_octal_long: integer(['radix_prefix', 'marker']),
			integer_octal_plain: integer(['radix_prefix'])
		});
	}, LOADS);

	it('rust: no option, the value is written from the digits, and suffix is a slot of its own', async () => {
		expect(await classesOf('rust')).toEqual({
			integer_literal_binary: integer([], ['suffix']),
			integer_literal_decimal: integer([], ['suffix']),
			integer_literal_hex: integer([], ['suffix']),
			integer_literal_octal: integer([], ['suffix'])
		});
	}, LOADS);

	it('typescript: options are the radix prefix and the exponent marker, and the value is written from the digits, sign and exponent', async () => {
		const float = (value: readonly string[]): Classes => ({ options: ['marker'], value, slots: [] });
		expect(await classesOf('typescript')).toEqual({
			number_bigint_binary: integer([]),
			number_bigint_decimal: integer([]),
			number_bigint_hex: integer([]),
			number_bigint_octal: integer([]),
			number_binary: integer(['radix_prefix']),
			number_float_leading_point: float(['fraction', 'exponent_sign', 'exponent']),
			number_float_point: float(['integer', 'fraction', 'exponent_sign', 'exponent']),
			number_float_scientific: float(['integer', 'exponent_sign', 'exponent']),
			number_hex: integer(['radix_prefix']),
			number_legacy_octal: integer([]),
			number_octal: integer(['radix_prefix'])
		});
	}, LOADS);
});
