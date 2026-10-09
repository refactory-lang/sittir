/**
 * What the gated vocabulary does, checked by the compiler. `tsc -p tsconfig.demo.json` passes; each
 * `@ts-expect-error` marks a negative, and `tsc -p tsconfig.errors.json` prints its message.
 */
import type { JavaScriptFeatures } from './compositions.ts';
import type { JavaScript, JavaScriptContext } from './javascript.ts';
import type { PythonContext, RustContext, TypeScriptContext } from './languages.ts';
import type { Python, Rust, TypeScript } from './names.ts';
import type { ViewForm } from './view-form.ts';
import type { BaseContext, GrammarContext } from './vocabulary/context.ts';
import type { AsyncAwait, AsyncBlocks, TypeAnnotations } from './vocabulary/features/index.ts';
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

// A kind a feature adds: Rust has async blocks, at their level and by name; Python has neither.
export const rustLevel: V.Expression.Any<RustContext> = null! as Rust.Expression.Block.Async;
// @ts-expect-error Python's expression level has no async block.
export const pythonLevel: V.Expression.Any<PythonContext> = null! as V.Expression.Block.Async<PythonContext>;
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

// A consumer over the permissive context takes every language's kinds, including one whose language lacks a member
// the consumer reads: the member reads as absent at run time, which its type allows.
export const rustMethodIsBase: V.Declaration.Method<BaseContext> = null! as Rust.Declaration.Method;
export const isGenerator = (method: V.Declaration.Method<BaseContext>): boolean => method.generator === true;
export const rustIsGenerator = isGenerator(null! as Rust.Declaration.Method);

// A consumer generic over the context sees a gated member as possibly absent.
export function asyncOf<G extends GrammarContext>(fn: V.Declaration.Function<G>): boolean | undefined {
	// @ts-expect-error The member is Absent<AsyncAwait> where G lacks async-await.
	return fn.async;
}
