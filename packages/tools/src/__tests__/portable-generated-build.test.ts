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

const UNGENERATED_CEILINGS: Readonly<Record<(typeof GRAMMARS)[number], number>> = { python: 667, rust: 795, typescript: 887 };

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

const generatedBuild = async (grammar: (typeof GRAMMARS)[number]): Promise<unknown> => ((await import(`../../../${grammar}/src/portable/build.ts`)) as { readonly portableBuild: unknown }).portableBuild;

const functionAt = (generated: object, path: string): unknown =>
	path
		.split('.')
		.reduce<unknown>((at, segment) => ((typeof at === 'object' || typeof at === 'function') && at !== null && Object.hasOwn(at, segment) ? (at as Record<string, unknown>)[segment] : undefined), generated);

const textOrRefused = (render: (node: never) => { toString(): string }, run: () => unknown): string => {
	const result = outcomeOf(() => render(run() as never).toString());
	return 'text' in result ? result.text : 'refused';
};

type RootTable = { readonly build: { readonly paths: Readonly<Record<string, { readonly root: boolean; readonly arms: readonly { readonly scalar?: string }[] }>> } };

const EDGE_SCALARS: readonly (number | bigint)[] = [-0, -1, -1.5, Number.NaN, Number.POSITIVE_INFINITY, 1.5, 2, 2n, -2n, 2 ** 60];

describe.each(GRAMMARS)('the generated portable build of %s, on a number path', (grammar) => {
	it('builds or refuses every edge value as the interpreter does', async () => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const portableBuild = (await generatedBuild(grammar)) as object;
		const { build: table } = (await import(`../../../${grammar}/src/portable/table.ts`)) as RootTable;
		const generated = scopeBuilders(engine, portableBuild);
		const outcome = (run: () => unknown): string => textOrRefused((node) => engine.render(node), run);
		const numberPaths = Object.entries(table.paths).filter(([, row]) => row.root && row.arms.some((arm) => arm.scalar !== undefined)).map(([path]) => path);
		const differences = numberPaths.flatMap((path) => {
			const run = functionAt(generated, path);
			if (typeof run !== 'function') return [];
			return EDGE_SCALARS.flatMap((value) => {
				const structure = { $path: path, $value: value };
				const [built, interpreted] = [outcome(() => (run as PathFunction)(structure)), outcome(() => runtime.build(structure))];
				return built === interpreted ? [] : [`${path} ${Object.is(value, -0) ? '-0' : typeof value === 'bigint' ? `${value}n` : String(value)}: generated ${JSON.stringify(built)}, interpreter ${JSON.stringify(interpreted)}`];
			});
		});
		expect(differences).toEqual([]);
	});
});

describe.each(GRAMMARS)('the generated portable build of %s, given a key no arm routes', (grammar) => {
	it('refuses it on every root path as the interpreter does, a text input in its object form included', async () => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const portableBuild = (await generatedBuild(grammar)) as object;
		const { build: table } = (await import(`../../../${grammar}/src/portable/table.ts`)) as RootTable;
		const generated = scopeBuilders(engine, portableBuild);
		const outcome = (run: () => unknown): string => textOrRefused((node) => engine.render(node), run);
		const compared = Object.entries(table.paths).filter(([path, row]) => row.root && typeof functionAt(generated, path) === 'function');
		const differences = compared.flatMap(([path]) => {
			const structure = { $path: path, $value: 'x', unexpected: 'y' };
			const [built, interpreted] = [outcome(() => (functionAt(generated, path) as PathFunction)(structure)), outcome(() => runtime.build(structure))];
			return built === interpreted ? [] : [`${path}: generated ${JSON.stringify(built)}, interpreter ${JSON.stringify(interpreted)}`];
		});
		expect(compared.length).toBeGreaterThan(0);
		expect(differences).toEqual([]);
	});
});

type NonEmptyTable = {
	readonly build: {
		readonly paths: Readonly<
			Record<string, { readonly root: boolean; readonly arms: readonly { readonly owners?: unknown; readonly slots: readonly { readonly name: string; readonly nonEmpty?: true }[] }[] }>
		>;
	};
};

