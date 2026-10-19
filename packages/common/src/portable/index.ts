import { engineOf } from '../engine-scope.ts';
import { classifierOf, hasKind } from './classify.ts';
import { portablePathHasFacts } from './facts.ts';
import { portableTrees, type PortableGuard } from './tree.ts';
import { vocabularyPaths } from './vocabulary-paths.ts';

export { classifierOf, hasKind, type PortableClassifier } from './classify.ts';
export { portablePathHasFacts } from './facts.ts';
export {
	portableTrees,
	type PortableGuard,
	type PortableGuardTree,
	type PortableKind,
	type PortableKindTree
} from './tree.ts';
export { vocabularyPaths } from './vocabulary-paths.ts';

const guardOf =
	(path: string): PortableGuard =>
	(node): node is { readonly $type: number } => {
		if (!hasKind(node)) return false;
		const rows = engineOf(node)?.portable;
		const admitted = rows?.table.paths[path];
		if (rows === undefined || admitted === undefined || !admitted.ids.includes(node.$type)) return false;
		return admitted.exact || portablePathHasFacts(path, classifierOf(rows)(node));
	};

/**
 * The portable kinds and guards, one per vocabulary path, the same objects for every language.
 *
 * A guard takes a node alone and reads it by the rows of the language whose engine stamped it: it holds when the node's kind is
 * among the path's kinds and the node reads as the path or a path holding all of its facts. It answers false for a value no
 * engine stamped and for a node of a grammar without bindings.
 *
 * It also answers false for a bare kind id, which is how a keyword leaf reads until parsed units carry identity: rust's primitive
 * types, `true` and `false`, `self`, `super`, `crate`, `()`, `!`, `_` and `..`; typescript's predefined types, `unique symbol`,
 * `this`, `super`, `null`, `undefined` and the visibility keywords; python's `True`, `False`, `None`, `...`, `pass`, `break` and
 * `continue`; and macro fragment specifiers and `;` as an empty statement.
 *
 * Until placement-dependent readings are restated as kinds of their own, a node reads by its first entry that does not depend
 * on where it sits. So a method in an impl, trait or class body reads as a function, not a method; a closure parameter reads as
 * no parameter; `crate` visibility reads as no visibility; and a python static method reads as a function.
 */
export const portable = portableTrees(vocabularyPaths, guardOf);
