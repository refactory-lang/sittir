export type * from './clause.ts';
export type * from './statement.ts';

import type { ResourceManagement } from '../index.ts';

/** Resource statements: a block that acquires resources and releases them when it exits. */
export interface ResourceStatements extends ResourceManagement {
	readonly 'resource-statements': true;
}
