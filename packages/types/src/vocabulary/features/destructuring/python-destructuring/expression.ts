import type { GrammarMap } from '../../../map.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export type Rest<G extends GrammarMap> = V.Pattern.Rest.Any<G>;
}
