import type { GrammarMap, Text } from '../../map.ts';
export namespace Identifier {
	// claimed by rt
	export type Receiver<G extends GrammarMap> = Text<G, 'identifier.receiver'>;
}
