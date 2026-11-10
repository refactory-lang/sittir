import type { GrammarMap } from '../../../map.ts';
import type { Flag, Under } from '../../../utils.ts';
export namespace Clause {
	export namespace Export {
		export interface Specifier<G extends GrammarMap, K extends Under<'clause.export.specifier'> = 'clause.export.specifier'> {
			readonly typeOnly?: Flag;
			// t only
		}
	}
	export namespace Import {
		export interface Specifier<G extends GrammarMap, K extends Under<'clause.import.specifier'> = 'clause.import.specifier'> {
			readonly typeOnly?: Flag;
			// t only
		}
	}
}
