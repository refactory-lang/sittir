/**
 * Smoke tests for the rust-render emitter scaffold. Full per-kind
 * emission is tested once T027/T028 land; this file covers only the
 * T016 hash-emission surface.
 */

import { describe, expect, it } from 'vitest';
import { emitHashFiles } from './rust-render.ts';
import type { TemplateFile } from './template-hash.ts';

const sample: TemplateFile[] = [
	{ filename: 'a.jinja', content: '{{ x }}' },
	{ filename: 'b.jinja', content: '{{ y }}' }
];

describe('emitHashFiles', () => {
	it('writes to the expected per-grammar paths', () => {
		const emit = emitHashFiles('rust', sample);
		expect(emit.hashRs.path).toBe('packages/rust/rust-render/src/hash.rs');
		expect(emit.hashTs.path).toBe('packages/rust/src/hash.ts');
	});

	it('bakes the same hash into both files', () => {
		const emit = emitHashFiles('python', sample);
		const rsMatch = /TEMPLATE_BUNDLE_HASH: &str = "([0-9a-f]{64})"/.exec(
			emit.hashRs.contents
		);
		const tsMatch = /TEMPLATE_BUNDLE_HASH = '([0-9a-f]{64})'/.exec(
			emit.hashTs.contents
		);
		expect(rsMatch?.[1]).toBeDefined();
		expect(rsMatch?.[1]).toBe(tsMatch?.[1]);
	});

	it('references the one-flag regen command in generated headers', () => {
		const emit = emitHashFiles('typescript', sample);
		expect(emit.hashRs.contents).toMatch(
			/@generated from packages\/typescript\/templates/
		);
		expect(emit.hashRs.contents).toMatch(/--grammar typescript --all/);
		expect(emit.hashRs.contents).not.toMatch(/--rust-render/);
		expect(emit.hashTs.contents).toMatch(
			/@generated from packages\/typescript\/templates/
		);
		expect(emit.hashTs.contents).toMatch(/--grammar typescript --all/);
		expect(emit.hashTs.contents).not.toMatch(/--rust-render/);
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
		// Same templates -> same hash even across grammars (the hash
		// function doesn't know the grammar, just the files).
		const rHash = /TEMPLATE_BUNDLE_HASH: &str = "([0-9a-f]{64})"/.exec(
			r.hashRs.contents
		)?.[1];
		const pHash = /TEMPLATE_BUNDLE_HASH: &str = "([0-9a-f]{64})"/.exec(
			p.hashRs.contents
		)?.[1];
		expect(rHash).toBe(pHash);
	});
});
