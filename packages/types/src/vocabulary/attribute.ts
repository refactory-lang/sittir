import type { GrammarMap } from './map.ts';
import type { Under } from './utils.ts';
import type * as V from './index.ts';
export interface Attribute<G extends GrammarMap, K extends Under<'attribute'> = 'attribute'> {
	readonly $path: K;
}
export namespace Attribute {
	export type AnyWithExpression<G extends GrammarMap> = V.Attribute.Any<G> | V.Expression.Any<G>;
}
