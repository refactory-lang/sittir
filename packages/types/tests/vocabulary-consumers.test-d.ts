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

// A refinement inherits what it does not pin: an increment still needs its operand.
// @ts-expect-error an increment supplies its operand
export const operandless: Expression.Update.Increment<BaseContext> = { operator: '++' };

// A trait is an interface with more: the refinement is assignable to its parent, and a plain interface has no unsafe marker to pin.
export const trait: Declaration.Interface.Trait<BaseContext> = { name: {}, body: [], unsafe: true };
export const asInterface: Declaration.Interface<BaseContext> = trait;

// A loop family: the shared for-in is a refinement of loop, and needs its subject and body.
export const forIn: Statement.Loop.For<BaseContext> = { right: {}, body: {} };
