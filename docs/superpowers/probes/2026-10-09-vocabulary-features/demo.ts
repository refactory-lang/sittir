/**
 * What the gated vocabulary does, checked by the compiler. `tsc -p tsconfig.demo.json` passes; each
 * `@ts-expect-error` marks a negative, and `tsc -p tsconfig.errors.json` prints its message.
 */
import type { JavaScriptFeatures } from './compositions.ts';
import type { JavaScript, JavaScriptContext } from './javascript.ts';
import type { PythonContext, RustContext, TypeScriptContext } from './languages.ts';
import type { Python, Rust, TypeScript } from './names.ts';
import type { ViewForm } from './view-form.ts';
import type { GrammarContext } from './vocabulary/context.ts';
import type { AsyncAwait, AsyncBlocks, Generators, TypeAnnotations } from './vocabulary/features/index.ts';
import type * as V from './vocabulary/index.ts';

// A context has its composition's closure. Rust names async blocks, which extend async-await.
export const rustAwaits: AsyncAwait = null! as RustContext;
// @ts-expect-error Python has async-await without async blocks.
export const pythonBlocks: AsyncBlocks = null! as PythonContext;

// TypeScript is JavaScript and its typing features.
export const typescriptIsJavascript: JavaScriptFeatures = null! as TypeScriptContext;
// @ts-expect-error JavaScript has no type annotations.
export const javascriptAnnotates: TypeAnnotations = null! as JavaScriptContext;

// A member one language has and another lacks: TypeScript's methods can be generators, Rust's cannot.
export const typescriptGenerator: V.Declaration.Method<TypeScriptContext>['generator'] = true;
// @ts-expect-error Rust's method has no generator flag.
export const rustGenerator: V.Declaration.Method<RustContext>['generator'] = true;
// @ts-expect-error Python's class has no implements.
export const pythonImplements: V.Declaration.Class<PythonContext>['implements'] = [];

// On a portable node, a member the language lacks does not exist.
declare const typescriptFunction: ViewForm<TypeScript.Declaration.Function>;
declare const javascriptFunction: ViewForm<JavaScript.Declaration.Function>;
export const returnType = typescriptFunction.returnType();
// @ts-expect-error JavaScript functions have no return type.
export const noReturnType = javascriptFunction.returnType();
// @ts-expect-error Nor type parameters.
export const noTypeParameters = javascriptFunction.typeParameters();

// A kind a feature adds: Rust's expressions include async blocks, which it names; Python's do not, and it names none.
export const rustLevel: RustContext['expression'] = null! as Rust.Expression.Block.Async;
// @ts-expect-error Python's expressions have no async block.
export const pythonLevel: PythonContext['expression'] = null! as V.Expression.Block.Async<PythonContext>;
// @ts-expect-error Nor does Python name one.
export type PythonAsyncBlock = Python.Expression.Block.Async;

// TypeScript's typing kinds are type-annotations': JavaScript's type level is empty.
export const javascriptTypes: [JavaScriptContext['type']] extends [never] ? true : false = true;
export const typescriptTypes: [TypeScriptContext['type']] extends [never] ? true : false = false;

// The equality proposal: TypeScript's == is loose and its === strict; Python's == is strict.
export type TypeScriptLoose = TypeScript.Expression.Binary.Comparison.Equal.Loose;
export type TypeScriptStrict = TypeScript.Expression.Binary.Comparison.Equal.Strict;
export type PythonStrict = Python.Expression.Binary.Comparison.Equal.Strict;
// @ts-expect-error Python has no coercive equality.
export type PythonLoose = Python.Expression.Binary.Comparison.Equal.Loose;

// A restatement: manifest typing makes a Rust field's type required, where TypeScript may omit it.
export const typescriptField: Pick<TypeScript.Declaration.Field, 'type'> = {};
// @ts-expect-error Rust's field states its type.
export const rustField: Pick<Rust.Declaration.Field, 'type'> = {};

// A term: Rust's `mod` names its module declaration.
export const rustTerm: Rust.Declaration.Mod = null! as Rust.Declaration.Module;
// @ts-expect-error Python has no such term.
export type PythonTerm = Python.Declaration.Mod;

// The property-facts proposal: a name is a property identifier, and what its kind said of the property, the property
// says. A private member is flagged where it is declared and where it is read.
export const typescriptPrivateField: TypeScript.Declaration.Field['private'] = true;
// @ts-expect-error Rust lacks encapsulation.
export const rustPrivateField: Rust.Declaration.Field['private'] = true;
declare const javascriptMember: ViewForm<JavaScript.Expression.Member>;
declare const pythonMember: ViewForm<Python.Expression.Member>;
export const javascriptReadsPrivately = javascriptMember.private();
// @ts-expect-error Nor does Python.
export const pythonReadsPrivately = pythonMember.private();
// @ts-expect-error No kind of name is private.
export type PrivateName = TypeScript.Identifier.Property.Private;
// A computed key is the key's expression, and the property is flagged.
export const typescriptComputedMethod: TypeScript.Declaration.Method['computed'] = true;
// @ts-expect-error Python lacks computed keys.
export const pythonComputedMethod: Python.Declaration.Method['computed'] = true;
// A shorthand property is a pair with no value.
export const typescriptShorthand: Pick<TypeScript.Element.Pair, 'value'> = {};
// The identity and membership operators are keyword text.
export const isNot: Python.Expression.Binary.Identity.IsNot['operator'] = 'is not';
// @ts-expect-error Text, not a number.
export const numericOperator: Python.Expression.Binary.Identity.IsNot['operator'] = 1;

