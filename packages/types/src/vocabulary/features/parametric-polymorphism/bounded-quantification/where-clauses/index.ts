export type * from './clause.ts';
export type * from './declaration.ts';
export type * from './element.ts';

import type { BoundedQuantification } from '../index.ts';

/** Where clauses: bounds on type parameters stated after the signature, apart from the parameters. */
export interface WhereClauses extends BoundedQuantification {
	readonly 'where-clauses': true;
}
