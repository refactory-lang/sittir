/**
 * Rust render-crate emitter. Owns codegen output for
 * `packages/{lang}/rust-render/src/*.rs` and the companion
 * `packages/{lang}/src/hash.ts` that the TS backend shim imports.
 *
 * Spec 012:
 *  - T016 (initial scaffold): hash.rs + hash.ts emission.
 *  - T027/T028/T029: per-kind `#[derive(Template)]` structs + filter
 *    imports + `render_dispatch` in `packages/{lang}/rust-render/src/templates.rs`.
 *  - T030: `.jinja` file copying into `packages/{lang}/rust-render/templates/`.
 *  - T031: full `Cargo.toml` with real deps.
 *
 * The emitter is pure — given a grammar's template bundle + node map,
 * it returns the string contents of each file it would write. The CLI
 * (T017) owns filesystem I/O and the template-directory copy.
 */

import type { NodeMap } from "../compiler/types.ts";
import type { AssembledNode } from "../compiler/node-map.ts";
import {
	AssembledBranch,
	AssembledContainer,
	AssembledPolymorph,
	AssembledGroup,
} from "../compiler/node-map.ts";
import type { TemplateFile } from "./template-hash.ts";
import { computeTemplateBundleHash } from "./template-hash.ts";

/** Grammars the emitter supports. Matches the three per-grammar packages. */
export type Grammar = "rust" | "typescript" | "python";

/**
 * Output of a single emit pass. Each field names a file path
 * (relative to the repo root) and its exact contents. The CLI writes
 * them; this module does not touch disk. Key invariant: re-running
 * the emitter over the same inputs produces byte-identical output.
 */
export interface RustRenderEmit {
	/** `packages/{lang}/rust-render/src/hash.rs` */
	hashRs: { path: string; contents: string };
	/** `packages/{lang}/src/hash.ts` */
	hashTs: { path: string; contents: string };
	/** `packages/{lang}/rust-render/src/templates.rs` (T027/T028/T029) */
	templatesRs: { path: string; contents: string };
	/** `packages/{lang}/rust-render/src/lib.rs` (T028 — exposes render_dispatch) */
	libRs: { path: string; contents: string };
	/** `packages/{lang}/rust-render/Cargo.toml` (T031) */
	cargoToml: { path: string; contents: string };
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
// time. The napi binding (sittir-${lang}-napi) exports it as
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
// Companion to packages/${lang}/rust-render/src/hash.rs; the two must
// agree byte-for-byte at runtime for the native backend to be picked
// (FR-020). Mismatch is caught by packages/${lang}/src/backend.ts and
// falls through to the TS engine silently.
`;
}

function templatesRsHeader(lang: Grammar): string {
	return `// @generated from packages/${lang}/node-model.json5 and packages/${lang}/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --all --output packages/${lang}/src
//
// Per-kind askama template structs + render_dispatch + GrammarMeta impl
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

function cargoTomlContents(lang: Grammar): string {
	// Keep synced with the T005 stub shape. askama/serde/sittir-core are
	// workspace-declared so the per-crate manifests inherit versions.
	return `# @generated from packages/${lang}/node-model.json5 — do not hand-edit.
# Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --all --output packages/${lang}/src
[package]
name = "sittir-${lang}-render"
version = "0.0.0"
edition = "2021"
rust-version = "1.82"
license = "MIT"
repository = "https://github.com/refactory-lang/sittir"
description = "Generated render dispatch for the ${lang} grammar — codegen output from packages/${lang}/node-model.json5 and packages/${lang}/templates/*.jinja."

[dependencies]
sittir-core = { path = "../../../rust/crates/sittir-core" }
askama = { workspace = true }
serde = { workspace = true }
`;
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
	"true",
	"false",
	"none",
	"null",
	"empty",
	"and",
	"or",
	"not",
	"is",
	"if",
	"elif",
	"else",
	"endif",
	"for",
	"endfor",
	"loop",
]);

