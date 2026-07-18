/**
 * render-module-emit.test.ts — unit tests for Phase 1 typed transport emission.
 *
 * Tests cover:
 * - `classifySlot` / `buildSupertypeTransportSet` / `deriveChildrenKinds` exported helpers
 * - Phase 1: single-concrete-kind field and children slots emit typed Rust types
 * - Phase 1: render functions call typed `render_<kind>`, not `render_transport_dispatch`
 *
 * These tests use the REAL rust grammar pipeline (evaluate → link → normalize → assemble →
 * emitRenderModule) so they exercise the full codegen path including the emitter.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifySlot, buildSupertypeTransportSet, deriveChildrenKinds, type SlotClass } from '../transport-common.ts';
import { emitRenderModule } from '../render-module.ts';
import type { AssembledNonterminal } from '../../compiler/model/node-map.ts';
import { evaluate } from '../../compiler/evaluate.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from '../../compiler/resolve-grammar.ts';
import { loadGeneratedIdTables, deriveGeneratedIdTablesFromParserCSource } from '../../compiler/generated-metadata.ts';
import { runTemplateEmitter } from '../templates.ts';
import type { TemplateFile } from '../template-hash.ts';
import type { NodeMap } from '../../compiler/types.ts';

const repoRoot = fileURLToPath(new URL('../../../../..', import.meta.url)).replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Regression: regen-templates-rs.ts must use the shared runner
// ---------------------------------------------------------------------------

it('regen-templates-rs uses the shared render-module runner', () => {
	const script = readFileSync(resolve(repoRoot, 'packages/codegen/src/scripts/regen-templates-rs.ts'), 'utf8');
	expect(script).toContain("from '../emitters/render-module-runner.ts'");
	expect(script).toContain('runRenderModuleEmitter(');
	expect(script).not.toContain('emitRenderModuleBundle(');
});

// ---------------------------------------------------------------------------
// classifySlot — exported helper
// ---------------------------------------------------------------------------

describe('classifySlot', () => {
	it('returns concrete for a single-kind projection', () => {
		const result = classifySlot(['identifier']);
		expect(result).toEqual<SlotClass>({ tag: 'concrete', kind: 'identifier', typeName: 'identifier' });
	});

	it('returns heterogeneous for multiple kinds', () => {
		const result = classifySlot(['identifier', 'metavariable']);
		expect(result.tag).toBe('heterogeneous');
	});

	it('returns heterogeneous for empty kinds', () => {
		const result = classifySlot([]);
		expect(result.tag).toBe('heterogeneous');
	});
});

// ---------------------------------------------------------------------------
// buildSupertypeTransportSet — exported helper
// ---------------------------------------------------------------------------

describe('buildSupertypeTransportSet', () => {
	it('returns empty map when no supertype nodes exist', () => {
		const nodeMap = {
			name: 'test',
			nodes: new Map(),
			signatures: { signatures: new Map() },
			derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
			rules: {},
			externals: new Set(),
			word: undefined,
			polymorphFormKinds: new Set()
		} as unknown as NodeMap;
		const result = buildSupertypeTransportSet(nodeMap);
		expect(result.size).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// deriveChildrenKinds — exported helper
// ---------------------------------------------------------------------------

describe('deriveChildrenKinds', () => {
	it('extracts resolved node-ref kinds from AssembledNonterminal.values', () => {
		// Construct a minimal AssembledNonterminal-shaped object for testing.
		const mockChild = {
			values: [
				{ kind: 'node-ref', node: { kind: 'identifier' }, multiplicity: 'array' },
				{ kind: 'node-ref', node: { kind: 'call_expression' }, multiplicity: 'array' },
				{ kind: 'terminal', value: ',', multiplicity: 'array' } // terminals ignored
			]
		};
		const result = deriveChildrenKinds(mockChild as unknown as AssembledNonterminal);
		expect(result).toEqual(['identifier', 'call_expression']);
	});

	it('deduplicates repeated kinds', () => {
		const mockChild = {
			values: [
				{ kind: 'node-ref', node: { kind: 'identifier' }, multiplicity: 'array' },
				{ kind: 'node-ref', node: { kind: 'identifier' }, multiplicity: 'array' }
			]
		};
		const result = deriveChildrenKinds(mockChild as unknown as AssembledNonterminal);
		expect(result).toEqual(['identifier']);
	});

	it('includes unresolved refs using their name (mirrors projection.kinds behaviour)', () => {
		// Children are always stored as unresolved refs in the assembled IR.
		// deriveChildrenKinds must use the ref's .name (grammar kind string)
		// so classifySlotForEmit can look up the kind in nodeMap — the same
		// approach AssembledField.projection.kinds uses in deriveSlotsRaw.
		const mockChild = {
			values: [
				{ kind: 'node-ref', node: { kind: 'identifier' }, multiplicity: 'array' },
				{ kind: 'node-ref', node: { kind: 'unresolved-ref', name: '_expression' }, multiplicity: 'array' }
			]
		};
		const result = deriveChildrenKinds(mockChild as unknown as AssembledNonterminal);
		expect(result).toEqual(['identifier', '_expression']);
	});
});

// ---------------------------------------------------------------------------
// Phase 1 — single-concrete-kind field slots in the real rust grammar
// ---------------------------------------------------------------------------

/** Cache for the rust emitRenderModule output. */
let _rustTemplatesRs: string | undefined;
let _typescriptTransportRs: string | undefined;

