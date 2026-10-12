export type * from './clause.ts';
export type * from './pattern.ts';
export type * from './statement.ts';

/** Match expressions: branching on a value by patterns and guards. */
export interface MatchExpressions {
	readonly 'match-expressions': true;
}
