export type * from './statement.ts';

import type { LabeledControlFlow } from '../index.ts';

/** Labeled statements: a statement named by a label, for `break` and `continue` to name. */
export interface LabeledStatements extends LabeledControlFlow {
	readonly 'labeled-statements': true;
}
