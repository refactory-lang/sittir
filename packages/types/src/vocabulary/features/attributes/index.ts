export * from './attribute.ts';
export * from './clause.ts';
export * from './declaration.ts';
export * from './element.ts';
export * from './expression.ts';
export * from './identifier.ts';

/** Attributes: annotations on a declaration that are not evaluated. */
export interface Attributes {
	readonly attributes: true;
}
