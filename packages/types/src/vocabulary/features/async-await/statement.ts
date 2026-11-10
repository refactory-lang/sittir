import type { GrammarMap } from '../../map.ts';
import type { Under } from '../../utils.ts';
export namespace Statement {
	export namespace Loop {
		export interface ForEach<G extends GrammarMap, K extends Under<'statement.loop.for_each'> = 'statement.loop.for_each'> {
		}
	}
	export interface Resource<G extends GrammarMap, K extends Under<'statement.resource'> = 'statement.resource'> {
	}
}
