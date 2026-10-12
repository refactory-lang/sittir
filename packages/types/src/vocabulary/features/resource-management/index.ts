export * from './clause.ts';
export * from './expression.ts';
export * from './statement.ts';

/** Resource management: a scope that releases what it acquires. */
export interface ResourceManagement {
	readonly 'resource-management': true;
}
