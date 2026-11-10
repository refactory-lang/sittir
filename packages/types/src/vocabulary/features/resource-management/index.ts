export type * from './expression.ts';

/** Resource management: a scope that releases what it acquires. */
export interface ResourceManagement {
	readonly 'resource-management': true;
}
