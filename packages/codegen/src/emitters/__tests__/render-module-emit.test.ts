/**
 * render-module-emit.test.ts — unit tests for Phase 1 typed node emission.
 *
 * Tests cover:
 * - `classifySlot` / `buildSupertypeNodeSet` exported helpers
 * - Phase 1: single-concrete-kind field and children slots emit typed Rust types
 * - Phase 1: render functions call typed `render_<kind>`, not `render_node_dispatch`
 *
 * These tests use the REAL rust grammar pipeline (evaluate → link → normalize → assemble →
 * emitRenderModule) so they exercise the full codegen path including the emitter.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { DEDENT_TEXT, INDENT_TEXT } from '../../dsl/primitives/spacing.ts';
import { classifySlot, buildSupertypeNodeSet, type SlotClass } from '../node-common.ts';
import { emitRenderModule, grammarRenderInputs, payloadCeilingAssertions, rustNodeStructName, nodeSlotShapeOf } from '../render-module.ts';
import { PAYLOAD_CEILING_BYTES } from '../boxed-payloads.ts';
import { ENVELOPE_PINS } from '../envelope-claims.ts';
import { collectCatalogKinds, collectKindEntries, findKindEntry } from '../kind-discriminant.ts';
import { resolveRenderRules, seamRenderRules, spaceRenderRules, whitespaceTextOf } from '../../compiler/model/render-rules.ts';
import { collectSitePreferences } from '../../compiler/model/site-preferences.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { runTemplateEmitter, stampStaticSpacing } from '../templates.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { evaluatePackage } from '../../dsl/evaluate-package.ts';
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
	nodeArgs,
	type ReadFactsCtx
} from '../node-projection.ts';


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
// buildSupertypeNodeSet — exported helper
// ---------------------------------------------------------------------------

describe('buildSupertypeNodeSet', () => {
	it('returns empty map when no supertype nodes exist', () => {
		const nodeMap = {
			name: 'test',
			nodes: new Map(),
			signatures: { signatures: new Map() },
			rules: {},
			externals: [],
			word: undefined
		} as unknown as NodeMap;
		const result = buildSupertypeNodeSet(nodeMap);
		expect(result.size).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Phase 1 — single-concrete-kind field slots in the real rust grammar
// ---------------------------------------------------------------------------

/** Cache for the rust emitRenderModule output. */
let _rustTemplatesRs: string | undefined;
let _typescriptNodeRs: string | undefined;
/** The rust kind entries the cached emit was produced from. */
let _rustKindEntries: ReturnType<typeof collectKindEntries> | undefined;
/** The rust `options.rs` the cached emit produced beside its nodes. */
let _rustOptionsRs: string | undefined;

const _models = new Map<string, ReturnType<typeof buildModel>>();

async function buildModel(grammar: 'rust' | 'typescript' | 'scm' | 'python') {
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
	const prepass = spaceRenderRules(rulesConfig);
	stampStaticSpacing(nodeMap, grammar, prepass);
	collectSitePreferences({ nodeMap, kindEntries, renderRules: seamRenderRules(prepass, rulesConfig), options: raw.options });
	const renderRules = resolveRenderRules(rulesConfig, (spaced) => stampStaticSpacing(nodeMap, grammar, spaced)).seamed;
	const templates = runTemplateEmitter({ grammar, nodeMap, renderRules });
	return { raw, nodeMap, kindEntries, generatedIdTables, templates, renderRules };
}

function modelFor(grammar: 'rust' | 'typescript' | 'scm' | 'python') {
	const cached = _models.get(grammar);
	if (cached !== undefined) return cached;
	const built = buildModel(grammar);
	_models.set(grammar, built);
	return built;
}

async function getNodeRsForGrammar(grammar: 'rust' | 'typescript' | 'scm' | 'python'): Promise<string> {
	const { raw, nodeMap, kindEntries, generatedIdTables, templates, renderRules } = await modelFor(grammar);
	if (grammar === 'rust') _rustKindEntries = kindEntries;
	const emit = emitRenderModule(
		grammar,
		templates,
		nodeMap,
		generatedIdTables,
		{ ...grammarRenderInputs(grammar, { renderRules, visibleExternals: raw.visibleExternals, options: raw.options }), envelopePins: undefined }
	);
	if (grammar === 'rust') _rustOptionsRs = emit.optionsRs.contents;
	return emit.nodeRs.contents;
}

async function getRustOptionsRs(): Promise<string> {
	await getRustTemplatesRs();
	return _rustOptionsRs!;
}

async function getRustTemplatesRs(): Promise<string> {
	if (_rustTemplatesRs !== undefined) return _rustTemplatesRs;
	_rustTemplatesRs = await getNodeRsForGrammar('rust');
	return _rustTemplatesRs;
}

async function getTypescriptNodeRs(): Promise<string> {
	if (_typescriptNodeRs !== undefined) return _typescriptNodeRs;
	_typescriptNodeRs = await getNodeRsForGrammar('typescript');
	return _typescriptNodeRs;
}

