import type { GrammarRule, SeqRule, ChoiceRule, PrecRuleUnion, SingleContentWrapper } from './grammar-json.ts';
import type { FieldPlaceholder } from '../dsl/primitives/field.ts';
import type { VariantPlaceholder } from '../dsl/primitives/variant.ts';
import type { AliasPlaceholder } from '../dsl/primitives/alias.ts';
import type { ArmDefaultPlaceholder } from '../dsl/primitives/arm.ts';
import type { FieldLike } from '../types/runtime-shapes.ts';

type PeelPrec<N extends GrammarRule> = N extends PrecRuleUnion ? PeelPrec<N['content']> : N;

type IndicesOf<M extends readonly unknown[]> = Extract<keyof M, `${number}`>;

export type TopLevelKeys<N extends GrammarRule> =
	PeelPrec<N> extends infer P
		? P extends SeqRule | ChoiceRule
			? IndicesOf<P['members']>
			: P extends SingleContentWrapper
				? '0'
				: never
		: never;

type NonNumericFirstSegment = '_' | `(${string})` | `${string}:` | `-${number}`;

export type PathKey<N extends GrammarRule> =
	| TopLevelKeys<N>
	| NonNumericFirstSegment
	| `${TopLevelKeys<N>}/${string}`
	| `${NonNumericFirstSegment}/${string}`;

export type TransformPatchValue =
	| RuleOrLiteral
	| FieldPlaceholder
	| FieldLike
	| VariantPlaceholder
	| AliasPlaceholder
	| ArmDefaultPlaceholder;

export type TransformPatchMap<Keys extends string> = Partial<Record<Keys, TransformPatchValue>>;

export type FastKeys<R extends GrammarRule> = PathKey<R>;
