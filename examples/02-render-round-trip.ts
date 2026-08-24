import { createEngine, ir, wrapNode } from '@sittir/rust';
import { parseSource, structuralShape } from './helpers.ts';

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
	const first = parseSource(engine, source);
	const rendered = wrapNode(first.root, first.tree).$render();
	const second = parseSource(engine, rendered);
	return {
		rendered,
		reparsesEqual:
			JSON.stringify(structuralShape(wrapNode(first.root, first.tree))) ===
			JSON.stringify(structuralShape(wrapNode(second.root, second.tree))),
	};
}
