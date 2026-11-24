import type { GrammarMap } from '../../../map.ts';
import type { Flag, Under } from '../../../utils.ts';
export namespace Declaration {
	export namespace Member {
		export interface Field<G extends GrammarMap, K extends Under<'declaration.member.field'> = 'declaration.member.field'> {
			readonly privateName?: Flag;
			// t only
		}
		export interface Property<G extends GrammarMap, K extends Under<'declaration.member.property'> = 'declaration.member.property'> {
			readonly privateName?: Flag;
		}
	}
}
