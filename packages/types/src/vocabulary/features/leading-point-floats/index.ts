export type * from './literal.ts';

import type { LiteralFacets } from '../literal-facets/index.ts';

/** Leading-point floats: a float written without its integer part. */
export interface LeadingPointFloats extends LiteralFacets {
	readonly 'leading-point-floats': true;
}
