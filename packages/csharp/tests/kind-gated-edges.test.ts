import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(language, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(language, { nodeStorage: 'object' }))
};

const members = (body: string) => `abstract class C { ${body} int z; }`;

const cases: readonly (readonly [string, number, string])[] = [
	['MethodDeclaration', 3, members('int M() { return 1; } int N() => 1; abstract int O();')],
	['ConstructorDeclaration', 3, members('C() { } C(int a) => z = a; extern C(long a);')],
	['DestructorDeclaration', 3, members('~C() { } ~C() => z = 0; extern ~C();')],
	[
		'OperatorDeclaration',
		3,
		members(
			'public static C operator +(C a, C b) { return a; } public static C operator -(C a, C b) => a; public static extern C operator *(C a, C b);'
		)
	],
	[
		'ConversionOperatorDeclaration',
		3,
		members(
			'public static implicit operator int(C c) { return 0; } public static explicit operator long(C c) => 0; public static extern implicit operator short(C c);'
		)
	],
	['AccessorDeclaration', 3, members('int P { get { return 1; } set => z = value; init; }')],
	['PropertyDeclaration', 3, members('int P { get; set; } int Q => 1; int R { get; } = 1;')],
	['LocalFunctionStatement', 3, members('void M() { void A() { } int B() => 1; static extern int D(); int y = 0; }')]
];

describe('a C# member whose body arm is picked by the body slot’s kind', () => {
	it.each(cases)('%s renders alike on both storages and parses back', (kind, count, source) => {
		const renders = Object.values(engines).map((engine) => {
			const kinds = engine.kinds as unknown as Record<string, number>;
			const parsed = engine.parse(source);
			expect(parsed.$errors).toHaveLength(0);
			expect([...parsed.$query().$descendants.ofType(kinds[kind] as never)]).toHaveLength(count);
			const rendered = String(engine.render(parsed as never));
			expect(engine.parse(rendered).$errors).toHaveLength(0);
			return rendered;
		});
		expect(renders[0]).toBe(renders[1]);
	});
});