const SHARED_POSITIONAL = new Set([
	"children",
	"children_list",
	"variant",
	"text",
	"trailing_sep",
	"leading_sep",
]);

/**
 * Template variable shape — scalar (rendered as a single joined string)
 * or list (rendered per-element by the template, either via `{% for %}`
 * or a `join*` filter). The distinction drives the generated struct's
 * field type: `String` for scalar, `Vec<String>` for list.
 */
type IdentShape = "scalar" | "list";

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
		if (prior === "list" || shape === "list") out.set(id, "list");
		else if (prior === undefined) out.set(id, "scalar");
	};

	// {{ expr | filter(...) }} — first identifier is the source.
	// If the very first filter is join / joinWithTrailing / joinWithLeading /
	// joinWithFlanks the source is list-shaped (the filter iterates).
	const exprRe = /\{\{-?\s*([a-zA-Z_][a-zA-Z0-9_]*)([^}]*?)-?\}\}/g;
	let m: RegExpExecArray | null;
	while ((m = exprRe.exec(body)) !== null) {
		const id = m[1]!;
		const rest = m[2] ?? "";
		const firstFilter = /\|\s*([a-zA-Z_][a-zA-Z0-9_]*)/.exec(rest);
		const filterName = firstFilter?.[1] ?? "";
		const isJoin =
			filterName === "join" ||
			filterName === "joinWithTrailing" ||
			filterName === "joinWithLeading" ||
			filterName === "joinWithFlanks";
		record(id, isJoin ? "list" : "scalar");
	}
	// {% if expr %} / {% elif expr %} — first identifier in the condition.
	const ifRe = /\{%-?\s*(?:if|elif)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
	while ((m = ifRe.exec(body)) !== null) {
		record(m[1]!, "scalar");
	}
	// {% for x in y %} — y is the iterable.
	const forRe = /\{%-?\s*for\s+[a-zA-Z_][a-zA-Z0-9_]*\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
	while ((m = forRe.exec(body)) !== null) {
		record(m[1]!, "list");
	}
	return out;
}

// ----------------------------------------------------------------------
// Rust identifier safety
// ----------------------------------------------------------------------

const RUST_KEYWORDS = new Set([
	"as",
	"break",
	"const",
	"continue",
	"crate",
	"else",
	"enum",
	"extern",
	"false",
	"fn",
	"for",
	"if",
	"impl",
	"in",
	"let",
	"loop",
	"match",
	"mod",
	"move",
	"mut",
	"pub",
	"ref",
	"return",
	"self",
	"Self",
	"static",
	"struct",
	"super",
	"trait",
	"true",
	"type",
	"unsafe",
	"use",
	"where",
	"while",
	"async",
	"await",
	"dyn",
	"abstract",
	"become",
	"box",
	"do",
	"final",
	"macro",
	"override",
	"priv",
	"typeof",
	"unsized",
	"virtual",
	"yield",
	"try",
	"union",
]);

/** Keywords that CANNOT be raw identifiers in Rust — they must be
 *  renamed. Used to emit `${kw}_` as a disambiguated field name; the
 *  `render_dispatch` arm still populates from `ctx.fields[kw]` so the
 *  template's `{{ kw }}` reference resolves. Askama's variable→field
 *  mapping doesn't handle the rename, though, so templates that
 *  reference these names will fail compilation — they require a
 *  template-author-side fix (rename the grammar field or a codegen
 *  pre-pass that renames at emit time). */
const RUST_NON_RAWABLE_KEYWORDS = new Set(["crate", "self", "super", "Self"]);

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
		.replace(/^_+/, "") // strip leading underscores (hidden-kind marker)
		.split("_")
		.filter(Boolean)
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join("");
}

// ----------------------------------------------------------------------
// Per-kind struct emission
// ----------------------------------------------------------------------

interface EmittedField {
	name: string; // raw grammar field name
	shape: IdentShape; // scalar → String, list → Vec<String>
}

