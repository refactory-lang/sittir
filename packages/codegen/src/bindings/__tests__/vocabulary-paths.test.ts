import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { vocabularyNamespaces, vocabularyPaths } from '@sittir/common/portable';
import { byCodepoint, readVocabulary, VOCABULARY_DIR } from '../index.ts';
import { emitVocabularyPaths, VOCABULARY_PATHS_FILE } from '../vocabulary-paths.ts';

const vocabulary = await readVocabulary(VOCABULARY_DIR);
const sorted = [...vocabulary.kinds.keys()].sort(byCodepoint);

describe('vocabularyPaths', () => {
	it('lists every vocabulary kind path once, sorted', () => {
		expect(vocabularyPaths).toEqual(sorted);
	});

	it('lists every namespace of the vocabulary once, sorted', () => {
		expect(vocabularyNamespaces).toEqual([...vocabulary.namespaces].sort(byCodepoint));
	});

	it('writes one path per line, in sorted order, and then one namespace per line', () => {
		const emitted = emitVocabularyPaths(vocabulary);
		const listed = (name: string): string[] => {
			const block = emitted.slice(emitted.indexOf(`export const ${name} =`));
			return block.slice(0, block.indexOf('] as const);')).split('\n').flatMap((line) => /^\t'([^']*)',?$/.exec(line)?.[1] ?? []);
		};
		expect(listed('vocabularyPaths')).toEqual(sorted);
		expect(listed('vocabularyNamespaces')).toEqual([...vocabulary.namespaces].sort(byCodepoint));
	});

	it('the committed file is what the emitter writes', () => {
		expect(readFileSync(VOCABULARY_PATHS_FILE, 'utf8')).toBe(emitVocabularyPaths(vocabulary));
	});

	it('is frozen', () => {
		expect(Object.isFrozen(vocabularyPaths)).toBe(true);
	});
});
