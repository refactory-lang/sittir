import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import rust, { type RustAPI } from '@sittir/rust';
import type { Engine, EngineOptions } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';
import { saverOf } from '../src/engine.ts';

const engines: { dispose(): void }[] = [];
let directory = '';

beforeEach(() => {
	directory = mkdtempSync(join(tmpdir(), 'sittir-render-save-'));
});

afterEach(() => {
	for (const engine of engines.splice(0)) engine.dispose();
	rmSync(directory, { recursive: true, force: true });
});

function identity(path: string): { readonly ino: number; readonly mtimeMs: number } {
	const { ino, mtimeMs } = statSync(path);
	return { ino, mtimeMs };
}

describe.each(['object', 'arena'] as const)('render(node).save(path) (%s)', (nodeStorage) => {
	async function engineOf(options?: EngineOptions<RustAPI>): Promise<Engine<RustAPI>> {
		const engine = await createEngine(rust, { ...options, nodeStorage });
		engines.push(engine);
		return engine;
	}

	function fileOf(name: string, text: string): string {
		const path = join(directory, name);
		writeFileSync(path, text);
		return path;
	}

	it('saves a parsed root as the bytes it renders', async () => {
		const engine = await engineOf();
		const root = engine.parse('fn a() {}\n');
		const path = join(directory, 'a.rs');
		engine.render(root).save(path);
		expect(readFileSync(path, 'utf8')).toBe(engine.render(root).toString());
	});

	it.each([
		['an unchanged file', 'fn a() {}\nfn b() {}\n'],
		['a BOM-led file', '﻿fn a() {}\n'],
		['an unterminated file', 'fn a() {}']
	])('leaves %s untouched', async (_, text) => {
		const engine = await engineOf();
		const path = fileOf('a.rs', text);
		const before = identity(path);
		engine.render(engine.parse(readFileSync(path, 'utf8'))).save(path);
		expect(identity(path)).toEqual(before);
		expect(readFileSync(path, 'utf8')).toBe(text);
	});

	it('leaves a CRLF file untouched under a CRLF newline', async () => {
		const engine = await engineOf({ render: { layout: { newline: '\r\n' } } });
		const path = fileOf('a.rs', 'fn a() {}\r\nfn b() {}\r\n');
		const before = identity(path);
		engine.render(engine.parse(readFileSync(path, 'utf8'))).save(path);
		expect(identity(path)).toEqual(before);
	});

	it('rewrites a CRLF file to LF under the defaults', async () => {
		const engine = await engineOf();
		const path = fileOf('a.rs', 'fn a() {}\r\nfn b() {}\r\n');
		engine.render(engine.parse(readFileSync(path, 'utf8'))).save(path);
		expect(readFileSync(path, 'utf8')).toBe('fn a() {}\nfn b() {}\n');
	});

	it('saves a built root', async () => {
		const engine = await engineOf();
		const built = engine.build.sourceFile({ statements: [...engine.parse('fn a() {}\n').statements()] } as never);
		const path = join(directory, 'built.rs');
		engine.render(built).save(path);
		expect(readFileSync(path, 'utf8')).toBe(engine.render(built).toString());
	});

	it('saves a built leaf', async () => {
		const engine = await engineOf();
		const path = join(directory, 'leaf.rs');
		engine.render(engine.build.identifier('x')).save(path);
		expect(readFileSync(path, 'utf8')).toBe('x');
	});

	it("a render's saver creates a new file and refuses an existing one", async () => {
		const engine = await engineOf();
		const path = join(directory, 'new.rs');
		const save = saverOf(engine.render(engine.parse('fn a() {}\n')));
		expect(save(path, true)).toBe(true);
		expect(readFileSync(path, 'utf8')).toBe('fn a() {}\n');
		expect(() => saverOf(engine.render(engine.parse('fn b() {}\n')))(path, true)).toThrow(/exists/);
		expect(readFileSync(path, 'utf8')).toBe('fn a() {}\n');
		expect(save(path, false)).toBe(false);
	});

	it('refuses a missing directory, naming the path', async () => {
		const engine = await engineOf();
		const rendered = engine.render(engine.parse('fn a() {}\n'));
		expect(() => rendered.save(join(directory, 'no-such-dir', 'a.rs'))).toThrow(/no-such-dir/);
	});

	it('an intercepted render saves the intercepted text', async () => {
		const engine = await engineOf({ intercept: [{ render: (_, next) => `${next()}// x\n` }] });
		const root = engine.parse('fn a() {}\n');
		const path = join(directory, 'a.rs');
		const rendered = engine.render(root);
		rendered.save(path);
		expect(readFileSync(path, 'utf8')).toBe('fn a() {}\n// x\n');
		expect(readFileSync(path, 'utf8')).toBe(rendered.toString());
	});
});
