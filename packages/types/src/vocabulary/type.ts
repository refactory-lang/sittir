import type { GrammarMap, Slot } from './map.ts';
export interface Type<G extends GrammarMap> {
	// claimed by p
	readonly $kind: 'type';
	readonly content?: Slot<G, 'type', 'content', unknown>;
	// prt only
}

export interface TypeSynonyms {
	readonly boolean: 'bool';
	readonly character: 'char';
	readonly float64: 'double';
	readonly int16: 'short';
	readonly int8: 'byte';
	readonly nullable: 'maybe';
	readonly receiver: 'self' | 'this';
	readonly reference: 'borrow';
	readonly rest: 'splat' | 'unpack';
	readonly string: 'str';
}

