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

/** The portable kinds and guards, one per vocabulary path, shared by every language. */
export const portable = portableTrees(vocabularyPaths, () => () => false);
