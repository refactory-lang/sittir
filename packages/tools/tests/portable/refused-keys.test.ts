import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { describe, expect, it } from 'vitest';
import { languageByName } from '../../src/languages.ts';

type Grammar = 'python' | 'rust' | 'typescript';
const engineOf = async (grammar: Grammar) => createEngine(await languageByName(grammar), { api: 'strict' });
const escaped = (text: string): string => text.replace(/[.$]/g, (c) => `\\${c}`);

describe('a build refuses a key its arm routes no slot for, by what the key names', () => {
	it.each([
		['typescript', 'optionalChain', { $path: 'expression.call', function: 'f', arguments: [], optionalChain: true }],
		['typescript', 'abstract', { $path: 'declaration.class', name: 'C', body: [], abstract: true }],
		['python', 'async', { $path: 'declaration.function', name: 'f', parameters: [], statements: [{ $path: 'statement.pass' }], async: true }]
	] as const)('%s: %s, a flag the path declares, is stated in $flags', async (grammar, flag, structure) => {
		using engine = await engineOf(grammar);
		const runtime = await portableRuntime(engine);
		const path = escaped(structure.$path);
		expect(() => runtime.build(structure as never)).toThrow(new RegExp(`^portable build: ${path}: ${flag} is a flag of ${path}; state it in \\$flags$`));
	});

	it.each([
		['python', 'float_scientific', { $path: 'literal.number.float.scientific', $value: 100000, marker: 'E' }],
		['typescript', 'number_float_scientific', { $path: 'literal.number.float.scientific', $value: 100000, marker: 'E' }],
		['python', 'integer_decimal_long', { $path: 'literal.number.integer.big', $value: 10n, marker: 'l' }]
	] as const)("%s: marker, an option of %s, is written from its preference default, and the built node's $with changes it", async (grammar, kind, structure) => {
		using engine = await engineOf(grammar);
		const runtime = await portableRuntime(engine);
		expect(() => runtime.build(structure as never)).toThrow(
			new RegExp(`^portable build: ${escaped(structure.$path)}: marker is an option of ${kind}; the build writes it from its preference default, and the built node's \\$with changes it$`)
		);
	});

	it.each([
		['rust', 'call_expression'],
		['typescript', 'call_expression_call']
	] as const)('%s: any other key names no slot of the kind', async (grammar, kind) => {
		using engine = await engineOf(grammar);
		const runtime = await portableRuntime(engine);
		expect(() => runtime.build({ $path: 'expression.call', function: 'f', arguments: [], colour: 'red' } as never)).toThrow(new RegExp(`^portable build: expression\\.call: ${kind} has no slot colour$`));
	});
});
