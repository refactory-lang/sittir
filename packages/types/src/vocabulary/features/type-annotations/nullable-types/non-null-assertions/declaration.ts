import type { GrammarMap } from '../../../../map.ts';
import type { Flag, Under } from '../../../../utils.ts';
export namespace Declaration {
	export namespace Member {
		export interface Field<G extends GrammarMap, K extends Under<'declaration.member.field'> = 'declaration.member.field'> {
			readonly definite?: Flag;
			// t only
		}
		export interface Property<G extends GrammarMap, K extends Under<'declaration.member.property'> = 'declaration.member.property'> {
			readonly definite?: Flag;
		}
	}
	export interface Variable<G extends GrammarMap, K extends Under<'declaration.variable'> = 'declaration.variable'> {
		readonly definite?: Flag;
		// t only
	}
}
