import type { Vocabulary } from '../../bindings/vocabulary.ts';

export const EMPTY_VOCABULARY: Vocabulary = {
	kinds: new Map(),
	flags: new Set(),
	synonyms: { levels: new Map(), flags: new Map() },
	members: () => new Map(),
	featuresOf: () => new Set(),
	composedAs: () => EMPTY_VOCABULARY
};
