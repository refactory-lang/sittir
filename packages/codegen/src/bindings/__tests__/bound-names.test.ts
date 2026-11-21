import { describe, expect, it } from 'vitest';
import { boundKindName } from '../names.ts';
import { boundNameCollisions, readVocabulary, vocabularyNamespaces } from '../vocabulary.ts';
import { VOCABULARY_DIR } from '../facts.ts';

const MEMBER = ['declaration', 'declaration.member.method', 'declaration.member.method.signature', 'statement', 'statement.loop', 'statement.loop.counted'];

describe('a bound name leaves out a segment that is no kind', () => {
	const namespaces = vocabularyNamespaces(MEMBER);

	it('finds the namespaces: the prefixes of kind paths that are no kind', () => {
		expect([...namespaces]).toEqual(['declaration.member']);
	});

	it('binds declaration.member.method as method_declaration', () => {
		expect(boundKindName('declaration.member.method', false, namespaces)).toBe('method_declaration');
		expect(boundKindName('declaration.member.method', true, namespaces)).toBe('_method_declaration');
		expect(boundKindName('declaration.member.method.signature', false, namespaces)).toBe('signature_method_declaration');
	});

	it('keeps a segment whose path is a kind, since what lies beneath refines it', () => {
		expect(boundKindName('statement.loop.counted', false, namespaces)).toBe('counted_loop_statement');
	});

	it('keeps a path with no namespace as its segments reversed', () => {
		expect(boundKindName('declaration.function.signature', false, new Set())).toBe('signature_function_declaration');
	});
});

describe('a shortened name another kind already has', () => {
	it('is a collision naming both kinds, on the kind whose name was shortened', () => {
		const kinds = ['declaration', 'declaration.method', 'declaration.member.method', 'declaration.member.field'];
		expect(boundNameCollisions(kinds, vocabularyNamespaces(kinds))).toEqual([{ name: 'method_declaration', kind: 'declaration.member.method', other: 'declaration.method' }]);
	});

	it('names neither when no two kinds share a name', () => {
		expect(boundNameCollisions(MEMBER, vocabularyNamespaces(MEMBER))).toEqual([]);
	});

	it('never happens across the vocabulary', async () => {
		const vocabulary = await readVocabulary(VOCABULARY_DIR);
		expect(boundNameCollisions(vocabulary.kinds.keys(), vocabulary.namespaces)).toEqual([]);
	});
});
