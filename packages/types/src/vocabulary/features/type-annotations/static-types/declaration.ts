import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Member {
		export interface Field<G extends GrammarMap, K extends Under<'declaration.member.field'> = 'declaration.member.field'> {
			readonly type?: Slot<
				G,
				K,
				'type',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
	}
	export namespace Function {
		export interface Signature<G extends GrammarMap, K extends Under<'declaration.function.signature'> = 'declaration.function.signature'> {
			readonly returnType?: Slot<
				G,
				K,
				'returnType',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
	}
	export namespace Member {
		export namespace Method {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.method.signature'> = 'declaration.member.method.signature'> {
				readonly returnType?: Slot<
					G,
					K,
					'returnType',
					| V.Clause.Bounds.Removed<G>
					| V.Expression.Call.Macro<G>
					| V.Identifier.Any<G>
					| V.Type.Any<G>
				>;
			}
		}
	}
}
