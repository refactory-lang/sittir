export type * from './declaration.ts';
export type * from './expression.ts';

/** Nominal conformance: a type declares the interfaces or traits it implements. */
export interface InterfaceConformance {
	readonly 'interface-conformance': true;
}
