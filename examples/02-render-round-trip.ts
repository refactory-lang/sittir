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
 * Render a parsed root without touching anything.
 *
 * Reading expands one level at a time, so the root's children are still
 * unexpanded: each renders from its own captured source, reproducing that
 * item's bytes exactly — irregular spacing included. Only the root itself
 * was expanded, so only the root rebuilds from its template. That means
 * what sits BETWEEN items — the separator, and any comment living in the
 * gap — is the root template's to spell, not the source's; it is not
 * reproduced. Expand further (and more rebuilds canonically); expand less
 * (and more comes back verbatim).
 */
export function renderUntouched(source: string) {
	const engine = createEngine();
	return engine.parse(source).$render();
}

/**
 * Read → render → re-read. What must hold is that the rendered text
 * re-parses to the same tree, whichever levels came back verbatim and
 * whichever were rebuilt from templates.
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
