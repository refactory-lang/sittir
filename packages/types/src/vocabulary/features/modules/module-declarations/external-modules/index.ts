export type * from './declaration.ts';

import type { ModuleDeclarations } from '../index.ts';
import type { AmbientDeclarations } from '../../../type-annotations/ambient-declarations/index.ts';

/** External modules: an ambient module declared by the name it is imported as. */
export interface ExternalModules extends ModuleDeclarations, AmbientDeclarations {
	readonly 'external-modules': true;
}
