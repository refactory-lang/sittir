export type * from './declaration.ts';
export type * from './element.ts';
export type * from './pattern.ts';

/** Computed keys: a property, field or method named by an expression evaluated at run time. */
export interface ComputedKeys {
	readonly 'computed-keys': true;
}
