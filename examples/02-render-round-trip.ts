import { createEngine, ir } from '@sittir/rust';
import { structuralShape } from './helpers.ts';

export function renderMainFunction() {
	const fn = ir.functionItem.from({
		visibilityModifier: 'pub',
		name: 'main',
		parameters: ir.parameters.strict(),
		body: ir.block.strict(),
	});
	return fn.$render();
}

/**
 * Read → render → re-read. A parsed root renders back through the same
 * templates a factory node uses, so the output is the CANONICAL spelling
 * (template whitespace), not the original bytes — byte-for-byte fidelity
 * of untouched regions is what `$replace` + `applyEdits` are for. What
 * must hold is that the rendered text re-parses to the same tree.
 */
export function roundTrip(source: string) {
	const engine = createEngine();
	const first = engine.parse(source);
	const rendered = first.$render();
	const second = engine.parse(rendered);
	return {
		rendered,
		reparsesEqual: JSON.stringify(structuralShape(first)) === JSON.stringify(structuralShape(second)),
	};
}
