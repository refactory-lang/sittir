// Round-trip over REAL repo files, one per grammar, through the product API:
// parse -> $render -> parse, comparing the wrapped shape both times.
//
// Real files are the point. Each of these exercises something a hand-written
// fixture does not: rust macro/attribute token trees whose content collapses
// to bare text, typescript parameters whose identifier collapses the same way,
// python whose block structure lives in the whitespace BETWEEN top-level
// items, and a rust file that is mostly module documentation. All four used to
// fail here — two by throwing at transport deserialization (no carrier could
// hold text in a struct-typed or `Option<T>` slot), two by silently dropping
// what sits between the root's children.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine as createRustEngine } from '../../rust/src/engine.js';
import { createEngine as createTypeScriptEngine } from '../../typescript/src/engine.js';
import { createEngine as createPythonEngine } from '../../python/src/engine.js';
import { structuralShape } from '../../../examples/helpers.ts';

const REPO_ROOT = new URL('../../../', import.meta.url);

interface Rendered {
	$render(): string;
}

/** A parsed root's kind tree, with source positions and text dropped, so two
 *  parses of equivalent source compare equal. */
function shapeOf(root: unknown): string {
	return JSON.stringify(structuralShape(root));
}

const CASES: ReadonlyArray<{
	readonly file: string;
	readonly createEngine: () => { parse(source: string): Rendered };
}> = [
	// Mostly `//!` module documentation — the comments live between and around
	// the root's children, which is exactly what a canonical re-spelling loses.
	{ file: 'rust/crates/sittir-core/src/lib.rs', createEngine: createRustEngine },
	// `#[...]` attribute arguments: a delimited token tree whose content the
	// reader collapses to bare text, in a slot with no kind to route it by.
	{ file: 'rust/crates/sittir-core/src/splice.rs', createEngine: createRustEngine },
	// Function parameters whose pattern collapses to a bare identifier string.
	{ file: 'packages/common/src/format.ts', createEngine: createTypeScriptEngine },
	// Indentation-sensitive: lose the newline between a class and the next
	// top-level `def` and the `def` becomes a method of the class.
	{ file: 'tests/format-roundtrip/fixtures/python-4space.py', createEngine: createPythonEngine }
];

describe('real repo files round-trip through parse -> render -> parse', () => {
	for (const { file, createEngine } of CASES) {
		it(file, () => {
			const source = readFileSync(fileURLToPath(new URL(file, REPO_ROOT)), 'utf8');
			const engine = createEngine();

			const root = engine.parse(source);
			const rendered = root.$render();

			// Nothing was expanded below the root and nothing was rebuilt, so
			// nothing is re-spelled — the file comes back as it went in.
			expect(rendered).toBe(source);
			expect(shapeOf(engine.parse(rendered))).toBe(shapeOf(root));
		});
	}
});
