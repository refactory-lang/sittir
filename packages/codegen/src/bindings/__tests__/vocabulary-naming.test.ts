import { describe, expect, it } from 'vitest';
import { readVocabulary, VOCABULARY_DIR } from '../index.ts';

const vocabulary = await readVocabulary(VOCABULARY_DIR);
const camel = (segment: string): string => segment.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const misnamed = [...vocabulary.kinds]
	.flatMap(([path, kind]) => {
		const last = camel(path.split('.').at(-1) ?? path);
		return [...kind.own].filter(([name, member]) => member.excluded !== true && (name === last || name === 'content' || name === 'contents')).map(([name]) => `${path}.${name}`);
	})
	.sort();

const contentTextValues = ['literal.character.content'];

describe('a vocabulary member name', () => {
	it('never repeats its kind, and is content only where a character literal names its text', () => {
		expect(misnamed).toEqual(contentTextValues);
	});
});
