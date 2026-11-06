import type { GrammarMap } from '../../map.ts';
import type { Under } from '../../utils.ts';
export namespace Expression {
	export interface Call<G extends GrammarMap, K extends Under<'expression.call'> = 'expression.call'> {
	}
	export namespace Call {
		export interface Construct<G extends GrammarMap, K extends Under<'expression.call.construct'> = 'expression.call.construct'> {
		}
		export interface Member<G extends GrammarMap, K extends Under<'expression.call.member'> = 'expression.call.member'> {
		}
	}
	export interface Class<G extends GrammarMap, K extends Under<'expression.class'> = 'expression.class'> {
	}
	export interface Function<G extends GrammarMap, K extends Under<'expression.function'> = 'expression.function'> {
	}
}
