export type * from './statement.ts';

import type { LabeledControlFlow } from '../index.ts';

/** Loop labels: a loop or block named by a label on itself. */
export interface LoopLabels extends LabeledControlFlow {
	readonly 'loop-labels': true;
}
