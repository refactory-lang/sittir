import type { MatchExpressions } from '../match-expressions/index.ts';
import type { TuplePatterns } from '../destructuring/tuple-patterns/index.ts';

/** Pattern matching: match expressions and tuple patterns. */
export interface PatternMatching extends MatchExpressions, TuplePatterns {
	readonly 'pattern-matching': true;
}
