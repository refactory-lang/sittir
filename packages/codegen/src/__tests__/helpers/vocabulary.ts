import type { Vocabulary } from '../../bindings/vocabulary.ts';

export const EMPTY_VOCABULARY: Vocabulary = {
	kinds: new Map(),
	namespaces: new Set(),
	shortened: new Set(),
	flags: new Set(),
	synonyms: { levels: new Map(), flags: new Map() },
	slots: () => new Map(),
	featuresOf: () => new Set(),
	composedAs: () => EMPTY_VOCABULARY
};
