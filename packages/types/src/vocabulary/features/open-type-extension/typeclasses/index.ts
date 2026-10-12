export type * from './declaration.ts';

import type { OpenTypeExtension } from '../index.ts';

/** Typeclasses: conformance to an interface declared away from the type. */
export interface Typeclasses extends OpenTypeExtension {
	readonly typeclasses: true;
}
