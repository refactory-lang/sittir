/**
 * Compile-time checks on the base vocabulary from a consumer's seat: an
 * ordinary structure satisfies its base interface with only the members every
 * claiming grammar carries, and a refinement pins what it says it pins. A
 * member only a refinement carries must never be required on the ancestor.
 * Agnostic checks are written against a contract, the vocabulary over a
 * feature set with no overrides, where each member takes its default. A
 * grammar's map narrows members by overriding them. A member a feature owns
 * is gated on the map's features: a structure that sets one is built over a
 * contract composing the feature, and a contract without it lacks the member.
 */

import type {
	Accessors,
	AsyncAwait,
	BoundedQuantification,
	Clause,
	Comment,
	Declaration,
	Elisions,
	Expression,
	File,
	Assert,
	Contract,
	Fits,
	GrammarMap,
	Identifier,
	Missing,
	OptionalMembers,
	Pattern,
	ScopedVisibility,
	Statement,
	Type,
	Text,
	Unmapped
} from '../src/vocabulary/index.ts';
import type { Flag } from '../src/vocabulary/utils.ts';

// The core contract: no features and no overrides, so each member takes its default.
type Core = Contract<{}>;

// An ordinary function needs a name and parameters, nothing accessor-shaped.
export function fn(name: Identifier.Any<Core>): Declaration.Function<Core> {
	return { $path: 'declaration.function', name, parameters: [] };
}

// A method without an accessor is a plain method, and every method has a name and parameters.
export function method(name: Identifier.Any<Core>): Declaration.Method<Core> {
	return { $path: 'declaration.method', name, parameters: [] };
}
export function nameless(): Declaration.Method<Core> {
	// @ts-expect-error a method supplies its name
	return { $path: 'declaration.method', parameters: [] };
}
export function parameterless(name: Identifier.Any<Core>): Declaration.Method<Core> {
	// @ts-expect-error a method supplies its parameters
	return { $path: 'declaration.method', name };
}

// A contract composing the features whose members the checks below set, and one composing none.
type Composed = Contract<Accessors & BoundedQuantification & ScopedVisibility>;
type Bare = Contract<{}>;

// A getter is a property's accessor kind, which `accessors` owns: no member holds `get`.
export function getter(name: Declaration.Property.Getter<Composed>['name']): Declaration.Property.Getter<Composed> {
	return { $path: 'declaration.property.getter', name, parameters: [], body: { $path: 'statement.block' } };
}
export function getterWithAccessor(name: Declaration.Property.Getter<Composed>['name']): Declaration.Property.Getter<Composed> {
	return {
		...getter(name),
		// @ts-expect-error no member holds the accessor kind
		accessor: 'get'
	};
}

// An auto-accessor holds a field's optionality marker (`accessor x!: T`), under the feature that owns it on a field.
export function accessorOptionality(
	p: Declaration.Property<Core>
): Declaration.Field<Core>['optionality'] | undefined {
	return p.optionality;
}
type Optional = Contract<Accessors & OptionalMembers>;
export function markedAccessor(name: Declaration.Property<Optional>['name']): Declaration.Property<Optional> {
	return { $path: 'declaration.property', name, optionality: '!' };
}
export function bareMarked(name: Declaration.Property<Bare>['name']): Declaration.Property<Bare> {
	return {
		$path: 'declaration.property',
		name,
		// @ts-expect-error a context without optional members has no optionality
		optionality: '!'
	};
}

// An owner's access level is its refinement kind, and no member holds the level. A deeper level refines it further.
export function crateFn(name: Identifier.Any<Composed>): Declaration.Function.Public.Internal<Composed> {
	return { $path: 'declaration.function.public.internal', name, parameters: [] };
}
export const anyPublic: Declaration.Function.Public.Any<Composed> = crateFn({ $path: 'identifier' });
export function privateFn(name: Identifier.Any<Composed>): Declaration.Function.Private<Composed> {
	return {
		$path: 'declaration.function.private',
		name,
		parameters: [],
		// @ts-expect-error no member holds the level
		visibility: 'private'
	};
}
// The restricted level adds the module it names, and every owner's restricted refinement has it.
export function superFn(name: Identifier.Any<Composed>, scope: Identifier.Any<Composed>): Declaration.Function.Public.Restricted<Composed> {
	return { $path: 'declaration.function.public.restricted', name, parameters: [], scope };
}
// @ts-expect-error a context without scoped visibility has no scope
export const noScope: Declaration.Function.Public.Restricted<Bare>['scope'] = { $path: 'identifier' };

