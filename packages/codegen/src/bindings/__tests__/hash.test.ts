import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REGENERATE_BINDINGS_COMMAND, StaleBindingsError, assertBindingsFresh, bindingsSourceHash } from '../index.ts';
import { bindingsStaleness } from '../hash.ts';

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

	it('accepts grammar bindings derived against the current bindings and vocabulary', () => {
		expect(() => assertBindingsFresh('g', fresh, paths.scm, paths.vocabulary)).not.toThrow();
	});

	it('refuses stale grammar bindings, naming the command that regenerates it', () => {
		const check = () => assertBindingsFresh('g', 'stale', paths.scm, paths.vocabulary);
		expect(check).toThrow(StaleBindingsError);
		expect(check).toThrow(REGENERATE_BINDINGS_COMMAND);
	});

	it('refuses a grammar with a bindings.scm and no committed grammar bindings', () => {
		expect(() => assertBindingsFresh('g', undefined, paths.scm, paths.vocabulary)).toThrow(REGENERATE_BINDINGS_COMMAND);
	});

	it('accepts a grammar with no bindings.scm and no grammar bindings', () => {
		expect(() => assertBindingsFresh('g', undefined, join(paths.vocabulary, 'missing.scm'), paths.vocabulary)).not.toThrow();
	});
});

describe('bindingsStaleness', () => {
	const paths = sources('(identifier) @identifier', { 'a.ts': 'A' });
	const fresh = bindingsSourceHash(paths.scm, paths.vocabulary);
	const missingScm = join(paths.vocabulary, 'missing.scm');

	it('reports nothing when the grammar has no bindings.scm', () => {
		expect(bindingsStaleness('g', undefined, missingScm, paths.vocabulary)).toBeUndefined();
	});

	it('names the regeneration command when bindings.scm exists and no hash is committed', () => {
		const message = bindingsStaleness('g', undefined, paths.scm, paths.vocabulary);
		expect(message).toContain('no grammar.bindings.ts carries its grammar bindings');
		expect(message).toContain(REGENERATE_BINDINGS_COMMAND);
	});

	it('names the regeneration command when the committed hash is wrong', () => {
		const message = bindingsStaleness('g', 'stale', paths.scm, paths.vocabulary);
		expect(message).toContain('is stale against bindings.scm and the vocabulary');
		expect(message).toContain(REGENERATE_BINDINGS_COMMAND);
	});

	it('reports nothing when the committed hash matches the current sources', () => {
		expect(bindingsStaleness('g', fresh, paths.scm, paths.vocabulary)).toBeUndefined();
	});

	it('throws the same message that bindingsStaleness reports', () => {
		const message = bindingsStaleness('g', 'stale', paths.scm, paths.vocabulary);
		expect(message).toBeDefined();
		expect(() => assertBindingsFresh('g', 'stale', paths.scm, paths.vocabulary)).toThrow(new StaleBindingsError(message!));
	});
});
