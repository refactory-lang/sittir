import type { GrammarContext } from '../../context.ts';
import type { RefinedBy } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export namespace Import {
		export namespace Package {
			export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Statement.Import.Package<G>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $kind: 'statement.import.package.private';
			}
			export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Statement.Import.Package<G>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'statement.import.package.public';
			}
			export namespace Public {
				export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Statement.Import.Package.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $kind: 'statement.import.package.public.internal';
				}
				export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Statement.Import.Package.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $kind: 'statement.import.package.public.restricted';
				}
			}
		}
		export interface Private<G extends GrammarContext<G>> extends RefinedBy<V.Statement.Import<G>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $kind: 'statement.import.private';
		}
		export interface Public<G extends GrammarContext<G>> extends RefinedBy<V.Statement.Import<G>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $kind: 'statement.import.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarContext<G>> extends RefinedBy<V.Statement.Import.Public<G>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $kind: 'statement.import.public.internal';
			}
			export interface Restricted<G extends GrammarContext<G>> extends RefinedBy<V.Statement.Import.Public<G>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $kind: 'statement.import.public.restricted';
			}
		}
	}
}
