import type { GrammarMap } from '../../../map.ts';
import type { RefinedBy, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Statement {
	export namespace Import {
		export namespace Package {
			export interface Private<G extends GrammarMap, K extends Under<'statement.import.package.private'> = 'statement.import.package.private'> extends RefinedBy<V.Statement.Import.Package<G, K>, V.Modifier.Visibility.Private<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Public<G extends GrammarMap, K extends Under<'statement.import.package.public'> = 'statement.import.package.public'> extends RefinedBy<V.Statement.Import.Package<G, K>, V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $path: K;
			}
			export namespace Public {
				export interface Internal<G extends GrammarMap, K extends Under<'statement.import.package.public.internal'> = 'statement.import.package.public.internal'> extends RefinedBy<V.Statement.Import.Package.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Parent<G extends GrammarMap, K extends Under<'statement.import.package.public.parent'> = 'statement.import.package.public.parent'> extends RefinedBy<V.Statement.Import.Package.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
					// claimed by r
					readonly $path: K;
				}
				export interface Restricted<G extends GrammarMap, K extends Under<'statement.import.package.public.restricted'> = 'statement.import.package.public.restricted'> extends RefinedBy<V.Statement.Import.Package.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
					// claimed by r
					readonly $path: K;
				}
			}
		}
		export interface Private<G extends GrammarMap, K extends Under<'statement.import.private'> = 'statement.import.private'> extends RefinedBy<V.Statement.Import<G, K>, V.Modifier.Visibility.Private<G>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'statement.import.public'> = 'statement.import.public'> extends RefinedBy<V.Statement.Import<G, K>, V.Modifier.Visibility.Public<G>> {
			// claimed by r
			readonly $path: K;
		}
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'statement.import.public.internal'> = 'statement.import.public.internal'> extends RefinedBy<V.Statement.Import.Public<G, K>, V.Modifier.Visibility.Public.Internal<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'statement.import.public.parent'> = 'statement.import.public.parent'> extends RefinedBy<V.Statement.Import.Public<G, K>, V.Modifier.Visibility.Public.Parent<G>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'statement.import.public.restricted'> = 'statement.import.public.restricted'> extends RefinedBy<V.Statement.Import.Public<G, K>, V.Modifier.Visibility.Public.Restricted<G>> {
				// claimed by r
				readonly $path: K;
			}
		}
	}
}
