export type * from './declaration.ts';

import type { Modules } from '../index.ts';

/** Module declarations: a module declared inside a file. */
export interface ModuleDeclarations extends Modules {
	readonly 'module-declarations': true;
}
