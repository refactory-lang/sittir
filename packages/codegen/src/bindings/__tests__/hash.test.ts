import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REGENERATE_BINDINGS_COMMAND, StaleBindingsError, assertBindingsFresh, bindingsSourceHash } from '../index.ts';

function sources(scm: string, vocabulary: Readonly<Record<string, string>>): { scm: string; vocabulary: string } {
	const root = mkdtempSync(join(tmpdir(), 'bindings-hash-'));
	const dir = join(root, 'vocabulary');
	mkdirSync(dir);
	for (const [name, text] of Object.entries(vocabulary)) {
		mkdirSync(dirname(join(dir, name)), { recursive: true });
		writeFileSync(join(dir, name), text);
	}
	writeFileSync(join(root, 'bindings.scm'), scm);
	return { scm: join(root, 'bindings.scm'), vocabulary: dir };
}

describe('bindingsSourceHash', () => {
	const hashOf = (scm: string, vocabulary: Readonly<Record<string, string>>) => {
		const paths = sources(scm, vocabulary);
		return bindingsSourceHash(paths.scm, paths.vocabulary);
	};
	const base = hashOf('(identifier) @identifier', { 'a.ts': 'A', 'b.ts': 'B' });

	it('is the same for the same bindings and vocabulary', () => {
		expect(hashOf('(identifier) @identifier', { 'b.ts': 'B', 'a.ts': 'A' })).toBe(base);
	});

	it('changes when bindings.scm changes', () => {
		expect(hashOf('(identifier) @identifier.local', { 'a.ts': 'A', 'b.ts': 'B' })).not.toBe(base);
	});

	it('changes when a vocabulary source changes, is added or is renamed', () => {
		expect(hashOf('(identifier) @identifier', { 'a.ts': 'A', 'b.ts': 'B2' })).not.toBe(base);
		expect(hashOf('(identifier) @identifier', { 'a.ts': 'A', 'b.ts': 'B', 'c.ts': '' })).not.toBe(base);
		expect(hashOf('(identifier) @identifier', { 'a.ts': 'A', 'c.ts': 'B' })).not.toBe(base);
	});

	it('changes when a vocabulary source in a sub-folder changes or moves', () => {
		const nested = hashOf('(identifier) @identifier', { 'a.ts': 'A', 'features/x/b.ts': 'B' });
		expect(hashOf('(identifier) @identifier', { 'a.ts': 'A', 'features/x/b.ts': 'B2' })).not.toBe(nested);
		expect(hashOf('(identifier) @identifier', { 'a.ts': 'A', 'features/y/b.ts': 'B' })).not.toBe(nested);
	});
});

describe('assertBindingsFresh', () => {
	const paths = sources('(identifier) @identifier', { 'a.ts': 'A' });
	const fresh = bindingsSourceHash(paths.scm, paths.vocabulary);

	it('accepts an overlay derived against the current bindings and vocabulary', () => {
		expect(() => assertBindingsFresh('g', fresh, paths.scm, paths.vocabulary)).not.toThrow();
	});

	it('refuses a stale overlay, naming the command that regenerates it', () => {
		const check = () => assertBindingsFresh('g', 'stale', paths.scm, paths.vocabulary);
		expect(check).toThrow(StaleBindingsError);
		expect(check).toThrow(REGENERATE_BINDINGS_COMMAND);
	});

	it('refuses a grammar with a bindings.scm and no committed overlay', () => {
		expect(() => assertBindingsFresh('g', undefined, paths.scm, paths.vocabulary)).toThrow(REGENERATE_BINDINGS_COMMAND);
	});

	it('accepts a grammar with no bindings.scm and no overlay', () => {
		expect(() => assertBindingsFresh('g', undefined, join(paths.vocabulary, 'missing.scm'), paths.vocabulary)).not.toThrow();
	});
});
