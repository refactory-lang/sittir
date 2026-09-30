import { describe, expectTypeOf, it } from 'vitest';
import type { BoundOf, ParsedOf, SlotHint, ListOwnerHint, WithNode } from '../src/index.ts';

const enum K {
	Fn = 1,
	Params = 2,
	Param = 3,
	Kw = 4
}
interface Param {
	readonly $type: K.Param;
	readonly _name: string;
	name(): string;
	readonly __slotHints__?: { name: SlotHint<string> };
}
interface Params {
	readonly $type: K.Params;
	readonly _elements?: readonly Param[];
	elements(): readonly Param[] | undefined;
	readonly __slotHints__?: {
		elements: SlotHint<readonly Param[], true, true>;
		$listOwner: ListOwnerHint<Param, { delimiter?: 0 | 2 }>;
	};
}
interface Fn {
	readonly $type: K.Fn;
	readonly _params: Params;
	readonly _kw?: K.Kw;
	params(): Params;
	kw(): K.Kw | undefined;
	readonly __slotHints__?: { params: SlotHint<Params>; kw: SlotHint<K.Kw, true> };
}
declare namespace Param {
	interface Bound extends BoundOf<Param, ByB> { readonly $with: WithNode<this, ByB, ByP> }
	interface Parsed extends ParsedOf<Param, ByP> { readonly $with: WithNode<this, ByB, ByP> }
}
declare namespace Params {
	interface Bound extends BoundOf<Params, ByB> { readonly $with: WithNode<this, ByB, ByP> }
	interface Parsed extends ParsedOf<Params, ByP> { readonly $with: WithNode<this, ByB, ByP> }
}
declare namespace Fn {
	interface Bound extends BoundOf<Fn, ByB> { readonly $with: WithNode<this, ByB, ByP> }
	interface Parsed extends ParsedOf<Fn, ByP> { readonly $with: WithNode<this, ByB, ByP> }
}
interface ByB {
	[K.Fn]: Fn.Bound;
	[K.Params]: Params.Bound;
	[K.Param]: Param.Bound;
}
interface ByP {
	[K.Fn]: Fn.Parsed;
	[K.Params]: Params.Parsed;
	[K.Param]: Param.Parsed;
}

declare const fn: Fn.Parsed;
declare const built: Params.Bound;
declare const storageParams: Params;
declare const bound: Fn.Bound;
declare const param: Param;
declare const owner: Params.Parsed;

describe('BoundOf / ParsedOf', () => {
	it('children resolve to their own Parsed', () => {
		expectTypeOf(fn.params()).toEqualTypeOf<Params.Parsed>();
	});
	it('a kind-id-stored child stays its id', () => {
		expectTypeOf(fn.kw()).toEqualTypeOf<K.Kw | undefined>();
	});
	it('a list owner iterates its stored elements and carries its options', () => {
		const ps = fn.params();
		expectTypeOf([...ps]).toEqualTypeOf<Param.Parsed[]>();
		expectTypeOf(ps.length).toEqualTypeOf<number>();
		expectTypeOf(ps.at(0)).toEqualTypeOf<Param.Parsed | undefined>();
		expectTypeOf(ps.delimiter).toEqualTypeOf<0 | 2 | undefined>();
	});
	it('$with retypes only the replaced slot, and chains accumulate', () => {
		const d1 = fn.$with.params(built);
		expectTypeOf(d1.params()).toEqualTypeOf<Params.Bound>();
		expectTypeOf(d1.kw()).toEqualTypeOf<K.Kw | undefined>();
		const d2 = d1.$with.kw(K.Kw);
		expectTypeOf(d2.params()).toEqualTypeOf<Params.Bound>();
		expectTypeOf(d2.kw()).toEqualTypeOf<K.Kw>();
	});
	it('an optional slot can be cleared', () => {
		expectTypeOf(fn.$with.kw()).toHaveProperty('kw');
	});
	it('a storage-typed input reads back as its Bound surface', () => {
		expectTypeOf(fn.$with.params(storageParams).params()).toEqualTypeOf<Params.Bound>();
	});
	it('a wrong input is rejected', () => {
		// @ts-expect-error Params.Bound expected
		fn.$with.params('x');
	});
	it('a multiple slot is set with rest arguments and reads back its input', () => {
		const d = owner.$with.elements(param, param);
		expectTypeOf(d.elements()).toEqualTypeOf<readonly Param.Bound[]>();
		expectTypeOf(owner.$with.elements()).toHaveProperty('elements');
	});
	it('Bound $with returns Bound', () => {
		expectTypeOf(bound.$with.params(built).params()).toEqualTypeOf<Params.Bound>();
	});
});
