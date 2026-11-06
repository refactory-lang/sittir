import type { GrammarMap, Slot } from './map.ts';
import type { Under } from './utils.ts';
import type * as V from './index.ts';
export interface File<G extends GrammarMap, K extends Under<'file'> = 'file'> {
	// claimed by prt
	readonly $kind: K;
	readonly shebang?: string;
	// rt only
	readonly statements?: Slot<
		G,
		'file',
		'statements',
		| V.Attribute.Any<G>
		| V.Declaration.Any<G>
		| V.Expression.Call.Macro<G>
		| V.Statement.Any<G>
	>[];
}

