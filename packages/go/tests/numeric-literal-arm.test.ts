import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime, scopeBuilders } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import go from '../src/index.ts';
import { portableBuild } from '../src/portable/build.ts';

const engine = await sharedEngine(() => createEngine(go, { api: 'strict' }));
const runtime = await portableRuntime(engine);
const generated = scopeBuilders(engine, portableBuild) as unknown as Record<string, unknown>;
const kinds = engine.kinds as unknown as Record<string, number>;

type Structure = { readonly $path: string } & Readonly<Record<string, unknown>>;

const builds: Readonly<Record<string, (structure: Structure) => unknown>> = {
	interpreted: (structure) => runtime.build(structure as never),
	generated: (structure) => (structure.$path.split('.').reduce<unknown>((at, segment) => (at as Record<string, unknown>)[segment], generated) as (input: Structure) => unknown)(structure)
};

const arms: readonly (readonly [string, number | bigint, string])[] = [
	['literal.number.integer', 0, 'IntLiteralArm2'],
	['literal.number.integer', 0n, 'IntLiteralArm2']
];

describe.each(Object.entries(builds))('a Go numeric literal arm, %s', (_, build) => {
	it.each(arms)('%s with $value %s builds %s', (path, value, kind) => {
		expect(build({ $path: path, $value: value })).toBe(kinds[kind]);
	});
});

describe('a Go numeric literal arm read', () => {
	it('0 reads its value', () => {
		const parsed = engine.parse('package p\nvar a = 0\n');
		const node = [...parsed.$query().$descendants.ofType(kinds.IntLiteralArm2 as never)][0]!;
		expect(runtime.read(node as never)).toEqual({ $path: 'literal.number.integer', $value: 0 });
	});

	it('0i reads as the decimal imaginary arm, the only one the parser makes for it', () => {
		const parsed = engine.parse('package p\nvar a = 0i\n');
		const node = [...parsed.$query().$descendants.ofType(kinds.ImaginaryLiteralArm1 as never)][0]!;
		expect(runtime.read(node as never)).toEqual({ $path: 'literal.number.integer.imaginary', $value: 0 });
	});
});
