export type * from './clause.ts';
export type * from './declaration.ts';
export type * from './statement.ts';

import type { AsyncAwait } from '../index.ts';
import type { Comprehensions } from '../../comprehensions/index.ts';
import type { ResourceStatements } from '../../resource-management/resource-statements/index.ts';
import type { Classes } from '../../methods/classes/index.ts';

/** Asynchronous contexts: `async` on comprehensions, constructors and resource statements. */
export interface AsyncContexts extends AsyncAwait, Comprehensions, ResourceStatements, Classes {
	readonly 'async-contexts': true;
}
