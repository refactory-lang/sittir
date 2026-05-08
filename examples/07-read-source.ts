import { createEngine, wrap } from '@sittir/rust';

export function readSource(source: string) {
	const engine = createEngine();
	return engine.parseAndRead(source);
}

export function readShallowThenDrillIn(source: string) {
	const engine = createEngine();
	const shallow = engine.parseAndRead(source, { depth: 1 });
	const fn = shallow.$children[0];
	const body = engine.readNode(fn._body.$nodeHandle, fn._body.$childIndex);

	return { shallow, fn, body };
}

export function wrappedLazyAccess(source: string) {
	const engine = createEngine();
	const tree = engine.parseAndRead(source);
	const shallow = engine.parseAndRead(source, { depth: 1 });
	const fn = wrap(shallow.$children[0], tree);

	return {
		name: fn.name(),
		body: fn.body(),
		statements: fn.body().$children
	};
}
