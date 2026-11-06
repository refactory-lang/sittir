import type { GrammarMap } from '../../../map.ts';
import type { Flag } from '../../../utils.ts';
export namespace Clause {
	export namespace Export {
		export interface Specifier<G extends GrammarMap> {
			readonly typeOnly?: Flag;
			// t only
		}
	}
	export namespace Import {
		export interface Specifier<G extends GrammarMap> {
			readonly typeOnly?: Flag;
			// t only
		}
	}
}
