import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Throw<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		readonly $kind: 'statement.throw';
		readonly cause?: G['slots']['statement.throw']['cause'];
		readonly expression?: G['slots']['statement.throw']['expression'];
	}
	export interface Try<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		readonly $kind: 'statement.try';
		readonly alternative?: V.Clause.Else<G>;
		readonly body: G['slots']['statement.try']['body'];
		readonly finalizer?: V.Clause.Finally<G>;
		readonly handlers?: G['clause'] | G['clause'][];
	}
}
