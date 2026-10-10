import type { OpenTypeExtension } from '../index.ts';
export type * from './declaration.ts';

/** Typeclasses: conformance to an interface declared away from the type. */
export interface Typeclasses extends OpenTypeExtension {
	readonly typeclasses: true;
}
