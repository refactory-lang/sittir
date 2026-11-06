import type { GrammarMap, Slot } from './map.ts';
import type { Under } from './utils.ts';
export interface Type<G extends GrammarMap, K extends Under<'type'> = 'type'> {
	// claimed by p
	readonly $kind: K;
	readonly content?: Slot<G, K, 'content', unknown>;
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

