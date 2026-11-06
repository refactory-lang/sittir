export type * from './expression.ts';

import type { Tuples } from '../index.ts';

/** Unit values: the empty tuple as a value. */
export interface UnitValues extends Tuples {
	readonly 'unit-values': true;
}