beforeAll(() => Promise.all([getRustTemplatesRs(), getTypescriptNodeRs()]), 120_000);

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
	it('const_item.name is IdentifierNode (single-kind concrete field)', async () => {
		const src = await getRustTemplatesRs();
		const structBody = extractStructBody(src, 'ConstItemNode');
		expect(structBody).not.toBe('');
		// name field has kinds: ["identifier"] — single kind → concrete
		expect(structBody).toMatch(/pub name: ::sittir_core::SlotValue<IdentifierNode>,/);
	});

	it('const_item.name field is NOT Box<AnyNode>', async () => {
		const src = await getRustTemplatesRs();
		const structBody = extractStructBody(src, 'ConstItemNode');
		// The `name` field line should not use Box<AnyNode>
		const nameLine = structBody.split('\n').find((l) => l.trim().startsWith('pub name:'));
		expect(nameLine).not.toContain('Box<AnyNode>');
	});

	it('function_item.body is BlockNode (single-kind concrete field)', async () => {
		const src = await getRustTemplatesRs();
		const structBody = extractStructBody(src, 'FunctionItemNode');
		expect(structBody).not.toBe('');
		// body field has kinds: ["block"] — single kind → concrete
		expect(structBody).toMatch(/pub body: ::sittir_core::SlotValue<BlockNode>,/);
	});

	it('function_item.name is FunctionItemNameNodeSlot (proper subset of _path stays heterogeneous, not collapsed)', async () => {
		const src = await getRustTemplatesRs();
		const structBody = extractStructBody(src, 'FunctionItemNode');
		// name field has kinds: ["identifier", "metavariable"] — both are subtypes
		// of rust's _path supertype, but _path's full resolved subtype set has
		// 7 members (self, identifier, metavariable, super, crate,
		// scoped_identifier, _reserved_identifier). classifySlot only collapses
		// a slot onto the supertype type when the slot's kind set EXACTLY
		// equals the supertype's full subtype set — a deliberate safety rule
		// (node-common.ts:58-67): a looser subset-collapse risked
		// FromNapiValue recursing through a wide/self-recursive supertype and
		// overflowing the native stack. A proper-subset slot like this one
		// falls to `heterogeneous` instead, emitting a per-slot enum of
		// exactly its own kinds.
		const nameLine = structBody.split('\n').find((l) => l.trim().startsWith('pub name:'));
		expect(nameLine).toContain('FunctionItemNameNodeSlot');
		expect(src).toContain('pub enum FunctionItemNameNodeSlot {');
		expect(src).toContain('Identifier(IdentifierNode),');
		expect(src).toContain('Metavariable(MetavariableNode),');
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

	it('a leaf node crosses its text under `$text`', async () => {
		const src = await getTypescriptNodeRs();
		expect(extractStructBody(src, 'IdentifierNode')).toMatch(/    #\[wire\(key = "\$text"\)\]\n    pub text: String,/);
	});

	it('a presence slot holding a keyword kind crosses as a boolean and renders the kind', async () => {
		const src = await getRustTemplatesRs();
		expect(extractStructBody(src, 'ReferenceTypeNode')).toContain('pub exclusive: bool,');
		expect(extractFnBody(src, 'render_reference_type')).toContain(
			'let exclusive = View::new(::sittir_core::view::Presence::new(node.exclusive, MutableSpecifierNode::MutableSpecifier), "{}");'
		);
		expect(src).not.toContain('::napi::ValueType::Boolean');
	});

	it('a fixed-text kind decodes its numeric kind id into its unit, which writes the kind text', async () => {
		const src = await getTypescriptNodeRs();
		expect(src).toContain('#[node(choice)]\npub enum PlusNode {\n    #[kind(kind::PLUS)]\n    Plus,\n}');
		expect(src).toMatch(
			/fn render_plus\(w: &mut dyn ::sittir_core::render::RenderSink\) -> ::sittir_core::render::RenderResult \{\n    NodeLayout::render\(None, Some\(::sittir_core::types::KindId\(\d+\)\), ::sittir_core::layout::TriviaRole::Token, w, \|w\| w\.text\("\+"\)\)/
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
	const node = await getRustTemplatesRs();
	expect(node).toContain('pub enum FunctionTypeContentNodeSlot {');
	expect(node).toMatch(/FunctionTypeContentNodeSlot::FunctionTypeFnForm\(inner\) => inner(?:\.as_ref\(\))?\.render\(w\),/);
	expect(node).toMatch(/FunctionTypeContentNodeSlot::FunctionTypeTraitForm\(inner\) => inner(?:\.as_ref\(\))?\.render\(w\),/);
});

describe('render options on nodes', () => {
	it('a separated-list node carries its own spacing and flank fields, named by the site key', async () => {
		const src = await getTypescriptNodeRs();
		const body = extractStructBody(src, 'FormalParametersElementsNode');
		expect(body).toContain('wire(key = "_item_separator_space_before")');
		expect(body).toContain('pub item_separator_space_before: Option<KindId>,');
		expect(body).toContain('wire(key = "_item_separator_space_after")');
		expect(body).toContain('pub item_separator_space_after: Option<KindId>,');
		expect(body).toContain('pub delimiter: Option<::sittir_core::types::Delimiter>,');
		expect(src).not.toContain('ListSpacing');
	});

	it('a list fills its own fields from its own site indices; its owner only recurses', async () => {
		const src = await getTypescriptNodeRs();
		const listImpl = src.slice(
			src.indexOf('impl ::sittir_core::prepare::Prepare for FormalParametersElementsNode {')
		);
		const listFill = listImpl.slice(0, listImpl.indexOf('\n}\n'));
		expect(listFill).toContain(
			'self.item_separator_space_before.get_or_insert(ctx.options.site_arm(options::SITE_FORMAL_PARAMETERS_ELEMENTS_ITEM_SEPARATOR_SPACE_BEFORE).arm);'
		);
		expect(listFill).toContain(
			'self.item_separator_space_after.get_or_insert(ctx.options.site_arm(options::SITE_FORMAL_PARAMETERS_ELEMENTS_ITEM_SEPARATOR_SPACE_AFTER).arm);'
		);
		expect(listFill).toMatch(
			/self\.delimiter\.get_or_insert\(::sittir_core::prepare::source_trailing_delimiter\(self\.layout\.as_deref\(\), ::sittir_core::types::KindId\(\d+\), &\[::sittir_core::types::KindId\(\d+\)\], ctx\.options\.delimiter_at\(options::DELIM_FORMAL_PARAMETERS_ELEMENTS_ITEM\), ctx\)\);/
		);
		const ownerImpl = src.slice(src.indexOf('impl ::sittir_core::prepare::Prepare for FormalParametersNode {'));
		const ownerFill = ownerImpl.slice(0, ownerImpl.indexOf('\n}\n'));
		expect(ownerFill).toContain('self.elements.prepare(ctx)?;');
		expect(ownerFill).not.toContain('SEPARATOR_SPACE');
		expect(ownerFill).not.toContain('lparen_after');
	});

	it('the list view is built from the node fields and never from a separator literal', async () => {
		const src = await getTypescriptNodeRs();
		const fn = src.slice(src.indexOf('fn render_formal_parameters_elements('));
		const view = fn.slice(0, fn.indexOf('\n}\n'));
		expect(view).toContain('before: node.item_separator_space_before.unwrap_or(KindId::BLANK),');
		expect(view).toContain('after: node.item_separator_space_after.unwrap_or(KindId::BLANK),');
		expect(view).toMatch(/token: (match node\.separator_kind \{|",",)/);
		expect(src).not.toMatch(/ListView \{[^}]*\bseparator: /);
	});

	it('a token seam has no node field and is written from the resolved options at its site', async () => {
		const src = await getTypescriptNodeRs();
		const body = extractStructBody(src, 'ArgumentsNode');
		expect(body).not.toContain('wire(key = "_lparen_after")');
		expect(body).not.toContain('pub lparen_after: Option<KindId>,');
		expect(body).not.toMatch(/pub \w+_(start|end): Option<KindId>,/);
		const fillImpl = src.slice(src.indexOf('impl ::sittir_core::prepare::Prepare for ArgumentsNode {'));
		expect(fillImpl.slice(0, fillImpl.indexOf('\n}\n'))).not.toContain('lparen_after');
		const fn = src.slice(src.indexOf('fn render_arguments('));
		const render = fn.slice(0, fn.indexOf('\n}\n'));
		expect(render).toMatch(
			/w\.edge\(::sittir_core::types::KindId\(\d+\), ::sittir_core::options::Side::Before, node\.layout\.edges\(\)\.before\);\s*\n\s*w\.text\("\("\)\?;\s*\n\s*w\.site_at\(options::SITE_ARGUMENTS_LPAREN_AFTER\);/
		);
		expect(src).toContain('    w.finish()?;');
		const binary = extractStructBody(src, 'BinaryExpressionNode');
		expect(binary).not.toContain('pub operator_before: Option<KindId>,');
		expect(binary).not.toContain('pub operator_after: Option<KindId>,');
		expect(src).not.toContain('pub struct Seamed<T>');
		expect(src).not.toContain('LiteralSeams');
		expect(src).not.toContain('ArmSeams');
		expect(src).not.toContain('options::site_strength(');
		expect(src).toMatch(/head: (Some\(options::SITE_\w+\)|None),/);
	});

	it('a literal arm of a per-slot child enum writes its owner-kind seam sites around the literal from the resolved options', async () => {
		const src = await getTypescriptNodeRs();
		const enumSrc = src.slice(src.indexOf('pub enum LexicalDeclarationTerminatorNodeSlot {'));
		expect(enumSrc.slice(0, enumSrc.indexOf('\n}\n'))).toMatch(/^    Semi,$/m);
		const render = src.slice(
			src.indexOf('impl ::sittir_core::render::Render for LexicalDeclarationTerminatorNodeSlot {')
		);
		expect(render.slice(0, render.indexOf('\n}\n'))).toMatch(
			/Semi => \{\s*w\.site_at\(options::SITE_LEXICAL_DECLARATION_SEMI_BEFORE\);\s*let written = render_semi\(w\);/
		);
	});

	it('the render entry prepares the tree through the context before dispatch', async () => {
		const src = await getTypescriptNodeRs();
		expect(src).toContain('pub fn render_node_parts(');
		expect(src).toContain("    ctx: &::sittir_core::prepare::RenderContext<'_>,");
		expect(src).toContain('    ::sittir_core::prepare::Prepare::prepare(&mut node, ctx)?;');
	});

	it('every node carries base edges in its layout; a kind edge is prepared from its edge row and written through the sink', async () => {
		const src = await getTypescriptNodeRs();
		for (const name of ['ArgumentsNode', 'StatementBlockNode']) {
			const body = extractStructBody(src, name);
			expect(body).toContain('wire(key = "$_layout")');
			expect(body).toContain('pub layout: Option<Box<NodeLayout>>,');
			expect(src).toContain(`impl ::sittir_core::options::Edged for ${name} {`);
			const prepare = src.slice(src.indexOf(`impl ::sittir_core::prepare::Prepare for ${name} {`));
			expect(prepare.slice(0, prepare.indexOf('\n}\n'))).toContain('::sittir_core::prepare::prepare_edges(self, ctx);');
		}
		expect(src).not.toMatch(/pub (arguments|statement_block)_(before|after): Option<KindId>,/);
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
	it('reads a keyword the grammar aliases to its word rule as the word rule', async () => {
		// rust aliases the `default` keyword to `identifier`: the expression slot
		// holds no keyword arm for it, and the identifier arm folds its token in.
		const nodeRs = await getRustTemplatesRs();
		const from = nodeRs.indexOf('pub enum ExpressionNode {');
		expect(from).toBeGreaterThan(-1);
		const body = nodeRs.slice(from, nodeRs.indexOf('\n}\n', from));
		expect(_rustKindEntries?.some((entry) => entry.kind === '_reserved_identifier')).toBe(false);
		expect(body).not.toContain('\n    DefaultKeyword,');
		expect(body).toContain('folded(kind::DEFAULT_KEYWORD)');
		expect(body).toContain('\n    #[node(verbatim)]\n    Verbatim(VerbatimNode),');
	});

	it("gives a list slot's gaps its stored layout before the list site and the seats fill them", async () => {
		const nodeRs = await getRustTemplatesRs();
		const from = nodeRs.indexOf('impl ::sittir_core::prepare::Prepare for ArgumentsElementsNode {');
		expect(from).toBeGreaterThan(-1);
		const body = nodeRs.slice(from, nodeRs.indexOf('\n}\n', from));
		expect(body).toContain(
			'::sittir_core::prepare::fill_slot_gaps(self.item.iter_mut().map(Some), ::sittir_core::layout::Layout::slot(&self.layout, "_item"));'
		);
		// The stored layout is set first: the list site and the seats fill only the gaps it left unset.
		expect(body.indexOf('fill_slot_gaps')).toBeLessThan(body.indexOf('.get_or_insert(ctx.options.site_arm('));
		expect(body.indexOf('fill_slot_gaps')).toBeLessThan(body.indexOf('fill_seated_gaps'));
		expect(nodeRs).not.toContain('fill_list_gaps');
		expect(nodeRs).not.toContain('fn source_gap(');
		expect(nodeRs).not.toContain('classify_list_gaps');
		expect(nodeRs).not.toContain('leading_seam');
		expect(nodeRs).not.toMatch(/let separated_\w+ = \{/);
	});
	it('renders through the typed sink and writes no mark character', async () => {
		const nodeRs = await getRustTemplatesRs();
		expect(nodeRs).not.toContain('impl ::std::fmt::Display for');
		expect(nodeRs).not.toMatch(/[\u{FFFE}\u{FDD0}-\u{FDD3}]/u);
		expect(nodeRs).not.toContain('mark_adjacent');
		expect(nodeRs).toContain('impl ::sittir_core::render::Render for FunctionItemNode {');
		expect(nodeRs).toContain(
			'fn render_function_item(node: &FunctionItemNode, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {'
		);
		expect(nodeRs).toContain(
			"pub fn render_node_dispatch(node: &RenderRoot, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<String, ::sittir_core::render::RenderError> {"
		);
		expect(nodeRs).toContain(
			'::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER).with_table(&options::WHITESPACE).with_indent(&ctx.options.indent).with_sources(ctx.sources)'
		);
	});

	it('carries every slot as Coord or Node and never a bare string', async () => {
		const nodeRs = await getRustTemplatesRs();
		expect(nodeRs).not.toContain('SlotValue::Verbatim(');
		expect(nodeRs).toContain('SlotValue::Node(');
	});

	it('declares no inert metadata on nodes', async () => {
		const nodeRs = await getRustTemplatesRs();
		for (const field of [
			'node_span',
			'node_node_handle',
			'node_child_index',
			'node_source',
			'node_named',
			'node_trivia_data',
			'edges',
			'source_gap',
			'source_flank'
		]) {
			expect(nodeRs).not.toContain(`pub ${field}:`);
		}
		expect(nodeRs).toContain('pub layout: Option<Box<NodeLayout>>');
		expect(nodeRs).not.toContain('pub node_text: Option<String>');
	});

	it('reads a depth token off its kind and not off a sentinel default', async () => {
		const nodeRs = await getRustTemplatesRs();
		expect(nodeRs).not.toMatch(/[\u{FFFE}\u{FDD0}-\u{FDD3}]/u);
		expect(nodeRs).toContain('{ w.dedent(::sittir_core::layout_kinds::LayoutKinds::NEWLINE); Ok::<(), ::sittir_core::render::RenderError>(()) }');
	});

	it('prepares every node through the render context and renders with its sources', async () => {
		const nodeRs = await getRustTemplatesRs();
		expect(nodeRs).not.toContain('FillOptions');
		expect(nodeRs).toContain('impl ::sittir_core::prepare::Prepare for FunctionItemNode {');
		expect(nodeRs).toContain(
			"fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {"
		);
		expect(nodeRs).toContain('.get_or_insert(ctx.options.site_arm(options::');
		expect(nodeRs).toContain(
			"pub fn render_node_dispatch(node: &RenderRoot, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<String, ::sittir_core::render::RenderError> {"
		);
		expect(nodeRs).toContain(
			'::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER).with_table(&options::WHITESPACE).with_indent(&ctx.options.indent).with_sources(ctx.sources).with_options(ctx.options)'
		);
		expect(nodeRs).toContain('let document = ::sittir_core::view::KindTest::kind_in(node, &w, kind::ROOT_KINDS);');
	});

	it('admits verbatim text only where a slot admits a pattern kind', async () => {
		const nodeRs = await getRustTemplatesRs();
		expect(nodeRs).toContain('use ::sittir_core::VerbatimNode;');
		// FunctionItem.name admits identifier and metavariable, both pattern-modeled.
		expect(nodeRs).toMatch(/pub enum FunctionItemNameNodeSlot \{[^}]*Verbatim\(VerbatimNode\),/s);
		// EnumVariant.body admits two field lists and no pattern kind.
		expect(nodeRs).toMatch(/pub enum EnumVariantBodyNodeSlot \{(?:(?!Verbatim)[^}])*\}/s);
	});

	it('seats a wrapper through a SeatPath: its unfielded content, or the child its field tags', async () => {
		const optionsRs = await getRustOptionsRs();
		const table = optionsRs.slice(optionsRs.indexOf('pub static SEAT_WRAPPERS: &[Option<SeatPath>] = &['));
		const cells = table
			.slice(table.indexOf('\n') + 1, table.indexOf('];'))
			.split(',')
			.map((c) => c.trim())
			.filter(Boolean);
		expect(cells).toContain('Some(SeatPath::Content)');
		expect(cells.some((c) => /^Some\(SeatPath::Field\(FieldId\([1-9]\d*\)\)\)$/.test(c))).toBe(true);
		expect(cells.every((c) => c === 'None' || c === 'Some(SeatPath::Content)' || /^Some\(SeatPath::Field\(FieldId\([1-9]\d*\)\)\)$/.test(c))).toBe(true);
	});

	it('fills seated sibling gaps through one dense per-slot kind table and a core call; no per-list match block', async () => {
		const nodeRs = await getRustTemplatesRs();
		const optionsRs = await getRustOptionsRs();
		const table = optionsRs.slice(optionsRs.indexOf('pub static SEATS_SOURCE_FILE_STATEMENTS: &[Option<SiteId>] = &['));
		const cells = table
			.slice(table.indexOf('\n') + 1, table.indexOf('];'))
			.split(',')
			.map((c) => c.trim())
			.filter(Boolean);
		expect(cells.filter((c) => c !== 'None').length).toBeGreaterThan(0);
		expect(cells.every((c) => c === 'None' || /^Some\(SiteId\(\d+\)\)$/.test(c))).toBe(true);
		expect(nodeRs).toContain(
			'::sittir_core::prepare::fill_seated_gaps(self.statements.iter_mut().map(Some), options::SEATS_SOURCE_FILE_STATEMENTS, ctx);'
		);
		expect(nodeRs).not.toContain('let seated_last');
		expect(nodeRs).not.toContain('edges_mut().after.get_or_insert');
		expect(nodeRs).toContain('impl ::sittir_core::prepare::SeatTarget for AttributeItemNode {');
		expect(nodeRs).toContain('::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(');
	});

	it('binds a list view over site ids and writes a seam site as a call', async () => {
		const nodeRs = await getRustTemplatesRs();
		const block = nodeRs.slice(
			nodeRs.indexOf('fn render_block('),
			nodeRs.indexOf('fn render_block(') + 2000
		);
		expect(block).toMatch(/after: node\.statements_separator_space\.unwrap_or\(KindId::BLANK\),/);
		expect(block).toMatch(/w\.site_at\(options::SITE_\w+_LBRACE_AFTER\);/);
		expect(block).toContain('w.text("{")?;');
		expect(block).toContain('statements.render(w)?;');
	});
});

describe('node read facts', () => {
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
		const found = [...model.nodeMap.nodes.values()].find((n) => rustNodeStructName(n) === struct);
		if (found === undefined) throw new Error(`no kind emits ${struct}`);
		return found;
	};
	const ownId = (n: AssembledNode): number => findKindEntry(model.kindEntries, n.kind)!.id;
	const args = (struct: string): string => {
		const n = node(struct);
		return nodeArgs(n, ownId(n), ctx, n.slots);
	};
	const slot = (struct: string, storageName: string) => node(struct).slots.find((s) => s.storageName === storageName)!;
	const shape = (s: AssembledNonterminal) => nodeSlotShapeOf(s, model.nodeMap);

	it('lists the tokens a kind writes itself as its layout', () => {
		expect(args('FunctionItemNode')).toBe('kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD, kind::DASH_GT]');
	});

	it('reads a layout token from its stamp and refuses one with none', () => {
		const n = node('UseBoundsNode');
		expect(() => nodeArgs(n, ownId(n), ctx, n.slots)).not.toThrow();
		const unstamped = { kind: 'use_bounds', lexedInterior: false, renderRule: { type: 'STRING', value: '<' } };
		expect(() => layoutTokenIds(unstamped as unknown as AbstractAssembledCompound, ctx, [])).toThrow(
			/'use_bounds' layout token "<" has no stamped kind id/
		);
	});

	it('gives a parameter branch its tokens and no list forwarding depth or named inner gap', () => {
		expect(args('ParametersNode')).toBe('kind = kind::PARAMETERS, layout = [kind::LPAREN, kind::RPAREN]');
	});

	it('selects list reading from its item slot and preserves its separator and optional flank', () => {
		const list = node('ParametersElementsNode') as AssembledList;
		expect(args('ParametersElementsNode')).toBe('kind = kind::PARAMETERS_ELEMENTS, item = item');
		expect(slotArgs(slot('ParametersElementsNode', 'item'), list, shape(slot('ParametersElementsNode', 'item')), ctx)).toBe('field = field::ITEM, separator = kind::COMMA');
		expect(flankArgs(list)).toBe('trailing = 0');
	});

	it('reads a token interior by its pattern and selects envelope reading from its content slot', () => {
		expect(args('IntegerLiteralDecimalNode')).toBe(
			'kind = kind::INTEGER_LITERAL_DECIMAL, interior = "^(?<content>(?:[0-9][0-9_]*))(?<suffix>isize|usize|u128|i128|u16|i16|u32|i32|u64|i64|f32|f64|u8|i8)?$"'
		);
		expect(args('TypeIdentifierNode')).toBe('kind = kind::_TYPE_IDENTIFIER, display, content = content');
	});

	it('reads a leaf as its text', () => {
		expect(args('IdentifierNode')).toBe('kind = kind::IDENTIFIER, text');
	});

	it('reads as text exactly the kinds whose node holds text', async () => {
		const src = await getRustTemplatesRs();
		const holdsText = new Map(
			[...src.matchAll(/^pub struct (\w+) \{\n([^}]*)^\}/gm)].map((m) => [m[1]!, /^    pub text: String,$/m.test(m[2]!)])
		);
		let structs = 0;
		for (const n of model.nodeMap.nodes.values()) {
			const holds = holdsText.get(rustNodeStructName(n));
			if (holds === undefined) continue;
			structs++;
			const reads = /^kind = [\w:]+, text\b/.test(nodeArgs(n, ownId(n), ctx, n.slots));
			expect(reads, n.kind).toBe(holds);
		}
		expect(structs).toBeGreaterThan(0);
	});

	it('reads a keyword the spelled-leaf set holds as its kind id, not as text', async () => {
		const src = await getRustTemplatesRs();
		const mutable = model.nodeMap.nodes.get('mutable_specifier')!;
		expect(isTextLeaf(mutable) && mutable.modelType === 'keyword').toBe(true);
		expect(src).not.toMatch(/^pub struct MutableSpecifierNode \{/m);
		expect(src).toMatch(/^pub enum MutableSpecifierNode \{\n    #\[kind\(kind::MUTABLE_SPECIFIER\)\]\n    MutableSpecifier,\n\}/m);
	});

	it('routes a presence slot by its field and names its keyword', () => {
		expect(slotArgs(slot('LetDeclarationNode', 'mutable'), node('LetDeclarationNode'), shape(slot('LetDeclarationNode', 'mutable')), ctx)).toBe(
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

describe('node read facts for an aliased presence keyword', () => {
	let model: Awaited<ReturnType<typeof modelFor>>;
	let ctx: ReadFactsCtx;
	beforeAll(async () => {
		model = await modelFor('typescript');
		ctx = {
			nodeMap: model.nodeMap,
			kindEntries: model.kindEntries,
			names: readNames(model.kindEntries, generatedFieldIds(model.generatedIdTables)),
			listOwners: new Set(listViewOwners(model.nodeMap).map((node) => node.kind)),
			envelopeIds: new Set(aliasEnvelopeIds(aliasEnvelopesOf(model.nodeMap))),
			folds: model.generatedIdTables.folds ?? new Map(),
			grammar: 'typescript'
		};
	}, 120_000);

	const presenceArgs = (struct: string, storageName: string): string => {
		const owner = [...model.nodeMap.nodes.values()].find((n) => rustNodeStructName(n) === struct);
		if (owner === undefined) throw new Error(`no kind emits ${struct}`);
		const s = owner.slots.find((each) => each.storageName === storageName)!;
		return slotArgs(s, owner, nodeSlotShapeOf(s, model.nodeMap), ctx);
	};

	it('reads a keyword the site aliases by the display id the alias shows', () => {
		expect(presenceArgs('TypeQuerySubscriptExpressionNode', 'optional_chain')).toMatch(/presence = display\(kind::_OPTIONAL_CHAIN_MARKER\)$/);
	});

	it('reads the same keyword slot over an unaliased kind by its grammar id', () => {
		expect(presenceArgs('SubscriptExpressionNode', 'optional_chain')).toMatch(/presence = kind::OPTIONAL_CHAIN$/);
	});
});

describe('node attributes', () => {
	it('derives the reader and states the read facts on a struct', async () => {
		const src = await getRustTemplatesRs();
		expect(src).toContain('use super::{field_ids as field, kind_ids as kind};');
		expect(src).toMatch(
			/#\[derive\(Debug, Clone, PartialEq, ::sittir_core::Node\)\]\n#\[node\(kind = kind::FUNCTION_ITEM, layout = \[kind::FN_KEYWORD, kind::DASH_GT\], words = 42\)\]\npub struct FunctionItemNode \{/
		);
		expect(extractStructBody(src, 'FunctionItemNode')).toMatch(/    #\[slot\(field = field::NAME, word = 12, width = 5\)\]\n    pub name: /);
		expect(extractStructBody(src, 'ParametersElementsNode')).toMatch(/    #\[flank\(trailing = 0\)\]\n    pub delimiter: Option<::sittir_core::types::Delimiter>,/);
	});

	it("gives a choice's variants the ids today's decode claims for them", async () => {
		const src = await getRustTemplatesRs();
		const typeEnum = src.slice(src.indexOf('pub enum TypeNode {'));
		expect(src).toMatch(/#\[node\(choice\)\]\npub enum TypeNode \{/);
		expect(typeEnum).toMatch(/    #\[kind\(kind::NEVER_TYPE[^\]]*\)\]\n    #\[node\(edged\)\]\n    NeverType\(::sittir_core::options::Edges\),/);
		expect(typeEnum).toMatch(/    #\[kind\(kind::_PRIMITIVE_TYPE[^\]]*kind::U8_KEYWORD[^\]]*\)\]\n    PrimitiveType\(PrimitiveTypeEnum\),/);
		expect(src).toMatch(/#\[node\(kind = kind::_PRIMITIVE_TYPE, spelled\)\]\npub enum PrimitiveTypeEnum \{\n    #\[kind\(kind::U8_KEYWORD\)\]\n    U8,/);
	});

	it('marks the blank arm of a slot that has one', async () => {
		const src = await getTypescriptNodeRs();
		const terminator = src.slice(src.indexOf('pub enum StatementBlockTerminatorNodeSlot {'));
		expect(terminator).toMatch(/    #\[node\(blank\)\]\n    Blank,/);
	});

	it('gives a blank arm only to the choices that blank options hold', async () => {
		const src = await getTypescriptNodeRs();
		const model = await modelFor('typescript');
		const blankOptions = [...model.nodeMap.nodes.values()]
			.flatMap((n) => (n instanceof AbstractAssembledCompound ? n.slots : []))
			.filter(hasBlankArm);
		const blankChoices = [...src.matchAll(/pub enum (\w+) \{[^}]*\n    #\[node\(blank\)\]\n    Blank,/g)].map((m) => m[1]!);
		const heldByBlankChoices = [...src.matchAll(/pub \w+: Option<::sittir_core::SlotValue<(\w+)>>,/g)].filter((m) => blankChoices.includes(m[1]!));
		expect(blankOptions).toHaveLength(9);
		expect(heldByBlankChoices).toHaveLength(blankOptions.length);
		expect(blankChoices).toHaveLength(4);
	});
});

describe('a slot whose only scalar source is an enum of immediate tokens', () => {
	it('keeps its adjacency flag and the renderer writes it', async () => {
		const scm = await getNodeRsForGrammar('scm');
		expect(extractStructBody(scm, 'PredicateNode')).toContain('pub type_: ::sittir_core::SlotValue<PredicateTypeEnum, true>,');
		expect(extractFnBody(scm, 'render_predicate_type')).toContain('w.leaf_kind(');
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
		for (const gone of ['napi(object)', 'FromNapiValue', 'ToNapiValue', 'debug-node', 'decodes as none of its members', 'pub struct VerbatimNode']) {
			expect(src).not.toContain(gone);
		}
		expect(src).toContain('use ::sittir_core::VerbatimNode;');
		const item = extractStructBody(src, 'FunctionItemNode');
		expect(item).toMatch(/    #\[wire\(key = "\$_layout"\)\]\n    pub layout: Option<Box<NodeLayout>>,/);
		expect(item).toMatch(/    #\[wire\(key = "_name"\)\]\n    #\[slot\(field = field::NAME, word = 12, width = 5\)\]\n    pub name: /);
		expect(extractStructBody(src, 'IdentifierNode')).toMatch(/    #\[wire\(key = "\$text"\)\]\n    pub text: String,/);
	});

	it('marks the verbatim arm of a choice that takes bare text, and the root choice its ERROR arm alone', async () => {
		const src = await getRustTemplatesRs();
		expect(src).toMatch(/    #\[node\(verbatim\)\]\n    Verbatim\(VerbatimNode\),/);
		const any = src.slice(src.indexOf('pub enum AnyNode {'));
		const anyBody = any.slice(0, any.indexOf('\n}'));
		expect(anyBody).toMatch(/\n    #\[node\(error\)\]\n    Verbatim\(VerbatimNode\),/);
		expect(anyBody).not.toContain('#[node(verbatim)]');
	});

	it("states an envelope's wire ids", async () => {
		const src = await getTypescriptNodeRs();
		const member = src.slice(src.indexOf('pub enum MemberExpressionPropertyNodeSlot {'));
		const slot = member.slice(0, member.indexOf('\n}\n'));
		expect(slot).toMatch(/    #\[kind\(kind::_PROPERTY_IDENTIFIER, display\)\]\n    PropertyIdentifier\(/);
		expect(slot).not.toMatch(/decodes\(/);
		expect(slot).not.toMatch(/_KEYWORD\)\]/);
	});

	it('derives the codec alone for trivia', async () => {
		const src = await getRustTemplatesRs();
		expect(src).toMatch(/#\[derive\(Debug, Clone, PartialEq, ::sittir_core::Node\)\]\n#\[node\(choice, codec_only\)\]\npub enum TriviaNode \{/);
		expect(src).toMatch(/    #\[node\(text\)\]\n    #\[kind\([^\n]*\)\]\n    Text\(::sittir_core::trivia::TriviaText\),/);
		expect(src).toMatch(/    #\[node\(verbatim\)\]\n    Verbatim\(VerbatimNode\),\n    #\[node\(text\)\]/);
	});
});

describe('the envelope pin gate is wired to the real pipeline', () => {
	it('hands each grammar its pin table, so the gate cannot be dropped without a test failing', () => {
		expect(grammarRenderInputs('typescript', {}).envelopePins).toBe(ENVELOPE_PINS.typescript);
		expect(grammarRenderInputs('rust', {}).envelopePins).toEqual({});
	});

	it('refuses a full emission that carries a pin for an enum it does not print', async () => {
		const { raw, nodeMap, generatedIdTables, templates, renderRules } = await modelFor('typescript');
		const inputs = grammarRenderInputs('typescript', { renderRules, visibleExternals: raw.visibleExternals, options: raw.options });
		const stale = { ...inputs.envelopePins, 'GoneNodeSlot.Variant': { display: '_property_identifier', extras: [] } };
		expect(() => emitRenderModule('typescript', templates, nodeMap, generatedIdTables, { ...inputs, envelopePins: stale })).toThrow(
			/typescript GoneNodeSlot\.Variant pins an enum codegen does not print/
		);
	}, 120_000);
});

describe('the payload ceiling', () => {
	const boxedIn = (src: string): string[] =>
		[...new Set([...src.replace(/\npub enum TriviaNode \{[^}]*\}/, '').matchAll(/\n {4}\w+\(Box<(\w+)>\),/g)].map((m) => m[1]!))].sort();

	it('asserts every payload against the ceiling once, the boxed ones over it and the rest within', async () => {
		const src = await getRustTemplatesRs();
		const assertions = [...src.matchAll(/^const _: \(\) = assert!\(::core::mem::size_of::<(\w+)>\(\) (<=|>) (\d+), "/gm)];
		const over = assertions.filter((m) => m[2] === '>').map((m) => m[1]!).sort();
		expect(over.length).toBeGreaterThan(0);
		expect(boxedIn(src)).toEqual(expect.arrayContaining(over));
		expect(assertions.every((m) => Number(m[3]) === PAYLOAD_CEILING_BYTES)).toBe(true);
		expect(new Set(assertions.map((m) => m[1])).size).toBe(assertions.length);
	});

	it('holds each payload over the ceiling boxed in every choice', async () => {
		const src = await getRustTemplatesRs();
		const over = [...src.matchAll(/^const _: \(\) = assert!\(::core::mem::size_of::<(\w+)>\(\) > /gm)].map((m) => m[1]!);
		for (const name of over) expect(src.replace(/\npub enum TriviaNode \{[^}]*\}/, '')).not.toMatch(new RegExp(`\\n {4}\\w+\\(${name}\\),`));
	});

	it('refuses a boxed payload no choice holds', () => {
		expect(() => payloadCeilingAssertions(['UnheldNode'], new Set())).toThrow('UnheldNode is boxed but no choice holds it');
	});
});

describe('list storage', () => {
	it('prints a possibly-empty list as a Vec and a repeat1 list as a NonEmptyVec', async () => {
		const rust = await getNodeRsForGrammar('python');
		expect(rust).toContain('pub handlers: Vec<::sittir_core::SlotValue<ExceptClauseNode>>');
		expect(rust).not.toMatch(/Option<Vec</);
		expect(rust).toContain('pub decorator: ::sittir_core::NonEmptyVec<::sittir_core::SlotValue<DecoratorNode>>');
	}, 120_000);
});