interface EmittedStruct {
	name: string;
	kind: string;
	fields: EmittedField[]; // non-shared variable names referenced by the template
}

function emitStruct(kind: string, body: string, node: AssembledNode | undefined): EmittedStruct {
	const name = structNameFor(kind, node);
	const idents = scanTemplateIdentifiers(body);
	const fields: EmittedField[] = [];
	for (const [id, shape] of idents) {
		if (SHARED_POSITIONAL.has(id)) continue;
		fields.push({ name: id, shape });
	}
	fields.sort((a, b) => a.name.localeCompare(b.name));
	return { name, kind, fields };
}

function rustFieldType(shape: IdentShape): string {
	return shape === "list" ? "Vec<String>" : "String";
}

function renderStructDefs(structs: EmittedStruct[]): string {
	const lines: string[] = [];
	for (const s of structs) {
		lines.push(`#[derive(::askama::Template)]`);
		lines.push(`#[template(path = ${JSON.stringify(`${s.kind}.jinja`)}, escape = "none")]`);
		lines.push(`pub struct ${s.name} {`);
		// Shared positional fields (always emitted — keeps the struct
		// uniform even when a template doesn't reference them).
		lines.push(`    pub children: Vec<String>,`);
		lines.push(`    pub children_list: Vec<String>,`);
		lines.push(`    pub variant: String,`);
		lines.push(`    pub text: String,`);
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
			lines.push(`    pub ${rustFieldIdent(f.name)}: String,`);
			lines.push(`    pub ${rustFieldIdent(f.name)}_list: Vec<String>,`);
		}
		lines.push(`}`);
		lines.push("");
	}
	return lines.join("\n");
}

function renderDispatchFn(structs: EmittedStruct[]): string {
	const lines: string[] = [];
	lines.push(`use ::askama::Template as _AskamaTemplate;`);
	lines.push("");
	lines.push(`/// Render the given NodeData kind using its generated askama template struct.`);
	lines.push(`/// Matches on the source kind name (\`_X\` for hidden user-facing aliases,`);
	lines.push(`/// \`X\` for visible) — mirrors what NodeData.\$type carries at runtime.`);
	lines.push(`///`);
	lines.push(`/// The render uses \`render_with_values(ctx.as_values())\` so the`);
	lines.push(`/// flank-aware filters (\`joinWithTrailing\` / \`joinWithLeading\` /`);
	lines.push(`/// \`joinWithFlanks\`) can read \`trailing_anon\` / \`leading_anon\` from`);
	lines.push(`/// the context — matching the TS engine's \`_trailing_anon\` /`);
	lines.push(`/// \`_leading_anon\` side-channel on the children array.`);
	lines.push(`pub fn render_dispatch(`);
	lines.push(`    kind: &str,`);
	lines.push(`    ctx: &::sittir_core::prepare::TemplateContext,`);
	lines.push(`) -> Result<String, ::askama::Error> {`);
	lines.push(`    let _values = ctx.as_values();`);
	lines.push(`    match kind {`);
	for (const s of structs) {
		lines.push(`        ${JSON.stringify(s.kind)} => {`);
		lines.push(`            let t = ${s.name} {`);
		lines.push(`                children: ctx.children_list.clone(),`);
		lines.push(`                children_list: ctx.children_list.clone(),`);
		lines.push(`                variant: ctx.variant.clone(),`);
		lines.push(`                text: ctx.text.clone(),`);
		lines.push(`                trailing_sep: ctx.trailing_sep,`);
		lines.push(`                leading_sep: ctx.leading_sep,`);
		for (const f of s.fields) {
			// Dual-view: populate both scalar (joined) and list (per-
			// element) forms from TemplateContext. Both default to
			// empty so optional fields don't panic on absence.
			lines.push(
				`                ${rustFieldIdent(f.name)}: ctx.fields.get(${JSON.stringify(f.name)}).cloned().unwrap_or_default(),`,
			);
			lines.push(
				`                ${rustFieldIdent(f.name)}_list: ctx.fields_list.get(${JSON.stringify(f.name)}).cloned().unwrap_or_default(),`,
			);
		}
		lines.push(`            };`);
		lines.push(`            t.render_with_values(&_values)`);
		lines.push(`        }`);
	}
	lines.push(`        other => Err(::askama::Error::Custom(`);
	lines.push(`            format!("render_dispatch: no template for kind '{}'", other).into(),`);
	lines.push(`        )),`);
	lines.push(`    }`);
	lines.push(`}`);
	return lines.join("\n");
}

