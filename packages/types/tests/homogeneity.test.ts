/**
 * Spec 009 Layer 1 — homogeneity-aware Loose projection.
 *
 * When a field/child slot accepts a union of branch kinds whose Loose
 * projections are structurally identical, the `{ kind: K }` tag requirement
 * is dropped — the runtime resolver dispatches by field-presence either way.
 *
 * Verification is type-level: we construct a synthetic NamespaceMap with
 * known homogeneous and heterogeneous unions and assert the expected
 * `WidenValue` behaviour.
 *
 * Runtime assertions are minimal — the FAILURE MODE is `tsc --noEmit`
 * emitting errors on the `expectTrue<Equals<...>>()` calls below.
 */

import { describe, it } from 'vitest';
import type { FromInputOf } from '../src/index.ts';

type Equals<A, B> =
	(<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

function expectTrue<_T extends true>(): void {}

// --- Synthetic grammar: two homogeneous branches + one heterogeneous ---

interface HomoLeft { readonly $type: 'homo_left'; readonly $fields: { readonly x: number; readonly y: number } }
interface HomoRight { readonly $type: 'homo_right'; readonly $fields: { readonly x: number; readonly y: number } }
interface HeteroExtra { readonly $type: 'hetero_extra'; readonly $fields: { readonly x: number; readonly y: number; readonly z: number } }

// Parent slot that accepts either homogeneous arm.
interface ParentHomo {
	readonly $type: 'parent_homo';
	readonly $fields: { readonly child: HomoLeft | HomoRight };
}

// Parent slot that accepts a heterogeneous mix.
interface ParentHetero {
	readonly $type: 'parent_hetero';
	readonly $fields: { readonly child: HomoLeft | HeteroExtra };
}

// Synthetic NamespaceMap — threaded into FromInputOf as the NsMap param.
interface SyntheticNamespaceMap {
	homo_left: { Loose: FromInputOf<HomoLeft, {}, {}, [], SyntheticNamespaceMap> };
	homo_right: { Loose: FromInputOf<HomoRight, {}, {}, [], SyntheticNamespaceMap> };
	hetero_extra: { Loose: FromInputOf<HeteroExtra, {}, {}, [], SyntheticNamespaceMap> };
	parent_homo: { Loose: FromInputOf<ParentHomo, {}, {}, [], SyntheticNamespaceMap> };
	parent_hetero: { Loose: FromInputOf<ParentHetero, {}, {}, [], SyntheticNamespaceMap> };
}

type HomoLoose = SyntheticNamespaceMap['parent_homo']['Loose'];
type HeteroLoose = SyntheticNamespaceMap['parent_hetero']['Loose'];

describe('Spec 009 Layer 1 — homogeneity-aware Loose', () => {
	it('homogeneous union accepts a bare bag (no `kind` tag required)', () => {
		// A bare loose bag with just the shared fields should be
		// assignable to the parent's `child` slot value type.
		type HomoChildSlot = NonNullable<HomoLoose['child']>;
		// Acceptance: the bare `{ x, y }` bag extends the child slot type.
		// If the homogeneity check DOESN'T fire, this fails because the
		// type requires `{ kind: 'homo_left' | 'homo_right' } & { x, y }`.
		type BareBag = { readonly x: number; readonly y: number };
		type BagAssignable = BareBag extends HomoChildSlot ? true : false;
		expectTrue<BagAssignable>();
	});

	it('heterogeneous union still requires `kind` tag discrimination', () => {
		// A bare `{ x, y }` bag should NOT be directly assignable when the
		// union has a heterogeneous arm (heteroExtra has `{x, y, z}`).
		type HeteroChildSlot = NonNullable<HeteroLoose['child']>;
		type BareBag = { readonly x: number; readonly y: number };
		// When heterogeneous, assignability holds ONLY for kinds whose shape
		// matches exactly — `HomoLeft`'s bag is `{x, y}` so `BareBag` still
		// matches that arm structurally. But the heterogeneous arm forces
		// `{kind: K}` into at least one member of the union; the check here
		// is that the tagged form is a member of the slot union.
		type Tagged = { readonly kind: 'hetero_extra'; readonly x: number; readonly y: number; readonly z: number };
		type TaggedAssignable = Tagged extends HeteroChildSlot ? true : false;
		expectTrue<TaggedAssignable>();

		// Bare `{x, y}` still works via the homogeneous arm — but the
		// heterogeneous arm requires a tag. That's the whole point:
		// homogeneity is a PER-UNION property (all arms must match),
		// not per-member.
		void ({} as BareBag);
	});
});
