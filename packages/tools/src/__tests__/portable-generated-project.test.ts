import { isDeepStrictEqual } from 'node:util';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { isNode, textOf } from '@sittir/common/portable/utils';
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

const generatedProjection = async (grammar: (typeof GRAMMARS)[number]): Promise<(value: unknown) => unknown> =>
	((await import(`../../../${grammar}/src/portable/project.ts`)) as { readonly project: (value: unknown) => unknown }).project;

const isStructure = (value: unknown): value is Readonly<Record<string, unknown>> & { readonly $path: string } =>
	typeof value === 'object' && value !== null && !Array.isArray(value) && typeof (value as { readonly $path?: unknown }).$path === 'string';

const plain = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(plain);
	if (isStructure(value)) return Object.fromEntries(Object.entries(value).map(([key, member]) => [key, plain(member)]));
	if (isNode(value)) return { $type: value.$type, $text: textOf(value, {}) };
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

describe.each(GRAMMARS)('the generated portable projection of %s', (grammar) => {
	it.each(STORAGES)('projects every corpus node as today’s read does, in %s storage', async (nodeStorage) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const project = await generatedProjection(grammar);
		const found: Found = { differences: [], rows: [] };
		for (const { name, source } of loadCorpusEntries(grammar)) {
			const root = engine.parse(source);
			compare(plain(runtime.read(root as never)), plain(project(root)), LISTED[grammar], name, found);
		}
		expect(found.differences.slice(0, 20)).toEqual([]);
		expect(found.differences.length).toBe(0);
	}, 600_000);
});
