/**
 * Type-level pins: a member whose body is a choice of arms, one of them only `;`, builds with or without its body, and
 * a yield statement with or without its expression.
 *
 * Compile-time only: `pnpm --filter @sittir/csharp type-check`.
 */

import type * as T from '../src/types.ts';

declare const returns: NonNullable<T.MethodDeclaration.LooseConfig['returns']>;
declare const name: NonNullable<T.MethodDeclaration.LooseConfig['name']>;
declare const parameters: NonNullable<T.MethodDeclaration.LooseConfig['parameters']>;
declare const body: NonNullable<T.MethodDeclaration.LooseConfig['body']>;

export function aMethodBuildsWithOrWithoutABody(): void {
	const bodiless: T.MethodDeclaration.LooseArgs = [{ returns, name, parameters }];
	const withBody: T.MethodDeclaration.LooseArgs = [{ returns, name, parameters, body }];
	void bodiless;
	void withBody;
}

declare const expression: NonNullable<T.YieldStatement.LooseConfig['expression']>;

export function aYieldBuildsWithOrWithoutAnExpression(): void {
	const yieldBreak: T.YieldStatement.LooseArgs = [];
	const yieldReturn: T.YieldStatement.LooseArgs = [expression];
	void yieldBreak;
	void yieldReturn;
}
