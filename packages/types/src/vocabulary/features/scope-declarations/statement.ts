import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Global<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.global';
		readonly names: G['identifier'][];
	}
	export interface Nonlocal<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.nonlocal';
		readonly names: G['identifier'][];
	}
}
