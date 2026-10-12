export * from './clause.ts';
export * from './declaration.ts';
export * from './element.ts';
export * from './expression.ts';
export * from './type.ts';

/** Type annotations: declarations state the types of their values, written as type expressions. */
export interface TypeAnnotations {
	readonly 'type-annotations': true;
}
