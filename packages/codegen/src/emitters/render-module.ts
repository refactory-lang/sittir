/**
 * Rust render-module emitter. Owns codegen output for
 * `rust/crates/sittir-{lang}/src/render/*.rs` and the companion
 * `packages/{lang}/src/hash.ts` that the TS backend shim imports.
 *
 * Spec 012:
 *  - T016 (initial scaffold): hash.rs + hash.ts emission.
 *  - T027/T028/T029: per-kind `#[derive(Template)]` structs + direct
 *    `NodeData` render helpers + `render_dispatch` in
 *    `rust/crates/sittir-{lang}/src/render/templates.rs`.
 *  - T030: canonical `.jinja` copying into
 *    `rust/crates/sittir-{lang}/templates/`.
 *
 * The emitter is pure — given a grammar's template bundle + node map,
 * it returns the string contents of each file it would write. The CLI
 * (T017) owns filesystem I/O and the template-directory copy.
 */

import type { NodeMap } from '../compiler/types.ts';
import type { AssembledNode, RenderTemplateSurface, AssembledNonterminal, AssembledSupertype } from '../compiler/node-map.ts';
import {
	AssembledBranch,
	AssembledEnum,
	AssembledGroup,
	AssembledPolymorph,
	isMultiple,
	isRequired,
	isNodeRef,
	kindsOf,
	structuralFieldsOf,
	structuralChildrenOf
} from '../compiler/node-map.ts';
import { assertNever } from '../polymorph-variant.ts';
import { findRepeatSeparator } from '../compiler/template-walker.ts';
import { compileWordMatcher } from '../compiler/common.ts';
import type { TemplateFile } from './template-hash.ts';
import { computeTemplateBundleHash } from './template-hash.ts';
import { renderModuleSrcDir, renderModuleTemplatesDir } from './render-module-paths.ts';
import { type TransportLiteral } from './transport-projection.ts';
import { getTransportProjection } from './transport-projection-cache.ts';
import { buildSupertypeTransportSet, classifySlot, deriveChildrenKinds, type SlotClass } from './transport-common.ts';
import type { EmittedTemplates } from './templates.ts';
import {
	collectKindEntries,
	collectCatalogKinds,
	findKindEntry,
	kindIdMemberName,
	type KindEnumEntry
} from './kind-discriminant.ts';
import { toScreamingSnakeCase } from './kind-id-rust.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import type { CodegenEmitter } from './emitter.ts';

/** Grammars the emitter supports. Matches the three per-grammar packages. */
export type Grammar = 'rust' | 'typescript' | 'python';
const SUPPORTED_GRAMMARS = ['rust', 'typescript', 'python'] as const;

export function isRenderModuleGrammar(grammar: string): grammar is Grammar {
	return (SUPPORTED_GRAMMARS as readonly string[]).includes(grammar);
}

/**
 * Output of a single emit pass. Each field names a file path
 * (relative to the repo root) and its exact contents. The CLI writes
 * them; this module does not touch disk. Key invariant: re-running
 * the emitter over the same inputs produces byte-identical output.
 */
export interface RustRenderModuleEmit {
	/** `rust/crates/sittir-{lang}/src/render/hash.rs` */
	hashRs: { path: string; contents: string };
	/** `packages/{lang}/src/hash.ts` */
	hashTs: { path: string; contents: string };
	/** `rust/crates/sittir-{lang}/src/render/templates.rs` — per-kind Template structs + render functions */
	templatesRs: { path: string; contents: string };
	/** `rust/crates/sittir-{lang}/src/render/dispatch.rs` — render_dispatch match table */
	dispatchRs: { path: string; contents: string };
	/** `rust/crates/sittir-{lang}/src/render/transport.rs` — AnyTransport + FromNapiValue + typed dispatch + transport bridge */
	transportRs: { path: string; contents: string };
	/** `rust/crates/sittir-{lang}/src/render/bridge.rs` — field/child resolution helpers */
	bridgeRs: { path: string; contents: string };
	/** `rust/crates/sittir-{lang}/src/render/mod.rs` (T028 — exposes render_dispatch) */
	libRs: { path: string; contents: string };
}

export interface RenderModuleTemplateCopies {
	directory: string;
	files: readonly { path: string; contents: string }[];
}

export interface RenderModuleBundle {
	emit: RustRenderModuleEmit;
	templateCopies: RenderModuleTemplateCopies;
}

export interface RenderModuleEmitterConfig {
	grammar: Grammar;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
}

interface RenderModuleCollectedEntry {
	node: AssembledNode;
	separator: string | undefined;
	isListContainer: boolean;
	variants: Map<string, string> | undefined;
}

function collectRenderModuleEntry(node: AssembledNode): RenderModuleCollectedEntry {
	let separator: string | undefined;
	let isListContainer = false;
	let variants: Map<string, string> | undefined;
	if (node.userFacing) {
		if (node instanceof AssembledBranch) {
			separator = node.separator ?? findRepeatSeparator(node.simplifiedRule);
			if (node.isContainerShape) {
				const childCount = node.children?.length ?? 0;
				if (childCount > 0) isListContainer = true;
			}
		} else if (node instanceof AssembledGroup) {
			separator = findRepeatSeparator(node.simplifiedRule);
		}
		if (node instanceof AssembledPolymorph) {
			const map = new Map<string, string>();
			for (const form of node.forms) {
				map.set(form.kind, form.name);
			}
			for (const childKind of node.variantChildKinds) {
				if (!map.has(childKind)) {
					const unpaired = node.forms.find((f) => !Array.from(map.values()).includes(f.name) || true);
					if (unpaired) map.set(childKind, unpaired.name);
				}
			}
			if (map.size > 0) variants = map;
		}
	}
	return { node, separator, isListContainer, variants };
}

/** Derives MetaData from collected emitter entries — same derivation as
 *  `collectMetaData` but operating on the pre-extracted per-entry fields. */
function buildMetaDataFromEntries(entries: readonly RenderModuleCollectedEntry[]): MetaData {
	const separators = new Map<string, string>();
	const listContainers = new Set<string>();
	const variants = new Map<string, Map<string, string>>();
	for (const entry of entries) {
		if (!entry.node.userFacing) continue;
		const kind = entry.node.kind;
		if (entry.separator !== undefined) separators.set(kind, entry.separator);
		if (entry.isListContainer) listContainers.add(kind);
		if (entry.variants !== undefined) variants.set(kind, entry.variants);
	}
	return { separators, listContainers, variants };
}

interface SynthesizeRenderModuleBundleConfig {
	grammar: Grammar;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
	entries: readonly RenderModuleCollectedEntry[];
	templates: EmittedTemplates;
}

function synthesizeRenderModuleBundle(config: SynthesizeRenderModuleBundleConfig): RenderModuleBundle {
	const { grammar, nodeMap, generatedIdTables, entries, templates } = config;
	const meta = buildMetaDataFromEntries(entries);
	const nodesByKind = new Map<string, AssembledNode>(entries.map((e) => [e.node.kind, e.node]));
	const files = templateFilesFromEmittedTemplates(templates);
	return {
		emit: emitRenderModule(grammar, files, nodeMap, generatedIdTables, { meta, nodesByKind }),
		templateCopies: planRenderModuleTemplateCopies(grammar, templates)
	};
}

export class RenderModuleEmitter implements CodegenEmitter<RenderModuleBundle, EmittedTemplates> {
	readonly #grammar: Grammar;
	readonly #nodeMap: NodeMap;
	readonly #generatedIdTables?: GeneratedIdTables;
	readonly #entries: RenderModuleCollectedEntry[] = [];

	constructor(config: RenderModuleEmitterConfig) {
		this.#grammar = config.grammar;
		this.#nodeMap = config.nodeMap;
		this.#generatedIdTables = config.generatedIdTables;
	}

	emitLeaf(node: Extract<AssembledNode, { modelType: 'pattern' | 'keyword' | 'enum' }>): void {
		this.#entries.push(collectRenderModuleEntry(node));
	}

	emitBranch(node: Extract<AssembledNode, { modelType: 'branch' }>): void {
		this.#entries.push(collectRenderModuleEntry(node));
	}

	emitPolymorph(node: Extract<AssembledNode, { modelType: 'polymorph' }>): void {
		this.#entries.push(collectRenderModuleEntry(node));
	}

	emitGroup(node: Extract<AssembledNode, { modelType: 'group' }>): void {
		this.#entries.push(collectRenderModuleEntry(node));
	}

	finalize(templates: EmittedTemplates): RenderModuleBundle {
		return synthesizeRenderModuleBundle({
			grammar: this.#grammar,
			nodeMap: this.#nodeMap,
			generatedIdTables: this.#generatedIdTables,
			entries: this.#entries,
			templates
		});
	}
}

function hashRsHeader(lang: Grammar): string {
	return `// @generated from packages/${lang}/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --all --output packages/${lang}/src
//
// This file carries the SHA-256 digest of the template bundle at codegen
// time. The grammar-owned \`sittir-${lang}\` native module exports it as
// \`SittirEngine.templateBundleHash\`; the JS backend shim
// (packages/${lang}/src/backend.ts) compares it against the TS-side
// hash to detect drift between the baked Rust binary and the TS
// templates, falling through to the TS engine on mismatch (FR-020).
`;
}

function hashTsHeader(lang: Grammar): string {
	return `// @generated from packages/${lang}/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --all --output packages/${lang}/src
//
// Companion to ${renderModuleSrcDir(lang)}/hash.rs; the two must
// agree byte-for-byte at runtime for the native backend to be picked
// (FR-020). Mismatch is caught by packages/${lang}/src/backend.ts and
// falls through to the TS engine silently.
`;
}

function generatedHeader(lang: Grammar): string {
	return `// @generated from packages/${lang}/node-model.json5 and packages/${lang}/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --all --output packages/${lang}/src`;
}

function templatesRsHeader(lang: Grammar): string {
	return `${generatedHeader(lang)}
//
// Per-kind askama template structs + render functions for the ${lang}
// grammar. Every struct in this file is backed by a sibling \`.jinja\`
// template under \`templates/\`, copied from \`packages/${lang}/templates/\`
// at codegen time (spec 012 T030).
//
// Askama parses each \`.jinja\` at \`cargo build\` time — any mismatch
// between a template's referenced variables and its backing struct's
// fields is caught at compile time (FR-008). If you see a build error
// here, the codegen is out of sync: regenerate via the command above.`;
}

function dispatchRsHeader(lang: Grammar): string {
	return `${generatedHeader(lang)}
//
// render_dispatch match table — routes KindId to per-kind render functions
// in the sibling templates module.`;
}

function transportRsHeader(lang: Grammar): string {
	return `${generatedHeader(lang)}
//
// AnyTransport enum + FromNapiValue impls + per-kind transport structs +
// typed dispatch (render_transport_dispatch) + transport bridge helpers.`;
}

function bridgeRsHeader(lang: Grammar): string {
	return `${generatedHeader(lang)}
//
// Field and child resolution helpers — ResolvedField, resolve_field,
// resolve_children, separator_for, variant_for, etc. Used by both
// dispatch and templates modules.`;
}

type EmittedNonterminalView = 'scalar' | 'list' | 'field';

// ----------------------------------------------------------------------
// Rust identifier safety
// ----------------------------------------------------------------------

export const RUST_KEYWORDS = new Set([
	'as',
	'break',
	'const',
	'continue',
	'crate',
	'else',
	'enum',
	'extern',
	'false',
	'fn',
	'for',
	'if',
	'impl',
	'in',
	'let',
	'loop',
	'match',
	'mod',
	'move',
	'mut',
	'pub',
	'ref',
	'return',
	'self',
	'Self',
	'static',
	'struct',
	'super',
	'trait',
	'true',
	'type',
	'unsafe',
	'use',
	'where',
	'while',
	'async',
	'await',
	'dyn',
	'abstract',
	'become',
	'box',
	'do',
	'final',
	'macro',
	'override',
	'priv',
	'typeof',
	'unsized',
	'virtual',
	'yield',
	'try',
	'union'
]);

/**
 * Per-supertype transport enum names that collide with pre-existing
 * generated items and must be skipped during Phase 2 supertype-enum
 * emission.  The `_literal` supertype has `typeName = 'Literal'` which
 * would produce `pub enum LiteralTransport`.  Keep reserved so the
 * supertype enum is not emitted; slots fall back to `Box<AnyTransport>`
 * (`heterogeneous`).
 */
const RESERVED_SUPERTYPE_ENUM_NAMES = new Set(['LiteralTransport']);

/** Rust field identifier mapping for generated render/transport structs.
 *  Askama template expressions do not accept raw identifiers (`r#pub`),
 *  so keyword-named fields use a uniform `_` suffix (`pub_`, `type_`,
 *  `crate_`, etc.) across the Rust render module. */
export function rustFieldIdent(id: string): string {
	if (RUST_KEYWORDS.has(id)) return `${id}_`;
	return id;
}

function templateFilesFromEmittedTemplates(templates: EmittedTemplates): TemplateFile[] {
	const files: TemplateFile[] = [];
	for (const [kind, body] of templates.bodies) {
		files.push({ filename: `${kind}.jinja`, content: body });
	}
	return files;
}

function renameForRustRender(body: string): string {
	let out = body;
	for (const kw of RUST_KEYWORDS) {
		const re = new RegExp(
			`(\\{\\{-?\\s*|\\{%-?\\s*(?:if|elif)\\s+|\\{%-?\\s*for\\s+[a-zA-Z_][a-zA-Z0-9_]*\\s+in\\s+)${kw}\\b`,
			'g'
		);
		out = out.replace(re, `$1${rustFieldIdent(kw)}`);
	}
	return out;
}

function preserveMultilineTrailingNewline(body: string): string {
	if (!body.includes('\n') || !body.endsWith('\n')) return body;
	return body + '\n';
}

export function planRenderModuleTemplateCopies(
	lang: Grammar,
	templates: EmittedTemplates
): RenderModuleTemplateCopies {
	const directory = renderModuleTemplatesDir(lang);
	const files = [...templates.bodies.entries()].map(([kind, body]) => ({
		path: `${directory}/${kind}.jinja`,
		contents: preserveMultilineTrailingNewline(renameForRustRender(body))
	}));
	return { directory, files };
}

export function emitRenderModuleBundle(
	lang: Grammar,
	templates: EmittedTemplates,
	nodeMap: NodeMap,
	generatedIdTables?: GeneratedIdTables
): RenderModuleBundle {
	return {
		emit: emitRenderModule(lang, templateFilesFromEmittedTemplates(templates), nodeMap, generatedIdTables),
		templateCopies: planRenderModuleTemplateCopies(lang, templates)
	};
}

/** Struct name: PascalCase(kind). Mirrors the AssembledNode.typeName
 *  conventions so emitted struct names match the factory/type naming
 *  per the T027 struct-name directive.
 *
 *  Prefers the AssembledNode.typeName when a matching node exists (this
 *  is the `_`-stripped form for hidden user-facing aliases); falls back
 *  to a pascal conversion for bare kinds. */
function structNameFor(kind: string, node: AssembledNode | undefined): string {
	if (node) return `${node.typeName}Template`;
	return `${pascal(kind)}Template`;
}

function pascal(s: string): string {
	return s
		.replace(/^_+/, '') // strip leading underscores (hidden-kind marker)
		.split('_')
		.filter(Boolean)
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join('');
}

// ----------------------------------------------------------------------
// Per-kind struct emission
// ----------------------------------------------------------------------

interface EmittedField {
	name: string; // raw grammar field name
	view: EmittedNonterminalView;
	required: boolean;
	multiple: boolean; // true when the transport-side field is Vec<Box<AnyTransport>>
	/** True when this slot has a corresponding field in the transport struct.
	 *  Slots without transport fields (virtual presentation slots from the
	 *  template walker) must be defaulted to "" in the typed dispatch path. */
	hasTransportField: boolean;
	hasLeading: boolean;
	hasTrailing: boolean;
}

interface EmittedStruct {
	name: string;
	kind: string;
	fields: EmittedField[];
	hasChildren: boolean;
	/** True when the transport struct actually has a `children` field (structuralChildren.length > 0).
	 *  The template may reference `children` (hasChildren === true) without a transport field —
	 *  in that case we emit an empty ListNonterminalView instead of accessing node.children. */
	transportHasChildren: boolean;
	/** True when the transport struct's `children` field is `Vec<...>` (not `Option<Vec<...>>`). */
	childrenRequired: boolean;
	/** True when the transport struct's `children` field is `Vec<T>` (multiple elements possible).
	 *  When false, the field is scalar: `T` (required) or `Option<T>` (optional). */
	childrenMultiple: boolean;
	hasVariant: boolean;
	hasText: boolean;
}

function emitStruct(kind: string, node: AssembledNode | undefined, surface: RenderTemplateSurface): EmittedStruct {
	const name = structNameFor(kind, node);
	// Build name→multiple and name→required lookups from the assembled node's
	// structural fields so the typed dispatch emitter generates code consistent
	// with what the transport struct emits (Vec<...> vs Option<Vec<...>>,
	// Box<...> vs Option<Box<...>>). The surface slot's required flag is a
	// template-rendering concern; the transport struct's required flag is the
	// assembly-level `isRequired(assembledField)`. These can differ, so we
	// override with the assembly-level flag.
	const multipleByName = new Map<string, boolean>();
	const requiredByName = new Map<string, boolean>();
	if (node) {
		for (const f of structuralFieldsOf(node)) {
			multipleByName.set(f.name, isMultiple(f));
			requiredByName.set(f.name, isRequired(f));
		}
	}
	const fields: EmittedField[] = surface.slots.map((slot) => ({
		...slot,
		multiple: multipleByName.get(slot.name) ?? false,
		// Override required from assembly if available; fall back to surface.
		required: requiredByName.has(slot.name) ? (requiredByName.get(slot.name) as boolean) : slot.required,
		// Mark whether this slot has a corresponding field in the transport struct.
		// Virtual presentation slots (from the template walker) are not in the
		// transport struct and must be defaulted to "" in the typed dispatch path.
		hasTransportField: requiredByName.has(slot.name) || multipleByName.has(slot.name)
	}));
	fields.sort((a, b) => a.name.localeCompare(b.name));
	return {
		name,
		kind,
		fields,
		hasChildren: surface.usesChildren,
		transportHasChildren: node ? structuralChildrenOf(node).length > 0 : false,
		childrenRequired: node ? hasRequiredChild(structuralChildrenOf(node)) : false,
		childrenMultiple: node ? hasMultipleChildren(structuralChildrenOf(node)) : false,
		hasVariant: surface.usesVariant,
		hasText: surface.usesText
	};
}

