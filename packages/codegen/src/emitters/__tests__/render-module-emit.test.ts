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

import { beforeAll, describe, expect, it } from 'vitest';
import { DEDENT_TEXT, INDENT_TEXT } from '../../dsl/primitives/spacing.ts';
import { classifySlot, buildSupertypeTransportSet, deriveChildrenKinds, type SlotClass } from '../transport-common.ts';
import { emitRenderModule, grammarRenderInputs, payloadCeilingAssertions, rustTransportStructName, transportSlotShapeOf } from '../render-module.ts';
import { BOXED_PAYLOADS, PAYLOAD_CEILING_BYTES } from '../boxed-payloads.ts';
import { collectCatalogKinds, collectKindEntries, findKindEntry } from '../kind-discriminant.ts';
import { seamRenderRules, spaceRenderRules, whitespaceTextOf } from '../../compiler/model/render-rules.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { runTemplateEmitter, stampStaticSpacing } from '../templates.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { evaluatePackage } from '../../compiler/evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';
import { generatedFieldIds } from '../../dsl/symbol-table.ts';
import { listViewOwners } from '../factories.ts';
import { aliasEnvelopeIds, aliasEnvelopesOf, isTextLeaf } from '../shared.ts';
import { AbstractAssembledCompound, AssembledList, type AssembledNode, type AssembledNonterminal } from '../../compiler/model/node-map.ts';
import { hasBlankArm } from '../../compiler/model/site-preferences.ts';
import {
	assertOneUntaggedSlot,
	enumKindArgs,
	flankArgs,
	layoutTokenIds,
	readNames,
	slotArgs,
	transportArgs,
	type ReadFactsCtx
} from '../transport-projection.ts';


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
			externals: [],
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

const _models = new Map<string, ReturnType<typeof buildModel>>();

async function buildModel(grammar: 'rust' | 'typescript' | 'scm') {
	const raw = await evaluatePackage(grammarPackage(grammar));
	const generatedIdTables = await loadGeneratedIdTables(grammar);
	if (generatedIdTables === undefined) throw new Error(`no generated id tables for ${grammar}`);
	const linked = link(raw, { generatedIdTables });
	const normalized = normalizeGrammar(linked);
	const nodeMap = assemble(
		AssembleCtx.from(normalized, generatedIdTables)
	);

	const kindEntries = collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);
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
	return { raw, nodeMap, kindEntries, generatedIdTables, templates, renderRules };
}

function modelFor(grammar: 'rust' | 'typescript' | 'scm') {
	const cached = _models.get(grammar);
	if (cached !== undefined) return cached;
	const built = buildModel(grammar);
	_models.set(grammar, built);
	return built;
}

async function getTransportRsForGrammar(grammar: 'rust' | 'typescript' | 'scm'): Promise<string> {
	const { raw, nodeMap, kindEntries, generatedIdTables, templates, renderRules } = await modelFor(grammar);
	if (grammar === 'rust') _rustKindEntries = kindEntries;
	const emit = emitRenderModule(
		grammar,
		templates,
		nodeMap,
		generatedIdTables,
		grammarRenderInputs(grammar, { renderRules, visibleExternals: raw.visibleExternals, options: raw.options })
	);
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

beforeAll(() => Promise.all([getRustTemplatesRs(), getTypescriptTransportRs()]), 120_000);

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

	it('a leaf transport crosses its text under `$text`', async () => {
		const src = await getTypescriptTransportRs();
		expect(extractStructBody(src, 'IdentifierTransport')).toMatch(/    #\[wire\(key = "\$text"\)\]\n    pub text: String,/);
	});

	it('a presence slot holding a keyword kind crosses as a boolean and renders the kind', async () => {
		const src = await getRustTemplatesRs();
		expect(extractStructBody(src, 'ReferenceTypeTransport')).toContain('pub mutable: Option<bool>,');
		expect(extractFnBody(src, 'render_reference_type')).toContain(
			'let mutable = View::new(::sittir_core::view::Presence::new(node.mutable, MutableSpecifierTransport::MutableSpecifier), "{}");'
		);
		expect(src).not.toContain('::napi::ValueType::Boolean');
	});

	it('a fixed-text kind decodes its numeric kind id into its unit, which writes the kind text', async () => {
		const src = await getTypescriptTransportRs();
		expect(src).toContain('#[transport(choice)]\npub enum PlusTransport {\n    #[kind(kind::PLUS)]\n    Plus,\n}');
		expect(src).toMatch(
			/fn render_plus\(w: &mut dyn ::sittir_core::render::RenderSink\) -> ::sittir_core::render::RenderResult \{\n    TransportLayout::render\(None, Some\(::sittir_core::types::KindId\(\d+\)\), ::sittir_core::layout::TriviaRole::Token, w, \|w\| w\.text\("\+"\)\)/
		);
	});
});

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
	const transport = await getRustTemplatesRs();
	expect(transport).toContain('pub enum FunctionTypeContentTransportSlot {');
	expect(transport).toMatch(/FunctionTypeContentTransportSlot::FunctionTypeFnForm\(inner\) => inner(?:\.as_ref\(\))?\.render\(w\),/);
	expect(transport).toMatch(/FunctionTypeContentTransportSlot::FunctionTypeTraitForm\(inner\) => inner(?:\.as_ref\(\))?\.render\(w\),/);
});

