import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Await<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.await';
		readonly expression: G['slots']['expression.await']['expression'];
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly async?: boolean;
	}
	export namespace Function {
		export interface Generator<G extends GrammarContext<G>> {
			readonly async?: boolean;
		}
	}
	export interface Lambda<G extends GrammarContext<G>> {
		readonly async?: boolean;
	}
}
