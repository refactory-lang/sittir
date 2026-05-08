import { createEngine, ir } from '@sittir/rust';

export function renderMainFunction() {
	const fn = ir.functionItem({ visibilityModifier: 'pub', name: 'main' });
	return fn.$render();
}

export function roundTripIsByteIdentical(source: string) {
	const engine = createEngine();
	const tree = engine.parseAndRead(source);
	return tree.$render() === source;
}
