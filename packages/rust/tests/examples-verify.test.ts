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
import { rebuildSpliceStrict } from '../../../examples/17-dogfood-rust-strict.ts';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The generated rebuild is loaded by a computed path so tsc does not follow
// it: its type errors are counted under examples/generated-typecheck-ceiling.json,
// and vitest runs it regardless.
const generatedRebuild = (file: string, exportName: string) => async (): Promise<{ $render(): string }> => {
	const absolute = fileURLToPath(new URL(`../../../examples/${file}`, import.meta.url));
	const mod = (await import(pathToFileURL(absolute).href)) as Record<string, () => { $render(): string }>;
	return mod[exportName]!();
};
const rebuildSpliceGenerated = generatedRebuild('17-dogfood-rust.generated.ts', 'rebuildSpliceGenerated');
const rebuildSpliceLoose = generatedRebuild('17-dogfood-rust-loose.generated.ts', 'rebuildSpliceLoose');
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
		// `visibilityModifier.pub.scope.inPath` renders the whole pub(...) chain.
		expect(text).toContain('pub(in crate::x)');
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
	it("keeps a bare leaf's $text alongside its $_trivia", () => {
		const leaf = ir.synonym.identifier('main').$trivia(ir.lineComment.regular('c'));
		const shape = structuralShape(leaf) as Record<string, unknown>;
		expect(shape.$text).toBe('main');
		expect(shape.$_trivia).toBeDefined();
	});
	it('differs when only the comment text differs', () => {
		const alpha = ir.synonym.identifier('main').$trivia(ir.lineComment.regular('alpha'));
		const beta = ir.synonym.identifier('main').$trivia(ir.lineComment.regular('beta'));
		expect(JSON.stringify(structuralShape(alpha))).not.toBe(JSON.stringify(structuralShape(beta)));
	});
	it('differs when the same comment is leading vs. trailing', () => {
		const leading = ir.synonym.identifier('main').$trivia({ leading: [ir.lineComment.regular('c')] });
		const trailing = ir.synonym.identifier('main').$trivia({ trailing: [ir.lineComment.regular('c')] });
		expect(JSON.stringify(structuralShape(leading))).not.toBe(JSON.stringify(structuralShape(trailing)));
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
		expect(ir.lineComment.regular(' hi').$render()).toBe('// hi');
	});
	it('builds a semicolon-terminated expression statement', () => {
		expect(ir.expressionStatement.withSemi(ir.identifier('x')).$render()).toBe('x;');
	});
	// A variant minted inside another variant's rule is spelled inside it: the
	// caller types each authored form name, under the arm that reaches it.
	it('reaches an in-path visibility modifier under the arm it nests in', () => {
		const path = ir.scopedIdentifier({ path: ir.crate(), name: ir.identifier('x') });
		expect(ir.visibilityModifier.pub.scope.inPath.strict(path).$render()).toBe('pub(in crate::x)');
		expect(ir.visibilityModifier.pub.scope.self.strict().$render()).toBe('pub(self)');
	});
	// `crate` names both `visibility_modifier`'s own arm and the arm under
	// `pub.scope`; each sits under the arm that reaches it, so neither claims
	// the other's name.
	it('keeps a direct arm and a nested arm of the same name apart', () => {
		expect(ir.visibilityModifier.crate().$render()).toBe('crate');
		expect(ir.visibilityModifier.pub.scope.crate().$render()).toBe('pub(crate)');
	});
});

// Ceiling, never a floor: an artefact kind moves off the top-level namespace
// onto its parent, so this count only shrinks.
describe('ir entry ratchet', () => {
	it('exposes no more top-level builders than the recorded ceiling', () => {
		// Grouped namespaces and `synonym` are objects, not builders — the
		// ratchet tracks builder exposure, so only callable entries count.
		// (274 callable builders today — the ceiling is the exact current
		// count, so any new top-level builder trips it. The user-facing
		// aliased pattern leaves — stringOpen, rawStringLiteralStart /
		// End, the comment-content patterns — are on the surface; the
		// enum-of-literals leaves are not, their values being kind ids.)
		const builders = Object.keys(ir).filter((k) => typeof (ir as Record<string, unknown>)[k] === 'function');
		expect(builders.length).toBeLessThanOrEqual(261);
	});
});

// The strict half: the same items through `.strict` alone, so each gap lands on
// the layer that owns it.
describe('examples/17 dogfood rust — strict factory surface', () => {
	it('builds the items the public surface can reach', () => {
		expect(rebuildSpliceStrict().$render()).toContain('pub enum SpliceError');
	});
});

// The generated rebuild: `sittir tool emit-factory-source` over splice.rs. It
// is checked in so the strict surface's gaps are a diff, not a description;
// its type errors are counted under examples/generated-typecheck-ceiling.json.
describe('examples/17 generated rebuild (splice.rs)', () => {
	const target = new URL('../../../rust/crates/sittir-core/src/splice.rs', import.meta.url).pathname;
	it('renders — every token-tree child now builds', async () => {
		expect((await rebuildSpliceGenerated()).$render()).toContain('pub enum SpliceError');
	});
	it('re-parses to the same tree as the real file and matches it modulo whitespace', async () => {
		const result = dogfoodContract(createEngine(), await rebuildSpliceGenerated(), target);
		expect(result.reparsesEqual).toBe(true);
		expect(result.sameModuloWhitespace).toBe(true);
	});
});

// The loose rebuild: the same file through the bundle calls, with every
// coercion the loose contract admits spelled bare, so a coercion the runtime
// refuses is a diff here rather than a description.
describe('examples/17 loose rebuild (splice.rs)', () => {
	const target = new URL('../../../rust/crates/sittir-core/src/splice.rs', import.meta.url).pathname;
	it('renders', async () => {
		expect((await rebuildSpliceLoose()).$render()).toContain('pub enum SpliceError');
	});
	it('re-parses to the same tree as the real file and matches it modulo whitespace', async () => {
		const result = dogfoodContract(createEngine(), await rebuildSpliceLoose(), target);
		expect(result.reparsesEqual).toBe(true);
		expect(result.sameModuloWhitespace).toBe(true);
	});
});