// A member the contract's features lack holds no value: code over the core reads it as the feature it needs or
// undefined, and a contract without the feature refuses a value for it.
export function asyncOf(f: Declaration.Function<Core>): Missing<AsyncAwait> | undefined {
	return f.async;
}
declare const asyncFlag: Flag;
export const bareAsync: Declaration.Function<Bare> = {
	$path: 'declaration.function',
	name: { $path: 'identifier' },
	parameters: [],
	// @ts-expect-error a contract without async-await has no async
	async: asyncFlag
};

// A call carries no operator; a binary expression carries no arguments.
export function call(callee: Identifier.Any<Core>): Expression.Call<Core> {
	return { $path: 'expression.call', function: callee, arguments: [] };
}
export function binary(left: Identifier.Any<Core>, right: Identifier.Any<Core>): Expression.Binary<Core> {
	return { $path: 'expression.binary', left, right };
}

// A refinement pins its operator.
export function add(): Expression.Binary.Arithmetic.Add<Core> {
	return { $path: 'expression.binary.arithmetic.add', operator: '+' };
}
export function notAdd(): Expression.Binary.Arithmetic.Add<Core> {
	return {
		...add(),
		// @ts-expect-error the addition refinement pins '+'
		operator: '-'
	};
}

// Every comparison pins the one converged operator member.
export function equal(left: Identifier.Any<Core>, right: Identifier.Any<Core>): Expression.Binary.Comparison.Equal<Core> {
	return { $path: 'expression.binary.comparison.equal', left, right, operator: '==' };
}
export function notEqual(left: Identifier.Any<Core>, right: Identifier.Any<Core>): Expression.Binary.Comparison.Equal<Core> {
	return {
		...equal(left, right),
		// @ts-expect-error the equality refinement pins '=='
		operator: '!='
	};
}

// Equality is strict in every language, typescript's `===` included; its coercing `==` is a comparison of its own.
export function strictEqual(left: Identifier.Any<Core>, right: Identifier.Any<Core>): Expression.Binary.Comparison.Equal<Core> {
	return { ...equal(left, right), operator: '===' };
}
export function looseEqual(left: Identifier.Any<Core>, right: Identifier.Any<Core>): Expression.Binary.Comparison.LooseEqual<Core> {
	return {
		$path: 'expression.binary.comparison.loose_equal',
		left,
		right,
		// @ts-expect-error a coercing comparison is never strict
		operator: '==='
	};
}

// A trait is an interface with more: a refinement carries its own kind and the members its parent lacks.
export function trait(name: Declaration.Interface.Trait<Composed>['name'], whereClause: Clause.Where<Composed>): Declaration.Interface.Trait<Composed> {
	return { $path: 'declaration.interface.trait', name, body: [], whereClause };
}
// A flag is no member: a structure states its flags in `$flags`.
export function unsafeTrait(name: Declaration.Interface.Trait<Composed>['name'], whereClause: Clause.Where<Composed>): Declaration.Interface.Trait<Composed> {
	return {
		...trait(name, whereClause),
		// @ts-expect-error a flag is no member
		unsafe: true
	};
}

// The kind-set is the type for "any declaration": shared members read directly, the rest after narrowing on `$path`.
export function nameOf(d: Declaration.Any<Core>): unknown {
	if (d.$path === 'declaration.function') return d.parameters;
	return d.$path;
}

// The root of a file is `file`, and `module` names only a module declared in a file.
export function file(statements: File<Core>['statements']): File<Core> {
	return { $path: 'file', statements };
}
export function declaredModuleAsFile(m: Declaration.Module<Core>): File<Core> {
	// @ts-expect-error a module declared in a file is no file
	return m;
}

// A loop family: the shared for-each is a refinement of loop, and needs its subject and body.
export function forEach(right: Identifier.Any<Core>, body: Statement.Block<Core>): Statement.Loop.ForEach<Core> {
	return { $path: 'statement.loop.for_each', right, body };
}

