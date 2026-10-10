import type { Chain, Crossings, Flag, In, KindFlags, Paths, SharedRoots } from './mapped.ts';

interface AsyncAwait { readonly 'async-await': true }
interface Generators { readonly generators: true }
type SubKindOf<T extends { readonly $kind: string }> = { readonly [K in keyof T]: K extends '$kind' ? `${T['$kind']}.${string}` : T[K] };

interface Method<G> {
	readonly $kind: 'declaration.method';
	readonly name: string;
	readonly static?: Flag;
	readonly async?: In<G, AsyncAwait, Flag>;
	readonly generator?: In<G, Generators, Flag>;
}
declare namespace Method {
	interface Getter<G> extends SubKindOf<Method<G>> { readonly $kind: 'declaration.method.getter' }
	interface Setter<G> extends SubKindOf<Method<G>> { readonly $kind: 'declaration.method.setter'; readonly value: string }
	interface Signature<G> extends SubKindOf<Method<G>> { readonly $kind: 'declaration.method.signature' }
	namespace Signature {
		interface Getter<G> extends SubKindOf<Method.Signature<G>> { readonly $kind: 'declaration.method.signature.getter' }
	}
	interface Public<G> extends SubKindOf<Method<G>> { readonly $kind: 'declaration.method.public' }
	namespace Public {
		interface Internal<G> extends SubKindOf<Method.Public<G>> { readonly $kind: 'declaration.method.public.internal' }
		interface Restricted<G> extends SubKindOf<Method.Public<G>> { readonly $kind: 'declaration.method.public.restricted'; readonly scope: string }
	}
	interface Private<G> extends SubKindOf<Method<G>> { readonly $kind: 'declaration.method.private' }
}
interface Field<G> {
	readonly $kind: 'declaration.field';
	readonly name: string;
	readonly optional?: Flag;
	readonly definite?: Flag;
	readonly static?: Flag;
	readonly accessor?: Flag;
	readonly sign?: boolean;
}
declare namespace Field {
	interface Signature<G> extends SubKindOf<Field<G>> { readonly $kind: 'declaration.field.signature' }
	interface Public<G> extends SubKindOf<Field<G>> { readonly $kind: 'declaration.field.public' }
	interface Private<G> extends SubKindOf<Field<G>> { readonly $kind: 'declaration.field.private' }
}
interface Visibility<G> { readonly $kind: 'modifier.visibility' }
declare namespace Visibility {
	interface Public<G> extends SubKindOf<Visibility<G>> { readonly $kind: 'modifier.visibility.public' }
	namespace Public {
		interface Internal<G> extends SubKindOf<Visibility.Public<G>> { readonly $kind: 'modifier.visibility.public.internal' }
		interface Restricted<G> extends SubKindOf<Visibility.Public<G>> { readonly $kind: 'modifier.visibility.public.restricted'; readonly scope: string }
	}
	interface Protected<G> extends SubKindOf<Visibility<G>> { readonly $kind: 'modifier.visibility.protected' }
	interface Private<G> extends SubKindOf<Visibility<G>> { readonly $kind: 'modifier.visibility.private' }
}
type Authored<G> =
	| Method<G> | Method.Getter<G> | Method.Setter<G> | Method.Signature<G> | Method.Signature.Getter<G>
	| Method.Public<G> | Method.Public.Internal<G> | Method.Public.Restricted<G> | Method.Private<G>
	| Field<G> | Field.Signature<G> | Field.Public<G> | Field.Private<G>
	| Visibility<G> | Visibility.Public<G> | Visibility.Public.Internal<G> | Visibility.Public.Restricted<G> | Visibility.Protected<G> | Visibility.Private<G>;
type Kinds<G> = Authored<G> | Crossings<Authored<G>>;
check<Equal<SharedRoots<Authored<Typescript>>, 'modifier.visibility'>>();

interface Typescript extends AsyncAwait, Generators {
	readonly $exclusions: {
		readonly 'declaration.field': readonly [readonly ['optional', 'definite'], readonly ['accessor', 'static']];
		readonly 'declaration.method': readonly [readonly ['generator', 'getter'], readonly ['generator', 'setter']];
	};
}
interface Rust { readonly $exclusions: {} }

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
declare function check<T extends true>(): void;

// (1) crossings, structural first
check<Equal<Extract<Exclude<Paths<Kinds<Typescript>>, Paths<Authored<Typescript>>>, `declaration.method.${string}`>,
	| 'declaration.method.getter.public' | 'declaration.method.getter.public.internal' | 'declaration.method.getter.public.restricted' | 'declaration.method.getter.private'
	| 'declaration.method.setter.public' | 'declaration.method.setter.public.internal' | 'declaration.method.setter.public.restricted' | 'declaration.method.setter.private'
	| 'declaration.method.signature.public' | 'declaration.method.signature.public.internal' | 'declaration.method.signature.public.restricted' | 'declaration.method.signature.private'
	| 'declaration.method.signature.getter.public' | 'declaration.method.signature.getter.public.internal' | 'declaration.method.signature.getter.public.restricted' | 'declaration.method.signature.getter.private'>>();
// @ts-expect-error a value never precedes a structural refinement
check<Equal<Extract<Paths<Kinds<Typescript>>, 'declaration.method.public.getter'>, 'declaration.method.public.getter'>>();
// a field crosses only the values it authors
check<Equal<Extract<Paths<Kinds<Typescript>>, `declaration.field.signature.${string}`>, 'declaration.field.signature.public' | 'declaration.field.signature.private'>>();
// a crossing keeps the structural refinement's members and gains the value's
type SetterRestricted = Extract<Kinds<Typescript>, { readonly $kind: 'declaration.method.setter.public.restricted' }>;
check<Equal<SetterRestricted['scope'], string>>();
check<Equal<SetterRestricted['value'], string>>();

// (2) per-kind flags, gated by feature
check<Equal<KindFlags<Kinds<Typescript>, 'declaration.method'>, 'static' | 'async' | 'generator'>>();
check<Equal<KindFlags<Kinds<Rust>, 'declaration.method'>, 'static'>>();
check<Equal<KindFlags<Kinds<Typescript>, 'declaration.method.getter.public'>, 'static' | 'async' | 'generator'>>();
// a boolean member is data, not a flag
check<Equal<KindFlags<Kinds<Typescript>, 'declaration.field'>, 'optional' | 'definite' | 'static' | 'accessor'>>();

// (3) the typed chain leaves out what a step excludes
declare const field: Chain<Typescript, Kinds<Typescript>, 'declaration.field'>;
field.optional.static;
field.accessor.optional;
// @ts-expect-error after `.optional` a field has no `.definite`
field.optional.definite;
// @ts-expect-error after `.static` a field has no `.accessor`
field.static.accessor;
// @ts-expect-error a step is taken once
field.optional.optional;
declare const getter: Chain<Typescript, Kinds<Typescript>, 'declaration.method.getter'>;
getter.static.async;
// @ts-expect-error a getter has no `.generator`
getter.generator;
declare const rustField: Chain<Rust, Kinds<Rust>, 'declaration.field'>;
rustField.optional.definite;
