import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';
import { structuralShape } from './helpers.ts';

const engine = await createEngine(rust);

export function renderMainFunction() {
	const fn = engine.build.statement.function({
		visibilityModifier: 'pub',
		name: 'main',
		parameters: engine.build.parameters.strict(),
		body: engine.build.block.strict(),
	});
	return fn.$render();
}

/**
 * Render a parsed root without touching anything — and get the source back,
 * byte for byte.
 *
 * Reading expands one level at a time, so a freshly parsed root has nothing
 * expanded below it. Nothing was rebuilt, so nothing is re-spelled: the
 * whole file comes back as its own captured text, comments and blank lines
 * and indentation included. Edit any part of it and only what you rebuilt
 * renders canonically; everything you left alone still comes back verbatim.
 */
export function renderUntouched(source: string) {
	return engine.parse(source).$render();
}

/**
 * Read → render → re-read. What must hold is that the rendered text
 * re-parses to the same tree, whichever levels came back verbatim and
 * whichever were rebuilt from templates.
 */
export function roundTrip(source: string) {
	const first = engine.parse(source);
	const rendered = first.$render();
	const second = engine.parse(rendered);
	return {
		rendered,
		reparsesEqual: JSON.stringify(structuralShape(first)) === JSON.stringify(structuralShape(second)),
	};
}
