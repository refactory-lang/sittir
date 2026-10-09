import type { TypeAnnotations } from '../index.ts';
export type * from './declaration.ts';

/** Structural conformance: a type conforms by the members it has, and call, construct and index signatures describe them. */
export interface StructuralConformance extends TypeAnnotations {
	readonly 'structural-conformance': true;
}
