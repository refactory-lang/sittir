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
import type { AssembledField, AssembledNode } from '../compiler/node-map.ts';
import {
	AssembledContainer,
	AssembledPolymorph,
	isRequired
} from '../compiler/node-map.ts';
import type { TemplateFile } from './template-hash.ts';
import { computeTemplateBundleHash } from './template-hash.ts';
import { renderModuleSrcDir } from './render-module-paths.ts';

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
	/** Per-kind set of field names emitted as `Vec<String>` (list shape).
	 *  Used by the cli.ts template-copy step to rewrite scalar-filter
	 *  calls (e.g. `| isPresent`) into their list-variant counterparts
	 *  (`| isPresentList`) when the field is list-shaped. */
	listShapedFieldsByKind: Map<string, Set<string>>;
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

// ----------------------------------------------------------------------
// Template-body identifier scan
// ----------------------------------------------------------------------
//
// Askama structs MUST expose a field for every variable the template
// references. Rather than trying to re-derive the variable set from the
// rule tree (which the TS jinja emitter already did, and whose output
// we're consuming), we scan each template body once for `{{ ident }}`,
// `{% if ident %}`, `{%- elif ident … %}`, and `{% for x in ident %}`
// references and union the set. The scan is a conservative over-
// approximation — unused fields are harmless, missing fields break the
// build. Reserved identifiers (`true`, `false`, loop var names) are
// filtered out.

// Jinja keywords / built-ins that are NOT template variables. `in` is
// NOT included — it appears as a Jinja keyword in `{% for x in y %}`
// (handled by the explicit forRe pattern) but also as a LEGITIMATE
// VARIABLE in kinds whose grammar surfaces `in` as a literal child
// (e.g. rust `pub(in path)` — `_visibility_modifier_pub_in_path.jinja`
// renders `{{ in }} {{ children | join(" ") }}` where `in` is the
// promoted keyword field). Dropping it here would shadow the field
// lookup at struct-derive time.
const RESERVED_IDENTS = new Set([
	'true',
	'false',
	'none',
	'null',
	'empty',
	'and',
	'or',
	'not',
	'is',
	'if',
	'elif',
	'else',
	'endif',
	'for',
	'endfor',
	'loop'
]);

const SHARED_POSITIONAL = new Set([
	'children',
	'children_list',
	'variant',
	'text',
	'trailing_sep',
	'leading_sep'
]);

/**
 * Template variable shape — scalar (rendered as a single joined string)
 * or list (rendered per-element by the template, either via `{% for %}`
 * or a `join*` filter). The distinction drives the generated struct's
 * field type: `String` for scalar, `Vec<String>` for list.
 */
type IdentShape = 'scalar' | 'list';

/**
 * Extract the set of variable identifiers referenced by a Jinja
 * template body, classified by shape (scalar vs list). Handles
 * `{{ ... }}`, `{% if ... %}`, `{%- elif ... %}`, `{% for x in y %}` —
 * pulls leading identifiers before any filter pipe or operator, plus
 * the right-hand-side of `for ... in ...`.
 *
 * An identifier is classified as 'list' when it appears as:
 *   - The `y` in `{% for x in y %}` (iterated)
 *   - The left operand of any `join*` filter (`join` / `joinWith*`) —
 *     these consume a slice of strings; the filter's signature
 *     rejects `&String` at askama compile time.
 * Otherwise 'scalar'.
 *
 * When the same identifier appears in BOTH shapes across the template,
 * 'list' wins (a Vec<String> can be `to_string`'d at a scalar site but
 * a String can't be iterated).
 */
