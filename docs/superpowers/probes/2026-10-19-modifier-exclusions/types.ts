// The type encoding of an exclusion group, on a stand-in for the accessor field's config.
// `tsc --ignoreConfig --noEmit --strict --target esnext --module esnext types.ts` exits 0, so tsc reports
// exactly the lines marked `@ts-expect-error`,
// and each message names the group's atoms (types-messages.txt holds what tsc 7 printed).

declare const PrivateName: unique symbol;
interface PrivatePropertyIdentifier {
	readonly [PrivateName]: true;
}
interface PropertyIdentifier {
	readonly text: string;
}

// An atom is a test of one config member: a flag that is `true`, an enum member that is one value,
// a node member that is one kind, or a member that is present.
interface Atom<Key extends string, Is> {
	readonly key: Key;
	readonly is: Is;
}
type Flag<Key extends string> = Atom<Key, true>;
type Holds<Key extends string, Kind> = Atom<Key, Kind>;
type Present<Key extends string> = Atom<Key, NonNullable<unknown>>;

// A group refuses two of its atoms together, or its one atom alone (a ban).
interface Group<Label extends string, Atoms extends readonly Atom<string, unknown>[]> {
	readonly label: Label;
	readonly atoms: Atoms;
}

type AtomHolds<C, A> = A extends Atom<infer Key, infer Is> ? (Key extends keyof C ? ([C[Key]] extends [Is] ? true : false) : false) : false;
type Holding<C, Atoms extends readonly unknown[]> = { [I in keyof Atoms]: AtomHolds<C, Atoms[I]> extends true ? I : never }[number];
type IsUnion<U, All = U> = U extends unknown ? ([All] extends [U] ? false : true) : never;
type Violated<C, G> =
	G extends Group<string, infer Atoms>
		? Atoms['length'] extends 1
			? [Holding<C, Atoms>] extends [never] ? false : true
			: true extends IsUnion<Holding<C, Atoms>> ? true : false
		: false;
type GroupLabel<G> = G extends { readonly label: infer L extends string } ? L : never;
type ViolatedLabels<C, Groups extends readonly unknown[]> = { [I in keyof Groups]: Violated<C, Groups[I]> extends true ? GroupLabel<Groups[I]> : never }[number];
export type Excluding<C, Groups extends readonly unknown[]> = [ViolatedLabels<C, Groups>] extends [never] ? unknown : { readonly $excluded: ViolatedLabels<C, Groups> };

// `$with`: a patch that sets an atom must clear the group's other atoms in the same patch, since the
// node's own values are not known to the type. A flag clears with `false`, an enum or node member
// with a value outside the atom, a present member with `undefined`.
type AtomCleared<P, A> = A extends Atom<infer Key, infer Is> ? (Key extends keyof P ? ([Extract<P[Key], Is>] extends [never] ? true : false) : false) : false;
type NotCleared<P, Atoms extends readonly unknown[]> = { [I in keyof Atoms]: AtomCleared<P, Atoms[I]> extends true ? never : I }[number];
type PatchViolated<P, G> =
	G extends Group<string, infer Atoms>
		? [Holding<P, Atoms>] extends [never]
			? false
			: Atoms['length'] extends 1
				? true
				: true extends IsUnion<NotCleared<P, Atoms>> ? true : false
		: false;
type PatchLabels<P, Groups extends readonly unknown[]> = { [I in keyof Groups]: PatchViolated<P, Groups[I]> extends true ? GroupLabel<Groups[I]> : never }[number];
export type WithExcluding<P, Groups extends readonly unknown[]> = [PatchLabels<P, Groups>] extends [never] ? unknown : { readonly $excluded: PatchLabels<P, Groups> };

// The accessor field's config and its groups, as the emitter would write them.
interface AccessorFieldConfig {
	readonly accessibilityModifier?: 'public' | 'private' | 'protected';
	readonly static?: boolean;
	readonly abstract?: boolean;
	readonly override?: boolean;
	readonly name: PropertyIdentifier | PrivatePropertyIdentifier;
	readonly value?: number;
}
type AccessorFieldExclusions = [
	Group<'static with abstract (TS1243)', [Flag<'static'>, Flag<'abstract'>]>,
	Group<'private with abstract (TS1243)', [Holds<'accessibilityModifier', 'private'>, Flag<'abstract'>]>,
	Group<'an accessibility modifier with a private name (TS18010)', [Present<'accessibilityModifier'>, Holds<'name', PrivatePropertyIdentifier>]>,
	Group<'abstract with an initializer (TS1267)', [Flag<'abstract'>, Present<'value'>]>
];
type BannedFlagExclusions = [Group<'readonly on a method (TS1024)', [Flag<'readonly'>]>];

declare function buildAccessorField<const C extends AccessorFieldConfig>(config: C & Excluding<C, AccessorFieldExclusions>): C;
declare function buildMethod<const C extends { readonly readonly?: boolean; readonly name: PropertyIdentifier }>(config: C & Excluding<C, BannedFlagExclusions>): C;

declare const plain: PropertyIdentifier;
declare const hash: PrivatePropertyIdentifier;
declare const wide: boolean;

buildAccessorField({ name: plain, static: true });
buildAccessorField({ name: plain, abstract: true, override: true });
buildAccessorField({ name: hash, static: true, abstract: false });
buildAccessorField({ name: plain, static: wide, abstract: true });
buildMethod({ name: plain, readonly: false });

// @ts-expect-error static with abstract
buildAccessorField({ name: plain, static: true, abstract: true });
// @ts-expect-error private with abstract
buildAccessorField({ name: plain, accessibilityModifier: 'private', abstract: true });
// @ts-expect-error an accessibility modifier with a private name
buildAccessorField({ name: hash, accessibilityModifier: 'public' });
// @ts-expect-error abstract with an initializer
buildAccessorField({ name: plain, abstract: true, value: 1 });
// @ts-expect-error two groups at once: both labels are named
buildAccessorField({ name: hash, accessibilityModifier: 'private', abstract: true });
// @ts-expect-error a ban
buildMethod({ name: plain, readonly: true });

declare const field: { $with<const P extends Partial<AccessorFieldConfig>>(patch: P & WithExcluding<P, AccessorFieldExclusions>): unknown };
declare const method: { $with<const P extends { readonly readonly?: boolean }>(patch: P & WithExcluding<P, BannedFlagExclusions>): unknown };

field.$with({ static: true, abstract: false });
field.$with({ abstract: false });
field.$with({ name: hash, accessibilityModifier: undefined });
field.$with({ abstract: true, static: false, accessibilityModifier: 'public', name: plain, value: undefined });
method.$with({ readonly: false });

// @ts-expect-error static set without clearing abstract
field.$with({ static: true });
// @ts-expect-error a private name set without clearing the accessibility modifier
field.$with({ name: hash });
// @ts-expect-error abstract set with private still allowed
field.$with({ abstract: true, static: false, value: undefined });
// @ts-expect-error an accessibility modifier set without a name of another kind than a private one
field.$with({ accessibilityModifier: 'public' });
// @ts-expect-error a ban set through $with
method.$with({ readonly: true });
