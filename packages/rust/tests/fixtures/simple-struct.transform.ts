/**
 * Minimal JSSG codemod transform fixture.
 *
 * This module demonstrates how `rust-ir` is used inside a JSSG transform.
 * In production it would be invoked by the `codemod` CLI which injects the
 * real `codemod:ast-grep` runtime module. In tests the module is mocked via
 * the Vitest resolve.alias defined in vitest.config.ts.
 *
 * The function signature matches the JSSG transform convention: it accepts
 * source Rust code (as processed by the caller) and returns either a
 * transformed string, or `null` to signal no change.
 */
import { structItem, render, validate } from '../../src/index.js';

/**
 * Transform: wraps a struct name with a generated pub struct declaration.
 * Demonstrates the full rust-ir pipeline: factory → render → validate.
 */
export function buildPublicStruct(name: string): string | null {
	if (!name) return null;
	const node = structItem({ name, children: ['pub'] });
	const output = render(node);
	const result = validate(output);
	if (!result.ok) return null;
	return output;
}
