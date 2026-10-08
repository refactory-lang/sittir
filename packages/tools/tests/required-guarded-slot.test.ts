import { describe, expect, it } from 'vitest';
import { requireGrammarModule } from '../src/grammar-internals.ts';

const rawOf = (grammar: string) => requireGrammarModule(grammar, 'factories/raw.ts');

describe('an untyped undefined on a required guarded text slot fails the pattern guard', () => {
	it.each([
		['regex', 'buildIdentityEscape', 'identity_escape.content'],
		['rust', 'buildEscapeSequenceSimple', 'escape_sequence_simple.content'],
		['python', 'buildEscapeSequenceSimple', 'escape_sequence_simple.content'],
		['scm', 'buildEscapeSequence', 'escape_sequence.content'],
		['typescript', 'buildEscapeSequence', 'escape_sequence.content']
	])('%s %s', async (grammar, builder, label) => {
		const raw = await rawOf(grammar);
		const build = raw[builder];
		if (typeof build !== 'function') throw new Error(`Missing raw factory ${builder}`);
		expect(() => build(undefined)).toThrow(`${label}: text does not match pattern: undefined`);
	});
});

describe('an optional guarded text slot still takes undefined', () => {
	it('rust integer_literal_decimal builds without a suffix', async () => {
		const raw = await rawOf('rust');
		const build = raw.buildIntegerLiteralDecimal;
		if (typeof build !== 'function') throw new Error('Missing raw factory buildIntegerLiteralDecimal');
		expect(build({ content: '1', suffix: undefined })).toBeDefined();
	});

	it('typescript number_float_point builds without a fraction', async () => {
		const raw = await rawOf('typescript');
		const build = raw.buildNumberFloatPoint;
		if (typeof build !== 'function') throw new Error('Missing raw factory buildNumberFloatPoint');
		expect(build({ integer: '1', fraction: undefined })).toBeDefined();
	});
});
