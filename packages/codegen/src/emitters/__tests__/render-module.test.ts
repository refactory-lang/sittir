import { describe, expect, it } from 'vitest';
import { emitHashFiles } from '../render-module.ts';
import type { BundleFile } from '../bundle-hash.ts';

const sample: BundleFile[] = [
	{ filename: 'transport.rs', content: 'fn render_a() {}' },
	{ filename: 'options.rs', content: 'pub fn defaults() {}' }
];

describe('emitHashFiles', () => {
	it('writes to the expected per-grammar paths', () => {
		const emit = emitHashFiles('rust', sample);
		expect(emit.hashRs.path).toBe('rust/crates/sittir-rust/src/render/hash.rs');
		expect(emit.hashTs.path).toBe('packages/rust/src/hash.ts');
	});

	it('bakes the same hash into both files', () => {
		const emit = emitHashFiles('python', sample);
		const rsMatch = /RENDER_MODULE_HASH: &str = "([0-9a-f]{64})"/.exec(emit.hashRs.contents);
		const tsMatch = /RENDER_MODULE_HASH = '([0-9a-f]{64})'/.exec(emit.hashTs.contents);
		expect(rsMatch?.[1]).toBeDefined();
		expect(rsMatch?.[1]).toBe(tsMatch?.[1]);
	});

	it('references the one-flag regen command in generated headers', () => {
		const emit = emitHashFiles('typescript', sample);
		expect(emit.hashRs.contents).toMatch(/@generated from packages\/typescript\/node-model/);
		expect(emit.hashRs.contents).toMatch(/--grammar typescript --all/);
		expect(emit.hashTs.contents).toMatch(/@generated from packages\/typescript\/node-model/);
		expect(emit.hashTs.contents).toMatch(/--grammar typescript --all/);
	});

	it('byte-identical output for identical inputs (determinism)', () => {
		const a = emitHashFiles('rust', sample);
		const b = emitHashFiles('rust', sample);
		expect(a.hashRs.contents).toBe(b.hashRs.contents);
		expect(a.hashTs.contents).toBe(b.hashTs.contents);
	});

	it('different grammar identifiers yield different per-grammar paths', () => {
		const r = emitHashFiles('rust', sample);
		const p = emitHashFiles('python', sample);
		expect(r.hashRs.path).not.toBe(p.hashRs.path);
		const rHash = /RENDER_MODULE_HASH: &str = "([0-9a-f]{64})"/.exec(r.hashRs.contents)?.[1];
		const pHash = /RENDER_MODULE_HASH: &str = "([0-9a-f]{64})"/.exec(p.hashRs.contents)?.[1];
		expect(rHash).toBe(pHash);
	});
});
