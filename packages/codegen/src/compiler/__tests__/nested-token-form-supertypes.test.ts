import { describe, it, expect } from 'vitest';
import { compileGrammar } from '../compile.ts';
import { loadGeneratedIdTables } from '../generated-metadata.ts';
import { AssembledSupertype, concreteKindsOf } from '../model/node-map.ts';
import { grammarPackage } from '../../grammars.ts';

const FULL_PIPELINE_TIMEOUT = 180_000;

describe('a token-form supertype nested under another supertype arm', () => {
	it.each([
		['typescript', 'number_bigint', ['number_bigint_hex', 'number_bigint_binary', 'number_bigint_octal', 'number_bigint_decimal']],
		['python', 'integer_decimal', ['integer_decimal_long', 'integer_decimal_imaginary', 'integer_decimal_plain']],
		[
			'rust',
			'char_literal_escaped',
			['char_literal_escaped_simple', 'char_literal_escaped_unicode_fixed', 'char_literal_escaped_unicode_braced', 'char_literal_escaped_hex']
		]
	] as const)(
		'%s %s is a supertype whose concrete kinds are its arms',
		async (grammar, kind, arms) => {
			const compilation = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables: await loadGeneratedIdTables(grammar) });
			const node = compilation.nodeMap.nodes.get(kind);
			expect(node).toBeInstanceOf(AssembledSupertype);
			expect(node?.annotations?.hoisted).toBeUndefined();
			expect(concreteKindsOf(kind, compilation.nodeMap)).toEqual([...arms]);
			expect((node as AssembledSupertype).variantSubtypes?.map((ref) => ref.variantOf)).toEqual(arms.map(() => kind));
		},
		FULL_PIPELINE_TIMEOUT
	);
});
