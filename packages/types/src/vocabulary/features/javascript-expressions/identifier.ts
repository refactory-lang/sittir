import type { GrammarMap, Text } from '../../map.ts';
export namespace Identifier {
	// claimed by t
	export type Super<G extends GrammarMap> = Text<G, 'identifier.super'>;
}
