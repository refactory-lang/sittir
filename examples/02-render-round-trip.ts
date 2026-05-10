import { createEngine, ir, wrapNode } from '@sittir/rust';
import { parseSource } from './helpers.ts';

export function renderMainFunction() {
	const fn = ir.functionItem.from({
		visibilityModifier: 'pub',
		name: 'main',
		parameters: ir.parameters.strict(),
		body: ir.block.strict(),
	});
	return fn.$render();
}

export function roundTripIsByteIdentical(source: string) {
	const engine = createEngine();
	const { root, tree } = parseSource(engine, source);
	return (wrapNode(root, tree) as { $render(): string }).$render() === source;
}
