import { describe, expect, it } from 'vitest';
import { projectInterior } from '@sittir/common';
import { TOKEN_INTERIORS } from '../src/consts.ts';

describe('token interior projection: slots match left to right, each greedy', () => {
	const project = (kind: 'integer_literal_decimal' | 'integer_literal_hex', text: string) =>
		projectInterior(text, TOKEN_INTERIORS[kind], kind);

	it('reads a decimal with a type suffix as content and suffix', () => {
		expect(project('integer_literal_decimal', '1u8')).toEqual({ content: '1', suffix: 'u8' });
	});

	it('reads a hex spelling whose digits look like a suffix as content alone, as rustc does', () => {
		expect(project('integer_literal_hex', '0x1f32')).toEqual({ content: '0x1f32', suffix: undefined });
	});
});
