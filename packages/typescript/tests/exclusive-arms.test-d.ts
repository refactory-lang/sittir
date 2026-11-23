/**
 * Type-level pins: a binary expression is its operands and operator, or its `in`
 * arm. The arms exclude each other, an empty config is refused, and each arm
 * alone compiles. A kind whose arms differ only in flags stays one config.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import type * as T from '../src/types.ts';

declare const inArm: NonNullable<T.BinaryExpression.Config['binaryExpressionIn']>;
declare const looseIn: NonNullable<T.BinaryExpression.LooseConfig['binaryExpressionIn']>;

export function eachArmAloneCompiles(): void {
	const operands: T.BinaryExpression.LooseArgs = [{ left: 'a', operator: '+', right: 'b' }];
	const inArmOnly: T.BinaryExpression.LooseArgs = [{ binaryExpressionIn: looseIn }];
	void operands;
	void inArmOnly;
}

export function theOperandsAreRequiredTogether(): void {
	// @ts-expect-error left alone is neither arm
	const left: T.BinaryExpression.LooseArgs = [{ left: 'a' }];
	// @ts-expect-error the operator and right operand belong with the left
	const operator: T.BinaryExpression.LooseArgs = [{ left: 'a', operator: '+' }];
	void left;
	void operator;
}

export function bothArmsAreAnError(): void {
	// @ts-expect-error the operands and the `in` arm exclude each other
	const both: T.BinaryExpression.LooseArgs = [{ left: 'a', operator: '+', right: 'b', binaryExpressionIn: looseIn }];
	void both;
}

export function anEmptyConfigIsAnError(): void {
	// @ts-expect-error a binary expression is one of its arms
	const empty: T.BinaryExpression.LooseArgs = [{}];
	// @ts-expect-error a binary expression is one of its arms
	const none: T.BinaryExpression.LooseArgs = [];
	void empty;
	void none;
	void inArm;
}

export function theStrictRowHasTheSameArms(): void {
	// @ts-expect-error left alone is neither arm
	const left: T.BinaryExpression.BuildArgs = [{ left: undefined as never }];
	void left;
}

export function aKindWhoseArmsDifferOnlyInFlagsStaysOneConfig(): void {
	const flags: T.PublicFieldDefinitionPlain.LooseArgs = [{ name: 'x', static: true, abstract: true, readonly: true }];
	void flags;
}