function scanTemplateIdentifiers(body: string): Map<string, IdentShape> {
	const out = new Map<string, IdentShape>();
	const record = (id: string, shape: IdentShape): void => {
		if (RESERVED_IDENTS.has(id)) return;
		const prior = out.get(id);
		if (prior === 'list' || shape === 'list') out.set(id, 'list');
		else if (prior === undefined) out.set(id, 'scalar');
	};

	// {{ expr | filter(...) }} — first identifier is the source.
	// If the very first filter is join / joinWithTrailing / joinWithLeading /
	// joinWithFlanks the source is list-shaped (the filter iterates).
	const exprRe = /\{\{-?\s*([a-zA-Z_][a-zA-Z0-9_]*)([^}]*?)-?\}\}/g;
	let m: RegExpExecArray | null;
	while ((m = exprRe.exec(body)) !== null) {
		const id = m[1]!;
		const rest = m[2] ?? '';
		const firstFilter = /\|\s*([a-zA-Z_][a-zA-Z0-9_]*)/.exec(rest);
		const filterName = firstFilter?.[1] ?? '';
		const isJoin =
			filterName === 'join' ||
			filterName === 'joinWithTrailing' ||
			filterName === 'joinWithLeading' ||
			filterName === 'joinWithFlanks';
		record(id, isJoin ? 'list' : 'scalar');
	}
	// {% if expr %} / {% elif expr %} — first identifier in the condition.
	const ifRe = /\{%-?\s*(?:if|elif)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
	while ((m = ifRe.exec(body)) !== null) {
		record(m[1]!, 'scalar');
	}
	// {% for x in y %} — y is the iterable.
	const forRe =
		/\{%-?\s*for\s+[a-zA-Z_][a-zA-Z0-9_]*\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
	while ((m = forRe.exec(body)) !== null) {
		record(m[1]!, 'list');
	}
	return out;
}

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
	shape: IdentShape; // scalar → String, list → Vec<String>
	required: boolean;
}

interface EmittedStruct {
	name: string;
	kind: string;
	fields: EmittedField[]; // non-shared variable names referenced by the template
}

function emitStruct(
	kind: string,
	body: string,
	node: AssembledNode | undefined
): EmittedStruct {
	const name = structNameFor(kind, node);
	const idents = scanTemplateIdentifiers(body);
	const fields: EmittedField[] = [];
	for (const [id, shape] of idents) {
		if (SHARED_POSITIONAL.has(id)) continue;
		fields.push({
			name: id,
			shape,
			required: isRequiredField(node, id) && !hasOptionalPresenceGuard(body, id)
		});
	}
	fields.sort((a, b) => a.name.localeCompare(b.name));
	return { name, kind, fields };
}

function isRequiredField(
	node: AssembledNode | undefined,
	name: string
): boolean {
	const fieldOwner = node as { fields?: readonly AssembledField[] } | undefined;
	const field = fieldOwner?.fields?.find(
		(candidate) => candidate.name === name
	);
	return field !== undefined && isRequired(field);
}

function hasOptionalPresenceGuard(body: string, name: string): boolean {
	const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const guardRe = new RegExp(
		String.raw`\{%-?\s*(?:if|elif)\s+${escapedName}(?:_list)?\s*\|\s*(?:isPresent|isPresentList|isBlank|isBlankList)\b`
	);
	return guardRe.test(body);
}

