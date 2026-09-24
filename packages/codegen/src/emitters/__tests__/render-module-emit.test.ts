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
import { collectCatalogKinds, collectKindEntries } from '../kind-discriminant.ts';
import { seamRenderRules, spaceRenderRules, whitespaceTextOf } from '../../compiler/model/render-rules.ts';
import type { AssembledNonterminal } from '../../compiler/model/node-map.ts';
import { evaluate } from '../../compiler/evaluate.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from '../../compiler/resolve-grammar.ts';
import { loadGrammarJsonAliasMap } from '../../compiler/inline-sets.ts';
import { loadGeneratedIdTables, deriveGeneratedIdTablesFromParserCSource } from '../../compiler/generated-metadata.ts';
import { runTemplateEmitter, stampStaticSpacing } from '../templates.ts';
import type { NodeMap } from '../../compiler/types.ts';

const repoRoot = fileURLToPath(new URL('../../../../..', import.meta.url)).replace(/\/$/, '');

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
/** The rust kind entries the cached emit was produced from. */
let _rustKindEntries: ReturnType<typeof collectKindEntries> | undefined;

async function getTransportRsForGrammar(grammar: 'rust' | 'typescript'): Promise<string> {
	const grammarJsPath = resolveGrammarJsPath(grammar);
	const overridesPath = resolveOverridesPath(grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;

	const raw = await evaluate(entryPath);
	const parserCPath = resolve(repoRoot, 'packages', grammar, '.sittir', 'src', 'parser.c');
	const generatedIdTables = await deriveGeneratedIdTablesFromParserCSource(
		readFileSync(parserCPath, 'utf8'),
		`packages/${grammar}/.sittir/src/parser.c`
	);
	const linked = link(raw, { generatedIdTables });
	const normalized = normalizeGrammar(linked);
	const nodeMap = assemble(AssembleCtx.from(normalized, generatedIdTables, undefined, loadGrammarJsonAliasMap(grammar)));

	const kindEntries = collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);
	if (grammar === 'rust') _rustKindEntries = kindEntries;
	const rulesConfig = { nodeMap, kindEntries, options: raw.options, whitespaceText: whitespaceTextOf(raw.visibleExternals, nodeMap) };
	const spacedRules = spaceRenderRules(rulesConfig);
	stampStaticSpacing(nodeMap, grammar, spacedRules);
	const renderRules = seamRenderRules(spacedRules, rulesConfig);
	const templates = runTemplateEmitter({ grammar, nodeMap, renderRules });
	const emit = emitRenderModule(grammar, templates, nodeMap, generatedIdTables, {
		renderRules,
		visibleExternals: raw.visibleExternals,
		options: raw.options
	});
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
		expect(structBody).toMatch(/pub name: ::sittir_core::SlotValue<IdentifierTransport>,/);
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
		expect(structBody).toMatch(/pub body: ::sittir_core::SlotValue<BlockTransport>,/);
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

	it('render_const_item interpolates name directly as a required slot', async () => {
		const src = await getRustTemplatesRs();
		const fnBody = extractFnBody(src, 'render_const_item');
		expect(fnBody).not.toBe('');
		expect(fnBody).toContain('let name = &node.name;');
		expect(fnBody).not.toContain('View::new(&node.name');
		expect(fnBody).not.toContain('render_identifier');
	});

	it('render_function_item interpolates body directly as a required slot', async () => {
		const src = await getRustTemplatesRs();
		const fnBody = extractFnBody(src, 'render_function_item');
		expect(fnBody).not.toBe('');
		expect(fnBody).toContain('let body = &node.body;');
		expect(fnBody).not.toContain('View::new(&node.body');
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

	// loadGeneratedIdTables uses process.cwd() which is packages/codegen when vitest runs.
	// Use the repo root (anchored to this file) to reliably locate parser.c.
	const parserCPath = resolve(repoRoot, 'packages', grammar, '.sittir', 'src', 'parser.c');
	const generatedIdTables = existsSync(parserCPath)
		? await deriveGeneratedIdTablesFromParserCSource(
				readFileSync(parserCPath, 'utf8'),
				`packages/${grammar}/.sittir/src/parser.c`
			)
		: await loadGeneratedIdTables(grammar);
	const nodeMap = assemble(AssembleCtx.from(normalized, generatedIdTables));

	const renderRules =
		generatedIdTables === undefined
			? undefined
			: spaceRenderRules({
					nodeMap,
					kindEntries: collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables),
					options: raw.options,
					whitespaceText: whitespaceTextOf(raw.visibleExternals, nodeMap)
				});
	const templates = runTemplateEmitter({ grammar, nodeMap, renderRules });
	return { grammar, nodeMap, generatedIdTables, templates };
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

// A variant parent's content slot pairs each variant kind with its own form.
// function_type has two forms — trait_form (index 0) and fn_form (index 1) —
// so pairing every variant with forms[0] would map function_type_fn_form onto
// trait_form.
it('variant pairing: function_type_fn_form renders through fn_form (not trait_form)', async () => {
	const { grammar, nodeMap, generatedIdTables, templates } = await buildRustFixtureForParity();
	const emit = emitRenderModule(grammar, templates, nodeMap, generatedIdTables);
	const transport = emit.transportRs.contents;
	expect(transport).toContain('pub enum FunctionTypeContentTransportSlot {');
	expect(transport).toContain('FunctionTypeContentTransportSlot::FunctionTypeFnForm(inner) => inner.render(w),');
	expect(transport).toContain('FunctionTypeContentTransportSlot::FunctionTypeTraitForm(inner) => inner.render(w),');
}, 60_000);

describe('render options on transports', () => {
	it('a separated-list transport carries its own spacing and flank fields, named by the site key', async () => {
		const src = await getTypescriptTransportRs();
		const body = extractStructBody(src, 'FormalParametersElementsTransport');
		expect(body).toContain('napi(js_name = "_formal_parameter_separator_space_before")');
		expect(body).toContain('pub formal_parameter_separator_space_before: Option<u16>,');
		expect(body).toContain('napi(js_name = "_formal_parameter_separator_space_after")');
		expect(body).toContain('pub formal_parameter_separator_space_after: Option<u16>,');
		expect(body).toContain('pub delimiter: Option<u8>,');
		expect(src).not.toContain('ListSpacing');
	});

	it('a list fills its own fields from its own site indices; its owner only recurses', async () => {
		const src = await getTypescriptTransportRs();
		const listImpl = src.slice(src.indexOf('impl ::sittir_core::prepare::Prepare for FormalParametersElementsTransport {'));
		const listFill = listImpl.slice(0, listImpl.indexOf('\n}\n'));
		expect(listFill).toContain(
			'self.formal_parameter_separator_space_before.get_or_insert(ctx.options.spacing[options::SITE_FORMAL_PARAMETERS_ELEMENTS_FORMAL_PARAMETER_SEPARATOR_SPACE_BEFORE]);'
		);
		expect(listFill).toContain(
			'self.formal_parameter_separator_space_after.get_or_insert(ctx.options.spacing[options::SITE_FORMAL_PARAMETERS_ELEMENTS_FORMAL_PARAMETER_SEPARATOR_SPACE_AFTER]);'
		);
		expect(listFill).toContain('self.delimiter.get_or_insert(ctx.options.delimiter[options::DELIM_FORMAL_PARAMETERS_ELEMENTS_FORMAL_PARAMETER]);');
		const ownerImpl = src.slice(src.indexOf('impl ::sittir_core::prepare::Prepare for FormalParametersTransport {'));
		const ownerFill = ownerImpl.slice(0, ownerImpl.indexOf('\n}\n'));
		expect(ownerFill).toContain('self.formal_parameters_elements.prepare(ctx)?;');
		expect(ownerFill).not.toContain('SEPARATOR_SPACE');
		expect(ownerFill).toContain('self.lparen_after.get_or_insert(ctx.options.spacing[options::SITE_FORMAL_PARAMETERS_LPAREN_AFTER]);');
	});

	it('the list view is built from the transport fields and never from a separator literal', async () => {
		const src = await getTypescriptTransportRs();
		const fn = src.slice(src.indexOf('fn render_formal_parameters_elements('));
		const view = fn.slice(0, fn.indexOf('\n}\n'));
		expect(view).toContain('before: node.formal_parameter_separator_space_before.unwrap_or(0),');
		expect(view).toContain('after: node.formal_parameter_separator_space_after.unwrap_or(0),');
		expect(view).toMatch(/token: (match node\.separator_kind \{|",",)/);
		expect(src).not.toMatch(/ListView \{[^}]*\bseparator: /);
	});

	it('a token seam is a transport field, filled from its site, and resolved through a direct site call', async () => {
		const src = await getTypescriptTransportRs();
		const body = extractStructBody(src, 'ArgumentsTransport');
		expect(body).toContain('napi(js_name = "_lparen_after")');
		expect(body).toContain('pub lparen_after: Option<u16>,');
		const fillImpl = src.slice(src.indexOf('impl ::sittir_core::prepare::Prepare for ArgumentsTransport {'));
		expect(fillImpl.slice(0, fillImpl.indexOf('\n}\n'))).toContain('self.lparen_after.get_or_insert(ctx.options.spacing[options::SITE_ARGUMENTS_LPAREN_AFTER]);');
		const fn = src.slice(src.indexOf('fn render_arguments('));
		const render = fn.slice(0, fn.indexOf('\n}\n'));
		expect(render).not.toContain('let lparen_after');
		expect(render).toMatch(/w\.site_with\(node\.arguments_before\.unwrap_or\(0\), options::site_strength\(options::SITE_ARGUMENTS_ARGUMENTS_BEFORE, node\.arguments_before\.unwrap_or\(0\)\)\);\s*\n\s*w\.text\("\("\)\?;\s*\n\s*w\.site_with\(node\.lparen_after\.unwrap_or\(0\), options::site_strength\(options::SITE_ARGUMENTS_LPAREN_AFTER, node\.lparen_after\.unwrap_or\(0\)\)\);/);
		expect(src).toContain('    w.finish()?;');
		const binary = extractStructBody(src, 'BinaryExpressionTransport');
		expect(binary).toContain('pub operator_before: Option<u16>,');
		expect(binary).toContain('pub operator_after: Option<u16>,');
		const block = extractStructBody(src, 'StatementBlockTransport');
		expect(block).toContain('pub statement_block_before: Option<u16>,');
		expect(block).toContain('pub statement_block_after: Option<u16>,');
		const blockFn = src.slice(src.indexOf('fn render_statement_block('));
		expect(blockFn.slice(0, blockFn.indexOf('\n}\n'))).toMatch(/w\.site_with\(node\.statement_block_before\.unwrap_or\(0\), options::site_strength\(options::SITE_\w+_STATEMENT_BLOCK_BEFORE, node\.statement_block_before\.unwrap_or\(0\)\)\);/);
	});

	it('a literal arm of a per-slot child enum carries its owner-kind seam sites, fills them, and writes them around the literal', async () => {
		const src = await getTypescriptTransportRs();
		const enumSrc = src.slice(src.indexOf('pub enum LexicalDeclarationTerminatorTransportSlot {'));
		expect(enumSrc.slice(0, enumSrc.indexOf('\n}\n'))).toMatch(/Literal3_73_65_6d_69\(LiteralSeams\),/);
		const prepare = src.slice(src.indexOf('impl ::sittir_core::prepare::Prepare for LexicalDeclarationTerminatorTransportSlot {'));
		expect(prepare.slice(0, prepare.indexOf('\n}\n'))).toContain('t.before.get_or_insert(ctx.options.spacing[options::SITE_LEXICAL_DECLARATION_SEMI_BEFORE]);');
		const render = src.slice(src.indexOf('impl ::sittir_core::render::Render for LexicalDeclarationTerminatorTransportSlot {'));
		expect(render.slice(0, render.indexOf('\n}\n'))).toMatch(
			/Literal3_73_65_6d_69\(seams\) => \{\s*w\.site_with\(seams\.before\.unwrap_or\(0\), options::site_strength\(options::SITE_LEXICAL_DECLARATION_SEMI_BEFORE, seams\.before\.unwrap_or\(0\)\)\);\s*let written = w\.text\(";"\);/
		);
	});

	it('the render entry prepares the tree through the context before dispatch', async () => {
		const src = await getTypescriptTransportRs();
		expect(src).toContain('pub fn render_transport_parts(');
		expect(src).toContain("    ctx: &::sittir_core::prepare::RenderContext<'_>,");
		expect(src).toContain('    ::sittir_core::prepare::Prepare::prepare(&mut transport, ctx)?;');
	});
});


describe('the typed sink replaces the mark-based Display path', () => {
	it('decodes a keyword the parser shows as an identifier under the keyword id', async () => {
		// rust aliases the `default` keyword to `identifier` through the inlined
		// `_reserved_identifier`; the node's storage is the keyword itself, so an
		// expression slot decodes the keyword's id straight to its own transport.
		const transportRs = await getRustTemplatesRs();
		const from = transportRs.indexOf('impl ::napi::bindgen_prelude::FromNapiValue for ExpressionTransport {');
		expect(from).toBeGreaterThan(-1);
		const body = transportRs.slice(from, transportRs.indexOf('\n}\n', from));
		const tokenId = _rustKindEntries?.find((entry) => entry.literalText === 'default' || entry.symbolName === 'default')?.id;
		expect(tokenId).toBeDefined();
		expect(_rustKindEntries?.some((entry) => entry.kind === '_reserved_identifier')).toBe(false);
		expect(body).toContain(`${tokenId} => Ok(Self::DefaultKeyword(`);
	});

	it('classifies a rebuilt list from the gaps between its coordinates before the table fills it', async () => {
		const transportRs = await getRustTemplatesRs();
		const from = transportRs.indexOf('impl ::sittir_core::prepare::Prepare for ArgumentsElementsTransport {');
		expect(from).toBeGreaterThan(-1);
		const body = transportRs.slice(from, transportRs.indexOf('\n}\n', from));
		expect(body).toContain('::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, ","');
		expect(body).toContain('&options::WHITESPACE)');
		// The class taken from the source beats the table and loses to the wire:
		// the classification precedes every `get_or_insert` fill of the same site.
		expect(body.indexOf('classify_list_gaps')).toBeLessThan(body.indexOf('.get_or_insert(ctx.options.spacing['));
		expect(body).toContain('if self.element_separator_space_before.is_none() { self.element_separator_space_before = before; }');
		expect(body).toContain('if self.element_separator_space_after.is_none() { self.element_separator_space_after = after; }');
	});
	it('renders through the typed sink and writes no mark character', async () => {
		const transportRs = await getRustTemplatesRs();
		expect(transportRs).not.toContain('impl ::std::fmt::Display for');
		expect(transportRs).not.toMatch(/[\u{FFFE}\u{FDD0}-\u{FDD3}]/u);
		expect(transportRs).not.toContain('mark_adjacent');
		expect(transportRs).toContain('impl ::sittir_core::render::Render for FunctionItemTransport {');
		expect(transportRs).toContain(
			'fn render_function_item(node: &FunctionItemTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {'
		);
		expect(transportRs).toContain(
			"pub fn render_transport_dispatch(transport: &dyn ::sittir_core::render::Render, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<String, ::sittir_core::render::RenderError> {"
		);
		expect(transportRs).toContain(
			'::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER).with_table(&options::WHITESPACE).with_indent(&ctx.options.indent).with_sources(ctx.sources)'
		);
	});

	it('carries every slot as Coord or Transport and never a bare string', async () => {
		const transportRs = await getRustTemplatesRs();
		expect(transportRs).not.toContain('SlotValue::Node(');
		expect(transportRs).not.toContain('SlotValue::Verbatim(');
		expect(transportRs).toContain('SlotValue::Transport(');
	});

	it('declares no inert metadata on transports', async () => {
		const transportRs = await getRustTemplatesRs();
		for (const field of [
			'transport_span',
			'transport_node_handle',
			'transport_child_index',
			'transport_source',
			'transport_named'
		]) {
			expect(transportRs).not.toContain(`pub ${field}:`);
		}
		expect(transportRs).toContain('pub transport_trivia_data: Option<TransportTrivia>');
		expect(transportRs).not.toContain('pub transport_text: Option<String>');
	});

	it('reads a depth token off its kind and not off a sentinel default', async () => {
		const transportRs = await getRustTemplatesRs();
		expect(transportRs).not.toMatch(/[\u{FFFE}\u{FDD0}-\u{FDD3}]/u);
		expect(transportRs).toContain('{ w.dedent("\\n"); Ok::<(), ::sittir_core::render::RenderError>(()) }');
	});

	it('prepares every transport through the render context and renders with its sources', async () => {
		const transportRs = await getRustTemplatesRs();
		expect(transportRs).not.toContain('FillOptions');
		expect(transportRs).toContain('impl ::sittir_core::prepare::Prepare for FunctionItemTransport {');
		expect(transportRs).toContain(
			"fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {"
		);
		expect(transportRs).toContain('.get_or_insert(ctx.options.spacing[options::');
		expect(transportRs).toContain(
			"pub fn render_transport_dispatch(transport: &dyn ::sittir_core::render::Render, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<String, ::sittir_core::render::RenderError> {"
		);
		expect(transportRs).toContain(
			'::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER).with_table(&options::WHITESPACE).with_indent(&ctx.options.indent).with_sources(ctx.sources)'
		);
	});

	it('admits verbatim text only where a slot admits a pattern kind', async () => {
		const transportRs = await getRustTemplatesRs();
		expect(transportRs).toContain('pub struct VerbatimTransport {');
		// FunctionItem.name admits identifier and metavariable, both pattern-modeled.
		expect(transportRs).toMatch(/pub enum FunctionItemNameTransportSlot \{[^}]*Verbatim\(VerbatimTransport\),/s);
		// EnumVariant.body admits two field lists and no pattern kind.
		expect(transportRs).toMatch(/pub enum EnumVariantBodyTransportSlot \{(?:(?!Verbatim)[^}])*\}/s);
	});

	it('binds a list view over site ids and writes a seam site as a call', async () => {
		const transportRs = await getRustTemplatesRs();
		const block = transportRs.slice(transportRs.indexOf('fn render_block('), transportRs.indexOf('fn render_block(') + 2000);
		expect(block).toMatch(/after: node\.statements_separator_space\.unwrap_or\(0\),/);
		expect(block).toMatch(/w\.site_with\(node\.lbrace_after\.unwrap_or\(0\), options::site_strength\(options::SITE_\w+_LBRACE_AFTER, node\.lbrace_after\.unwrap_or\(0\)\)\);/);
		expect(block).toContain('w.text("{")?;');
		expect(block).toContain('statements.render(w)?;');
	});
});
