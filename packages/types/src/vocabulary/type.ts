import type { GrammarMap } from './map.ts';
import type { Under } from './utils.ts';
import type * as V from './index.ts';
export interface Type<G extends GrammarMap, K extends Under<'type'> = 'type'> {
	// claimed by p
	readonly $path: K;
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
export namespace Type {
	export type Identifier<G extends GrammarMap> = V.Identifier.Any<G>;
}
