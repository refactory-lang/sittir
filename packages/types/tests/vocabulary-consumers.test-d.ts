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

// A method without an accessor is a plain method, and every method has a name and parameters.
export const method: Declaration.Method<BaseContext> = {
	kind: 'declaration.method',
	name: { kind: 'identifier' },
	parameters: []
};
// @ts-expect-error a method supplies its name
export const nameless: Declaration.Method<BaseContext> = {
	kind: 'declaration.method',
	parameters: []
};
// @ts-expect-error a method supplies its parameters
export const parameterless: Declaration.Method<BaseContext> = {
	kind: 'declaration.method',
	name: { kind: 'identifier' }
};

// A getter pins the converged accessor member.
export const getter: Declaration.Method.Getter<BaseContext> = {
	kind: 'declaration.method.getter',
	name: { kind: 'identifier' },
	parameters: [],
	accessor: 'get'
};
export const notGetter: Declaration.Method.Getter<BaseContext> = {
	...getter,
	// @ts-expect-error a getter's accessor is 'get'
	accessor: 'set'
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

// Every comparison pins the one converged operator member.
export const equal: Expression.Binary.Comparison.Equal<BaseContext> = {
	kind: 'expression.binary.comparison.equal',
	left: { kind: 'identifier' },
	right: { kind: 'identifier' },
	operator: '=='
};
export const notEqual: Expression.Binary.Comparison.Equal<BaseContext> = {
	...equal,
	// @ts-expect-error the equality refinement pins '=='
	operator: '!='
};

// A trait is an interface with more: a refinement carries its own kind and the members its parent lacks.
export const trait: Declaration.Interface.Trait<BaseContext> = {
	kind: 'declaration.interface.trait',
	name: { kind: 'identifier.type' },
	body: [],
	unsafe: true
};

// The kind-set is the type for "any declaration": shared members read directly, the rest after narrowing on kind.
export function nameOf(d: Declaration.Any<BaseContext>): unknown {
	if (d.kind === 'declaration.function') return d.parameters;
	return d.kind;
}

// A loop family: the shared for-in is a refinement of loop, and needs its subject and body.
export const forIn: Statement.Loop.For<BaseContext> = {
	kind: 'statement.loop.for',
	right: { kind: 'identifier' },
	body: { kind: 'statement.block' }
};
