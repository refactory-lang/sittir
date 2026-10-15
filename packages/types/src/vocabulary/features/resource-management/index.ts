export type * from './clause.ts';
export type * from './expression.ts';
export type * from './statement.ts';

/** Resource management: a scope that releases what it acquires. */
export interface ResourceManagement {
	readonly 'resource-management': true;
}
