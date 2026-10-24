import type { GrammarContext } from './context.ts';
export interface Type<G extends GrammarContext<G>> {
	// claimed by p
	readonly $kind: 'type';
	readonly content?: G['slots']['type']['content'] | G['slots']['type']['content'][];
	// prt only
}

export interface TypeSynonyms {
	readonly boolean: 'bool';
	readonly character: 'char';
	readonly float64: 'double';
	readonly int16: 'short';
	readonly int8: 'byte';
	readonly nullable: 'maybe';
	readonly reference: 'borrow';
	readonly rest: 'splat' | 'unpack';
	readonly string: 'str';
}