// ----------------------------------------------------------------------
// GrammarMeta emission
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
						(f) => !Array.from(map.values()).includes(f.name) || true,
					);
					if (unpaired) map.set(childKind, unpaired.name);
				}
			}
			if (map.size > 0) variants.set(kind, map);
		}
	}
	return { separators, listContainers, variants };
}

function renderGrammarMeta(lang: Grammar, meta: MetaData): string {
	const lines: string[] = [];
	lines.push(`/// Per-grammar metadata — separator / variant-label / list-container tables.`);
	lines.push(`/// Implements the \`sittir_core::prepare::GrammarMeta\` trait.`);
	lines.push(`pub struct ${pascal(lang)}GrammarMeta;`);
	lines.push("");
	lines.push(`impl ::sittir_core::prepare::GrammarMeta for ${pascal(lang)}GrammarMeta {`);
	// separator_for
	lines.push(`    fn separator_for(&self, kind: &str) -> Option<&str> {`);
	lines.push(`        match kind {`);
	const sortedSeps = Array.from(meta.separators.entries()).sort(([a], [b]) => a.localeCompare(b));
	for (const [k, s] of sortedSeps) {
		lines.push(`            ${JSON.stringify(k)} => Some(${JSON.stringify(s)}),`);
	}
	lines.push(`            _ => None,`);
	lines.push(`        }`);
	lines.push(`    }`);
	// variant_for
	lines.push(`    fn variant_for(&self, parent_kind: &str, child_kind: &str) -> Option<&str> {`);
	lines.push(`        match (parent_kind, child_kind) {`);
	const sortedVariants: [string, string, string][] = [];
	for (const [parent, m] of meta.variants) {
		for (const [child, label] of m) {
			sortedVariants.push([parent, child, label]);
		}
	}
	sortedVariants.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
	for (const [p, c, l] of sortedVariants) {
		lines.push(
			`            (${JSON.stringify(p)}, ${JSON.stringify(c)}) => Some(${JSON.stringify(l)}),`,
		);
	}
	lines.push(`            _ => None,`);
	lines.push(`        }`);
	lines.push(`    }`);
	// is_list_container
	lines.push(`    fn is_list_container(&self, kind: &str) -> bool {`);
	lines.push(`        matches!(kind,`);
	const sortedList = Array.from(meta.listContainers).sort();
	if (sortedList.length === 0) {
		lines.push(`            _ if false => true`);
	} else {
		const arms = sortedList.map((k) => JSON.stringify(k)).join(" | ");
		lines.push(`            ${arms}`);
	}
	lines.push(`        )`);
	lines.push(`    }`);
	lines.push(`}`);
	return lines.join("\n");
}

// ----------------------------------------------------------------------
// lib.rs — expose render_dispatch + GrammarMeta
// ----------------------------------------------------------------------

function libRsContents(lang: Grammar): string {
	return `// @generated from packages/${lang}/node-model.json5 — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --all --output packages/${lang}/src

pub mod hash;
pub mod templates;

pub use hash::TEMPLATE_BUNDLE_HASH;
pub use templates::{render_dispatch, ${pascal(lang)}GrammarMeta};
`;
}

// ----------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------

/**
 * Emit `hash.rs` + `hash.ts` for a single grammar (T016/T017 surface).
 * Kept as the historic low-dep entry point — the richer `emitRenderCrate`
 * (T027+) subsumes it but we keep this exported so the existing unit
 * tests and intermediate CLI paths stay green.
 */
