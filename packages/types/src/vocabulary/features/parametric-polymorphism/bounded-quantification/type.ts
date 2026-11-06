import type { GrammarMap } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
export namespace Type {
	export interface Constrained<G extends GrammarMap, K extends Under<'type.constrained'> = 'type.constrained'> {
	}
}
