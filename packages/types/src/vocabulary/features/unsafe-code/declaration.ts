import type { GrammarMap } from '../../map.ts';
import type { Flag, Under } from '../../utils.ts';
export namespace Declaration {
	export interface Extension<G extends GrammarMap, K extends Under<'declaration.extension'> = 'declaration.extension'> {
		readonly unsafe?: Flag;
	}
	export namespace Extension {
		export interface Conformance<G extends GrammarMap, K extends Under<'declaration.extension.conformance'> = 'declaration.extension.conformance'> {
			readonly unsafe?: Flag;
		}
	}
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly unsafe?: Flag;
		// r only
	}
	export namespace Interface {
		export interface Trait<G extends GrammarMap, K extends Under<'declaration.interface.trait'> = 'declaration.interface.trait'> {
			readonly unsafe?: Flag;
		}
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> {
		readonly unsafe?: Flag;
		// rt only
	}
	export namespace Module {
		export interface Foreign<G extends GrammarMap, K extends Under<'declaration.module.foreign'> = 'declaration.module.foreign'> {
			readonly unsafe?: Flag;
		}
	}
}
