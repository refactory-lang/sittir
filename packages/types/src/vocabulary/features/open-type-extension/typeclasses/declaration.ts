import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Extension {
		export interface Conformance<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Extension<G>> {
			// claimed by r
			readonly $kind: 'declaration.extension.conformance';
			readonly body: G['slots']['declaration.extension.conformance']['body'][];
			readonly implements?: G['slots']['declaration.extension.conformance']['implements'];
			readonly traitClause?: G['slots']['declaration.extension.conformance']['traitClause'];
			readonly type: G['slots']['declaration.extension.conformance']['type'];
		}
	}
}
