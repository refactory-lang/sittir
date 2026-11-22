import type { GrammarMap } from '../../map.ts';
import type { Flag, Under } from '../../utils.ts';
export namespace Declaration {
	export namespace Member {
		export interface Constructor<G extends GrammarMap, K extends Under<'declaration.member.constructor'> = 'declaration.member.constructor'> {
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly async?: Flag;
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> {
		}
	}
	export namespace Member {
		export interface Method<G extends GrammarMap, K extends Under<'declaration.member.method'> = 'declaration.member.method'> {
			readonly async?: Flag;
		}
		export namespace Method {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.method.signature'> = 'declaration.member.method.signature'> {
			}
		}
	}
}
