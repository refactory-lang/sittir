import type { Modules } from '../index.ts';
export type * from './declaration.ts';

/** Module declarations: a module declared inside a file. */
export interface ModuleDeclarations extends Modules {
	readonly 'module-declarations': true;
}