// A switch holds its cases, each naming its value, and its default, which names none; a match case is no clause of a switch.
export function switchBody(value: Clause.Case.Switch<Core>['value']): Statement.Switch<Core>['body'] {
	return [{ $path: 'clause.case.switch', value }, { $path: 'clause.case.default' }];
}
export function matchInSwitch(c: Clause.Case.Match<Core>): Statement.Switch<Core>['body'] {
	// @ts-expect-error a match case is no clause of a switch
	return [c];
}

// A handler is one kind in every language: it names what it binds and the type it catches, and holds its body.
export function handler(name: Identifier.Any<Core>, type: Type.Any<Core>, body: Clause.Catch<Core>['body']): Clause.Catch<Core> {
	return { $path: 'clause.catch', name, type, body };
}
export function handlerException(c: Clause.Catch<Core>): unknown {
	// @ts-expect-error what a handler catches is its `type`, in every language
	return c.exception;
}

// A member reads as its default under a contract: a kind of its namespace, the text of a token it admits, or an unclaimed
// kind's low-level node, told apart by `typeof` and `$path`.
export function nameKind(f: Declaration.Function<Core>): string {
	const name: Identifier.Any<Core> | Unmapped = f.name;
	return typeof name === 'string' ? name : '$path' in name ? name.$path : 'unmapped';
}

// A level is whole: it holds the kinds a feature adds, for every context.
export function yields(y: Expression.Yield<Core>): Expression.Any<Core> {
	return y;
}

// A grammar's map narrows a member by overriding it: here a function's name and parameters to the plain identifier. The
// override fits its default, and the member refuses what the override leaves out.
interface Narrowed extends GrammarMap {
	readonly features: {};
	readonly overrides: {
		readonly 'declaration.function': { readonly name: Identifier<Narrowed>; readonly parameters: Identifier<Narrowed> };
	};
	readonly inputs: {};
}
export type NarrowedFits = Assert<Fits<Narrowed>>;
const self: Identifier<Narrowed> = { $path: 'identifier' };
export const narrowed: Declaration.Function<Narrowed> = { $path: 'declaration.function', name: self, parameters: [self] };
// @ts-expect-error the narrowed name refuses an arm the grammar leaves out
export const textName: Declaration.Function<Narrowed> = { ...narrowed, name: 'self' };
// @ts-expect-error the narrowed parameters refuse an arm the grammar leaves out
export const textParameter: Declaration.Function<Narrowed> = { ...narrowed, parameters: ['self'] };

// Typescript's `any` is the unchecked primitive, a token typed as the text the grammar's text table gives it; `Any` names each
// namespace's union of its kinds, and the union holds it.
export function unchecked(any: Text<Core, 'type.primitive.unchecked'>): Type.Primitive.Any<Core> {
	return any;
}

// A hole in a list literal or list pattern is null, and only a context composing elisions admits one.
type Elided = Contract<Elisions>;
export function elided(x: Expression.Any<Elided>, p: Pattern.Any<Elided>): readonly [Expression.Collection.List<Elided>, Pattern.List<Elided>] {
	return [
		{ $path: 'expression.collection.list', elements: [x, null, x] },
		{ $path: 'pattern.list', elements: [p, null, p] }
	];
}
export function unelided(x: Expression.Any<Bare>): Expression.Collection.List<Bare> {
	// @ts-expect-error a context without elisions has no holes
	return { $path: 'expression.collection.list', elements: [x, null, x] };
}

// Every default admits an unclaimed kind, typed as its low-level node, and a grammar registers each of its unclaimed kinds
// under its name; an override that leaves the kind out refuses it.
declare module '../src/vocabulary/index.ts' {
	interface UnmappedKinds {
		readonly 'g:doc_text': { readonly $type: 7; readonly text: string };
	}
}
declare const docText: Unmapped<'g:doc_text'>;
export const docTextRead: string = docText.text;
export const unclaimedName: Declaration.Function<Core>['name'] = docText;
export const unclaimedContent: Comment.Line<Core>['content'] = docText;
export const unclaimedDocContent: Comment.Line.Doc.Inner<Core>['content'] = docText;
// @ts-expect-error the narrowed name admits no unclaimed kind
export const narrowedUnclaimed: Declaration.Function<Narrowed>['name'] = docText;
