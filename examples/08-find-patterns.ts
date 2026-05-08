import { createEngine, wrap } from '@sittir/rust';

export function findPublicFunctions(source: string) {
	const engine = createEngine();
	const tree = engine.parseAndRead(source);
	const matches = engine.findAndRead(source, 'pub fn $NAME($...PARAMS) $BODY');

	return matches.map((match) => wrap(match, tree).name());
}
