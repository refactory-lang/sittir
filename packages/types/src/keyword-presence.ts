/**
 * BooleanKeyword<TText> — brands boolean storage for a keyword-presence
 * position. UntypedNode stores `boolean`; the brand preserves the keyword's
 * literal text so ConfigOf / LooseConfigOf can continue to widen to the
 * ergonomic string form when desired.
 */
export type BooleanKeyword<TText extends string = never> = boolean & {
	readonly __booleanKeyword__?: TText;
};

/** @internal — true when T carries the BooleanKeyword brand key. */
export type IsBooleanKeyword<T> = T extends { readonly __booleanKeyword__?: unknown } ? true : false;

/** @internal — extract the keyword text out of a BooleanKeyword brand. */
export type BooleanKeywordText<T> = T extends { readonly __booleanKeyword__?: infer V } ? V : never;