function renderStructDefs(structs: EmittedStruct[]): string {
	const lines: string[] = [];
	for (const s of structs) {
		lines.push(`#[derive(::askama::Template)]`);
		lines.push(
			`#[template(path = ${JSON.stringify(`${s.kind}.jinja`)}, escape = "none")]`
		);
		lines.push(`pub struct ${s.name}<'a> {`);
		// Shared positional fields (always emitted — keeps the struct
		// uniform even when a template doesn't reference them).
		lines.push(`    pub children: &'a [String],`);
		lines.push(`    pub children_list: &'a [String],`);
		lines.push(`    pub variant: &'a str,`);
		lines.push(`    pub text: &'a str,`);
		lines.push(`    pub trailing_sep: bool,`);
		lines.push(`    pub leading_sep: bool,`);
		// Each user-declared field always emits BOTH a scalar and a
		// list view (mirrors the shared `children` + `children_list`
		// pattern). Templates that interpolate / check presence use
		// the scalar (pre-joined string); templates that iterate or
		// pipe through a `join*` filter use the list. The per-field
		// `_list` reference is synthesized at template-copy time (see
		// `cli.ts`). Empty lists render as empty scalars and read as
		// "not present" via `| isPresent`, so no separate filter is
		// needed — we never permit null arrays, only empty ones.
		for (const f of s.fields) {
			lines.push(`    pub ${rustFieldIdent(f.name)}: &'a str,`);
			lines.push(`    pub ${rustFieldIdent(f.name)}_list: &'a [String],`);
			lines.push(`    pub ${rustFieldIdent(f.name)}_leading_sep: bool,`);
			lines.push(`    pub ${rustFieldIdent(f.name)}_trailing_sep: bool,`);
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

function renderDirectSupport(meta: MetaData): string {
	const lines: string[] = [];
	lines.push(`use ::askama::Template as _AskamaTemplate;`);
	lines.push(`use ::sittir_core::types::{FieldValue, NodeData};`);
	lines.push('');
	lines.push(`#[derive(Debug, Default)]`);
	lines.push(`struct ResolvedField {`);
	lines.push(`    scalar: String,`);
	lines.push(`    items: Vec<String>,`);
	lines.push(`    leading_sep: bool,`);
	lines.push(`    trailing_sep: bool,`);
	lines.push(`}`);
	lines.push('');
	lines.push(`impl ResolvedField {`);
	lines.push(`    fn from_scalar(value: String) -> Self {`);
	lines.push(`        let mut items = Vec::new();`);
	lines.push(`        if !value.is_empty() {`);
	lines.push(`            items.push(value.clone());`);
	lines.push(`        }`);
	lines.push(`        Self {`);
	lines.push(`            scalar: value,`);
	lines.push(`            items,`);
	lines.push(`            leading_sep: false,`);
	lines.push(`            trailing_sep: false,`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(`fn separator_for(kind: &str) -> &'static str {`);
	lines.push(`    match kind {`);
	for (const [k, s] of Array.from(meta.separators.entries()).sort(([a], [b]) =>
		a.localeCompare(b)
	)) {
		lines.push(`        ${JSON.stringify(k)} => ${JSON.stringify(s)},`);
	}
	lines.push(`        _ => "",`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(
		`fn variant_for(parent_kind: &str, child_kind: &str) -> Option<&'static str> {`
	);
	lines.push(`    match (parent_kind, child_kind) {`);
	const sortedVariants: [string, string, string][] = [];
	for (const [parent, map] of meta.variants) {
		for (const [child, label] of map)
			sortedVariants.push([parent, child, label]);
	}
	sortedVariants.sort(
		(a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1])
	);
	for (const [parent, child, label] of sortedVariants) {
		lines.push(
			`        (${JSON.stringify(parent)}, ${JSON.stringify(child)}) => Some(${JSON.stringify(label)}),`
		);
	}
	lines.push(`        _ => None,`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(`fn first_named_child_kind(node: &NodeData) -> Option<&str> {`);
	lines.push(
		`    node.children.as_ref()?.iter().find(|child| child.named).map(|child| child.type_.as_str())`
	);
	lines.push(`}`);
	lines.push('');
	lines.push(`fn resolve_variant(node: &NodeData) -> &'static str {`);
	lines.push(`    first_named_child_kind(node)`);
	lines.push(
		`        .and_then(|child_kind| variant_for(node.type_.as_str(), child_kind))`
	);
	lines.push(`        .unwrap_or("")`);
	lines.push(`}`);
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
	lines.push(`            let scalar = if rendered.is_empty() {`);
	lines.push(`                String::new()`);
	lines.push(`            } else {`);
	lines.push(
		`                ::sittir_core::filters::joinby(rendered.as_slice(), separator_for(node.type_.as_str()), false, false)?`
	);
	lines.push(`            };`);
	lines.push(`            Ok(ResolvedField {`);
	lines.push(`                scalar,`);
	lines.push(`                items: rendered,`);
	lines.push(`                leading_sep: false,`);
	lines.push(
		`                trailing_sep: detect_field_trailing_sep(node, name),`
	);
	lines.push(`            })`);
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
	lines.push(`    let scalar = if children.is_empty() {`);
	lines.push(`        String::new()`);
	lines.push(`    } else {`);
	lines.push(
		`        ::sittir_core::filters::joinby(children.as_slice(), separator_for(node.type_.as_str()), leading_sep, trailing_sep)?`
	);
	lines.push(`    };`);
	lines.push(`    Ok(ResolvedField {`);
	lines.push(`        scalar,`);
	lines.push(`        items: children,`);
	lines.push(`        leading_sep,`);
	lines.push(`        trailing_sep,`);
	lines.push(`    })`);
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
		lines.push(`    let variant = resolve_variant(node);`);
		lines.push(`    let text = resolve_text(node)?;`);
		lines.push(`    let template = ${s.name} {`);
		lines.push(`        children: children.items.as_slice(),`);
		lines.push(`        children_list: children.items.as_slice(),`);
		lines.push(`        variant,`);
		lines.push(`        text: text.as_str(),`);
		lines.push(`        trailing_sep: children.trailing_sep,`);
		lines.push(`        leading_sep: children.leading_sep,`);
		for (const [index, f] of s.fields.entries()) {
			lines.push(
				`        ${rustFieldIdent(f.name)}: field_${index}.scalar.as_str(),`
			);
			lines.push(
				`        ${rustFieldIdent(f.name)}_list: field_${index}.items.as_slice(),`
			);
			lines.push(
				`        ${rustFieldIdent(f.name)}_leading_sep: field_${index}.leading_sep,`
			);
			lines.push(
				`        ${rustFieldIdent(f.name)}_trailing_sep: field_${index}.trailing_sep,`
			);
		}
		lines.push(`    };`);
		lines.push(`    template.render()`);
		lines.push(`}`);
		lines.push('');
	}
	return lines.join('\n');
}

function renderDispatchFn(structs: EmittedStruct[]): string {
	const lines: string[] = [];
	const templateKinds = new Set(structs.map((s) => s.kind));
	lines.push(
		`pub fn render_dispatch(node: &::sittir_core::types::NodeData) -> Result<String, ::askama::Error> {`
	);
	lines.push(`    if node.fields.is_none() && node.children.is_none() {`);
	lines.push(`        if let Some(text) = &node.text {`);
	lines.push(`            return Ok(text.clone());`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`    match node.type_.as_str() {`);
	for (const s of structs) {
		const patterns = [JSON.stringify(s.kind)];
		if (s.kind.startsWith('_')) {
			const visible = JSON.stringify(s.kind.replace(/^_+/, ''));
			if (!templateKinds.has(s.kind.replace(/^_+/, ''))) patterns.push(visible);
		}
		lines.push(
			`        ${patterns.join(' | ')} => ${renderFnName(s.kind)}(node),`
		);
	}
	lines.push(`        _ => token_shaped_fallback(node),`);
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
// lib.rs — expose render_dispatch
// ----------------------------------------------------------------------

function libRsContents(lang: Grammar): string {
	return `// @generated from packages/${lang}/node-model.json5 — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --all --output packages/${lang}/src

pub mod hash;
pub mod templates;

pub use hash::TEMPLATE_BUNDLE_HASH;
pub use templates::render_dispatch;
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
): { hashRs: RustRenderModuleEmit['hashRs']; hashTs: RustRenderModuleEmit['hashTs'] } {
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
	nodeMap: NodeMap
): RustRenderModuleEmit {
	const { hashRs, hashTs } = emitHashFiles(lang, files);
	const structs: EmittedStruct[] = [];
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
		// and is userFacing. Fall through on missing — emit a struct with
		// just shared fields.
		structs.push(emitStruct(kind, f.content, node));
	}
	const meta = collectMetaData(nodeMap);
	const templatesRs = [
		templatesRsHeader(lang),
		'',
		'#![allow(dead_code, unused_imports, non_snake_case)]',
		'',
		// Askama resolves custom filters by looking for a sibling
		// `filters` module at the derive-macro's call site. Re-export the
		// canonical `sittir_core::filters::*` here; flank-aware joins read
		// their optional anon-token side channel from Askama's per-render
		// `Values` bag while `joinby` consumes the generated boolean flank
		// fields directly.
		'pub mod filters {',
		'    //! Askama resolves custom-filter names by searching for a',
		'    //! sibling `filters` module at the derive-macro site. This',
		'    //! module just re-exports the canonical implementations',
		'    //! from `sittir_core::filters`.',
		'    pub fn joinby<S: AsRef<str>>(',
		'        xs: &[S],',
		'        _values: &dyn ::askama::Values,',
		'        sep: &str,',
		'        leading: impl std::borrow::Borrow<bool>,',
		'        trailing: impl std::borrow::Borrow<bool>,',
		'    ) -> Result<String, ::askama::Error> {',
		'        ::sittir_core::filters::joinby(xs, sep, *leading.borrow(), *trailing.borrow())',
		'    }',
		'',
		'    pub fn join<S: AsRef<str>>(',
		'        xs: &[S],',
		'        sep: &str,',
		'    ) -> Result<String, ::askama::Error> {',
		'        ::sittir_core::filters::joinby(xs, sep, false, false)',
		'    }',
		'',
		'    pub use ::sittir_core::filters::{',
		'        upper, lower,',
		'        isBlank, isPresent,',
		'        joinWithTrailing, joinWithLeading, joinWithFlanks,',
		'    };',
		'}',
		'',
		renderStructDefs(structs),
		renderDirectSupport(meta),
		'',
		renderPerKindFns(structs),
		'',
		renderDispatchFn(structs)
	].join('\n');
	const listShapedFieldsByKind = new Map<string, Set<string>>();
	for (const s of structs) {
		const listFields = new Set<string>();
		for (const f of s.fields) if (f.shape === 'list') listFields.add(f.name);
		if (listFields.size > 0) listShapedFieldsByKind.set(s.kind, listFields);
	}
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
		},
		listShapedFieldsByKind
	};
}
