export type * from './declaration.ts';
export type * from './expression.ts';
export type * from './pattern.ts';
export type * from './type.ts';

/** References: a value that refers to a place, taken and followed. */
export interface References {
	readonly references: true;
}
