import { portableTrees } from './tree.ts';
import { vocabularyPaths } from './vocabulary-paths.ts';

export {
	portableTrees,
	type PortableGuard,
	type PortableGuardTree,
	type PortableKind,
	type PortableKindTree
} from './tree.ts';
export { vocabularyPaths } from './vocabulary-paths.ts';

const unclassified = (): never => {
	throw new Error('portable guards need node classification, which no engine provides yet');
};

/** The portable kinds, one per vocabulary path, shared by every language. */
export const portable = Object.freeze({ kinds: portableTrees(vocabularyPaths, () => unclassified).kinds });
