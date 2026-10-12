export * from './declaration.ts';
export * from './expression.ts';
export * from './pattern.ts';
export * from './type.ts';

/** References: a value that refers to a place, taken and followed. */
export interface References {
	readonly references: true;
}