describe.each(GRAMMARS)('the portable builds of %s, given an empty list where every route holds at least one element', (grammar) => {
	it('refuse it in both builds, the interpreter naming the slot', async () => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const portableBuild = (await generatedBuild(grammar)) as object;
		const { build: table } = (await import(`../../../${grammar}/src/portable/table.ts`)) as NonEmptyTable;
		const generated = scopeBuilders(engine, portableBuild);
		const render = (node: unknown): string => engine.render(node as never).toString();
		const nonEmpty = new Set(
			Object.entries(table.paths).flatMap(([path, row]) => {
				if (!row.root) return [];
				const names = new Set(row.arms.flatMap((arm) => arm.slots.map((route) => route.name)));
				return [...names].flatMap((name) => {
					const routing = row.arms.filter((arm) => arm.slots.some((route) => route.name === name));
					const filled = routing.every((arm) => arm.owners === undefined && arm.slots.every((route) => route.name !== name || route.nonEmpty === true));
					return filled ? [`${path}.${name}`] : [];
				});
			})
		);
		const seen = new Set<string>();
		const differences: string[] = [];
		for (const { source } of loadCorpusEntries(grammar))
			for (const structure of structuresIn(runtime.read(engine.parse(source))))
				for (const [name, value] of Object.entries(structure)) {
					const slot = `${structure.$path}.${name}`;
					if (!nonEmpty.has(slot) || seen.has(slot) || !Array.isArray(value) || value.length === 0) continue;
					seen.add(slot);
					const emptied = { ...structure, [name]: [] };
					const interpreted = outcomeOf(() => render(runtime.build(emptied)));
					if (!('error' in interpreted) || !interpreted.error.endsWith(`${structure.$path}: ${name} requires at least one element`)) differences.push(`${slot}: interpreter ${JSON.stringify(interpreted)}`);
					const run = functionAt(generated, structure.$path);
					if (typeof run !== 'function') continue;
					const built = outcomeOf(() => render((run as PathFunction)(emptied)));
					if (!('error' in built)) differences.push(`${slot}: generated ${JSON.stringify(built)}`);
				}
		expect(seen.size).toBeGreaterThan(0);
		expect(differences).toEqual([]);
	});
});

describe('the generated portable build, given a list for a slot the vocabulary takes as one value or a list', () => {
	it.each([
		['python', { $path: 'declaration.class', name: 'C', body: [{ $path: 'statement.block', statements: ['pass'] }] }],
		['typescript', { $path: 'declaration.module', name: 'M', body: [{ $path: 'statement.block', statements: [] }] }]
	] as const)('refuses it in %s, whose grammar holds one value there, as the interpreter does', async (grammar, structure) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const portableBuild = (await generatedBuild(grammar)) as object;
		const built = functionAt(scopeBuilders(engine, portableBuild), structure.$path) as PathFunction;
		expect(() => runtime.build(structure)).toThrow(`${structure.$path}'s body holds one value, not a list`);
		expect(() => built(structure)).toThrow(`${structure.$path}.body holds one value, not a list`);
	});
});

