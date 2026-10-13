/**
 * Compile-time checks on the base vocabulary from a consumer's seat: an
 * ordinary structure satisfies its base interface with only the members every
 * claiming grammar carries, and a refinement pins what it says it pins. A
 * member only a refinement carries must never be required on the ancestor.
 * Each check is generic over the context, as portable code is: the roles it
 * fills arrive typed by the namespace map. A concrete context, as a grammar
 * declares one, narrows the map and instantiates them. A member a feature owns
 * is gated on the context: a structure that sets one is built over a context
 * composing the feature, and generic code reads one as its type or undefined,
 * since a context without the feature lacks the member.
 */

import type {
	Accessors,
	BoundedQuantification,
	Clause,
	Declaration,
	Expression,
	GrammarContext,
	Identifier,
	ScopedVisibility,
	Statement
} from '../src/vocabulary/index.ts';
import { Flags } from '../src/vocabulary/index.ts';
import type { Flag } from '../src/vocabulary/utils.ts';

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

// A context composing the features whose members the checks below set, and one composing none.
interface Composed extends GrammarContext<Composed>, Accessors, BoundedQuantification, ScopedVisibility {}
interface Bare extends GrammarContext<Bare> {}

// A getter is an accessor kind, which `accessors` owns: no member holds `get`.
export function getter(name: Composed['identifier']): Declaration.Method.Getter<Composed> {
	return { $kind: 'declaration.method.getter', name, parameters: [] };
}
export function getterWithAccessor(name: Composed['identifier']): Declaration.Method.Getter<Composed> {
	return {
		...getter(name),
		// @ts-expect-error no member holds the accessor kind
		accessor: 'get'
	};
}

// An owner's access level is its refinement kind, and no member holds the level. A deeper level refines it further.
export function crateFn(name: Composed['identifier']): Declaration.Function.Public.Internal<Composed> {
	return { $kind: 'declaration.function.public.internal', name, parameters: [] };
}
export const anyPublic: Declaration.Function.Public.Any<Composed> = crateFn({ $kind: 'identifier' });
export function privateFn(name: Composed['identifier']): Declaration.Function.Private<Composed> {
	return {
		$kind: 'declaration.function.private',
		name,
		parameters: [],
		// @ts-expect-error no member holds the level
		visibility: 'private'
	};
}
// The restricted level adds the module it names, and every owner's restricted refinement has it.
export function superFn(name: Composed['identifier'], scope: Composed['identifier']): Declaration.Function.Public.Restricted<Composed> {
	return { $kind: 'declaration.function.public.restricted', name, parameters: [], scope };
}
// @ts-expect-error a context without scoped visibility has no scope
export const noScope: Declaration.Function.Public.Restricted<Bare>['scope'] = { $kind: 'identifier' };

// A member the context's features lack is absent: unbounded code reads it as its type or undefined, and a context
// without the feature refuses a value for it.
export function asyncOf<G extends GrammarContext<G>>(f: Declaration.Function<G>): Flag | undefined {
	return f.async;
}
declare const asyncFlag: Flag;
export const bareAsync: Declaration.Function<Bare> = {
	...fn<Bare>({ $kind: 'identifier' }),
	// @ts-expect-error a context without async-await has no async
	async: asyncFlag
};

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

// Equality is strict in every language, typescript's `===` included; its coercing `==` is a comparison of its own.
export function strictEqual<G extends GrammarContext<G>>(left: G['identifier'], right: G['identifier']): Expression.Binary.Comparison.Equal<G> {
	return { ...equal<G>(left, right), operator: '===' };
}
export function looseEqual<G extends GrammarContext<G>>(left: G['identifier'], right: G['identifier']): Expression.Binary.Comparison.LooseEqual<G> {
	return {
		$kind: 'expression.binary.comparison.loose_equal',
		left,
		right,
		// @ts-expect-error a coercing comparison is never strict
		operator: '==='
	};
}

