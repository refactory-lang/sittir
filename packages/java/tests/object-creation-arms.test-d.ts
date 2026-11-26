/**
 * Type-level pins: a qualified object creation takes a class body with or without type arguments, as both of its arms
 * do.
 *
 * Compile-time only: `pnpm --filter @sittir/java type-check`.
 */

import type * as T from '../src/types.ts';

declare const primary: NonNullable<T.ObjectCreationExpressionArm.LooseConfig['primaryExpression']>;
declare const typeArguments: NonNullable<T.ObjectCreationExpressionArm.LooseConfig['typeArguments']>;
declare const type: NonNullable<T.ObjectCreationExpressionArm.LooseConfig['type']>;
declare const args: NonNullable<T.ObjectCreationExpressionArm.LooseConfig['arguments']>;
declare const body: NonNullable<T.ObjectCreationExpressionArm.LooseConfig['classBody']>;

export function eachArmTakesAClassBody(): void {
	const withTypeArguments: T.ObjectCreationExpressionArm.LooseArgs = [
		{ primaryExpression: primary, typeArguments, type, arguments: args, classBody: body }
	];
	const withoutTypeArguments: T.ObjectCreationExpressionArm.LooseArgs = [
		{ primaryExpression: primary, type, arguments: args, classBody: body }
	];
	void withTypeArguments;
	void withoutTypeArguments;
}
