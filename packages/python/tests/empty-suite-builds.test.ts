import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime, scopeBuilders } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import python from '../src/index.ts';
import { portableBuild } from '../src/portable/build.ts';

const engine = await sharedEngine(() => createEngine(python, { api: 'strict' }));
const runtime = await portableRuntime(engine);
const generated = scopeBuilders(engine, portableBuild) as unknown as Record<string, unknown>;

type Structure = { readonly $path: string } & Readonly<Record<string, unknown>>;

const builds: Readonly<Record<string, (structure: Structure) => unknown>> = {
	interpreted: (structure) => runtime.build(structure as never),
	generated: (structure) => (structure.$path.split('.').reduce<unknown>((at, segment) => (at as Record<string, unknown>)[segment], generated) as (input: Structure) => unknown)(structure)
};

const emptied = (value: unknown, path: string, stated: boolean): unknown => {
	if (Array.isArray(value)) return value.map((item) => emptied(item, path, stated));
	if (typeof value !== 'object' || value === null) return value;
	if ((value as Structure).$path === path) {
		expect((value as Structure).statements).toEqual([]);
		const { statements: _, ...rest } = value as Structure;
		return stated ? { ...rest, statements: [] } : rest;
	}
	return Object.fromEntries(Object.entries(value).map(([key, held]) => [key, emptied(held, path, stated)]));
};

const holders = [
	['declaration.function', 'def f():\n', 'built'],
	['declaration.method', 'class A:\n    def f(self):\n', 'not generated'],
	['declaration.method.special', 'class A:\n    def __eq__(self, other):\n', 'not generated'],
	['declaration.constructor', 'class A:\n    def __init__(self):\n', 'built'],
	['declaration.property.getter', 'class A:\n    @property\n    def x(self):\n', 'not generated'],
	['declaration.property.setter', 'class A:\n    @x.setter\n    def x(self, value):\n', 'not generated'],
	['statement.if', 'if x:\n', 'built'],
	['clause.else_if', 'if x:\n    pass\nelif y:\n', 'built'],
	['clause.else', 'if x:\n    pass\nelse:\n', 'built'],
	['statement.loop.while', 'while x:\n', 'built'],
	['statement.loop.for_each', 'for a in b:\n', 'built']
] as const;

const cases = holders.flatMap(([path, source, generatedOutcome]) =>
	Object.keys(builds).flatMap((build) =>
		(['no statements', 'none stated'] as const).map((given) => [path, build, given, source, build === 'generated' ? generatedOutcome : 'built'] as const)
	)
);

describe('a python suite holder with no statements builds the empty suite', () => {
	it.each(cases)('%s, through the %s build from %s', (path, build, given, source, outcome) => {
		const [top] = (runtime.read(engine.parse(source)) as unknown as { readonly statements: readonly Structure[] }).statements;
		const structure = emptied(top, path, given === 'no statements') as Structure;
		if (outcome === 'not generated') {
			expect(() => builds[build]!(structure)).toThrow(/ is not generated$/);
			return;
		}
		const rendered = String(engine.render(builds[build]!(structure) as never));
		expect(rendered).toBe(source);
		const reparsed = engine.parse(rendered).$query().$descendants;
		expect(Array.from(reparsed.ofType(python.kinds.SuiteEmpty))).toHaveLength(1);
		expect(Array.from(reparsed.ofType(python.kinds.SuiteBlock))).toHaveLength(path === 'clause.else_if' || path === 'clause.else' ? 1 : 0);
	});

	it('builds a doc beside no statements as the block holding the doc, as the doc alone builds', () => {
		const function_ = { $path: 'declaration.function', name: 'f', parameters: [], doc: 'd' };
		const beside = runtime.build({ $path: 'declaration.function', name: 'f', parameters: [], statements: [], doc: 'd' } as never) as unknown as { body(): { $type: number } };
		expect(beside.body().$type).toBe(python.kinds.SuiteBlock);
		expect(String(engine.render(beside as never))).toBe(String(engine.render(runtime.build(function_ as never) as never)));
	});
});
