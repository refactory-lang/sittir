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
import { dogfoodContract, structuralShape } from '../../../examples/helpers.ts';
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
		// `visibilityModifier.inPath` is parked behind the
		// `_visibility_modifier_pub_parens` phantom; the example builds plain
		// `pub` until the pub(...) chain is reachable.
		expect(text).toContain('pub ');
		expect(text).toContain('greet');
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
		const rebuilt = ir.sourceFile({
			statements: [
				ir.functionItem({
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
		const rebuilt = ir.functionItem({
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

describe('structuralShape trivia handling', () => {
	it("keeps a bare leaf's $text alongside its $triviaData", () => {
		const leaf = ir.synonym.identifier('main').$trivia(ir.lineComment.content('c'));
		const shape = structuralShape(leaf) as Record<string, unknown>;
		expect(shape.$text).toBe('main');
		expect(shape.$triviaData).toBeDefined();
	});
	it('differs when only the comment text differs', () => {
		const alpha = ir.synonym.identifier('main').$trivia(ir.lineComment.content('alpha'));
		const beta = ir.synonym.identifier('main').$trivia(ir.lineComment.content('beta'));
		expect(JSON.stringify(structuralShape(alpha))).not.toBe(JSON.stringify(structuralShape(beta)));
	});
	it('differs when the same comment is leading vs. trailing', () => {
		const leading = ir.synonym.identifier('main').$trivia({ leading: [ir.lineComment.content('c')] });
		const trailing = ir.synonym.identifier('main').$trivia({ trailing: [ir.lineComment.content('c')] });
		expect(JSON.stringify(structuralShape(leading))).not.toBe(JSON.stringify(structuralShape(trailing)));
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

// Namespaced constructors are the reachable spelling for an arm kind: the
// parent names the form, the arm keeps no top-level builder of its own.
describe('namespaced constructors reach the arm kinds', () => {
	it('builds both doc-comment forms through line_comment', () => {
		expect(ir.lineComment.docOuter(' hi').$render()).toBe('/// hi');
		expect(ir.lineComment.docInner(' hi').$render()).toBe('//! hi');
	});
	// `///` and `//!` are alternatives, so each is its own arm kind carrying
	// only the doc text. Were they one kind with the markers as two optional
	// fields, a caller could set both — `///!` — or neither, which renders a
	// doc-comment kind as a plain `//` comment.
	it('carries the marker as the arm identity, not as a settable field', () => {
		const outer = ir.lineComment.docOuter(' hi').content();
		const inner = ir.lineComment.docInner(' hi').content();

		expect(outer.$type).not.toBe(inner.$type);
		for (const arm of [outer, inner]) {
			expect(arm).not.toHaveProperty('outer');
			expect(arm).not.toHaveProperty('inner');
		}
	});
	it('builds a plain line comment through the same parent', () => {
		expect(ir.lineComment.content(' hi').$render()).toBe('// hi');
	});
	it('builds a semicolon-terminated expression statement', () => {
		expect(ir.expressionStatement.withSemi(ir.identifier('x')).$render()).toBe('x;');
	});
	// The arm is minted under `visibility_modifier` and reaches it through two
	// intermediate hops, but the name a caller types is the one the grammar
	// authored for the form — never the arm's full kind name.
	it('reaches an in-path visibility modifier under its authored name', () => {
		const vm = ir.visibilityModifier as unknown as Record<string, (...args: unknown[]) => { $render(): string }>;
		const path = ir.scopedIdentifier({ path: ir.crate(), name: ir.identifier('x') });
		expect(vm.inPath!(path).$render()).toBe('pub(in crate::x)');
		expect(vm.self!().$render()).toBe('pub(self)');
	});
	// `crate` names both `visibility_modifier`'s own arm and, one hop down,
	// `pub(crate)`. Flattening stops at the clash, so the hoisted one is
	// dropped and this kind's own arm — never hoisted — keeps the name.
	it('keeps the direct arm when a hoisted constructor claims its name', () => {
		expect(ir.visibilityModifier.crate().$render()).toBe('crate');
	});
});

// Ceiling, never a floor: an artefact kind moves off the top-level namespace
// onto its parent, so this count only shrinks.
describe('ir entry ratchet', () => {
	it('exposes no more top-level builders than the recorded ceiling', () => {
		// Grouped namespaces and `synonym` are objects, not builders — the
		// ratchet tracks builder exposure, so only callable entries count.
		// (287 total keys today; 270 are callable builders — the ceiling is
		// the exact current count, so any new top-level builder trips it.)
		const builders = Object.keys(ir).filter((k) => typeof (ir as Record<string, unknown>)[k] === 'function');
		expect(builders.length).toBeLessThanOrEqual(270);
	});
});

// The strict half: the same items through `.strict` alone, so each gap lands on
// the layer that owns it.
describe('examples/17 dogfood rust — strict factory surface', () => {
	it('builds the items the public surface can reach', () => {
		expect(rebuildSpliceStrict().$render()).toContain('pub enum SpliceError');
	});
});