async function getTransportRsForGrammar(grammar: 'rust' | 'typescript'): Promise<string> {
	const grammarJsPath = resolveGrammarJsPath(grammar);
	const overridesPath = resolveOverridesPath(grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;

	const raw = await evaluate(entryPath);
	const linked = link(raw);
	const normalized = normalizeGrammar(linked);
	const nodeMap = assemble(AssembleCtx.from(normalized));
	const generatedIdTables = await loadGeneratedIdTables(grammar);

	const jinjaTemplates = runTemplateEmitter({ grammar, nodeMap });
	const templateFiles: TemplateFile[] = [];
	for (const [kind, body] of jinjaTemplates.bodies) {
		templateFiles.push({ filename: `${kind}.jinja`, content: body });
	}

	const emit = emitRenderModule(grammar, templateFiles, nodeMap, generatedIdTables);
	return emit.transportRs.contents;
}

async function getRustTemplatesRs(): Promise<string> {
	if (_rustTemplatesRs !== undefined) return _rustTemplatesRs;
	_rustTemplatesRs = await getTransportRsForGrammar('rust');
	return _rustTemplatesRs;
}

async function getTypescriptTransportRs(): Promise<string> {
	if (_typescriptTransportRs !== undefined) return _typescriptTransportRs;
	_typescriptTransportRs = await getTransportRsForGrammar('typescript');
	return _typescriptTransportRs;
}

/**
 * Extract the body of a `pub struct <name>` from a Rust source file.
 * Returns the raw text from `{` to the matching `}` (inclusive).
 */
function extractStructBody(src: string, structName: string): string {
	const start = src.indexOf(`pub struct ${structName}`);
	if (start === -1) return '';
	const open = src.indexOf('{', start);
	if (open === -1) return '';
	let depth = 0;
	let i = open;
	for (; i < src.length; i++) {
		if (src[i] === '{') depth++;
		else if (src[i] === '}') {
			depth--;
			if (depth === 0) break;
		}
	}
	return src.slice(open, i + 1);
}

/**
 * Extract the body of a `fn <name>(` function from a Rust source file.
 * Returns the raw text from `{` to the matching `}` (inclusive).
 */
function extractFnBody(src: string, fnName: string): string {
	const start = src.indexOf(`fn ${fnName}(`);
	if (start === -1) return '';
	const open = src.indexOf('{', start);
	if (open === -1) return '';
	let depth = 0;
	let i = open;
	for (; i < src.length; i++) {
		if (src[i] === '{') depth++;
		else if (src[i] === '}') {
			depth--;
			if (depth === 0) break;
		}
	}
	return src.slice(open, i + 1);
}

describe('Phase 1 — single-concrete-kind field slots (rust grammar)', () => {
	it('const_item.name is IdentifierTransport (single-kind concrete field)', async () => {
		const src = await getRustTemplatesRs();
		const structBody = extractStructBody(src, 'ConstItemTransport');
		expect(structBody).not.toBe('');
		// name field has kinds: ["identifier"] — single kind → concrete
		expect(structBody).toMatch(/pub name: IdentifierTransport,/);
	});

	it('const_item.name field is NOT Box<AnyTransport>', async () => {
		const src = await getRustTemplatesRs();
		const structBody = extractStructBody(src, 'ConstItemTransport');
		// The `name` field line should not use Box<AnyTransport>
		const nameLine = structBody.split('\n').find((l) => l.trim().startsWith('pub name:'));
		expect(nameLine).not.toContain('Box<AnyTransport>');
	});

	it('function_item.body is BlockTransport (single-kind concrete field)', async () => {
		const src = await getRustTemplatesRs();
		const structBody = extractStructBody(src, 'FunctionItemTransport');
		expect(structBody).not.toBe('');
		// body field has kinds: ["block"] — single kind → concrete
		expect(structBody).toMatch(/pub body: BlockTransport,/);
	});

	it('function_item.name is FunctionItemNameTransportSlot (proper subset of _path stays heterogeneous, not collapsed)', async () => {
		const src = await getRustTemplatesRs();
		const structBody = extractStructBody(src, 'FunctionItemTransport');
		// name field has kinds: ["identifier", "metavariable"] — both are subtypes
		// of rust's _path supertype, but _path's full resolved subtype set has
		// 7 members (self, identifier, metavariable, super, crate,
		// scoped_identifier, _reserved_identifier). classifySlot only collapses
		// a slot onto the supertype type when the slot's kind set EXACTLY
		// equals the supertype's full subtype set — a deliberate safety rule
		// (transport-common.ts:58-67): a looser subset-collapse risked
		// FromNapiValue recursing through a wide/self-recursive supertype and
		// overflowing the native stack. A proper-subset slot like this one
		// falls to `heterogeneous` instead, emitting a per-slot enum of
		// exactly its own kinds.
		const nameLine = structBody.split('\n').find((l) => l.trim().startsWith('pub name:'));
		expect(nameLine).toContain('FunctionItemNameTransportSlot');
		expect(src).toContain('pub enum FunctionItemNameTransportSlot {');
		expect(src).toContain('Identifier(IdentifierTransport),');
		expect(src).toContain('Metavariable(MetavariableTransport),');
	});

	it('render_const_item uses Renderable::Transport for name (zero-alloc)', async () => {
		const src = await getRustTemplatesRs();
		const fnBody = extractFnBody(src, 'render_const_item');
		expect(fnBody).not.toBe('');
		// name is single-kind (IdentifierTransport) → zero-alloc Transport coercion,
		// no intermediate String allocation via render_identifier.
		expect(fnBody).toContain('Renderable::Transport(&node.name');
		expect(fnBody).not.toContain('render_identifier');
	});

	it('render_function_item uses Renderable::Transport for body (zero-alloc)', async () => {
		const src = await getRustTemplatesRs();
		const fnBody = extractFnBody(src, 'render_function_item');
		expect(fnBody).not.toBe('');
		// body is single-kind (BlockTransport) → zero-alloc Transport coercion,
		// no intermediate String allocation via render_block.
		expect(fnBody).toContain('Renderable::Transport(&node.body');
		expect(fnBody).not.toContain('render_block');
	});

	it('leaf transport napi impls accept strings, structured objects, and boolean-presence leaves', async () => {
		// napi typeof-dispatch transport fix: leaf FromNapiValue impls now
		// branch on `transport_value_type(env, napi_val)?` up front instead of
		// speculatively trying `String::from_napi_value`/`bool::from_napi_value`
		// and catching failures — calling `String::from_napi_value` on a
		// non-string input had a bad failure path (JSON.stringify on Object
		// inputs). Same accept surface (string / object $text / boolean
		// presence), different, safer dispatch shape.
		const src = await getTypescriptTransportRs();
		expect(src).toContain('::napi::ValueType::String => String::from_napi_value(env, napi_val)?,');
		expect(src).toContain('obj.get("$text")?.unwrap_or_default()');
		expect(src).toContain('::napi::ValueType::Boolean => {');
		expect(src).toContain('if !bool::from_napi_value(env, napi_val)? {');
		expect(src).toContain('received false; omit the field instead of sending false');
	});

	it('leaf token transport napi impls recover literal text from numeric kind ids', async () => {
		const src = await getTypescriptTransportRs();
		// Raw kind_id (Number) input is matched directly via the same
		// transport_value_type dispatch, not a speculative u16 try-parse.
		expect(src).toContain('::napi::ValueType::Number => "+".to_string(),');
		expect(src).toContain('obj.get("$text")?.unwrap_or_else(|| "+".to_string())');
	});
});

async function buildRustFixtureForParity() {
	const grammar = 'rust' as const;
	const grammarJsPath = resolveGrammarJsPath(grammar);
	const overridesPath = resolveOverridesPath(grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;
	const raw = await evaluate(entryPath);
	const linked = link(raw);
	const normalized = normalizeGrammar(linked);
	const nodeMap = assemble(AssembleCtx.from(normalized));

	// loadGeneratedIdTables uses process.cwd() which is packages/codegen when vitest runs.
	// Use the repo root (anchored to this file) to reliably locate parser.c.
	const parserCPath = resolve(repoRoot, 'packages', grammar, '.sittir', 'src', 'parser.c');
	const generatedIdTables = existsSync(parserCPath)
		? await deriveGeneratedIdTablesFromParserCSource(
				readFileSync(parserCPath, 'utf8'),
				`packages/${grammar}/.sittir/src/parser.c`
			)
		: await loadGeneratedIdTables(grammar);

	const jinjaTemplates = runTemplateEmitter({ grammar, nodeMap });
	return { grammar, nodeMap, generatedIdTables, jinjaTemplates };
}

// ---------------------------------------------------------------------------
// Regression: override-polymorph variant pairing must use index order
// ---------------------------------------------------------------------------
//
// Both collectRenderModuleEntry and collectMetaData previously contained
// `|| true` in the `find()` predicate, causing every variantChildKind to
// be paired with forms[0] instead of its positionally-corresponding form.
// array_expression has two forms — semi (index 0) and list (index 1) —
// so the bug mapped array_expression_list → "semi" instead of "list".

it('override-polymorph variant pairing: array_expression_list maps to "list" (not "semi")', async () => {
	const { grammar, nodeMap, generatedIdTables, jinjaTemplates } = await buildRustFixtureForParity();
	const templateFiles: TemplateFile[] = [];
	for (const [kind, body] of jinjaTemplates.bodies) {
		templateFiles.push({ filename: `${kind}.jinja`, content: body });
	}
	const emit = emitRenderModule(grammar, templateFiles, nodeMap, generatedIdTables);
	// bridge.rs has been retired (PR-E2) — variant pairing is now structural in transport.rs.
	// Kind-named slots (2026-05-17) additionally collapsed array_expression's
	// two polymorph forms onto ONE unnamed top-level-choice `content` slot
	// (ArrayExpressionContentTransportSlot, same "unnamed top-level choice →
	// content slot" convention as every other unnamed-choice case in this
	// codebase) instead of two separate top-level struct fields with their own
	// `_array_expression_list`/`_array_expression_semi` js_names. The
	// regression this test guards against (the `|| true` find() predicate
	// pairing every variantChildKind with forms[0]) is now verified through
	// the enum's variant→render-fn mapping instead.
	const transport = emit.transportRs.contents;
	expect(transport).toContain('pub enum ArrayExpressionContentTransportSlot {');
	// Key regression guard: each variant must render via its OWN form, not
	// both collapsing onto forms[0] (semi).
	expect(transport).toContain(
		'ArrayExpressionContentTransportSlot::ArrayExpressionList(inner) => render_array_expression_list(inner, dest),'
	);
	expect(transport).toContain(
		'ArrayExpressionContentTransportSlot::ArrayExpressionSemi(inner) => render_array_expression_semi(inner, dest),'
	);
}, 60_000);
