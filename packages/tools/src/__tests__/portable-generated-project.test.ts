import { isDeepStrictEqual } from 'node:util';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { hasKind, textOf, type Node } from '@sittir/common/portable/utils';
import { describe, expect, it } from 'vitest';
import { languageByName } from '../languages.ts';
import { loadCorpusEntries } from '../validate/common.ts';

const GRAMMARS = ['python', 'rust', 'typescript'] as const;

const STORAGES = ['object', 'arena'] as const;

const LISTED: Readonly<Record<(typeof GRAMMARS)[number], Readonly<Record<string, readonly string[]>>>> = {
	python: { 'declaration.member.property.getter': ['parameters'] },
	rust: {},
	typescript: { 'identifier.qualified': ['name', 'qualifier'] }
};

const SOURCES: Readonly<Record<(typeof GRAMMARS)[number], readonly { readonly name: string; readonly source: string }[]>> = {
	python: [{ name: 'string prefixes the prefix token does not read', source: 'x = bf"a"\ny = rr"a"\nz = ub"a"\n' }],
	rust: [],
	typescript: [{ name: 'a receiver with an accessibility modifier', source: 'function f(public this: T[]) {}\n' }]
};

const generatedProjection = async (grammar: (typeof GRAMMARS)[number]): Promise<(value: unknown) => unknown> =>
	((await import(`../../../${grammar}/src/portable/project.ts`)) as { readonly project: (value: unknown) => unknown }).project;

const isStructure = (value: unknown): value is Readonly<Record<string, unknown>> & { readonly $path: string } =>
	typeof value === 'object' && value !== null && !Array.isArray(value) && typeof (value as { readonly $path?: unknown }).$path === 'string';

const plain = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(plain);
	if (isStructure(value)) return Object.fromEntries(Object.entries(value).map(([key, member]) => [key, plain(member)]));
	if (hasKind(value)) return { $type: value.$type, $text: textOf(value, {}) };
	return value;
};

interface Found {
	readonly differences: string[];
	readonly rows: string[];
}

const compare = (today: unknown, generated: unknown, listed: Readonly<Record<string, readonly string[]>>, at: string, found: Found): void => {
	if (isDeepStrictEqual(today, generated)) return;
	if (isStructure(today) && isStructure(generated) && today.$path === generated.$path) {
		for (const key of new Set([...Object.keys(today), ...Object.keys(generated)])) {
			if (isDeepStrictEqual(today[key], generated[key])) continue;
			if ((listed[today.$path] ?? []).includes(key)) found.rows.push(`${at}: ${today.$path}.${key}`);
			else compare(today[key], generated[key], listed, `${at}.${key}`, found);
		}
		return;
	}
	if (Array.isArray(today) && Array.isArray(generated) && today.length === generated.length) {
		today.forEach((item, i) => compare(item, generated[i], listed, `${at}[${i}]`, found));
		return;
	}
	found.differences.push(`${at}: today ${JSON.stringify(today)?.slice(0, 200)}, generated ${JSON.stringify(generated)?.slice(0, 200)}`);
};

type Builder = (config: Readonly<Record<string, unknown>>) => unknown;

interface KindBuilder {
	readonly name: string;
	readonly build: Builder;
}

const slotKeys = (node: object): readonly string[] =>
	Object.keys(node).filter((key) => !key.startsWith('$') && key !== 'toString' && key !== 'toJSON' && !(key in Array.prototype) && typeof Reflect.get(node, key) === 'function');

const held = (value: unknown): boolean => value !== undefined && value !== null && value !== false && !(Array.isArray(value) && value.length === 0);

const slotValues = (node: object): Record<string, unknown> =>
	Object.fromEntries(
		slotKeys(node).flatMap((key) => {
			const value: unknown = Reflect.apply(Reflect.get(node, key) as () => unknown, node, []);
			return held(value) ? [[key, value]] : [];
		})
	);

const nodesUnder = (value: unknown, into: Node[] = []): Node[] => {
	if (Array.isArray(value)) for (const item of value) nodesUnder(item, into);
	else if (hasKind(value)) {
		into.push(value);
		for (const member of Object.values(slotValues(value))) nodesUnder(member, into);
	}
	return into;
};

const attempt = (builder: KindBuilder, config: Readonly<Record<string, unknown>>): unknown => {
	try {
		const built = builder.build(config);
		String(built);
		return built;
	} catch {
		return undefined;
	}
};

const configBuilders = async (grammar: (typeof GRAMMARS)[number], build: object): Promise<ReadonlyMap<number, KindBuilder>> => {
	const { TSKindId } = (await import(`../../../${grammar}/src/kinds.ts`)) as { readonly TSKindId: Readonly<Record<number, string>> };
	const { build: table } = (await import(`../../../${grammar}/src/portable/table.ts`)) as { readonly build: { readonly builders: Readonly<Record<string, string>> } };
	const builders = new Map<number, KindBuilder>();
	for (const [id, name] of Object.entries(TSKindId)) {
		if (!/^\d+$/.test(id) || typeof name !== 'string') continue;
		const builder = `${name[0]!.toLowerCase()}${name.slice(1)}`;
		const call: unknown = Reflect.get(build, builder);
		if (table.builders[builder] === 'config' && typeof call === 'function') builders.set(Number(id), { name, build: (config) => Reflect.apply(call, build, [config]) });
	}
	return builders;
};

describe.each(GRAMMARS)('the generated portable projection of %s', (grammar) => {
	it.each(STORAGES)('projects every corpus node rebuilt through its strict builder as today’s read does, in %s storage', async (nodeStorage) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const project = await generatedProjection(grammar);
		const builders = await configBuilders(grammar, engine.build);
		const found: Found = { differences: [], rows: [] };
		let rebuilt = 0;
		for (const { name, source } of loadCorpusEntries(grammar)) {
			for (const node of nodesUnder(engine.parse(source))) {
				const builder = builders.get(node.$type);
				if (builder === undefined) continue;
				const built = attempt(builder, slotValues(node));
				if (built === undefined) continue;
				rebuilt++;
				compare(plain(runtime.read(built as never)), plain(project(built)), LISTED[grammar], `${name} (rebuilt ${builder.name})`, found);
			}
		}
		expect(rebuilt).toBeGreaterThan(0);
		expect(found.differences.slice(0, 20)).toEqual([]);
		expect(found.differences.length).toBe(0);
	}, 600_000);

	it.each(STORAGES)('projects every corpus node as today’s read does, in %s storage', async (nodeStorage) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const project = await generatedProjection(grammar);
		const found: Found = { differences: [], rows: [] };
		for (const { name, source } of [...loadCorpusEntries(grammar), ...SOURCES[grammar]]) {
			const root = engine.parse(source);
			compare(plain(runtime.read(root as never)), plain(project(root)), LISTED[grammar], name, found);
		}
		expect(found.differences.slice(0, 20)).toEqual([]);
		expect(found.differences.length).toBe(0);
	}, 600_000);
});
