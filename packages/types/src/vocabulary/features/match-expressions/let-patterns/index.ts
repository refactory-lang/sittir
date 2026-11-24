export type * from './clause.ts';
export type * from './expression.ts';

import type { MatchExpressions } from '../index.ts';

/** Let patterns: a condition that matches a pattern and binds its parts. */
export interface LetPatterns extends MatchExpressions {
	readonly 'let-patterns': true;
}
