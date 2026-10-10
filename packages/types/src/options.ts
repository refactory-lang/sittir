import type { OnlyOf } from './full-form.ts';

/** The option sites a kind's `Hints` interface carries, or `never` when it has none. */
export type OptionsHintOf<N> = N extends { readonly __optionsHint__?: infer H } ? H : never;

/**
 * The indentation unit a render may set, under the `layout` group: a string
 * of the grammar's admitted indent characters (`IndentChar`), each one of
 * them, at least one. `I` is the unit as the caller spelled it; a unit typed
 * only as `string` is left to the runtime check. A grammar that admits no
 * indent character has no `layout.indent` key.
 */
export type IndentOption<I extends string, IndentChar extends string> = [IndentChar] extends [never]
	? unknown
	: { readonly layout?: { readonly indent?: I & OnlyOf<I, IndentChar> } };

/**
 * The line ending a render spells every break with, under the `layout` group:
 * one of the arms of the grammar's `_newline` member (`LineEnding`). A grammar
 * that admits no `_newline` has no `layout.newline` key.
 */
export type NewlineOption<LineEnding extends string> = [LineEnding] extends [never]
	? unknown
	: { readonly layout?: { readonly newline?: LineEnding } };

/** The `layout` group: the settings of the whole render, `indent` and `newline`. */
export type LayoutOption<I extends string, IndentChar extends string, LineEnding extends string> = IndentOption<I, IndentChar> &
	NewlineOption<LineEnding>;

/**
 * A grammar's render options, derived from its `OptionsHintMap`: one optional
 * key per kind that has option sites, nested as the address trie is, plus the
 * `layout` group: the indentation unit when the grammar admits an indent
 * character, the line ending when it admits `_newline`. A plain
 * mapped type, so a kind's hint is resolved only when its key is read.
 */
export type DerivedOptions<HintMap, IndentChar extends string = never, LineEnding extends string = never> = {
	readonly [K in keyof HintMap]?: OptionsHintOf<HintMap[K]>;
} & LayoutOption<string, IndentChar, LineEnding>;
