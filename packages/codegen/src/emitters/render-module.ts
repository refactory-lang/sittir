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
import type {
	AssembledNode,
	RenderTemplateSurface,
	AssembledField,
	AssembledChild,
	AssembledGroup,
	AssembledSupertype,
	UnresolvedRef
} from '../compiler/node-map.ts';
import {
	AssembledContainer,
	AssembledPolymorph,
	isMultiple,
	isRequired,
	isNodeRef,
	isUnresolvedRef
} from '../compiler/node-map.ts';
import { assertNever } from '../polymorph-variant.ts';
import { compileWordMatcher } from '../compiler/common.ts';
import type { TemplateFile } from './template-hash.ts';
import { computeTemplateBundleHash } from './template-hash.ts';
import { renderModuleSrcDir } from './render-module-paths.ts';
import {
	collectTransportProjection,
	type TransportLiteral
} from './transport-projection.ts';
import {
	collectKindEntries,
	collectCatalogKinds,
	kindIdMemberName,
	type KindEnumEntry
} from './kind-discriminant.ts';
import { toScreamingSnakeCase } from './kind-id-rust.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';

/** Grammars the emitter supports. Matches the three per-grammar packages. */
export type Grammar = 'rust' | 'typescript' | 'python';

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
	/** `rust/crates/sittir-{lang}/src/render/templates.rs` (T027/T028/T029) */
	templatesRs: { path: string; contents: string };
	/** `rust/crates/sittir-{lang}/src/render/mod.rs` (T028 — exposes render_dispatch) */
	libRs: { path: string; contents: string };
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

function templatesRsHeader(lang: Grammar): string {
	return `// @generated from packages/${lang}/node-model.json5 and packages/${lang}/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --all --output packages/${lang}/src
//
// Per-kind askama template structs + direct render helpers + render_dispatch
// for the ${lang} grammar. Every struct in this file is backed by a
// sibling \`.jinja\` template under \`templates/\`, copied from
// \`packages/${lang}/templates/\` at codegen time (spec 012 T030).
//
// Templates and fields are derived from:
//   - template bodies in packages/${lang}/templates/*.jinja
//   - node-model metadata assembled by the codegen pipeline
//
// Askama parses each \`.jinja\` at \`cargo build\` time — any mismatch
// between a template's referenced variables and its backing struct's
// fields is caught at compile time (FR-008). If you see a build error
// here, the codegen is out of sync: regenerate via the command above.`;
}

type EmittedNonterminalView = 'scalar' | 'list' | 'field';

// ----------------------------------------------------------------------
// Rust identifier safety
// ----------------------------------------------------------------------

