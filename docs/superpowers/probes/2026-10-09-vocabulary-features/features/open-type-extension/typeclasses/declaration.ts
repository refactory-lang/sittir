import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Extension {
		export interface Conformance<G extends GrammarContext> extends SubKindOf<V.Declaration.Extension<G>> {
			readonly $kind: 'declaration.extension.conformance';
			readonly implements?: G['slots']['declaration.extension.conformance']['implements'];
			readonly receiver?: V.Declaration.Parameter.Self<G>;
			readonly traitClause?: G['slots']['declaration.extension.conformance']['traitClause'];
			readonly type: G['slots']['declaration.extension.conformance']['type'];
		}
	}
}
