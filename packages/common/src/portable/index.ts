import { engineOf } from '../engine-scope.ts';
import { inLanguage } from '../language.ts';
import { hasKind, readsAs } from './classify.ts';
import { languageGuardOf, type PortableLanguage } from './language-guard.ts';
import { portableTrees, type LanguageGuard, type PortableGuard, type PortableGuardTree } from './tree.ts';
import { vocabularyPaths } from './vocabulary-paths.ts';

/** A vocabulary path: one of {@link vocabularyPaths}. */
export type VocabularyPath = (typeof vocabularyPaths)[number];

/**
 * Every vocabulary path, mapped to the kind ids a bound grammar reads at or under it, or to `never` where it reads none.
 *
 * @typeParam Ids - A bound grammar's kind ids per path it reads (its `PortableIds`); `{}` for a grammar without bindings.
 */
export type PortableQueryIds<Ids> = { readonly [P in VocabularyPath]: P extends keyof Ids ? Ids[P] : never };

export { classifierOf, hasKind, type PortableClassifier } from './classify.ts';
export { Flags } from './flags.ts';
export { registerPortableRows, type PortableLanguage } from './language-guard.ts';
export { portablePathHasFacts } from './facts.ts';
export { portableTrees, type LanguageGuard, type PortableGuard, type PortableGuardTree, type PortableKindTree } from './tree.ts';
export type { PortableKind } from '@sittir/types';
export { vocabularyPaths } from './vocabulary-paths.ts';

type Node = { readonly $type: number };

const guardOf =
	(path: string): PortableGuard =>
	(node): node is Node => {
		if (!hasKind(node)) return false;
		const rows = engineOf(node)?.portable;
		return rows !== undefined && readsAs(rows, path, node);
	};

const views = new WeakMap<PortableLanguage, PortableGuardTree<VocabularyPath, LanguageGuard>>();

/**
 * The portable kinds and guards, one per vocabulary path, the same objects for every language.
 *
 * A guard takes a node alone and reads it by the rows of the language whose engine stamped it: it holds when the node's kind is
 * among the path's kinds and the node reads as the path or a path holding all of its facts. It answers false for a value no
 * engine stamped and for a node of a grammar without bindings.
 *
 * It answers false for a bare kind id, since a number names no language. A keyword leaf (rust's `u8`, typescript's `this`,
 * python's `True`) is a kind id, so it is read through a language's own guards instead ({@link portableGuardsOf}, the
 * descriptor's `is.portable`).
 *
 * Until placement-dependent readings are restated as kinds of their own, a node reads by its first entry that does not depend
 * on where it sits. So a method in an impl, trait or class body reads as a function, not a method; a closure parameter reads as
 * no parameter; `crate` visibility reads as no visibility; and a python static method reads as a function.
 */
export const portable = portableTrees(vocabularyPaths, guardOf);

/**
 * A language's portable guards: the shared tree's paths, each guard reading a node of the language or a bare kind id of it.
 *
 * A node of the language reads as the shared guard reads it; a node of another language, or one no engine of this language
 * stamped, answers false. A kind id reads through the language's rows, by its kind and its fixed text, so a keyword leaf
 * (rust's `u8`, typescript's `this`, python's `True`) classifies. The same view is returned for the same language object.
 *
 * The language's generated types admit only its own nodes and kind ids, but a value typed as a plain `number` still compiles.
 *
 * @param language - The descriptor the guards belong to; a copy of a descriptor gets its own view and finds the same rows.
 * @returns The guard tree, with the same keys as `portable.is`.
 * @throws When a guard is given a kind id before an engine of the language has loaded its rows.
 */
export function portableGuardsOf(language: PortableLanguage): PortableGuardTree<VocabularyPath, LanguageGuard> {
	let view = views.get(language);
	if (view === undefined) {
		const ofLanguage = inLanguage(language);
		views.set(language, (view = portableTrees(vocabularyPaths, (path) => languageGuardOf(language, ofLanguage, (rows, value) => readsAs(rows, path, value))).is));
	}
	return view;
}
