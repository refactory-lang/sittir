export type * from './declaration.ts';
export type * from './modifier.ts';
export type * from './statement.ts';

import type { Visibility } from '../index.ts';
import type { Structs } from '../../struct-patterns/structs/index.ts';
import type { Enumerations } from '../../enumerations/index.ts';
import type { AlgebraicDataTypes } from '../../enumerations/algebraic-data-types/index.ts';
import type { Traits } from '../../interfaces/traits/index.ts';
import type { ModuleDeclarations } from '../../modules/module-declarations/index.ts';
import type { UntaggedUnions } from '../../untagged-unions/index.ts';
import type { ImportTrees } from '../../modules/import-trees/index.ts';

/** Module visibility: an access level on an item, scoped to a module path. */
export interface ModuleVisibility extends Visibility, Structs, Enumerations, AlgebraicDataTypes, Traits, ModuleDeclarations, UntaggedUnions, ImportTrees {
	readonly 'module-visibility': true;
}
