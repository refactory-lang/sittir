import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import rust from '@sittir/rust';
import { createEngine } from '../src/create-engine.ts';

let directory = '';

beforeEach(() => {
	directory = mkdtempSync(join(tmpdir(), 'sittir-save-root-'));
});

afterEach(() => {
	rmSync(directory, { recursive: true, force: true });
});

describe.each(['object', 'arena'] as const)('root.$save (%s)', (nodeStorage) => {
	const at = (name: string): string => join(directory, name);

	it('a parsed root saves through write', async () => {
		using engine = await createEngine(rust, { nodeStorage });
		const root = engine.parse('fn a() {}\n');
		await root.$save(at('a.rs'));
		expect(readFileSync(at('a.rs'), 'utf8')).toBe('fn a() {}\n');
	});

	it('a built root saves', async () => {
		using engine = await createEngine(rust, { nodeStorage });
		const root = engine.build.sourceFile({ statements: [engine.build.expressionStatement.withSemi(engine.build.identifier('a'))] });
		await root.$save(at('a.rs'));
		expect(readFileSync(at('a.rs'), 'utf8')).toBe(engine.render(root).toString());
	});

	it('an edited root saves', async () => {
		using engine = await createEngine(rust, { nodeStorage });
		const root = engine.parse('fn a() {}\nfn b() {}\n');
		const edited = root.$with.statements(...root.statements().slice(1));
		await edited.$save(at('a.rs'));
		expect(readFileSync(at('a.rs'), 'utf8')).toBe(engine.render(edited).toString());
	});

	it('a save writes nothing until it is awaited', async () => {
		using engine = await createEngine(rust, { nodeStorage });
		const saved = engine.parse('fn a() {}\n').$save(at('a.rs'));
		expect(existsSync(at('a.rs'))).toBe(false);
		await saved;
		expect(existsSync(at('a.rs'))).toBe(true);
	});

	it('only the root kind has $save', async () => {
		using engine = await createEngine(rust, { nodeStorage });
		const [statement] = engine.parse('fn a() {}\n').statements();
		expect((statement as unknown as { readonly $save?: unknown }).$save).toBeUndefined();
		expect((engine.build.expressionStatement.withSemi(engine.build.identifier('a')) as unknown as { readonly $save?: unknown }).$save).toBeUndefined();
	});

	it('refuses a root whose engine is disposed', async () => {
		const engine = await createEngine(rust, { nodeStorage });
		const root = engine.parse('fn a() {}\n');
		engine.dispose();
		expect(() => root.$save(at('a.rs'))).toThrow(/engine disposed/);
		expect(existsSync(at('a.rs'))).toBe(false);
	});
});
