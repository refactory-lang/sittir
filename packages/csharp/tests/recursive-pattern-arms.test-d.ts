/**
 * Type-level pins: every arm of a recursive pattern that holds a designation builds, whichever clauses it holds.
 *
 * Compile-time only: `pnpm --filter @sittir/csharp type-check`.
 */

import type * as T from '../src/types.ts';

declare const type: NonNullable<T.RecursivePattern.LooseConfig['type']>;
declare const positional: NonNullable<T.RecursivePattern.LooseConfig['positionalPatternClause']>;
declare const property: NonNullable<T.RecursivePattern.LooseConfig['propertyPatternClause']>;
declare const designation: NonNullable<T.RecursivePattern.LooseConfig['variableDesignation']>;

export function everyArmWithADesignationCompiles(): void {
	const typed: T.RecursivePattern.LooseArgs = [
		{ type, positionalPatternClause: positional, variableDesignation: designation }
	];
	const positionalOnly: T.RecursivePattern.LooseArgs = [
		{ positionalPatternClause: positional, variableDesignation: designation }
	];
	const typedProperty: T.RecursivePattern.LooseArgs = [
		{ type, propertyPatternClause: property, variableDesignation: designation }
	];
	const bothClauses: T.RecursivePattern.LooseArgs = [
		{ positionalPatternClause: positional, propertyPatternClause: property, variableDesignation: designation }
	];
	const propertyOnly: T.RecursivePattern.LooseArgs = [
		{ propertyPatternClause: property, variableDesignation: designation }
	];
	void typed;
	void positionalOnly;
	void typedProperty;
	void bothClauses;
	void propertyOnly;
}

declare const strictPositional: NonNullable<T.RecursivePattern.Config['positionalPatternClause']>;
declare const strictDesignation: NonNullable<T.RecursivePattern.Config['variableDesignation']>;

export function aStrictBuildOfAPositionalClauseAndADesignationCompiles(): void {
	const args: T.RecursivePattern.BuildArgs = [
		{ positionalPatternClause: strictPositional, variableDesignation: strictDesignation }
	];
	void args;
}
