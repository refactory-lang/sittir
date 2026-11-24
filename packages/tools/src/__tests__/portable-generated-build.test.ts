import { createEngine } from '@sittir/common';
import { portableRuntime, scopeBuilders } from '@sittir/common/engine';
import { recordOf } from '@sittir/common/utils';
import type { PortableStructure } from '@sittir/types';
import { describe, expect, it } from 'vitest';
import { languageByName } from '../languages.ts';
import { loadCorpusEntries } from '../validate/common.ts';

const GRAMMARS = ['python', 'rust', 'typescript'] as const;

const STORAGES = ['object', 'arena'] as const;

const INTERPRETER_REFUSES: Readonly<Record<string, readonly string[]>> = { python: ['declaration.member.property.getter', 'declaration.member.method.static'] };

const UNGENERATED_CEILINGS: Readonly<Record<(typeof GRAMMARS)[number], number>> = { python: 371, rust: 598, typescript: 612 };

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

type ListTable = {
	readonly build: {
		readonly paths: Readonly<Record<string, { readonly root: boolean; readonly arms: readonly { readonly slots: readonly { readonly name: string; readonly list?: boolean; readonly emptyContainer?: true }[] }[] }>>;
	};
};

describe.each(GRAMMARS)('the portable builds of %s, given an absent list slot', (grammar) => {
	it('build it as the empty list where every arm routes it with no empty container stamped, never as the empty container where every route stamps one, and alike in both builds', async () => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const portableBuild = (await generatedBuild(grammar)) as object;
		const { build: table } = (await import(`../../../${grammar}/src/portable/table.ts`)) as ListTable;
		const generated = scopeBuilders(engine, portableBuild);
		const render = (node: unknown): string => engine.render(node as never).toString();
		const outcome = (run: () => unknown): string => {
			const result = outcomeOf(() => render(run()));
			return 'text' in result ? result.text : NOT_GENERATED.test(result.error) ? 'not generated' : 'refused';
		};
		const seen = new Set<string>();
		const stamped = new Set<string>();
		const differences: string[] = [];
		for (const { source } of loadCorpusEntries(grammar))
			for (const structure of structuresIn(runtime.read(engine.parse(source)))) {
				const row = table.paths[structure.$path];
				if (row?.root !== true) continue;
				for (const [name, value] of Object.entries(structure)) {
					const slot = `${structure.$path}.${name}`;
					const routes = row.arms.flatMap((arm) => arm.slots.filter((route) => route.name === name));
					if (seen.has(slot) || !Array.isArray(value) || routes.length === 0 || !routes.every((route) => route.list === true)) continue;
					const stamping = routes.filter((route) => route.emptyContainer === true).length;
					if (stamping !== 0 && stamping !== routes.length) continue;
					seen.add(slot);
					if (stamping !== 0) stamped.add(slot);
					const asEmpty = stamping === 0 && row.arms.every((arm) => arm.slots.some((route) => route.name === name));
					const { [name]: _, ...absent } = structure;
					const emptied = { ...structure, [name]: [] };
					const run = functionAt(generated, structure.$path);
					const builds: readonly (readonly [string, (structure: PortableStructure) => unknown])[] = [
						['interpreter', (s) => runtime.build(s)],
						...(typeof run === 'function' ? [['generated', run as PathFunction] as const] : [])
					];
					const outcomes = builds
						.map(([build, of]) => [build, outcome(() => of(absent as PortableStructure)), outcome(() => of(emptied))] as const)
						.filter(([, whenAbsent, whenEmpty]) => whenAbsent !== 'not generated' && whenEmpty !== 'not generated');
					for (const [build, whenAbsent, whenEmpty] of outcomes)
						if ((asEmpty && whenAbsent !== whenEmpty) || (stamping !== 0 && whenAbsent !== 'refused' && whenAbsent === whenEmpty))
							differences.push(`${slot}: ${build} builds absent as ${JSON.stringify(whenAbsent)}, empty as ${JSON.stringify(whenEmpty)}`);
					if (outcomes.length === 2 && outcomes[0]![1] !== outcomes[1]![1])
						differences.push(`${slot}: absent builds ${JSON.stringify(outcomes[0]![1])} in the interpreter, ${JSON.stringify(outcomes[1]![1])} generated`);
				}
			}
		expect(seen.size).toBeGreaterThan(0);
		if (grammar === 'typescript') expect(stamped.size).toBeGreaterThan(0);
		expect(differences).toEqual([]);
	});
});

