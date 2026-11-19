import { createEngine } from '@sittir/common';
import { portableRuntime, scopeBuilders } from '@sittir/common/engine';
import { recordOf } from '@sittir/common/utils';
import type { PortableStructure } from '@sittir/types';
import { describe, expect, it } from 'vitest';
import { languageByName } from '../languages.ts';
import { loadCorpusEntries } from '../validate/common.ts';

const GRAMMARS = ['python', 'rust', 'typescript'] as const;

const STORAGES = ['object', 'arena'] as const;

const INTERPRETER_REFUSES: Readonly<Record<string, readonly string[]>> = { python: ['declaration.property.getter', 'declaration.method.static'] };

const UNGENERATED_CEILINGS: Readonly<Record<(typeof GRAMMARS)[number], number>> = { python: 827, rust: 1297, typescript: 1315 };

const NOT_GENERATED = /: (\S+) is not generated$/;

type PathFunction = (structure: PortableStructure) => unknown;

type Outcome = { readonly text: string } | { readonly error: string };

const isStructure = (value: unknown): value is PortableStructure =>
	typeof value === 'object' && value !== null && !Array.isArray(value) && typeof (value as { readonly $path?: unknown }).$path === 'string';

function* structuresIn(value: unknown): Generator<PortableStructure> {
	if (Array.isArray(value)) for (const item of value) yield* structuresIn(item);
	else if (isStructure(value)) {
		yield value;
		for (const [key, member] of Object.entries(value)) if (!key.startsWith('$')) yield* structuresIn(member);
	}
}

const outcomeOf = (run: () => string): Outcome => {
	try {
		return { text: run() };
	} catch (error) {
		return { error: error instanceof Error ? error.message : String(error) };
	}
};

describe.each(GRAMMARS)('the generated portable build of %s', (grammar) => {
	it.each(STORAGES)('builds every corpus structure as the interpreter does, in %s storage', async (nodeStorage) => {
		const language = await languageByName(grammar);
		using engine = await createEngine(language, { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const { portableBuild } = (await import(`../../../${grammar}/src/portable/build.ts`)) as { readonly portableBuild: object };
		const generated = scopeBuilders(engine, portableBuild);
		const functionOf = (path: string) => path.split('.').reduce<unknown>((at, segment) => (typeof at === 'object' && at !== null && Object.hasOwn(at, segment) ? (at as Record<string, unknown>)[segment] : typeof at === 'function' && Object.hasOwn(at, segment) ? (at as unknown as Record<string, unknown>)[segment] : undefined), generated) as PathFunction | undefined;
		const render = (node: unknown): string => engine.render(node as never).toString();
		const differences: string[] = [];
		const rows: string[] = [];
		const ungenerated = new Map<string, number>();
		for (const { name, source } of loadCorpusEntries(grammar)) {
			for (const structure of structuresIn(runtime.read(engine.parse(source)))) {
				const path = structure.$path;
				const run = functionOf(path);
				const interpreted = outcomeOf(() => render(runtime.build(structure)));
				const built: Outcome = typeof run === 'function' ? outcomeOf(() => render(run(structure))) : { error: `${path}: ${path} is not generated` };
				if ('text' in interpreted && 'text' in built && interpreted.text === built.text) continue;
				if ('error' in interpreted && 'error' in built) continue;
				const missing = 'error' in built ? NOT_GENERATED.exec(built.error)?.[1] : undefined;
				if ('text' in interpreted && missing !== undefined) ungenerated.set(missing, (ungenerated.get(missing) ?? 0) + 1);
				else if ('error' in interpreted && (INTERPRETER_REFUSES[grammar] ?? []).includes(path)) rows.push(`${name}: ${path}`);
				else differences.push(`${name}: ${path}: interpreter ${JSON.stringify(interpreted)}, generated ${JSON.stringify(built)}`);
			}
		}
		expect(differences.slice(0, 20)).toEqual([]);
		expect(differences.length).toBe(0);
		expect([...ungenerated.values()].reduce((sum, count) => sum + count, 0)).toBeLessThanOrEqual(UNGENERATED_CEILINGS[grammar]);
	}, 600_000);
});

type Returning = { readonly statement: { readonly return: (input: { readonly $path: 'statement.return'; readonly expression: unknown }) => object } };

const pythonBuild = async (): Promise<Returning> => ((await import('../../../python/src/portable/build.ts')) as unknown as { readonly portableBuild: Returning }).portableBuild;

describe('the generated portable build, by the engine that scopes it', () => {
	it('builds arena records inside an arena engine, and object nodes unscoped', async () => {
		using engine = await createEngine(await languageByName('python'), { api: 'strict', nodeStorage: 'arena' });
		const portableBuild = await pythonBuild();
		const scoped = scopeBuilders(engine, portableBuild).statement.return({ $path: 'statement.return', expression: 'x' });
		expect(recordOf(scoped)).toBeTypeOf('number');
		expect(engine.render(scoped as never).toString()).toBe('return x');
		expect(recordOf(portableBuild.statement.return({ $path: 'statement.return', expression: 'x' }))).toBeUndefined();
	});

	it('refuses a slot the path admits that its arm has no route for, as the interpreter does', async () => {
		using engine = await createEngine(await languageByName('python'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const { portableBuild } = (await import('../../../python/src/portable/build.ts')) as unknown as { readonly portableBuild: { readonly pattern: { readonly struct: { readonly field: PathFunction } } } };
		const field = scopeBuilders(engine, portableBuild).pattern.struct.field;
		const read = [...structuresIn(runtime.read(engine.parse('match p:\n    case Point(x=1):\n        pass\n')))].find((structure) => structure.$path === 'pattern.struct.field')!;
		const render = (node: unknown): string => engine.render(node as never).toString();
		expect(render(field(read))).toBe(render(runtime.build(read)));
		const stated = { ...read, type: 'Point' };
		expect(() => runtime.build(stated)).toThrow(/has no slot type/);
		expect(() => field(stated)).toThrow('pattern.struct.field has no slot type');
	});

	it('refuses an attributed type parameter, whose arm has no route for its attributes, as the interpreter does', async () => {
		using engine = await createEngine(await languageByName('rust'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const { portableBuild } = (await import('../../../rust/src/portable/build.ts')) as unknown as { readonly portableBuild: { readonly declaration: { readonly type_parameter: PathFunction } } };
		const parameter = scopeBuilders(engine, portableBuild).declaration.type_parameter;
		const [attributed, plain] = [...structuresIn(runtime.read(engine.parse('fn f<#[cfg(x)] T, U>() {}\n')))].filter((structure) => structure.$path === 'declaration.type_parameter');
		const render = (node: unknown): string => engine.render(node as never).toString();
		expect(render(parameter(plain!))).toBe(render(runtime.build(plain!)));
		expect(() => runtime.build(attributed!)).toThrow(/has no slot attributes/);
		expect(() => parameter(attributed!)).toThrow('declaration.type_parameter has no slot attributes');
	});

	it('refuses a node another grammar built, naming both languages', async () => {
		using engine = await createEngine(await languageByName('python'), { api: 'strict' });
		using other = await createEngine(await languageByName('typescript'));
		const portableBuild = scopeBuilders(engine, await pythonBuild());
		expect(() => portableBuild.statement.return({ $path: 'statement.return', expression: other.build.identifier('x') })).toThrow(
			/^cannot build a python return_statement with a typescript node in its /
		);
	});
});
