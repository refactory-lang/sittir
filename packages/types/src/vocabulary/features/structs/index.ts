export type * from './declaration.ts';
export type * from './element.ts';
export type * from './expression.ts';
export type * from './pattern.ts';

/** Structs: value types declared by their fields, built and destructured by naming them. */
export interface Structs {
	readonly structs: true;
}
