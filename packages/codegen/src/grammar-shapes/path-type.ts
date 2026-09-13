import type { PrecRuleUnion } from './grammar-json.ts';
import type { FieldPlaceholder } from '../dsl/primitives/field.ts';
import type { VariantPlaceholder } from '../dsl/primitives/variant.ts';
import type { AliasPlaceholder } from '../dsl/primitives/alias.ts';
import type { ArmDefaultPlaceholder } from '../dsl/primitives/arm.ts';
import type { FieldLike } from '../types/runtime-shapes.ts';

type PeelPrec<N> = N extends PrecRuleUnion ? PeelPrec<N['content']> : N;

type Container = { readonly type: 'SEQ' | 'CHOICE'; readonly members: readonly unknown[] };
type Field = { readonly type: 'FIELD'; readonly name: string; readonly content: unknown };
type Wrapper = {
	readonly type: 'ALIAS' | 'REPEAT' | 'REPEAT1' | 'TOKEN' | 'IMMEDIATE_TOKEN';
	readonly content: unknown;
};
type Symbol = { readonly type: 'SYMBOL'; readonly name: string };
type Leaf = { readonly type: 'STRING' };
type Opaque = { readonly type: '?' };

type Literal<N> = N extends { readonly type: 'STRING'; readonly value: infer V extends string } ? `"${V}"` : never;

type Kinds<N> = N extends PrecRuleUnion
	? Kinds<N['content']>
	: N extends Container
		? Kinds<N['members'][number]>
		: N extends { readonly type: 'REPEAT' | 'REPEAT1' | 'TOKEN' | 'IMMEDIATE_TOKEN'; readonly content: infer C }
			? Kinds<C>
			: N extends Symbol
				? N['name']
				: never;

type MatchKind<N, K extends string> = K extends Kinds<N> ? { readonly type: 'SYMBOL'; readonly name: K } : never;

type FromEnd<M extends readonly unknown[], K extends number, Acc extends unknown[] = [0]> = M extends readonly [
	...infer Init,
	infer Last
]
	? Acc['length'] extends K
		? Last
		: FromEnd<Init, K, [...Acc, 0]>
	: never;

type StepMembers<M extends readonly unknown[], S extends string, Beyond> = S extends '_'
	? M[number]
	: S extends `-${infer K extends number}`
		? FromEnd<M, K> | Beyond
		: S extends `${number}`
			? S extends keyof M
				? M[S]
				: Beyond
			: S extends Literal<M[number]>
				? Leaf
				: never;

type Step<P, S extends string> = P extends Opaque
	? Opaque
	: P extends Container
	?
			| StepMembers<P['members'], S, P extends { readonly type: 'CHOICE' } ? Opaque : never>
			| (S extends `(${infer K})` ? MatchKind<P, K> : never)
	: P extends Field
		? S extends '0' | '-1' | '_' | `${P['name']}:`
			? P['content']
			: S extends Literal<P['content']>
				? Leaf
				: never
		: P extends Wrapper
			? S extends '0' | '-1' | '_'
				? P['content']
				: S extends Literal<P['content']>
					? Leaf
					: S extends `(${infer K})`
						? P extends { readonly type: 'ALIAS' }
							? never
							: MatchKind<P, K>
						: never
			: P extends Symbol
				? S extends `(${P['name']})`
					? P
					: never
				: never;

export type Segments<P extends string> = P extends `"${infer Lit}"/${infer Rest}`
	? [`"${Lit}"`, ...Segments<Rest>]
	: P extends `"${infer Lit}"`
		? [`"${Lit}"`]
		: P extends `${infer Seg}/${infer Rest}`
			? [Seg, ...Segments<Rest>]
			: [P];

type Walk<N, Segs extends readonly string[]> = Segs extends readonly [infer S extends string, ...infer Rest extends string[]]
	? Step<PeelPrec<N>, S> extends infer C
		? [C] extends [never]
			? false
			: Walk<C, Rest>
		: never
	: true;

export type IsPath<N, P extends string> = true extends Walk<N, Segments<P>> ? true : false;

export type TransformPatchValue =
	| RuleOrLiteral
	| FieldPlaceholder
	| FieldLike
	| VariantPlaceholder
	| AliasPlaceholder
	| ArmDefaultPlaceholder;

export type TransformPatchMap = Partial<Record<string, TransformPatchValue>>;