describe('a list read through a container that may be left out, where the list may be empty', () => {
	it.each([
		['namespace M {}\n', 'declaration.module', 'statements', [], 'namespace M {}'],
		['declare module "m";\n', 'declaration.module.external', 'statements', undefined, 'module "m"'],
		['declare module "m" {}\n', 'declaration.module.external', 'statements', [], 'module "m" {}'],
		['new Foo();\n', 'expression.call.construct', 'arguments', [], 'new Foo()']
	] as const)('typescript: %j reads its %s %s as %j, and both builds render it back to a text that rereads the same', async (source, path, slot, read, rendered) => {
		using engine = await createEngine(await languageByName('typescript'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const generated = scopeBuilders(engine, (await generatedBuild('typescript')) as object);
		const readAt = (text: string) => [...structuresIn(runtime.read(engine.parse(text)))].find((candidate) => candidate.$path === path)!;
		const structure = readAt(source);
		expect(slot in structure).toBe(read !== undefined);
		expect((structure as Readonly<Record<string, unknown>>)[slot]).toEqual(read);
		expect(engine.render(runtime.build(structure) as never).toString()).toBe(rendered);
		expect(engine.render((functionAt(generated, path) as PathFunction)(structure) as never).toString()).toBe(rendered);
		expect(readAt(`${rendered}\n`)).toEqual(structure);
	});

	it('rust: a list the grammar requires non-empty inside a container that may be left out still reads [] when the container is absent', async () => {
		using engine = await createEngine(await languageByName('rust'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const { build: table } = (await import('../../../rust/src/portable/table.ts')) as { readonly build: { readonly paths: Readonly<Record<string, { readonly arms: readonly { readonly slots: readonly { readonly name: string; readonly emptyContainer?: true }[] }[] }>> } };
		expect(table.paths['declaration.type_parameter']!.arms.flatMap((arm) => arm.slots.filter((route) => route.name === 'bounds' && route.emptyContainer === true))).toEqual([]);
		const parameter = [...structuresIn(runtime.read(engine.parse('fn f<T>() {}\n')))].find((candidate) => candidate.$path === 'declaration.type_parameter')!;
		expect(parameter).toEqual({ $path: 'declaration.type_parameter', name: 'T', bounds: [] });
	});
});

describe('a lambda, whose block body holds statements and whose expression body stays body', () => {
	const LAMBDA_SLOTS = ['body', 'statements', 'trailingExpression'] as const;
	const LAMBDA_UNGENERATED: ReadonlySet<string> = new Set(['typescript']);
	const inSource: Readonly<Record<(typeof GRAMMARS)[number], (lambda: string) => string>> = {
		python: (lambda) => `a = ${lambda}\n`,
		rust: (lambda) => `let a = ${lambda};\n`,
		typescript: (lambda) => `const a = ${lambda};\n`
	};
	const lambdaIn = (runtime: { read(tree: never): unknown }, engine: { parse(source: string): unknown }, source: string): PortableStructure =>
		[...structuresIn(runtime.read(engine.parse(source) as never))].find((candidate) => candidate.$path === 'expression.lambda')!;
	const shapeOf = (lambda: PortableStructure): Readonly<Record<string, number | 'one'>> => {
		const held = lambda as unknown as Readonly<Record<string, unknown>>;
		return Object.fromEntries(LAMBDA_SLOTS.filter((slot) => slot in held).map((slot) => [slot, Array.isArray(held[slot]) ? held[slot].length : 'one']));
	};

	it.each([
		['typescript', '() => { x(); }', { statements: 1 }, '() => {\n  x();\n}'],
		['typescript', '() => {}', { statements: 0 }, '() => {}'],
		['typescript', '(x) => x + 1', { body: 'one' }, '(x) => x + 1'],
		['rust', '|| { g(); 1 }', { statements: 1, trailingExpression: 'one' }, '|| {\n    g();\n    1\n}'],
		['rust', '|| {}', { statements: 0 }, '|| {}'],
		['rust', '|| -> i32 { 1 }', { statements: 0, trailingExpression: 'one' }, '|| -> i32 {\n    1\n}'],
		['rust', '|| 1', { body: 'one' }, '|| 1'],
		['rust', 'move |x| unsafe { x }', { body: 'one' }, 'move |x| unsafe {\n    x\n}'],
		['python', 'lambda x: x + 1', { body: 'one' }, 'lambda x: x + 1']
	] as const)('%s: %j reads %j, and both builds render it back to a text that rereads the same', async (grammar, text, shape, rendered) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const generated = scopeBuilders(engine, (await generatedBuild(grammar)) as object);
		const lambda = lambdaIn(runtime, engine, inSource[grammar](text));
		const run = functionAt(generated, 'expression.lambda') as PathFunction | undefined;
		expect(shapeOf(lambda)).toEqual(shape);
		expect(engine.render(runtime.build(lambda) as never).toString()).toBe(rendered);
		expect(typeof run).toBe(LAMBDA_UNGENERATED.has(grammar) ? 'undefined' : 'function');
		if (run !== undefined) {
			const generatedText = outcomeOf(() => engine.render(run(lambda) as never).toString());
			if (!('error' in generatedText && NOT_GENERATED.test(generatedText.error))) expect(generatedText).toEqual({ text: rendered });
		}
		expect(lambdaIn(runtime, engine, inSource[grammar](rendered))).toEqual(lambda);
	});

	it.each([
		['typescript', '() => { x(); }', '(x) => x + 1'],
		['rust', '|| { g(); }', '|| 1']
	] as const)('%s: both builds refuse an input that states a block body and an expression body', async (grammar, block, expression) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const generated = scopeBuilders(engine, (await generatedBuild(grammar)) as object);
		const { body } = lambdaIn(runtime, engine, inSource[grammar](expression)) as unknown as { readonly body: unknown };
		const both = { ...lambdaIn(runtime, engine, inSource[grammar](block)), body } as PortableStructure;
		const render = engine.render.bind(engine) as (node: never) => { toString(): string };
		const run = functionAt(generated, 'expression.lambda') as PathFunction | undefined;
		expect(textOrRefused(render, () => runtime.build(both))).toBe('refused');
		if (run !== undefined) expect(textOrRefused(render, () => run(both))).toBe('refused');
	});

	it.each([
		['|| { g(); 1 }', false],
		['|| { a; 1 }', true],
		['|| {}', true],
		['|| 1', true],
		['|| -> i32 { 1 }', true]
	] as const)('rust: %s builds the closure kind its text parses to', async (text, generates) => {
		using engine = await createEngine(await languageByName('rust'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const generated = scopeBuilders(engine, (await generatedBuild('rust')) as object);
		const run = functionAt(generated, 'expression.lambda') as PathFunction;
		const { build: table } = (await import('../../../rust/src/portable/table.ts')) as { readonly build: { readonly paths: Readonly<Record<string, { readonly arms: readonly { readonly kind: number }[] }>> } };
		const closures = new Set(table.paths['expression.lambda']!.arms.map((arm) => arm.kind));
		const childrenOf = (node: unknown): readonly unknown[] => (engine as unknown as { query(item: unknown): { readonly $children: readonly unknown[] } }).query(node).$children;
		const parsedKind = (node: unknown): number | undefined => {
			if (typeof node === 'number') return undefined;
			const kind = (node as { readonly $type: number }).$type;
			return closures.has(kind) ? kind : childrenOf(node).map(parsedKind).find((found) => found !== undefined);
		};
		const source = inSource.rust(text);
		const parsed = parsedKind(engine.parse(source));
		const lambda = lambdaIn(runtime, engine, source);
		expect(parsed).toBeDefined();
		expect((runtime.build(lambda) as { readonly $type: number }).$type).toBe(parsed);
		if (generates) expect((run(lambda) as { readonly $type: number }).$type).toBe(parsed);
		else expect(() => run(lambda)).toThrow(NOT_GENERATED);
	});
});

describe("a struct pattern, whose braces and parentheses are two paths", () => {
	it.each([
		['S { a }', 'pattern.struct', 'StructPattern'],
		['S {}', 'pattern.struct', 'StructPattern'],
		['S { .. }', 'pattern.struct', 'StructPattern'],
		['m::S { a }', 'pattern.struct', 'StructPattern'],
		['m::S {}', 'pattern.struct', 'StructPattern'],
		['S()', 'pattern.struct.tuple', 'TupleStructPattern'],
		['S(a)', 'pattern.struct.tuple', 'TupleStructPattern'],
		['S(..)', 'pattern.struct.tuple', 'TupleStructPattern'],
		['m::S()', 'pattern.struct.tuple', 'TupleStructPattern'],
		['m::S(a)', 'pattern.struct.tuple', 'TupleStructPattern']
	] as const)('rust: %s reads %s, and both builds make the kind it parses to and render it back', async (text, path, kind) => {
		const language = await languageByName('rust');
		using engine = await createEngine(language, { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const generated = scopeBuilders(engine, (await generatedBuild('rust')) as object);
		const readAt = (pattern: string) => [...structuresIn(runtime.read(engine.parse(`let ${pattern} = b;\n`)))].find((candidate) => candidate.$path === path)!;
		const structure = readAt(text);
		const { pattern: guards } = (language as unknown as { readonly is: { readonly portable: { readonly pattern: { readonly struct: ((node: unknown) => boolean) & { readonly tuple: (node: unknown) => boolean } } } } }).is.portable;
		const expected = (engine.kinds as unknown as Readonly<Record<string, number>>)[kind];
		for (const built of [runtime.build(structure), (functionAt(generated, path) as PathFunction)(structure)]) {
			expect((built as { readonly $type: number }).$type).toBe(expected);
			expect(engine.render(built as never).toString()).toBe(text);
			expect(guards.struct(built)).toBe(true);
			expect(guards.struct.tuple(built)).toBe(path === 'pattern.struct.tuple');
		}
		expect(readAt(text)).toEqual(structure);
	});

	it("python: a class pattern stays pattern.struct and keeps its positional and keyword fields", async () => {
		using engine = await createEngine(await languageByName('python'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const structure = [...structuresIn(runtime.read(engine.parse('match p:\n    case C(1, x=2):\n        pass\n')))].find((candidate) => candidate.$path === 'pattern.struct')! as PortableStructure & { readonly fields: readonly { readonly $path: string }[] };
		expect(structure.fields.map((field) => field.$path)).toEqual(['literal.number.integer', 'pattern.struct.field']);
		expect(engine.render(runtime.build(structure) as never).toString()).toBe('C(1, x=2)');
	});
});

describe('try, catch, finally, with and a python case hold statements', () => {
	it.each([
		['python', 'try:\n    a\nfinally:\n    b\n', 'statement.try', 1, 'try:\n    a\nfinally:\n    b\n', true],
		['python', 'try: a\nfinally: b\n', 'statement.try', 1, 'try:\n    a\nfinally:\n    b\n', true],
		['python', 'try:\n    a\nexcept E as e: b\n', 'clause.catch', 1, 'except E as e:\n    b\n', false],
		['python', 'try:\n    a\nfinally:\n    b\n', 'clause.finally', 1, 'finally:\n    b\n', true],
		['python', 'with x as y:\n    a\n', 'statement.resource', 1, 'with x as y:\n    a\n', false],
		['python', 'with x: a\n', 'statement.resource', 1, 'with x:\n    a\n', false],
		['python', 'with x:\n', 'statement.resource', 0, 'with x:\n', false],
		['python', 'match x:\n    case 1:\n        a\n', 'clause.case.match', 1, 'case 1:\n    a\n', true],
		['python', 'match x:\n    case 1: a\n', 'clause.case.match', 1, 'case 1:\n    a\n', true],
		['typescript', 'try { a(); b(); } finally {}\n', 'statement.try', 2, 'try {\n  a();\n  b();\n} finally {}', false],
		['typescript', 'try {} catch {} finally {}\n', 'statement.try', 0, 'try {} catch {} finally {}', false],
		['typescript', 'try { a(); } catch (e) { b(); }\n', 'clause.catch', 1, 'catch (e) {\n  b();\n}', false],
		['typescript', 'try {} catch {}\n', 'clause.catch', 0, 'catch {}', false],
		['typescript', 'try {} finally { c(); }\n', 'clause.finally', 1, 'finally {\n  c();\n}', true],
		['typescript', 'try {} finally {}\n', 'clause.finally', 0, 'finally {}', true]
	] as const)('%s: %j reads %s with its statements and builds them back', async (grammar, source, path, count, text, generates) => {
		const structure = (await readAt(grammar, source, path)) as PortableStructure & { readonly statements: readonly unknown[] };
		expect(structure).not.toHaveProperty('body');
		expect(structure.statements).toHaveLength(count);
		using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		expect(engine.render(runtime.build(structure) as never).toString()).toBe(text);
		if (generates) {
			const generated = scopeBuilders(engine, (await generatedBuild(grammar)) as object);
			expect(engine.render((functionAt(generated, path) as PathFunction)(structure) as never).toString()).toBe(text);
		}
	});

	it("rust: a match arm keeps its expression in body and holds no statements", async () => {
		const arm = await readAt('rust', 'fn f() { match x { 1 => a, } }\n', 'clause.case.match');
		expect(arm).toHaveProperty('body');
		expect(arm).not.toHaveProperty('statements');
	});
});

const bothBuilds = async (grammar: (typeof GRAMMARS)[number], structure: PortableStructure): Promise<readonly [interpreted: string, generated: string]> => {
	using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
	const runtime = await portableRuntime(engine);
	const generated = scopeBuilders(engine, (await generatedBuild(grammar)) as object);
	return [engine.render(runtime.build(structure) as never).toString(), engine.render((functionAt(generated, structure.$path) as PathFunction)(structure) as never).toString()];
};

const readAt = async (grammar: (typeof GRAMMARS)[number], source: string, path: string): Promise<PortableStructure> => {
	using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
	const runtime = await portableRuntime(engine);
	return [...structuresIn(runtime.read(engine.parse(source)))].find((candidate) => candidate.$path === path)!;
};

describe('a path whose arms no test tells apart', () => {
	it.each([
		['python', 'a, b\n', 'expression.collection.tuple.bare', 'a, b'],
		['python', 'a, b,\n', 'expression.collection.tuple.bare', 'a, b,'],
		['typescript', 'f<T>;\n', 'expression.instantiation', 'f<T>']
	] as const)('%s: %j builds at the root through the one arm more than one seat takes, in both builds', async (grammar, source, path, rendered) => {
		expect(await bothBuilds(grammar, await readAt(grammar, source, path))).toEqual([rendered, rendered]);
	});

	it('typescript: a string text builds at the root through the template text two seats take', async () => {
		expect(await bothBuilds('typescript', { $path: 'literal.string.text', $value: 'ab' })).toEqual(['ab', 'ab']);
	});

	it('python: *x has no root build, since more than one seat takes each of its forms', async () => {
		using engine = await createEngine(await languageByName('python'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const rest = [...structuresIn(runtime.read(engine.parse('print(*x)\n')))].find((candidate) => candidate.$path === 'pattern.rest')!;
		expect(() => runtime.build(rest)).toThrow('portable build: pattern.rest has no root build in python');
		expect(functionAt(scopeBuilders(engine, (await generatedBuild('python')) as object), 'pattern.rest')).toBeUndefined();
	});
});

describe('rust value blocks hold statements and a tail value', () => {
	it.each([
		['fn f() { unsafe { a; b } }\n', 'statement.block.unsafe', { statements: ['a'], trailingExpression: 'b' }, 'unsafe {\n    a;\n    b\n}'],
		['fn f() { unsafe { a; } }\n', 'statement.block.unsafe', { statements: ['a'] }, 'unsafe {\n    a;\n}'],
		['fn f() { unsafe { b } }\n', 'statement.block.unsafe', { statements: [], trailingExpression: 'b' }, 'unsafe {\n    b\n}'],
		['fn f() { unsafe {} }\n', 'statement.block.unsafe', { statements: [] }, 'unsafe {}'],
		['fn f() { async move { a; b } }\n', 'statement.block.async', { $flags: ['move'], statements: ['a'], trailingExpression: 'b' }, 'async move {\n    a;\n    b\n}'],
		['fn f() { const { 1 } }\n', 'statement.block.const', { statements: [], trailingExpression: { $path: 'literal.number.integer', $value: 1 } }, 'const {\n    1\n}']
	] as const)('%j reads its block into the value block and builds back through one block in both builds', async (source, path, slots, rendered) => {
		const structure = await readAt('rust', source, path);
		expect(structure).toEqual({ $path: path, ...slots });
		expect(await bothBuilds('rust', structure)).toEqual([rendered, rendered]);
	});

	it('builds an empty block when neither slot is stated, in both builds', async () => {
		expect(await bothBuilds('rust', { $path: 'statement.block.unsafe' })).toEqual(['unsafe {}', 'unsafe {}']);
	});
});

describe('an else whose statements are one if', () => {
	it.each([
		['typescript', 'if (a) {} else { if (d) {} }\n', 'if (a) {} else if (d) {}'],
		['typescript', 'if (a) {} else if (b) {} else {}\n', 'if (a) {} else if (b) {} else {}'],
		['typescript', 'if (a) {} else if (d) x();\n', 'if (a) {} else if (d) {\n  x();\n}'],
		['typescript', 'if (a) {} else { x(); }\n', 'if (a) {} else {\n  x();\n}'],
		['rust', 'fn f() { if c {} else { if d {} } }\n', 'if c {} else if d {}'],
		['rust', 'fn f() { if c {} else if d {} else {} }\n', 'if c {} else if d {} else {}'],
		['rust', 'fn f() { if c {} else { if d {} 1 } }\n', 'if c {} else {\n    if d {}\n    1\n}']
	] as const)('%s: %j builds as %j in both builds, bare only where the else holds one if and nothing else', async (grammar, source, rendered) => {
		expect(await bothBuilds(grammar, await readAt(grammar, source, 'statement.if'))).toEqual([rendered, rendered]);
	});
});

describe('the generated portable build, through a builder that takes options', () => {
	it.each([
		['typescript', 'break;\n', 'statement.break', 'break;'],
		['typescript', 'let x = 1;\n', 'declaration.variable.reassignable', 'let x = 1;'],
		['python', '"x"\n', 'literal.string', '"x"'],
		['python', '[x for x in a, b,]\n', 'clause.comprehension.for', 'for x in a, b,']
	] as const)('%s: %j builds as the interpreter does, its options from their preference or its flags', async (grammar, source, path, rendered) => {
		expect(await bothBuilds(grammar, await readAt(grammar, source, path))).toEqual([rendered, rendered]);
	});
});

describe('the generated portable build, through a preset that builds a leaf from its text', () => {
	it.each([
		['rust', 'fn f() { "x"; }\n', 'literal.string', '"x"'],
		['rust', 'fn f() { ""; }\n', 'literal.string', '""'],
		['rust', 'fn f() { "a\\x41\\u{41}b"; }\n', 'literal.string', '"a\\x41\\u{41}b"'],
		['rust', 'fn f() { b"x"; }\n', 'literal.string.bytes', 'b"x"'],
		['rust', 'fn f() { c"x"; }\n', 'literal.string.c', 'c"x"']
	] as const)('%s: %j builds as the interpreter does', async (grammar, source, path, rendered) => {
		expect(await bothBuilds(grammar, await readAt(grammar, source, path))).toEqual([rendered, rendered]);
	});
});

describe.each(STORAGES)('python: a negative number in an or-pattern, in %s storage', (nodeStorage) => {
	it.each([
		['3 | -3', '3 | -3'],
		['-3 | 3', '-3 | 3'],
		['-3.5 | 1', '-3.5 | 1'],
		['1 | -2 | 3', '1 | -2 | 3'],
		['(3 | -3)', '3 | -3'],
		['[3 | -3]', '3 | -3'],
		['A(x=3 | -3)', '3 | -3']
	] as const)('case %s: builds through the negative pattern builder and reads back the same, in both builds', async (pattern, rendered) => {
		using engine = await createEngine(await languageByName('python'), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const generated = scopeBuilders(engine, (await generatedBuild('python')) as object);
		const structure = [...structuresIn(runtime.read(engine.parse(`match x:\n    case ${pattern}:\n        pass\n`)))].find((candidate) => candidate.$path === 'pattern.or')!;
		for (const built of [runtime.build(structure), (functionAt(generated, 'pattern.or') as PathFunction)(structure)]) {
			expect(engine.render(built as never).toString()).toBe(rendered);
			expect(runtime.read(built as never)).toEqual(structure);
		}
	});
});

describe.each(STORAGES)('rust: a range pattern read through either claim of its path, in %s storage', (nodeStorage) => {
	it.each(['d..', '1..', 'd..e', '1..2', '..d', 'd..=e', '..=d', 'd...e'])('%s builds back as it reads', async (pattern) => {
		using engine = await createEngine(await languageByName('rust'), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const structure = [...structuresIn(runtime.read(engine.parse(`fn f() { match x { ${pattern} => a, } }\n`)))].find((candidate) => candidate.$path.startsWith('pattern.range'))!;
		const built = runtime.build(structure);
		expect(engine.render(built as never).toString()).toBe(pattern);
		expect(runtime.read(built as never)).toEqual(structure);
	});

	it.each([
		['d..', { start: 'd' }],
		['..d', { end: 'd' }],
		['d..e', { start: 'd', end: 'e' }],
		['d..=e', { start: 'd', end: 'e' }],
		['..=d', { end: 'd' }],
		['d...e', { start: 'd', end: 'e' }]
	] as const)('%s reads its bounds as start and end', async (pattern, bounds) => {
		using engine = await createEngine(await languageByName('rust'), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const { $path: path, ...slots } = [...structuresIn(runtime.read(engine.parse(`fn f() { match x { ${pattern} => a, } }\n`)))].find((candidate) => candidate.$path.startsWith('pattern.range'))!;
		expect(path).toMatch(/^pattern\.range\./);
		expect(slots).toEqual(bounds);
	});
});

describe.each(STORAGES)('rust: an enum variant whose path names its body, in %s storage', (nodeStorage) => {
	const ENUM_MEMBER = 'declaration.member.enum_member';
	it.each([
		['pub A', 'public', { name: 'A' }, 'pub A,'],
		['pub(crate) A', 'public.internal', { name: 'A' }, 'pub(crate) A,'],
		['crate A', 'public.internal', { name: 'A' }, 'pub(crate) A,'],
		['pub(self) A', 'private', { name: 'A' }, 'pub(self) A,'],
		['pub(super) A', 'public.parent', { name: 'A' }, 'pub(super) A,'],
		['pub A = 1', 'public', { name: 'A', value: { $path: 'literal.number.integer', $value: 1 } }, 'pub A = 1,'],
		['pub A()', 'tuple.public', { name: 'A', fields: [] }, 'pub A(),'],
		['pub A {}', 'struct.public', { name: 'A', fields: [] }, 'pub A {},'],
		['pub(crate) A()', 'tuple.public.internal', { name: 'A', fields: [] }, 'pub(crate) A(),'],
		['pub(self) A {}', 'struct.private', { name: 'A', fields: [] }, 'pub(self) A {},']
	] as const)('%s reads only what its path holds and builds back', async (variant, path, slots, rendered) => {
		using engine = await createEngine(await languageByName('rust'), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const read = runtime.read(engine.parse(`enum E { ${variant} }\n`));
		expect([...structuresIn(read)].find((candidate) => candidate.$path.startsWith(ENUM_MEMBER))).toEqual({ $path: `${ENUM_MEMBER}.${path}`, ...slots });
		expect(engine.render(runtime.build(read as PortableStructure) as never).toString().replace(/\s+/g, ' ').trim()).toBe(`enum E { ${rendered} }`);
	});

	it.each(['pub(in a) A', 'pub(in a) A()', 'pub(in a) A {}'])('%s builds back with its scope', async (variant) => {
		using engine = await createEngine(await languageByName('rust'), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const read = runtime.read(engine.parse(`enum E { ${variant} }\n`));
		expect(engine.render(runtime.build(read as PortableStructure) as never).toString().replace(/\s+/g, ' ').trim()).toBe(`enum E { ${variant}, }`);
	});

	it.each(['public', 'private', 'public.internal', 'public.parent'])('%s refuses a body in its input, as the plain path does', async (path) => {
		using engine = await createEngine(await languageByName('rust'), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const field = { $path: 'declaration.member.field', name: 'x', type: 'u8' };
		expect(() => runtime.build({ $path: `${ENUM_MEMBER}.${path}`, name: 'A', fields: [field] } as never)).toThrow('enum_variant has no slot fields');
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

type LiteralTable = { readonly build: { readonly paths: Readonly<Record<string, { readonly root: boolean; readonly arms: readonly { readonly literal?: object }[] }>> } };

describe.each(GRAMMARS)('the generated portable build of %s, on a literal path', (grammar) => {
	it.each(STORAGES)('builds every path whose arms are literal tokens through its own function as the interpreter does, in %s storage', async (nodeStorage) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const generated = scopeBuilders(engine, (await generatedBuild(grammar)) as object);
		const { build: table } = (await import(`../../../${grammar}/src/portable/table.ts`)) as LiteralTable;
		const outcome = (run: () => unknown): string => textOrRefused((node) => engine.render(node), run);
		const literalPaths = Object.entries(table.paths).filter(([, row]) => row.root && row.arms.length > 0 && row.arms.every((arm) => arm.literal !== undefined)).map(([path]) => path);
		expect(literalPaths.length).toBeGreaterThan(0);
		const structures = literalPaths.flatMap((path): PortableStructure[] => [{ $path: path }, { $path: path, $value: true }, { $path: path, $value: false }]);
		const built = structures.map((structure) => {
			const run = functionAt(generated, structure.$path);
			return [structure, typeof run === 'function' ? outcome(() => (run as PathFunction)(structure)) : 'not generated'];
		});
		expect(built).toEqual(structures.map((structure) => [structure, outcome(() => runtime.build(structure))]));
	});
});

describe.each(GRAMMARS)('the portable builds of %s, given a bare boolean', (grammar) => {
	it.each(STORAGES)('build it through the slot\'s boolean path as its structure builds, and refuse it where the slot holds no boolean path, in %s storage', async (nodeStorage) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const generated = scopeBuilders(engine, (await generatedBuild(grammar)) as object);
		const outcome = (run: () => unknown): string => textOrRefused((node) => engine.render(node), run);
		const run = functionAt(generated, 'statement.return') as PathFunction;
		for (const value of [true, false]) {
			const structure = (runtime.read(engine.parse(grammar === 'rust' ? `fn f() { return ${value}; }` : `return ${grammar === 'python' ? (value ? 'True' : 'False') : value}${grammar === 'typescript' ? ';' : ''}`)) as { readonly statements: readonly PortableStructure[] }).statements;
			const read = (grammar === 'rust' ? (structure[0] as unknown as { readonly statements: readonly PortableStructure[] }).statements[0] : structure[0])!;
			const bare = { $path: 'statement.return', expression: value };
			const text = outcome(() => run(read));
			expect(text).not.toBe('refused');
			expect([outcome(() => run(bare)), outcome(() => runtime.build(bare))]).toEqual([text, text]);
		}
		const named = { $path: 'declaration.function', name: true, parameters: [], statements: [] };
		const declare = functionAt(generated, named.$path) as PathFunction | undefined;
		expect([declare === undefined ? 'refused' : outcome(() => declare(named)), outcome(() => runtime.build(named))]).toEqual(['refused', 'refused']);
	});
});

describe.each(STORAGES)('python: a literal token in a slot, in %s storage', (nodeStorage) => {
	it('builds return True and return None through the generated slot function', async () => {
		using engine = await createEngine(await languageByName('python'), { api: 'strict', nodeStorage });
		const generated = scopeBuilders(engine, (await generatedBuild('python')) as object);
		const render = (node: unknown): string => engine.render(node as never).toString();
		const run = functionAt(generated, 'statement.return') as PathFunction;
		expect(render(run({ $path: 'statement.return', expression: { $path: 'literal.boolean.true' } }))).toBe('return True');
		expect(render(run({ $path: 'statement.return', expression: { $path: 'literal.null' } }))).toBe('return None');
	});
});

describe.each(STORAGES)("the generated portable build of python's getter, in %s storage", (nodeStorage) => {
	it('builds a getter read from @property over a lone self byte-equal through the root function, which writes the decorator and the self itself', async () => {
		using engine = await createEngine(await languageByName('python'), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const generated = scopeBuilders(engine, (await generatedBuild('python')) as object);
		const render = (node: unknown): string => engine.render(node as never).toString();
		const read = (runtime.read(engine.parse('class A:\n    @property\n    def x(self):\n        return 1\n')) as { readonly statements: readonly { readonly members: readonly PortableStructure[] }[] }).statements[0]!.members[0]!;
		expect(read.$path).toBe('declaration.member.property.getter');
		expect('parameters' in read).toBe(false);
		expect(render((functionAt(generated, read.$path) as PathFunction)(read))).toBe('@property\ndef x(self):\n    return 1\n');
	});
});

describe("the generated portable build, on a slot's tails", () => {
	const TAILED = [
		['rust', 'clause.let', 'value', { $path: 'metavariable', $value: 'y' }, { $path: 'identifier.metavariable', $value: 'y' }],
		['rust', 'clause.let', 'value', { $path: 'arithmetic.add', left: 'a', right: 'b' }, { $path: 'expression.binary.arithmetic.add', left: 'a', right: 'b' }],
		['python', 'statement.return', 'expression', { $path: 'add', left: 'a', right: 'b' }, { $path: 'expression.binary.arithmetic.add', left: 'a', right: 'b' }]
	] as const;
	const OWNERS: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
		'clause.let': { pattern: 'x' },
		'statement.return': {}
	};

	it.each(STORAGES)('builds each tail as its full path builds, in %s storage', async (nodeStorage) => {
		for (const [grammar, owner, slot, tailed, full] of TAILED) {
			using engine = await createEngine(await languageByName(grammar), { api: 'strict', nodeStorage });
			const runtime = await portableRuntime(engine);
			const run = functionAt(scopeBuilders(engine, (await generatedBuild(grammar)) as object), owner) as PathFunction;
			const render = (node: unknown): string => engine.render(node as never).toString();
			const structure = (value: object): PortableStructure => ({ $path: owner, ...OWNERS[owner], [slot]: value });
			expect(render(run(structure(tailed))), `${grammar} ${tailed.$path}`).toBe(render(runtime.build(structure(full))));
		}
	});

	it("refuses a suffix that is neither a path's tail nor its full path, and a root build of a tail", async () => {
		using engine = await createEngine(await languageByName('rust'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const generated = scopeBuilders(engine, (await generatedBuild('rust')) as object);
		const bound = functionAt(generated, 'clause.let') as PathFunction;
		for (const $path of ['add', 'binary.arithmetic.add'])
			expect(() => bound({ $path: 'clause.let', pattern: 'x', value: { $path, left: 'a', right: 'b' } } as never), $path).toThrow(/clause\.let\.value/);
		expect(functionAt(generated, 'metavariable')).toBeUndefined();
		expect(() => runtime.build({ $path: 'metavariable', $value: 'y' } as never)).toThrow();
	});
});

type KindsTable = { readonly build: { readonly paths: Readonly<Record<string, { readonly arms: readonly { readonly kind: number; readonly when: readonly object[] }[] }>> } };

const KINDS_PICK_GRAMMARS = ['python', 'typescript'] as const;

const KINDS_PICKS: Readonly<Record<(typeof KINDS_PICK_GRAMMARS)[number], { readonly path: string; readonly sources: readonly string[]; readonly excluded?: (element: unknown) => PortableStructure }>> = {
	typescript: { path: 'expression.parenthesized', sources: ['(a, b);\n', '(a);\n'] },
	python: {
		path: 'pattern.tuple',
		sources: ['(a, b) = c\n', 'match p:\n    case (1, b):\n        pass\n'],
		excluded: (element) => ({ $path: 'declaration.variable', name: { $path: 'pattern.tuple', elements: [element, 'b'] }, value: 'c' })
	}
};

describe.each(KINDS_PICK_GRAMMARS)('the generated portable build of %s, on two arms that differ by the kinds a slot builds', (grammar) => {
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
		const portableBuild = (await generatedBuild('python')) as { readonly declaration: { readonly member: { readonly property: { readonly getter: PathFunction } } } };
		const { getter } = scopeBuilders(engine, portableBuild).declaration.member.property;
		const render = (node: unknown): string => engine.render(node as never).toString();
		const read = [...structuresIn(runtime.read(engine.parse('class A:\n    @property\n    @override\n    def x(self) -> int:\n        pass\n')))].find((structure) => structure.$path === 'declaration.member.property.getter')!;
		expect(read.$at).toEqual({ getter: { index: 0, spelling: 'property' }, override: { index: 1, spelling: 'override' } });
		const at = (facts: object): PortableStructure => ({ ...read, $at: { ...read.$at, ...facts } });
		expect(render(getter(read))).toBe('@property\n@override\ndef x(self) -> int:\n    pass\n');
		expect(render(getter(at({ getter: { index: 1 }, override: { index: 0 } })))).toBe('@override\n@property\ndef x(self) -> int:\n    pass\n');
		expect(() => getter(at({ override: { index: 1, spelling: 'overrides' } }))).toThrow('declaration.member.property.getter.override has no spelling "overrides"');
		expect(() => getter(at({ getter: { index: 0, spelling: 'cached_property' } }))).toThrow('declaration.member.property.getter.getter has no spelling "cached_property"');
		expect(() => getter({ ...read, $flags: [] })).toThrow('declaration.member.property.getter: $at names override, which it does not set');
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
