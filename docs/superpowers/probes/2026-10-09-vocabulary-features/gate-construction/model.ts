// Portable construction as ruled: each language's portable interface is generated with its members spelled out and
// extends the vocabulary over its context; builders take those interfaces; a node built for several languages is a
// JSON object that satisfies the vocabulary over a declared context.
import {
	type AsyncAwait,
	type Decorator,
	type Decorators,
	type Flag,
	type GrammarContext,
	type Ident,
	type PythonContext,
	type RustContext,
	flag
} from './base.ts';

type In<G, F, T> = G extends F ? T : never;
export interface Fn<G extends GrammarContext<G>> {
	readonly $kind: 'declaration.function';
	readonly name: G['identifier'];
	readonly async?: In<G, AsyncAwait, Flag>;
	readonly decorators?: In<G, Decorators, readonly Decorator[]>;
}
// `extends` makes a generated interface that does not match the vocabulary a compile error.
export interface RustFn extends Fn<RustContext> {
	readonly $kind: 'declaration.function';
	readonly name: Ident;
	readonly async?: Flag;
}
export interface PythonFn extends Fn<PythonContext> {
	readonly $kind: 'declaration.function';
	readonly name: Ident;
	readonly async?: Flag;
	readonly decorators?: readonly Decorator[];
}
export declare function buildRust(fn: RustFn): void;
export declare function buildPython(fn: PythonFn): void;

interface Authored extends GrammarContext<Authored>, AsyncAwait {}
export const node = { $kind: 'declaration.function', name: { $kind: 'identifier' }, async: flag } satisfies Fn<Authored>;
buildRust(node);
buildPython(node);

interface Decorated extends GrammarContext<Decorated>, Decorators {}
export const decorated = {
	$kind: 'declaration.function',
	name: { $kind: 'identifier' },
	decorators: [{ $kind: 'decorator' }]
} satisfies Fn<Decorated>;
buildPython(decorated);
// @ts-expect-error rust has no decorators
buildRust(decorated);

// Annotated rather than satisfied, the object carries its context's permissive role fill, which python narrows.
export const annotated: Fn<Authored> = { $kind: 'declaration.function', name: { $kind: 'identifier' }, async: flag };
// @ts-expect-error 'identifier.private' is not one of python's identifiers
buildPython(annotated);
// With the role narrowed, a context without a feature python has is no obstacle: the absent member is never.
interface Narrowed extends GrammarContext<Narrowed>, AsyncAwait {
	readonly identifier: Ident;
}
export const narrowed: Fn<Narrowed> = { $kind: 'declaration.function', name: { $kind: 'identifier' }, async: flag };
buildPython(narrowed);
