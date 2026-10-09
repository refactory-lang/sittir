export type * from './attribute.ts';
export type * from './clause.ts';
export type * from './declaration.ts';
export type * from './element.ts';
export type * from './expression.ts';
export type * from './identifier.ts';

/** Attributes: annotations on a declaration that are not evaluated. */
export interface Attributes {
	readonly attributes: true;
}