function mergeTemplateSurfaceFromBody(
	body: string,
	surface: RenderTemplateSurface | undefined
): RenderTemplateSurface {
	const reserved = new Set(['children', 'variant', 'text']);
	const guarded = new Set<string>();
	const byName = new Map<string, RenderTemplateSurface['slots'][number]>();
	for (const slot of surface?.slots ?? []) {
		byName.set(slot.name, { ...slot });
	}
	const record = (name: string, view: 'scalar' | 'list' | 'field'): void => {
		if (reserved.has(name)) return;
		const next = {
			name,
			view,
			required: !guarded.has(name),
			hasLeading: false,
			hasTrailing: false
		} as const;
		const prev = byName.get(name);
		if (!prev) {
			byName.set(name, next);
			return;
		}
		byName.set(name, {
			...prev,
			view: prev.view === next.view ? prev.view : 'field',
			required: prev.required && next.required
		});
	};
	for (const match of body.matchAll(/\{%-?\s*(?:if|elif)\s+([a-z0-9_]+)\s*\|\s*(?:isPresent|is_present)\b/g)) {
		const name = match[1];
		if (!name || reserved.has(name)) continue;
		guarded.add(name);
		record(name, 'scalar');
	}
	for (const match of body.matchAll(/\{\{-?\s*([a-z_][a-z0-9_]*)\b(?:\s*\|\s*([A-Za-z_][A-Za-z0-9_]*))?/g)) {
		const name = match[1];
		const filter = match[2];
		if (!name) continue;
		record(name, filter?.startsWith('join') ? 'list' : 'scalar');
	}
	for (const match of body.matchAll(/\{%-?\s*for\s+[A-Za-z_][A-Za-z0-9_]*\s+in\s+([a-z_][a-z0-9_]*)\b/g)) {
		const name = match[1];
		if (name) record(name, 'list');
	}
	return {
		slots: [...byName.values()],
		usesChildren: surface?.usesChildren ?? /\bchildren\b/.test(body),
		usesVariant: surface?.usesVariant ?? /\bvariant\b/.test(body),
		usesText: surface?.usesText ?? /\btext\b/.test(body)
	};
}

function renderStructDefs(structs: EmittedStruct[]): string {
	const lines: string[] = [];
	for (const s of structs) {
		lines.push(`#[derive(::askama::Template)]`);
		lines.push(`#[template(path = ${JSON.stringify(`${s.kind}.jinja`)}, escape = "none")]`);
		lines.push(`pub struct ${s.name}<'a> {`);
		if (s.hasChildren) {
			lines.push(`    pub children: ListNonterminalView<'a>,`);
		}
		if (s.hasVariant) {
			lines.push(`    pub variant: &'a str,`);
		}
		if (s.hasText) {
			lines.push(`    pub text: &'a str,`);
		}
		for (const f of s.fields) {
			lines.push(`    pub ${rustFieldIdent(f.name)}: ${slotFieldType(f)},`);
		}
		lines.push(`}`);
		lines.push('');
	}
	return lines.join('\n');
}

function renderFnName(kind: string): string {
	const base = kind.replace(/^_+/, 'hidden_').replace(/[^a-zA-Z0-9]+/g, '_');
	return `render_${base}`;
}

/**
 * Per-kind render functions need `pub(crate)` visibility so that
 * `dispatch.rs` (sibling module) can call them. This prefix is
 * applied during emission of per-kind functions.
 */
const PER_KIND_FN_VIS = 'pub(crate) ';

/**
 * Pick the per-cardinality nonterminal-view type for an emitted slot.
 *
 * The four-type taxonomy:
 * - `SingleNonterminalView<'a>` — known-required, single occurrence.
 * - `OptionalNonterminalView<'a>` — known zero-or-one.
 * - `ListNonterminalView<'a>` — known zero-or-more.
 * - `NonterminalView<'a>` — escape hatch when cardinality is genuinely
 *   ambiguous at codegen time. Under current rules every emitted slot
 *   resolves to one of the three concrete types; the umbrella is
 *   reserved for future cases where the walker can't decide.
 */
function slotFieldType(f: EmittedField): string {
	// list view OR field-view-with-multiple → always-list
	if (f.view === 'list' || (f.view === 'field' && f.multiple)) {
		return `ListNonterminalView<'a>`;
	}
	// scalar OR field-view-single
	if (f.required) return `SingleNonterminalView<'a>`;
	return `OptionalNonterminalView<'a>`;
}

/**
 * Emit the `ResolvedFieldKind` enum, `ResolvedField` struct, its impl block,
 * and all field/children resolution functions (`render_node_value`,
 * `missing_required_field`, `resolve_text`, `resolve_leaf`, `resolve_optional`,
 * `resolve_required`, `is_join_flank_token`, `detect_field_trailing_sep`,
 * `resolve_field`, `resolve_children`).
 *
 * @returns Rust source lines for the field resolution helpers.
 */
function renderFieldResolutionHelpers(): string[] {
	const lines: string[] = [];
	lines.push(`#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]`);
	lines.push(`pub(crate) enum ResolvedFieldKind {`);
	lines.push(`    #[default]`);
	lines.push(`    Missing,`);
	lines.push(`    Scalar,`);
	lines.push(`    List,`);
	lines.push(`}`);
	lines.push('');
	lines.push(`#[derive(Debug, Default)]`);
	lines.push(`pub(crate) struct ResolvedField {`);
	lines.push(`    pub(crate) kind: ResolvedFieldKind,`);
	lines.push(`    pub(crate) scalar: String,`);
	lines.push(`    pub(crate) items: Vec<String>,`);
	lines.push(`    pub(crate) separator: &'static str,`);
	lines.push(`    pub(crate) leading_sep: bool,`);
	lines.push(`    pub(crate) trailing_sep: bool,`);
	lines.push(`}`);
	lines.push('');
	lines.push(`impl ResolvedField {`);
	lines.push(`    pub(crate) fn from_scalar(value: String) -> Self {`);
	lines.push(`        Self {`);
	lines.push(`            kind: ResolvedFieldKind::Scalar,`);
	lines.push(`            scalar: value,`);
	lines.push(`            items: Vec::new(),`);
	lines.push(`            separator: "",`);
	lines.push(`            leading_sep: false,`);
	lines.push(`            trailing_sep: false,`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push('');
	lines.push(
		`    pub(crate) fn from_items(items: Vec<String>, separator: &'static str, leading_sep: bool, trailing_sep: bool) -> Self {`
	);
	lines.push(`        let mut scalar = String::new();`);
	lines.push(`        if leading_sep && !items.is_empty() {`);
	lines.push(`            scalar.push_str(separator);`);
	lines.push(`        }`);
	lines.push(`        let mut first = true;`);
	lines.push(`        for item in &items {`);
	lines.push(`            if !first {`);
	lines.push(`                scalar.push_str(separator);`);
	lines.push(`            }`);
	lines.push(`            scalar.push_str(item);`);
	lines.push(`            first = false;`);
	lines.push(`        }`);
	lines.push(`        if trailing_sep && !items.is_empty() {`);
	lines.push(`            scalar.push_str(separator);`);
	lines.push(`        }`);
	lines.push(`        Self {`);
	lines.push(`            kind: ResolvedFieldKind::List,`);
	lines.push(`            scalar,`);
	lines.push(`            items,`);
	lines.push(`            separator,`);
	lines.push(`            leading_sep,`);
	lines.push(`            trailing_sep,`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push('');
	lines.push(`    pub(crate) fn as_scalar(&self) -> &str {`);
	lines.push(`        self.scalar.as_str()`);
	lines.push(`    }`);
	lines.push('');
	lines.push(`    pub(crate) fn renderable_items(&self) -> Vec<::sittir_core::filters::Renderable<'_>> {`);
	lines.push(`        self.items.iter().map(|s| ::sittir_core::filters::Renderable::Text(s.as_str())).collect()`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(`pub(crate) fn render_node_value(node: &NodeData) -> Result<String, ::askama::Error> {`);
	lines.push(`    let mut buf = String::new();`);
	lines.push(`    render_nodedata_into(node, &mut buf)?;`);
	lines.push(`    Ok(buf)`);
	lines.push(`}`);
	lines.push('');
	lines.push(`pub(crate) fn missing_required_field(node: &NodeData, name: &str) -> ::askama::Error {`);
	lines.push(`    ::askama::Error::Custom(`);
	lines.push(`        format!("render_nodedata_into: missing required field '{}' on '{}'", name, node.type_).into(),`);
	lines.push(`    )`);
	lines.push(`}`);
	lines.push('');
	lines.push(`pub(crate) fn resolve_text(node: &NodeData) -> Result<String, ::askama::Error> {`);
	lines.push(`    if let Some(text) = &node.text {`);
	lines.push(`        return Ok(text.to_owned());`);
	lines.push(`    }`);
	lines.push(`    let mut parts = Vec::new();`);
	lines.push(`    if let Some(fields) = &node.fields {`);
	lines.push(`        for value in fields.values() {`);
	lines.push(`            match value {`);
	lines.push(`                FieldValue::Single(child) => parts.push(render_node_value(child)?),`);
	lines.push(`                FieldValue::Multiple(items) => {`);
	lines.push(`                    for child in items {`);
	lines.push(`                        parts.push(render_node_value(child)?);`);
	lines.push(`                    }`);
	lines.push(`                }`);
	lines.push(`                FieldValue::Text(text) => parts.push(text.to_owned()),`);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`    if let Some(children) = &node.children {`);
	lines.push(`        for child in children {`);
	lines.push(`            parts.push(render_node_value(child)?);`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`    Ok(parts.join(""))`);
	lines.push(`}`);
	lines.push('');
	lines.push(`pub(crate) fn resolve_leaf<'a>(node: &'a NodeData, name: &str) -> Option<&'a str> {`);
	lines.push(`    match node.fields.as_ref().and_then(|fields| fields.get(name)) {`);
	lines.push(`        Some(FieldValue::Single(child)) => child.text.as_deref(),`);
	lines.push(`        Some(FieldValue::Text(text)) => Some(text.as_str()),`);
	lines.push(`        _ => None,`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(
		`pub(crate) fn resolve_optional(node: &NodeData, name: &str) -> Result<Option<String>, ::askama::Error> {`
	);
	lines.push(`    match node.fields.as_ref().and_then(|fields| fields.get(name)) {`);
	lines.push(`        None => Ok(None),`);
	lines.push(`        Some(FieldValue::Text(text)) => Ok((!text.is_empty()).then(|| text.to_owned())),`);
	lines.push(`        Some(FieldValue::Single(child)) => {`);
	lines.push(`            let rendered = render_node_value(child)?;`);
	lines.push(`            Ok((!rendered.is_empty()).then_some(rendered))`);
	lines.push(`        }`);
	lines.push(`        Some(FieldValue::Multiple(_)) => {`);
	lines.push(`            let resolved = resolve_field(node, name, false)?;`);
	lines.push(`            Ok((!resolved.scalar.is_empty()).then_some(resolved.scalar))`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(`pub(crate) fn resolve_required(node: &NodeData, name: &str) -> Result<String, ::askama::Error> {`);
	lines.push(`    match node.fields.as_ref().and_then(|fields| fields.get(name)) {`);
	lines.push(`        None => Err(missing_required_field(node, name)),`);
	lines.push(`        Some(_) => Ok(resolve_optional(node, name)?.unwrap_or_default()),`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(`pub(crate) fn is_join_flank_token(text: &str) -> bool {`);
	lines.push(`    matches!(text, "," | ";")`);
	lines.push(`}`);
	lines.push('');
	lines.push(`pub(crate) fn detect_field_trailing_sep(node: &NodeData, field_name: &str) -> bool {`);
	lines.push(`    let fields = match &node.fields {`);
	lines.push(`        Some(fields) => fields,`);
	lines.push(`        None => return false,`);
	lines.push(`    };`);
	lines.push(`    let value = match fields.get(field_name) {`);
	lines.push(`        Some(value) => value,`);
	lines.push(`        None => return false,`);
	lines.push(`    };`);
	lines.push(`    let boundary = match value {`);
	lines.push(`        FieldValue::Multiple(items) => items`);
	lines.push(`            .iter()`);
	lines.push(`            .filter(|item| item.named)`);
	lines.push(`            .filter_map(|item| item.span.map(|span| span.end))`);
	lines.push(`            .max(),`);
	lines.push(`        _ => None,`);
	lines.push(`    };`);
	lines.push(`    let boundary = match boundary {`);
	lines.push(`        Some(boundary) => boundary,`);
	lines.push(`        None => return false,`);
	lines.push(`    };`);
	lines.push(`    for (name, raw) in fields {`);
	lines.push(`        if name == field_name {`);
	lines.push(`            continue;`);
	lines.push(`        }`);
	lines.push(`        let values: Vec<&NodeData> = match raw {`);
	lines.push(`            FieldValue::Single(item) => vec![item.as_ref()],`);
	lines.push(`            FieldValue::Multiple(items) => items.iter().collect(),`);
	lines.push(`            FieldValue::Text(_) => Vec::new(),`);
	lines.push(`        };`);
	lines.push(`        for candidate in values {`);
	lines.push(`            if candidate.named {`);
	lines.push(`                continue;`);
	lines.push(`            }`);
	lines.push(`            if let Some(span) = candidate.span {`);
	lines.push(
		`                if span.start >= boundary && candidate.text.as_deref().map_or(false, is_join_flank_token) {`
	);
	lines.push(`                    return true;`);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`    if let Some(children) = &node.children {`);
	lines.push(`        for child in children {`);
	lines.push(`            if child.named {`);
	lines.push(`                continue;`);
	lines.push(`            }`);
	lines.push(`            if let Some(span) = child.span {`);
	lines.push(`                if span.start >= boundary && child.text.as_deref().map_or(false, is_join_flank_token) {`);
	lines.push(`                    return true;`);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`    false`);
	lines.push(`}`);
	lines.push('');
	lines.push(
		`pub(crate) fn resolve_field(node: &NodeData, name: &str, required: bool) -> Result<ResolvedField, ::askama::Error> {`
	);
	lines.push(`    match node.fields.as_ref().and_then(|fields| fields.get(name)) {`);
	lines.push(`        None => {`);
	lines.push(`            if required {`);
	lines.push(`                Err(missing_required_field(node, name))`);
	lines.push(`            } else {`);
	lines.push(`                Ok(ResolvedField::default())`);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(`        Some(FieldValue::Text(text)) => Ok(ResolvedField::from_scalar(text.to_owned())),`);
	lines.push(`        Some(FieldValue::Single(child)) => {`);
	lines.push(`            let rendered = render_node_value(child)?;`);
	lines.push(`            Ok(ResolvedField::from_scalar(rendered))`);
	lines.push(`        }`);
	lines.push(`        Some(FieldValue::Multiple(items)) => {`);
	lines.push(`            let mut rendered = Vec::new();`);
	lines.push(`            for item in items {`);
	lines.push(`                if !item.named {`);
	lines.push(`                    continue;`);
	lines.push(`                }`);
	lines.push(`                rendered.push(render_node_value(item)?);`);
	lines.push(`            }`);
	lines.push(`            Ok(ResolvedField::from_items(`);
	lines.push(`                rendered,`);
	lines.push(`                separator_for(node.type_.0),`);
	lines.push(`                false,`);
	lines.push(`                detect_field_trailing_sep(node, name),`);
	lines.push(`            ))`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(
		`pub(crate) fn resolve_children(node: &NodeData, consumed_fields: &[&str]) -> Result<ResolvedField, ::askama::Error> {`
	);
	lines.push(`    let mut child_nodes: Vec<(u32, usize, &NodeData)> = Vec::new();`);
	lines.push(`    let mut child_ordinal = 0usize;`);
	lines.push(`    let mut first_named_idx: Option<usize> = None;`);
	lines.push(`    let mut last_named_idx: Option<usize> = None;`);
	lines.push(`    if let Some(items) = &node.children {`);
	lines.push(`        for (index, child) in items.iter().enumerate() {`);
	lines.push(`            if !child.named {`);
	lines.push(`                continue;`);
	lines.push(`            }`);
	lines.push(`            if first_named_idx.is_none() {`);
	lines.push(`                first_named_idx = Some(index);`);
	lines.push(`            }`);
	lines.push(`            last_named_idx = Some(index);`);
	lines.push(`            child_nodes.push((child.span.map_or(u32::MAX, |span| span.start), child_ordinal, child));`);
	lines.push(`            child_ordinal += 1;`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`    if let Some(fields) = &node.fields {`);
	lines.push(`        for (name, value) in fields {`);
	lines.push(`            if consumed_fields.iter().any(|consumed| consumed == &name.as_str()) {`);
	lines.push(`                continue;`);
	lines.push(`            }`);
	lines.push(`            match value {`);
	lines.push(`                FieldValue::Single(child) => {`);
	lines.push(`                    if child.named {`);
	lines.push(
		`                        child_nodes.push((child.span.map_or(u32::MAX, |span| span.start), child_ordinal, child.as_ref()));`
	);
	lines.push(`                        child_ordinal += 1;`);
	lines.push(`                    }`);
	lines.push(`                }`);
	lines.push(`                FieldValue::Multiple(items) => {`);
	lines.push(`                    for child in items {`);
	lines.push(`                        if child.named {`);
	lines.push(
		`                            child_nodes.push((child.span.map_or(u32::MAX, |span| span.start), child_ordinal, child));`
	);
	lines.push(`                            child_ordinal += 1;`);
	lines.push(`                        }`);
	lines.push(`                    }`);
	lines.push(`                }`);
	lines.push(`                FieldValue::Text(_) => {}`);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`    child_nodes.sort_by(|left, right| left.0.cmp(&right.0).then(left.1.cmp(&right.1)));`);
	lines.push(`    let mut children = Vec::new();`);
	lines.push(`    for (_, _, child) in child_nodes {`);
	lines.push(`        children.push(render_node_value(child)?);`);
	lines.push(`    }`);
	lines.push(`    let mut leading_sep = false;`);
	lines.push(`    let mut trailing_sep = false;`);
	lines.push(`    if let Some(items) = &node.children {`);
	lines.push(`        if let Some(first) = first_named_idx {`);
	lines.push(`            if first > 0 {`);
	lines.push(`                if let Some(before) = items.get(first - 1) {`);
	lines.push(
		`                    leading_sep = !before.named && before.text.as_deref().map_or(false, is_join_flank_token);`
	);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(`        if let Some(last) = last_named_idx {`);
	lines.push(`            if let Some(after) = items.get(last + 1) {`);
	lines.push(
		`                trailing_sep = !after.named && after.text.as_deref().map_or(false, is_join_flank_token);`
	);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`    Ok(ResolvedField::from_items(`);
	lines.push(`        children,`);
	lines.push(`        separator_for(node.type_.0),`);
	lines.push(`        leading_sep,`);
	lines.push(`        trailing_sep,`);
	lines.push(`    ))`);
	lines.push(`}`);
	return lines;
}

/**
 * Emit the `separator_for(kind_id)` match function.
 *
 * When `kindIdByKind` is provided, emits a match on numeric KindId values.
 * Otherwise emits a stub that always returns `""`.
 *
 * @param meta - Grammar metadata containing separator mappings.
 * @param kindIdByKind - Optional map from kind string to numeric KindId.
 * @returns Rust source lines for the separator lookup function.
 */
function renderSeparatorLookup(meta: MetaData, kindIdByKind?: ReadonlyMap<string, number>): string[] {
	const lines: string[] = [];
	if (kindIdByKind !== undefined) {
		// Phase C: NodeData.type_ is KindId (u16). Match on numeric IDs.
		// T016: Deduplicate match arms — alias-collapsed kinds that share the same
		// KindId emit only the first arm.
		lines.push(`pub(crate) fn separator_for(kind_id: u16) -> &'static str {`);
		lines.push(`    match kind_id {`);
		const emittedSepIds = new Set<number>();
		for (const [k, s] of Array.from(meta.separators.entries()).sort(([a], [b]) => a.localeCompare(b))) {
			const id = kindIdByKind.get(k);
			if (id !== undefined) {
				if (emittedSepIds.has(id)) continue; // T016: skip duplicate KindId
				emittedSepIds.add(id);
				lines.push(`        ${id} => ${JSON.stringify(s)}, // ${JSON.stringify(k)}`);
			}
		}
		lines.push(`        _ => "",`);
		lines.push(`    }`);
		lines.push(`}`);
	} else {
		lines.push(`pub(crate) fn separator_for(_kind_id: u16) -> &'static str {`);
		lines.push(`    ""`);
		lines.push(`}`);
	}
	return lines;
}

/**
 * Emit the `variant_for(parent_id, child_id)` match function, along with
 * `first_named_child_kind_id` and `resolve_variant`.
 *
 * When `kindIdByKind` is provided, emits a match on numeric (parent, child)
 * KindId pairs. Otherwise emits stubs that always return `None` / `""`.
 *
 * @param meta - Grammar metadata containing variant mappings.
 * @param kindIdByKind - Optional map from kind string to numeric KindId.
 * @returns Rust source lines for the variant lookup functions.
 */
function renderVariantLookup(meta: MetaData, kindIdByKind?: ReadonlyMap<string, number>): string[] {
	const lines: string[] = [];
	if (kindIdByKind !== undefined) {
		lines.push(`pub(crate) fn variant_for(parent_id: u16, child_id: u16) -> Option<&'static str> {`);
		lines.push(`    match (parent_id, child_id) {`);
		const sortedVariants: [string, string, string][] = [];
		for (const [parent, map] of meta.variants) {
			for (const [child, label] of map) sortedVariants.push([parent, child, label]);
		}
		sortedVariants.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
		const emittedVariantPairs = new Set<string>();
		for (const [parent, child, label] of sortedVariants) {
			const parentId = kindIdByKind.get(parent);
			const childId = kindIdByKind.get(child);
			if (parentId !== undefined && childId !== undefined) {
				const pairKey = `${parentId},${childId}`;
				if (emittedVariantPairs.has(pairKey)) continue; // T016: skip duplicate pair
				emittedVariantPairs.add(pairKey);
				lines.push(
					`        (${parentId}, ${childId}) => Some(${JSON.stringify(label)}), // (${JSON.stringify(parent)}, ${JSON.stringify(child)})`
				);
			}
		}
		lines.push(`        _ => None,`);
		lines.push(`    }`);
		lines.push(`}`);
	} else {
		lines.push(`pub(crate) fn variant_for(_parent_id: u16, _child_id: u16) -> Option<&'static str> {`);
		lines.push(`    None`);
		lines.push(`}`);
	}
	lines.push('');
	lines.push(`pub(crate) fn first_named_child_kind_id(node: &NodeData) -> Option<u16> {`);
	lines.push(`    node.children.as_ref()?.iter().find(|child| child.named).map(|child| child.type_.0)`);
	lines.push(`}`);
	lines.push('');
	lines.push(`pub(crate) fn resolve_variant(node: &NodeData) -> &'static str {`);
	lines.push(`    first_named_child_kind_id(node)`);
	lines.push(`        .and_then(|child_id| variant_for(node.type_.0, child_id))`);
	lines.push(`        .unwrap_or("")`);
	lines.push(`}`);
	return lines;
}

/**
 * Emit the `token_shaped_fallback` function — renders nodes that have no
 * dedicated template by concatenating anonymous child text.
 *
 * @returns Rust source lines for the token-shaped fallback function.
 */
function renderTokenFallback(): string[] {
	const lines: string[] = [];
	lines.push(`pub(crate) fn token_shaped_fallback(node: &NodeData) -> Result<String, ::askama::Error> {`);
	lines.push(`    let mut buf = String::new();`);
	lines.push(`    token_shaped_fallback_into(node, &mut buf)?;`);
	lines.push(`    Ok(buf)`);
	lines.push(`}`);
	return lines;
}

function renderTokenFallbackInto(): string[] {
	const lines: string[] = [];
	lines.push(
		`pub(crate) fn token_shaped_fallback_into(node: &NodeData, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`
	);
	lines.push(`    let fields_all_anon = node.fields.as_ref().map_or(true, |fields| {`);
	lines.push(`        fields.values().all(|value| match value {`);
	lines.push(`            FieldValue::Single(item) => !item.named,`);
	lines.push(`            FieldValue::Multiple(items) => items.iter().all(|item| !item.named),`);
	lines.push(`            FieldValue::Text(_) => true,`);
	lines.push(`        })`);
	lines.push(`    });`);
	lines.push(
		`    let children_all_anon = node.children.as_ref().map_or(true, |children| children.iter().all(|child| !child.named));`
	);
	lines.push(`    if fields_all_anon && children_all_anon {`);
	lines.push(`        if let Some(text) = &node.text {`);
	lines.push(`            return dest.write_str(text).map_err(::askama::Error::from);`);
	lines.push(`        }`);
	lines.push(`        let mut wrote_any = false;`);
	lines.push(`        if let Some(fields) = &node.fields {`);
	lines.push(`            for value in fields.values() {`);
	lines.push(`                match value {`);
	lines.push(`                    FieldValue::Single(item) => {`);
	lines.push(`                        if let Some(text) = &item.text {`);
	lines.push(`                            dest.write_str(text).map_err(::askama::Error::from)?;`);
	lines.push(`                            wrote_any = true;`);
	lines.push(`                        }`);
	lines.push(`                    }`);
	lines.push(`                    FieldValue::Multiple(items) => {`);
	lines.push(`                        for item in items {`);
	lines.push(`                            if let Some(text) = &item.text {`);
	lines.push(`                                dest.write_str(text).map_err(::askama::Error::from)?;`);
	lines.push(`                                wrote_any = true;`);
	lines.push(`                            }`);
	lines.push(`                        }`);
	lines.push(`                    }`);
	lines.push(`                    FieldValue::Text(text) => {`);
	lines.push(`                        dest.write_str(text).map_err(::askama::Error::from)?;`);
	lines.push(`                        wrote_any = true;`);
	lines.push(`                    }`);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(`        if let Some(children) = &node.children {`);
	lines.push(`            for child in children {`);
	lines.push(`                if let Some(text) = &child.text {`);
	lines.push(`                    dest.write_str(text).map_err(::askama::Error::from)?;`);
	lines.push(`                    wrote_any = true;`);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(`        if wrote_any { return Ok(()); }`);
	lines.push(`    }`);
	lines.push(`    Err(::askama::Error::Custom(`);
	lines.push(`        format!("render_nodedata_into: no template for kind '{}'", node.type_).into(),`);
	lines.push(`    ))`);
	lines.push(`}`);
	return lines;
}

/**
 * Emit all direct-path support functions for the Rust render module:
 * field resolution types/helpers, separator lookup, variant lookup, and
 * token-shaped fallback.
 *
 * Delegates to {@link renderFieldResolutionHelpers},
 * {@link renderSeparatorLookup}, {@link renderVariantLookup}, and
 * {@link renderTokenFallback}.
 *
 * @param meta - Grammar metadata (separators, variants).
 * @param kindIdByKind - Optional map from kind string to numeric KindId.
 * @returns Complete Rust source string for the support section.
 */
function renderDirectSupport(meta: MetaData, kindIdByKind?: ReadonlyMap<string, number>): string {
	return [
		...renderFieldResolutionHelpers(),
		'',
		...renderSeparatorLookup(meta, kindIdByKind),
		'',
		...renderVariantLookup(meta, kindIdByKind),
		'',
		...renderTokenFallbackInto(),
		'',
		...renderTokenFallback()
	].join('\n');
}

function renderPerKindFns(structs: EmittedStruct[]): string {
	const lines: string[] = [];
	for (const s of structs) {
		lines.push(`${PER_KIND_FN_VIS}fn ${renderFnName(s.kind)}(node: &NodeData) -> Result<String, ::askama::Error> {`);
		const consumedFieldArgs =
			s.fields.length === 0 ? '&[]' : `&[${s.fields.map((field) => JSON.stringify(field.name)).join(', ')}]`;
		lines.push(`    let children = resolve_children(node, ${consumedFieldArgs})?;`);
		for (const [index, f] of s.fields.entries()) {
			lines.push(`    let field_${index} = resolve_field(node, ${JSON.stringify(f.name)}, ${f.required})?;`);
		}
		if (s.hasVariant) {
			lines.push(`    let variant = resolve_variant(node);`);
		}
		if (s.hasText) {
			lines.push(`    let text = resolve_text(node)?;`);
		}
		// Build stack-local renderable buffers so the template can borrow
		// `Renderable::Text(&str)` views over the resolved string items.
		// `ResolvedField::items: Vec<String>` lives in this stack frame, so the
		// renderable vec borrowing from it is sound for the template's
		// lifetime.
		if (s.hasChildren) {
			lines.push(`    let children_renderables = children.renderable_items();`);
		}
		for (const [index, f] of s.fields.entries()) {
			if (f.view === 'scalar') continue;
			lines.push(`    let field_${index}_renderables = field_${index}.renderable_items();`);
		}
		lines.push(`    let template = ${s.name} {`);
		if (s.hasChildren) {
			lines.push(`        children: ListNonterminalView {`);
			lines.push(`            items: children_renderables.as_slice(),`);
			lines.push(`            separator: children.separator,`);
			lines.push(`            leading: children.leading_sep,`);
			lines.push(`            trailing: children.trailing_sep,`);
			lines.push(`        },`);
		}
		if (s.hasVariant) {
			lines.push(`        variant,`);
		}
		if (s.hasText) {
			lines.push(`        text: text.as_str(),`);
		}
		for (const [index, f] of s.fields.entries()) {
			const rIdent = rustFieldIdent(f.name);
			if (f.view === 'list' || (f.view === 'field' && f.multiple)) {
				// Always-list slot.
				lines.push(`        ${rIdent}: ListNonterminalView {`);
				lines.push(`            items: field_${index}_renderables.as_slice(),`);
				lines.push(`            separator: field_${index}.separator,`);
				lines.push(`            leading: field_${index}.leading_sep,`);
				lines.push(`            trailing: field_${index}.trailing_sep,`);
				lines.push(`        },`);
			} else if (f.required) {
				// Required scalar (view='scalar' or single-valued field-view).
				lines.push(
					`        ${rIdent}: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_${index}.as_scalar())),`
				);
			} else {
				// Optional scalar — use ResolvedField.kind to gate Missing vs Present.
				lines.push(`        ${rIdent}: match field_${index}.kind {`);
				lines.push(`            ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,`);
				lines.push(
					`            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_${index}.as_scalar())),`
				);
				lines.push(`        },`);
			}
		}
		lines.push(`    };`);
		lines.push(`    template.render()`);
		lines.push(`}`);
		lines.push('');
	}
	return lines.join('\n');
}

function renderDispatchFn(_structs: EmittedStruct[], _kindIdByKind?: ReadonlyMap<string, number>): string {
	const lines: string[] = [];
	lines.push(`pub fn render_dispatch(node: &NodeData) -> Result<String, ::askama::Error> {`);
	lines.push(`    let mut buf = String::new();`);
	lines.push(`    render_nodedata_into(node, &mut buf)?;`);
	lines.push(`    Ok(buf)`);
	lines.push(`}`);
	return lines.join('\n');
}

function renderNodedataIntoFn(structs: EmittedStruct[], kindIdByKind?: ReadonlyMap<string, number>): string {
	const lines: string[] = [];
	lines.push(
		`pub fn render_nodedata_into(node: &NodeData, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`
	);
	lines.push(`    if node.fields.is_none() && node.children.is_none() {`);
	lines.push(`        if let Some(text) = &node.text {`);
	lines.push(`            return dest.write_str(text).map_err(::askama::Error::from);`);
	lines.push(`        }`);
	lines.push(`    }`);
	if (kindIdByKind !== undefined) {
		const emittedDispatchIds = new Set<number>();
		lines.push(`    match node.type_.0 {`);
		for (const s of structs) {
			const kindAliases: string[] = [s.kind];
			if (s.kind.startsWith('_')) {
				const visible = s.kind.replace(/^_+/, '');
				if (kindIdByKind.has(visible)) kindAliases.push(visible);
			}
			const ids = new Set(kindAliases.map((k) => kindIdByKind.get(k)).filter((id): id is number => id !== undefined));
			if (ids.size === 0) continue;
			const newIds = [...ids].filter((id) => !emittedDispatchIds.has(id));
			if (newIds.length === 0) continue;
			for (const id of ids) emittedDispatchIds.add(id);
			const patternParts = [...ids].map((id) => String(id));
			const comment = kindAliases.map((k) => JSON.stringify(k)).join(' | ');
			lines.push(`        ${patternParts.join(' | ')} => { // ${comment}`);
			lines.push(...renderInlinedMatchArm(s));
			lines.push(`        }`);
		}
		lines.push(`        _ => token_shaped_fallback_into(node, dest),`);
	} else {
		lines.push(`    match node.type_.0 {`);
		lines.push(`        _ => token_shaped_fallback_into(node, dest),`);
	}
	lines.push(`    }`);
	lines.push(`}`);
	return lines.join('\n');
}

function renderInlinedMatchArm(s: EmittedStruct): string[] {
	const lines: string[] = [];
	const indent = '            ';
	const consumedFieldArgs =
		s.fields.length === 0 ? '&[]' : `&[${s.fields.map((field) => JSON.stringify(field.name)).join(', ')}]`;
	lines.push(`${indent}let children = resolve_children(node, ${consumedFieldArgs})?;`);
	for (const [index, f] of s.fields.entries()) {
		lines.push(`${indent}let field_${index} = resolve_field(node, ${JSON.stringify(f.name)}, ${f.required})?;`);
	}
	if (s.hasVariant) lines.push(`${indent}let variant = resolve_variant(node);`);
	if (s.hasText) lines.push(`${indent}let text = resolve_text(node)?;`);
	if (s.hasChildren) lines.push(`${indent}let children_renderables = children.renderable_items();`);
	for (const [index, f] of s.fields.entries()) {
		if (f.view === 'scalar') continue;
		lines.push(`${indent}let field_${index}_renderables = field_${index}.renderable_items();`);
	}
	lines.push(`${indent}let template = ${s.name} {`);
	if (s.hasChildren) {
		lines.push(`${indent}    children: ListNonterminalView {`);
		lines.push(`${indent}        items: children_renderables.as_slice(),`);
		lines.push(`${indent}        separator: children.separator,`);
		lines.push(`${indent}        leading: children.leading_sep,`);
		lines.push(`${indent}        trailing: children.trailing_sep,`);
		lines.push(`${indent}    },`);
	}
	if (s.hasVariant) lines.push(`${indent}    variant,`);
	if (s.hasText) lines.push(`${indent}    text: text.as_str(),`);
	for (const [index, f] of s.fields.entries()) {
		const rIdent = rustFieldIdent(f.name);
		if (f.view === 'list' || (f.view === 'field' && f.multiple)) {
			lines.push(`${indent}    ${rIdent}: ListNonterminalView {`);
			lines.push(`${indent}        items: field_${index}_renderables.as_slice(),`);
			lines.push(`${indent}        separator: field_${index}.separator,`);
			lines.push(`${indent}        leading: field_${index}.leading_sep,`);
			lines.push(`${indent}        trailing: field_${index}.trailing_sep,`);
			lines.push(`${indent}    },`);
		} else if (f.required) {
			lines.push(
				`${indent}    ${rIdent}: SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_${index}.as_scalar())),`
			);
		} else {
			lines.push(`${indent}    ${rIdent}: match field_${index}.kind {`);
			lines.push(`${indent}        ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,`);
			lines.push(
				`${indent}        ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_${index}.as_scalar())),`
			);
			lines.push(`${indent}    },`);
		}
	}
	lines.push(`${indent}};`);
	lines.push(`${indent}template.render_into(dest)`);
	return lines;
}

// ----------------------------------------------------------------------
// Direct-render metadata collection
// ----------------------------------------------------------------------

interface MetaData {
	separators: Map<string, string>; // kind → separator
	listContainers: Set<string>;
	variants: Map<string, Map<string, string>>; // parentKind → (childKind → label)
}

function collectMetaData(nodeMap: NodeMap): MetaData {
	const separators = new Map<string, string>();
	const listContainers = new Set<string>();
	const variants = new Map<string, Map<string, string>>();
	for (const [kind, node] of nodeMap.nodes) {
		if (!node.userFacing) continue;
		// Separator — derive from ALL branches and groups, not just
		// container-shaped ones. Non-container branches (e.g. `parameters`,
		// `arguments`, `field_declaration_list`) carry repeat separators
		// inside their simplified rule that `findRepeatSeparator` extracts.
		// The prior code only checked `isContainerShape` branches, causing
		// the transport render path to use "" for 138+ kinds that need ","
		// or other separators.
		if (node instanceof AssembledBranch) {
			const sep = node.separator ?? findRepeatSeparator(node.simplifiedRule);
			if (sep !== undefined) separators.set(kind, sep);
			// Every container-shape branch with children is a list-container.
			if (node.isContainerShape) {
				const childCount = node.children?.length ?? 0;
				if (childCount > 0) listContainers.add(kind);
			}
		} else if (node instanceof AssembledGroup) {
			const sep = findRepeatSeparator(node.simplifiedRule);
			if (sep !== undefined) separators.set(kind, sep);
		}
		// Variant-branching polymorphs — `variantChildKinds` holds the
		// ordered list of alias-target kinds. Map each child kind to the
		// form name (short label) so render_dispatch / templates match
		// on the same string the TS side emits via readTreeNode's
		// $variant enrichment.
		if (node instanceof AssembledPolymorph) {
			const map = new Map<string, string>();
			for (const form of node.forms) {
				// Map form.parentKind's primary child-symbol (form.name's
				// alias source) → form.name. The tagging is approximate:
				// we lean on form.name which is the short label the
				// template's `variant == "xxx"` chain compares against.
				map.set(form.kind, form.name);
				// If this form wraps a single variant child, register the
				// alias-target kind too so runtime dispatch hits either
				// spelling.
			}
			for (const childKind of node.variantChildKinds) {
				// Heuristic pairing: first form that hasn't been paired
				// yet with a variantChildKind.
				if (!map.has(childKind)) {
					const unpaired = node.forms.find((f) => !Array.from(map.values()).includes(f.name) || true);
					if (unpaired) map.set(childKind, unpaired.name);
				}
			}
			if (map.size > 0) variants.set(kind, map);
		}
	}
	return { separators, listContainers, variants };
}

// ----------------------------------------------------------------------
// Slot classification — single source for slot type width
// ----------------------------------------------------------------------

/**
 * Classify a slot for emit purposes — same as `classifySlot` but also:
 * - resolves `concrete` using the assembled typeName (PascalCase)
 * - downgrades `concrete` to `heterogeneous` when the single kind maps to a
 *   multi node (no transport struct) or polymorph (no ToNapiValue in Phase 1)
 * - classifies multi-kind slots as `supertype` when they match an assembled
 *   supertype's subtypes (Phase 2)
 *
 * @param kinds - the kind set for this slot
 * @param nodeMap - for modelType lookup + supertype map construction
 */
function classifySlotForEmit(kinds: readonly string[], nodeMap: NodeMap): SlotClass {
	const supertypeMap = buildSupertypeTransportSet(nodeMap);
	const cls = classifySlot(kinds, supertypeMap);
	if (cls.tag === 'concrete') {
		const node = nodeMap.nodes.get(cls.kind);
		if (node === undefined) return { tag: 'heterogeneous' }; // unknown kind — no transport struct, use bare AnyTransport
		if (node.modelType === 'multi') {
			// Multi nodes have no transport struct — fall back to bare AnyTransport.
			return { tag: 'heterogeneous' };
		}
		if (node.modelType === 'supertype') {
			// A single-kind slot whose kind IS a supertype: classify as supertype
			// (the concrete kind IS the supertype itself). Use its typeName.
			// Skip when the enum name is reserved (e.g. 'LiteralTransport').
			const enumName = `${rustTypeIdent(node.typeName)}Transport`;
			if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) return { tag: 'heterogeneous' };
			return { tag: 'supertype', supertypeName: node.typeName };
		}
		if (node.modelType === 'polymorph') {
			// Polymorph transport enums do not implement `ToNapiValue` in Phase 1
			// (only a custom `FromNapiValue` is emitted). Struct fields with
			// `#[napi(object)]` require `ToNapiValue` for every field type.
			// Downgrade to heterogeneous (bare AnyTransport, which has both traits).
			return { tag: 'heterogeneous' };
		}
		// Concrete node: use the assembled typeName (PascalCase, leading-underscore-
		// stripped by the assemble phase). This ensures the render fn name and
		// struct type name match what renderTypedLeafFn / renderTypedBranchFn emit
		// (both use node.typeName). Hidden kinds like `_kw_abstract_marker` have
		// typeName `KwAbstractMarker` — using kind would produce double-underscore
		// render fn names that don't match.
		return { tag: 'concrete', kind: cls.kind, typeName: node.typeName };
	}
	// `supertype`: downgrade to heterogeneous when enum name is reserved.
	// `heterogeneous`: pass through unchanged.
	if (cls.tag === 'supertype') {
		const enumName = `${rustTypeIdent(cls.supertypeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) return { tag: 'heterogeneous' };
	}
	return cls;
}

/**
 * Build a Rust expression that renders a single transport value to `String`.
 * Single source for all render call sites — field scalar, field list item,
 * children item.
 *
 * @param cls  - slot classification from `classifySlot` or `classifySlotForEmit`
 * @param expr - Rust expression yielding the reference to render.
 *               For concrete: `&node.field` (no Box deref needed).
 *               For supertype: `&node.field` (reference to enum, no Box deref).
 *               For heterogeneous: `t.as_ref()` (Box deref).
 */
function buildSlotRenderCall(cls: SlotClass, expr: string): string {
	switch (cls.tag) {
		case 'concrete':
			// Use typeName (PascalCase, no leading underscore) so the generated
			// fn call matches what renderTypedLeafFn/renderTypedBranchFn emit.
			// Example: _kw_abstract_marker → typeName=KwAbstractMarker →
			// render_kw_abstract_marker (NOT render__kw_…).
			return `render_${rustSnakeIdent(cls.typeName)}(${expr})`;
		case 'supertype':
			return `render_${rustSnakeIdent(cls.supertypeName)}(${expr})`;
		case 'heterogeneous':
			if (cls.useBox === true) {
				// Box<AnyTransport> single-value fallback — deref through Box to reach
				// &AnyTransport: &dyn RenderableTransport.
				return `${expr}.as_ref().render_to_string()`;
			}
			// Per-slot child enum — implements RenderableTransport directly.
			return `${expr}.render_to_string()`;
		default:
			return assertNever(cls);
	}
}

/**
 * Like `buildSlotRenderCall` but emits a `write`-to-dest statement
 * instead of a String-returning expression. Used by the streaming
 * fallback branch render fn.
 *
 * @param cls  - slot classification
 * @param expr - Rust expression for the slot value
 */
function buildSlotWriteCall(cls: SlotClass, expr: string): string {
	switch (cls.tag) {
		case 'concrete':
			return `render_${rustSnakeIdent(cls.typeName)}(${expr}, dest)?;`;
		case 'supertype':
			return `render_${rustSnakeIdent(cls.supertypeName)}(${expr}, dest)?;`;
		case 'heterogeneous':
			if (cls.useBox === true) {
				return `${expr}.as_ref().render_into(dest)?;`;
			}
			return `${expr}.render_into(dest)?;`;
		default:
			return assertNever(cls);
	}
}

// ----------------------------------------------------------------------
// Typed transport dispatch — render_transport_dispatch + per-kind fns
// ----------------------------------------------------------------------

/**
 * Emit per-kind `render_<kind>` functions, per-supertype render
 * helpers, plus the top-level `render_transport_dispatch` that routes
 * `&AnyTransport` to the right fn.
 *
 * Each per-kind fn builds the `*Template` struct directly from the typed
 * transport fields (no `NodeData` round-trip) and writes directly into a
 * caller-provided `&mut dyn fmt::Write` via `template.render_into(dest)`.
 * This is the direct render path introduced by Task 4 of the renderable-
 * native-views plan.
 *
 * Per-supertype render helpers are emitted AFTER all per-kind fns so every
 * concrete subtype render fn is already declared when the supertype match arm
 * references it.
 *
 * The `render_dispatch(&NodeData)` path is retained as the inverse bridge
 * for callers that resolve through `NodeData` rather than typed transport.
 *
 * @param usedSupertypeNames - supertype typeNames actually used as slot types;
 *   only these get render helpers emitted. Passed from renderTransportSupport
 *   (single derivation, DRY).
 */
function renderTypedDispatch(
	structs: EmittedStruct[],
	nodes: readonly AssembledNode[],
	literals: readonly TransportLiteral[],
	meta: MetaData,
	nodeMap: NodeMap,
	usedSupertypeNames: ReadonlySet<string> = new Set()
): string[] {
	const structsByKind = new Map(structs.map((s) => [s.kind, s]));
	const lines: string[] = [];

	// ---- per-kind fns ----------------------------------------------------
	for (const node of nodes) {
		lines.push(...renderTypedKindFn(node, structsByKind, meta, nodeMap));
	}

	// ---- per-supertype render helpers ------------------------------------
	// Emitted AFTER per-kind fns so subtype render fns are in scope.
	for (const [, node] of nodeMap.nodes) {
		if (node.modelType !== 'supertype') continue;
		if (!usedSupertypeNames.has(node.typeName)) continue;
		// Skip when enum name is reserved (mirrors the guard in renderTransportSupport).
		const enumName = `${rustTypeIdent(node.typeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		lines.push(...emitSupertypeRenderHelper(node as AssembledSupertype, nodeMap));
	}

	// ---- render_transport_dispatch ---------------------------------------
	// Delegates to render_into so all dispatch logic lives in one place.
	// render_into writes leaf text directly (no String intermediate) and
	// dispatches branch nodes through their Askama template fns. This
	// function is retained as the `pub fn -> String` entry point for callers
	// that need an owned String (e.g. render_transport, parity tests).
	lines.push(`pub fn render_transport_dispatch(transport: &AnyTransport) -> Result<String, ::askama::Error> {`);
	lines.push(`    let mut s = String::new();`);
	lines.push(`    transport.render_into(&mut s)?;`);
	lines.push(`    Ok(s)`);
	lines.push(`}`);
	lines.push('');

	// ---- impl RenderableTransport for AnyTransport -----------------------
	// Heterogeneous (Box<AnyTransport>) slots call .render_to_string() instead
	// of render_transport_dispatch(...) directly.
	//
	// Per-kind node arms delegate to the per-kind render fn (same as dispatch).
	// Literal unit variant arms write static text directly via dest.write_str —
	// no String allocation, no call through render_transport_dispatch.
	lines.push(`impl RenderableTransport for AnyTransport {`);
	lines.push(`    fn render_into(`);
	lines.push(`        &self,`);
	lines.push(`        dest: &mut dyn ::std::fmt::Write,`);
	lines.push(`    ) -> Result<(), ::askama::Error> {`);
	lines.push(`        match self {`);
	for (const node of nodes) {
		const variant = rustTransportVariantName(node);
		const isLeafLikeNode = node.modelType === 'pattern' || node.modelType === 'keyword' || node.modelType === 'token';
		if (isLeafLikeNode) {
			// Leaf/keyword/token: route through render_into so render_with_trivia! fires.
			lines.push(`            AnyTransport::${variant}(t) => t.render_into(dest),`);
		} else if (node instanceof AssembledEnum) {
			// Multi-member enum: delegate to its RenderableTransport impl which
			// writes the static text directly via dest.write_str(match self {...}).
			lines.push(`            AnyTransport::${variant}(t) => t.render_into(dest),`);
		} else {
			// Branch/container/group/polymorph: delegate to per-kind render fn
			// which writes directly into dest (streaming — no String intermediate).
			const fnName = rustTypedRenderFnName(node.typeName);
			lines.push(`            AnyTransport::${variant}(t) => ${fnName}(t, dest),`);
		}
	}
	for (const [index, literal] of literals.entries()) {
		const variant = rustLiteralTransportVariantName(literal, index);
		// Literal unit variant — static text known at codegen time; write directly.
		lines.push(
			`            AnyTransport::${variant} => dest.write_str(${JSON.stringify(literal.text)}).map_err(::askama::Error::from),`
		);
	}
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');

	return lines;
}

/** Rust function name for the typed render fn of a given typeName. */
function rustTypedRenderFnName(typeName: string): string {
	return `render_${rustSnakeIdent(typeName)}`;
}

/**
 * Emit the `render_<kind>(t: &<Kind>Transport, dest: &mut dyn fmt::Write)`
 * function for a single node. Dispatches based on modelType:
 *
 * - polymorph → match on enum variants, delegate to per-form fns
 * - branch / container / group → build template struct, render_into(dest)
 * - leaf / keyword / token / enum → write text directly to dest
 */
function renderTypedKindFn(
	node: AssembledNode,
	structsByKind: Map<string, EmittedStruct>,
	meta: MetaData,
	nodeMap: NodeMap
): string[] {
	if (node.modelType === 'polymorph' && node.forms.length > 0) {
		return renderTypedPolymorphFn(node, structsByKind, meta, nodeMap);
	}

	switch (node.modelType) {
		case 'branch':
		case 'group': {
			const struct = structsByKind.get(node.kind);
			if (struct === undefined) {
				// No template for this kind — fall back to joining children/text.
				return renderTypedBranchFallbackFn(node, nodeMap);
			}
			return renderTypedBranchFn(node, struct, meta, nodeMap);
		}
		case 'pattern':
		case 'keyword':
		case 'token':
		case 'enum':
			return renderTypedLeafFn(node);
		default:
			return [];
	}
}

/**
 * Emit a fallback typed render fn for branch/container/group nodes that
 * have no template struct (no `.jinja` file). Writes children directly
 * into dest, or falls back to writing `transport_text` if there are no
 * children.
 */
function renderTypedBranchFallbackFn(node: AssembledNode, nodeMap: NodeMap): string[] {
	const fnName = rustTypedRenderFnName(node.typeName);
	const structName = rustTransportStructName(node);
	const hasChildren = hasRequiredChild(structuralChildrenOf(node)) || structuralChildrenOf(node).length > 0;
	const lines: string[] = [];
	lines.push(`fn ${fnName}(node: &${structName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
	if (hasChildren) {
		const childrenIsRequired = hasRequiredChild(structuralChildrenOf(node));
		const childrenIsMultiple = hasMultipleChildren(structuralChildrenOf(node));
		const childrenCls = classifySlotFromChildren(structuralChildrenOf(node), nodeMap);
		// For per-slot enum (heterogeneous) and concrete/supertype, all implement
		// RenderableTransport — use `child` directly as the expression.
		const childWriteCall = buildSlotWriteCall(childrenCls, 'child');
		if (childrenIsMultiple) {
			// Vec<T> — iterate, writing each child directly to dest.
			if (childrenIsRequired) {
				lines.push(`    for child in node.children.iter() {`);
				lines.push(`        ${childWriteCall}`);
				lines.push(`    }`);
				lines.push(`    Ok(())`);
			} else {
				lines.push(`    if let Some(children) = &node.children {`);
				lines.push(`        for child in children.iter() {`);
				lines.push(`            ${childWriteCall}`);
				lines.push(`        }`);
				lines.push(`    }`);
				lines.push(`    Ok(())`);
			}
		} else if (childrenIsRequired) {
			// Required bare T — render single child directly into dest.
			const singleExpr = childrenCls.tag === 'heterogeneous' ? 'node.children' : '&node.children';
			const singleWriteCall = buildSlotWriteCall(childrenCls, singleExpr);
			lines.push(`    ${singleWriteCall}`);
			lines.push(`    Ok(())`);
		} else {
			// Optional T — if let Some.
			const childWriteCallInner = buildSlotWriteCall(childrenCls, 'child');
			lines.push(`    if let Some(child) = &node.children {`);
			lines.push(`        ${childWriteCallInner}`);
			lines.push(`    }`);
			lines.push(`    Ok(())`);
		}
	} else {
		lines.push(`    dest.write_str(node.transport_text.as_deref().unwrap_or_default()).map_err(::askama::Error::from)`);
	}
	lines.push(`}`);
	lines.push('');
	return lines;
}

/**
 * Emit a simple leaf/keyword/token/enum typed render fn that writes the
 * transport text directly into dest.
 *
 * For `enum` modelType nodes: transport is the Rust enum; write via `Display`
 * (`t.to_string()`).
 * For all others: write `t.text` directly.
 */
function renderTypedLeafFn(node: AssembledNode): string[] {
	const fnName = rustTypedRenderFnName(node.typeName);
	const typeName = rustTransportStructName(node);
	const body =
		node instanceof AssembledEnum
			? `dest.write_str(&t.to_string()).map_err(::askama::Error::from)`
			: `dest.write_str(&t.text).map_err(::askama::Error::from)`;
	return [
		`fn ${fnName}(t: &${typeName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`,
		`    ${body}`,
		`}`,
		``
	];
}

/**
 * Emit a polymorph typed render fn that matches on the enum variant and
 * delegates to per-form fns, then emits each per-form fn.
 */
function renderTypedPolymorphFn(
	node: Extract<AssembledNode, { modelType: 'polymorph' }>,
	structsByKind: Map<string, EmittedStruct>,
	meta: MetaData,
	nodeMap: NodeMap
): string[] {
	const lines: string[] = [];
	const fnName = rustTypedRenderFnName(node.typeName);
	const structName = rustTransportStructName(node);

	lines.push(`fn ${fnName}(t: &${structName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
	lines.push(`    match t {`);
	for (const form of node.forms) {
		const formVariant = rustTransportFormVariantName(form);
		const formFn = rustTypedRenderFnName(form.typeName);
		lines.push(`        ${structName}::${formVariant}(data) => ${formFn}(data, dest),`);
	}
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');

	// Per-form fns — look up the form's kind in structsByKind
	for (const form of node.forms) {
		const formStruct = structsByKind.get(node.kind) ?? undefined;
		// Forms share the parent's template struct (same kind → same template)
		// so we build using the form's fields against the parent struct.
		lines.push(...renderTypedFormFn(node.kind, form, formStruct, meta, nodeMap));
	}

	return lines;
}

/**
 * Build a name→projection.kinds map from a list of assembled fields.
 * Used to feed `classifySlot` per field in `buildTypedTemplateBody`.
 *
 * @param fields - the node's structural fields
 */
function buildFieldKindsByName(fields: readonly AssembledNonterminal[]): ReadonlyMap<string, readonly string[]> {
	const map = new Map<string, readonly string[]>();
	for (const f of fields) {
		map.set(f.name, kindsOf(f));
	}
	return map;
}

/**
 * Classify the children slot of a node from its structural children list.
 * Merges kind sets across all child entries (a node can have multiple child
 * slots) and classifies the union.
 *
 * Uses `classifySlotForEmit` — downgrades supertype/multi concrete slots to
 * heterogeneous (no Phase 1 transport type for those).
 *
 * @param children - the node's structural children
 * @param nodeMap - for supertype/multi detection
 */
function classifySlotFromChildren(children: readonly AssembledNonterminal[], nodeMap: NodeMap): SlotClass {
	const allKinds = [...new Set(children.flatMap((c) => deriveChildrenKinds(c)))];
	const cls = classifySlotForEmit(allKinds, nodeMap);
	// When the slot classifies as heterogeneous, mark whether all child kinds are
	// supertypes/polymorphs/multi (useBox=true → Box<AnyTransport> fallback) or
	// at least one has a concrete transport struct (useBox=false → per-slot enum).
	if (cls.tag === 'heterogeneous') {
		return { tag: 'heterogeneous', useBox: !hasAnyConcreteChildKind(allKinds, nodeMap) };
	}
	return cls;
}

/**
 * Emit a branch/container/group typed render fn that builds the template
 * struct from the typed transport fields.
 */
function renderTypedBranchFn(node: AssembledNode, struct: EmittedStruct, meta: MetaData, nodeMap: NodeMap): string[] {
	const lines: string[] = [];
	const fnName = rustTypedRenderFnName(node.typeName);
	const structName = rustTransportStructName(node);
	const separator = meta.separators.get(node.kind) ?? '';

	// Build per-field kind maps for typed render call selection (Phase 1).
	const fieldKindsByName = buildFieldKindsByName(structuralFieldsOf(node));
	const childrenCls = classifySlotFromChildren(structuralChildrenOf(node), nodeMap);

	lines.push(`fn ${fnName}(node: &${structName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
	lines.push(...buildTypedTemplateBody(struct, separator, fieldKindsByName, childrenCls, nodeMap));
	lines.push(`}`);
	lines.push('');

	return lines;
}

/**
 * Emit a polymorph-form typed render fn that builds the parent kind's
 * template struct from the form's typed transport fields.
 *
 * Forms always render through the PARENT kind's jinja template (there is one
 * `.jinja` file per kind, not per form). The `parentStruct` gives us the
 * correct template struct name and surface (slots / hasChildren / etc.)
 * for the instantiation; the form's fields populate the slots.
 */
function renderTypedFormFn(
	parentKind: string,
	form: AssembledGroup,
	parentStruct: EmittedStruct | undefined,
	meta: MetaData,
	nodeMap: NodeMap
): string[] {
	const lines: string[] = [];
	const fnName = rustTypedRenderFnName(form.typeName);
	const structName = rustTransportFormStructName(form);
	const separator = meta.separators.get(parentKind) ?? '';

	if (parentStruct === undefined) {
		// No template for this parent kind — write nothing.
		lines.push(`fn ${fnName}(node: &${structName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
		lines.push(`    // No template for parent kind ${JSON.stringify(parentKind)} — nothing to write.`);
		lines.push(`    let _ = (node, dest);`);
		lines.push(`    Ok(())`);
		lines.push(`}`);
		lines.push('');
		return lines;
	}

	// Build an EmittedStruct that uses the PARENT template struct name but the
	// FORM's field list (so buildTypedTemplateBody instantiates the right struct
	// with the fields actually present on the form's transport type).
	//
	// Strategy: start from ALL parent template slots (every slot the template
	// struct requires must be populated). For each slot, check whether the FORM
	// has a corresponding field in its structuralFields. If yes, use the form's
	// `required` and `multiple` flags; if no, mark `hasTransportField: false` so
	// the emitter defaults that slot to empty/Missing.
	//
	// The view for each slot always comes from the PARENT struct — that
	// determines the Rust struct field type (&'a str vs NonterminalView vs ListNonterminalView).
	const formFieldByName = new Map(form.fields.map((f) => [f.name, f]));
	const formEmittedStruct: EmittedStruct = {
		name: parentStruct.name, // e.g. ClosureExpressionTemplate
		kind: parentKind,
		fields: parentStruct.fields.map((parentField) => {
			const formField = formFieldByName.get(parentField.name);
			if (formField !== undefined) {
				return {
					name: formField.name,
					// Use the parent template's view — that determines the Rust struct type.
					view: parentField.view,
					required: isRequired(formField),
					multiple: isMultiple(formField),
					hasTransportField: true,
					hasLeading: formField.hasLeading,
					hasTrailing: formField.hasTrailing
				};
			}
			// Slot present in parent template but not in this form — default
			// it. CRITICAL: inherit `required` and `multiple` from the parent
			// so the construction picks the same per-cardinality view type
			// the parent template struct declares (SingleNonterminalView /
			// OptionalNonterminalView / ListNonterminalView). The slot's
			// runtime value will be empty text / Missing / empty list — the
			// concrete cardinality wrapper just has to match.
			return {
				name: parentField.name,
				view: parentField.view,
				required: parentField.required,
				multiple: parentField.multiple,
				hasTransportField: false,
				hasLeading: false,
				hasTrailing: false
			};
		}),
		hasChildren: parentStruct.hasChildren,
		transportHasChildren: form.children.length > 0,
		childrenRequired: hasRequiredChild(form.children),
		childrenMultiple: hasMultipleChildren(form.children),
		hasVariant: parentStruct.hasVariant,
		hasText: parentStruct.hasText
	};

	// Build per-field kind maps for typed render call selection (Phase 1).
	const formFieldKindsByName = buildFieldKindsByName(form.fields);
	const formChildrenCls = classifySlotFromChildren(form.children, nodeMap);

	lines.push(`fn ${fnName}(node: &${structName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
	lines.push(...buildTypedTemplateBody(formEmittedStruct, separator, formFieldKindsByName, formChildrenCls, nodeMap));
	lines.push(`}`);
	lines.push('');

	return lines;
}

/**
 * Emit the Rust boilerplate that converts a **single-child** transport slot
 * (cardinality: multiple=false) into a `*_buf` slice ready for `ListNonterminalView`.
 *
 * For required (bare T): wraps `&node.ident` in a 1-element stack array and
 * coerces to `&[Renderable]` via `std::slice::from_ref`. No heap allocation.
 *
 * For optional (Option<T>): maps to `Option<Renderable>` and uses
 * `Option::as_slice()` (stable ≥ Rust 1.75) for a zero-allocation `&[Renderable]`
 * (empty when None, 1-element when Some).
 *
 * @param ident    - Rust identifier base (e.g. `"children"`)
 * @param required - When `true`, the slot type is `T`; when `false` it is `Option<T>`.
 * @param cls      - slot classification (Rust auto-coerces `&T` to `&dyn RT`).
 */
/**
 * Fully-qualified prefix for the core `Renderable` enum.
 *
 * This module defines a local `pub enum Renderable` (Text+Joined) that
 * shadows `sittir_core::filters::Renderable` (Text+Joined+Transport).
 * The typed dispatch path constructs `::sittir_core::filters::Renderable::Transport`
 * values that feed into `ListNonterminalView.items`, so the full path is
 * required to avoid resolving to the wrong local type.
 */
const RENDERABLE_PREFIX = '::sittir_core::filters::';

/**
 * Emit the iter/map/collect pattern that wraps each element in
 * `Renderable::Transport`. Shared by both single-child and list-slot
 * buffer emitters.
 *
 * @param ident      - Rust identifier base (e.g. `"children"`, `"parameters"`)
 * @param sourceExpr - The iterable expression to `.iter()` over
 * @param mapBody    - The closure body inside `.map(|t| ...)` (e.g. `Renderable::Transport(t)`)
 */
function emitIterCollectBuffer(ident: string, sourceExpr: string, mapBody: string): string[] {
	const R = RENDERABLE_PREFIX;
	return [
		`    let ${ident}_buf: Vec<${R}Renderable<'_>> = ${sourceExpr}.iter()`,
		`        .map(|t| ${mapBody})`,
		`        .collect();`
	];
}

/**
 * Emit the Rust boilerplate that converts a single-child transport slot
 * into a `*_buf: Vec<Renderable>` ready for `ListNonterminalView`.
 *
 * For required (T): wraps the single value in a `vec![...]`.
 *
 * For optional (Option<T>): uses `.iter().map(...).collect()` which
 * produces a 0-or-1-element Vec. This avoids `std::slice::from_ref` /
 * `Option::as_slice()` which trigger the `str_as_str` unstable feature
 * (issue #130366) on current stable Rust.
 *
 * @param ident    - Rust identifier base (e.g. `"children"`)
 * @param required - When `true`, the slot type is `T`; when `false` it is `Option<T>`.
 * @param cls      - slot classification (Rust auto-coerces `&T` to `&dyn RT`).
 */
function emitSingleChildBuffer(ident: string, required: boolean, cls: SlotClass = { tag: 'heterogeneous' }): string[] {
	const R = RENDERABLE_PREFIX;
	// useBox=true: type is Box<AnyTransport> — use .as_ref() to deref through Box.
	// All other paths (per-slot enum, concrete, supertype): Rust auto-coerces
	// &T to &dyn RenderableTransport when all types implement the trait.
	const isBox = cls.tag === 'heterogeneous' && cls.useBox === true;
	if (isBox) {
		if (required) {
			return [
				`    let ${ident}_buf: Vec<${R}Renderable<'_>> = vec![${R}Renderable::Transport(node.${ident}.as_ref())];`
			];
		}
		return emitIterCollectBuffer(ident, `node.${ident}`, `${R}Renderable::Transport(t.as_ref())`);
	}
	if (required) {
		return [`    let ${ident}_buf: Vec<${R}Renderable<'_>> = vec![${R}Renderable::Transport(&node.${ident})];`];
	}
	return emitIterCollectBuffer(ident, `node.${ident}`, `${R}Renderable::Transport(t)`);
}

/**
 * Emit the Rust boilerplate that converts a list-shaped transport slot into a
 * `*_buf: Vec<Renderable>` ready for `ListNonterminalView`.
 *
 * Concrete, supertype, and heterogeneous slots all share one path:
 * `Renderable::Transport(t)` — every concrete transport struct, supertype
 * enum, and `AnyTransport` implements `RenderableTransport`, so Rust
 * auto-coerces `&T` to `&dyn RenderableTransport` and no explicit cast is
 * needed.
 *
 * @param ident - Rust identifier base (e.g. `"children"`, `"parameters"`).
 * @param required - When `true`, the slot is a required Vec; when `false`
 *   it is `Option<Vec<...>>` and needs `as_deref()`.
 * @returns Lines to splice into the parent function body.
 */
function emitListSlotBuffer(ident: string, required: boolean): string[] {
	const R = RENDERABLE_PREFIX;
	const mapBody = `${R}Renderable::Transport(t)`;
	if (required) {
		return emitIterCollectBuffer(ident, `node.${ident}`, mapBody);
	}
	return [
		`    let ${ident}_owned = node.${ident}.as_deref().unwrap_or(&[]);`,
		...emitIterCollectBuffer(ident, `${ident}_owned`, mapBody)
	];
}

/**
 * Build the function body that constructs a template struct from typed
 * transport fields and calls `template.render_into(dest)`.
 *
 * Strategy: for every field and children slot, stream directly via
 * `Renderable::Transport(&node.field)`.  Rust auto-coerces `&T` to
 * `&dyn RenderableTransport` since every concrete transport struct and
 * supertype enum implements the trait.  This avoids the intermediate
 * `String` allocation that the old path incurred
 * (render_* → String → borrow as &str → Renderable::Text).
 *
 * Heterogeneous (Box<AnyTransport>) fields follow the same pattern using
 * `node.field.as_ref()` (Box::as_ref → &dyn RenderableTransport) — unchanged
 * from the previous Task 21 work.
 *
 * The final `template.render_into(dest)` call streams directly into the
 * caller-provided `&mut dyn fmt::Write` — no intermediate `String` allocation.
 *
 * @param struct - the template struct description
 * @param separator - the list/children separator for this kind
 * @param fieldKindsByName - per-field projection kinds (fieldName → kinds[]).
 *   Used to classify each field slot for typed render calls. Falls back to
 *   heterogeneous (Box<AnyTransport>) when a field name is absent.
 * @param childrenCls - slot classification for the children slot. Falls back
 *   to heterogeneous when not provided.
 */
function buildTypedTemplateBody(
	struct: EmittedStruct,
	separator: string,
	fieldKindsByName: ReadonlyMap<string, readonly string[]> = new Map(),
	childrenCls: SlotClass = { tag: 'heterogeneous' },
	nodeMap: NodeMap | undefined = undefined
): string[] {
	const lines: string[] = [];
	const templateName = struct.name;
	const sepLiteral = JSON.stringify(separator);
	const R = RENDERABLE_PREFIX;

	// Classify helper — use classifySlotForEmit when nodeMap is available so
	// that supertype/multi single-kind slots fall back to heterogeneous (Phase 1).
	const classify = (kinds: readonly string[]): SlotClass =>
		nodeMap !== undefined ? classifySlotForEmit(kinds, nodeMap) : classifySlot(kinds);

	// Emit children-slot buffer. For list slots (Vec<T>) use emitListSlotBuffer;
	// for single-child slots (T / Option<T>) use emitSingleChildBuffer which
	// exploits Option::as_slice() for zero-allocation feeding into ListNonterminalView.
	if (struct.hasChildren) {
		if (struct.transportHasChildren) {
			if (struct.childrenMultiple) {
				lines.push(...emitListSlotBuffer('children', struct.childrenRequired));
			} else {
				lines.push(...emitSingleChildBuffer('children', struct.childrenRequired, childrenCls));
			}
		} else {
			// Template uses children but transport has no children field —
			// emit an empty buffer so the ListNonterminalView slot in the template is empty.
			lines.push(`    let children_buf: Vec<${R}Renderable<'_>> = Vec::new();`);
		}
	}

	for (const f of struct.fields) {
		if (f.view === 'scalar') continue;
		if (!f.hasTransportField) continue;
		const rIdent = rustFieldIdent(f.name);
		if (f.view === 'list' || (f.view === 'field' && f.multiple)) {
			lines.push(...emitListSlotBuffer(rIdent, f.required));
		}
	}

	// No pre-render pass needed: concrete/supertype single-value fields are now
	// handled inline in the template construction block below via Transport coercion.

	// Build template struct — all single-value fields use Renderable::Transport.
	lines.push(`    let template = ${templateName} {`);

	if (struct.hasChildren) {
		lines.push(`        children: ListNonterminalView {`);
		lines.push(`            items: children_buf.as_slice(),`);
		lines.push(`            separator: ${sepLiteral},`);
		lines.push(`            leading: false,`);
		lines.push(`            trailing: false,`);
		lines.push(`        },`);
	}

	if (struct.hasVariant) {
		// Variant detection on typed transport is a known follow-up; default to "".
		lines.push(`        variant: "",`);
	}

	if (struct.hasText) {
		lines.push(`        text: node.transport_text.as_deref().unwrap_or(""),`);
	}

	for (const f of struct.fields) {
		const rIdent = rustFieldIdent(f.name);
		const kinds = fieldKindsByName.get(f.name) ?? [];
		const cls = classify(kinds);
		const isErased = cls.tag === 'heterogeneous';
		if (f.view === 'list' || (f.view === 'field' && f.multiple)) {
			// Always-list slot. Empty list when transport-field absent.
			const items = f.hasTransportField ? `${rIdent}_buf.as_slice()` : '&[]';
			lines.push(`        ${rIdent}: ListNonterminalView {`);
			lines.push(`            items: ${items},`);
			lines.push(`            separator: ${sepLiteral},`);
			lines.push(`            leading: false,`);
			lines.push(`            trailing: false,`);
			lines.push(`        },`);
		} else if (f.required) {
			// Required single-value slot (view='scalar' or view='field', non-list).
			if (!f.hasTransportField) {
				// Virtual presentation slot — no backing transport field.
				lines.push(`        ${rIdent}: SingleNonterminalView(${R}Renderable::Text("")),`);
			} else if (isErased) {
				// Heterogeneous single required field — type is Box<AnyTransport>.
				// Deref through Box to reach &AnyTransport: &dyn RenderableTransport.
				lines.push(`        ${rIdent}: SingleNonterminalView(${R}Renderable::Transport(node.${rIdent}.as_ref())),`);
			} else {
				// Concrete or supertype — Rust auto-coerces to &dyn RenderableTransport.
				lines.push(`        ${rIdent}: SingleNonterminalView(${R}Renderable::Transport(&node.${rIdent})),`);
			}
		} else {
			// Optional single-value slot.
			if (!f.hasTransportField) {
				lines.push(`        ${rIdent}: OptionalNonterminalView::Missing,`);
			} else if (isErased) {
				// Heterogeneous single optional field — type is Option<Box<AnyTransport>>.
				// Deref through Box to reach &AnyTransport: &dyn RenderableTransport.
				lines.push(`        ${rIdent}: match &node.${rIdent} {`);
				lines.push(`            Some(v) => OptionalNonterminalView::Present(${R}Renderable::Transport(v.as_ref())),`);
				lines.push(`            None => OptionalNonterminalView::Missing,`);
				lines.push(`        },`);
			} else {
				// Concrete or supertype — Rust auto-coerces to &dyn RenderableTransport.
				lines.push(`        ${rIdent}: match &node.${rIdent} {`);
				lines.push(`            Some(v) => OptionalNonterminalView::Present(${R}Renderable::Transport(v)),`);
				lines.push(`            None => OptionalNonterminalView::Missing,`);
				lines.push(`        },`);
			}
		}
	}

	lines.push(`    };`);
	lines.push(`    template.render_into(dest)`);

	return lines;
}

// ----------------------------------------------------------------------
// lib.rs — expose render_dispatch + render_transport_dispatch
// ----------------------------------------------------------------------

function libRsContents(lang: Grammar): string {
	return `// @generated from packages/${lang}/node-model.json5 — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --all --output packages/${lang}/src

pub mod bridge;
pub mod dispatch;
pub mod hash;
pub mod kind_ids;
pub mod templates;
pub mod transport;

pub use bridge::render_nodedata_into;
pub use dispatch::render_dispatch;
pub use transport::{render_transport, render_transport_dispatch, render_transport_parts, AnyTransport};
pub use hash::TEMPLATE_BUNDLE_HASH;
pub use kind_ids::*;
`;
}

// ----------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------

/**
 * Emit `hash.rs` + `hash.ts` for a single grammar (T016/T017 surface).
 * Kept as the historic low-dep entry point — the richer `emitRenderModule`
 * (T027+) subsumes it but we keep this exported so the existing unit
 * tests and intermediate CLI paths stay green.
 */
export function emitHashFiles(
	lang: Grammar,
	files: readonly TemplateFile[]
): {
	hashRs: RustRenderModuleEmit['hashRs'];
	hashTs: RustRenderModuleEmit['hashTs'];
} {
	const hash = computeTemplateBundleHash(files);
	return {
		hashRs: {
			path: `${renderModuleSrcDir(lang)}/hash.rs`,
			contents: `${hashRsHeader(lang)}\npub const TEMPLATE_BUNDLE_HASH: &str = "${hash}";\n`
		},
		hashTs: {
			path: `packages/${lang}/src/hash.ts`,
			contents: `${hashTsHeader(lang)}\nexport const TEMPLATE_BUNDLE_HASH = '${hash}'\n`
		}
	};
}

/** Pre-computed state passed from `RenderModuleEmitter` to avoid
 *  redundant traversals — when present, `collectMetaData` is skipped. */
interface PrecomputedState {
	meta: MetaData;
	nodesByKind: ReadonlyMap<string, AssembledNode>;
}

/**
 * Emit the full render module for a grammar — hash files, per-kind
 * template structs, direct-render helpers, render_dispatch, lib.rs,
 * Cargo.toml.
 *
 * @param lang — grammar identifier.
 * @param files — the grammar's `.jinja` bundle (filename → body).
 *   Used for the hash input AND for per-kind struct-field derivation.
 * @param nodeMap — the assembled node map, source of direct-render
 *   metadata tables and typeName lookups.
 * @param generatedIdTables — optional numeric KindID tables (T021+).
 * @param precomputed — optional pre-derived state from `RenderModuleEmitter`.
 *   When present, skips `collectMetaData` and uses the emitter-collected maps.
 * @returns paired file contents. The CLI writes them + handles the
 *   `.jinja` directory copy separately (T030).
 */
export function emitRenderModule(
	lang: Grammar,
	files: readonly TemplateFile[],
	nodeMap: NodeMap,
	generatedIdTables?: GeneratedIdTables,
	precomputed?: PrecomputedState
): RustRenderModuleEmit {
	const { hashRs, hashTs } = emitHashFiles(lang, files);
	const structs: EmittedStruct[] = [];
	const wordMatcher = compileWordMatcher(nodeMap.word, nodeMap.rules ?? {});
	// Same order the hash function sorts under — deterministic output.
	const sortedFiles = [...files].sort((a, b) => a.filename.localeCompare(b.filename));
	for (const f of sortedFiles) {
		if (!f.filename.endsWith('.jinja')) continue;
		const kind = f.filename.slice(0, -'.jinja'.length);
		const node = precomputed?.nodesByKind.get(kind) ?? nodeMap.nodes.get(kind);
		// Only user-facing nodes get templates emitted (see templates.ts
		// emitJinjaTemplates); if the jinja file exists, the node exists
		// and is userFacing.
		const rendered = node?.renderTemplate(nodeMap.rules ?? {}, wordMatcher ?? /\w/, nodeMap.externals);
		structs.push(
			emitStruct(
				kind,
				node,
				mergeTemplateSurfaceFromBody(f.content, rendered?.surface)
			)
		);
	}
	const meta = precomputed?.meta ?? collectMetaData(nodeMap);
	const hasNumericDispatch = generatedIdTables !== undefined;
	const kindIdByKind = generatedIdTables
		? buildKindIdByKind(collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables))
		: undefined;

	// --- bridge.rs ---
	// Field/child resolution helpers + render_nodedata_into (the unified
	// streaming render entry point). render_node_value calls
	// render_nodedata_into directly — no cross-module dispatch needed.
	const bridgeRs = [
		bridgeRsHeader(lang),
		'',
		commonRustUseImports(hasNumericDispatch),
		'use ::askama::Template as _AskamaTemplate;',
		'use super::templates::*;',
		'',
		renderDirectSupport(meta, kindIdByKind),
		'',
		renderNodedataIntoFn(structs, kindIdByKind)
	].join('\n');

	// --- templates.rs ---
	// Per-kind Template structs (no render functions — those are inlined
	// into bridge::render_nodedata_into match arms). The `filters` module
	// must live here because Askama resolves custom filters by searching
	// for a sibling `filters` module at the `#[derive(Template)]` site.
	const templatesRs = [
		templatesRsHeader(lang),
		'',
		commonRustUseImports(hasNumericDispatch),
		'use ::askama::Template as _AskamaTemplate;',
		'use super::bridge::*;',
		'',
		filtersModule(),
		'',
		renderStructDefs(structs)
	].join('\n');

	// --- dispatch.rs ---
	// Thin wrapper: render_dispatch delegates to bridge::render_nodedata_into.
	const dispatchRs = [
		dispatchRsHeader(lang),
		'',
		commonRustUseImports(hasNumericDispatch),
		'use super::bridge::render_nodedata_into;',
		'',
		renderDispatchFn(structs, kindIdByKind)
	].join('\n');

	// --- transport.rs ---
	// AnyTransport enum + FromNapiValue + per-kind transport structs +
	// typed dispatch + transport bridge helpers.
	const transportRs = [
		transportRsHeader(lang),
		'',
		commonRustUseImports(hasNumericDispatch),
		'use ::sittir_core::render_with_trivia;',
		'use ::askama::Template as _AskamaTemplate;',
		'use super::bridge::*;',
		'use super::dispatch::render_dispatch;',
		'use super::templates::*;',
		'',
		renderTransportSupport(nodeMap, structs, meta, generatedIdTables)
	].join('\n');

	return {
		hashRs,
		hashTs,
		templatesRs: {
			path: `${renderModuleSrcDir(lang)}/templates.rs`,
			contents: templatesRs + '\n'
		},
		dispatchRs: {
			path: `${renderModuleSrcDir(lang)}/dispatch.rs`,
			contents: dispatchRs + '\n'
		},
		transportRs: {
			path: `${renderModuleSrcDir(lang)}/transport.rs`,
			contents: transportRs + '\n'
		},
		bridgeRs: {
			path: `${renderModuleSrcDir(lang)}/bridge.rs`,
			contents: bridgeRs + '\n'
		},
		libRs: {
			path: `${renderModuleSrcDir(lang)}/mod.rs`,
			contents: libRsContents(lang)
		}
	};
}

function renderTransportSupport(
	nodeMap: NodeMap,
	structs: EmittedStruct[],
	meta: MetaData,
	generatedIdTables?: GeneratedIdTables
): string {
	const projection = getTransportProjection(nodeMap);
	const nodes = projection.nodes;

	// Build kind entries for numeric dispatch when parser.c metadata is available.
	// Source from the catalog superset (children-only kinds + anon tokens) so the
	// AnyTransport dispatch matches the TS-side TSKindId / kindIdFromName universe.
	const kindEntries: readonly KindEnumEntry[] | undefined = generatedIdTables
		? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
		: undefined;

	const anyTransportLines = kindEntries
		? renderAnyTransportWithNapiFromValue(nodes, projection.literals, nodeMap, kindEntries)
		: renderAnyTransportWithStringTag(nodes, projection.literals);

	// Collect all supertypes used as field/children types across all nodes.
	// Emit per-supertype transport enums BEFORE per-kind structs so struct
	// fields that reference the enum types can resolve them at compile time.
	const usedSupertypeNames = collectUsedSupertypeNames(nodes, nodeMap);
	const kidByKind = kindEntries ? buildKindIdByKind(kindEntries) : undefined;
	const supertypeEnumLines: string[] = [];
	for (const [, node] of nodeMap.nodes) {
		if (node.modelType !== 'supertype') continue;
		if (!usedSupertypeNames.has(node.typeName)) continue;
		// Skip supertypes whose enum name is reserved
		// (e.g. `_literal` → `LiteralTransport` is in RESERVED_SUPERTYPE_ENUM_NAMES).
		const enumName = `${rustTypeIdent(node.typeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		supertypeEnumLines.push(...emitSupertypeTransportEnum(node as AssembledSupertype, kidByKind, nodeMap));
	}

	// Collect per-slot children enums (heterogeneous children slots where no
	// grammar supertype covers all kinds). Emit before transport structs since
	// structs reference the enum type in their children field.
	const perSlotEnums = collectPerSlotChildEnums(nodes, nodeMap);
	const perSlotEnumLines: string[] = perSlotEnums.flatMap((entry) => emitPerSlotChildEnum(entry, kidByKind, nodeMap));

	return [
		...anyTransportLines,
		'',
		...renderLiteralTransportStruct(projection.literals),
		'',
		// Per-supertype transport enums must precede per-kind transport structs
		// so struct field type references resolve correctly.
		...(supertypeEnumLines.length > 0 ? [...supertypeEnumLines, ''] : []),
		// Per-slot child enums also precede per-kind transport structs.
		...(perSlotEnumLines.length > 0 ? [...perSlotEnumLines, ''] : []),
		...nodes.flatMap((node) => renderTransportStruct(node, nodeMap, generatedIdTables !== undefined, kindEntries)),
		'',
		...renderGrammarRenderable(),
		'',
		// Typed dispatch: render_transport_dispatch + per-kind render_<kind>_transport fns.
		// These are emitted AFTER renderGrammarRenderable() so Renderable::Node is in scope,
		// and BEFORE renderTransportBridge() so render_transport can call render_transport_dispatch.
		...renderTypedDispatch(structs, nodes, projection.literals, meta, nodeMap, usedSupertypeNames),
		...renderTransportBridge(nodes, projection.literals, kidByKind, nodeMap)
	].join('\n');
}

/**
 * Common Rust `use` imports shared across templates.rs, bridge.rs, dispatch.rs,
 * and transport.rs. Each file gets the full set — Rust's module system deduplicates
 * and the `#![allow(unused_imports)]` suppresses warnings for imports not needed
 * in a particular file.
 */
function commonRustUseImports(hasNumericDispatch: boolean): string {
	const lines: string[] = [];
	lines.push(
		'#![allow(dead_code, unused_imports, non_snake_case, non_camel_case_types, unused_mut, unused_variables)]'
	);
	lines.push('');
	lines.push('use ::sittir_core::filters::{');
	lines.push('    SingleNonterminalView, ListNonterminalView,');
	lines.push('    OptionalNonterminalView,');
	lines.push('};');
	lines.push('use ::sittir_core::types::{');
	lines.push('    NodeData, FieldValue, RenderableTransport, Source, Span, NodeTrivia, TransportTrivia,');
	lines.push('};');
	lines.push('');
	if (hasNumericDispatch) {
		lines.push('#[cfg(feature = "napi-bindings")]');
		lines.push('use ::napi_derive::napi;');
		lines.push('');
	}
	return lines.join('\n');
}

/**
 * The Askama `filters` module — must live in the same module as `#[derive(Template)]`
 * structs so Askama's derive macro can resolve custom filter names at build time.
 */
function filtersModule(): string {
	return [
		'pub mod filters {',
		'    //! Askama resolves custom-filter names by searching for a',
		'    //! sibling `filters` module at the derive-macro site. This',
		'    //! module wraps the canonical sittir_core implementations with',
		'    //! the `#[askama::filter_fn]` attribute so Askama can call them',
		'    //! from templates.',
		'    use ::sittir_core::filters::{Joined, JoinSource};',
		'',
		'    #[::askama::filter_fn]',
		"    pub fn joinby<'a, T: JoinSource<'a> + ?Sized>(",
		"        xs: &'a T,",
		'        _values: &dyn ::askama::Values,',
		"        sep: &'a str,",
		'        leading: bool,',
		'        trailing: bool,',
		"    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {",
		'        ::sittir_core::filters::joinby(xs, sep, leading, trailing)',
		'    }',
		'',
		'    #[::askama::filter_fn]',
		"    pub fn join<'a, T: JoinSource<'a> + ?Sized>(",
		"        xs: &'a T,",
		'        _values: &dyn ::askama::Values,',
		"        sep: &'a str,",
		"    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {",
		'        ::sittir_core::filters::joinby(xs, sep, false, false)',
		'    }',
		'',
		'    #[::askama::filter_fn]',
		'    #[allow(non_snake_case)]',
		"    pub fn joinWithTrailing<'a, T: JoinSource<'a> + ?Sized>(",
		"        xs: &'a T,",
		'        values: &dyn ::askama::Values,',
		"        sep: &'a str,",
		"    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {",
		'        ::sittir_core::filters::joinWithTrailing(xs, values, sep)',
		'    }',
		'',
		'    #[::askama::filter_fn]',
		'    #[allow(non_snake_case)]',
		"    pub fn joinWithLeading<'a, T: JoinSource<'a> + ?Sized>(",
		"        xs: &'a T,",
		'        values: &dyn ::askama::Values,',
		"        sep: &'a str,",
		"    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {",
		'        ::sittir_core::filters::joinWithLeading(xs, values, sep)',
		'    }',
		'',
		'    #[::askama::filter_fn]',
		'    #[allow(non_snake_case)]',
		"    pub fn joinWithFlanks<'a, T: JoinSource<'a> + ?Sized>(",
		"        xs: &'a T,",
		'        values: &dyn ::askama::Values,',
		"        sep: &'a str,",
		"    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {",
		'        ::sittir_core::filters::joinWithFlanks(xs, values, sep)',
		'    }',
		'',
		'    pub use ::sittir_core::filters::{',
		'        upper, lower,',
		'        isBlank, isPresent,',
		'    };',
		'}'
	].join('\n');
}

/**
 * Collect the set of supertype `typeName`s that are actually used as
 * field or children slot types across all assembled nodes. Only these
 * supertypes need per-supertype transport enum emission.
 *
 * Covers both `projection.nodes` (concrete transport nodes) and the forms
 * of any polymorph nodes within them. Polymorph form kinds are excluded from
 * `projection.nodes` by `isConcreteTransportNode`, but their transport structs
 * are still emitted by `renderPolymorphTransportDefs` — any supertype used in a
 * form's children slot must also be included here so the enum is declared
 * before the form struct references it.
 *
 * @param nodes - assembled nodes (transport projection)
 * @param nodeMap - for classification
 */
function collectUsedSupertypeNames(nodes: readonly AssembledNode[], nodeMap: NodeMap): Set<string> {
	const used = new Set<string>();

	/** Accumulate supertype names from a single node's fields + children. */
	const collectFromNode = (
		fields: readonly AssembledNonterminal[],
		children: readonly AssembledNonterminal[]
	): void => {
		for (const field of fields) {
			const cls = classifySlotForEmit(kindsOf(field), nodeMap);
			if (cls.tag === 'supertype') used.add(cls.supertypeName);
		}
		if (children.length > 0) {
			const allKinds = [...new Set(children.flatMap((c) => deriveChildrenKinds(c)))];
			const cls = classifySlotForEmit(allKinds, nodeMap);
			if (cls.tag === 'supertype') used.add(cls.supertypeName);
		}
	};

	for (const node of nodes) {
		if (node.modelType === 'polymorph' && node.forms.length > 0) {
			// Polymorph forms own the actual fields/children; the parent has none.
			// Form kinds are excluded from projection.nodes (polymorphFormKinds),
			// but their transport structs are emitted — collect from each form.
			for (const form of node.forms) {
				collectFromNode(form.fields, form.children);
			}
		} else {
			collectFromNode(structuralFieldsOf(node), structuralChildrenOf(node));
		}
	}
	// Transitive closure: supertype enums include sub-supertypes as variants.
	// If PatternTransport has `KeywordIdentifier(Box<KeywordIdentifierTransport>)`,
	// then KeywordIdentifierTransport must also be emitted. Expand to fixed point.
	let changed = true;
	while (changed) {
		changed = false;
		for (const [, node] of nodeMap.nodes) {
			if (node.modelType !== 'supertype') continue;
			if (!used.has(node.typeName)) continue;
			const supertypeNode = node as AssembledSupertype;
			for (const subKind of supertypeNode.subtypes) {
				const subNode = nodeMap.nodes.get(subKind);
				if (subNode === undefined || subNode.modelType !== 'supertype') continue;
				const enumName = `${rustTypeIdent(subNode.typeName)}Transport`;
				if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
				if (!used.has(subNode.typeName)) {
					used.add(subNode.typeName);
					changed = true;
				}
			}
		}
	}
	return used;
}

/**
 * Build a `Map<string, number>` from `kindEntries` for O(1) lookup by kind.
 * Also indexes `symbolName` when present so literal kinds (e.g. `"+"`)
 * resolve the same way as their parser-symbol names (`PLUS`).
 */
function buildKindIdByKind(kindEntries: readonly KindEnumEntry[]): ReadonlyMap<string, number> {
	const map = new Map<string, number>();
	for (const e of kindEntries) {
		map.set(e.kind, e.id);
		if (e.symbolName !== undefined && !map.has(e.symbolName)) {
			map.set(e.symbolName, e.id);
		}
	}
	return map;
}

/**
 * Emit `AnyTransport` with the string-tagged `#[serde(tag = "$type")]` derive.
 * Fallback path when `generatedIdTables` is unavailable (no parser.c).
 */
function renderAnyTransportWithStringTag(
	nodes: readonly AssembledNode[],
	literals: readonly TransportLiteral[]
): string[] {
	return [
		'#[derive(Debug, Clone, ::serde::Deserialize)]',
		'#[serde(tag = "$type")]',
		'pub enum AnyTransport {',
		...nodes.map((node) => {
			const variant = rustTransportVariantName(node);
			const structName = rustTransportStructName(node);
			return [`    #[serde(rename = ${JSON.stringify(node.kind)})]`, `    ${variant}(${structName}),`].join('\n');
		}),
		...literals.map((literal, index) => {
			const variant = rustLiteralTransportVariantName(literal, index);
			return [`    #[serde(rename = ${JSON.stringify(literal.kind)})]`, `    ${variant},`].join('\n');
		}),
		'}'
	];
}

/**
 * Emit a custom `impl ::napi::bindgen_prelude::FromNapiValue for XxxTransport`
 * for a polymorph transport enum. Reads the `$variant` property from the JS
 * object and dispatches to the appropriate form struct.
 *
 * @param node - the assembled polymorph node
 */
function renderPolymorphTransportFromNapiValue(node: Extract<AssembledNode, { modelType: 'polymorph' }>): string[] {
	const enumName = rustTransportStructName(node);
	const lines: string[] = [];
	lines.push(`#[cfg(feature = "napi-bindings")]`);
	lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${enumName} {`);
	lines.push(`    unsafe fn from_napi_value(`);
	lines.push(`        env: ::napi::sys::napi_env,`);
	lines.push(`        napi_val: ::napi::sys::napi_value,`);
	lines.push(`    ) -> ::napi::Result<Self> {`);
	lines.push(`        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
	lines.push(`        let variant: String = obj.get("$variant")?`);
	lines.push(`            .ok_or_else(|| ::napi::Error::from_reason("$variant property missing"))?;`);
	lines.push(`        match variant.as_str() {`);
	for (const form of node.forms) {
		const formStructName = rustTransportFormStructName(form);
		const formVariantName = rustTransportFormVariantName(form);
		lines.push(`            ${JSON.stringify(form.name)} => Ok(Self::${formVariantName}(`);
		lines.push(`                ${formStructName}::from_napi_value(env, napi_val)?`);
		lines.push(`            )),`);
	}
	lines.push(`            other => Err(::napi::Error::from_reason(format!(`);
	lines.push(`                "unknown $variant {:?} for ${enumName}",`);
	lines.push(`                other`);
	lines.push(`            ))),`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	return lines;
}

/**
 * Emit a per-supertype transport enum, its `Debug + Clone` body,
 * a custom `FromNapiValue` impl that reads `$type` as u16 and dispatches
 * to the appropriate concrete variant, a stub `ToNapiValue`, and a
 * `<supertype>_transport_to_any` bridge helper for the NodeData bridge path.
 *
 * Pattern mirrors `renderAnyTransportWithNapiFromValue` — variant arms come
 * from `supertypeNode.subtypes` resolved through `kindIdByKind`.
 * DRY: same `kindEntries` source as `AnyTransport` dispatch.
 *
 * `Box<T>` is used for non-leaf subtypes inside the enum variants to break
 * potential size-cycle recursion (e.g. `ExpressionTransport::BinaryExpression`
 * contains `ExpressionTransport` fields). Leaf/keyword/token/enum subtypes
 * are small (text only) and inlined without `Box`.
 *
 * When `kindEntries` is absent (no parser.c), emit a stub enum with a
 * string-tagged fallback so fields referencing the enum type still compile.
 *
 * @param supertypeNode - the assembled supertype node
 * @param kindIdByKind  - Map<kind, u16 id> from `buildKindIdByKind(kindEntries)`;
 *   `undefined` when parser.c is unavailable (fallback path)
 * @param nodeMap       - for typeName + modelType lookups
 */
function emitSupertypeTransportEnum(
	supertypeNode: AssembledSupertype,
	kindIdByKind: ReadonlyMap<string, number> | undefined,
	nodeMap: NodeMap
): string[] {
	const enumName = `${rustTypeIdent(supertypeNode.typeName)}Transport`;
	const lines: string[] = [];

	// Collect valid subtypes — skip phantom kinds not in nodeMap.
	const validSubtypes = supertypeNode.subtypes
		.map((subKind) => {
			const subNode = nodeMap.nodes.get(subKind);
			return subNode !== undefined ? { subKind, subNode } : null;
		})
		.filter((x): x is { subKind: string; subNode: AssembledNode } => x !== null);

	// Helper: is a subtype leaf-like (small, no Box needed)?
	const isLeafLike = (n: AssembledNode): boolean =>
		n.modelType === 'pattern' || n.modelType === 'keyword' || n.modelType === 'token' || n.modelType === 'enum';

	// Enum declaration — Debug + Clone only; no serde, no napi object derive.
	lines.push(`#[derive(Debug, Clone)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const { subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		const typeName = rustTransportStructName(subNode);
		const variantType = isLeafLike(subNode) ? typeName : `Box<${typeName}>`;
		lines.push(`    ${variant}(${variantType}),`);
	}
	lines.push(`}`);
	lines.push(``);

	if (kindIdByKind !== undefined) {
		// Custom FromNapiValue — reads $type as u16 and dispatches per known ID.
		lines.push(`#[cfg(feature = "napi-bindings")]`);
		lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${enumName} {`);
		lines.push(`    unsafe fn from_napi_value(`);
		lines.push(`        env: ::napi::sys::napi_env,`);
		lines.push(`        napi_val: ::napi::sys::napi_value,`);
		lines.push(`    ) -> ::napi::Result<Self> {`);
		lines.push(`        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
		lines.push(`        let kind_id: u16 = obj.get("$type")?`);
		lines.push(
			`            .ok_or_else(|| ::napi::Error::from_reason(${JSON.stringify(`$type property missing in ${enumName}`)}))?;`
		);
		lines.push(`        match kind_id {`);
		const emittedIds = new Set<number>();
		for (const { subKind, subNode } of validSubtypes) {
			const variant = rustTypeIdent(subNode.typeName);
			const typeName = rustTransportStructName(subNode);
			for (const concreteKind of collectConcreteTransportKinds(subKind, nodeMap)) {
				const id = kindIdByKind.get(concreteKind);
				if (id === undefined || emittedIds.has(id)) continue;
				emittedIds.add(id);
				if (isLeafLike(subNode)) {
					lines.push(`            ${id} => Ok(Self::${variant}(`);
					lines.push(`                ${typeName}::from_napi_value(env, napi_val)?`);
					lines.push(`            )),`);
				} else {
					lines.push(`            ${id} => Ok(Self::${variant}(Box::new(`);
					lines.push(`                ${typeName}::from_napi_value(env, napi_val)?`);
					lines.push(`            ))),`);
				}
			}
		}
		lines.push(`            other => Err(::napi::Error::from_reason(format!(`);
		lines.push(`                "unknown kind id {{other}} in ${enumName}",`);
		lines.push(`            ))),`);
		lines.push(`        }`);
		lines.push(`    }`);
		lines.push(`}`);
		lines.push(``);
	} else {
		// Fallback: no kindEntries — emit an always-error FromNapiValue stub.
		lines.push(`#[cfg(feature = "napi-bindings")]`);
		lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${enumName} {`);
		lines.push(`    unsafe fn from_napi_value(`);
		lines.push(`        _env: ::napi::sys::napi_env,`);
		lines.push(`        _napi_val: ::napi::sys::napi_value,`);
		lines.push(`    ) -> ::napi::Result<Self> {`);
		lines.push(
			`        Err(::napi::Error::from_reason(${JSON.stringify(`${enumName}: parser.c metadata unavailable — FromNapiValue not supported`)}))`
		);
		lines.push(`    }`);
		lines.push(`}`);
		lines.push(``);
	}

	// Stub ToNapiValue — supertype transport is receive-only (JS → Rust).
	lines.push(`#[cfg(feature = "napi-bindings")]`);
	lines.push(`impl ::napi::bindgen_prelude::ToNapiValue for ${enumName} {`);
	lines.push(`    unsafe fn to_napi_value(`);
	lines.push(`        _env: ::napi::sys::napi_env,`);
	lines.push(`        _val: Self,`);
	lines.push(`    ) -> ::napi::Result<::napi::sys::napi_value> {`);
	lines.push(`        Err(::napi::Error::from_reason(${JSON.stringify(`${enumName} is receive-only`)}))`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	// Bridge helper: converts <Supertype>Transport → AnyTransport for the
	// NodeData bridge (transport_field_value / transport_children). Each variant
	// wraps the inner concrete transport into the matching AnyTransport variant.
	// AnyTransport is a sized enum — no Box needed.
	lines.push(`fn ${rustSnakeIdent(supertypeNode.typeName)}_transport_to_any(t: ${enumName}) -> AnyTransport {`);
	lines.push(`    match t {`);
	for (const { subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		if (subNode.modelType === 'supertype') {
			// Sub-supertype: delegate to its own bridge function which expands
			// the sub-supertype enum into the correct concrete AnyTransport variant.
			const subBridgeFn = `${rustSnakeIdent(subNode.typeName)}_transport_to_any`;
			if (isLeafLike(subNode)) {
				lines.push(`        ${enumName}::${variant}(inner) => ${subBridgeFn}(inner),`);
			} else {
				lines.push(`        ${enumName}::${variant}(inner) => ${subBridgeFn}(*inner),`);
			}
		} else {
			const anyVariant = rustTypeIdent(subNode.typeName);
			if (isLeafLike(subNode)) {
				lines.push(`        ${enumName}::${variant}(inner) => AnyTransport::${anyVariant}(inner),`);
			} else {
				lines.push(`        ${enumName}::${variant}(inner) => AnyTransport::${anyVariant}(*inner),`);
			}
		}
	}
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	// RenderableTransport for the supertype enum — delegates to the per-supertype
	// render helper (declared later by emitSupertypeRenderHelper; forward fn
	// references are fine at Rust module scope).
	const supertypeRenderFn = `render_${rustSnakeIdent(supertypeNode.typeName)}`;
	lines.push(`impl RenderableTransport for ${enumName} {`);
	lines.push(`    fn render_into(`);
	lines.push(`        &self,`);
	lines.push(`        dest: &mut dyn ::std::fmt::Write,`);
	lines.push(`    ) -> Result<(), ::askama::Error> {`);
	lines.push(`        ${supertypeRenderFn}(self, dest)`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	return lines;
}

/**
 * Emit `render_<supertype>(t: &<Supertype>Transport, dest: &mut dyn fmt::Write) -> Result<(), ::askama::Error>`
 * as a bounded match over the enum variants.
 *
 * Each arm delegates to the concrete kind's render fn — same pattern as
 * `renderTypedPolymorphFn`. Arm count is bounded by the supertype's subtype
 * count (~5–40), not the full grammar (~1040 for rust).
 *
 * @param supertypeNode - the assembled supertype node
 * @param nodeMap       - for typeName + modelType lookups
 */
function emitSupertypeRenderHelper(supertypeNode: AssembledSupertype, nodeMap: NodeMap): string[] {
	const enumName = `${rustTypeIdent(supertypeNode.typeName)}Transport`;
	const fnName = `render_${rustSnakeIdent(supertypeNode.typeName)}`;
	const lines: string[] = [];

	const isLeafLike = (n: AssembledNode): boolean =>
		n.modelType === 'pattern' || n.modelType === 'keyword' || n.modelType === 'token' || n.modelType === 'enum';

	lines.push(`fn ${fnName}(t: &${enumName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
	lines.push(`    match t {`);
	for (const subKind of supertypeNode.subtypes) {
		const subNode = nodeMap.nodes.get(subKind);
		if (subNode === undefined) continue; // phantom kind — skip
		const variant = rustTypeIdent(subNode.typeName);
		const concreteFn = rustTypedRenderFnName(subNode.typeName);
		// Non-leaf variants are boxed in the enum; deref with `.as_ref()`.
		const innerExpr = isLeafLike(subNode) ? `inner` : `inner.as_ref()`;
		lines.push(`        ${enumName}::${variant}(inner) => ${concreteFn}(${innerExpr}, dest),`);
	}
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	return lines;
}

function collectConcreteTransportKinds(
	kind: string,
	nodeMap: NodeMap,
	seen: Set<string> = new Set()
): string[] {
	if (seen.has(kind)) return [];
	seen.add(kind);
	const node = nodeMap.nodes.get(kind);
	if (node === undefined) return [];
	if (node.modelType !== 'supertype') return [kind];
	const concreteKinds = new Set<string>();
	for (const subtype of (node as AssembledSupertype).subtypes) {
		for (const concreteKind of collectConcreteTransportKinds(subtype, nodeMap, seen)) {
			concreteKinds.add(concreteKind);
		}
	}
	return [...concreteKinds];
}

/**
 * Per-slot children enum entry: the parent node typeName and the set of
 * concrete child kinds that the slot accepts.
 */
interface PerSlotChildEnum {
	/** PascalCase typeName of the parent node (used to derive the enum name). */
	typeName: string;
	/** Concrete child kinds in this slot. */
	kinds: readonly string[];
}

/**
 * Collect all nodes whose `structuralChildren` classify as `heterogeneous`
 * (multiple distinct kinds, no grammar supertype covering them) — these need
 * a `{TypeName}ChildTransport` per-slot enum emitted before the struct.
 *
 * Polymorph forms are also covered: each form that has heterogeneous children
 * contributes its own entry (keyed by `formTypeName` so the enum name is
 * distinct from the parent struct).
 *
 * @param nodes   - assembled nodes from the transport projection
 * @param nodeMap - for classification
 */
/**
 * Returns `true` when at least one kind in `kinds` can produce a concrete
 * transport type (i.e. `concreteTransportTypeName` returns non-null).
 * When all kinds are supertypes / multi / polymorph, a per-slot enum would be
 * empty and must not be emitted — callers fall back to `Box<AnyTransport>`.
 */
function hasAnyConcreteChildKind(kinds: readonly string[], nodeMap: NodeMap): boolean {
	return kinds.some((k) => concreteTransportTypeName(k, nodeMap) !== null);
}

function collectPerSlotChildEnums(nodes: readonly AssembledNode[], nodeMap: NodeMap): PerSlotChildEnum[] {
	const entries: PerSlotChildEnum[] = [];
	const seen = new Set<string>();

	const consider = (typeName: string, children: readonly AssembledNonterminal[]): void => {
		if (children.length === 0) return;
		const allKinds = [...new Set(children.flatMap((c) => deriveChildrenKinds(c)))];
		const cls = classifySlotForEmit(allKinds, nodeMap);
		if (cls.tag !== 'heterogeneous') return;
		// If all child kinds map to supertypes/polymorphs/multi (no concrete transport
		// struct exists for any of them), emitting an empty enum would fail to compile.
		// Fall back to Box<AnyTransport> by skipping enum collection for this slot.
		if (!hasAnyConcreteChildKind(allKinds, nodeMap)) return;
		const enumName = perSlotEnumName(typeName);
		if (seen.has(enumName)) return;
		seen.add(enumName);
		entries.push({ typeName, kinds: allKinds });
	};

	for (const node of nodes) {
		if (node.modelType === 'polymorph' && node.forms.length > 0) {
			for (const form of node.forms) {
				consider(form.typeName, form.children);
			}
		} else {
			consider(node.typeName, structuralChildrenOf(node));
		}
	}
	return entries;
}

/**
 * Emit a `{TypeName}ChildTransport` per-slot children enum for a heterogeneous
 * children slot. The enum has one variant per concrete child kind; each variant
 * wraps the concrete transport struct (boxed for non-leaf kinds).
 *
 * Mirrors `emitSupertypeTransportEnum` but is derived from the specific child
 * kinds in a slot rather than grammar supertype membership.
 *
 * @param entry - the per-slot enum descriptor (typeName + child kinds)
 * @param kindIdByKind - map from kind to numeric parser symbol id (for FromNapiValue)
 * @param nodeMap - for transport struct names and modelType lookups
 */
function emitPerSlotChildEnum(
	entry: PerSlotChildEnum,
	kindIdByKind: ReadonlyMap<string, number> | undefined,
	nodeMap: NodeMap
): string[] {
	const enumName = perSlotEnumName(entry.typeName);
	const lines: string[] = [];

	// Only include kinds that have a concrete transport struct or enum.
	// Supertypes, polymorphs, and multi nodes are emitted via separate paths
	// and do not have a {Kind}Transport struct — skip them.
	const validKinds = entry.kinds
		.map((kind) => {
			const node = nodeMap.nodes.get(kind);
			if (node === undefined) return null;
			// Skip nodes with no concrete transport type (supertype, multi, polymorph).
			const concreteName = concreteTransportTypeName(kind, nodeMap);
			if (concreteName === null) return null;
			return { kind, node, concreteName };
		})
		.filter((x): x is { kind: string; node: AssembledNode; concreteName: string } => x !== null);

	// If no valid concrete kinds remain (all were supertypes/polymorphs), fall back
	// to emitting an empty enum — this should be caught upstream by the caller.
	const isLeafLike = (n: AssembledNode): boolean =>
		n.modelType === 'pattern' || n.modelType === 'keyword' || n.modelType === 'token' || n.modelType === 'enum';

	lines.push(`#[derive(Debug, Clone)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const { node, concreteName } of validKinds) {
		const variant = rustTypeIdent(node.typeName);
		const variantType = isLeafLike(node) ? concreteName : `Box<${concreteName}>`;
		lines.push(`    ${variant}(${variantType}),`);
	}
	lines.push(`}`);
	lines.push(``);

	if (kindIdByKind !== undefined) {
		lines.push(`#[cfg(feature = "napi-bindings")]`);
		lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${enumName} {`);
		lines.push(`    unsafe fn from_napi_value(`);
		lines.push(`        env: ::napi::sys::napi_env,`);
		lines.push(`        napi_val: ::napi::sys::napi_value,`);
		lines.push(`    ) -> ::napi::Result<Self> {`);
		lines.push(`        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
		lines.push(`        let kind_id: u16 = obj.get("$type")?`);
		lines.push(
			`            .ok_or_else(|| ::napi::Error::from_reason(${JSON.stringify(`$type property missing in ${enumName}`)}))?;`
		);
		lines.push(`        match kind_id {`);
		for (const { kind, node, concreteName } of validKinds) {
			const id = kindIdByKind.get(kind);
			if (id === undefined) continue;
			const variant = rustTypeIdent(node.typeName);
			const typeName = concreteName;
			if (isLeafLike(node)) {
				lines.push(`            ${id} => Ok(Self::${variant}(`);
				lines.push(`                ${typeName}::from_napi_value(env, napi_val)?`);
				lines.push(`            )),`);
			} else {
				lines.push(`            ${id} => Ok(Self::${variant}(Box::new(`);
				lines.push(`                ${typeName}::from_napi_value(env, napi_val)?`);
				lines.push(`            ))),`);
			}
		}
		lines.push(`            other => Err(::napi::Error::from_reason(format!(`);
		lines.push(`                "unknown kind id {{other}} in ${enumName}",`);
		lines.push(`            ))),`);
		lines.push(`        }`);
		lines.push(`    }`);
		lines.push(`}`);
		lines.push(``);
	} else {
		lines.push(`#[cfg(feature = "napi-bindings")]`);
		lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${enumName} {`);
		lines.push(`    unsafe fn from_napi_value(`);
		lines.push(`        _env: ::napi::sys::napi_env,`);
		lines.push(`        _napi_val: ::napi::sys::napi_value,`);
		lines.push(`    ) -> ::napi::Result<Self> {`);
		lines.push(
			`        Err(::napi::Error::from_reason(${JSON.stringify(`${enumName}: parser.c metadata unavailable — FromNapiValue not supported`)}))`
		);
		lines.push(`    }`);
		lines.push(`}`);
		lines.push(``);
	}

	lines.push(`#[cfg(feature = "napi-bindings")]`);
	lines.push(`impl ::napi::bindgen_prelude::ToNapiValue for ${enumName} {`);
	lines.push(`    unsafe fn to_napi_value(`);
	lines.push(`        _env: ::napi::sys::napi_env,`);
	lines.push(`        _val: Self,`);
	lines.push(`    ) -> ::napi::Result<::napi::sys::napi_value> {`);
	lines.push(`        Err(::napi::Error::from_reason(${JSON.stringify(`${enumName} is receive-only`)}))`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	// Bridge helper: converts per-slot enum → AnyTransport for the NodeData bridge.
	// AnyTransport is a sized enum — no Box needed.
	const bridgeFnName = `${rustSnakeIdent(entry.typeName)}_child_transport_to_any`;
	lines.push(`fn ${bridgeFnName}(t: ${enumName}) -> AnyTransport {`);
	lines.push(`    match t {`);
	for (const { node } of validKinds) {
		const variant = rustTypeIdent(node.typeName);
		if (isLeafLike(node)) {
			lines.push(`        ${enumName}::${variant}(inner) => AnyTransport::${variant}(inner),`);
		} else {
			lines.push(`        ${enumName}::${variant}(inner) => AnyTransport::${variant}(*inner),`);
		}
	}
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	// RenderableTransport impl — match on variant and delegate to per-kind render fn.
	lines.push(`impl RenderableTransport for ${enumName} {`);
	lines.push(`    fn render_into(`);
	lines.push(`        &self,`);
	lines.push(`        dest: &mut dyn ::std::fmt::Write,`);
	lines.push(`    ) -> Result<(), ::askama::Error> {`);
	lines.push(`        match self {`);
	for (const { node } of validKinds) {
		const variant = rustTypeIdent(node.typeName);
		const concreteFn = rustTypedRenderFnName(node.typeName);
		const innerExpr = isLeafLike(node) ? 'inner' : 'inner.as_ref()';
		lines.push(`            ${enumName}::${variant}(inner) => ${concreteFn}(${innerExpr}, dest),`);
	}
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	return lines;
}

/**
 * Emit `AnyTransport` with a custom `FromNapiValue` impl that reads `$type`
 * as a numeric `u16` KindId directly from the JS object properties (no serde,
 * no JSON intermediate). Phase B of the KindID runtime migration.
 *
 * Per the spec: the `AnyTransport` enum body itself has no serde derives —
 * only `Debug + Clone`. The custom `FromNapiValue` impl reads `$type` as `u16`
 * and dispatches to the per-kind struct's `FromNapiValue` (generated by
 * `#[napi(object)]`). Literal variants are unit variants — JS sends only `$type`
 * and no payload; the static text is embedded in the Rust dispatch arms.
 *
 * Unknown kind IDs produce a napi error with the numeric ID in the message
 * so that diagnostics can surface useful context.
 *
 * DRY constraint: the match arms come from the same `kindEntries` list that
 * `emitKindIdRust` uses for `kind_ids.rs` constants — both consumers read
 * from the same source so dispatch and constants stay in sync.
 *
 * @param nodes — assembled nodes that appear in the transport projection
 * @param literals — literal (terminal text-only) transport kinds
 * @param nodeMap — for `kindIdMemberName` lookups (typeName derivation)
 * @param kindEntries — entries from the symbol catalog; used for ID→variant dispatch
 */
function renderAnyTransportWithNapiFromValue(
	nodes: readonly AssembledNode[],
	literals: readonly TransportLiteral[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[]
): string[] {
	// Index by both `kind` (canonical catalog name) and `symbolName` (anon-token
	// literal text). Literal arms are keyed by `literal.kind`, which for
	// component literals carries the literal text (`"+"`) rather than the
	// parser-symbol name (`"PLUS"`). Without the symbolName index, `+` and
	// other operator-token literals would fall through to `id === undefined` and
	// silently skip — leaving the dispatch incomplete.
	const kindIdByKind = new Map<string, number>();
	for (const e of kindEntries) {
		kindIdByKind.set(e.kind, e.id);
		if (e.symbolName !== undefined && !kindIdByKind.has(e.symbolName)) {
			kindIdByKind.set(e.symbolName, e.id);
		}
	}

	const lines: string[] = [];

	// Enum declaration — no serde Deserialize; napi FromNapiValue added below.
	lines.push('#[derive(Debug, Clone)]');
	lines.push('pub enum AnyTransport {');
	for (const node of nodes) {
		const variant = rustTransportVariantName(node);
		const structName = rustTransportStructName(node);
		lines.push(`    ${variant}(${structName}),`);
	}
	for (const [index, literal] of literals.entries()) {
		const variant = rustLiteralTransportVariantName(literal, index);
		lines.push(`    ${variant},`);
	}
	lines.push('}');
	lines.push('');

	// Custom FromNapiValue impl — reads $type as u16 from the JS object,
	// then dispatches to the per-kind struct's FromNapiValue. This eliminates
	// the serde/JSON intermediate entirely. Gated behind napi-bindings feature
	// so templates.rs compiles without the napi/napi-derive crates available.
	lines.push('#[cfg(feature = "napi-bindings")]');
	lines.push('impl ::napi::bindgen_prelude::FromNapiValue for AnyTransport {');
	lines.push('    unsafe fn from_napi_value(');
	lines.push('        env: ::napi::sys::napi_env,');
	lines.push('        napi_val: ::napi::sys::napi_value,');
	lines.push('    ) -> ::napi::Result<Self> {');
	lines.push('        // Read the JS object using napi-rs 3 Object API — all per-kind');
	lines.push('        // struct decoders reuse the same napi_val, each reading their');
	lines.push('        // own properties directly from the same JS object.');
	lines.push('        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;');
	lines.push('        let kind_id: u16 = obj.get("$type")?');
	lines.push('            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in AnyTransport"))?;');
	lines.push('        match kind_id {');

	// One match arm per node — each arm delegates to the per-kind struct's
	// FromNapiValue (generated by #[napi(object)]) over the same napi_val.
	// T016: Deduplicate match arms — alias-collapsed kinds that share the same
	// KindId emit only the first arm. The second would be unreachable.
	const emittedNodeIds = new Set<number>();
	for (const node of nodes) {
		const id = kindIdByKind.get(node.kind);
		if (id === undefined) continue; // no parser symbol — skip
		if (emittedNodeIds.has(id)) continue; // T016: skip duplicate KindId
		emittedNodeIds.add(id);
		const variant = rustTransportVariantName(node);
		const structName = rustTransportStructName(node);
		const constName = toScreamingSnakeCase(kindIdMemberName(nodeMap, node.kind), node.kind);
		lines.push(`            // kind: ${node.kind} (${constName})`);
		lines.push(`            ${id} => Ok(AnyTransport::${variant}(`);
		lines.push(`                ${structName}::from_napi_value(env, napi_val)?`);
		lines.push(`            )),`);
	}

	// One match arm per literal kind — unit variants, no payload.
	// The literal text is a compile-time constant; JS does not need to send it.
	// Use the same emittedNodeIds set to skip KindIds already claimed by node arms.
	for (const [index, literal] of literals.entries()) {
		const id = kindIdByKind.get(literal.kind);
		if (id === undefined) continue;
		if (emittedNodeIds.has(id)) continue; // T016: skip duplicate KindId
		emittedNodeIds.add(id);
		const variant = rustLiteralTransportVariantName(literal, index);
		lines.push(`            // literal kind: ${literal.kind} → ${JSON.stringify(literal.text)}`);
		lines.push(`            ${id} => Ok(AnyTransport::${variant}),`);
	}

	lines.push('            other => Err(::napi::Error::from_reason(format!(');
	lines.push('                "unknown kind id {other} in AnyTransport"');
	lines.push('            ))),');
	lines.push('        }');
	lines.push('    }');
	lines.push('}');

	// Stub ToNapiValue for AnyTransport — transport is receive-only (JS→Rust);
	// ToNapiValue is required by #[napi(object)] field bounds on containing structs
	// but is never called at runtime. Returns JS null as a safe placeholder.
	lines.push('#[cfg(feature = "napi-bindings")]');
	lines.push('impl ::napi::bindgen_prelude::ToNapiValue for AnyTransport {');
	lines.push('    unsafe fn to_napi_value(');
	lines.push('        env: ::napi::sys::napi_env,');
	lines.push('        _val: Self,');
	lines.push('    ) -> ::napi::Result<::napi::sys::napi_value> {');
	lines.push('        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())');
	lines.push('    }');
	lines.push('}');
	lines.push('');

	// Box<AnyTransport>: FromNapiValue + ToNapiValue — required because
	// #[napi(object)] per-kind transport structs have Box<AnyTransport> fields
	// for single-value heterogeneous slots (Box breaks recursive size cycles).
	// napi-rs does not provide a blanket impl for Box<T>.
	lines.push('#[cfg(feature = "napi-bindings")]');
	lines.push('impl ::napi::bindgen_prelude::FromNapiValue for Box<AnyTransport> {');
	lines.push('    unsafe fn from_napi_value(');
	lines.push('        env: ::napi::sys::napi_env,');
	lines.push('        napi_val: ::napi::sys::napi_value,');
	lines.push('    ) -> ::napi::Result<Self> {');
	lines.push('        AnyTransport::from_napi_value(env, napi_val).map(Box::new)');
	lines.push('    }');
	lines.push('}');
	lines.push('');
	lines.push('#[cfg(feature = "napi-bindings")]');
	lines.push('impl ::napi::bindgen_prelude::ToNapiValue for Box<AnyTransport> {');
	lines.push('    unsafe fn to_napi_value(');
	lines.push('        env: ::napi::sys::napi_env,');
	lines.push('        val: Self,');
	lines.push('    ) -> ::napi::Result<::napi::sys::napi_value> {');
	lines.push('        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, *val)');
	lines.push('    }');
	lines.push('}');
	lines.push('');

	return lines;
}

/**
 * Per-grammar `Renderable` extension enum. Closed family: `Text` for
 * already-final render-ready strings, `Joined` for streaming join wrappers.
 * Display + FastWritable dispatch on the variant.
 *
 * The `Node` variant (previously present) is removed in Phase 2: per-template
 * render functions call typed helpers directly and produce `String` values,
 * which they wrap as `Renderable::Text`. No render fn creates `Renderable::Node`.
 */
function renderGrammarRenderable(): string[] {
	return [
		'#[derive(Debug, Clone, Copy)]',
		"pub enum Renderable<'a> {",
		"    Text(&'a str),",
		"    Joined(::sittir_core::filters::Joined<'a>),", // keep FQ — inside local enum, not in scope
		'}',
		'',
		"impl ::std::fmt::Display for Renderable<'_> {",
		"    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {",
		'        match self {',
		'            Self::Text(s) => f.write_str(s),',
		'            Self::Joined(j) => ::std::fmt::Display::fmt(j, f),',
		'        }',
		'    }',
		'}',
		'',
		"impl ::askama::FastWritable for Renderable<'_> {",
		'    fn write_into<W: ::std::fmt::Write + ?Sized>(',
		'        &self,',
		'        dest: &mut W,',
		'        values: &dyn ::askama::Values,',
		'    ) -> Result<(), ::askama::Error> {',
		'        match self {',
		'            Self::Text(s) => dest.write_str(s).map_err(::askama::Error::from),',
		'            Self::Joined(j) => j.write_into(dest, values),',
		'        }',
		'    }',
		'}'
	];
}

function renderTransportBridge(
	nodes: readonly AssembledNode[],
	literals: readonly TransportLiteral[],
	kindIdByKind?: ReadonlyMap<string, number>,
	nodeMap?: NodeMap
): string[] {
	return [
		'use ::sittir_core::types::{FieldValue as TransportFieldValue, KindId as TransportKindId, NodeData as TransportNodeData, Source as TransportSource};',
		'use ::std::collections::HashMap as TransportHashMap;',
		'',
		'fn transport_node_data(',
		'    kind: TransportKindId,',
		'    source: Option<Source>,',
		'    named: Option<bool>,',
		'    default_named: bool,',
		'    text: Option<String>,',
		'    span: Option<Span>,',
		'    node_handle: Option<u32>,',
		'    child_index: Option<u16>,',
		'    fields: Option<TransportHashMap<String, TransportFieldValue>>,',
		'    children: Option<Vec<TransportNodeData>>,',
		'    trivia_data: Option<NodeTrivia>,',
		') -> TransportNodeData {',
		'    TransportNodeData {',
		'        type_: kind,',
		'        source: source.unwrap_or(TransportSource::Factory),',
		'        named: named.unwrap_or(default_named),',
		'        fields,',
		'        children,',
		'        text,',
		'        span,',
		'        node_handle,',
		'        child_index,',
		'        trivia_data,',
		'    }',
		'}',
		'',
		'fn transport_field_value(value: AnyTransport) -> Result<TransportFieldValue, ::askama::Error> {',
		'    let node = transport_to_node(value)?;',
		'    if !node.named {',
		'        if let Some(text) = node.text {',
		'            return Ok(TransportFieldValue::Text(text));',
		'        }',
		'    }',
		'    Ok(TransportFieldValue::Single(Box::new(node)))',
		'}',
		'',
		'fn transport_field_values(values: Vec<AnyTransport>) -> Result<TransportFieldValue, ::askama::Error> {',
		'    let mut nodes = Vec::with_capacity(values.len());',
		'    for value in values {',
		'        nodes.push(transport_to_node(value)?);',
		'    }',
		'    Ok(TransportFieldValue::Multiple(nodes))',
		'}',
		'',
		'fn transport_children(values: Vec<AnyTransport>) -> Result<Vec<TransportNodeData>, ::askama::Error> {',
		'    let mut nodes = Vec::with_capacity(values.len());',
		'    for value in values {',
		'        nodes.push(transport_to_node(value)?);',
		'    }',
		'    Ok(nodes)',
		'}',
		'',
		'fn transport_to_node(transport: AnyTransport) -> Result<TransportNodeData, ::askama::Error> {',
		'    match transport {',
		...nodes.map((node) => {
			return `        AnyTransport::${rustTransportVariantName(node)}(data) => ${rustTransportToNodeFnName(node.typeName)}(data),`;
		}),
		...literals.map((literal, index) => {
			// Unit variant — no payload. Inline the static text and default metadata.
			const id = kindIdByKind?.get(literal.kind);
			const safeKind = JSON.stringify(rustBlockCommentSafe(literal.kind));
			const kindArg =
				id !== undefined
					? `TransportKindId(${id}) /* ${safeKind} */`
					: `TransportKindId(0) /* ${safeKind} — no parser symbol */`;
			return `        AnyTransport::${rustLiteralTransportVariantName(literal, index)} => Ok(transport_node_data(${kindArg}, None, None, false, Some(${JSON.stringify(literal.text)}.to_string()), None, None, None, None, None, None)),`;
		}),
		'    }',
		'}',
		'',
		...nodes.flatMap((node) => renderTransportToNodeFns(node, kindIdByKind, nodeMap)),
		'pub fn render_transport_parts(transport: AnyTransport) -> Result<(TransportSource, String), ::askama::Error> {',
		'    let rendered = render_transport_dispatch(&transport)?;',
		'    let source = transport_source(&transport);',
		'    Ok((source, rendered))',
		'}',
		'',
		'fn transport_source(transport: &AnyTransport) -> TransportSource {',
		'    TransportSource::Factory',
		'}',
		'',
		'pub fn from_transport(transport: AnyTransport) -> Result<String, ::askama::Error> {',
		'    let (_source, rendered) = render_transport_parts(transport)?;',
		'    Ok(rendered)',
		'}',
		'',
		'pub fn render_transport(transport: AnyTransport) -> Result<String, ::askama::Error> {',
		'    render_transport_dispatch(&transport)',
		'}'
	];
}

function renderTransportToNodeFns(
	node: AssembledNode,
	kindIdByKind?: ReadonlyMap<string, number>,
	nodeMap?: NodeMap
): string[] {
	if (node.modelType === 'polymorph' && node.forms.length > 0) {
		const lines: string[] = [];
		lines.push(
			`fn ${rustTransportToNodeFnName(node.typeName)}(transport: ${rustTransportStructName(node)}) -> Result<TransportNodeData, ::askama::Error> {`
		);
		lines.push('    match transport {');
		for (const form of node.forms) {
			lines.push(
				`        ${rustTransportStructName(node)}::${rustTransportFormVariantName(form)}(data) => ${rustTransportToNodeFnName(form.typeName)}(data),`
			);
		}
		lines.push('    }');
		lines.push('}');
		lines.push('');
		for (const form of node.forms) {
			lines.push(
				...renderTransportDataToNodeFn(
					rustTransportToNodeFnName(form.typeName),
					rustTransportFormStructName(form),
					node.kind,
					form.fields,
					form.children,
					true,
					true,
					kindIdByKind,
					nodeMap,
					form.typeName
				)
			);
		}
		return lines;
	}

	switch (node.modelType) {
		case 'branch':
		case 'group':
			return renderTransportDataToNodeFn(
				rustTransportToNodeFnName(node.typeName),
				rustTransportStructName(node),
				node.kind,
				structuralFieldsOf(node),
				structuralChildrenOf(node),
				true,
				true,
				kindIdByKind,
				nodeMap,
				node.typeName
			);
		case 'pattern':
		case 'keyword':
		case 'token':
		case 'enum':
			return renderTerminalTransportToNodeFn(node, kindIdByKind);
		default:
			return [];
	}
}

function renderTransportDataToNodeFn(
	fnName: string,
	structName: string,
	kind: string,
	fields: readonly AssembledNonterminal[],
	children: readonly AssembledNonterminal[],
	defaultNamed: boolean,
	hasOptionalText: boolean,
	kindIdByKind?: ReadonlyMap<string, number>,
	nodeMap?: NodeMap,
	/** PascalCase typeName of the owning struct — passed to renderTransportChildrenBinding
	 *  so it can derive the per-slot child enum bridge function name. */
	ownerTypeName?: string
): string[] {
	const kindArg = kindIdExpr(kind, kindIdByKind);
	const lines: string[] = [];
	lines.push(`fn ${fnName}(transport: ${structName}) -> Result<TransportNodeData, ::askama::Error> {`);
	lines.push('    let mut fields = TransportHashMap::new();');
	for (const field of fields) {
		const access = `transport.${rustFieldIdent(field.name)}`;
		// When nodeMap is available and the field is a single-concrete-kind slot,
		// the struct field type is a concrete transport type (not AnyTransport).
		// Wrap it into AnyTransport for the bridge helper, which expects the
		// type-erased form. Fall back to direct access when the field is already
		// AnyTransport (heterogeneous / polymorph / supertype / multi).
		if (isMultiple(field)) {
			if (isRequired(field)) {
				const bridged = buildBridgeListRequired(field, access, nodeMap);
				lines.push(
					`    fields.insert(${JSON.stringify(field.name)}.to_string(), transport_field_values(${bridged})?);`
				);
			} else {
				lines.push(`    if let Some(value) = ${access} {`);
				const bridged = buildBridgeOptionalList(field, 'value', nodeMap);
				lines.push(
					`        fields.insert(${JSON.stringify(field.name)}.to_string(), transport_field_values(${bridged})?);`
				);
				lines.push('    }');
			}
		} else if (isRequired(field)) {
			const bridged = buildBridgeSingleRequired(field, access, nodeMap);
			lines.push(`    fields.insert(${JSON.stringify(field.name)}.to_string(), transport_field_value(${bridged})?);`);
		} else {
			lines.push(`    if let Some(value) = ${access} {`);
			const bridged = buildBridgeOptionalSingle(field, 'value', nodeMap);
			lines.push(
				`        fields.insert(${JSON.stringify(field.name)}.to_string(), transport_field_value(${bridged})?);`
			);
			lines.push('    }');
		}
	}
	lines.push('    let fields = if fields.is_empty() { None } else { Some(fields) };');
	lines.push(...renderTransportChildrenBinding(children, nodeMap, ownerTypeName));
	lines.push('    let trivia_data = transport.transport_trivia_data.map(|t| t.into_node_trivia());');
	lines.push('    Ok(transport_node_data(');
	lines.push(`        ${kindArg},`);
	lines.push('        transport.transport_source,');
	lines.push('        transport.transport_named,');
	lines.push(`        ${defaultNamed ? 'true' : 'false'},`);
	lines.push(hasOptionalText ? '        transport.transport_text,' : '        None,');
	lines.push('        transport.transport_span,');
	lines.push('        transport.transport_node_handle.map(|v| v as u32),');
	lines.push('        transport.transport_child_index.map(|v| v as u16),');
	lines.push('        fields,');
	lines.push('        children,');
	lines.push('        trivia_data,');
	lines.push('    ))');
	lines.push('}');
	lines.push('');
	return lines;
}

/**
 * Typed bridge classification for a field — returns how to convert the
 * typed transport field to `AnyTransport` for the NodeData bridge.
 *
 * Returns `{ kind: 'concrete', variant }` — wrap with `AnyTransport::Variant(…)`.
 * Returns `{ kind: 'supertype', toAnyFn }` — call `<supertype>_transport_to_any(…)`.
 * Returns `undefined` — already `AnyTransport`, pass unchanged.
 */
type BridgeFieldClass =
	| { readonly kind: 'concrete'; readonly variant: string }
	| { readonly kind: 'supertype'; readonly toAnyFn: string }
	| undefined;

function bridgeClassForField(field: AssembledNonterminal, nodeMap: NodeMap | undefined): BridgeFieldClass {
	if (nodeMap === undefined) return undefined;
	const cls = classifySlotForEmit(kindsOf(field), nodeMap);
	if (cls.tag === 'concrete') return { kind: 'concrete', variant: rustTypeIdent(cls.typeName) };
	if (cls.tag === 'supertype') {
		return { kind: 'supertype', toAnyFn: `${rustSnakeIdent(cls.supertypeName)}_transport_to_any` };
	}
	return undefined; // heterogeneous — already AnyTransport
}

/**
 * For the bridge path: build a Rust expression for a REQUIRED SINGLE field
 * that converts the typed transport value to `AnyTransport`.
 *
 * - heterogeneous: `*access` (dereferences Box<AnyTransport> → AnyTransport)
 * - concrete: `AnyTransport::Variant(access)`
 * - supertype: `<supertype>_transport_to_any(access)`
 *
 * @param field - the assembled field
 * @param access - Rust expression for the field (e.g. `transport.name`)
 * @param nodeMap - for classification; absent = assume heterogeneous
 */
function buildBridgeSingleRequired(field: AssembledNonterminal, access: string, nodeMap: NodeMap | undefined): string {
	const bc = bridgeClassForField(field, nodeMap);
	if (bc === undefined) return `*${access}`; // Box<AnyTransport> → deref to AnyTransport
	if (bc.kind === 'concrete') return `AnyTransport::${bc.variant}(${access})`;
	return `${bc.toAnyFn}(${access})`;
}

/**
 * For the bridge path: build a Rust expression for a REQUIRED LIST field
 * that converts each element to `AnyTransport`.
 *
 * - heterogeneous: `access` unchanged (`Vec<AnyTransport>`)
 * - concrete: maps to `Vec<AnyTransport>` via `AnyTransport::Variant`
 * - supertype: maps via `<supertype>_transport_to_any`
 */
function buildBridgeListRequired(field: AssembledNonterminal, access: string, nodeMap: NodeMap | undefined): string {
	const bc = bridgeClassForField(field, nodeMap);
	if (bc === undefined) return access;
	if (bc.kind === 'concrete') {
		return `${access}.into_iter().map(|v| AnyTransport::${bc.variant}(v)).collect::<Vec<_>>()`;
	}
	return `${access}.into_iter().map(|v| ${bc.toAnyFn}(v)).collect::<Vec<_>>()`;
}

/**
 * For the bridge path: convert an OPTIONAL SINGLE field's already-unwrapped
 * value (after `if let Some(value) = access`) to `AnyTransport`.
 *
 * - heterogeneous: `*valueExpr` (dereferences Box<AnyTransport> → AnyTransport)
 * - concrete: `AnyTransport::Variant(valueExpr)`
 * - supertype: `<supertype>_transport_to_any(valueExpr)`
 */
function buildBridgeOptionalSingle(
	field: AssembledNonterminal,
	valueExpr: string,
	nodeMap: NodeMap | undefined
): string {
	const bc = bridgeClassForField(field, nodeMap);
	if (bc === undefined) return `*${valueExpr}`; // Box<AnyTransport> → deref to AnyTransport
	if (bc.kind === 'concrete') return `AnyTransport::${bc.variant}(${valueExpr})`;
	return `${bc.toAnyFn}(${valueExpr})`;
}

/**
 * For the bridge path: convert an OPTIONAL LIST field's already-unwrapped
 * value (after `if let Some(value) = access`) to `Vec<AnyTransport>`.
 */
function buildBridgeOptionalList(field: AssembledNonterminal, valueExpr: string, nodeMap: NodeMap | undefined): string {
	const bc = bridgeClassForField(field, nodeMap);
	if (bc === undefined) return valueExpr;
	if (bc.kind === 'concrete') {
		return `${valueExpr}.into_iter().map(|v| AnyTransport::${bc.variant}(v)).collect::<Vec<_>>()`;
	}
	return `${valueExpr}.into_iter().map(|v| ${bc.toAnyFn}(v)).collect::<Vec<_>>()`;
}

function renderTransportChildrenBinding(
	children: readonly AssembledNonterminal[],
	nodeMap?: NodeMap,
	/** PascalCase typeName of the owning struct — used for the per-slot
	 *  child enum bridge function name when the slot is heterogeneous. */
	ownerTypeName?: string
): string[] {
	if (children.length === 0) return ['    let children = None;'];
	// Determine if children slot is typed (concrete/supertype) or erased (AnyTransport
	// or per-slot child enum). For the bridge path, typed children need to be wrapped
	// into AnyTransport via AnyTransport::Variant(child) or <supertype>_transport_to_any(child)
	// before passing to transport_children().
	const childrenCls = nodeMap !== undefined ? classifySlotFromChildren(children, nodeMap) : undefined;
	const reqd = hasRequiredChild(children);
	const isMultipleSlot = hasMultipleChildren(children);

	/** Wrap a single typed child value into `AnyTransport`. */
	const wrapSingle = (expr: string): string => {
		if (childrenCls === undefined) return expr;
		if (childrenCls.tag === 'heterogeneous') {
			if (childrenCls.useBox === true) {
				// Children type is Box<AnyTransport> — dereference to get AnyTransport.
				return `*${expr}`;
			}
			// Per-slot child enum: use the bridge fn to convert to AnyTransport.
			if (ownerTypeName !== undefined) {
				const bridgeFn = `${rustSnakeIdent(ownerTypeName)}_child_transport_to_any`;
				return `${bridgeFn}(${expr})`;
			}
			// No typeName known — this shouldn't happen for per-slot enum path.
			return expr;
		}
		if (childrenCls.tag === 'concrete') {
			const variant = rustTypeIdent(childrenCls.typeName);
			return `AnyTransport::${variant}(${expr})`;
		}
		// supertype
		const toAnyFn = `${rustSnakeIdent(childrenCls.supertypeName)}_transport_to_any`;
		return `${toAnyFn}(${expr})`;
	};

	/** Wrap a Vec expression of typed children into Vec<AnyTransport>. */
	const wrapVec = (expr: string): string => {
		if (childrenCls === undefined) return expr;
		if (childrenCls.tag === 'heterogeneous') {
			if (childrenCls.useBox === true) {
				// Already Vec<AnyTransport> — pass through.
				return expr;
			}
			// Per-slot child enum: convert each variant to AnyTransport.
			if (ownerTypeName !== undefined) {
				const bridgeFn = `${rustSnakeIdent(ownerTypeName)}_child_transport_to_any`;
				return `${expr}.into_iter().map(|v| ${bridgeFn}(v)).collect::<Vec<_>>()`;
			}
			return expr;
		}
		if (childrenCls.tag === 'concrete') {
			const variant = rustTypeIdent(childrenCls.typeName);
			return `${expr}.into_iter().map(|v| AnyTransport::${variant}(v)).collect::<Vec<_>>()`;
		}
		// supertype
		const toAnyFn = `${rustSnakeIdent(childrenCls.supertypeName)}_transport_to_any`;
		return `${expr}.into_iter().map(|v| ${toAnyFn}(v)).collect::<Vec<_>>()`;
	};

	if (isMultipleSlot) {
		// Vec<T> slot — iterate to build Vec<AnyTransport>.
		// needsWrap: true if wrapVec() transforms the expression (i.e., type is not
		// already Vec<AnyTransport>). Concrete, supertype, and per-slot child enum
		// all need wrapping; only useBox=true heterogeneous (already AnyTransport) is pass-through.
		const needsWrap =
			childrenCls !== undefined &&
			(childrenCls.tag !== 'heterogeneous' || (childrenCls.tag === 'heterogeneous' && childrenCls.useBox !== true));
		if (reqd) {
			const bridged = wrapVec('transport.children');
			return [`    let children = Some(transport_children(${bridged})?);`];
		}
		if (needsWrap) {
			return [
				'    let children = match transport.children {',
				`        Some(c) => Some(transport_children(${wrapVec('c')})?),`,
				'        None => None,',
				'    };'
			];
		}
		return [
			'    let children = match transport.children {',
			'        Some(children) => Some(transport_children(children)?),',
			'        None => None,',
			'    };'
		];
	}

	// Single-child slot (multiple=false) — wrap the single value into a vec![...].
	if (reqd) {
		const wrapped = wrapSingle('transport.children');
		return [`    let children = Some(transport_children(vec![${wrapped}])?);`];
	}
	// Option<T> — match to wrap single child, or None.
	const wrapped = wrapSingle('c');
	return [
		'    let children = match transport.children {',
		`        Some(c) => Some(transport_children(vec![${wrapped}])?),`,
		'        None => None,',
		'    };'
	];
}

/**
 * Sanitize a kind string for use inside a Rust block comment.
 *
 * Rust block comments do not support nesting or escape sequences, so the
 * sequence star-slash inside a comment closes it prematurely. For example,
 * the kind "star-slash" would produce a broken block comment where the
 * inner star-slash ends the comment early, leaving a dangling double-quote
 * that Rust parses as an unterminated string literal.
 *
 * Replacement: star-slash -> "* /" (insert a space between star and slash).
 *
 * @param kind - Raw grammar kind string, possibly containing star-slash.
 * @returns A version of the kind string safe for use inside Rust block comments.
 */
function rustBlockCommentSafe(kind: string): string {
	// Two sequences are unsafe inside Rust block comments:
	//   */  closes the comment prematurely
	//   /*  opens a nested comment (Rust supports nesting), so the
	//       enclosing */ then closes the nested comment, not the outer one,
	//       leaving the outer comment unterminated.
	// Replace both with a space-separated form to keep comments readable.
	// Use split/join to avoid regex literals that some bundlers misparse.
	return kind.split('*/').join('* /').split('/*').join('/ *');
}

/**
 * Emit a `TransportKindId(n)` expression for `kind`, falling back to
 * `TransportKindId(0)` with a comment when the kind has no parser symbol.
 *
 * @param kind - Grammar kind string (e.g. `"function_item"`).
 * @param kindIdByKind - Map from kind string to numeric parser symbol id.
 *   When absent (no parser.c available), always produces the fallback.
 * @returns A Rust expression, e.g. TransportKindId(188) with a kind comment.
 */
function kindIdExpr(kind: string, kindIdByKind?: ReadonlyMap<string, number>): string {
	const id = kindIdByKind?.get(kind);
	const safeKind = JSON.stringify(rustBlockCommentSafe(kind));
	if (id !== undefined) {
		return `TransportKindId(${id}) /* ${safeKind} */`;
	}
	return `TransportKindId(0) /* ${safeKind} — no parser symbol */`;
}

function renderTerminalTransportToNodeFn(node: AssembledNode, kindIdByKind?: ReadonlyMap<string, number>): string[] {
	const kindArg = kindIdExpr(node.kind, kindIdByKind);
	const typeName = rustTransportStructName(node);

	if (node instanceof AssembledEnum) {
		// Multi-member enum: the transport type IS the Rust enum (no wrapper struct).
		// Metadata fields (source, named, span, node_handle, child_index) are not available on the
		// enum — all default to None. The text is derived from the enum's Display impl.
		return [
			`fn ${rustTransportToNodeFnName(node.typeName)}(transport: ${typeName}) -> Result<TransportNodeData, ::askama::Error> {`,
			'    Ok(transport_node_data(',
			`        ${kindArg},`,
			'        None,',
			'        None,',
			'        true,',
			'        Some(transport.to_string()),',
			'        None,',
			'        None,',
			'        None,',
			'        None,',
			'        None,',
			'        None,',
			'    ))',
			'}',
			''
		];
	}

	return [
		`fn ${rustTransportToNodeFnName(node.typeName)}(transport: ${typeName}) -> Result<TransportNodeData, ::askama::Error> {`,
		'    let trivia_data = transport.transport_trivia_data.map(|t| t.into_node_trivia());',
		'    Ok(transport_node_data(',
		`        ${kindArg},`,
		'        transport.transport_source,',
		'        transport.transport_named,',
		'        true,',
		'        Some(transport.text),',
		'        transport.transport_span,',
		'        transport.transport_node_handle.map(|v| v as u32),',
		'        transport.transport_child_index.map(|v| v as u16),',
		'        None,',
		'        None,',
		'        trivia_data,',
		'    ))',
		'}',
		''
	];
}

/**
 * Previously emitted a `pub struct LiteralTransport { text: String, ... }` napi
 * object so JS could send the literal text across the FFI boundary. Now that
 * `AnyTransport` literal variants are unit variants (no payload), the struct is
 * no longer needed and this function returns an empty array.
 *
 * The static text for each literal is embedded directly in the
 * `render_transport_dispatch` match arms and the `transport_to_node` arms.
 */
function renderLiteralTransportStruct(_literals: readonly TransportLiteral[]): string[] {
	return [];
}

function renderTransportStruct(
	node: AssembledNode,
	nodeMap: NodeMap,
	hasNapi: boolean = false,
	kindEntries?: readonly KindEnumEntry[]
): string[] {
	if (node instanceof AssembledEnum) {
		// Enum modelType: emit a Rust enum type with FromNapiValue / Display / RenderableTransport.
		return renderEnumType(node, hasNapi, kindEntries);
	}
	if (node.modelType === 'polymorph' && node.forms.length > 0) {
		return renderPolymorphTransportDefs(node, nodeMap);
	}
	return renderTransportDataStruct(
		rustTransportStructName(node),
		node,
		structuralFieldsOf(node),
		structuralChildrenOf(node),
		nodeMap
	);
}

function renderPolymorphTransportDefs(
	node: Extract<AssembledNode, { modelType: 'polymorph' }>,
	nodeMap: NodeMap
): string[] {
	const lines: string[] = [];
	// Polymorph envelope enum: no serde, no napi(object) — custom FromNapiValue
	// impl below reads $variant and dispatches to the appropriate form struct.
	lines.push('#[derive(Debug, Clone)]');
	lines.push(`pub enum ${rustTransportStructName(node)} {`);
	for (const form of node.forms) {
		lines.push(`    ${rustTransportFormVariantName(form)}(${rustTransportFormStructName(form)}),`);
	}
	lines.push('}');
	lines.push('');
	// Custom FromNapiValue impl for the polymorph envelope.
	lines.push(...renderPolymorphTransportFromNapiValue(node));
	// RenderableTransport for the polymorph enum — delegates to the per-polymorph
	// render fn which matches on variants and calls each form's render fn.
	const polymorphStructName = rustTransportStructName(node);
	const polymorphRenderFn = rustTypedRenderFnName(node.typeName);
	lines.push(`impl RenderableTransport for ${polymorphStructName} {`);
	lines.push(`    fn render_into(`);
	lines.push(`        &self,`);
	lines.push(`        dest: &mut dyn ::std::fmt::Write,`);
	lines.push(`    ) -> Result<(), ::askama::Error> {`);
	lines.push(`        ${polymorphRenderFn}(self, dest)`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	for (const form of node.forms) {
		lines.push(
			...renderTransportDataStruct(rustTransportFormStructName(form), form, form.fields, form.children, nodeMap)
		);
	}
	return lines;
}

function renderTransportDataStruct(
	structName: string,
	node: AssembledNode,
	fields: readonly AssembledNonterminal[],
	children: readonly AssembledNonterminal[],
	nodeMap: NodeMap
): string[] {
	const isLeafNode = node.modelType === 'pattern' || node.modelType === 'keyword' || node.modelType === 'token';
	const lines: string[] = [];
	// Branch/container/group/polymorph/enum use #[napi(object)] for derived
	// FromNapiValue. Leaf/keyword/token transport structs opt out of
	// #[napi(object)] and instead get manual cfg-gated FromNapiValue impls
	// below — so JS can send a plain string in release mode (no debug-transport)
	// and the full metadata object in debug mode.
	if (!isLeafNode) {
		lines.push('#[cfg_attr(feature = "napi-bindings", napi(object))]');
	}
	lines.push('#[derive(Debug, Clone)]');
	lines.push(`pub struct ${structName} {`);
	switch (node.modelType) {
		case 'branch':
		case 'group':
		case 'polymorph':
			lines.push(...renderTransportMetadataFields(true));
			for (const field of fields) {
				lines.push(...renderTransportField(field, nodeMap));
			}
			if (children.length > 0) {
				lines.push('    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]');
				lines.push(`    pub children: ${rustTransportChildrenType(children, node.typeName, nodeMap)},`);
			}
			break;
		case 'pattern':
		case 'keyword':
		case 'token':
		case 'enum':
			// Leaf/keyword/token structs have manual cfg-gated FromNapiValue impls
			// (below). The napi field attributes are not emitted because there is no
			// #[napi(object)] on the struct to act as the consuming proc-macro.
			lines.push(...renderLeafTransportPlainFields());
			break;
	}
	lines.push('}');
	lines.push('');
	// Emit impl RenderableTransport for this struct so heterogeneous
	// (Box<AnyTransport>) slots can call .render_to_string() without routing
	// through the top-level render_transport_dispatch match.
	//
	// All struct impls wrap the render call with render_with_trivia! to stream
	// leading/trailing trivia text around the node content. Bool/enum variants
	// don't have transport_trivia_data and are handled separately (no macro).
	lines.push(`impl RenderableTransport for ${structName} {`);
	lines.push(`    fn render_into(`);
	lines.push(`        &self,`);
	lines.push(`        dest: &mut dyn ::std::fmt::Write,`);
	lines.push(`    ) -> Result<(), ::askama::Error> {`);
	if (isLeafNode) {
		lines.push(`        render_with_trivia!(self, dest, dest.write_str(&self.text).map_err(::askama::Error::from))`);
	} else {
		const renderFn = rustTypedRenderFnName(node.typeName);
		lines.push(`        render_with_trivia!(self, dest, ${renderFn}(self, dest))`);
	}
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	// For leaf/keyword/token structs: emit manual cfg-gated napi impls.
	// These replace the #[napi(object)]-derived FromNapiValue so that:
	//   - release (not debug-transport): JS sends a plain string → read as String
	//   - debug  (    debug-transport): JS sends full metadata object → read fields
	// ToNapiValue is a stub in both modes — transport structs are receive-only.
	if (isLeafNode) {
		lines.push(...renderLeafTransportNapiImpls(structName));
	}
	return lines;
}

/**
 * Emit manual napi `FromNapiValue` + `ToNapiValue` impls for a leaf
 * transport struct. Two cfg-gated `FromNapiValue` variants are emitted:
 *
 * - `#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]`
 *   reads the napi value as a plain JS string and constructs the struct
 *   with only `text` populated (metadata fields are `None` / default).
 *   JS callers in release mode send a bare string for leaf fields.
 *
 * - `#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]`
 *   reads the napi value as a JS object and extracts the full set of
 *   metadata fields (`$text`, `$source`, `$named`, `$span`, `$nodeId`).
 *   JS callers in debug mode send the complete transport object.
 *
 * `ToNapiValue` is a no-op stub in both modes. Transport is receive-only
 * (JS→Rust); the stub satisfies `#[napi(object)]` field bounds on parent
 * branch structs that embed these leaf types.
 *
 * @param structName - Rust struct name, e.g. `IdentifierTransport`.
 */
function renderLeafTransportNapiImpls(structName: string): string[] {
	const lines: string[] = [];

	// Release mode: read plain JS string — no metadata round-trip.
	lines.push(`#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]`);
	lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${structName} {`);
	lines.push(`    unsafe fn from_napi_value(`);
	lines.push(`        env: ::napi::sys::napi_env,`);
	lines.push(`        napi_val: ::napi::sys::napi_value,`);
	lines.push(`    ) -> ::napi::Result<Self> {`);
	lines.push(`        let text = if let Ok(text) = String::from_napi_value(env, napi_val) {`);
	lines.push(`            text`);
	lines.push(`        } else {`);
	lines.push(`            let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
	lines.push(`            obj.get("$text")?.unwrap_or_default()`);
	lines.push(`        };`);
	lines.push(`        Ok(Self {`);
	for (const f of TRANSPORT_METADATA_FIELDS) {
		lines.push(`            ${f.rustName}: None,`);
	}
	lines.push(`            text,`);
	lines.push(`        })`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');

	// Debug mode: read full metadata object — same shape as #[napi(object)] would derive.
	lines.push(`#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]`);
	lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${structName} {`);
	lines.push(`    unsafe fn from_napi_value(`);
	lines.push(`        env: ::napi::sys::napi_env,`);
	lines.push(`        napi_val: ::napi::sys::napi_value,`);
	lines.push(`    ) -> ::napi::Result<Self> {`);
	lines.push(`        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
	lines.push('        let text: String = obj.get("$text")?.unwrap_or_default();');
	for (const f of TRANSPORT_METADATA_FIELDS) {
		if (f.needsExplicitTypeAnnotation) {
			lines.push(`        let ${f.rustName}: ${f.rustType} = obj.get(${JSON.stringify(f.jsName)})?;`);
		} else {
			lines.push(`        let ${f.rustName} = obj.get(${JSON.stringify(f.jsName)})?;`);
		}
	}
	lines.push(`        Ok(Self {`);
	for (const f of TRANSPORT_METADATA_FIELDS) {
		lines.push(`            ${f.rustName},`);
	}
	lines.push(`            text,`);
	lines.push(`        })`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');

	// ToNapiValue stub — transport is JS→Rust only; this impl satisfies the
	// trait bound required by #[napi(object)] on parent branch structs whose
	// fields embed this leaf transport type.
	lines.push(`#[cfg(feature = "napi-bindings")]`);
	lines.push(`impl ::napi::bindgen_prelude::ToNapiValue for ${structName} {`);
	lines.push(`    unsafe fn to_napi_value(`);
	lines.push(`        env: ::napi::sys::napi_env,`);
	lines.push(`        _val: Self,`);
	lines.push(`    ) -> ::napi::Result<::napi::sys::napi_value> {`);
	lines.push(`        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');

	return lines;
}

/**
 * Single source of truth for transport struct metadata fields.
 * Every transport struct (branch, leaf, polymorph) carries these
 * metadata fields. All emission helpers that produce struct field
 * declarations, `None` initialisers, `obj.get(...)` reads, or
 * `transport.<field>` bridge accesses derive from this array.
 *
 * @remarks
 * `jsName` is the `$`-prefixed JS property name on the wire.
 * `rustName` is the Rust struct field name.
 * `rustType` is the Rust type for the struct field declaration.
 * `bridgeMap` (optional) is an inline `.map(...)` transformation
 * applied when reading the field value in the transport-to-NodeData
 * bridge function. When absent the field is passed through directly.
 * `needsExplicitTypeAnnotation` flags fields whose `obj.get(...)` call
 * in the manual `FromNapiValue` impl requires a leading type annotation
 * (e.g. `let x: Option<Foo> = obj.get(...)?;`).
 */
interface TransportMetadataField {
	jsName: string;
	rustName: string;
	rustType: string;
	bridgeMap?: string;
	needsExplicitTypeAnnotation?: boolean;
}

/**
 * Metadata fields shared by all transport structs.
 *
 * `transport_text` is intentionally absent — it is present on branch
 * transport structs (which always include it) but NOT on leaf structs
 * (which use a plain `text: String` field instead). It is added
 * conditionally by `renderTransportMetadataFields`.
 */
const TRANSPORT_METADATA_FIELDS: readonly TransportMetadataField[] = [
	{ jsName: '$source', rustName: 'transport_source', rustType: 'Option<Source>' },
	{ jsName: '$named', rustName: 'transport_named', rustType: 'Option<bool>' },
	{ jsName: '$span', rustName: 'transport_span', rustType: 'Option<Span>' },
	// ADR-0017: $nodeHandle (u32) + $childIndex (u16) replace $nodeId.
	// napi-rs 3 passes these as f64 from JS; convert in the NodeData bridge.
	{
		jsName: '$nodeHandle',
		rustName: 'transport_node_handle',
		rustType: 'Option<f64>',
		bridgeMap: '.map(|v| v as u32)'
	},
	{
		jsName: '$childIndex',
		rustName: 'transport_child_index',
		rustType: 'Option<f64>',
		bridgeMap: '.map(|v| v as u16)'
	},
	// $triviaData carries trivia text strings. TransportTrivia has a manual FromNapiValue
	// impl that extracts $text from each JS array element — no serde_json needed.
	{ jsName: '$triviaData', rustName: 'transport_trivia_data', rustType: 'Option<TransportTrivia>' }
];

/**
 * The `transport_text` field, conditional on branch structs. Kept
 * separate from `TRANSPORT_METADATA_FIELDS` because leaf structs use
 * a plain `text: String` instead.
 */
const TRANSPORT_TEXT_FIELD: TransportMetadataField = {
	jsName: '$text',
	rustName: 'transport_text',
	rustType: 'Option<String>'
};

/**
 * Emit struct field declarations with `#[cfg_attr(feature = "napi-bindings", napi(js_name = "..."))]`
 * attributes for branch/group/polymorph transport structs that carry
 * `#[napi(object)]` on the struct.
 *
 * @param includeText - true for branch structs (adds `transport_text`).
 */
function renderTransportMetadataFields(includeText: boolean): string[] {
	const lines: string[] = [];
	// source, named — always first
	const source = TRANSPORT_METADATA_FIELDS[0]!;
	const named = TRANSPORT_METADATA_FIELDS[1]!;
	lines.push(
		`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(source.jsName)}))]`,
		`    pub ${source.rustName}: ${source.rustType},`,
		`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(named.jsName)}))]`,
		`    pub ${named.rustName}: ${named.rustType},`
	);
	if (includeText) {
		lines.push(
			`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(TRANSPORT_TEXT_FIELD.jsName)}))]`,
			`    pub ${TRANSPORT_TEXT_FIELD.rustName}: ${TRANSPORT_TEXT_FIELD.rustType},`
		);
	}
	// remaining fields: span, nodeHandle, childIndex, triviaData
	for (const f of TRANSPORT_METADATA_FIELDS.slice(2)) {
		lines.push(
			`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(f.jsName)}))]`,
			`    pub ${f.rustName}: ${f.rustType},`
		);
	}
	return lines;
}

/**
 * Plain struct fields for leaf/keyword/token transport structs. Unlike
 * branch structs, these do not carry `#[napi(object)]` on the struct itself,
 * so individual field `cfg_attr(napi(...))` attributes would have no proc-macro
 * to consume them and could confuse napi-derive. Plain field declarations are
 * used instead; `FromNapiValue` is emitted manually below the struct definition
 * (via `renderLeafTransportNapiImpls`), reading the JS property names with the
 * `$`-prefixed keys explicitly.
 */
function renderLeafTransportPlainFields(): string[] {
	return [...TRANSPORT_METADATA_FIELDS.map((f) => `    pub ${f.rustName}: ${f.rustType},`), '    pub text: String,'];
}

function renderTransportField(field: AssembledNonterminal, nodeMap: NodeMap): string[] {
	const lines: string[] = [];
	const rustName = rustFieldIdent(field.name);
	// Generator-owned NodeData stores raw fields as `_<name>` top-level keys.
	// Keep the JS/native render boundary dumb by teaching the generated napi
	// structs to read the same storage keys directly.
	lines.push(`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(`_${field.name}`)}))]`);
	lines.push(`    pub ${rustName}: ${rustTransportFieldType(field, nodeMap)},`);
	return lines;
}

function rustTransportFieldType(field: AssembledNonterminal, nodeMap: NodeMap): string {
	const cls = classifySlotForEmit(kindsOf(field), nodeMap);
	switch (cls.tag) {
		case 'concrete': {
			const base = concreteTransportTypeName(cls.kind, nodeMap);
			if (base !== null) {
				const inner = isMultiple(field) ? `Vec<${base}>` : base;
				return isRequired(field) ? inner : `Option<${inner}>`;
			}
			// Unknown kind — fall back to AnyTransport.
			// Vec<AnyTransport> is safe (Vec provides indirection). Single-value
			// AnyTransport fields need Box<> to break recursive size cycles when
			// the owning struct is itself a variant of AnyTransport.
			if (isMultiple(field)) {
				const inner = 'Vec<AnyTransport>';
				return isRequired(field) ? inner : `Option<${inner}>`;
			}
			const inner = 'Box<AnyTransport>';
			return isRequired(field) ? inner : `Option<${inner}>`;
		}
		case 'supertype': {
			const base = `${rustTypeIdent(cls.supertypeName)}Transport`;
			const inner = isMultiple(field) ? `Vec<${base}>` : base;
			return isRequired(field) ? inner : `Option<${inner}>`;
		}
		case 'heterogeneous': {
			// Vec<AnyTransport> is safe (Vec provides indirection). Single-value
			// AnyTransport fields need Box<> to break recursive size cycles.
			if (isMultiple(field)) {
				const inner = 'Vec<AnyTransport>';
				return isRequired(field) ? inner : `Option<${inner}>`;
			}
			const inner = 'Box<AnyTransport>';
			return isRequired(field) ? inner : `Option<${inner}>`;
		}
		default:
			return assertNever(cls);
	}
}

/**
 * Emit the Rust type for a node's `children` transport field, respecting
 * slot cardinality (required/optional, single/multiple) and kind classification.
 *
 * Full cardinality matrix:
 * - multiple=true  → `Vec<T>` (required) or `Option<Vec<T>>` (optional)
 * - multiple=false → `T`      (required) or `Option<T>`      (optional)
 *
 * Classification:
 * - concrete  → `ConcreteTransport` (or `Box<AnyTransport>` fallback)
 * - supertype → `SupertypeTransport`
 * - heterogeneous → `{TypeName}ChildTransport` per-slot enum
 *
 * @param children - The node's structural children list.
 * @param typeName - PascalCase typeName of the parent node (for per-slot enum name).
 * @param nodeMap  - For kind classification.
 */
function rustTransportChildrenType(
	children: readonly AssembledNonterminal[],
	typeName: string,
	nodeMap: NodeMap
): string {
	const allKinds = [...new Set(children.flatMap((c) => deriveChildrenKinds(c)))];
	const cls = classifySlotForEmit(allKinds, nodeMap);
	const required = hasRequiredChild(children);
	const multiple = hasMultipleChildren(children);
	switch (cls.tag) {
		case 'concrete': {
			const base = concreteTransportTypeName(cls.kind, nodeMap);
			if (base !== null) {
				if (multiple) return required ? `Vec<${base}>` : `Option<Vec<${base}>>`;
				return required ? base : `Option<${base}>`;
			}
			// Unknown kind — fall back to AnyTransport.
			// Vec<AnyTransport> is safe (Vec provides indirection). Single-value
			// children need Box<> to break recursive size cycles.
			if (multiple) return required ? 'Vec<AnyTransport>' : 'Option<Vec<AnyTransport>>';
			return required ? 'Box<AnyTransport>' : 'Option<Box<AnyTransport>>';
		}
		case 'supertype': {
			const base = `${rustTypeIdent(cls.supertypeName)}Transport`;
			if (multiple) return required ? `Vec<${base}>` : `Option<Vec<${base}>>`;
			return required ? base : `Option<${base}>`;
		}
		case 'heterogeneous': {
			// Multiple distinct kinds, no grammar supertype.
			// If all child kinds are supertypes/polymorphs/multi, we cannot produce
			// a concrete per-slot enum (it would be empty). Fall back to AnyTransport.
			// Vec<AnyTransport> is safe. Single-value AnyTransport needs Box<> for
			// recursive size cycle-breaking.
			if (!hasAnyConcreteChildKind(allKinds, nodeMap)) {
				if (multiple) return required ? 'Vec<AnyTransport>' : 'Option<Vec<AnyTransport>>';
				return required ? 'Box<AnyTransport>' : 'Option<Box<AnyTransport>>';
			}
			const enumName = perSlotEnumName(typeName);
			if (multiple) return required ? `Vec<${enumName}>` : `Option<Vec<${enumName}>>`;
			return required ? enumName : `Option<${enumName}>`;
		}
		default:
			return assertNever(cls);
	}
}

/**
 * Rust type name for a concrete transport struct given a grammar kind.
 * Returns `null` when the kind maps to a supertype or multi node — those are
 * NOT emitted as transport structs/enums in Phase 1 (Phase 2 will add them).
 * The caller must fall back to `Box<AnyTransport>` on `null`.
 *
 * @param kind - Grammar kind string (e.g. `"identifier"`, `"_expression"`).
 * @param nodeMap - For typeName + modelType lookup.
 */
function concreteTransportTypeName(kind: string, nodeMap: NodeMap): string | null {
	const node = nodeMap.nodes.get(kind);
	if (node !== undefined) {
		// Supertype and multi nodes are not emitted as transport structs.
		// Polymorph enums don't implement ToNapiValue in Phase 1 so struct fields
		// with #[napi(object)] can't use them — return null to fall back to bare AnyTransport.
		// All three: returning null signals "fall back to AnyTransport" for Phase 1.
		if (node.modelType === 'supertype' || node.modelType === 'multi' || node.modelType === 'polymorph') {
			return null;
		}
		if (node instanceof AssembledEnum) {
			return enumTypeName(node);
		}
		return `${rustTypeIdent(node.typeName)}Transport`;
	}
	// Unknown kind — conservative fallback.
	return null;
}

function hasRequiredChild(children: readonly AssembledNonterminal[]): boolean {
	return children.some((child) => isRequired(child));
}

/**
 * True when any child in the list has `isMultiple` = true (at least one entry
 * with multiplicity `array` or `nonEmptyArray`). When true, the transport field
 * must be `Vec<T>`. When false, the slot holds at most one child and the field
 * should be `T` (required) or `Option<T>` (optional).
 */
function hasMultipleChildren(children: readonly AssembledNonterminal[]): boolean {
	return children.some((child) => isMultiple(child));
}

/**
 * Name for a per-slot children enum for a heterogeneous children slot.
 * Format: `{TypeName}ChildTransport` (e.g., `SuiteChildTransport`).
 *
 * @param typeName - The parent node's typeName (PascalCase).
 */
function perSlotEnumName(typeName: string): string {
	return `${rustTypeIdent(typeName)}ChildTransport`;
}

/**
 * Rust type name for the transport representation of a node.
 *
 * For `enum` modelType nodes: the transport type is the Rust enum itself
 * (`XxxEnum`). All other nodes use the standard `XxxTransport` struct name.
 */
function rustTransportStructName(node: AssembledNode): string {
	if (node instanceof AssembledEnum) {
		return enumTypeName(node);
	}
	return `${rustTypeIdent(node.typeName)}Transport`;
}

function rustTransportVariantName(node: AssembledNode): string {
	return rustTypeIdent(node.typeName);
}

function rustTransportFormStructName(form: AssembledGroup): string {
	return `${rustTypeIdent(form.typeName)}Transport`;
}

function rustTransportFormVariantName(form: AssembledGroup): string {
	return rustTypeIdent(form.typeName);
}

function rustTransportToNodeFnName(typeName: string): string {
	return `transport_to_node_${rustSnakeIdent(typeName)}`;
}

function rustSnakeIdent(name: string): string {
	const snake = name
		.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
		.replace(/[^A-Za-z0-9_]/g, '_')
		.toLowerCase();
	return snake.length > 0 ? snake : 'transport';
}

function rustLiteralTransportVariantName(literal: TransportLiteral, index: number): string {
	const suffix =
		literal.kind.length === 0
			? 'empty'
			: [...literal.kind].map((char) => char.codePointAt(0)?.toString(16).padStart(2, '0') ?? '00').join('_');
	return rustTypeIdent(`Literal${index}_${suffix}`);
}

function rustTypeIdent(name: string): string {
	const replaced = name.replace(/[^A-Za-z0-9_]/g, '_');
	const withStart = /^[A-Za-z_]/.test(replaced) ? replaced : `Transport${replaced}`;
	const ident = withStart.length > 0 ? withStart : 'Transport';
	return RUST_KEYWORDS.has(ident) ? `${ident}_` : ident;
}

// ----------------------------------------------------------------------
// Enum transport type emission
// ----------------------------------------------------------------------

/**
 * Mapping from operator/punctuation literal text to a safe Rust PascalCase
 * identifier. Covers the symbols that appear across the three grammars
 * (rust, typescript, python). Identifiers that need disambiguation from
 * Rust keywords get a `Kw` suffix.
 */
const LITERAL_TO_VARIANT_NAME: ReadonlyMap<string, string> = new Map([
	// Arithmetic
	['+', 'Plus'],
	['-', 'Minus'],
	['*', 'Star'],
	['/', 'Slash'],
	['%', 'Percent'],
	// Bitwise / logical
	['&', 'Amp'],
	['|', 'Pipe'],
	['^', 'Caret'],
	['~', 'Tilde'],
	['!', 'Bang'],
	['?', 'Question'],
	// Comparison
	['==', 'EqEq'],
	['!=', 'BangEq'],
	['<', 'Lt'],
	['>', 'Gt'],
	['<=', 'LtEq'],
	['>=', 'GtEq'],
	// Shift
	['<<', 'LtLt'],
	['>>', 'GtGt'],
	// Compound assignment
	['+=', 'PlusEq'],
	['-=', 'MinusEq'],
	['*=', 'StarEq'],
	['/=', 'SlashEq'],
	['%=', 'PercentEq'],
	['&=', 'AmpEq'],
	['|=', 'PipeEq'],
	['^=', 'CaretEq'],
	['<<=', 'LtLtEq'],
	['>>=', 'GtGtEq'],
	// Double-char operators
	['&&', 'AmpAmp'],
	['||', 'PipePipe'],
	['??', 'QuestionQuestion'],
	// Range operators
	['..', 'DotDot'],
	['..=', 'DotDotEq'],
	['...', 'DotDotDot'],
	// Optional chaining
	['?.', 'QuestionDot'],
	// Arrow / fat arrow / thin arrow
	['=>', 'FatArrow'],
	['->', 'ThinArrow'],
	// Assignment
	['=', 'Eq'],
	// Misc punctuation
	['.', 'Dot'],
	[',', 'Comma'],
	[';', 'Semi'],
	[':', 'Colon'],
	['::', 'ColonColon'],
	['@', 'At'],
	['#', 'Hash'],
	['$', 'Dollar'],
	['_', 'Underscore'],
	// Brackets (less common as enum members but cover all cases)
	['(', 'LParen'],
	[')', 'RParen'],
	['[', 'LBracket'],
	[']', 'RBracket'],
	['{', 'LBrace'],
	['}', 'RBrace'],
	['</', 'LtSlash'],
	// Boolean literals
	['true', 'True'],
	['false', 'False'],
	// Keywords that appear as enum members (with Kw suffix to avoid collisions)
	['pub', 'PubKw'],
	['mut', 'MutKw'],
	['async', 'AsyncKw'],
	['await', 'AwaitKw'],
	['unsafe', 'UnsafeKw'],
	['move', 'MoveKw'],
	['static', 'StaticKw'],
	['const', 'ConstKw'],
	['type', 'TypeKw'],
	['self', 'SelfKw'],
	['super', 'SuperKw'],
	['crate', 'CrateKw'],
	['extern', 'ExternKw'],
	['use', 'UseKw'],
	['mod', 'ModKw'],
	['fn', 'FnKw'],
	['let', 'LetKw'],
	['in', 'InKw'],
	['if', 'IfKw'],
	['else', 'ElseKw'],
	['for', 'ForKw'],
	['while', 'WhileKw'],
	['loop', 'LoopKw'],
	['match', 'MatchKw'],
	['return', 'ReturnKw'],
	['break', 'BreakKw'],
	['continue', 'ContinueKw'],
	['dyn', 'DynKw'],
	['impl', 'ImplKw'],
	['trait', 'TraitKw'],
	['struct', 'StructKw'],
	['enum', 'EnumKw'],
	['ref', 'RefKw'],
	['where', 'WhereKw'],
	['abstract', 'AbstractKw'],
	['override', 'OverrideKw'],
	['virtual', 'VirtualKw'],
	['typeof', 'TypeofKw'],
	['instanceof', 'InstanceofKw'],
	['new', 'NewKw'],
	['delete', 'DeleteKw'],
	['void', 'VoidKw'],
	['null', 'NullKw'],
	['undefined', 'UndefinedKw'],
	['class', 'ClassKw'],
	['extends', 'ExtendsKw'],
	['import', 'ImportKw'],
	['export', 'ExportKw'],
	['from', 'FromKw'],
	['as', 'AsKw'],
	['of', 'OfKw'],
	['yield', 'YieldKw'],
	['with', 'WithKw'],
	['try', 'TryKw'],
	['catch', 'CatchKw'],
	['finally', 'FinallyKw'],
	['throw', 'ThrowKw'],
	['switch', 'SwitchKw'],
	['case', 'CaseKw'],
	['default', 'DefaultKw'],
	['do', 'DoKw'],
	['package', 'PackageKw'],
	['private', 'PrivateKw'],
	['protected', 'ProtectedKw'],
	['public', 'PublicKw'],
	['interface', 'InterfaceKw'],
	['namespace', 'NamespaceKw'],
	['declare', 'DeclareKw'],
	['readonly', 'ReadonlyKw'],
	['abstract', 'AbstractKw'],
	['satisfies', 'SatisfiesKw'],
	['keyof', 'KeyofKw'],
	['infer', 'InferKw'],
	['never', 'NeverKw'],
	['any', 'AnyKw'],
	['unknown', 'UnknownKw'],
	['object', 'ObjectKw'],
	['symbol', 'SymbolKw'],
	['string', 'StringKw'],
	['number', 'NumberKw'],
	['boolean', 'BooleanKw'],
	['bigint', 'BigintKw'],
	['global', 'GlobalKw'],
	['unique', 'UniqueKw'],
	['asserts', 'AssertsKw'],
	['is', 'IsKw'],
	['not', 'NotKw'],
	['and', 'AndKw'],
	['or', 'OrKw'],
	['lambda', 'LambdaKw'],
	['pass', 'PassKw'],
	['None', 'NoneKw'],
	['True', 'TrueKw'],
	['False', 'FalseKw'],
	// Rust-specific primitives
	['u8', 'U8'],
	['i8', 'I8'],
	['u16', 'U16'],
	['i16', 'I16'],
	['u32', 'U32'],
	['i32', 'I32'],
	['u64', 'U64'],
	['i64', 'I64'],
	['u128', 'U128'],
	['i128', 'I128'],
	['usize', 'Usize'],
	['isize', 'Isize'],
	['f32', 'F32'],
	['f64', 'F64'],
	['bool', 'Bool'],
	['str', 'Str'],
	['char', 'Char'],
	// Fragment specifiers
	['block', 'Block'],
	['expr', 'Expr'],
	['expr_2021', 'Expr2021'],
	['ident', 'Ident'],
	['item', 'Item'],
	['lifetime', 'Lifetime'],
	['literal', 'Literal'],
	['meta', 'Meta'],
	['pat', 'Pat'],
	['pat_param', 'PatParam'],
	['path', 'Path'],
	['stmt', 'Stmt'],
	['tt', 'Tt'],
	['ty', 'Ty'],
	['vis', 'Vis']
]);

/**
 * Convert a literal text value to a safe Rust PascalCase enum variant name.
 *
 * Lookup order:
 * 1. Exact match in `LITERAL_TO_VARIANT_NAME` (operator/keyword/symbol table).
 * 2. Alphanumeric identifier: PascalCase the token (e.g. `async_block` → `AsyncBlock`).
 * 3. Fallback: encode each byte as `U{hex}` to guarantee a valid Rust identifier.
 *
 * @param literal - The grammar literal string (e.g. `"+"`, `"mut"`, `"u8"`).
 */
function literalToVariantName(literal: string): string {
	const known = LITERAL_TO_VARIANT_NAME.get(literal);
	if (known !== undefined) return known;

	// Alphanumeric / underscore — PascalCase each segment.
	if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(literal)) {
		const pascal = literal
			.split('_')
			.filter(Boolean)
			.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
			.join('');
		if (pascal.length > 0 && /^[A-Za-z]/.test(pascal)) {
			return RUST_KEYWORDS.has(pascal) ? `${pascal}Kw` : pascal;
		}
	}

	// Fallback: encode each code-point as hex with a leading `V` prefix.
	const hex = [...literal].map((c) => c.codePointAt(0)!.toString(16).padStart(2, '0')).join('_');
	return `V${hex}`;
}

/**
 * True when an `AssembledEnum` has exactly one member value.
 *
 * Single-member enums are presence markers — the field either holds
 * the one known literal or is absent. The Rust transport layer maps
 * these to plain `bool` rather than a single-variant enum type, and
 * JS sends `true`/`false` (or omits the field) instead of an object
 * with `$text`. This eliminates the enum struct entirely and lets
 * `#[napi(object)]` handle the bool field automatically.
 */
/**
 * Enum type name for an `AssembledEnum` node. Appends `Enum` to the typeName
 * (PascalCase) to avoid collision with the companion `*Transport` struct naming
 * convention. Used by the parent transport struct field type.
 *
 * Example: typeName `BinaryExpressionOperator` → `BinaryExpressionOperatorEnum`.
 */
function enumTypeName(node: AssembledEnum): string {
	return `${rustTypeIdent(node.typeName)}Enum`;
}

/**
 * Emit a Rust enum type for an `AssembledEnum` node (synthesized field-enum
 * or pre-existing grammar enum). Replaces the `text: String` leaf-struct path
 * with a closed, statically-known variant set.
 * Emits for multi-member enums:
 * - `#[derive(Debug, Clone, Copy)] pub enum XxxEnum { ... }`
 * - `impl FromNapiValue` — reads a plain `u16` KindId (no heap allocation)
 *   and dispatches to the correct variant via a match on numeric IDs.
 *   Falls back to `$text: String` matching when `kindEntries` is absent.
 * - `impl RenderableTransport` — writes the static literal text per variant
 * - `impl Display` — writes the static literal text per variant
 *
 * @param node - the AssembledEnum node
 * @param hasNapi - whether napi-bindings feature is present (from generatedIdTables)
 * @param kindEntries - catalog entries for KindId lookup; when present, emits
 *   numeric `u16` dispatch in `FromNapiValue` instead of `$text: String` matching
 */
function renderEnumType(node: AssembledEnum, hasNapi: boolean, kindEntries?: readonly KindEnumEntry[]): string[] {
	const enumName = enumTypeName(node);
	const values = node.values;
	const lines: string[] = [];

	// --- Rust enum declaration ---
	lines.push(`#[derive(Debug, Clone, Copy, PartialEq, Eq)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const v of values) {
		lines.push(`    ${literalToVariantName(v)},`);
	}
	lines.push(`}`);
	lines.push('');

	// --- impl FromNapiValue ---
	if (hasNapi) {
		lines.push(`#[cfg(feature = "napi-bindings")]`);
		lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${enumName} {`);
		lines.push(`    unsafe fn from_napi_value(`);
		lines.push(`        env: ::napi::sys::napi_env,`);
		lines.push(`        napi_val: ::napi::sys::napi_value,`);
		lines.push(`    ) -> ::napi::Result<Self> {`);

		if (kindEntries !== undefined) {
			// Fix 2: read a plain u16 KindId — no heap allocation, no object property lookup.
			// JS sends the numeric parser.c symbol ID directly for each enum member.
			lines.push(`        let kind_id: u16 = u16::from_napi_value(env, napi_val)?;`);
			lines.push(`        match kind_id {`);
			for (const v of values) {
				const entry = findKindEntry(kindEntries, v);
				const variant = literalToVariantName(v);
				if (entry !== undefined) {
					lines.push(`            ${entry.id} => Ok(Self::${variant}), // ${JSON.stringify(v)}`);
				} else {
					// No catalog entry for this literal — emit a commented-out arm.
					// This arm will never match at runtime (the value has no parser symbol);
					// the unreachable comment signals that the literal is synthesized.
					lines.push(`            // ${JSON.stringify(v)}: no parser symbol — cannot dispatch by KindId`);
				}
			}
			lines.push(`            other => Err(::napi::Error::from_reason(format!(`);
			lines.push(`                "unknown kind id {{other}} for ${enumName}",`);
			lines.push(`            ))),`);
			lines.push(`        }`);
		} else {
			// Fallback: kindEntries unavailable (parser.c not found) — read $text string.
			lines.push(`        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
			lines.push(`        let text: String = obj.get("$text")?`);
			lines.push(
				`            .ok_or_else(|| ::napi::Error::from_reason(${JSON.stringify(`$text property missing in ${enumName}`)}))?;`
			);
			lines.push(`        match text.as_str() {`);
			for (const v of values) {
				const variant = literalToVariantName(v);
				lines.push(`            ${JSON.stringify(v)} => Ok(Self::${variant}),`);
			}
			lines.push(`            other => Err(::napi::Error::from_reason(format!(`);
			lines.push(`                "unknown $text value {:?} for ${enumName}",`);
			lines.push(`                other`);
			lines.push(`            ))),`);
			lines.push(`        }`);
		}

		lines.push(`    }`);
		lines.push(`}`);
		lines.push('');

		// Stub ToNapiValue — enum is receive-only (JS → Rust).
		lines.push(`#[cfg(feature = "napi-bindings")]`);
		lines.push(`impl ::napi::bindgen_prelude::ToNapiValue for ${enumName} {`);
		lines.push(`    unsafe fn to_napi_value(`);
		lines.push(`        _env: ::napi::sys::napi_env,`);
		lines.push(`        _val: Self,`);
		lines.push(`    ) -> ::napi::Result<::napi::sys::napi_value> {`);
		lines.push(`        Err(::napi::Error::from_reason(${JSON.stringify(`${enumName} is receive-only`)}))`);
		lines.push(`    }`);
		lines.push(`}`);
		lines.push('');
	}

	// --- impl Display ---
	lines.push(`impl ::std::fmt::Display for ${enumName} {`);
	lines.push(`    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {`);
	lines.push(`        f.write_str(match self {`);
	for (const v of values) {
		const variant = literalToVariantName(v);
		lines.push(`            Self::${variant} => ${JSON.stringify(v)},`);
	}
	lines.push(`        })`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');

	// --- impl RenderableTransport ---
	lines.push(`impl RenderableTransport for ${enumName} {`);
	lines.push(`    fn render_into(`);
	lines.push(`        &self,`);
	lines.push(`        dest: &mut dyn ::std::fmt::Write,`);
	lines.push(`    ) -> Result<(), ::askama::Error> {`);
	lines.push(`        dest.write_str(match self {`);
	for (const v of values) {
		const variant = literalToVariantName(v);
		lines.push(`            Self::${variant} => ${JSON.stringify(v)},`);
	}
	lines.push(`        }).map_err(::askama::Error::from)`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');

	return lines;
}
