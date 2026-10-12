import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Exec<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.exec';
		readonly code: G['slots']['statement.exec']['code'];
		readonly inClauses?: G['slots']['statement.exec']['inClauses'][];
	}
}
