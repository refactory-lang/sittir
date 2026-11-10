import type { Generic } from '../generic/index.ts';
import type { TypeAnnotations } from '../type-annotations/index.ts';
import type { TypeAliases } from '../type-aliases/index.ts';

/** Annotated typing: generic programming, type annotations and type aliases. */
export interface Annotated extends Generic, TypeAnnotations, TypeAliases {
	readonly annotated: true;
}
