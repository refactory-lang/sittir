import type { OnlyOf } from './full-form.ts';

/** The option sites a kind's `Hints` interface carries, or `never` when it has none. */
export type OptionsHintOf<N> = N extends { readonly __optionsHint__?: infer H } ? H : never;

/**
 * The indentation unit a render may set: a string of the grammar's admitted
 * indent characters (`IndentChar`), each one of them, at least one. `I` is
 * the unit as the caller spelled it; a unit typed only as `string` is left
 * to the runtime check. A grammar that admits no indent character has no
 * `indent` key.
 */
export type IndentOption<I extends string, IndentChar extends string> = [IndentChar] extends [never]
	? unknown
	: { readonly indent?: I & OnlyOf<I, IndentChar> };

/**
 * A grammar's render options, derived from its `OptionsHintMap`: one optional
 * key per kind that has option sites, nested as the address trie is, plus the
 * indentation unit when the grammar admits an indent character. A plain
 * mapped type, so a kind's hint is resolved only when its key is read.
 */
export type DerivedOptions<HintMap, IndentChar extends string = never> = {
	readonly [K in keyof HintMap]?: OptionsHintOf<HintMap[K]>;
} & IndentOption<string, IndentChar>;
