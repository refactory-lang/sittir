export type * from './clause.ts';
export type * from './declaration.ts';
export type * from './expression.ts';

/** Nominal conformance: a class declares the interfaces it implements. */
export interface InterfaceConformance {
	readonly 'interface-conformance': true;
}
