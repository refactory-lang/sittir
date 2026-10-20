import type { HoldsSource, SourceMember } from '@sittir/types';

/** Where a node came from, as `sourceOf` reports it: a tree-sitter read (`Ts`), an ast-grep read (`Sg`), or a builder (`Factory`). */
export const Source = { Ts: 0, Sg: 1, Factory: 2 } as const satisfies Record<string, HoldsSource[typeof SourceMember]>;

/** One of the `Source` values. */
export type Source = (typeof Source)[keyof typeof Source];
