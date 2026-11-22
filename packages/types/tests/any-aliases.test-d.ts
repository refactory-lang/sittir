import type * as V from '../src/vocabulary/index.ts';
import type { GrammarMap, Slot } from '../src/vocabulary/map.ts';
import type { In, SubKindOf, Under } from '../src/vocabulary/utils.ts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type Rust = V.Contract<V.RustFeatures>;
type TypeScript = V.Contract<V.TypeScriptFeatures>;
type Python = V.Contract<V.PythonFeatures>;
type IfIn<G extends GrammarMap> = Extract<V.Expression.Any<G>, { readonly $path: 'statement.if' }>;

export type RustExpressionHoldsIf = Expect<Equal<IfIn<Rust>, V.Statement.If<Rust>>>;
export type TypeScriptExpressionLacksIf = Expect<Equal<IfIn<TypeScript>, never>>;
export type PythonExpressionLacksIf = Expect<Equal<IfIn<Python>, never>>;
export type IdentifierInEveryLanguage = Expect<Equal<Extract<V.Expression.Any<TypeScript>, { readonly $path: 'identifier' }>, V.Identifier<TypeScript>>>;

declare const tsIf: V.Statement.If<TypeScript>;
declare const rsIf: V.Statement.If<Rust>;
export const rsIfIsAnExpression: V.Expression.Any<Rust> = rsIf;
// @ts-expect-error typescript's if is no expression
export const tsIfIsNoExpression: V.Expression.Any<TypeScript> = tsIf;

declare const either: V.Statement.If<Rust | TypeScript>;
export const overAUnionOfMaps: V.Expression.Any<Rust | TypeScript> = either;

declare const rsAsync: V.Statement.Block.Async<Rust>;
export const aModifierBlockIsABlock: V.Statement.Block.Any<Rust> = rsAsync;
export const aModifierBlockIsAnExpression: V.Expression.Any<Rust> = rsAsync;

interface Parent<G extends GrammarMap, K extends Under<'expression.probe'> = 'expression.probe'> {
	readonly $path: K;
	readonly value?: Slot<G, K, 'value', V.Expression.Any<G>>;
}

export interface NarrowsToANativeKind<G extends GrammarMap, K extends Under<'expression.probe.a'> = 'expression.probe.a'> extends SubKindOf<Parent<G, K>> {
	readonly $path: K;
	readonly value?: Slot<G, K, 'value', V.Expression.Call<G>>;
}

export interface NarrowsToABaseAlias<G extends GrammarMap, K extends Under<'expression.probe.b'> = 'expression.probe.b'> extends SubKindOf<Parent<G, K>> {
	readonly $path: K;
	readonly value?: Slot<G, K, 'value', V.Identifier<G> | V.Literal.String<G>>;
}

// @ts-expect-error an ungated narrowing to a feature's alias cannot be shown to fit for every G
export interface NarrowsToAFeatureAliasUngated<G extends GrammarMap, K extends Under<'expression.probe.c'> = 'expression.probe.c'> extends SubKindOf<Parent<G, K>> {
	readonly $path: K;
	readonly value?: Slot<G, K, 'value', V.Statement.If<G>>;
}

export interface NarrowsToAFeatureAliasGated<G extends GrammarMap, K extends Under<'expression.probe.d'> = 'expression.probe.d'> extends SubKindOf<Parent<G, K>> {
	readonly $path: K;
	readonly value?: Slot<G, K, 'value', In<G, V.RustExpressions, V.Statement.If<G>>>;
}

// @ts-expect-error a narrowing gated on a feature that extends the alias's owner, not on the owner, cannot be shown to fit
export interface NarrowsToAFeatureAliasGatedByAnExtendingFeature<G extends GrammarMap, K extends Under<'expression.probe.e'> = 'expression.probe.e'> extends SubKindOf<Parent<G, K>> {
	readonly $path: K;
	readonly value?: Slot<G, K, 'value', In<G, V.GeneratorBlocks, V.Statement.If<G>>>;
}

export function pathOfADeclaration(d: V.Declaration.Any<TypeScript>): unknown {
	if (d.$path === 'declaration.function') return d.parameters;
	return d.$path;
}

type HasUndefined<T> = undefined extends T ? true : false;
export type RustPathIsAString = Expect<Equal<HasUndefined<V.Expression.Any<Rust>['$path']>, false>>;
export type TypeScriptPathIsAString = Expect<Equal<HasUndefined<V.Declaration.Any<TypeScript>['$path']>, false>>;
export type PythonPathIsAString = Expect<Equal<HasUndefined<V.Expression.Any<Python>['$path']>, false>>;
export type PathReadsAsString = Expect<V.Expression.Any<TypeScript>['$path'] extends string ? true : false>;
export type MissingArmLeavesExtract = Expect<Equal<Extract<V.Expression.If<TypeScript>, { readonly $path: 'statement.if' }>, never>>;
