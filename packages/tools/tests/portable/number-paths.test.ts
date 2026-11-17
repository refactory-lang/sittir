import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import type { PortableStructure } from '@sittir/types';
import { describe, expect, it } from 'vitest';
import { languageByName } from '../../src/languages.ts';

const numbersIn = (value: unknown): PortableStructure[] => {
	if (Array.isArray(value)) return value.flatMap(numbersIn);
	if (typeof value !== 'object' || value === null) return [];
	const structure = value as PortableStructure;
	const own = typeof structure.$path === 'string' && structure.$path.startsWith('literal.number') ? [structure] : [];
	return [...own, ...Object.entries(structure).flatMap(([key, slot]) => (key.startsWith('$') ? [] : numbersIn(slot)))];
};

type Grammar = 'python' | 'rust' | 'typescript';
const engineOf = async (grammar: Grammar) => createEngine(await languageByName(grammar), { api: 'strict' });
type Built = { readonly $with: { readonly marker: (marker: string) => unknown } };

describe('a number path is its path, its value and its other slots', () => {
	const hosts = { python: (literal: string) => `x = ${literal}\n`, rust: (literal: string) => `const X: u8 = ${literal};\n`, typescript: (literal: string) => `x = ${literal};\n` };
	it.each([
		['python', '0X1F', { $path: 'literal.number.integer.hex', $value: 31 }],
		['python', '10L', { $path: 'literal.number.integer.big', $value: 10n }],
		['python', '017', { $path: 'literal.number.integer.octal', $value: 15 }],
		['python', '1.5', { $path: 'literal.number.float', $value: 1.5 }],
		['rust', '0x1Fu8', { $path: 'literal.number.integer.hex', $value: 31, suffix: 'u8' }],
		['typescript', '1E5', { $path: 'literal.number.float.scientific', $value: 100000 }],
		['typescript', '0B101', { $path: 'literal.number.integer.binary', $value: 5 }],
		['typescript', '017', { $path: 'literal.number.integer.octal', $value: 15 }]
	] as const)('%s %s reads no option, and builds back to the same read', async (grammar, literal, read) => {
		using engine = await engineOf(grammar);
		const runtime = await portableRuntime(engine);
		expect(numbersIn(runtime.read(engine.parse(hosts[grammar](literal))))).toEqual([read]);
		const rebuilt = engine.render(runtime.build(read as never) as never).toString();
		expect(numbersIn(runtime.read(engine.parse(hosts[grammar](rebuilt))))).toEqual([read]);
	});

	it.each(['python', 'typescript'] as const)('%s builds a legacy octal read in the prefixed form', async (grammar) => {
		using engine = await engineOf(grammar);
		const runtime = await portableRuntime(engine);
		expect(engine.render(runtime.build({ $path: 'literal.number.integer.octal', $value: 15 } as never) as never).toString()).toBe('0o17');
	});

	it.each(['python', 'typescript'] as const)('%s refuses an option beside the $value, and the value slots without one', async (grammar) => {
		using engine = await engineOf(grammar);
		const runtime = await portableRuntime(engine);
		expect(() => runtime.build({ $path: 'literal.number.float.scientific', $value: 100000, marker: 'E' } as never)).toThrow(/ has no \S+ marker$/);
		expect(() => runtime.build({ $path: 'literal.number.float.scientific', integer: '1', exponent: '5' } as never)).toThrow();
		if (grammar === 'python') expect(() => runtime.build({ $path: 'literal.number.integer.big', $value: 10n, marker: 'l' } as never)).toThrow(/ has no \S+ marker$/);
	});

	it.each([
		['python', { $path: 'literal.number.float.scientific', $value: 100000 }, '1e5', 'E', '1E5'],
		['typescript', { $path: 'literal.number.float.scientific', $value: 100000 }, '1e5', 'E', '1E5'],
		['python', { $path: 'literal.number.integer.big', $value: 10n }, '10L', 'l', '10l']
	] as const)('%s writes an option from its preference default, and sets it on the built node', async (grammar, structure, written, option, set) => {
		using engine = await engineOf(grammar);
		const runtime = await portableRuntime(engine);
		const built = runtime.build(structure as never) as Built;
		expect(engine.render(built as never).toString()).toBe(written);
		expect(engine.render(built.$with.marker(option) as never).toString()).toBe(set);
	});
});
