export * from './clause.ts';
export * from './declaration.ts';
export * from './expression.ts';

/** Nominal conformance: a class declares the interfaces it implements. */
export interface InterfaceConformance {
	readonly 'interface-conformance': true;
}
