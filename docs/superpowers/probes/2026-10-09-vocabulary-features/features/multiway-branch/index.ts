export type * from './clause.ts';
export type * from './statement.ts';

/** Multiway branch: a switch on a value to the case it equals. */
export interface MultiwayBranch {
	readonly 'multiway-branch': true;
}
