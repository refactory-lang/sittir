export type * from './pattern.ts';

import type { Destructuring } from '../index.ts';
import type { MappingPatterns } from '../../match-expressions/mapping-patterns/index.ts';

/** Python's destructuring: bare tuple patterns and the rest of a mapping. */
export interface PythonDestructuring extends Destructuring, MappingPatterns {
	readonly 'python-destructuring': true;
}
