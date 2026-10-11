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
});
