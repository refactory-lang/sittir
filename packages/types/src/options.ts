/** The option sites a kind's `Hints` interface carries, or `never` when it has none. */
export type OptionsHintOf<N> = N extends { readonly __optionsHint__?: infer H } ? H : never;

/**
 * A grammar's render options, derived from its `OptionsHintMap`: one optional
 * key per kind that has option sites, nested as the address trie is, plus the
 * indentation unit. A plain mapped type, so a kind's hint is resolved only
 * when its key is read.
 */
export type DerivedOptions<HintMap> = {
	readonly [K in keyof HintMap]?: OptionsHintOf<HintMap[K]>;
} & { readonly indent?: string };
