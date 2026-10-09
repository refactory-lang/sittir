import type { GrammarContext } from '../../context.ts';
export namespace Expression {
	export interface Function<G extends GrammarContext> {
		readonly returnType?: G['slots']['expression.function']['returnType'];
	}
	export namespace Function {
		export interface Generator<G extends GrammarContext> {
			readonly returnType?: G['slots']['expression.function.generator']['returnType'];
		}
	}
}