describe('render options on transports', () => {
	it('a separated-list transport carries its own spacing and flank fields, named by the site key', async () => {
		const src = await getTypescriptTransportRs();
		const body = extractStructBody(src, 'FormalParametersElementsTransport');
		expect(body).toContain('wire(key = "_item_separator_space_before")');
		expect(body).toContain('pub item_separator_space_before: Option<u16>,');
		expect(body).toContain('wire(key = "_item_separator_space_after")');
		expect(body).toContain('pub item_separator_space_after: Option<u16>,');
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
			'self.item_separator_space_before.get_or_insert(ctx.options.spacing[options::SITE_FORMAL_PARAMETERS_ELEMENTS_ITEM_SEPARATOR_SPACE_BEFORE].arm);'
		);
		expect(listFill).toContain(
			'self.item_separator_space_after.get_or_insert(ctx.options.spacing[options::SITE_FORMAL_PARAMETERS_ELEMENTS_ITEM_SEPARATOR_SPACE_AFTER].arm);'
		);
		expect(listFill).toMatch(
			/self\.delimiter\.get_or_insert\(::sittir_core::prepare::source_trailing_delimiter\(flank\.as_ref\(\), ::sittir_core::types::KindId\(\d+\), &\[\d+\], ctx\.options\.delimiter\[options::DELIM_FORMAL_PARAMETERS_ELEMENTS_ITEM\], ctx\)\);/
		);
		const ownerImpl = src.slice(src.indexOf('impl ::sittir_core::prepare::Prepare for FormalParametersTransport {'));
		const ownerFill = ownerImpl.slice(0, ownerImpl.indexOf('\n}\n'));
		expect(ownerFill).toContain('self.elements.prepare(ctx)?;');
		expect(ownerFill).not.toContain('SEPARATOR_SPACE');
		expect(ownerFill).not.toContain('lparen_after');
	});

	it('the list view is built from the transport fields and never from a separator literal', async () => {
		const src = await getTypescriptTransportRs();
		const fn = src.slice(src.indexOf('fn render_formal_parameters_elements('));
		const view = fn.slice(0, fn.indexOf('\n}\n'));
		expect(view).toContain('before: node.item_separator_space_before.unwrap_or(0),');
		expect(view).toContain('after: node.item_separator_space_after.unwrap_or(0),');
		expect(view).toMatch(/token: (match node\.separator_kind \{|",",)/);
		expect(src).not.toMatch(/ListView \{[^}]*\bseparator: /);
	});

	it('a token seam has no transport field and is written from the resolved options at its site', async () => {
		const src = await getTypescriptTransportRs();
		const body = extractStructBody(src, 'ArgumentsTransport');
		expect(body).not.toContain('wire(key = "_lparen_after")');
		expect(body).not.toContain('pub lparen_after: Option<u16>,');
		expect(body).not.toMatch(/pub \w+_(start|end): Option<u16>,/);
		const fillImpl = src.slice(src.indexOf('impl ::sittir_core::prepare::Prepare for ArgumentsTransport {'));
		expect(fillImpl.slice(0, fillImpl.indexOf('\n}\n'))).not.toContain('lparen_after');
		const fn = src.slice(src.indexOf('fn render_arguments('));
		const render = fn.slice(0, fn.indexOf('\n}\n'));
		expect(render).toMatch(
			/w\.edge\(::sittir_core::types::KindId\(\d+\), ::sittir_core::options::Side::Before, node\.layout\.edges\(\)\.before\);\s*\n\s*w\.text\("\("\)\?;\s*\n\s*w\.site_at\(options::SITE_ARGUMENTS_LPAREN_AFTER\);/
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
		expect(enumSrc.slice(0, enumSrc.indexOf('\n}\n'))).toMatch(/^    Semi,$/m);
		const render = src.slice(
			src.indexOf('impl ::sittir_core::render::Render for LexicalDeclarationTerminatorTransportSlot {')
		);
		expect(render.slice(0, render.indexOf('\n}\n'))).toMatch(
			/Semi => \{\s*w\.site_at\(options::SITE_LEXICAL_DECLARATION_SEMI_BEFORE\);\s*let written = render_semi\(w\);/
		);
	});

	it('the render entry prepares the tree through the context before dispatch', async () => {
		const src = await getTypescriptTransportRs();
		expect(src).toContain('pub fn render_transport_parts(');
		expect(src).toContain("    ctx: &::sittir_core::prepare::RenderContext<'_>,");
		expect(src).toContain('    ::sittir_core::prepare::Prepare::prepare(&mut transport, ctx)?;');
	});

	it('every transport carries base edges in its layout; a kind edge is prepared from its edge row and written through the sink', async () => {
		const src = await getTypescriptTransportRs();
		for (const name of ['ArgumentsTransport', 'StatementBlockTransport']) {
			const body = extractStructBody(src, name);
			expect(body).toContain('wire(key = "$_layout")');
			expect(body).toContain('pub layout: Option<TransportLayout>,');
			expect(src).toContain(`impl ::sittir_core::options::Edged for ${name} {`);
			const prepare = src.slice(src.indexOf(`impl ::sittir_core::prepare::Prepare for ${name} {`));
			expect(prepare.slice(0, prepare.indexOf('\n}\n'))).toContain('::sittir_core::prepare::prepare_edges(self, ctx);');
		}
		expect(src).not.toMatch(/pub (arguments|statement_block)_(before|after): Option<u16>,/);
		expect(src).not.toContain('self.statement_block_before.get_or_insert');
		const blockFn = src.slice(src.indexOf('fn render_statement_block('));
		expect(blockFn.slice(0, blockFn.indexOf('\n}\n'))).toMatch(
			/w\.edge\(::sittir_core::types::KindId\(\d+\), ::sittir_core::options::Side::Before, node\.layout\.edges\(\)\.before\);/
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
		const from = transportRs.indexOf('pub enum ExpressionTransport {');
		expect(from).toBeGreaterThan(-1);
		const body = transportRs.slice(from, transportRs.indexOf('\n}\n', from));
		expect(_rustKindEntries?.some((entry) => entry.kind === '_reserved_identifier')).toBe(false);
		expect(body).toContain('\n    #[kind(kind::DEFAULT_KEYWORD)]\n    DefaultKeyword,');
		expect(body).toContain('\n    #[transport(verbatim)]\n    Verbatim(VerbatimTransport),');
	});

	it('gives each source-adjacent list gap its source class before the list site and the seats fill it', async () => {
		const transportRs = await getRustTemplatesRs();
		const from = transportRs.indexOf('impl ::sittir_core::prepare::Prepare for ArgumentsElementsTransport {');
		expect(from).toBeGreaterThan(-1);
		const body = transportRs.slice(from, transportRs.indexOf('\n}\n', from));
		expect(body).toContain(
			'::sittir_core::prepare::fill_list_gaps(self.item.iter_mut().map(Some), ",", options::allowed(options::SITE_ARGUMENTS_ELEMENTS_ITEM_SEPARATOR_SPACE_BEFORE), options::allowed(options::SITE_ARGUMENTS_ELEMENTS_ITEM_SEPARATOR_SPACE_AFTER), &options::WHITESPACE, ctx);'
		);
		// The source class is set first: the list site and the seats fill only the gaps it left unset.
		expect(body.indexOf('fill_list_gaps')).toBeLessThan(body.indexOf('.get_or_insert(ctx.options.spacing['));
		expect(body.indexOf('fill_list_gaps')).toBeLessThan(body.indexOf('fill_seated_gaps'));
		expect(body).toContain('fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {');
		expect(transportRs).not.toContain('classify_list_gaps');
		expect(transportRs).not.toContain('leading_seam');
		expect(transportRs).not.toMatch(/let separated_\w+ = \{/);
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
			'transport_named',
			'transport_trivia_data',
			'edges',
			'source_gap',
			'source_flank'
		]) {
			expect(transportRs).not.toContain(`pub ${field}:`);
		}
		expect(transportRs).toContain('pub layout: Option<TransportLayout>');
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
		expect(transportRs).toContain('use ::sittir_core::VerbatimTransport;');
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

describe('transport read facts', () => {
	let model: Awaited<ReturnType<typeof modelFor>>;
	let ctx: ReadFactsCtx;
	beforeAll(async () => {
		model = await modelFor('rust');
		ctx = {
			nodeMap: model.nodeMap,
			kindEntries: model.kindEntries,
			names: readNames(model.kindEntries, generatedFieldIds(model.generatedIdTables)),
			listOwners: new Set(listViewOwners(model.nodeMap).map((node) => node.kind)),
			envelopeIds: new Set(aliasEnvelopeIds(aliasEnvelopesOf(model.nodeMap))),
			folds: model.generatedIdTables.folds ?? new Map(),
			grammar: 'rust'
		};
	}, 120_000);

	const node = (struct: string): AssembledNode => {
		const found = [...model.nodeMap.nodes.values()].find((n) => rustTransportStructName(n) === struct);
		if (found === undefined) throw new Error(`no kind emits ${struct}`);
		return found;
	};
	const ownId = (n: AssembledNode): number => findKindEntry(model.kindEntries, n.kind)!.id;
	const args = (struct: string): string => {
		const n = node(struct);
		return transportArgs(n, ownId(n), ctx, n.slots);
	};
	const slot = (struct: string, storageName: string) => node(struct).slots.find((s) => s.storageName === storageName)!;
	const shape = (s: AssembledNonterminal) => transportSlotShapeOf(s, model.nodeMap);

	it('lists the tokens a kind writes itself as its layout', () => {
		expect(args('FunctionItemTransport')).toBe('kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD, kind::DASH_GT]');
	});

	it('reads a layout token from its stamp and refuses one with none', () => {
		const n = node('UseBoundsTransport');
		expect(() => transportArgs(n, ownId(n), ctx, n.slots)).not.toThrow();
		const unstamped = { kind: 'use_bounds', lexedInterior: false, renderRule: { type: 'STRING', value: '<' } };
		expect(() => layoutTokenIds(unstamped as unknown as AbstractAssembledCompound, ctx, [])).toThrow(
			/'use_bounds' layout token "<" has no stamped kind id/
		);
	});

	it('gives a list owner its minimum depth, its tokens and its inner gap', () => {
		expect(args('ParametersTransport')).toBe(
			'kind = kind::PARAMETERS, min_depth = 2, layout = [kind::LPAREN, kind::RPAREN], gap(1) = elements'
		);
	});

	it('marks a separated list, its item slot, its separator and the flank it leaves optional', () => {
		const list = node('ParametersElementsTransport') as AssembledList;
		expect(args('ParametersElementsTransport')).toBe('kind = kind::PARAMETERS_ELEMENTS, list, item = item');
		expect(slotArgs(slot('ParametersElementsTransport', 'item'), list, shape(slot('ParametersElementsTransport', 'item')), ctx)).toBe('field = field::ITEM, separator = kind::COMMA');
		expect(flankArgs(list)).toBe('trailing = 0');
	});

	it('reads a token interior by its pattern and an envelope by its display id', () => {
		expect(args('IntegerLiteralDecimalTransport')).toBe(
			'kind = kind::INTEGER_LITERAL_DECIMAL, interior = "^(?<content>(?:[0-9][0-9_]*))(?<suffix>isize|usize|u128|i128|u16|i16|u32|i32|u64|i64|f32|f64|u8|i8)?$"'
		);
		expect(args('TypeIdentifierTransport')).toBe('kind = kind::_TYPE_IDENTIFIER, display, envelope, content = content');
	});

	it('reads a leaf as its text', () => {
		expect(args('IdentifierTransport')).toBe('kind = kind::IDENTIFIER, text');
	});

	it('reads as text exactly the kinds whose transport holds text', async () => {
		const src = await getRustTemplatesRs();
		const holdsText = new Map(
			[...src.matchAll(/^pub struct (\w+) \{\n([^}]*)^\}/gm)].map((m) => [m[1]!, /^    pub text: String,$/m.test(m[2]!)])
		);
		let structs = 0;
		for (const n of model.nodeMap.nodes.values()) {
			const holds = holdsText.get(rustTransportStructName(n));
			if (holds === undefined) continue;
			structs++;
			const reads = /^kind = [\w:]+, text\b/.test(transportArgs(n, ownId(n), ctx, n.slots));
			expect(reads, n.kind).toBe(holds);
		}
		expect(structs).toBeGreaterThan(0);
	});

	it('reads a keyword the spelled-leaf set holds as its kind id, not as text', async () => {
		const src = await getRustTemplatesRs();
		const mutable = model.nodeMap.nodes.get('mutable_specifier')!;
		expect(isTextLeaf(mutable) && mutable.modelType === 'keyword').toBe(true);
		expect(src).not.toMatch(/^pub struct MutableSpecifierTransport \{/m);
		expect(src).toMatch(/^pub enum MutableSpecifierTransport \{\n    #\[kind\(kind::MUTABLE_SPECIFIER\)\]\n    MutableSpecifier,\n\}/m);
	});

	it('routes a presence slot by its field and names its keyword', () => {
		expect(slotArgs(slot('LetDeclarationTransport', 'mutable'), node('LetDeclarationTransport'), shape(slot('LetDeclarationTransport', 'mutable')), ctx)).toBe(
			'field = field::MUTABLE, presence = kind::MUTABLE_SPECIFIER'
		);
	});

	it('reads an enum kind by its own id, and its own node by the member its tokens spell', () => {
		expect(enumKindArgs(ownId(node('PrimitiveTypeEnum')), ctx)).toBe('kind = kind::_PRIMITIVE_TYPE, spelled');
	});

	it('refuses two slots of one kind that take the same untagged kind', () => {
		expect(() =>
			assertOneUntaggedSlot('where_clause', [{ name: 'a', ids: [1, 7] }, { name: 'b', ids: [130, 1] }], model.kindEntries)
		).toThrow(/where_clause.*'a'.*'b'.*identifier \(kind 1\)/);
	});
});

describe('transport attributes', () => {
	it('derives the reader and states the read facts on a struct', async () => {
		const src = await getRustTemplatesRs();
		expect(src).toContain('use super::{field_ids as field, kind_ids as kind};');
		expect(src).toMatch(
			/#\[derive\(Debug, Clone, PartialEq, ::sittir_core::Transport\)\]\n#\[transport\(kind = kind::FUNCTION_ITEM, layout = \[kind::FN_KEYWORD, kind::DASH_GT\]\)\]\npub struct FunctionItemTransport \{/
		);
		expect(extractStructBody(src, 'FunctionItemTransport')).toMatch(/    #\[slot\(field = field::NAME\)\]\n    pub name: /);
		expect(extractStructBody(src, 'ParametersElementsTransport')).toMatch(/    #\[flank\(trailing = 0\)\]\n    pub delimiter: Option<u8>,/);
	});

	it("gives a choice's variants the ids today's decode claims for them", async () => {
		const src = await getRustTemplatesRs();
		const typeEnum = src.slice(src.indexOf('pub enum TypeTransport {'));
		expect(src).toMatch(/#\[transport\(choice\)\]\npub enum TypeTransport \{/);
		expect(typeEnum).toMatch(/    #\[kind\(kind::NEVER_TYPE[^\]]*\)\]\n    NeverType,/);
		expect(typeEnum).toMatch(/    #\[kind\(kind::_PRIMITIVE_TYPE[^\]]*kind::U8_KEYWORD[^\]]*\)\]\n    PrimitiveType\(PrimitiveTypeEnum\),/);
		expect(src).toMatch(/#\[transport\(kind = kind::_PRIMITIVE_TYPE, spelled\)\]\npub enum PrimitiveTypeEnum \{\n    #\[kind\(kind::U8_KEYWORD\)\]\n    U8,/);
	});

	it('marks the blank arm of a slot that has one', async () => {
		const src = await getTypescriptTransportRs();
		const terminator = src.slice(src.indexOf('pub enum StatementBlockTerminatorTransportSlot {'));
		expect(terminator).toMatch(/    #\[transport\(blank\)\]\n    Blank,/);
	});

	it('gives a blank arm only to the choices that blank options hold', async () => {
		const src = await getTypescriptTransportRs();
		const model = await modelFor('typescript');
		const blankOptions = [...model.nodeMap.nodes.values()]
			.flatMap((n) => (n instanceof AbstractAssembledCompound ? n.slots : []))
			.filter(hasBlankArm);
		const blankChoices = [...src.matchAll(/pub enum (\w+) \{[^}]*\n    #\[transport\(blank\)\]\n    Blank,/g)].map((m) => m[1]!);
		const heldByBlankChoices = [...src.matchAll(/pub \w+: Option<::sittir_core::SlotValue<(\w+)>>,/g)].filter((m) => blankChoices.includes(m[1]!));
		const blankIdArms = [...src.matchAll(/ 0 => Some\(Self::Blank\)/g)];
		expect(blankOptions).toHaveLength(9);
		expect(heldByBlankChoices).toHaveLength(blankOptions.length);
		expect(blankChoices).toHaveLength(4);
		expect(blankIdArms).toHaveLength(blankChoices.length);
	});
});

describe('a slot whose only scalar source is an enum of immediate tokens', () => {
	it('keeps its adjacency flag and the renderer writes it', async () => {
		const scm = await getTransportRsForGrammar('scm');
		expect(extractStructBody(scm, 'PredicateTransport')).toContain('pub type_: ::sittir_core::SlotValue<PredicateTypeEnum, true>,');
		expect(extractFnBody(scm, 'render_predicate_type')).toContain('w.adjacent();');
	}, 120_000);
});

describe('every string a kind writes is stamped', () => {
	const RENDER_ONLY: ReadonlySet<string> = new Set([INDENT_TEXT, DEDENT_TEXT]);
	const unstampedStrings = (rule: unknown, found: Set<string> = new Set()): Set<string> => {
		const r = rule as { type?: string; value?: string; aliasedToId?: number; resolvedKindId?: number; members?: unknown[]; content?: unknown };
		if (r.type === 'STRING' && r.value !== undefined && r.aliasedToId === undefined && r.resolvedKindId === undefined) found.add(r.value);
		for (const member of r.members ?? []) unstampedStrings(member, found);
		if (r.content !== undefined) unstampedStrings(r.content, found);
		return found;
	};

	for (const grammar of ['rust', 'typescript', 'scm'] as const) {
		it(`${grammar}: no compound's render rule holds an unstamped string`, async () => {
			const { nodeMap } = await modelFor(grammar);
			const compounds: AbstractAssembledCompound[] = [];
			for (const node of nodeMap.nodes.values()) if (node instanceof AbstractAssembledCompound && !node.lexedInterior) compounds.push(node);
			const unstamped = compounds.flatMap((node) => [...unstampedStrings(node.renderRule)].filter((text) => !RENDER_ONLY.has(text)).map((text) => `${node.kind} ${JSON.stringify(text)}`));
			expect(unstamped).toEqual([]);
		}, 120_000);
	}
});

describe('the wire codec facts', () => {
	it('keys every field and prints no napi codec of its own', async () => {
		const src = await getRustTemplatesRs();
		for (const gone of ['napi(object)', 'FromNapiValue', 'ToNapiValue', 'debug-transport', 'decodes as none of its members', 'pub struct VerbatimTransport']) {
			expect(src).not.toContain(gone);
		}
		expect(src).toContain('use ::sittir_core::VerbatimTransport;');
		const item = extractStructBody(src, 'FunctionItemTransport');
		expect(item).toMatch(/    #\[wire\(key = "\$_layout"\)\]\n    pub layout: Option<TransportLayout>,/);
		expect(item).toMatch(/    #\[wire\(key = "_name"\)\]\n    #\[slot\(field = field::NAME\)\]\n    pub name: /);
		expect(extractStructBody(src, 'IdentifierTransport')).toMatch(/    #\[wire\(key = "\$text"\)\]\n    pub text: String,/);
	});

	it('marks the verbatim arm of a choice that takes bare text, and only there', async () => {
		const src = await getRustTemplatesRs();
		expect(src).toMatch(/    #\[transport\(verbatim\)\]\n    Verbatim\(VerbatimTransport\),/);
		const any = src.slice(src.indexOf('pub enum AnyTransport {'));
		const anyBody = any.slice(0, any.indexOf('\n}'));
		expect(anyBody).toMatch(/\n    Verbatim\(VerbatimTransport\),/);
		expect(anyBody).not.toContain('#[transport(verbatim)]');
	});

	it("states an envelope's wire ids", async () => {
		const src = await getTypescriptTransportRs();
		const member = src.slice(src.indexOf('pub enum MemberExpressionPropertyTransportSlot {'));
		expect(member).toMatch(/    #\[kind\(kind::_PROPERTY_IDENTIFIER, display, decodes\(kind::\w+(?:, kind::\w+){21}\)\)\]\n    PropertyIdentifier\(/);
	});

	it('derives the codec alone for trivia', async () => {
		const src = await getRustTemplatesRs();
		expect(src).toMatch(/#\[derive\(Debug, Clone, PartialEq, ::sittir_core::Transport\)\]\n#\[transport\(choice, codec_only\)\]\npub enum TriviaTransport \{/);
		expect(src).toMatch(/    #\[transport\(text\)\]\n    #\[kind\([^\n]*\)\]\n    Text\(::sittir_core::trivia::TriviaText\),/);
		expect(src).toMatch(/    #\[transport\(verbatim\)\]\n    Verbatim\(VerbatimTransport\),\n    #\[transport\(text\)\]/);
	});
});

describe('the payload ceiling', () => {
	it('boxes each pinned payload in every choice the reader reads, and nowhere unboxed', async () => {
		const src = await getRustTemplatesRs();
		expect(BOXED_PAYLOADS.rust!.length).toBeGreaterThan(0);
		for (const name of BOXED_PAYLOADS.rust!) {
			expect(src).toMatch(new RegExp(`\\n    \\w+\\(Box<${name}>\\),`));
			expect(src.replace(/\npub enum TriviaTransport \{[^}]*\}/, '')).not.toMatch(new RegExp(`\\n    \\w+\\(${name}\\),`));
		}
	});

	it('asserts every payload against the ceiling, each one way', async () => {
		const src = await getRustTemplatesRs();
		const assertions = [...src.matchAll(/^const _: \(\) = assert!\(::core::mem::size_of::<(\w+)>\(\) (<=|>) (\d+), "/gm)];
		const over = assertions.filter((m) => m[2] === '>').map((m) => m[1]).sort();
		expect(over).toEqual([...BOXED_PAYLOADS.rust!].sort());
		expect(assertions.every((m) => Number(m[3]) === PAYLOAD_CEILING_BYTES)).toBe(true);
		expect(new Set(assertions.map((m) => m[1])).size).toBe(assertions.length);
	});

	it('refuses a pin no choice holds', () => {
		const [stale] = BOXED_PAYLOADS.rust!;
		expect(() => payloadCeilingAssertions(BOXED_PAYLOADS.rust!, new Set())).toThrow(`${stale} is pinned in boxed-payloads.ts but no choice holds it`);
	});
});
