/**
 * Compile-time checks on the base vocabulary from a consumer's seat: an
 * ordinary structure satisfies its base interface with only the members every
 * claiming grammar carries, and a refinement pins what it says it pins. A
 * member only a refinement carries must never be required on the ancestor.
 */

import type { BaseContext, Declaration, Expression, Statement } from '../src/vocabulary/index.ts';

// An ordinary function needs a name and parameters, nothing accessor-shaped.
export const fn: Declaration.Function<BaseContext> = { name: {}, parameters: [] };

// A method without an accessor kind is a plain method.
export const method: Declaration.Method<BaseContext> = { name: {}, parameters: [] };

// A getter pins its accessor kind.
export const getter: Declaration.Getter<BaseContext> = { name: {}, parameters: [], accessorKind: 'get' };
// @ts-expect-error a getter's accessor kind is 'get'
export const notGetter: Declaration.Getter<BaseContext> = { name: {}, parameters: [], accessorKind: 'set' };

// A call carries no operator; a binary expression carries no arguments.
export const call: Expression.Call<BaseContext> = { function: {}, arguments: [] };
export const binary: Expression.Binary<BaseContext> = { left: {}, right: {} };

// A refinement pins its operator.
export const add: Expression.Binary.Arithmetic.Add<BaseContext> = { operator: '+' };
// @ts-expect-error the addition refinement pins '+'
export const notAdd: Expression.Binary.Arithmetic.Add<BaseContext> = { operator: '-' };

// A for statement's C-style members are the refinement's, not the family's.
export const forIn: Statement.For.In<BaseContext> = {};
