import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../../python/src/index.ts';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';
import { TSKindId as PythonKinds } from '../../python/src/kinds.ts';
import { TSKindId as RustKinds } from '../../rust/src/kinds.ts';
import { TSKindId as TypescriptKinds } from '../../typescript/src/kinds.ts';

interface Case {
	readonly kind: string;
	readonly names: readonly string[];
	readonly present?: string;
	readonly absent?: string;
}

const KINDS = { python: PythonKinds, rust: RustKinds, typescript: TypescriptKinds } as const;

const CASES: Readonly<Record<keyof typeof KINDS, readonly Case[]>> = {
	rust: [
		{ kind: 'use_wildcard', names: ['useWildcardGroup'], present: 'use a::*;', absent: 'use *;' },
		{ kind: 'last_match_arm', names: ['match', 'pattern'], present: 'fn f() { match x { _ => 1 } }' },
		{ kind: 'match_arm_with_comma', names: ['match', 'pattern'], present: 'fn f() { match x { _ => 1, _ => 2 } }' },
		{ kind: 'match_arm_block_ending', names: ['match', 'pattern'], present: 'fn f() { match x { _ => {} _ => 2 } }' },
		{ kind: 'raw_string_literal', names: ['rawStringLiteralStart', 'rawStringLiteralEnd', 'prefix'], present: 'const S: &str = r#"x"#;' },
		{ kind: 'parameters_elements_receiver', names: ['receiver'], present: 'fn f(&self) {}' }
	],
	typescript: [
		{ kind: 'catch_clause', names: ['catchClauseGroup', 'parameter'], present: 'try {} catch (e) {}', absent: 'try {} catch {}' },
		{ kind: 'number_float_point', names: ['exponent'], present: '1.5e3;', absent: '1.5;' },
		{ kind: 'number_float_leading_point', names: ['exponent'], present: '.5E2;', absent: '.5;' }
	],
	python: [
		{ kind: 'slice', names: ['step', 'expression'], present: 'a[1:2:3]', absent: 'a[1:2]' },
		{ kind: 'string', names: ['stringStart', 'stringEnd'], present: 'x = "a"' },
		{ kind: 'float_point', names: ['exponent'], present: 'x = 1.5e3', absent: 'x = 1.5' },
		{ kind: 'float_leading_point', names: ['exponent'], present: 'x = .5e3', absent: 'x = .5' }
	]
};

interface KeyCase {
	readonly kind: string;
	readonly name: string;
	readonly seat?: string;
	readonly set: string;
	readonly unset: string;
}

const KEY_CASES: Readonly<Record<keyof typeof KINDS, readonly KeyCase[]>> = {
	rust: [
		{ kind: 'last_match_arm', name: 'condition', set: 'fn f() { match x { _ if c => 1 } }', unset: 'fn f() { match x { _ => 1 } }' },
		{ kind: 'match_arm_with_comma', name: 'condition', set: 'fn f() { match x { _ if c => 1, _ => 2 } }', unset: 'fn f() { match x { _ => 1, _ => 2 } }' },
		{ kind: 'match_arm_block_ending', name: 'condition', set: 'fn f() { match x { _ if c => {} _ => 2 } }', unset: 'fn f() { match x { _ => {} _ => 2 } }' },
		{ kind: 'parameters_elements_receiver', name: 'attributeItem', set: 'fn f(#[a] self) {}', unset: 'fn f(self) {}' }
	],
	typescript: [{ kind: 'catch_clause', name: 'type', seat: 'catchClauseGroup', set: 'try {} catch (e: unknown) {}', unset: 'try {} catch (e) {}' }],
	python: [
		{ kind: 'slice', name: 'expression', seat: 'step', set: 'a[1:2:3]', unset: 'a[1:2:]' },
		{ kind: 'string', name: 'prefix', set: 'x = b"a"', unset: 'x = "a"' }
	]
};

const pascal = (kind: string): string => kind.split('_').map((part) => part[0]!.toUpperCase() + part.slice(1)).join('');

type Visited = Record<string, unknown> & { readonly $type?: number; $has?(name: string): boolean };

function* nodesOf(node: unknown, seen = new Set<unknown>()): Generator<Visited> {
	if (typeof node !== 'object' || node === null || seen.has(node)) return;
	seen.add(node);
	if (Array.isArray(node)) {
		for (const item of node) yield* nodesOf(item, seen);
		return;
	}
	const visited = node as Visited;
	if (typeof visited.$type === 'number') yield visited;
	for (const key of Object.keys(visited)) {
		if (key.startsWith('$') || key.startsWith('_') || key === 'toString' || key === 'toJSON') continue;
		const read = visited[key];
		if (typeof read !== 'function' || (read as () => unknown).length !== 0) continue;
		let value: unknown;
		try {
			value = (read as () => unknown).call(visited);
		} catch {
			continue;
		}
		yield* nodesOf(value, seen);
	}
}

