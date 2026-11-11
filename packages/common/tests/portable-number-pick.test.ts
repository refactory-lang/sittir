import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/create-engine.ts';
import type { LanguageAPI } from '@sittir/types';
import { portableRuntime, type PortableRuntime } from '../src/portable/runtime.ts';
import python from '@sittir/python';
import rust from '@sittir/rust';
import typescript from '@sittir/typescript';

const surface = <API extends LanguageAPI>(runtime: PortableRuntime<API>) => ({
	build: runtime.build,
	read: runtime.read,
	parse: (source: string) => runtime.engine.parse(source),
	render: (node: unknown): string => String(runtime.engine.render(node as never))
});

const runtimes = {
	rust: surface(await portableRuntime(await createEngine(rust, { api: 'strict' }))),
	python: surface(await portableRuntime(await createEngine(python, { api: 'strict' }))),
	typescript: surface(await portableRuntime(await createEngine(typescript, { api: 'strict' })))
} as const;

const kindOf = (kinds: object, id: number): string | undefined => Object.entries(kinds).find(([, kind]) => kind === id)?.[0];

const picks = {
	rust: { language: rust, integer: 'IntegerLiteralDecimal', float: 'FloatLiteral', bigint: 'IntegerLiteralDecimal', big: '18446744073709551616' },
	python: { language: python, integer: 'IntegerDecimalPlain', float: 'FloatPoint', bigint: 'IntegerDecimalPlain', big: '18446744073709551616' },
	typescript: { language: typescript, integer: 'NumberDecimal', float: 'NumberFloatPoint', bigint: 'NumberBigintDecimal', big: '18446744073709551616n' }
} as const;

describe('a number built at literal.number takes the arm its value picks', () => {
	it.each(Object.keys(picks) as (keyof typeof picks)[])('%s: a whole number the integer arm, a fraction or a number past 2^53 the float arm, a bigint the bigint arm where the grammar has one', (grammar) => {
		const runtime = runtimes[grammar];
		const { language, integer, float, bigint, big } = picks[grammar];
		const built = (value: number | bigint): readonly [string | undefined, string] => {
			const node = runtime.build({ $path: 'literal.number', $value: value } as never) as { readonly $type: number };
			return [kindOf(language.kinds, node.$type), runtime.render(node)];
		};
		expect(built(5)).toEqual([integer, '5']);
		expect(built(1.5)).toEqual([float, '1.5']);
		expect(built(5n)).toEqual([bigint, grammar === 'typescript' ? '5n' : '5']);
		expect(built(2n ** 64n)).toEqual([bigint, big]);
		expect(built(2 ** 60)).toEqual([float, '1152921504606847000.0']);
	});

	it.each([
		['rust', 'let x = 5.0;'],
		['python', 'x = 5.0'],
		['typescript', 'x = 5.0;'],
		['typescript', 'x = 18446744073709551616;']
	] as const)('%s: a read of %s builds back as the kind it read', (grammar, source) => {
		const runtime = runtimes[grammar];
		expect(runtime.render(runtime.build(runtime.read(runtime.parse(source) as never) as never)).trim()).toBe(source);
	});
});
