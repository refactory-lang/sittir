export type * from './clause.ts';
export type * from './declaration.ts';
export type * from './element.ts';
export type * from './expression.ts';
export type * from './type.ts';

/** Type annotations: declarations state the types of their values, written as type expressions. */
export interface TypeAnnotations {
	readonly 'type-annotations': true;
}