const LANGUAGES = { python, rust, typescript } as const;

describe.each(Object.keys(CASES) as (keyof typeof KINDS)[])('$has answers exactly for the %s shapes', (grammar) => {
	describe.each(['arena', 'object'] as const)('%s storage', (nodeStorage) => {
		it.each(CASES[grammar].flatMap((c) => [...(c.present === undefined ? [] : [[c.kind, c.names, true, c.present] as const]), ...(c.absent === undefined ? [] : [[c.kind, c.names, false, c.absent] as const])]))(
			'%s %j is %s in %s',
			async (kind, names, present, source) => {
				using engine = await createEngine(LANGUAGES[grammar] as never, { nodeStorage } as never);
				const id = (KINDS[grammar] as unknown as Record<string, number>)[pascal(kind)];
				expect(id, `kind id of ${kind}`).toBeTypeOf('number');
				const root = (engine as unknown as { parse(text: string): unknown }).parse(source);
				const found = [...nodesOf(root)].filter((node) => node.$type === id);
				expect(found.length, `${kind} nodes in ${source}`).toBeGreaterThan(0);
				for (const node of found) {
					expect(typeof node.$has, `${kind} has $has`).toBe('function');
					for (const name of names) expect(node.$has!(name), `${kind}.$has(${name}) on ${source}`).toBe(present);
				}
			},
			120_000
		);
	});
});

describe.each(Object.keys(KEY_CASES) as (keyof typeof KINDS)[])('$has answers a plain presence for the %s keys that do not decide a shape', (grammar) => {
	describe.each(['arena', 'object'] as const)('%s storage', (nodeStorage) => {
		it.each(KEY_CASES[grammar].flatMap((c) => [[c, true] as const, [c, false] as const]))(
			'%j with the key set is %s',
			async (c, set) => {
				using engine = await createEngine(LANGUAGES[grammar] as never, { nodeStorage } as never);
				const id = (KINDS[grammar] as unknown as Record<string, number>)[pascal(c.kind)];
				const source = set ? c.set : c.unset;
				const root = (engine as unknown as { parse(text: string): unknown }).parse(source);
				const found = [...nodesOf(root)].filter((node) => node.$type === id);
				expect(found.length, `${c.kind} nodes in ${source}`).toBeGreaterThan(0);
				for (const node of found) {
					expect(node.$has!(c.name), `${c.kind}.$has(${c.name}) on ${source}`).toBe(set);
					if (c.seat !== undefined) expect(node.$has!(c.seat), `${c.kind}.$has(${c.seat}) on ${source}`).toBe(true);
				}
			},
			120_000
		);
	});
});

describe.each(['arena', 'object'] as const)('$has answers exactly for built and edited floats, %s storage', (nodeStorage) => {
	type Float = { $has(name: string): boolean; $with: Record<string, (...args: unknown[]) => Float> };
	const floats = {
		typescript: async () => {
			const engine = await createEngine(typescript, { nodeStorage });
			return { engine, build: (config: object) => (engine.build as unknown as { number: { floatPoint(config: object): Float } }).number.floatPoint(config) };
		},
		python: async () => {
			const engine = await createEngine(python, { nodeStorage });
			return { engine, build: (config: object) => (engine.build as unknown as { float: { point(config: object): Float } }).float.point(config) };
		}
	} as const;

	it.each(['typescript', 'python'] as const)('%s: a built float has the branch exactly when it was given an exponent', async (grammar) => {
		const { engine, build } = await floats[grammar]();
		using _engine = engine;
		const present = build({ integer: '1', fraction: '5', exponentSign: '-', exponent: '3' });
		const absent = build({ integer: '1', fraction: '5' });
		expect(present.$has('exponent')).toBe(true);
		expect(absent.$has('exponent')).toBe(false);
		expect(present.$has('marker')).toBe(true);
		expect(absent.$has('marker')).toBe(false);
		expect(present.$with['exponent']!().$has('exponent')).toBe(false);
		expect(present.$with['exponentSign']!().$has('exponent')).toBe(true);
		expect(absent.$with['exponent']!('2').$has('exponent')).toBe(true);
	});
});
