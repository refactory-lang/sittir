import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
		readonly mutable?: Flag;
		// r only
	}
	export namespace Parameter {
		export interface Receiver<G extends GrammarMap, K extends Under<'declaration.parameter.receiver'> = 'declaration.parameter.receiver'> {
			readonly mutable?: Flag;
			// r only
		}
		export interface Variadic<G extends GrammarMap, K extends Under<'declaration.parameter.variadic'> = 'declaration.parameter.variadic'> {
			readonly mutable?: Flag;
		}
	}
	export interface Variable<G extends GrammarMap, K extends Under<'declaration.variable'> = 'declaration.variable'> {
		readonly alternative?: Slot<G, K, 'alternative', V.Statement.Block<G>>;
		// r only
		readonly mutable?: Flag;
		// r only
	}
}
