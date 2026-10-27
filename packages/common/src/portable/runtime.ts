import { inLanguage } from '../language.ts';
import { flagHolds, readsAs } from './classify.ts';
import { languageGuardOf, type PortableLanguage } from './language-guard.ts';
import { portableTrees, type LanguageGuard, type PortableGuardTree } from './tree.ts';
import { vocabularyFlags, vocabularyPaths } from './vocabulary-paths.ts';

const flagOf = new Map<string, readonly [path: string, flag: string]>(vocabularyFlags.map(([path, segment, flag]) => [`${path}.${segment}`, [path, flag]]));

const runtimeTrees = new WeakMap<PortableLanguage, PortableGuardTree<string, LanguageGuard>>();

export function portableRuntimeTree(language: PortableLanguage): PortableGuardTree<string, LanguageGuard> {
	let tree = runtimeTrees.get(language);
	if (tree === undefined) {
		const ofLanguage = inLanguage(language);
		const guardOf = (leaf: string): LanguageGuard => {
			const flagged = flagOf.get(leaf);
			if (flagged === undefined) return languageGuardOf(language, ofLanguage, (rows, value) => readsAs(rows, leaf, value));
			const [path, flag] = flagged;
			return languageGuardOf(language, ofLanguage, (rows, value) => readsAs(rows, path, value) && flagHolds(rows, value, flag));
		};
		runtimeTrees.set(language, (tree = portableTrees<string, LanguageGuard>([...vocabularyPaths, ...flagOf.keys()], guardOf).is));
	}
	return tree;
}
