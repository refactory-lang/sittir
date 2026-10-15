import { describe, expect, it } from 'vitest';
import { derive } from '@sittir/codegen/bindings';
import { loadInputs } from '../../src/inventory/index.ts';

// Relaxed keyword arms no longer belong to the parameter's pattern slot.
const PATTERNS = [
	'boolean_literal',
	'char_literal_empty',
	'char_literal_escaped_hex',
	'char_literal_escaped_simple',
	'char_literal_escaped_unicode_braced',
	'char_literal_escaped_unicode_fixed',
	'char_literal_plain',
	'const_block',
	'float_literal',
	'identifier',
	'integer_literal_binary',
	'integer_literal_decimal',
	'integer_literal_hex',
	'integer_literal_octal',
	'macro_invocation',
	'mut_pattern',
	'negative_literal',
	'or_pattern_binary',
	'or_pattern_prefix',
	'range_pattern_prefix',
	'range_pattern_with_left',
	'raw_string_literal',
	'ref_pattern',
	'reference_pattern',
	'remaining_field_pattern',
	'slice_pattern',
	'string_literal',
	'struct_pattern',
	'tuple_pattern',
	'tuple_struct_pattern',
	'wildcard_pattern'
];

const CEILING: readonly string[] = PATTERNS.map(
	(kind) => `rust: ${kind} as declaration.parameter has no route for name`
);

describe('required members a wildcard-claimed kind has no route for', () => {
	it('are exactly the recorded ones: a new one is a regression, a fixed one leaves the list', async () => {
		const d = derive(await loadInputs(['python', 'rust', 'typescript']));
		expect(d.wildcardUnrouted).toEqual(CEILING);
	}, 120_000);
});
