/**
 * Compile-time checks on the base vocabulary from a consumer's seat: an
 * ordinary structure satisfies its base interface with only the members every
 * claiming grammar carries, and a refinement pins what it says it pins. A
 * member only a refinement carries must never be required on the ancestor.
 */

import type { BaseContext, Declaration, Expression, Statement } from '../src/vocabulary/index.ts';

// An ordinary function needs a name and parameters, nothing accessor-shaped.
export const fn: Declaration.Function<BaseContext> = {
	kind: 'declaration.function',
	name: { kind: 'identifier' },
	parameters: []
};

// A method without an accessor kind is a plain method.
export const method: Declaration.Method<BaseContext> = {
	kind: 'declaration.method',
	name: { kind: 'identifier' },
	parameters: []
};

// A getter pins its accessor kind.
export const getter: Declaration.Getter<BaseContext> = {
	kind: 'declaration.getter',
	name: { kind: 'identifier' },
	parameters: [],
	accessorKind: 'get'
};
export const notGetter: Declaration.Getter<BaseContext> = {
	...getter,
	// @ts-expect-error a getter's accessor kind is 'get'
	accessorKind: 'set'
};

// A call carries no operator; a binary expression carries no arguments.
export const call: Expression.Call<BaseContext> = {
	kind: 'expression.call',
	function: { kind: 'identifier' },
	arguments: []
};
export const binary: Expression.Binary<BaseContext> = {
	kind: 'expression.binary',
	left: { kind: 'identifier' },
	right: { kind: 'identifier' }
};

// A refinement pins its operator.
export const add: Expression.Binary.Arithmetic.Add<BaseContext> = {
	kind: 'expression.binary.arithmetic.add',
	operator: '+'
};
export const notAdd: Expression.Binary.Arithmetic.Add<BaseContext> = {
	...add,
	// @ts-expect-error the addition refinement pins '+'
	operator: '-'
};

// A refinement inherits what it does not pin: an increment still needs its operand.
// @ts-expect-error an increment supplies its operand
export const operandless: Expression.Update.Increment<BaseContext> = {
	kind: 'expression.update.increment',
	operator: '++'
};

// A trait is an interface with more: the refinement is assignable to its parent, and a plain interface has no unsafe marker to pin.
export const trait: Declaration.Interface.Trait<BaseContext> = {
	kind: 'declaration.interface.trait',
	name: { kind: 'identifier' },
	body: [],
	unsafe: true
};
export const asInterface: Declaration.Interface<BaseContext> = trait;

// The kind-set is the type for "any declaration": shared members read directly, the rest after narrowing on kind.
export function nameOf(d: Declaration.Kinds<BaseContext>): unknown {
	if (d.kind === 'declaration.function') return d.parameters;
	return d.kind;
}

// A loop family: the shared for-in is a refinement of loop, and needs its subject and body.
export const forIn: Statement.Loop.For<BaseContext> = {
	kind: 'statement.loop.for',
	right: { kind: 'identifier' },
	body: { kind: 'statement.block' }
};
