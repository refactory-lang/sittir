import { engineOf } from '../engine-scope.ts';
import { classifierOf, hasKind } from './classify.ts';
import { portablePathHasFacts } from './facts.ts';
import type { PortableRows } from '@sittir/types';
import { portableTrees, type LanguageGuard, type PortableGuard, type PortableGuardTree } from './tree.ts';
import { vocabularyPaths } from './vocabulary-paths.ts';

type VocabularyPath = (typeof vocabularyPaths)[number];

export { classifierOf, hasKind, type PortableClassifier } from './classify.ts';
export { portablePathHasFacts } from './facts.ts';
export {
	portableTrees,
	type LanguageGuard,
	type PortableGuard,
	type PortableGuardTree,
	type PortableKind,
	type PortableKindTree
} from './tree.ts';
export { vocabularyPaths } from './vocabulary-paths.ts';

type Node = { readonly $type: number };

const readsAs = (rows: PortableRows, path: string, value: Node | number): boolean => {
	const admitted = rows.table.paths[path];
	const kind = typeof value === 'number' ? value : value.$type;
	if (admitted === undefined || !admitted.ids.includes(kind)) return false;
	return admitted.exact || portablePathHasFacts(path, classifierOf(rows)(value));
};

const guardOf =
	(path: string): PortableGuard =>
	(node): node is Node => {
		if (!hasKind(node)) return false;
		const rows = engineOf(node)?.portable;
		return rows !== undefined && readsAs(rows, path, node);
	};

const rowsByLoad = new WeakMap<object, PortableRows>();

/**
 * Records a bound grammar's rows against the descriptor function that loads them, so the language's portable guards can read a
 * bare kind id. The engine calls it when a language loads.
 */
export function registerPortableRows(load: object, rows: PortableRows): void {
	rowsByLoad.set(load, rows);
}

/** A language whose portable guards read its kind ids: its name, and the function that loads it, which its copies share. */
export interface PortableLanguage {
	readonly name: string;
	readonly load: object;
}

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
	if (view === undefined) views.set(language, (view = portableTrees(vocabularyPaths, (path) => languageGuardOf(language, path)).is));
	return view;
}

const languageGuardOf =
	(language: PortableLanguage, path: string): LanguageGuard =>
	(value): value is Node | number => {
		if (typeof value === 'number') {
			const rows = rowsByLoad.get(language.load);
			if (rows === undefined)
				throw new Error(`${language.name}: a portable guard given a kind id reads the language's rows; create an engine for ${language.name} first`);
			return readsAs(rows, path, value);
		}
		if (!hasKind(value)) return false;
		const engine = engineOf(value);
		return engine?.language === language && engine.portable !== undefined && readsAs(engine.portable, path, value);
	};
