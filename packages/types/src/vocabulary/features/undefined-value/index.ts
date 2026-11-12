export type * from './literal.ts';

import type { LiteralFacets } from '../literal-facets/index.ts';

/** Undefined values: `undefined` as a value apart from `null`. */
export interface UndefinedValue extends LiteralFacets {
	readonly 'undefined-value': true;
}
