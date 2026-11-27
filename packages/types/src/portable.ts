export type * from './portable-build.ts';
export type { PortableCondition, PortableFact, PortablePath, PortableProjectRows, PortableReadEntry, PortableRows, PortableStep, PortableTable, PortableUnreadSlot } from './portable-read.ts';

/** A portable kind: one vocabulary path, the same object for every language. */
export type PortableKind<Path extends string = string> = { readonly $path: Path };

/** A portable namespace: a prefix of vocabulary paths that is no path itself, the same object for every language; it names the kinds beneath it, with no `$path` of its own. */
export type PortableNamespace<Path extends string = string> = { readonly $namespace: Path };

/**
 * Whether `value` reads as a vocabulary path or one under it, narrowing it to the grammar kinds read there, or to their texts.
 *
 * @typeParam Ids - The grammar kinds read at or under the path.
 * @typeParam Node - The grammar's node union; a node of another language, or one whose language is unknown, is refused.
 * @typeParam Kind - The grammar's kind-id enum: a bare kind id of the language is read by its kind and fixed text. A value typed as
 * a plain `number` is still admitted by the type, since a numeric enum accepts one.
 * @typeParam Text - The fixed texts of the tokens read at or under the path. Where there are any, a string is admitted and holds when
 * it is the text of one of those tokens.
 * @param value - A node of the language, parsed or built, read by the rows of the engine that stamped it, a kind id of the
 * language, or a token's text, each read by the rows its engine loaded.
 * @throws When given a kind id or a text before an engine of the language has loaded.
 */
export type PortableGuard<
	Ids extends number,
	Node extends { readonly $type: number } = { readonly $type: number },
	Kind extends number = never,
	Text extends string = never
> = <T extends Node | Kind | ([Text] extends [never] ? never : string)>(
	value: T
) => value is T extends string ? T & Text : T extends number ? T & Ids : T & { readonly $type: Ids };

/** What a bound grammar adds for the portable engine: its vocabulary namespaces of kind ids and of guards. */
export interface PortableSurface {
	readonly kinds: object;
	readonly is: object;
}