// Visibility is an access level: one set of values in every language, which rust's `pub(crate)` and typescript's
// `protected` spell.
export const typescriptProtected: TypeScript.Declaration.Field['visibility'] = 'protected';
export const rustInternal: Rust.Declaration.Function['visibility'] = 'internal';
// @ts-expect-error A level, not rust's spelling of it.
export const rustSpelling: Rust.Declaration.Function['visibility'] = 'pub(crate)';
// @ts-expect-error JavaScript has no visibility; its private member is encapsulation.
export const javascriptVisibility: JavaScript.Declaration.Field['visibility'] = 'private';

// Every row of the feature table owns what it adds, so a language's members are exactly its features'.
export const rustUnsafe: Rust.Declaration.Function['unsafe'] = true;
// @ts-expect-error Python lacks unsafe code.
export const pythonUnsafe: Python.Declaration.Function['unsafe'] = true;
export const typescriptLabel: TypeScript.Statement.Loop.While['label'] = null! as TypeScript.Identifier.Label;
// @ts-expect-error Python lacks labeled control flow.
export const pythonLabel: Python.Statement.Loop.While['label'] = null! as TypeScript.Identifier.Label;
export const typescriptOptionalChain: TypeScript.Expression.Subscript['optionalChain'] = true;
// @ts-expect-error Python lacks optional chaining.
export const pythonOptionalChain: Python.Expression.Subscript['optionalChain'] = true;
// TypeScript's typing kinds belong to its typing features, so JavaScript has none of them.
export type TypeScriptOptionalParameter = TypeScript.Declaration.Parameter.Optional;
// @ts-expect-error JavaScript lacks optional members.
export type JavaScriptOptionalParameter = JavaScript.Declaration.Parameter.Optional;

// Portable code is generic over the context. Bounded by the features it reads, it takes the languages that have them;
// a language without one fails at the call.
export function asyncOf<G extends GrammarContext<G> & AsyncAwait>(fn: V.Declaration.Function<G>): boolean | undefined {
	return fn.async;
}
export const rustFunctionIsAsync = asyncOf(null! as Rust.Declaration.Function);
export function generatorOf<G extends GrammarContext<G> & Generators>(method: V.Declaration.Method<G>): boolean | undefined {
	return method.generator;
}
export const typescriptMethodIsGenerator = generatorOf(null! as TypeScript.Declaration.Method);
// @ts-expect-error Rust's context lacks generators.
export const rustMethodIsGenerator = generatorOf(null! as Rust.Declaration.Method);

// Unbounded, it takes every language, and a gated member may be absent: it tests the member rather than return it.
export function isGenerator<G extends GrammarContext<G>>(method: V.Declaration.Method<G>): boolean {
	return method.generator === true;
}
export const rustIsGenerator = isGenerator(null! as Rust.Declaration.Method);
export function asyncOfAny<G extends GrammarContext<G>>(fn: V.Declaration.Function<G>): boolean | undefined {
	// @ts-expect-error The member is Absent<AsyncAwait> where G lacks async-await.
	return fn.async;
}

// Roles and slots read through the namespace map, which types each by its permissive fill.
export function nameKind<G extends GrammarContext<G>>(fn: V.Declaration.Function<G>): string {
	return fn.name.$kind;
}
export function parameterKinds<G extends GrammarContext<G>>(fn: V.Declaration.Function<G>): string[] {
	// @ts-expect-error A parameter's fill admits text, which has no kind.
	return fn.parameters.map((p) => p.$kind);
}
export function narrowedParameterKinds<G extends GrammarContext<G>>(fn: V.Declaration.Function<G>): string[] {
	return fn.parameters.map((p) => (typeof p === 'string' ? p : p.$kind));
}

// Several languages at once: a union of contexts, named where a value mixes them.
export const polyglot: (PythonContext | RustContext)['expression'][] = [null! as PythonContext['expression'], null! as Rust.Expression.Block.Async];
export const mixed = asyncOf<PythonContext | RustContext>(null! as Python.Declaration.Function | Rust.Declaration.Function);
// @ts-expect-error Unnamed, the union infers one language's context and rejects the other's.
export const inferred = asyncOf(null! as Python.Declaration.Function | Rust.Declaration.Function);
// The union is a supertype of each language member by member: Rust's absent generator flag fits it.
export const memberwise: V.Declaration.Method<PythonContext | RustContext>['generator'] = null! as V.Declaration.Method<RustContext>['generator'];
