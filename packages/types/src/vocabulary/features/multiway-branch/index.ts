export * from './clause.ts';
export * from './statement.ts';

/** Multiway branch: a switch on a value to the case it equals. */
export interface MultiwayBranch {
	readonly 'multiway-branch': true;
}
