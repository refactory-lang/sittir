/**
 * Compile-time checks on the base vocabulary from a consumer's seat: an
 * ordinary structure satisfies its base interface with only the members every
 * claiming grammar carries, and a refinement pins what it says it pins. A
 * member only a refinement carries must never be required on the ancestor.
 * Each check is generic over the context, as portable code is: the roles it
 * fills arrive typed by the namespace map.
 */

import type { Declaration, Expression, GrammarContext, Statement } from '../src/vocabulary/index.ts';

// An ordinary function needs a name and parameters, nothing accessor-shaped.
export function fn<G extends GrammarContext<G>>(name: G['identifier']): Declaration.Function<G> {
	return { $kind: 'declaration.function', name, parameters: [] };
}

// A method without an accessor is a plain method, and every method has a name and parameters.
export function method<G extends GrammarContext<G>>(name: G['identifier']): Declaration.Method<G> {
	return { $kind: 'declaration.method', name, parameters: [] };
}
export function nameless<G extends GrammarContext<G>>(): Declaration.Method<G> {
	// @ts-expect-error a method supplies its name
	return { $kind: 'declaration.method', parameters: [] };
}
export function parameterless<G extends GrammarContext<G>>(name: G['identifier']): Declaration.Method<G> {
	// @ts-expect-error a method supplies its parameters
	return { $kind: 'declaration.method', name };
}

// A getter pins the converged accessor member.
export function getter<G extends GrammarContext<G>>(name: G['identifier']): Declaration.Method.Getter<G> {
	return { $kind: 'declaration.method.getter', name, parameters: [], accessor: 'get' };
}
export function notGetter<G extends GrammarContext<G>>(name: G['identifier']): Declaration.Method.Getter<G> {
	return {
		...getter<G>(name),
		// @ts-expect-error a getter's accessor is 'get'
		accessor: 'set'
	};
}

// A call carries no operator; a binary expression carries no arguments.
export function call<G extends GrammarContext<G>>(callee: G['identifier']): Expression.Call<G> {
	return { $kind: 'expression.call', function: callee, arguments: [] };
}
export function binary<G extends GrammarContext<G>>(left: G['identifier'], right: G['identifier']): Expression.Binary<G> {
	return { $kind: 'expression.binary', left, right };
}

// A refinement pins its operator.
export function add<G extends GrammarContext<G>>(): Expression.Binary.Arithmetic.Add<G> {
	return { $kind: 'expression.binary.arithmetic.add', operator: '+' };
}
export function notAdd<G extends GrammarContext<G>>(): Expression.Binary.Arithmetic.Add<G> {
	return {
		...add<G>(),
		// @ts-expect-error the addition refinement pins '+'
		operator: '-'
	};
}

// Every comparison pins the one converged operator member.
export function equal<G extends GrammarContext<G>>(left: G['identifier'], right: G['identifier']): Expression.Binary.Comparison.Equal<G> {
	return { $kind: 'expression.binary.comparison.equal', left, right, operator: '==' };
}
export function notEqual<G extends GrammarContext<G>>(left: G['identifier'], right: G['identifier']): Expression.Binary.Comparison.Equal<G> {
	return {
		...equal<G>(left, right),
		// @ts-expect-error the equality refinement pins '=='
		operator: '!='
	};
}

// A trait is an interface with more: a refinement carries its own kind and the members its parent lacks.
export function trait<G extends GrammarContext<G>>(name: Declaration.Interface.Trait<G>['name']): Declaration.Interface.Trait<G> {
	return { $kind: 'declaration.interface.trait', name, body: [], unsafe: true };
}

// The kind-set is the type for "any declaration": shared members read directly, the rest after narrowing on `$kind`.
export function nameOf<G extends GrammarContext<G>>(d: Declaration.Any<G>): unknown {
	if (d.$kind === 'declaration.function') return d.parameters;
	return d.$kind;
}

// A loop family: the shared for-in is a refinement of loop, and needs its subject and body.
export function forIn<G extends GrammarContext<G>>(right: G['identifier'], body: Statement.Block<G>): Statement.Loop.For<G> {
	return { $kind: 'statement.loop.for', right, body };
}

// Roles read through the namespace map, which types each by its permissive fill.
export function nameKind<G extends GrammarContext<G>>(f: Declaration.Function<G>): string {
	return f.name.$kind;
}
