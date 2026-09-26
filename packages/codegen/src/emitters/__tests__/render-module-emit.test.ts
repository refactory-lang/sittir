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
import { existsSync } from 'node:fs';
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
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
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
			word: undefined
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
/** The rust `options.rs` the cached emit produced beside its transports. */
let _rustOptionsRs: string | undefined;

async function getTransportRsForGrammar(grammar: 'rust' | 'typescript'): Promise<string> {
	const grammarJsPath = resolveGrammarJsPath(grammar);
	const overridesPath = resolveOverridesPath(grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;

	const raw = await evaluate(entryPath);
	const generatedIdTables = await loadGeneratedIdTables(grammar, repoRoot);
	if (generatedIdTables === undefined) throw new Error(`no generated id tables for ${grammar}`);
	const linked = link(raw, { generatedIdTables });
	const normalized = normalizeGrammar(linked);
	const nodeMap = assemble(
		AssembleCtx.from(normalized, generatedIdTables, undefined, loadGrammarJsonAliasMap(grammar))
	);

	const kindEntries = collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);
	if (grammar === 'rust') _rustKindEntries = kindEntries;
	const rulesConfig = {
		nodeMap,
		kindEntries,
		options: raw.options,
		whitespaceText: whitespaceTextOf(raw.visibleExternals, nodeMap)
	};
	const spacedRules = spaceRenderRules(rulesConfig);
	stampStaticSpacing(nodeMap, grammar, spacedRules);
	const renderRules = seamRenderRules(spacedRules, rulesConfig);
	const templates = runTemplateEmitter({ grammar, nodeMap, renderRules });
	const emit = emitRenderModule(grammar, templates, nodeMap, generatedIdTables, {
		renderRules,
		visibleExternals: raw.visibleExternals,
		options: raw.options
	});
	if (grammar === 'rust') _rustOptionsRs = emit.optionsRs.contents;
	return emit.transportRs.contents;
}

