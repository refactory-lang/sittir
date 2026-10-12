export * from './clause.ts';
export * from './pattern.ts';
export * from './statement.ts';

/** Match expressions: branching on a value by patterns and guards. */
export interface MatchExpressions {
	readonly 'match-expressions': true;
}
