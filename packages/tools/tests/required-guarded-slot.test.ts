import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../../..');
const rawOf = async (grammar: string): Promise<Record<string, (...args: unknown[]) => unknown>> =>
	(await import(pathToFileURL(resolve(root, `packages/${grammar}/src/factories/raw.ts`)).href)) as Record<string, (...args: unknown[]) => unknown>;

describe('an untyped undefined on a required guarded text slot fails the pattern guard', () => {
	it.each([
		['regex', 'buildIdentityEscape', 'identity_escape.content'],
		['rust', 'buildEscapeSequenceSimple', 'escape_sequence_simple.content'],
		['python', 'buildEscapeSequenceSimple', 'escape_sequence_simple.content'],
		['scm', 'buildEscapeSequence', 'escape_sequence.content'],
		['typescript', 'buildEscapeSequence', 'escape_sequence.content']
	])('%s %s', async (grammar, builder, label) => {
		const raw = await rawOf(grammar);
		expect(() => raw[builder]!(undefined)).toThrow(`${label}: text does not match pattern: undefined`);
	});
});

describe('an optional guarded text slot still takes undefined', () => {
	it('rust integer_literal_decimal builds without a suffix', async () => {
		const raw = await rawOf('rust');
		expect(raw.buildIntegerLiteralDecimal!({ content: '1', suffix: undefined })).toBeDefined();
	});

	it('typescript number_float_point builds without a fraction', async () => {
		const raw = await rawOf('typescript');
		expect(raw.buildNumberFloatPoint!({ integer: '1', fraction: undefined })).toBeDefined();
	});
});
