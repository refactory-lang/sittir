import { describe, expectTypeOf, it } from 'vitest';
import type { BoundOf, ParsedOf, SlotHint, ListSlotHint, ListViewHint, NodeMethods, WithNode } from '../src/index.ts';

const enum K {
	Fn = 1,
	Params = 2,
	Param = 3,
	Kw = 4,
	Items = 5
}
interface Param {
	readonly $type: K.Param;
	readonly _name: string;
	name(): string;
	readonly __slotHints__?: { name: SlotHint<string> };
}
interface Items {
	readonly $type: K.Items;
	readonly _element: readonly Param[];
	element(): readonly Param[];
	readonly __slotHints__?: {
		element: SlotHint<readonly Param[], false, true>;
		$listView: ListViewHint<Param, { delimiter?: 0 | 2 }>;
	};
}
interface Params {
	readonly $type: K.Params;
	readonly _items?: Items;
	items(): Items | undefined;
	readonly __slotHints__?: {
		items: SlotHint<Items, true>;
		$listView: ListViewHint<Param, { delimiter?: 0 | 2 }>;
		$listSlots: { items: ListSlotHint<Param, { delimiter?: 0 | 2 }> };
	};
}
interface Fn {
	readonly $type: K.Fn;
	readonly _params: Params;
	readonly _kw?: K.Kw;
	params(): Params;
	kw(): K.Kw | undefined;
	readonly __slotHints__?: {
		params: SlotHint<Params>;
		kw: SlotHint<K.Kw, true>;
		$listSlots: { params: ListSlotHint<Param, { delimiter?: 0 | 2 }> };
	};
}
declare namespace Param {
	interface Bound extends BoundOf<Param, ByB>, Pick<NodeMethods, '$render'> {
		readonly $with: WithNode<this, ByB>;
	}
	interface Parsed extends ParsedOf<Param, ByP>, Pick<NodeMethods, '$render'> {
		readonly $with: WithNode<this, ByB>;
	}
}
declare namespace Items {
	interface Bound extends BoundOf<Items, ByB>, Pick<NodeMethods, '$render'> {
		readonly $with: WithNode<this, ByB>;
	}
	interface Parsed extends ParsedOf<Items, ByP>, Pick<NodeMethods, '$render'> {
		readonly $with: WithNode<this, ByB>;
	}
}
declare namespace Params {
	interface Bound extends BoundOf<Params, ByB>, Pick<NodeMethods, '$render'> {
		readonly $with: WithNode<this, ByB>;
	}
	interface Parsed extends ParsedOf<Params, ByP>, Pick<NodeMethods, '$render'> {
		readonly $with: WithNode<this, ByB>;
	}
}
declare namespace Fn {
	interface Bound extends BoundOf<Fn, ByB>, Pick<NodeMethods, '$render'> {
		readonly $with: WithNode<this, ByB>;
	}
	interface Parsed extends ParsedOf<Fn, ByP>, Pick<NodeMethods, '$render'> {
		readonly $with: WithNode<this, ByB>;
	}
}
interface ByB {
	[K.Fn]: Fn.Bound;
	[K.Params]: Params.Bound;
	[K.Param]: Param.Bound;
	[K.Items]: Items.Bound;
}
interface ByP {
	[K.Fn]: Fn.Parsed;
	[K.Params]: Params.Parsed;
	[K.Param]: Param.Parsed;
	[K.Items]: Items.Parsed;
}

declare const fn: Fn.Parsed;
declare const built: Params.Bound;
declare const items: Items.Bound;
declare const storageParams: Params;
declare const bound: Fn.Bound;
declare const param: Param.Bound;
declare const storageParam: Param;
declare const owner: Params.Parsed;

describe('BoundOf / ParsedOf', () => {
	it('children resolve to their own Parsed', () => {
		expectTypeOf(fn.params()).toEqualTypeOf<Params.Parsed>();
	});
	it('a kind-id-stored child stays its id', () => {
		expectTypeOf(fn.kw()).toEqualTypeOf<K.Kw | undefined>();
	});
	it('a list owner and its list node read as a ReadonlyArray of the items and carry the options', () => {
		const ps = fn.params();
		expectTypeOf(ps).toExtend<ReadonlyArray<Param.Parsed>>();
		expectTypeOf(ps[0]).toEqualTypeOf<Param.Parsed | undefined>();
		expectTypeOf(ps.map((p) => p.name())).toEqualTypeOf<string[]>();
		expectTypeOf(ps.items()).toEqualTypeOf<Items.Parsed | undefined>();
		expectTypeOf(ps.items()!).toExtend<ReadonlyArray<Param.Parsed>>();
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
	it('a storage-shaped input is refused: a node slot admits built nodes by kind', () => {
		// @ts-expect-error storage interface is not a node
		fn.$with.params(storageParams);
		// @ts-expect-error storage interface is not a node
		owner.$with.items(storageParam);
	});
	it('a wrong input is rejected', () => {
		// @ts-expect-error Params.Bound expected
		fn.$with.params('x');
	});
	it('a slot that holds a list takes its builder arguments', () => {
		expectTypeOf(owner.$with.items(param, param).items()).toEqualTypeOf<Items.Bound>();
		expectTypeOf(owner.$with.items({ delimiter: 2 }, param)).toHaveProperty('items');
		expectTypeOf(owner.$with.items(items)).toHaveProperty('items');
		expectTypeOf(owner.$with.items()).toHaveProperty('items');
		expectTypeOf(fn.$with.params(param, param).params()).toEqualTypeOf<Params.Bound>();
		expectTypeOf(fn.$with.params(...fn.params())).toHaveProperty('params');
	});
	it('a list node of another kind is not taken as the options bag', () => {
		// @ts-expect-error an Items node is not a Params node, and a node is never options
		fn.$with.params(items);
		// @ts-expect-error a node is never options, even with items after it
		fn.$with.params(items, param);
	});
	it('$with has no call signature, a list owner included', () => {
		// @ts-expect-error not callable
		fn.$with(built);
		// @ts-expect-error not callable
		owner.$with(param);
	});
	it('Bound $with returns Bound', () => {
		expectTypeOf(bound.$with.params(built).params()).toEqualTypeOf<Params.Bound>();
	});
});
