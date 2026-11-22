import type * as V from '../../../../packages/types/src/vocabulary/index.ts';
import type { GrammarMap, Slot } from '../../../../packages/types/src/vocabulary/map.ts';
import type { In, SubKindOf, Under } from '../../../../packages/types/src/vocabulary/utils.ts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type ValuedBlockArms<G extends GrammarMap> =
	| V.Statement.Block<G>
	| V.Statement.Break<G>
	| V.Statement.Continue<G>
	| V.Statement.If<G>
	| V.Statement.Loop<G>
	| V.Statement.Loop.ForEach<G>
	| V.Statement.Loop.While<G>
	| V.Statement.Match<G>
	| V.Statement.Return<G>;

export type ExpressionAny<G extends GrammarMap> =
	| V.Expression.Any<G>
	| V.Identifier.Any<G>
	| V.Literal.Any<G>
	| In<G, V.ValuedBlocks, ValuedBlockArms<G>>;

type Rust = V.Contract<V.RustFeatures>;
type TypeScript = V.Contract<V.TypeScriptFeatures>;
type Python = V.Contract<V.PythonFeatures>;
type IfIn<G extends GrammarMap> = Extract<ExpressionAny<G>, { readonly $path: 'statement.if' }>;

export type RustExpressionHoldsIf = Expect<Equal<IfIn<Rust>, V.Statement.If<Rust>>>;
export type TypeScriptExpressionLacksIf = Expect<Equal<IfIn<TypeScript>, never>>;
export type PythonExpressionLacksIf = Expect<Equal<IfIn<Python>, never>>;
export type IdentifierInEveryLanguage = Expect<Equal<Extract<ExpressionAny<TypeScript>, { readonly $path: 'identifier' }>, V.Identifier<TypeScript>>>;

declare const tsIf: V.Statement.If<TypeScript>;
declare const rsIf: V.Statement.If<Rust>;
export const rsIfIsAnExpression: ExpressionAny<Rust> = rsIf;
// @ts-expect-error typescript's if is no expression
export const tsIfIsNoExpression: ExpressionAny<TypeScript> = tsIf;

declare const either: V.Statement.If<Rust | TypeScript>;
export const overAUnionOfMaps: ExpressionAny<Rust | TypeScript> = either;

interface Parent<G extends GrammarMap, K extends Under<'expression.probe'> = 'expression.probe'> {
	readonly $path: K;
	readonly value?: Slot<G, K, 'value', ExpressionAny<G>>;
}

export interface NarrowsToANativeKind<G extends GrammarMap, K extends Under<'expression.probe.a'> = 'expression.probe.a'> extends SubKindOf<Parent<G, K>> {
	readonly $path: K;
	readonly value?: Slot<G, K, 'value', V.Expression.Call<G>>;
}

export interface NarrowsToAUniversalAlias<G extends GrammarMap, K extends Under<'expression.probe.b'> = 'expression.probe.b'> extends SubKindOf<Parent<G, K>> {
	readonly $path: K;
	readonly value?: Slot<G, K, 'value', V.Identifier<G> | V.Literal.String<G>>;
}

// @ts-expect-error an ungated narrowing to a feature's alias cannot be shown to fit for every G
export interface NarrowsToAFeatureAliasUngated<G extends GrammarMap, K extends Under<'expression.probe.c'> = 'expression.probe.c'> extends SubKindOf<Parent<G, K>> {
	readonly $path: K;
	readonly value?: Slot<G, K, 'value', V.Statement.Block<G>>;
}

export interface NarrowsToAFeatureAliasGated<G extends GrammarMap, K extends Under<'expression.probe.d'> = 'expression.probe.d'> extends SubKindOf<Parent<G, K>> {
	readonly $path: K;
	readonly value?: Slot<G, K, 'value', In<G, V.ValuedBlocks, V.Statement.Block<G>>>;
}

// @ts-expect-error a narrowing gated on a feature the alias owner extends, not on the owner, cannot be shown to fit
export interface NarrowsToAFeatureAliasGatedByAnExtendingFeature<G extends GrammarMap, K extends Under<'expression.probe.e'> = 'expression.probe.e'> extends SubKindOf<Parent<G, K>> {
	readonly $path: K;
	readonly value?: Slot<G, K, 'value', In<G, V.RustExpressions, V.Statement.Block<G>>>;
}
