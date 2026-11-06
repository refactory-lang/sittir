export type * from './pattern.ts';

import type { MatchExpressions } from '../index.ts';

/** Mapping patterns: destructuring a mapping by its keys. */
export interface MappingPatterns extends MatchExpressions {
	readonly 'mapping-patterns': true;
}
