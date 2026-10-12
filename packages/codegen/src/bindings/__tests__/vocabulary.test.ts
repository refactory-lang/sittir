import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readVocabulary } from '../index.ts';

const vocabularyIn = async (...lines: readonly string[]) => {
	const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
	writeFileSync(join(dir, 'declaration.ts'), [...lines, ''].join('\n'));
	try {
		return await readVocabulary(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
};

describe('readVocabulary', () => {
	it('reads the parent a heritage clause names through V. however the reference is written', async () => {
		const vocabulary = await vocabularyIn(
			'export interface Declaration<G> {',
			"\treadonly $kind: 'declaration';",
			'\treadonly name: string;',
			'}',
			'export interface Generic<G> extends SubKindOf<V.Declaration<G>> {',
			"\treadonly $kind: 'declaration.generic';",
			'}',
			'export interface Parenthesized<G> extends SubKindOf<(V.Declaration<G>)> {',
			"\treadonly $kind: 'declaration.parenthesized';",
			'}',
			'export interface Bare<G> extends V.Declaration {',
			"\treadonly $kind: 'declaration.bare';",
			'}'
		);
		for (const path of ['declaration.generic', 'declaration.parenthesized', 'declaration.bare']) {
			expect(vocabulary.kinds.get(path)?.parent, path).toBe('declaration');
			expect([...vocabulary.members(path).keys()], path).toEqual(['name']);
		}
	});

	it('reads an interface or namespace however it is exported or declared', async () => {
		const vocabulary = await vocabularyIn(
			"export declare interface Declared<G> { readonly $kind: 'declared'; }",
			"export default interface Defaulted<G> { readonly $kind: 'defaulted'; }",
			"declare interface Ambient<G> { readonly $kind: 'ambient'; }",
			"export declare namespace Exported { export interface Inner<G> { readonly $kind: 'exported.inner'; } }",
			"declare namespace Ambient { interface Inner<G> { readonly $kind: 'ambient.inner'; } }",
			"namespace Bare { interface Inner<G> { readonly $kind: 'bare.inner'; } }"
		);
		expect([...vocabulary.kinds].map(([path, kind]) => [path, kind.name])).toEqual([
			['declared', 'Declared'],
			['defaulted', 'Defaulted'],
			['ambient', 'Ambient'],
			['exported.inner', 'Exported.Inner'],
			['ambient.inner', 'Ambient.Inner'],
			['bare.inner', 'Bare.Inner']
		]);
	});
});
