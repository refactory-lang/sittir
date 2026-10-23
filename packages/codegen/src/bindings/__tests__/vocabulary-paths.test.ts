import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { vocabularyPaths } from '@sittir/common/portable';
import { byCodepoint, readVocabulary, VOCABULARY_DIR } from '../index.ts';
import { emitVocabularyPaths, VOCABULARY_PATHS_FILE } from '../vocabulary-paths.ts';

const vocabulary = await readVocabulary(VOCABULARY_DIR);
const sorted = [...vocabulary.kinds.keys()].sort(byCodepoint);

describe('vocabularyPaths', () => {
	it('lists every vocabulary kind path once, sorted', () => {
		expect(vocabularyPaths).toEqual(sorted);
	});

	it('writes one path per line, in sorted order', () => {
		const lines = emitVocabularyPaths(vocabulary).split('\n');
		const quoted = lines.flatMap((line) => /^\t'([^']*)',?$/.exec(line)?.[1] ?? []);
		expect(quoted).toEqual(sorted);
	});

	it('the committed file is what the emitter writes', () => {
		expect(readFileSync(VOCABULARY_PATHS_FILE, 'utf8')).toBe(emitVocabularyPaths(vocabulary));
	});

	it('is frozen', () => {
		expect(Object.isFrozen(vocabularyPaths)).toBe(true);
	});
});
