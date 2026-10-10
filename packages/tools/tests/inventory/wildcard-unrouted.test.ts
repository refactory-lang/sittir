import { describe, expect, it } from 'vitest';
import { derive } from '@sittir/codegen/bindings';
import { loadInputs } from '../../src/inventory/index.ts';

const PATTERNS = [
	'bool_keyword', 'boolean_literal', 'char_keyword', 'char_literal_empty', 'char_literal_escaped_hex', 'char_literal_escaped_simple',
	'char_literal_escaped_unicode_braced', 'char_literal_escaped_unicode_fixed', 'char_literal_plain', 'const_block', 'default_keyword',
	'f32_keyword', 'f64_keyword', 'float_literal', 'gen_keyword', 'i128_keyword', 'i16_keyword', 'i32_keyword', 'i64_keyword', 'i8_keyword',
	'identifier', 'integer_literal_binary', 'integer_literal_decimal', 'integer_literal_hex', 'integer_literal_octal', 'isize_keyword',
	'macro_invocation', 'mut_pattern', 'negative_literal', 'or_pattern_binary', 'or_pattern_prefix', 'range_pattern_prefix',
	'range_pattern_with_left', 'raw_string_literal', 'ref_pattern', 'reference_pattern', 'remaining_field_pattern', 'slice_pattern',
	'str_keyword', 'string_literal', 'struct_pattern', 'tuple_pattern', 'tuple_struct_pattern', 'u128_keyword', 'u16_keyword', 'u32_keyword',
	'u64_keyword', 'u8_keyword', 'union_keyword', 'usize_keyword', 'wildcard_pattern'
];

const CEILING: readonly string[] = PATTERNS.map((kind) => `rust: ${kind} as declaration.parameter has no route for name`);

describe('required members a wildcard-claimed kind has no route for', () => {
	it('are exactly the recorded ones: a new one is a regression, a fixed one leaves the list', async () => {
		const d = derive(await loadInputs(['python', 'rust', 'typescript']));
		expect(d.wildcardUnrouted).toEqual(CEILING);
	});
});
