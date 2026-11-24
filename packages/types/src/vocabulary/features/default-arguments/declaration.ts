import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> {
		readonly default?: Slot<G, K, 'default', V.Expression.Any<G>>;
		// pt only
	}
	export namespace Parameter {
		export interface Defaulted<G extends GrammarMap, K extends Under<'declaration.parameter.defaulted'> = 'declaration.parameter.defaulted'> {
		}
		export interface TypedDefault<G extends GrammarMap, K extends Under<'declaration.parameter.typed_default'> = 'declaration.parameter.typed_default'> {
		}
	}
}