const RUST_KEYWORDS = new Set([
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

/** Keywords that CANNOT be raw identifiers in Rust — they must be
 *  renamed. Used to emit `${kw}_` as a disambiguated field name; the
 *  `render_dispatch` arm still populates from `ctx.fields[kw]` so the
 *  template's `{{ kw }}` reference resolves. Askama's variable→field
 *  mapping doesn't handle the rename, though, so templates that
 *  reference these names will fail compilation — they require a
 *  template-author-side fix (rename the grammar field or a codegen
 *  pre-pass that renames at emit time). */
const RUST_NON_RAWABLE_KEYWORDS = new Set(['crate', 'self', 'super', 'Self']);

/**
 * Per-supertype transport enum names that collide with pre-existing
 * generated items and must be skipped during Phase 2 supertype-enum
 * emission.  The `_literal` supertype has `typeName = 'Literal'` which
 * would produce `pub enum LiteralTransport`, clashing with the
 * `pub struct LiteralTransport` emitted by `renderLiteralTransportStruct`
 * for anonymous inline token literals.  Skip the enum; slots that would
 * have used it fall back to `Box<AnyTransport>` (`heterogeneous`).
 */
const RESERVED_SUPERTYPE_ENUM_NAMES = new Set(['LiteralTransport']);

/** Rust keyword → raw-identifier form. Askama lets us declare the
 *  struct field under `r#kw` and still use `{{ kw }}` in the template
 *  because askama resolves template variables by the field's raw name.
 *  A small set (`crate` / `self` / `super` / `Self`) can't be raw-
 *  identifier'd — those get a `_`-suffix rename. */
function rustFieldIdent(id: string): string {
	if (RUST_NON_RAWABLE_KEYWORDS.has(id)) return `${id}_`;
	if (RUST_KEYWORDS.has(id)) return `r#${id}`;
	return id;
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
	hasVariant: boolean;
	hasText: boolean;
}

function emitStruct(
	kind: string,
	node: AssembledNode | undefined,
	surface: RenderTemplateSurface
): EmittedStruct {
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
		for (const f of node.structuralFields) {
			multipleByName.set(f.name, isMultiple(f));
			requiredByName.set(f.name, isRequired(f));
		}
	}
	const fields: EmittedField[] = surface.slots.map((slot) => ({
		...slot,
		multiple: multipleByName.get(slot.name) ?? false,
		// Override required from assembly if available; fall back to surface.
		required: requiredByName.has(slot.name)
			? (requiredByName.get(slot.name) as boolean)
			: slot.required,
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
		transportHasChildren: node ? node.structuralChildren.length > 0 : false,
		childrenRequired: node
			? hasRequiredChild(node.structuralChildren)
			: false,
		hasVariant: surface.usesVariant,
		hasText: surface.usesText
	};
}

function renderStructDefs(structs: EmittedStruct[]): string {
	const lines: string[] = [];
	for (const s of structs) {
		lines.push(`#[derive(::askama::Template)]`);
		lines.push(
			`#[template(path = ${JSON.stringify(`${s.kind}.jinja`)}, escape = "none")]`
		);
		lines.push(`pub struct ${s.name}<'a> {`);
		if (s.hasChildren) {
			lines.push(`    pub children: ::sittir_core::filters::ListNonterminalView<'a>,`);
		}
		if (s.hasVariant) {
			lines.push(`    pub variant: &'a str,`);
		}
		if (s.hasText) {
			lines.push(`    pub text: &'a str,`);
		}
		for (const f of s.fields) {
			lines.push(
				`    pub ${rustFieldIdent(f.name)}: ${slotFieldType(f)},`
			);
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
	const C = '::sittir_core::filters::';
	// list view OR field-view-with-multiple → always-list
	if (f.view === 'list' || (f.view === 'field' && f.multiple)) {
		return `${C}ListNonterminalView<'a>`;
	}
	// scalar OR field-view-single
	if (f.required) return `${C}SingleNonterminalView<'a>`;
	return `${C}OptionalNonterminalView<'a>`;
}

function renderDirectSupport(
	meta: MetaData,
	kindIdByKind?: ReadonlyMap<string, number>
): string {
	const lines: string[] = [];
	lines.push(`use ::askama::Template as _AskamaTemplate;`);
	lines.push(`use ::sittir_core::types::{FieldValue, NodeData};`);
	lines.push('');
	lines.push(`#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]`);
	lines.push(`enum ResolvedFieldKind {`);
	lines.push(`    #[default]`);
	lines.push(`    Missing,`);
	lines.push(`    Scalar,`);
	lines.push(`    List,`);
	lines.push(`}`);
	lines.push('');
	lines.push(`#[derive(Debug, Default)]`);
	lines.push(`struct ResolvedField {`);
	lines.push(`    kind: ResolvedFieldKind,`);
	lines.push(`    scalar: String,`);
	lines.push(`    items: Vec<String>,`);
	lines.push(`    separator: &'static str,`);
	lines.push(`    leading_sep: bool,`);
	lines.push(`    trailing_sep: bool,`);
	lines.push(`}`);
	lines.push('');
	lines.push(`impl ResolvedField {`);
	lines.push(`    fn from_scalar(value: String) -> Self {`);
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
		`    fn from_items(items: Vec<String>, separator: &'static str, leading_sep: bool, trailing_sep: bool) -> Self {`
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
	lines.push(`    fn as_scalar(&self) -> &str {`);
	lines.push(`        self.scalar.as_str()`);
	lines.push(`    }`);
	lines.push('');
	lines.push(`    fn renderable_items(&self) -> Vec<::sittir_core::filters::Renderable<'_>> {`);
	lines.push(`        self.items.iter().map(|s| ::sittir_core::filters::Renderable::Text(s.as_str())).collect()`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	if (kindIdByKind !== undefined) {
		// Phase C: NodeData.type_ is KindId (u16). Match on numeric IDs.
		lines.push(`fn separator_for(kind_id: u16) -> &'static str {`);
		lines.push(`    match kind_id {`);
		for (const [k, s] of Array.from(meta.separators.entries()).sort(([a], [b]) =>
			a.localeCompare(b)
		)) {
			const id = kindIdByKind.get(k);
			if (id !== undefined) {
				lines.push(`        ${id} => ${JSON.stringify(s)}, // ${JSON.stringify(k)}`);
			}
		}
		lines.push(`        _ => "",`);
		lines.push(`    }`);
		lines.push(`}`);
		lines.push('');
		lines.push(
			`fn variant_for(parent_id: u16, child_id: u16) -> Option<&'static str> {`
		);
		lines.push(`    match (parent_id, child_id) {`);
		const sortedVariants: [string, string, string][] = [];
		for (const [parent, map] of meta.variants) {
			for (const [child, label] of map)
				sortedVariants.push([parent, child, label]);
		}
		sortedVariants.sort(
			(a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1])
		);
		for (const [parent, child, label] of sortedVariants) {
			const parentId = kindIdByKind.get(parent);
			const childId = kindIdByKind.get(child);
			if (parentId !== undefined && childId !== undefined) {
				lines.push(
					`        (${parentId}, ${childId}) => Some(${JSON.stringify(label)}), // (${JSON.stringify(parent)}, ${JSON.stringify(child)})`
				);
			}
		}
		lines.push(`        _ => None,`);
		lines.push(`    }`);
		lines.push(`}`);
		lines.push('');
		lines.push(`fn first_named_child_kind_id(node: &NodeData) -> Option<u16> {`);
		lines.push(
			`    node.children.as_ref()?.iter().find(|child| child.named).map(|child| child.type_.0)`
		);
		lines.push(`}`);
		lines.push('');
		lines.push(`fn resolve_variant(node: &NodeData) -> &'static str {`);
		lines.push(`    first_named_child_kind_id(node)`);
		lines.push(
			`        .and_then(|child_id| variant_for(node.type_.0, child_id))`
		);
		lines.push(`        .unwrap_or("")`);
		lines.push(`}`);
	} else {
		// Fallback: no kindEntries (parser.c unavailable). Emit numeric functions
		// with only a `_ =>` arm — no IDs available to populate match arms.
		// NodeData.type_ is KindId regardless, so the functions take u16.
		lines.push(`fn separator_for(_kind_id: u16) -> &'static str {`);
		lines.push(`    ""`);
		lines.push(`}`);
		lines.push('');
		lines.push(
			`fn variant_for(_parent_id: u16, _child_id: u16) -> Option<&'static str> {`
		);
		lines.push(`    None`);
		lines.push(`}`);
		lines.push('');
		lines.push(`fn first_named_child_kind_id(node: &NodeData) -> Option<u16> {`);
		lines.push(
			`    node.children.as_ref()?.iter().find(|child| child.named).map(|child| child.type_.0)`
		);
		lines.push(`}`);
		lines.push('');
		lines.push(`fn resolve_variant(node: &NodeData) -> &'static str {`);
		lines.push(`    first_named_child_kind_id(node)`);
		lines.push(`        .and_then(|child_id| variant_for(node.type_.0, child_id))`);
		lines.push(`        .unwrap_or("")`);
		lines.push(`}`);
	}
	lines.push('');
	lines.push(
		`fn render_node_value(node: &NodeData) -> Result<String, ::askama::Error> {`
	);
	lines.push(`    render_dispatch(node)`);
	lines.push(`}`);
	lines.push('');
	lines.push(
		`fn missing_required_field(node: &NodeData, name: &str) -> ::askama::Error {`
	);
	lines.push(`    ::askama::Error::Custom(`);
	lines.push(
		`        format!("render_dispatch: missing required field '{}' on '{}'", name, node.type_).into(),`
	);
	lines.push(`    )`);
	lines.push(`}`);
	lines.push('');
	lines.push(
		`fn resolve_text(node: &NodeData) -> Result<String, ::askama::Error> {`
	);
	lines.push(`    if let Some(text) = &node.text {`);
	lines.push(`        return Ok(text.clone());`);
	lines.push(`    }`);
	lines.push(`    let mut parts = Vec::new();`);
	lines.push(`    if let Some(fields) = &node.fields {`);
	lines.push(`        for value in fields.values() {`);
	lines.push(`            match value {`);
	lines.push(
		`                FieldValue::Single(child) => parts.push(render_node_value(child)?),`
	);
	lines.push(`                FieldValue::Multiple(items) => {`);
	lines.push(`                    for child in items {`);
	lines.push(`                        parts.push(render_node_value(child)?);`);
	lines.push(`                    }`);
	lines.push(`                }`);
	lines.push(
		`                FieldValue::Text(text) => parts.push(text.clone()),`
	);
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
	lines.push(
		`fn resolve_leaf<'a>(node: &'a NodeData, name: &str) -> Option<&'a str> {`
	);
	lines.push(
		`    match node.fields.as_ref().and_then(|fields| fields.get(name)) {`
	);
	lines.push(
		`        Some(FieldValue::Single(child)) => child.text.as_deref(),`
	);
	lines.push(`        Some(FieldValue::Text(text)) => Some(text.as_str()),`);
	lines.push(`        _ => None,`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(
		`fn resolve_optional(node: &NodeData, name: &str) -> Result<Option<String>, ::askama::Error> {`
	);
	lines.push(
		`    match node.fields.as_ref().and_then(|fields| fields.get(name)) {`
	);
	lines.push(`        None => Ok(None),`);
	lines.push(
		`        Some(FieldValue::Text(text)) => Ok((!text.is_empty()).then(|| text.clone())),`
	);
	lines.push(`        Some(FieldValue::Single(child)) => {`);
	lines.push(`            let rendered = render_node_value(child)?;`);
	lines.push(`            Ok((!rendered.is_empty()).then_some(rendered))`);
	lines.push(`        }`);
	lines.push(`        Some(FieldValue::Multiple(_)) => {`);
	lines.push(`            let resolved = resolve_field(node, name, false)?;`);
	lines.push(
		`            Ok((!resolved.scalar.is_empty()).then_some(resolved.scalar))`
	);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(
		`fn resolve_required(node: &NodeData, name: &str) -> Result<String, ::askama::Error> {`
	);
	lines.push(
		`    match node.fields.as_ref().and_then(|fields| fields.get(name)) {`
	);
	lines.push(`        None => Err(missing_required_field(node, name)),`);
	lines.push(
		`        Some(_) => Ok(resolve_optional(node, name)?.unwrap_or_default()),`
	);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(`fn is_join_flank_token(text: &str) -> bool {`);
	lines.push(`    matches!(text, "," | ";")`);
	lines.push(`}`);
	lines.push('');
	lines.push(
		`fn detect_field_trailing_sep(node: &NodeData, field_name: &str) -> bool {`
	);
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
	lines.push(
		`            FieldValue::Multiple(items) => items.iter().collect(),`
	);
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
	lines.push(
		`                if span.start >= boundary && child.text.as_deref().map_or(false, is_join_flank_token) {`
	);
	lines.push(`                    return true;`);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`    false`);
	lines.push(`}`);
	lines.push('');
	lines.push(
		`fn resolve_field(node: &NodeData, name: &str, required: bool) -> Result<ResolvedField, ::askama::Error> {`
	);
	lines.push(
		`    match node.fields.as_ref().and_then(|fields| fields.get(name)) {`
	);
	lines.push(`        None => {`);
	lines.push(`            if required {`);
	lines.push(`                Err(missing_required_field(node, name))`);
	lines.push(`            } else {`);
	lines.push(`                Ok(ResolvedField::default())`);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(
		`        Some(FieldValue::Text(text)) => Ok(ResolvedField::from_scalar(text.clone())),`
	);
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
		`fn resolve_children(node: &NodeData, consumed_fields: &[&str]) -> Result<ResolvedField, ::askama::Error> {`
	);
	lines.push(
		`    let mut child_nodes: Vec<(u32, usize, &NodeData)> = Vec::new();`
	);
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
	lines.push(
		`            child_nodes.push((child.span.map_or(u32::MAX, |span| span.start), child_ordinal, child));`
	);
	lines.push(`            child_ordinal += 1;`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`    if let Some(fields) = &node.fields {`);
	lines.push(`        for (name, value) in fields {`);
	lines.push(
		`            if consumed_fields.iter().any(|consumed| consumed == &name.as_str()) {`
	);
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
	lines.push(
		`    child_nodes.sort_by(|left, right| left.0.cmp(&right.0).then(left.1.cmp(&right.1)));`
	);
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
	lines.push('');
	lines.push(
		`fn token_shaped_fallback(node: &NodeData) -> Result<String, ::askama::Error> {`
	);
	lines.push(
		`    let fields_all_anon = node.fields.as_ref().map_or(true, |fields| {`
	);
	lines.push(`        fields.values().all(|value| match value {`);
	lines.push(`            FieldValue::Single(item) => !item.named,`);
	lines.push(
		`            FieldValue::Multiple(items) => items.iter().all(|item| !item.named),`
	);
	lines.push(`            FieldValue::Text(_) => true,`);
	lines.push(`        })`);
	lines.push(`    });`);
	lines.push(
		`    let children_all_anon = node.children.as_ref().map_or(true, |children| children.iter().all(|child| !child.named));`
	);
	lines.push(`    if fields_all_anon && children_all_anon {`);
	lines.push(`        if let Some(text) = &node.text {`);
	lines.push(`            return Ok(text.clone());`);
	lines.push(`        }`);
	lines.push(`        let mut parts = Vec::new();`);
	lines.push(`        if let Some(fields) = &node.fields {`);
	lines.push(`            for value in fields.values() {`);
	lines.push(`                match value {`);
	lines.push(`                    FieldValue::Single(item) => {`);
	lines.push(`                        if let Some(text) = &item.text {`);
	lines.push(`                            parts.push(text.clone());`);
	lines.push(`                        }`);
	lines.push(`                    }`);
	lines.push(`                    FieldValue::Multiple(items) => {`);
	lines.push(`                        for item in items {`);
	lines.push(`                            if let Some(text) = &item.text {`);
	lines.push(`                                parts.push(text.clone());`);
	lines.push(`                            }`);
	lines.push(`                        }`);
	lines.push(`                    }`);
	lines.push(
		`                    FieldValue::Text(text) => parts.push(text.clone()),`
	);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(`        if let Some(children) = &node.children {`);
	lines.push(`            for child in children {`);
	lines.push(`                if let Some(text) = &child.text {`);
	lines.push(`                    parts.push(text.clone());`);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(`        }`);
	lines.push(`        if !parts.is_empty() {`);
	lines.push(`            return Ok(parts.join(""));`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`    Err(::askama::Error::Custom(`);
	lines.push(
		`        format!("render_dispatch: no template for kind '{}'", node.type_).into(),`
	);
	lines.push(`    ))`);
	lines.push(`}`);
	return lines.join('\n');
}

function renderPerKindFns(structs: EmittedStruct[]): string {
	const lines: string[] = [];
	for (const s of structs) {
		lines.push(
			`fn ${renderFnName(s.kind)}(node: &NodeData) -> Result<String, ::askama::Error> {`
		);
		const consumedFieldArgs =
			s.fields.length === 0
				? '&[]'
				: `&[${s.fields.map((field) => JSON.stringify(field.name)).join(', ')}]`;
		lines.push(
			`    let children = resolve_children(node, ${consumedFieldArgs})?;`
		);
		for (const [index, f] of s.fields.entries()) {
			lines.push(
				`    let field_${index} = resolve_field(node, ${JSON.stringify(f.name)}, ${f.required})?;`
			);
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
			lines.push(
				`    let field_${index}_renderables = field_${index}.renderable_items();`
			);
		}
		lines.push(`    let template = ${s.name} {`);
		if (s.hasChildren) {
			lines.push(`        children: ::sittir_core::filters::ListNonterminalView {`);
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
				lines.push(`        ${rIdent}: ::sittir_core::filters::ListNonterminalView {`);
				lines.push(`            items: field_${index}_renderables.as_slice(),`);
				lines.push(`            separator: field_${index}.separator,`);
				lines.push(`            leading: field_${index}.leading_sep,`);
				lines.push(`            trailing: field_${index}.trailing_sep,`);
				lines.push(`        },`);
			} else if (f.required) {
				// Required scalar (view='scalar' or single-valued field-view).
				lines.push(
					`        ${rIdent}: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_${index}.as_scalar())),`
				);
			} else {
				// Optional scalar — use ResolvedField.kind to gate Missing vs Present.
				lines.push(`        ${rIdent}: match field_${index}.kind {`);
				lines.push(`            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,`);
				lines.push(`            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_${index}.as_scalar())),`);
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

function renderDispatchFn(
	structs: EmittedStruct[],
	kindIdByKind?: ReadonlyMap<string, number>
): string {
	const lines: string[] = [];
	lines.push(
		`pub fn render_dispatch(node: &::sittir_core::types::NodeData) -> Result<String, ::askama::Error> {`
	);
	lines.push(`    if node.fields.is_none() && node.children.is_none() {`);
	lines.push(`        if let Some(text) = &node.text {`);
	lines.push(`            return Ok(text.clone());`);
	lines.push(`        }`);
	lines.push(`    }`);
	if (kindIdByKind !== undefined) {
		// Phase C: NodeData.type_ is KindId — match on numeric id.
		lines.push(`    match node.type_.0 {`);
		for (const s of structs) {
			// Collect all string aliases for this kind (hidden + visible forms)
			// and resolve each to its numeric id. Emit a multi-arm pattern for
			// each distinct id, comment-annotated with the string kind name.
			const kindAliases: string[] = [s.kind];
			if (s.kind.startsWith('_')) {
				// Some hidden kinds are aliased to a visible name — include both.
				const visible = s.kind.replace(/^_+/, '');
				if (kindIdByKind.has(visible)) kindAliases.push(visible);
			}
			const ids = new Set(
				kindAliases
					.map((k) => kindIdByKind.get(k))
					.filter((id): id is number => id !== undefined)
			);
			if (ids.size === 0) continue; // no parser symbol — skip
			const patternParts = [...ids].map((id) => String(id));
			const comment = kindAliases.map((k) => JSON.stringify(k)).join(' | ');
			lines.push(
				`        ${patternParts.join(' | ')} => ${renderFnName(s.kind)}(node), // ${comment}`
			);
		}
		lines.push(`        _ => token_shaped_fallback(node),`);
	} else {
		// Fallback: no kindEntries — cannot emit numeric dispatch.
		// Emit an always-fallback match; correct rendering requires kindEntries.
		lines.push(`    match node.type_.0 {`);
		lines.push(`        _ => token_shaped_fallback(node),`);
	}
	lines.push(`    }`);
	lines.push(`}`);
	return lines.join('\n');
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
		// Separator / list-container — only meaningful on containers and
		// branches that expose a repeat separator. `AssembledContainer`
		// surfaces one directly; branches/polymorphs don't in general.
		if (node instanceof AssembledContainer) {
			const sep = node.separator;
			if (sep !== undefined) separators.set(kind, sep);
			// Every container with children is a list-container.
			if (node.children.length > 0) listContainers.add(kind);
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
					const unpaired = node.forms.find(
						(f) => !Array.from(map.values()).includes(f.name) || true
					);
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
 * Classification of a transport slot by its type width.
 *
 * - `concrete`      — exactly one known kind; emit `<Kind>Transport` directly.
 *                     `typeName` is the assembled node's typeName (PascalCase,
 *                     leading-underscore-stripped) used to derive the Rust
 *                     struct name and render fn name. Falls back to the kind
 *                     string when nodeMap is unavailable (test / exported path).
 * - `supertype`     — kind set is a subset of a known assembled supertype's
 *                     resolved subtypes; emit `<Supertype>Transport` enum.
 *                     `supertypeName` is the supertype's `typeName` (PascalCase).
 * - `heterogeneous` — no grammar-bound type (theoretically unreachable in
 *                     sittir's pipeline; retained as a compile-safety escape).
 */
export type SlotClass =
	| { readonly tag: 'concrete'; readonly kind: string; readonly typeName: string }
	| { readonly tag: 'supertype'; readonly supertypeName: string }
	| { readonly tag: 'heterogeneous' };

/**
 * Classify a slot's kind set against the supertype registry.
 *
 * Single source of derivation for slot class — all emitters (field type,
 * children type, render call, list buffer) MUST call this. DRY constraint.
 *
 * Tiebreak when multiple supertypes cover the kinds: the narrower supertype
 * (smallest `subtypes.size`) wins. If tied, Map insertion order (grammar order)
 * is the tiebreak — deterministic across runs.
 *
 * @param kinds - the kind set for this slot (projection.kinds for fields;
 *   deriveChildrenKinds result for children)
 * @param supertypeMap - result of `buildSupertypeTransportSet(nodeMap)`; when
 *   absent (test path / no nodeMap) multi-kind slots fall back to `heterogeneous`.
 */
export function classifySlot(
	kinds: readonly string[],
	supertypeMap: ReadonlyMap<string, ReadonlySet<string>> = new Map()
): SlotClass {
	if (kinds.length === 1) {
		const kind = kinds[0]!;
		return { tag: 'concrete', kind, typeName: kind };
	}
	if (kinds.length === 0) {
		return { tag: 'heterogeneous' };
	}
	const kindSet = new Set(kinds);
	let bestMatch: { supertypeName: string; size: number } | undefined;
	for (const [supertypeName, subtypes] of supertypeMap) {
		if ([...kindSet].every((k) => subtypes.has(k))) {
			if (bestMatch === undefined || subtypes.size < bestMatch.size) {
				bestMatch = { supertypeName, size: subtypes.size };
			}
		}
	}
	if (bestMatch !== undefined) {
		return { tag: 'supertype', supertypeName: bestMatch.supertypeName };
	}
	return { tag: 'heterogeneous' };
}

/**
 * Build a registry of supertype typeName → resolved concrete subtype set
 * from the assembled node map. Reserved for Phase 2; exported for tests.
 *
 * @param nodeMap - the assembled node map for the grammar
 */
export function buildSupertypeTransportSet(
	nodeMap: NodeMap
): Map<string, ReadonlySet<string>> {
	const result = new Map<string, ReadonlySet<string>>();
	for (const [, node] of nodeMap.nodes) {
		if (node.modelType !== 'supertype') continue;
		result.set(node.typeName, new Set((node as AssembledSupertype).subtypes));
	}
	return result;
}

/**
 * Extract the kind set from an `AssembledChild.values` array.
 * Parallel to `AssembledField.projection.kinds` for field slots.
 * Terminal values (inline string literals) are skipped — they do not
 * contribute to the transport type.
 *
 * Unresolved refs are included using their `name` (the grammar kind string,
 * e.g. `_expression`) — mirroring how `AssembledField.projection.kinds` is
 * built in `deriveFieldsRaw`. Children nodes are always unresolved in the
 * assembled IR (the `resolveSlotRefs` pass that would replace them with live
 * `AssembledNode` refs is never run). Using the name lets `classifySlotForEmit`
 * look up the node by kind in `nodeMap.nodes` and resolve the correct
 * supertype / concrete classification.
 *
 * @param child - any AssembledChild (field or children slot)
 * @returns deduplicated list of resolved kind names
 */
export function deriveChildrenKinds(child: AssembledChild): string[] {
	const kinds = new Set<string>();
	for (const v of child.values) {
		if (!isNodeRef(v)) continue;
		kinds.add(
			isUnresolvedRef(v.node)
				? (v.node as UnresolvedRef).name
				: (v.node as AssembledNode).kind
		);
	}
	return [...kinds];
}

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
function classifySlotForEmit(
	kinds: readonly string[],
	nodeMap: NodeMap
): SlotClass {
	const supertypeMap = buildSupertypeTransportSet(nodeMap);
	const cls = classifySlot(kinds, supertypeMap);
	if (cls.tag === 'concrete') {
		const node = nodeMap.nodes.get(cls.kind);
		if (node === undefined) return { tag: 'heterogeneous' }; // unknown kind — no transport struct, use Box<AnyTransport>
		if (node.modelType === 'multi') {
			// Multi nodes have no transport struct — fall back to Box<AnyTransport>.
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
			// Downgrade to `Box<AnyTransport>` (which has both traits).
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
			// render_kw_abstract_marker_transport (NOT render__kw_…_transport).
			return `render_${rustSnakeIdent(cls.typeName)}_transport(${expr})`;
		case 'supertype':
			return `render_${rustSnakeIdent(cls.supertypeName)}_transport(${expr})`;
		case 'heterogeneous':
			return `render_transport_dispatch(${expr})`;
		default:
			return assertNever(cls);
	}
}

// ----------------------------------------------------------------------
// Typed transport dispatch — render_transport_dispatch + per-kind fns
// ----------------------------------------------------------------------

/**
 * Emit per-kind `render_<kind>_transport` functions, per-supertype render
 * helpers, plus the top-level `render_transport_dispatch` that routes
 * `&AnyTransport` to the right fn.
 *
 * Each per-kind fn builds the `*Template` struct directly from the typed
 * transport fields (no `NodeData` round-trip) and calls `template.render()`.
 * This is the direct render path introduced by Task 4 of the renderable-
 * native-views plan.
 *
 * Per-supertype render helpers are emitted AFTER all per-kind fns so every
 * concrete subtype render fn is already declared when the supertype match arm
 * references it.
 *
 * Legacy `render_dispatch(&NodeData)` / `transport_to_node` / etc. are
 * retained as the inverse bridge for callers that still want `NodeData`.
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

	// ---- render_literal_transport ----------------------------------------
	lines.push(
		`fn render_literal_transport(_kind: &str, t: &LiteralTransport) -> Result<String, ::askama::Error> {`
	);
	lines.push(`    Ok(t.text.clone())`);
	lines.push(`}`);
	lines.push('');

	// ---- render_transport_dispatch ---------------------------------------
	lines.push(
		`pub fn render_transport_dispatch(transport: &AnyTransport) -> Result<String, ::askama::Error> {`
	);
	lines.push(`    match transport {`);
	for (const node of nodes) {
		const variant = rustTransportVariantName(node);
		const fnName = rustTypedRenderFnName(node.typeName);
		lines.push(
			`        AnyTransport::${variant}(t) => ${fnName}(t),`
		);
	}
	for (const [index, literal] of literals.entries()) {
		const variant = rustLiteralTransportVariantName(literal, index);
		lines.push(
			`        AnyTransport::${variant}(t) => render_literal_transport(${JSON.stringify(literal.kind)}, t),`
		);
	}
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');

	return lines;
}

/** Rust function name for the typed render fn of a given typeName. */
function rustTypedRenderFnName(typeName: string): string {
	return `render_${rustSnakeIdent(typeName)}_transport`;
}

/**
 * Emit the `render_<kind>_transport(t: &<Kind>Transport)` function for a
 * single node. Dispatches based on modelType:
 *
 * - polymorph → match on enum variants, delegate to per-form fns
 * - branch / container / group → build template struct from typed fields
 * - leaf / keyword / token / enum → return `t.text.clone()`
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
		case 'container':
		case 'group': {
			const struct = structsByKind.get(node.kind);
			if (struct === undefined) {
				// No template for this kind — fall back to joining children/text.
				return renderTypedBranchFallbackFn(node, nodeMap);
			}
			return renderTypedBranchFn(node, struct, meta, nodeMap);
		}
		case 'leaf':
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
 * have no template struct (no `.jinja` file). Renders children by joining
 * their rendered text, or falls back to `transport_text` if there are no
 * children.
 */
function renderTypedBranchFallbackFn(node: AssembledNode, nodeMap: NodeMap): string[] {
	const fnName = rustTypedRenderFnName(node.typeName);
	const structName = rustTransportStructName(node);
	const hasChildren = hasRequiredChild(node.structuralChildren) || node.structuralChildren.length > 0;
	const lines: string[] = [];
	lines.push(`fn ${fnName}(node: &${structName}) -> Result<String, ::askama::Error> {`);
	if (hasChildren) {
		const childrenIsRequired = hasRequiredChild(node.structuralChildren);
		const childrenCls = classifySlotFromChildren(node.structuralChildren, nodeMap);
		const isErased = childrenCls.tag === 'heterogeneous';
		const childExpr = isErased ? 'child.as_ref()' : 'child';
		const childRenderCall = buildSlotRenderCall(childrenCls, childExpr);
		if (childrenIsRequired) {
			lines.push(`    let mut out = String::new();`);
			lines.push(`    for child in node.children.iter() {`);
			lines.push(`        out.push_str(&${childRenderCall}?);`);
			lines.push(`    }`);
			lines.push(`    Ok(out)`);
		} else {
			lines.push(`    let mut out = String::new();`);
			lines.push(`    if let Some(children) = &node.children {`);
			lines.push(`        for child in children.iter() {`);
			lines.push(`            out.push_str(&${childRenderCall}?);`);
			lines.push(`        }`);
			lines.push(`    }`);
			lines.push(`    Ok(out)`);
		}
	} else {
		lines.push(`    Ok(node.transport_text.clone().unwrap_or_default())`);
	}
	lines.push(`}`);
	lines.push('');
	return lines;
}

/**
 * Emit a simple leaf/keyword/token/enum typed render fn that returns the
 * transport text field directly.
 */
function renderTypedLeafFn(node: AssembledNode): string[] {
	const fnName = rustTypedRenderFnName(node.typeName);
	const structName = rustTransportStructName(node);
	return [
		`fn ${fnName}(t: &${structName}) -> Result<String, ::askama::Error> {`,
		`    Ok(t.text.clone())`,
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

	lines.push(`fn ${fnName}(t: &${structName}) -> Result<String, ::askama::Error> {`);
	lines.push(`    match t {`);
	for (const form of node.forms) {
		const formVariant = rustTransportFormVariantName(form);
		const formFn = rustTypedRenderFnName(form.typeName);
		lines.push(`        ${structName}::${formVariant}(data) => ${formFn}(data),`);
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
function buildFieldKindsByName(
	fields: readonly AssembledField[]
): ReadonlyMap<string, readonly string[]> {
	const map = new Map<string, readonly string[]>();
	for (const f of fields) {
		map.set(f.name, f.projection.kinds);
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
function classifySlotFromChildren(
	children: readonly AssembledChild[],
	nodeMap: NodeMap
): SlotClass {
	const allKinds = [...new Set(children.flatMap((c) => deriveChildrenKinds(c)))];
	return classifySlotForEmit(allKinds, nodeMap);
}

/**
 * Emit a branch/container/group typed render fn that builds the template
 * struct from the typed transport fields.
 */
function renderTypedBranchFn(
	node: AssembledNode,
	struct: EmittedStruct,
	meta: MetaData,
	nodeMap: NodeMap
): string[] {
	const lines: string[] = [];
	const fnName = rustTypedRenderFnName(node.typeName);
	const structName = rustTransportStructName(node);
	const separator = meta.separators.get(node.kind) ?? '';

	// Build per-field kind maps for typed render call selection (Phase 1).
	const fieldKindsByName = buildFieldKindsByName(node.structuralFields);
	const childrenCls = classifySlotFromChildren(node.structuralChildren, nodeMap);

	lines.push(`fn ${fnName}(node: &${structName}) -> Result<String, ::askama::Error> {`);
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
		// No template for this parent kind — fall back to returning empty string.
		lines.push(`fn ${fnName}(node: &${structName}) -> Result<String, ::askama::Error> {`);
		lines.push(`    // No template for parent kind ${JSON.stringify(parentKind)} — return empty.`);
		lines.push(`    let _ = node;`);
		lines.push(`    Ok(String::new())`);
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
		hasVariant: parentStruct.hasVariant,
		hasText: parentStruct.hasText
	};

	// Build per-field kind maps for typed render call selection (Phase 1).
	const formFieldKindsByName = buildFieldKindsByName(form.fields);
	const formChildrenCls = classifySlotFromChildren(form.children, nodeMap);

	lines.push(`fn ${fnName}(node: &${structName}) -> Result<String, ::askama::Error> {`);
	lines.push(...buildTypedTemplateBody(formEmittedStruct, separator, formFieldKindsByName, formChildrenCls, nodeMap));
	lines.push(`}`);
	lines.push('');

	return lines;
}

/**
 * Emit the two-step Rust boilerplate that converts a list-shaped transport
 * slot into a `*_buf: Vec<Renderable>` ready for `ListNonterminalView`.
 *
 * For concrete slots the element is already a typed struct reference —
 * no `as_ref()` Box deref needed. For heterogeneous (fallback) slots the
 * existing Box deref applies.
 *
 * @param ident - Rust identifier base (e.g. `"children"`, `"parameters"`).
 * @param required - When `true`, the slot is a required Vec; when `false`
 *   it is `Option<Vec<...>>` and needs `as_deref()`.
 * @param cls - slot classification from `classifySlot`; controls element
 *   type and render call. Defaults to `heterogeneous` for callers that
 *   don't have classification info (legacy path).
 * @returns Lines to splice into the parent function body.
 */
function emitListSlotBuffer(
	ident: string,
	required: boolean,
	cls: SlotClass = { tag: 'heterogeneous' }
): string[] {
	const lines: string[] = [];
	// For concrete slots the element is `&ConcreteType` (no Box).
	// For heterogeneous slots the element is `Box<AnyTransport>` (needs .as_ref()).
	const isErased = cls.tag === 'heterogeneous';
	const itemExpr = isErased ? 't.as_ref()' : 't';
	const renderCall = buildSlotRenderCall(cls, itemExpr);
	if (required) {
		lines.push(`    let ${ident}_strings: Vec<String> = node.${ident}.iter()`);
		lines.push(`        .map(|t| ${renderCall})`);
		lines.push(`        .collect::<Result<Vec<_>, _>>()?;`);
	} else {
		if (isErased) {
			lines.push(`    let ${ident}_owned: &[Box<AnyTransport>] = node.${ident}.as_deref().unwrap_or(&[]);`);
		} else {
			lines.push(`    let ${ident}_owned = node.${ident}.as_deref().unwrap_or(&[]);`);
		}
		lines.push(`    let ${ident}_strings: Vec<String> = ${ident}_owned.iter()`);
		lines.push(`        .map(|t| ${renderCall})`);
		lines.push(`        .collect::<Result<Vec<_>, _>>()?;`);
	}
	lines.push(`    let ${ident}_buf: Vec<::sittir_core::filters::Renderable<'_>> = ${ident}_strings.iter()`);
	lines.push(`        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))`);
	lines.push(`        .collect();`);
	return lines;
}

/**
 * Build the function body that constructs a template struct from typed
 * transport fields and calls `template.render()`.
 *
 * Strategy: render each child / field transport to a `String` first, collect
 * into a `Vec<String>`, then borrow those strings as `Renderable::Text` slices
 * to feed `ListNonterminalView` / `NonterminalView`. This avoids the type mismatch between the
 * grammar-local `Renderable` (which carries `Node(&'a AnyTransport)`) and the
 * `sittir_core::filters::ListNonterminalView` item type (`sittir_core::filters::Renderable`
 * which only has `Text` / `Joined` variants). Two allocations per list slot
 * rather than one, but sound and simple.
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

	// Classify helper — use classifySlotForEmit when nodeMap is available so
	// that supertype/multi single-kind slots fall back to heterogeneous (Phase 1).
	const classify = (kinds: readonly string[]): SlotClass =>
		nodeMap !== undefined ? classifySlotForEmit(kinds, nodeMap) : classifySlot(kinds);

	// Render children to Strings, then borrow as Renderable::Text slices.
	// The transport struct has a `children` field only when transportHasChildren
	// is true. When the template uses children but the transport has none (e.g.
	// BoundedType), skip access and emit an empty buffer for the template slot.
	if (struct.hasChildren) {
		if (struct.transportHasChildren) {
			lines.push(...emitListSlotBuffer('children', struct.childrenRequired, childrenCls));
		} else {
			// Template uses children but transport has no children field —
			// emit an empty buffer so the ListNonterminalView slot in the template is empty.
			lines.push(`    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = Vec::new();`);
		}
	}

	// Render list / multi-field slots to strings, then borrow as Renderable::Text.
	// Only emit access code for slots backed by a transport struct field.
	// Virtual presentation slots (hasTransportField === false) are skipped here
	// and defaulted in the template construction block below.
	for (const f of struct.fields) {
		if (f.view === 'scalar') continue;
		if (!f.hasTransportField) continue;
		const rIdent = rustFieldIdent(f.name);
		if (f.view === 'list' || (f.view === 'field' && f.multiple)) {
			const kinds = fieldKindsByName.get(f.name) ?? [];
			const cls = classify(kinds);
			lines.push(...emitListSlotBuffer(rIdent, f.required, cls));
		}
		// Single-valued 'field' view: rendered inline in template construction below.
	}

	// Render scalar fields to owned Strings (will be borrowed in the template literal).
	for (const f of struct.fields) {
		if (f.view !== 'scalar') continue;
		if (!f.hasTransportField) continue;
		const rIdent = rustFieldIdent(f.name);
		const kinds = fieldKindsByName.get(f.name) ?? [];
		const cls = classify(kinds);
		const isErased = cls.tag === 'heterogeneous';
		if (f.required) {
			const expr = isErased ? `node.${rIdent}.as_ref()` : `&node.${rIdent}`;
			lines.push(
				`    let ${rIdent}_text = ${buildSlotRenderCall(cls, expr)}?;`
			);
		} else {
			lines.push(
				`    let ${rIdent}_text = if let Some(v) = &node.${rIdent} {`
			);
			const expr = isErased ? `v.as_ref()` : `v`;
			lines.push(`        ${buildSlotRenderCall(cls, expr)}?`);
			lines.push(`    } else {`);
			lines.push(`        String::new()`);
			lines.push(`    };`);
		}
	}

	// Render single-valued 'field' view fields to owned Strings.
	for (const f of struct.fields) {
		if (f.view !== 'field' || f.multiple) continue;
		if (!f.hasTransportField) continue;
		const rIdent = rustFieldIdent(f.name);
		const kinds = fieldKindsByName.get(f.name) ?? [];
		const cls = classify(kinds);
		const isErased = cls.tag === 'heterogeneous';
		if (f.required) {
			const expr = isErased ? `node.${rIdent}.as_ref()` : `&node.${rIdent}`;
			lines.push(
				`    let ${rIdent}_rendered = ${buildSlotRenderCall(cls, expr)}?;`
			);
		} else {
			lines.push(
				`    let ${rIdent}_rendered = match &node.${rIdent} {`
			);
			const expr = isErased ? `v.as_ref()` : `v`;
			lines.push(`        Some(v) => Some(${buildSlotRenderCall(cls, expr)}?),`);
			lines.push(`        None => None,`);
			lines.push(`    };`);
		}
	}

	// Build template struct.
	lines.push(`    let template = ${templateName} {`);

	if (struct.hasChildren) {
		lines.push(`        children: ::sittir_core::filters::ListNonterminalView {`);
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
		const C = '::sittir_core::filters::';
		if (f.view === 'list' || (f.view === 'field' && f.multiple)) {
			// Always-list slot. Empty list when transport-field absent.
			const items = f.hasTransportField ? `${rIdent}_buf.as_slice()` : '&[]';
			lines.push(`        ${rIdent}: ${C}ListNonterminalView {`);
			lines.push(`            items: ${items},`);
			lines.push(`            separator: ${sepLiteral},`);
			lines.push(`            leading: false,`);
			lines.push(`            trailing: false,`);
			lines.push(`        },`);
		} else if (f.required) {
			// Required scalar (view='scalar' or view='field' single required).
			if (f.view === 'scalar' && f.hasTransportField) {
				lines.push(
					`        ${rIdent}: ${C}SingleNonterminalView(${C}Renderable::Text(${rIdent}_text.as_str())),`
				);
			} else if (f.hasTransportField) {
				// view='field' single required — pre-rendered to String.
				lines.push(
					`        ${rIdent}: ${C}SingleNonterminalView(${C}Renderable::Text(${rIdent}_rendered.as_str())),`
				);
			} else {
				// Virtual presentation slot — no backing transport field. Wrap
				// empty Text since SingleNonterminalView has no Missing variant.
				lines.push(
					`        ${rIdent}: ${C}SingleNonterminalView(${C}Renderable::Text("")),`
				);
			}
		} else {
			// Optional scalar (view='scalar' optional, or view='field' single optional).
			if (f.view === 'scalar' && f.hasTransportField) {
				lines.push(
					`        ${rIdent}: if node.${rIdent}.is_some() { ${C}OptionalNonterminalView::Present(${C}Renderable::Text(${rIdent}_text.as_str())) } else { ${C}OptionalNonterminalView::Missing },`
				);
			} else if (f.hasTransportField) {
				lines.push(`        ${rIdent}: match &${rIdent}_rendered {`);
				lines.push(
					`            Some(s) => ${C}OptionalNonterminalView::Present(${C}Renderable::Text(s.as_str())),`
				);
				lines.push(
					`            None => ${C}OptionalNonterminalView::Missing,`
				);
				lines.push(`        },`);
			} else {
				lines.push(`        ${rIdent}: ${C}OptionalNonterminalView::Missing,`);
			}
		}
	}

	lines.push(`    };`);
	lines.push(`    template.render()`);

	return lines;
}

// ----------------------------------------------------------------------
// lib.rs — expose render_dispatch + render_transport_dispatch
// ----------------------------------------------------------------------

function libRsContents(lang: Grammar): string {
	return `// @generated from packages/${lang}/node-model.json5 — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --all --output packages/${lang}/src

pub mod hash;
pub mod kind_ids;
pub mod templates;

pub use hash::TEMPLATE_BUNDLE_HASH;
pub use kind_ids::*;
pub use templates::{render_dispatch, render_transport, render_transport_dispatch, render_transport_parts, AnyTransport};
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
 * @returns paired file contents. The CLI writes them + handles the
 *   `.jinja` directory copy separately (T030).
 */
export function emitRenderModule(
	lang: Grammar,
	files: readonly TemplateFile[],
	nodeMap: NodeMap,
	generatedIdTables?: GeneratedIdTables
): RustRenderModuleEmit {
	const { hashRs, hashTs } = emitHashFiles(lang, files);
	const structs: EmittedStruct[] = [];
	const wordMatcher = compileWordMatcher(nodeMap.word, nodeMap.rules ?? {});
	// Same order the hash function sorts under — deterministic output.
	const sortedFiles = [...files].sort((a, b) =>
		a.filename.localeCompare(b.filename)
	);
	for (const f of sortedFiles) {
		if (!f.filename.endsWith('.jinja')) continue;
		const kind = f.filename.slice(0, -'.jinja'.length);
		const node = nodeMap.nodes.get(kind);
		// Only user-facing nodes get templates emitted (see templates.ts
		// emitJinjaTemplates); if the jinja file exists, the node exists
		// and is userFacing.
		const rendered = node?.renderTemplate(
			nodeMap.rules ?? {},
			wordMatcher ?? /\w/,
			nodeMap.externals
		);
		structs.push(
			emitStruct(
				kind,
				node,
				rendered?.surface ?? {
					slots: [],
					usesChildren: false,
					usesVariant: false,
					usesText: false
				}
			)
		);
	}
	const meta = collectMetaData(nodeMap);
	const hasNumericDispatch = generatedIdTables !== undefined;
	const templatesRs = [
		templatesRsHeader(lang),
		'',
		'#![allow(dead_code, unused_imports, non_snake_case, non_camel_case_types, unused_mut, unused_variables)]',
		'',
		// Phase B: `#[napi(object)]` / `#[napi(js_name)]` proc-macro attrs and the
		// custom `impl FromNapiValue` blocks are gated behind the napi-bindings
		// feature.  Struct/field attributes use `#[cfg_attr(feature =
		// "napi-bindings", napi(...))]` so they compile cleanly without the
		// feature; but for `cfg_attr` to resolve the `napi` ident when the
		// feature IS active we still need to import the proc-macro in scope.
		...(hasNumericDispatch
			? ['#[cfg(feature = "napi-bindings")]', 'use ::napi_derive::napi;', '']
			: []),
		// Askama resolves custom filters by looking for a sibling
		// `filters` module at the derive-macro's call site. Re-export the
		// canonical `sittir_core::filters::*` here; flank-aware joins read
		// their optional anon-token side channel from Askama's per-render
		// `Values` bag while `joinby` consumes the generated boolean flank
		// fields directly.
		//
		// `joinby`, `join`, `joinWithTrailing`, `joinWithLeading`, and
		// `joinWithFlanks` now return `Safe<Joined<'a>>` (streaming, zero-alloc).
		// `joinWithTrailing/Leading/Flanks` in `sittir_core` are plain
		// functions (no `#[askama::filter_fn]`); the grammar-local wrappers
		// below add the `#[askama::filter_fn]` attribute so Askama's derive
		// macro can resolve them by name.
		'pub mod filters {',
		'    //! Askama resolves custom-filter names by searching for a',
		'    //! sibling `filters` module at the derive-macro site. This',
		'    //! module wraps the canonical sittir_core implementations with',
		'    //! the `#[askama::filter_fn]` attribute so Askama can call them',
		'    //! from templates.',
		'    use ::sittir_core::filters::{Joined, JoinSource};',
		'',
		'    #[::askama::filter_fn]',
		'    pub fn joinby<\'a, T: JoinSource<\'a> + ?Sized>(',
		'        xs: &\'a T,',
		'        _values: &dyn ::askama::Values,',
		'        sep: &\'a str,',
		'        leading: bool,',
		'        trailing: bool,',
		'    ) -> Result<::askama::filters::Safe<Joined<\'a>>, ::askama::Error> {',
		'        ::sittir_core::filters::joinby(xs, sep, leading, trailing)',
		'    }',
		'',
		'    #[::askama::filter_fn]',
		'    pub fn join<\'a, T: JoinSource<\'a> + ?Sized>(',
		'        xs: &\'a T,',
		'        _values: &dyn ::askama::Values,',
		'        sep: &\'a str,',
		'    ) -> Result<::askama::filters::Safe<Joined<\'a>>, ::askama::Error> {',
		'        ::sittir_core::filters::joinby(xs, sep, false, false)',
		'    }',
		'',
		'    #[::askama::filter_fn]',
		'    #[allow(non_snake_case)]',
		'    pub fn joinWithTrailing<\'a, T: JoinSource<\'a> + ?Sized>(',
		'        xs: &\'a T,',
		'        values: &dyn ::askama::Values,',
		'        sep: &\'a str,',
		'    ) -> Result<::askama::filters::Safe<Joined<\'a>>, ::askama::Error> {',
		'        ::sittir_core::filters::joinWithTrailing(xs, values, sep)',
		'    }',
		'',
		'    #[::askama::filter_fn]',
		'    #[allow(non_snake_case)]',
		'    pub fn joinWithLeading<\'a, T: JoinSource<\'a> + ?Sized>(',
		'        xs: &\'a T,',
		'        values: &dyn ::askama::Values,',
		'        sep: &\'a str,',
		'    ) -> Result<::askama::filters::Safe<Joined<\'a>>, ::askama::Error> {',
		'        ::sittir_core::filters::joinWithLeading(xs, values, sep)',
		'    }',
		'',
		'    #[::askama::filter_fn]',
		'    #[allow(non_snake_case)]',
		'    pub fn joinWithFlanks<\'a, T: JoinSource<\'a> + ?Sized>(',
		'        xs: &\'a T,',
		'        values: &dyn ::askama::Values,',
		'        sep: &\'a str,',
		'    ) -> Result<::askama::filters::Safe<Joined<\'a>>, ::askama::Error> {',
		'        ::sittir_core::filters::joinWithFlanks(xs, values, sep)',
		'    }',
		'',
		'    pub use ::sittir_core::filters::{',
		'        upper, lower,',
		'        isBlank, isPresent,',
		'    };',
		'}',
		'',
		renderTransportSupport(nodeMap, structs, meta, generatedIdTables),
		'',
		renderStructDefs(structs),
		renderDirectSupport(
			meta,
			generatedIdTables
				? buildKindIdByKind(
						collectKindEntries(
							collectCatalogKinds(generatedIdTables),
							nodeMap,
							generatedIdTables
						)
					)
				: undefined
		),
		'',
		renderPerKindFns(structs),
		'',
		renderDispatchFn(
			structs,
			generatedIdTables
				? buildKindIdByKind(
						collectKindEntries(
							collectCatalogKinds(generatedIdTables),
							nodeMap,
							generatedIdTables
						)
					)
				: undefined
		)
	].join('\n');
	return {
		hashRs,
		hashTs,
		templatesRs: {
			path: `${renderModuleSrcDir(lang)}/templates.rs`,
			contents: templatesRs + '\n'
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
	const projection = collectTransportProjection(nodeMap);
	const nodes = projection.nodes;

	// Build kind entries for numeric dispatch when parser.c metadata is available.
	// Source from the catalog superset (children-only kinds + anon tokens) so the
	// AnyTransport dispatch matches the TS-side TSKindId / kindIdFromName universe.
	const kindEntries: readonly KindEnumEntry[] | undefined = generatedIdTables
		? collectKindEntries(
				collectCatalogKinds(generatedIdTables),
				nodeMap,
				generatedIdTables
			)
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
		// Skip supertypes whose enum name collides with a pre-existing type
		// (e.g. `_literal` → `LiteralTransport` clashes with the literal-token struct).
		const enumName = `${rustTypeIdent(node.typeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		supertypeEnumLines.push(...emitSupertypeTransportEnum(node as AssembledSupertype, kidByKind, nodeMap));
	}

	return [
		...anyTransportLines,
		'',
		...renderLiteralTransportStruct(projection.literals),
		'',
		// Per-supertype transport enums must precede per-kind transport structs
		// so struct field type references resolve correctly.
		...(supertypeEnumLines.length > 0 ? [...supertypeEnumLines, ''] : []),
		...nodes.flatMap((node) => renderTransportStruct(node, nodeMap)),
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
function collectUsedSupertypeNames(
	nodes: readonly AssembledNode[],
	nodeMap: NodeMap
): Set<string> {
	const used = new Set<string>();

	/** Accumulate supertype names from a single node's fields + children. */
	const collectFromNode = (
		fields: readonly AssembledField[],
		children: readonly AssembledChild[]
	): void => {
		for (const field of fields) {
			const cls = classifySlotForEmit(field.projection.kinds, nodeMap);
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
			collectFromNode(node.structuralFields, node.structuralChildren);
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
 * Also indexes `displayName` when present so literal kinds (e.g. `"+"`)
 * resolve the same way as their parser-symbol names (`PLUS`).
 */
function buildKindIdByKind(kindEntries: readonly KindEnumEntry[]): ReadonlyMap<string, number> {
	const map = new Map<string, number>();
	for (const e of kindEntries) {
		map.set(e.kind, e.id);
		if (e.displayName !== undefined && !map.has(e.displayName)) {
			map.set(e.displayName, e.id);
		}
	}
	return map;
}

/**
 * Emit `AnyTransport` with the legacy string-tagged `#[serde(tag = "$type")]` derive.
 * Used as a fallback when `generatedIdTables` is unavailable (no parser.c).
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
			return [
				`    #[serde(rename = ${JSON.stringify(node.kind)})]`,
				`    ${variant}(${structName}),`
			].join('\n');
		}),
		...literals.map((literal, index) => {
			const variant = rustLiteralTransportVariantName(literal, index);
			return [
				`    #[serde(rename = ${JSON.stringify(literal.kind)})]`,
				`    ${variant}(LiteralTransport),`
			].join('\n');
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
function renderPolymorphTransportFromNapiValue(
	node: Extract<AssembledNode, { modelType: 'polymorph' }>
): string[] {
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
		n.modelType === 'leaf' ||
		n.modelType === 'keyword' ||
		n.modelType === 'token' ||
		n.modelType === 'enum';

	// Enum declaration — Debug + Clone only; no serde, no napi object derive.
	lines.push(`#[derive(Debug, Clone)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const { subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		const structName = `${rustTypeIdent(subNode.typeName)}Transport`;
		const variantType = isLeafLike(subNode) ? structName : `Box<${structName}>`;
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
		lines.push(`            .ok_or_else(|| ::napi::Error::from_reason(${JSON.stringify(`$type property missing in ${enumName}`)}))?;`);
		lines.push(`        match kind_id {`);
		for (const { subKind, subNode } of validSubtypes) {
			const id = kindIdByKind.get(subKind);
			if (id === undefined) continue; // no catalog entry — skip
			const variant = rustTypeIdent(subNode.typeName);
			const structName = `${rustTypeIdent(subNode.typeName)}Transport`;
			if (isLeafLike(subNode)) {
				lines.push(`            ${id} => Ok(Self::${variant}(`);
				lines.push(`                ${structName}::from_napi_value(env, napi_val)?`);
				lines.push(`            )),`);
			} else {
				lines.push(`            ${id} => Ok(Self::${variant}(Box::new(`);
				lines.push(`                ${structName}::from_napi_value(env, napi_val)?`);
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
		// Fallback: no kindEntries — emit an always-error FromNapiValue stub.
		lines.push(`#[cfg(feature = "napi-bindings")]`);
		lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${enumName} {`);
		lines.push(`    unsafe fn from_napi_value(`);
		lines.push(`        _env: ::napi::sys::napi_env,`);
		lines.push(`        _napi_val: ::napi::sys::napi_value,`);
		lines.push(`    ) -> ::napi::Result<Self> {`);
		lines.push(`        Err(::napi::Error::from_reason(${JSON.stringify(`${enumName}: parser.c metadata unavailable — FromNapiValue not supported`)}))`);
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

	// Bridge helper: converts <Supertype>Transport → Box<AnyTransport> for the
	// NodeData bridge (transport_field_value / transport_children). Each variant
	// wraps the inner concrete transport into the matching AnyTransport variant.
	lines.push(`fn ${rustSnakeIdent(supertypeNode.typeName)}_transport_to_any(t: ${enumName}) -> Box<AnyTransport> {`);
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
				lines.push(`        ${enumName}::${variant}(inner) => Box::new(AnyTransport::${anyVariant}(inner)),`);
			} else {
				lines.push(`        ${enumName}::${variant}(inner) => Box::new(AnyTransport::${anyVariant}(*inner)),`);
			}
		}
	}
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	return lines;
}

/**
 * Emit `render_<supertype>_transport(t: &<Supertype>Transport) -> Result<String, ::askama::Error>`
 * as a bounded match over the enum variants.
 *
 * Each arm delegates to the concrete kind's render fn — same pattern as
 * `renderTypedPolymorphFn`. Arm count is bounded by the supertype's subtype
 * count (~5–40), not the full grammar (~1040 for rust).
 *
 * @param supertypeNode - the assembled supertype node
 * @param nodeMap       - for typeName + modelType lookups
 */
function emitSupertypeRenderHelper(
	supertypeNode: AssembledSupertype,
	nodeMap: NodeMap
): string[] {
	const enumName = `${rustTypeIdent(supertypeNode.typeName)}Transport`;
	const fnName = `render_${rustSnakeIdent(supertypeNode.typeName)}_transport`;
	const lines: string[] = [];

	const isLeafLike = (n: AssembledNode): boolean =>
		n.modelType === 'leaf' ||
		n.modelType === 'keyword' ||
		n.modelType === 'token' ||
		n.modelType === 'enum';

	lines.push(`fn ${fnName}(t: &${enumName}) -> Result<String, ::askama::Error> {`);
	lines.push(`    match t {`);
	for (const subKind of supertypeNode.subtypes) {
		const subNode = nodeMap.nodes.get(subKind);
		if (subNode === undefined) continue; // phantom kind — skip
		const variant = rustTypeIdent(subNode.typeName);
		const concreteFn = rustTypedRenderFnName(subNode.typeName);
		// Non-leaf variants are boxed in the enum; deref with `.as_ref()`.
		const innerExpr = isLeafLike(subNode) ? `inner` : `inner.as_ref()`;
		lines.push(`        ${enumName}::${variant}(inner) => ${concreteFn}(${innerExpr}),`);
	}
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
 * `#[napi(object)]`). Literals fall back to `LiteralTransport::from_napi_value`.
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
	// Index by both `kind` (canonical catalog name) and `displayName` (anon-token
	// literal text). Literal arms are keyed by `literal.kind`, which for
	// component literals carries the literal text (`"+"`) rather than the
	// parser-symbol name (`"PLUS"`). Without the displayName index, `+` and
	// other operator-token literals would fall through to `id === undefined` and
	// silently skip — leaving the dispatch incomplete.
	const kindIdByKind = new Map<string, number>();
	for (const e of kindEntries) {
		kindIdByKind.set(e.kind, e.id);
		if (e.displayName !== undefined && !kindIdByKind.has(e.displayName)) {
			kindIdByKind.set(e.displayName, e.id);
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
		lines.push(`    ${variant}(LiteralTransport),`);
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
	for (const node of nodes) {
		const id = kindIdByKind.get(node.kind);
		if (id === undefined) continue; // no parser symbol — skip
		const variant = rustTransportVariantName(node);
		const structName = rustTransportStructName(node);
		const constName = toScreamingSnakeCase(kindIdMemberName(nodeMap, node.kind), node.kind);
		lines.push(`            // kind: ${node.kind} (${constName})`);
		lines.push(`            ${id} => Ok(AnyTransport::${variant}(`);
		lines.push(`                ${structName}::from_napi_value(env, napi_val)?`);
		lines.push(`            )),`);
	}

	// One match arm per literal kind.
	for (const [index, literal] of literals.entries()) {
		const id = kindIdByKind.get(literal.kind);
		if (id === undefined) continue;
		const variant = rustLiteralTransportVariantName(literal, index);
		lines.push(`            // literal kind: ${literal.kind} → ${JSON.stringify(literal.text)}`);
		lines.push(`            ${id} => Ok(AnyTransport::${variant}(`);
		lines.push(`                LiteralTransport::from_napi_value(env, napi_val)?`);
		lines.push(`            )),`);
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
	// and napi-rs does not provide a blanket impl for Box<T>.
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
		"    Joined(::sittir_core::filters::Joined<'a>),",
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
		'    source: Option<TransportSource>,',
		'    named: Option<bool>,',
		'    default_named: bool,',
		'    text: Option<String>,',
		'    span: Option<::sittir_core::types::Span>,',
		'    node_id: Option<u64>,',
		'    fields: Option<TransportHashMap<String, TransportFieldValue>>,',
		'    children: Option<Vec<TransportNodeData>>,',
		') -> TransportNodeData {',
		'    TransportNodeData {',
		'        type_: kind,',
		'        source: source.unwrap_or(TransportSource::Factory),',
		'        named: named.unwrap_or(default_named),',
		'        fields,',
		'        children,',
		'        text,',
		'        span,',
		'        node_id,',
		'    }',
		'}',
		'',
		'fn transport_field_value(value: Box<AnyTransport>) -> Result<TransportFieldValue, ::askama::Error> {',
		'    let node = transport_to_node(*value)?;',
		'    if !node.named {',
		'        if let Some(text) = node.text.clone() {',
		'            return Ok(TransportFieldValue::Text(text));',
		'        }',
		'    }',
		'    Ok(TransportFieldValue::Single(Box::new(node)))',
		'}',
		'',
		'fn transport_field_values(values: Vec<Box<AnyTransport>>) -> Result<TransportFieldValue, ::askama::Error> {',
		'    let mut nodes = Vec::with_capacity(values.len());',
		'    for value in values {',
		'        nodes.push(transport_to_node(*value)?);',
		'    }',
		'    Ok(TransportFieldValue::Multiple(nodes))',
		'}',
		'',
		'fn transport_children(values: Vec<Box<AnyTransport>>) -> Result<Vec<TransportNodeData>, ::askama::Error> {',
		'    let mut nodes = Vec::with_capacity(values.len());',
		'    for value in values {',
		'        nodes.push(transport_to_node(*value)?);',
		'    }',
		'    Ok(nodes)',
		'}',
		'',
		'fn literal_transport_to_node(kind: TransportKindId, transport: LiteralTransport) -> Result<TransportNodeData, ::askama::Error> {',
		'    Ok(transport_node_data(',
		'        kind,',
		'        transport.transport_source,',
		'        transport.transport_named,',
		'        false,',
		'        Some(transport.text),',
		'        transport.transport_span,',
		// transport_node_id is Option<f64> on the wire (JS number); NodeData uses u64.
		'        transport.transport_node_id.map(|v| v as u64),',
		'        None,',
		'        None,',
		'    ))',
		'}',
		'',
		'fn transport_to_node(transport: AnyTransport) -> Result<TransportNodeData, ::askama::Error> {',
		'    match transport {',
		...nodes.map((node) => {
			return `        AnyTransport::${rustTransportVariantName(node)}(data) => ${rustTransportToNodeFnName(node.typeName)}(data),`;
		}),
		...literals.map((literal, index) => {
			// Phase C: pass TransportKindId(id) instead of string literal.
			const id = kindIdByKind?.get(literal.kind);
			const safeKind = JSON.stringify(rustBlockCommentSafe(literal.kind));
			const kindArg =
				id !== undefined
					? `TransportKindId(${id}) /* ${safeKind} */`
					: `TransportKindId(0) /* ${safeKind} — no parser symbol */`;
			return `        AnyTransport::${rustLiteralTransportVariantName(literal, index)}(data) => literal_transport_to_node(${kindArg}, data),`;
		}),
		'    }',
		'}',
		'',
		...nodes.flatMap((node) => renderTransportToNodeFns(node, kindIdByKind, nodeMap)),
		'pub fn node_data_from_transport(transport: AnyTransport) -> Result<TransportNodeData, ::askama::Error> {',
		'    transport_to_node(transport)',
		'}',
		'',
		'pub fn render_transport_parts(transport: AnyTransport) -> Result<(TransportNodeData, String), ::askama::Error> {',
		'    let node = node_data_from_transport(transport)?;',
		'    let rendered = render_dispatch(&node)?;',
		'    Ok((node, rendered))',
		'}',
		'',
		'pub fn from_transport(transport: AnyTransport) -> Result<String, ::askama::Error> {',
		'    let (_node, rendered) = render_transport_parts(transport)?;',
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
					nodeMap
				)
			);
		}
		return lines;
	}

	switch (node.modelType) {
		case 'branch':
		case 'container':
		case 'group':
			return renderTransportDataToNodeFn(
				rustTransportToNodeFnName(node.typeName),
				rustTransportStructName(node),
				node.kind,
				node.structuralFields,
				node.structuralChildren,
				true,
				true,
				kindIdByKind,
				nodeMap
			);
		case 'leaf':
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
	fields: readonly AssembledField[],
	children: readonly AssembledChild[],
	defaultNamed: boolean,
	hasOptionalText: boolean,
	kindIdByKind?: ReadonlyMap<string, number>,
	nodeMap?: NodeMap
): string[] {
	const kindArg = kindIdExpr(kind, kindIdByKind);
	const lines: string[] = [];
	lines.push(
		`fn ${fnName}(transport: ${structName}) -> Result<TransportNodeData, ::askama::Error> {`
	);
	lines.push('    let mut fields = TransportHashMap::new();');
	for (const field of fields) {
		const access = `transport.${rustFieldIdent(field.name)}`;
		// When nodeMap is available and the field is a single-concrete-kind slot,
		// the struct field type is a concrete transport type (not Box<AnyTransport>).
		// Wrap it back into Box<AnyTransport> for the bridge helper, which expects
		// the type-erased Box form. Fall back to the direct access when the field
		// is already Box<AnyTransport> (heterogeneous / polymorph / supertype / multi).
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
			lines.push(
				`    fields.insert(${JSON.stringify(field.name)}.to_string(), transport_field_value(${bridged})?);`
			);
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
	lines.push(...renderTransportChildrenBinding(children, nodeMap));
	lines.push('    Ok(transport_node_data(');
	lines.push(`        ${kindArg},`);
	lines.push('        transport.transport_source,');
	lines.push('        transport.transport_named,');
	lines.push(`        ${defaultNamed ? 'true' : 'false'},`);
	lines.push(hasOptionalText ? '        transport.transport_text,' : '        None,');
	lines.push('        transport.transport_span,');
	// transport_node_id is Option<f64> on the wire (JS number); NodeData uses u64.
	lines.push('        transport.transport_node_id.map(|v| v as u64),');
	lines.push('        fields,');
	lines.push('        children,');
	lines.push('    ))');
	lines.push('}');
	lines.push('');
	return lines;
}

/**
 * Typed bridge classification for a field — returns how to convert the
 * typed transport field back to `Box<AnyTransport>` for the NodeData bridge.
 *
 * Returns `{ kind: 'concrete', variant }` — wrap with `Box::new(AnyTransport::Variant(…))`.
 * Returns `{ kind: 'supertype', toAnyFn }` — call `<supertype>_transport_to_any(…)`.
 * Returns `undefined` — already `Box<AnyTransport>`, pass unchanged.
 */
type BridgeFieldClass =
	| { readonly kind: 'concrete'; readonly variant: string }
	| { readonly kind: 'supertype'; readonly toAnyFn: string }
	| undefined;

function bridgeClassForField(
	field: AssembledField,
	nodeMap: NodeMap | undefined
): BridgeFieldClass {
	if (nodeMap === undefined) return undefined;
	const cls = classifySlotForEmit(field.projection.kinds, nodeMap);
	if (cls.tag === 'concrete') return { kind: 'concrete', variant: rustTypeIdent(cls.typeName) };
	if (cls.tag === 'supertype') {
		return { kind: 'supertype', toAnyFn: `${rustSnakeIdent(cls.supertypeName)}_transport_to_any` };
	}
	return undefined; // heterogeneous — already Box<AnyTransport>
}

/**
 * For the bridge path: build a Rust expression for a REQUIRED SINGLE field
 * that converts the typed transport value to `Box<AnyTransport>`.
 *
 * - heterogeneous: `access` unchanged (already `Box<AnyTransport>`)
 * - concrete: `Box::new(AnyTransport::Variant(access))`
 * - supertype: `<supertype>_transport_to_any(access)`
 *
 * @param field - the assembled field
 * @param access - Rust expression for the field (e.g. `transport.name`)
 * @param nodeMap - for classification; absent = assume heterogeneous
 */
function buildBridgeSingleRequired(
	field: AssembledField,
	access: string,
	nodeMap: NodeMap | undefined
): string {
	const bc = bridgeClassForField(field, nodeMap);
	if (bc === undefined) return access;
	if (bc.kind === 'concrete') return `Box::new(AnyTransport::${bc.variant}(${access}))`;
	return `${bc.toAnyFn}(${access})`;
}

/**
 * For the bridge path: build a Rust expression for a REQUIRED LIST field
 * that converts each element to `Box<AnyTransport>`.
 *
 * - heterogeneous: `access` unchanged (`Vec<Box<AnyTransport>>`)
 * - concrete: maps to `Vec<Box<AnyTransport>>` via `AnyTransport::Variant`
 * - supertype: maps via `<supertype>_transport_to_any`
 */
function buildBridgeListRequired(
	field: AssembledField,
	access: string,
	nodeMap: NodeMap | undefined
): string {
	const bc = bridgeClassForField(field, nodeMap);
	if (bc === undefined) return access;
	if (bc.kind === 'concrete') {
		return `${access}.into_iter().map(|v| Box::new(AnyTransport::${bc.variant}(v))).collect::<Vec<_>>()`;
	}
	return `${access}.into_iter().map(|v| ${bc.toAnyFn}(v)).collect::<Vec<_>>()`;
}

/**
 * For the bridge path: convert an OPTIONAL SINGLE field's already-unwrapped
 * value (after `if let Some(value) = access`) to `Box<AnyTransport>`.
 */
function buildBridgeOptionalSingle(
	field: AssembledField,
	valueExpr: string,
	nodeMap: NodeMap | undefined
): string {
	const bc = bridgeClassForField(field, nodeMap);
	if (bc === undefined) return valueExpr;
	if (bc.kind === 'concrete') return `Box::new(AnyTransport::${bc.variant}(${valueExpr}))`;
	return `${bc.toAnyFn}(${valueExpr})`;
}

/**
 * For the bridge path: convert an OPTIONAL LIST field's already-unwrapped
 * value (after `if let Some(value) = access`) to `Vec<Box<AnyTransport>>`.
 */
function buildBridgeOptionalList(
	field: AssembledField,
	valueExpr: string,
	nodeMap: NodeMap | undefined
): string {
	const bc = bridgeClassForField(field, nodeMap);
	if (bc === undefined) return valueExpr;
	if (bc.kind === 'concrete') {
		return `${valueExpr}.into_iter().map(|v| Box::new(AnyTransport::${bc.variant}(v))).collect::<Vec<_>>()`;
	}
	return `${valueExpr}.into_iter().map(|v| ${bc.toAnyFn}(v)).collect::<Vec<_>>()`;
}

function renderTransportChildrenBinding(
	children: readonly AssembledChild[],
	nodeMap?: NodeMap
): string[] {
	if (children.length === 0) return ['    let children = None;'];
	// Determine if children slot is typed (concrete/supertype) or Box<AnyTransport>.
	// For the bridge path, typed children need to be wrapped back into
	// Box<AnyTransport> via AnyTransport::Variant(child) or <supertype>_transport_to_any(child)
	// before passing to transport_children().
	const childrenCls = nodeMap !== undefined ? classifySlotFromChildren(children, nodeMap) : undefined;

	/** Build a Rust expression that converts a Vec of typed children to Vec<Box<AnyTransport>>. */
	const wrapVec = (expr: string): string => {
		if (childrenCls === undefined || childrenCls.tag === 'heterogeneous') return expr;
		if (childrenCls.tag === 'concrete') {
			const variant = rustTypeIdent(childrenCls.typeName);
			return `${expr}.into_iter().map(|v| Box::new(AnyTransport::${variant}(v))).collect::<Vec<_>>()`;
		}
		// supertype
		const toAnyFn = `${rustSnakeIdent(childrenCls.supertypeName)}_transport_to_any`;
		return `${expr}.into_iter().map(|v| ${toAnyFn}(v)).collect::<Vec<_>>()`;
	};

	const needsWrap = childrenCls !== undefined && childrenCls.tag !== 'heterogeneous';
	if (hasRequiredChild(children)) {
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
function kindIdExpr(
	kind: string,
	kindIdByKind?: ReadonlyMap<string, number>
): string {
	const id = kindIdByKind?.get(kind);
	const safeKind = JSON.stringify(rustBlockCommentSafe(kind));
	if (id !== undefined) {
		return `TransportKindId(${id}) /* ${safeKind} */`;
	}
	return `TransportKindId(0) /* ${safeKind} — no parser symbol */`;
}

function renderTerminalTransportToNodeFn(
	node: AssembledNode,
	kindIdByKind?: ReadonlyMap<string, number>
): string[] {
	const kindArg = kindIdExpr(node.kind, kindIdByKind);
	return [
		`fn ${rustTransportToNodeFnName(node.typeName)}(transport: ${rustTransportStructName(node)}) -> Result<TransportNodeData, ::askama::Error> {`,
		'    Ok(transport_node_data(',
		`        ${kindArg},`,
		'        transport.transport_source,',
		'        transport.transport_named,',
		'        true,',
		'        Some(transport.text),',
		'        transport.transport_span,',
		// transport_node_id is Option<f64> on the wire (JS number); NodeData uses u64.
		'        transport.transport_node_id.map(|v| v as u64),',
		'        None,',
		'        None,',
		'    ))',
		'}',
		''
	];
}

function renderLiteralTransportStruct(
	literals: readonly TransportLiteral[]
): string[] {
	if (literals.length === 0) return [];
	return [
		'#[cfg_attr(feature = "napi-bindings", napi(object))]',
		'#[derive(Debug, Clone)]',
		'pub struct LiteralTransport {',
		...renderTransportMetadataFields(false),
		'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]',
		'    pub text: String,',
		'}'
	];
}

function renderTransportStruct(node: AssembledNode, nodeMap: NodeMap): string[] {
	if (node.modelType === 'polymorph' && node.forms.length > 0) {
		return renderPolymorphTransportDefs(node, nodeMap);
	}
	return renderTransportDataStruct(
		rustTransportStructName(node),
		node,
		node.structuralFields,
		node.structuralChildren,
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
		lines.push(
			`    ${rustTransportFormVariantName(form)}(${rustTransportFormStructName(form)}),`
		);
	}
	lines.push('}');
	lines.push('');
	// Custom FromNapiValue impl for the polymorph envelope.
	lines.push(...renderPolymorphTransportFromNapiValue(node));
	for (const form of node.forms) {
		lines.push(
			...renderTransportDataStruct(
				rustTransportFormStructName(form),
				form,
				form.fields,
				form.children,
				nodeMap
			)
		);
	}
	return lines;
}

function renderTransportDataStruct(
	structName: string,
	node: AssembledNode,
	fields: readonly AssembledField[],
	children: readonly AssembledChild[],
	nodeMap: NodeMap
): string[] {
	const lines: string[] = [];
	lines.push('#[cfg_attr(feature = "napi-bindings", napi(object))]');
	lines.push('#[derive(Debug, Clone)]');
	lines.push(`pub struct ${structName} {`);
	switch (node.modelType) {
		case 'branch':
		case 'container':
		case 'group':
		case 'polymorph':
			lines.push(...renderTransportMetadataFields(true));
			for (const field of fields) {
				lines.push(...renderTransportField(field, nodeMap));
			}
			if (children.length > 0) {
				lines.push('    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]');
				lines.push(`    pub children: ${rustTransportChildrenType(children, nodeMap)},`);
			}
			break;
		case 'leaf':
		case 'keyword':
		case 'token':
		case 'enum':
			lines.push(...renderTransportMetadataFields(false));
			lines.push('    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]');
			lines.push('    pub text: String,');
			break;
	}
	lines.push('}');
	lines.push('');
	return lines;
}

function renderTransportMetadataFields(includeText: boolean): string[] {
	const lines = [
		'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]',
		'    pub transport_source: Option<::sittir_core::types::Source>,',
		'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]',
		'    pub transport_named: Option<bool>,'
	];
	if (includeText) {
		lines.push(
			'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]',
			'    pub transport_text: Option<String>,'
		);
	}
	lines.push(
		'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]',
		'    pub transport_span: Option<::sittir_core::types::Span>,',
		// napi-rs 3 does not implement FromNapiValue/ToNapiValue for u64 (BigInt-only).
		// JS passes $nodeId as a plain number (f64). We use f64 here and convert
		// to u64 in the NodeData bridge (transport_node_data).
		'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]',
		'    pub transport_node_id: Option<f64>,'
	);
	return lines;
}

function renderTransportField(field: AssembledField, nodeMap: NodeMap): string[] {
	const lines: string[] = [];
	const rustName = rustFieldIdent(field.name);
	if (rustName !== field.name) {
		// Rust keyword renamed to r#kw or kw_ — add napi js_name so the JS side
		// still uses the original grammar field name.
		lines.push(`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(field.name)}))]`);
	}
	lines.push(`    pub ${rustName}: ${rustTransportFieldType(field, nodeMap)},`);
	return lines;
}

function rustTransportFieldType(field: AssembledField, nodeMap: NodeMap): string {
	const cls = classifySlotForEmit(field.projection.kinds, nodeMap);
	switch (cls.tag) {
		case 'concrete': {
			const base = concreteTransportTypeName(cls.kind, nodeMap);
			if (base !== null) {
				const inner = isMultiple(field) ? `Vec<${base}>` : base;
				return isRequired(field) ? inner : `Option<${inner}>`;
			}
			// Unknown kind — fall back to Box<AnyTransport>.
			const inner = isMultiple(field) ? 'Vec<Box<AnyTransport>>' : 'Box<AnyTransport>';
			return isRequired(field) ? inner : `Option<${inner}>`;
		}
		case 'supertype': {
			const base = `${rustTypeIdent(cls.supertypeName)}Transport`;
			const inner = isMultiple(field) ? `Vec<${base}>` : base;
			return isRequired(field) ? inner : `Option<${inner}>`;
		}
		case 'heterogeneous': {
			const inner = isMultiple(field) ? 'Vec<Box<AnyTransport>>' : 'Box<AnyTransport>';
			return isRequired(field) ? inner : `Option<${inner}>`;
		}
		default:
			return assertNever(cls);
	}
}

function rustTransportChildrenType(
	children: readonly AssembledChild[],
	nodeMap: NodeMap
): string {
	const allKinds = [...new Set(children.flatMap((c) => deriveChildrenKinds(c)))];
	const cls = classifySlotForEmit(allKinds, nodeMap);
	const required = hasRequiredChild(children);
	switch (cls.tag) {
		case 'concrete': {
			const base = concreteTransportTypeName(cls.kind, nodeMap);
			if (base !== null) {
				const inner = `Vec<${base}>`;
				return required ? inner : `Option<${inner}>`;
			}
			// Unknown kind — fall back to Box<AnyTransport>.
			const inner = 'Vec<Box<AnyTransport>>';
			return required ? inner : `Option<${inner}>`;
		}
		case 'supertype': {
			const base = `${rustTypeIdent(cls.supertypeName)}Transport`;
			const inner = `Vec<${base}>`;
			return required ? inner : `Option<${inner}>`;
		}
		case 'heterogeneous': {
			const inner = 'Vec<Box<AnyTransport>>';
			return required ? inner : `Option<${inner}>`;
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
		// with #[napi(object)] can't use them — return null to fall back to Box<AnyTransport>.
		// All three: returning null signals "fall back to Box<AnyTransport>" for Phase 1.
		if (node.modelType === 'supertype' || node.modelType === 'multi' || node.modelType === 'polymorph') {
			return null;
		}
		return `${rustTypeIdent(node.typeName)}Transport`;
	}
	// Unknown kind — conservative fallback.
	return null;
}

function hasRequiredChild(children: readonly AssembledChild[]): boolean {
	return children.some((child) => isRequired(child));
}

function rustTransportStructName(node: AssembledNode): string {
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

function rustLiteralTransportVariantName(
	literal: TransportLiteral,
	index: number
): string {
	const suffix =
		literal.kind.length === 0
			? 'empty'
			: [...literal.kind]
					.map(
						(char) => char.codePointAt(0)?.toString(16).padStart(2, '0') ?? '00'
					)
					.join('_');
	return rustTypeIdent(`Literal${index}_${suffix}`);
}

function rustTypeIdent(name: string): string {
	const replaced = name.replace(/[^A-Za-z0-9_]/g, '_');
	const withStart = /^[A-Za-z_]/.test(replaced)
		? replaced
		: `Transport${replaced}`;
	const ident = withStart.length > 0 ? withStart : 'Transport';
	return RUST_KEYWORDS.has(ident) ? `${ident}_` : ident;
}
