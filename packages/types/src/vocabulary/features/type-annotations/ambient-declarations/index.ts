import type { TypeAnnotations } from '../index.ts';
export type * from './declaration.ts';

/** Ambient declarations: declaring what exists without defining it. */
export interface AmbientDeclarations extends TypeAnnotations {
	readonly 'ambient-declarations': true;
}