async function getRustOptionsRs(): Promise<string> {
	await getRustTemplatesRs();
	return _rustOptionsRs!;
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

	const generatedIdTables = await loadGeneratedIdTables(grammar, repoRoot);
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
		const listImpl = src.slice(
			src.indexOf('impl ::sittir_core::prepare::Prepare for FormalParametersElementsTransport {')
		);
		const listFill = listImpl.slice(0, listImpl.indexOf('\n}\n'));
		expect(listFill).toContain(
			'self.formal_parameter_separator_space_before.get_or_insert(ctx.options.spacing[options::SITE_FORMAL_PARAMETERS_ELEMENTS_FORMAL_PARAMETER_SEPARATOR_SPACE_BEFORE].arm);'
		);
		expect(listFill).toContain(
			'self.formal_parameter_separator_space_after.get_or_insert(ctx.options.spacing[options::SITE_FORMAL_PARAMETERS_ELEMENTS_FORMAL_PARAMETER_SEPARATOR_SPACE_AFTER].arm);'
		);
		expect(listFill).toContain(
			'self.delimiter.get_or_insert(ctx.options.delimiter[options::DELIM_FORMAL_PARAMETERS_ELEMENTS_FORMAL_PARAMETER]);'
		);
		const ownerImpl = src.slice(src.indexOf('impl ::sittir_core::prepare::Prepare for FormalParametersTransport {'));
		const ownerFill = ownerImpl.slice(0, ownerImpl.indexOf('\n}\n'));
		expect(ownerFill).toContain('self.formal_parameters_elements.prepare(ctx)?;');
		expect(ownerFill).not.toContain('SEPARATOR_SPACE');
		expect(ownerFill).not.toContain('lparen_after');
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

	it('a token seam has no transport field and is written from the resolved options at its site', async () => {
		const src = await getTypescriptTransportRs();
		const body = extractStructBody(src, 'ArgumentsTransport');
		expect(body).not.toContain('napi(js_name = "_lparen_after")');
		expect(body).not.toContain('pub lparen_after: Option<u16>,');
		expect(body).not.toMatch(/pub \w+_(start|end): Option<u16>,/);
		const fillImpl = src.slice(src.indexOf('impl ::sittir_core::prepare::Prepare for ArgumentsTransport {'));
		expect(fillImpl.slice(0, fillImpl.indexOf('\n}\n'))).not.toContain('lparen_after');
		const fn = src.slice(src.indexOf('fn render_arguments('));
		const render = fn.slice(0, fn.indexOf('\n}\n'));
		expect(render).toMatch(
			/w\.edge\(::sittir_core::types::KindId\(\d+\), ::sittir_core::options::Side::Before, node\.edges\.and_then\(\|e\| e\.before\)\);\s*\n\s*w\.text\("\("\)\?;\s*\n\s*w\.site_at\(options::SITE_ARGUMENTS_LPAREN_AFTER\);/
		);
		expect(src).toContain('    w.finish()?;');
		const binary = extractStructBody(src, 'BinaryExpressionTransport');
		expect(binary).not.toContain('pub operator_before: Option<u16>,');
		expect(binary).not.toContain('pub operator_after: Option<u16>,');
		expect(src).not.toContain('pub struct Seamed<T>');
		expect(src).not.toContain('LiteralSeams');
		expect(src).not.toContain('ArmSeams');
		expect(src).not.toContain('options::site_strength(');
		expect(src).toMatch(/head: (Some\(options::SITE_\w+\)|None),/);
	});

	it('a literal arm of a per-slot child enum writes its owner-kind seam sites around the literal from the resolved options', async () => {
		const src = await getTypescriptTransportRs();
		const enumSrc = src.slice(src.indexOf('pub enum LexicalDeclarationTerminatorTransportSlot {'));
		expect(enumSrc.slice(0, enumSrc.indexOf('\n}\n'))).toMatch(/Literal3_73_65_6d_69,/);
		const render = src.slice(
			src.indexOf('impl ::sittir_core::render::Render for LexicalDeclarationTerminatorTransportSlot {')
		);
		expect(render.slice(0, render.indexOf('\n}\n'))).toMatch(
			/Literal3_73_65_6d_69 => \{\s*w\.site_at\(options::SITE_LEXICAL_DECLARATION_SEMI_BEFORE\);\s*let written = w\.text\(";"\);/
		);
	});

	it('the render entry prepares the tree through the context before dispatch', async () => {
		const src = await getTypescriptTransportRs();
		expect(src).toContain('pub fn render_transport_parts(');
		expect(src).toContain("    ctx: &::sittir_core::prepare::RenderContext<'_>,");
		expect(src).toContain('    ::sittir_core::prepare::Prepare::prepare(&mut transport, ctx)?;');
	});

	it('every transport carries base edges; a kind edge is prepared from its edge row and written through the sink', async () => {
		const src = await getTypescriptTransportRs();
		for (const name of ['ArgumentsTransport', 'StatementBlockTransport']) {
			const body = extractStructBody(src, name);
			expect(body).toContain('napi(js_name = "$_edges")');
			expect(body).toContain('pub edges: Option<::sittir_core::options::Edges>,');
			expect(src).toContain(`impl ::sittir_core::options::Edged for ${name} {`);
			const prepare = src.slice(src.indexOf(`impl ::sittir_core::prepare::Prepare for ${name} {`));
			expect(prepare.slice(0, prepare.indexOf('\n}\n'))).toContain('::sittir_core::prepare::prepare_edges(self, ctx);');
		}
		expect(src).not.toMatch(/pub (arguments|statement_block)_(before|after): Option<u16>,/);
		expect(src).not.toContain('self.statement_block_before.get_or_insert');
		const blockFn = src.slice(src.indexOf('fn render_statement_block('));
		expect(blockFn.slice(0, blockFn.indexOf('\n}\n'))).toMatch(
			/w\.edge\(::sittir_core::types::KindId\(\d+\), ::sittir_core::options::Side::Before, node\.edges\.and_then\(\|e\| e\.before\)\);/
		);
		expect(src).toContain('.with_sources(ctx.sources).with_options(ctx.options)');
		expect(src).not.toMatch(/t\.\w+_after\.get_or_insert/);
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
		const tokenId = _rustKindEntries?.find(
			(entry) => entry.literalText === 'default' || entry.symbolName === 'default'
		)?.id;
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
		expect(body).toContain(
			'if self.element_separator_space_before.is_none() { self.element_separator_space_before = before; }'
		);
		expect(body).toContain(
			'if self.element_separator_space_after.is_none() { self.element_separator_space_after = after; }'
		);
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
			'::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER).with_table(&options::WHITESPACE).with_indent(&ctx.options.indent).with_sources(ctx.sources).with_options(ctx.options)'
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

	it('fills seated sibling gaps through one dense per-slot kind table and a core call; no per-list match block', async () => {
		const transportRs = await getRustTemplatesRs();
		const optionsRs = await getRustOptionsRs();
		const table = optionsRs.slice(optionsRs.indexOf('pub static SEATS_SOURCE_FILE_STATEMENTS: &[u16] = &['));
		const cells = table
			.slice(table.indexOf('\n') + 1, table.indexOf('];'))
			.split(',')
			.map((c) => c.trim())
			.filter(Boolean);
		expect(cells.filter((c) => c !== 'NO_SITE').length).toBeGreaterThan(0);
		expect(cells.every((c) => c === 'NO_SITE' || /^\d+$/.test(c))).toBe(true);
		expect(transportRs).toContain(
			'if let Some(seated_items) = self.statements.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_SOURCE_FILE_STATEMENTS, ctx); }'
		);
		expect(transportRs).not.toContain('let seated_last');
		expect(transportRs).not.toContain('edges_mut().after.get_or_insert');
		expect(transportRs).toContain('impl ::sittir_core::prepare::SeatTarget for AttributeItemTransport {');
		expect(transportRs).toContain('::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(');
	});

	it('binds a list view over site ids and writes a seam site as a call', async () => {
		const transportRs = await getRustTemplatesRs();
		const block = transportRs.slice(
			transportRs.indexOf('fn render_block('),
			transportRs.indexOf('fn render_block(') + 2000
		);
		expect(block).toMatch(/after: node\.statements_separator_space\.unwrap_or\(0\),/);
		expect(block).toMatch(/w\.site_at\(options::SITE_\w+_LBRACE_AFTER\);/);
		expect(block).toContain('w.text("{")?;');
		expect(block).toContain('statements.render(w)?;');
	});
});
