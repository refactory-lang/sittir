export type * from './identifier.ts';
export type * from './statement.ts';

/** Labeled control flow: labels on loops and blocks, which break and continue name. */
export interface LabeledControlFlow {
	readonly 'labeled-control-flow': true;
}
