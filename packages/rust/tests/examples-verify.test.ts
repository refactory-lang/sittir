// Runtime verification of the COMPILE-CHECKED use-case examples
// (01/02/07/09 — the `type-check:examples` include set): every export of
// those modules executes against the native engine and produces the
// output the guide promises. Typecheck pins the surface; this suite pins
// the behavior. The pending-surface examples (03–06, 08, 10–16) join as
// their APIs land.
import { describe, expect, it } from 'vitest';
import {
	explicitMainFunction,
	nestedGreetFunction,
	fromGreetFunction,
	minimalMainFunction,
	immutableFunctionUpdates,
	structSideBySide
} from '../../../examples/01-construct-nodes.ts';
import { renderMainFunction, renderUntouched, roundTrip } from '../../../examples/02-render-round-trip.ts';
import { readSource, readFirstFunction, wrappedLazyAccess } from '../../../examples/07-read-source.ts';
import { summarizeTopLevelItems } from '../../../examples/09-type-guards.ts';
import { dogfoodContract } from '../../../examples/helpers.ts';
import { rebuildSplice } from '../../../examples/17-dogfood-rust.ts';
import { rebuildSpliceStrict } from '../../../examples/17-dogfood-rust-strict.ts';
import { createEngine, ir } from '@sittir/rust';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('examples/01 construct nodes', () => {
	it('explicit strict construction renders a pub main', () => {
		const r = explicitMainFunction();
		expect(r.name).toBe('main');
		expect(r.source).toContain('pub fn main');
	});
	it('nested strict construction renders greet with its parameter', () => {
		const text = nestedGreetFunction().$render();
		expect(text).toContain('pub fn greet');
		expect(text).toContain('name');
		expect(text).toContain('String');
	});
	it('from() accepts keyword strings and bare parameters', () => {
		expect(fromGreetFunction().$render()).toContain('pub fn greet');
	});
	it('minimal from() builds an empty-bodied main', () => {
		expect(minimalMainFunction().$render()).toContain('fn main');
	});
	it('$with updates immutably and keeps the surface', () => {
		expect(immutableFunctionUpdates().$render()).toContain('greet');
	});
	it('strict and from() spellings render identically', () => {
		const { strictFn, fromFn } = structSideBySide();
		expect(strictFn.$render()).toBe(fromFn.$render());
	});
});

describe('examples/02 render round trip', () => {
	it('renders a pub main function', () => {
		expect(renderMainFunction()).toContain('pub fn main');
	});
	it('re-parses a rendered parsed root to the same tree', () => {
		const { rendered, reparsesEqual } = roundTrip(renderMainFunction());
		expect(rendered).toContain('pub fn main');
		expect(reparsesEqual).toBe(true);
	});
	it('re-parses a multi-item source file to the same tree', () => {
		const source = 'struct A { a: u8, b: String }\nfn f(a: &A) -> u8 { a.a + 1 }\n';
		expect(roundTrip(source).reparsesEqual).toBe(true);
	});

	// A freshly parsed root has nothing expanded below it, so nothing is
	// rebuilt and nothing is re-spelled — the source comes back byte for byte.
	it('reproduces an untouched parse byte-for-byte', () => {
		const source = 'pub fn main() { }\n';
		expect(renderUntouched(source)).toBe(source);
	});
	it("keeps an untouched parse's own irregular spacing", () => {
		const source = 'fn   weird ( ) {   }\n';
		expect(renderUntouched(source)).toBe(source);
	});
	it('keeps what sits BETWEEN items, not just the items themselves', () => {
		// The gap is where the comments and blank lines live — and in an
		// indentation-sensitive grammar, the block structure.
		const source = 'struct A { a: u8, b: String }\n\n// gap\nfn f(a: &A) -> u8 { a.a + 1 }\n';
		expect(renderUntouched(source)).toBe(source);
	});
});

describe('examples/07 read source', () => {
	const source = 'pub fn main() { }\n';
	it('reads a root node', () => {
		expect(readSource(source)).toBeDefined();
	});
	it('finds the first function and reads its name', () => {
		expect(readFirstFunction(source)?.name).toBe('main');
	});
	it('lazily accesses body statements through the wrap surface', () => {
		expect(wrappedLazyAccess(source)?.statements).toBeDefined();
	});
});

describe('examples/09 type guards', () => {
	it('summarizes functions and structs from parsed source', () => {
		expect(summarizeTopLevelItems('pub fn main() { }\npub struct Config;\n')).toEqual([
			'Function: main',
			'Struct: Config'
		]);
	});
});

describe('dogfoodContract helper', () => {
	it('reports equality for a node that reproduces its own file', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-dogfood-'));
		const target = join(dir, 'main.rs');
		writeFileSync(target, 'pub fn main() { }\n');
		const rebuilt = ir.sourceFile.from({
			statements: [
				ir.functionItem.from({
					visibilityModifier: 'pub',
					name: 'main',
					parameters: ir.parameters.strict(),
					body: ir.block.strict()
				})
			]
		});
		const result = dogfoodContract(createEngine(), rebuilt, target);
		expect(result.reparsesEqual).toBe(true);
		expect(result.sameModuloWhitespace).toBe(true);
		expect(result.firstDifference).toBeUndefined();
	});
	it('names the first token that differs', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-dogfood-'));
		const target = join(dir, 'main.rs');
		writeFileSync(target, 'pub fn other() { }\n');
		const rebuilt = ir.functionItem.from({
			visibilityModifier: 'pub',
			name: 'main',
			parameters: ir.parameters.strict(),
			body: ir.block.strict()
		});
		const result = dogfoodContract(createEngine(), rebuilt, target);
		expect(result.sameModuloWhitespace).toBe(false);
		expect(result.firstDifference).toContain('other');
	});
});

// GAP inventory (examples/17): A=6 B=8 C=1 — each marked in the example at
// the construct it blocks. Both assertions flip to `it` as the classes close.
describe('examples/17 dogfood rust (splice.rs)', () => {
	const target = new URL('../../../rust/crates/sittir-core/src/splice.rs', import.meta.url).pathname;
	it('builds and renders the whole file through the construction surface', () => {
		expect(rebuildSplice().$render()).toContain('pub enum SpliceError');
	});
	it.fails('re-parses to the same tree as the real file', () => {
		expect(dogfoodContract(createEngine(), rebuildSplice(), target).reparsesEqual).toBe(true);
	});
	it.fails('is identical to the real file modulo whitespace', () => {
		const r = dogfoodContract(createEngine(), rebuildSplice(), target);
		expect(r.firstDifference).toBeUndefined();
		expect(r.sameModuloWhitespace).toBe(true);
	});
});

// The strict half: the same items through `.strict` alone, so each gap lands on
// the layer that owns it.
describe('examples/17 dogfood rust — strict factory surface', () => {
	it('builds the items the public surface can reach', () => {
		expect(rebuildSpliceStrict().$render()).toContain('pub enum SpliceError');
	});
});