// A trait is an interface with more: a refinement carries its own kind and the members its parent lacks.
export function trait(name: Declaration.Interface.Trait<Composed>['name'], whereClause: Clause.Where<Composed>): Declaration.Interface.Trait<Composed> {
	return { $kind: 'declaration.interface.trait', name, body: [], whereClause };
}
// A flag is no member: a structure states its flags in `$flags`.
export function unsafeTrait(name: Declaration.Interface.Trait<Composed>['name'], whereClause: Clause.Where<Composed>): Declaration.Interface.Trait<Composed> {
	return {
		...trait(name, whereClause),
		// @ts-expect-error a flag is no member
		unsafe: true
	};
}

// The flags are one bitflag, each flag under its declaration's name: `|` combines two and `&` tests one.
export const staticAsync: number = Flags.Static | Flags.Async;
export const isStatic: boolean = (staticAsync & Flags.Static) !== 0;
// @ts-expect-error a private name's flag is `privateName`
export const privateFlag = Flags.Private;

// The kind-set is the type for "any declaration": shared members read directly, the rest after narrowing on `$kind`.
export function nameOf<G extends GrammarContext<G>>(d: Declaration.Any<G>): unknown {
	if (d.$kind === 'declaration.function') return d.parameters;
	return d.$kind;
}

// A loop family: the shared for-in is a refinement of loop, and needs its subject and body.
export function forIn<G extends GrammarContext<G>>(right: G['identifier'], body: Statement.Block<G>): Statement.Loop.For<G> {
	return { $kind: 'statement.loop.for', right, body };
}

// A switch holds its cases, each naming its value, and its default, which names none; a match case is no clause of a switch.
export function switchBody<G extends GrammarContext<G>>(value: Clause.Case.Switch<G>['value']): Statement.Switch<G>['body'] {
	return [{ $kind: 'clause.case.switch', value }, { $kind: 'clause.case.default' }];
}
export function matchInSwitch<G extends GrammarContext<G>>(c: Clause.Case.Match<G>): Statement.Switch<G>['body'] {
	// @ts-expect-error a match case is no clause of a switch
	return [c];
}

// A handler is one kind in every language: it names what it binds and the type it catches, and holds its body.
export function handler<G extends GrammarContext<G>>(name: G['identifier'], type: G['type'], body: Clause.Catch<G>['body']): Clause.Catch<G> {
	return { $kind: 'clause.catch', name, type, body };
}
export function handlerException<G extends GrammarContext<G>>(c: Clause.Catch<G>): unknown {
	// @ts-expect-error what a handler catches is its `type`, in every language
	return c.exception;
}

// Roles read through the namespace map, which types each by its permissive fill.
export function nameKind<G extends GrammarContext<G>>(f: Declaration.Function<G>): string {
	return f.name.$kind;
}

// A level is whole: it holds the kinds a feature adds, for every context.
export function yields<G extends GrammarContext<G>>(y: Expression.Yield<G>): Expression.Any<G> {
	return y;
}

// A grammar's context extends the map over itself and narrows it to what the grammar realizes: here the identifier
// role to the plain identifier, and a function's parameters to identifiers.
interface Narrowed extends GrammarContext<Narrowed> {
	readonly identifier: Identifier<Narrowed>;
	readonly slots: GrammarContext<Narrowed>['slots'] & {
		readonly 'declaration.function': { readonly parameters: Identifier<Narrowed> };
	};
}
const self: Narrowed['identifier'] = { $kind: 'identifier' };
export const narrowed: Declaration.Function<Narrowed> = { ...fn<Narrowed>(self), parameters: [self] };
export const narrowedName: string = nameKind<Narrowed>(narrowed);
// @ts-expect-error the narrowed identifier role refuses a kind the grammar leaves out
export const crate = fn<Narrowed>({ $kind: 'identifier.crate' });
// @ts-expect-error the narrowed parameters slot refuses an arm the grammar leaves out
export const textParameter: Declaration.Function<Narrowed> = { ...narrowed, parameters: ['self'] };