export function emitHashFiles(
	lang: Grammar,
	files: readonly TemplateFile[],
): { hashRs: RustRenderEmit["hashRs"]; hashTs: RustRenderEmit["hashTs"] } {
	const hash = computeTemplateBundleHash(files);
	return {
		hashRs: {
			path: `packages/${lang}/rust-render/src/hash.rs`,
			contents: `${hashRsHeader(lang)}\npub const TEMPLATE_BUNDLE_HASH: &str = "${hash}";\n`,
		},
		hashTs: {
			path: `packages/${lang}/src/hash.ts`,
			contents: `${hashTsHeader(lang)}\nexport const TEMPLATE_BUNDLE_HASH = '${hash}'\n`,
		},
	};
}

/**
 * Emit the full render crate for a grammar — hash files, per-kind
 * template structs, render_dispatch, GrammarMeta, lib.rs, Cargo.toml.
 *
 * @param lang — grammar identifier.
 * @param files — the grammar's `.jinja` bundle (filename → body).
 *   Used for the hash input AND for per-kind struct-field derivation.
 * @param nodeMap — the assembled node map, source of GrammarMeta tables
 *   and typeName lookups.
 * @returns paired file contents. The CLI writes them + handles the
 *   `.jinja` directory copy separately (T030).
 */
export function emitRenderCrate(
	lang: Grammar,
	files: readonly TemplateFile[],
	nodeMap: NodeMap,
): RustRenderEmit {
	const { hashRs, hashTs } = emitHashFiles(lang, files);
	const structs: EmittedStruct[] = [];
	// Same order the hash function sorts under — deterministic output.
	const sortedFiles = [...files].sort((a, b) => a.filename.localeCompare(b.filename));
	for (const f of sortedFiles) {
		if (!f.filename.endsWith(".jinja")) continue;
		const kind = f.filename.slice(0, -".jinja".length);
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
		"",
		"#![allow(dead_code, unused_imports, non_snake_case)]",
		"",
		// Askama resolves custom filters by looking for a sibling
		// `filters` module at the derive-macro's call site. Re-export the
		// canonical `sittir_core::filters::*` here — `joinWithTrailing`,
		// `joinWithLeading`, `joinWithFlanks` consult flank-anon text
		// from per-call askama `Values` (see `TemplateContext::as_values`).
		// `render_dispatch` below threads the values through every
		// template render via `render_with_values`.
		"pub mod filters {",
		"    //! Askama resolves custom-filter names by searching for a",
		"    //! sibling `filters` module at the derive-macro site. This",
		"    //! module just re-exports the canonical implementations",
		"    //! from `sittir_core::filters`.",
		"    pub use ::sittir_core::filters::{",
		"        upper, lower, joinby,",
		"        isBlank, isPresent,",
		"        joinWithTrailing, joinWithLeading, joinWithFlanks,",
		"    };",
		"}",
		"",
		renderStructDefs(structs),
		renderDispatchFn(structs),
		"",
		renderGrammarMeta(lang, meta),
	].join("\n");
	const listShapedFieldsByKind = new Map<string, Set<string>>();
	for (const s of structs) {
		const listFields = new Set<string>();
		for (const f of s.fields) if (f.shape === "list") listFields.add(f.name);
		if (listFields.size > 0) listShapedFieldsByKind.set(s.kind, listFields);
	}
	return {
		hashRs,
		hashTs,
		templatesRs: {
			path: `packages/${lang}/rust-render/src/templates.rs`,
			contents: templatesRs + "\n",
		},
		libRs: {
			path: `packages/${lang}/rust-render/src/lib.rs`,
			contents: libRsContents(lang),
		},
		cargoToml: {
			path: `packages/${lang}/rust-render/Cargo.toml`,
			contents: cargoTomlContents(lang),
		},
		listShapedFieldsByKind,
	};
}
