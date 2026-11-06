import type { GrammarMap, Slot } from './map.ts';
import type * as V from './index.ts';
export interface File<G extends GrammarMap> {
	// claimed by prt
	readonly $kind: 'file';
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