describe.each(GRAMMARS)('the generated portable build of %s', (grammar) => {
	it.each(STORAGES)('builds every corpus structure as the interpreter does, in %s storage', async (nodeStorage) => {
		const language = await languageByName(grammar);
		using engine = await createEngine(language, { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const portableBuild = (await generatedBuild(grammar)) as object;
		const generated = scopeBuilders(engine, portableBuild);
		const functionOf = (path: string) => functionAt(generated, path) as PathFunction | undefined;
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

type KindsTable = { readonly build: { readonly paths: Readonly<Record<string, { readonly arms: readonly { readonly kind: number; readonly when: readonly object[] }[] }>> } };

const KINDS_PICKS: Readonly<Record<(typeof GRAMMARS)[number], { readonly path: string; readonly sources: readonly string[]; readonly excluded?: (element: unknown) => PortableStructure }>> = {
	typescript: { path: 'expression.parenthesized', sources: ['(a, b);\n', '(a);\n'] },
	rust: { path: 'expression.lambda', sources: ['|| { 1 };\n', '|| 1 + 1;\n'] },
	python: {
		path: 'pattern.tuple',
		sources: ['(a, b) = c\n', 'match p:\n    case (1, b):\n        pass\n'],
		excluded: (element) => ({ $path: 'declaration.variable', name: { $path: 'pattern.tuple', elements: [element, 'b'] }, value: 'c' })
	}
};

describe.each(GRAMMARS)('the generated portable build of %s, on two arms that differ by the kinds a slot builds', (grammar) => {
	it("builds each through its own arm as the interpreter does, and refuses a path an arm's kinds test excludes where that arm is the only one", async () => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const portableBuild = (await generatedBuild(grammar)) as object;
		const { build: table } = (await import(`../../../${grammar}/src/portable/table.ts`)) as KindsTable;
		const generated = scopeBuilders(engine, portableBuild);
		const outcome = (run: () => unknown): string => textOrRefused((node) => engine.render(node), run);
		const { path, sources, excluded } = KINDS_PICKS[grammar];
		const tested = table.paths[path]!.arms.filter((arm) => arm.when.some((test) => 'kinds' in test)).map((arm) => arm.kind);
		const reads = sources.map((source) => (runtime.read(engine.parse(source)) as { readonly statements: readonly PortableStructure[] }).statements[0]!);
		const build = (read: PortableStructure) => (functionAt(generated, read.$path) as PathFunction)(read);
		for (const read of reads) expect(outcome(() => build(read))).toBe(outcome(() => runtime.build(read)));
		for (const read of reads) expect(outcome(() => build(read))).not.toBe('refused');
		const kinds = reads.filter((read) => read.$path === path).map((read) => (build(read) as { readonly $type: number }).$type);
		if (kinds.length > 0) expect(new Set(kinds)).toEqual(new Set(tested));
		if (excluded !== undefined) {
			const admitted = excluded('a');
			expect(outcome(() => build(admitted))).toBe(outcome(() => runtime.build(admitted)));
			expect(outcome(() => build(admitted))).not.toBe('refused');
			const read = excluded({ $path: 'literal.boolean.true' });
			expect(outcome(() => runtime.build(read))).toBe('refused');
			expect(outcome(() => build(read))).toBe('refused');
		}
	});
});

type Returning = { readonly statement: { readonly return: (input: { readonly $path: 'statement.return'; readonly expression: unknown }) => object } };

const pythonBuild = async (): Promise<Returning> => (await generatedBuild('python')) as Returning;

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
		const portableBuild = (await generatedBuild('python')) as { readonly pattern: { readonly struct: { readonly field: PathFunction } } };
		const field = scopeBuilders(engine, portableBuild).pattern.struct.field;
		const read = [...structuresIn(runtime.read(engine.parse('match p:\n    case Point(x=1):\n        pass\n')))].find((structure) => structure.$path === 'pattern.struct.field')!;
		const render = (node: unknown): string => engine.render(node as never).toString();
		expect(render(field(read))).toBe(render(runtime.build(read)));
		const stated = { ...read, type: 'Point' };
		expect(() => runtime.build(stated)).toThrow(/has no slot type/);
		expect(() => field(stated)).toThrow('pattern.struct.field has no slot type');
	});

	it('refuses a key no arm routes on a nested text item, as the interpreter does', async () => {
		using engine = await createEngine(await languageByName('typescript'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const portableBuild = (await generatedBuild('typescript')) as { readonly literal: { readonly string: PathFunction } };
		const string = scopeBuilders(engine, portableBuild).literal.string;
		const render = (node: unknown): string => engine.render(node as never).toString();
		const fragment = (extra: object): PortableStructure => ({ $path: 'literal.string', elements: [{ $path: 'literal.string.text', $value: 'ab', ...extra }] });
		expect(render(string(fragment({})))).toBe(render(runtime.build(fragment({}))));
		expect(() => runtime.build(fragment({ unexpected: 'y' }))).toThrow(/has no slot unexpected/);
		expect(() => string(fragment({ unexpected: 'y' }))).toThrow('literal.string.text has no slot unexpected');
	});

	it('refuses an attributed type parameter, whose arm has no route for its attributes, as the interpreter does', async () => {
		using engine = await createEngine(await languageByName('rust'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const portableBuild = (await generatedBuild('rust')) as { readonly declaration: { readonly type_parameter: PathFunction } };
		const parameter = scopeBuilders(engine, portableBuild).declaration.type_parameter;
		const [attributed, plain] = [...structuresIn(runtime.read(engine.parse('fn f<#[cfg(x)] T, U>() {}\n')))].filter((structure) => structure.$path === 'declaration.type_parameter');
		const render = (node: unknown): string => engine.render(node as never).toString();
		expect(render(parameter(plain!))).toBe(render(runtime.build(plain!)));
		expect(() => runtime.build(attributed!)).toThrow(/has no slot attributes/);
		expect(() => parameter(attributed!)).toThrow('declaration.type_parameter has no slot attributes');
	});

	it("builds a fact's spelling from its $at, and refuses what an untyped caller misstates there", async () => {
		using engine = await createEngine(await languageByName('python'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const portableBuild = (await generatedBuild('python')) as { readonly declaration: { readonly property: { readonly getter: PathFunction } } };
		const { getter } = scopeBuilders(engine, portableBuild).declaration.property;
		const render = (node: unknown): string => engine.render(node as never).toString();
		const read = [...structuresIn(runtime.read(engine.parse('class A:\n    @property\n    @override\n    def x(self) -> int:\n        pass\n')))].find((structure) => structure.$path === 'declaration.property.getter')!;
		expect(read.$at).toEqual({ getter: { index: 0, spelling: 'property' }, override: { index: 1, spelling: 'override' } });
		const at = (facts: object): PortableStructure => ({ ...read, $at: { ...read.$at, ...facts } });
		expect(render(getter(read))).toBe('@property\n@override\ndef x(self) -> int:\n    pass\n');
		expect(render(getter(at({ getter: { index: 1 }, override: { index: 0 } })))).toBe('@override\n@property\ndef x(self) -> int:\n    pass\n');
		expect(() => getter(at({ override: { index: 1, spelling: 'overrides' } }))).toThrow('declaration.property.getter.override has no spelling "overrides"');
		expect(() => getter(at({ getter: { index: 0, spelling: 'cached_property' } }))).toThrow('declaration.property.getter.getter has no spelling "cached_property"');
		expect(() => getter({ ...read, $flags: [] })).toThrow('declaration.property.getter: $at names override, which it does not set');
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
