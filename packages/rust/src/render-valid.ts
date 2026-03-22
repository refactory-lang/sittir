/**
 * Render an IR node to Rust source and validate the result.
 * This is the default render function — use `renderSilent` to skip validation.
 */
import type { RustIrNode } from './types.js';
import { renderSilent } from './render.js';
import { assertValid } from './validate-fast.js';

export function render(node: RustIrNode): string {
	return assertValid(renderSilent(node));
}
