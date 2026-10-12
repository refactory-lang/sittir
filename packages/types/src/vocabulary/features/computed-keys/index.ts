export * from './declaration.ts';
export * from './element.ts';
export * from './pattern.ts';

/** Computed keys: a property, field or method named by an expression evaluated at run time. */
export interface ComputedKeys {
	readonly 'computed-keys': true;
}
