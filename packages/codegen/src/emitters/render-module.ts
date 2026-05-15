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
	AssembledNonterminal,
	AssembledSupertype
} from '../compiler/node-map.ts';
import {
	AssembledBranch,
	AssembledEnum,
	AssembledGroup,
	AssembledPolymorph,
	deriveUnnamedChildrenCardinality,
	isMultiple,
	isRequired,
	isNodeRef,
	isUnresolvedRef,
	kindsOf,
	structuralFieldsOf
} from '../compiler/node-map.ts';
import { assertNever } from '../polymorph-variant.ts';
import { findRepeatSeparator } from '../compiler/template-walker.ts';
import { compileWordMatcher } from '../compiler/common.ts';
import type { TemplateFile } from './template-hash.ts';
import { computeTemplateBundleHash } from './template-hash.ts';
import { renderModuleSrcDir, renderModuleTemplatesDir } from './render-module-paths.ts';
import { type TransportLiteral } from './transport-projection.ts';
import { getTransportProjection } from './transport-projection-cache.ts';
import {
	acceptedTransportKinds,
	buildSupertypeTransportSet,
	classifySlot,
	deriveChildrenKinds,
	type SlotClass
} from './transport-common.ts';
import { keywordPresenceValue, slotLiteralValues } from './shared.ts';
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
			if (node.fields.length === 0 && node.children.length > 0) isListContainer = true;
		} else if (node instanceof AssembledGroup) {
			separator = findRepeatSeparator(node.simplifiedRule);
		}
		if (node instanceof AssembledPolymorph) {
			const map = new Map<string, string>();
			for (const form of node.forms) {
				map.set(form.kind, form.name);
			}
			// Override polymorphs have visible child kinds (e.g. 'array_expression_list')
			// whose real parse-tree names differ from the internal form kinds
			// ('array_expression__form_list'). Pair them by position: variantChildKinds[i]
			// corresponds to the i-th non-passthrough form in polyForms order.
			const nonPassthroughForms = node.forms.filter((f) => !f.overridePassthrough);
			for (let i = 0; i < node.variantChildKinds.length; i++) {
				const childKind = node.variantChildKinds[i]!;
				if (!map.has(childKind) && i < nonPassthroughForms.length) {
					map.set(childKind, nonPassthroughForms[i]!.name);
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
// Legacy direct NodeData render shim. Normal native package flow renders
// typed transport payloads through render_transport_dispatch; this module
// remains for compatibility with internal NodeData-based engine paths.`;
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
// Field and child resolution helpers — ResolvedField, resolve_slot,
// resolve_field, separator_for, variant_for, etc. Used by both
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

function isReservedSupertypeTransportNode(node: AssembledNode): node is AssembledSupertype {
	return (
		node.modelType === 'supertype' && RESERVED_SUPERTYPE_ENUM_NAMES.has(`${rustTypeIdent(node.typeName)}Transport`)
	);
}

interface EffectiveSupertypeTransportSubtype {
	readonly subKind: string;
	readonly subNode: AssembledNode;
}

interface EffectiveSupertypeTransportShape {
	readonly subtypes: readonly EffectiveSupertypeTransportSubtype[];
	readonly suppressedKinds: readonly string[];
}

function collectEffectiveSupertypeTransportShape(
	supertypeNode: AssembledSupertype,
	nodeMap: NodeMap,
	seen: Set<string> = new Set(),
	state: {
		readonly variantKindByName: Map<string, string>;
		readonly emittedKinds: Set<string>;
		readonly suppressedKinds: Set<string>;
		readonly subtypes: EffectiveSupertypeTransportSubtype[];
	} = {
		variantKindByName: new Map(),
		emittedKinds: new Set(),
		suppressedKinds: new Set(),
		subtypes: []
	}
): EffectiveSupertypeTransportShape {
	const appendSubtype = (subKind: string, subNode: AssembledNode): void => {
		const variantName = rustTypeIdent(subNode.typeName);
		const existingKind = state.variantKindByName.get(variantName);
		if (existingKind !== undefined && existingKind !== subKind) {
			throw new Error(
				`reserved supertype flattening collision: ${supertypeNode.kind} emits variant ${variantName} for both ${existingKind} and ${subKind}`
			);
		}
		state.variantKindByName.set(variantName, subKind);
		if (state.emittedKinds.has(subKind)) return;
		state.emittedKinds.add(subKind);
		state.subtypes.push({ subKind, subNode });
	};

	if (seen.has(supertypeNode.kind)) {
		return {
			subtypes: state.subtypes,
			suppressedKinds: [...state.suppressedKinds]
		};
	}
	seen.add(supertypeNode.kind);
	for (const subKind of supertypeNode.subtypes) {
		const subNode = nodeMap.nodes.get(subKind);
		if (subNode === undefined) continue;
		if (isReservedSupertypeTransportNode(subNode)) {
			state.suppressedKinds.add(subKind);
			collectEffectiveSupertypeTransportShape(subNode, nodeMap, seen, state);
			continue;
		}
		appendSubtype(subKind, subNode);
		for (const nested of collectTransparentRuntimeTransportSubtypes(subNode, nodeMap)) {
			appendSubtype(nested.subKind, nested.subNode);
		}
	}
	return {
		subtypes: state.subtypes,
		suppressedKinds: [...state.suppressedKinds]
	};
}

function collectTransparentRuntimeTransportSubtypes(
	node: AssembledNode,
	nodeMap: NodeMap
): readonly EffectiveSupertypeTransportSubtype[] {
	if (node.modelType !== 'branch' || !node.kind.startsWith('_') || node.fields.length > 0 || node.children.length === 0) {
		return [];
	}
	const nested = new Map<string, EffectiveSupertypeTransportSubtype>();
	for (const child of node.children) {
		const kinds = deriveChildrenKinds(child, nodeMap, new Set([node.kind]));
		const cls = classifySlotForEmit(kinds, nodeMap);
		if (cls.tag === 'heterogeneous') continue;
		const subNode =
			cls.tag === 'concrete'
				? nodeMap.nodes.get(cls.kind)
				: [...nodeMap.nodes.values()].find(
						(candidate) => candidate.modelType === 'supertype' && candidate.typeName === cls.supertypeName
					);
		if (!subNode) continue;
		nested.set(subNode.kind, { subKind: subNode.kind, subNode });
	}
	return [...nested.values()];
}

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

export function planRenderModuleTemplateCopies(lang: Grammar, templates: EmittedTemplates): RenderModuleTemplateCopies {
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

interface RenderSlotModel {
	readonly named: readonly AssembledNonterminal[];
	readonly unnamed: readonly AssembledNonterminal[];
	readonly unnamedRequired: boolean;
	readonly unnamedMultiple: boolean;
	readonly unnamedKinds: readonly string[];
}

export function hasSingularNativeChildrenTransport(node: AssembledNode | undefined): boolean {
	const slotModel = renderSlotModelOf(node);
	return slotModel.unnamed.length > 0 && !slotModel.unnamedMultiple;
}

function mergeRenderSlots(slots: readonly AssembledNonterminal[]): AssembledNonterminal | undefined {
	const [first, ...rest] = slots;
	if (!first) return undefined;
	return rest.reduce<AssembledNonterminal>(
		(merged, slot) => ({
			...merged,
			values: [...merged.values, ...slot.values],
			hasTrailing: merged.hasTrailing || slot.hasTrailing,
			hasLeading: merged.hasLeading || slot.hasLeading,
			aliasSources:
				merged.aliasSources || slot.aliasSources
					? {
							...merged.aliasSources,
							...slot.aliasSources
						}
					: undefined
		}),
		{ ...first, values: [...first.values] }
	);
}

function renderSlotAuditVariantsOf(
	node: Extract<AssembledNode, { modelType: 'branch' | 'group' | 'polymorph' }>
): readonly (readonly AssembledNonterminal[])[] {
	if (node.modelType === 'polymorph') {
		return node.forms.map((form) => Object.values(form.slots));
	}
	return [Object.values(node.slots)];
}

function renderSlotAuditKey(slot: AssembledNonterminal): string {
	return slot.source === 'inferred' ? '$children' : `_${slot.name}`;
}

function renderSlotModelOf(node: AssembledNode | undefined): RenderSlotModel {
	if (
		node === undefined ||
		(node.modelType !== 'branch' && node.modelType !== 'group' && node.modelType !== 'polymorph')
	) {
		return {
			named: [],
			unnamed: [],
			unnamedRequired: false,
			unnamedMultiple: false,
			unnamedKinds: []
		};
	}
	const variants = renderSlotAuditVariantsOf(node);
	const slotsByKey = new Map<string, AssembledNonterminal>();
	for (const slot of variants.flat()) {
		const key = renderSlotAuditKey(slot);
		const existing = slotsByKey.get(key);
		slotsByKey.set(key, existing ? (mergeRenderSlots([existing, slot]) ?? existing) : slot);
	}
	const slots = [...slotsByKey.values()];
	const named = slots.filter((slot) => slot.source !== 'inferred');
	const unnamed = slots.filter((slot) => slot.source === 'inferred');
	if (unnamed.length === 0) {
		return {
			named,
			unnamed,
			unnamedRequired: false,
			unnamedMultiple: false,
			unnamedKinds: []
		};
	}
	const unnamedKinds = [...new Set(unnamed.flatMap((slot) => kindsOf(slot)))];
	const variantCardinalities = variants.map((variant) => {
		const children = variant.filter((slot) => slot.source === 'inferred');
		if (children.length === 0) return undefined;
		const cardinality = deriveUnnamedChildrenCardinality(children);
		return {
			required: cardinality.required,
			multiple: cardinality.multiple || children.length > 1
		};
	});
	return {
		named,
		unnamed,
		unnamedRequired: variantCardinalities.every((cardinality) => cardinality?.required === true),
		unnamedMultiple: variantCardinalities.some((cardinality) => cardinality?.multiple === true),
		unnamedKinds
	};
}

function emitStruct(kind: string, node: AssembledNode | undefined, surface: RenderTemplateSurface): EmittedStruct {
	const name = structNameFor(kind, node);
	const slotModel = renderSlotModelOf(node);
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
		for (const f of slotModel.named) {
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
		transportHasChildren: slotModel.unnamed.length > 0,
		childrenRequired: slotModel.unnamedRequired,
		childrenMultiple: slotModel.unnamedMultiple,
		hasVariant: surface.usesVariant,
		hasText: surface.usesText
	};
}

function mergeTemplateSurfaceFromBody(body: string, surface: RenderTemplateSurface | undefined): RenderTemplateSurface {
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
			lines.push(`    pub children: ${childrenFieldType(s)},`);
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

function childrenFieldType(s: Pick<EmittedStruct, 'childrenRequired' | 'childrenMultiple'>): string {
	if (s.childrenMultiple) return `ListNonterminalView<'a>`;
	return s.childrenRequired ? `SingleNonterminalView<'a>` : `OptionalNonterminalView<'a>`;
}

function requiredResolvedFieldViewLines(target: string, valueExpr: string, missingExpr: string, indent = ''): string[] {
	return [
		`${indent}${target}: match ${valueExpr}.kind {`,
		`${indent}    ResolvedFieldKind::Missing => return Err(${missingExpr}),`,
		`${indent}    ResolvedFieldKind::Scalar | ResolvedFieldKind::List => SingleNonterminalView(::sittir_core::filters::Renderable::Text(${valueExpr}.as_scalar())),`,
		`${indent}},`
	];
}

/**
 * Emit the `ResolvedFieldKind` enum, `ResolvedField` struct, its impl block,
 * and all field/children resolution functions (`render_node_value`,
 * `missing_required_field`, `resolve_text`, `resolve_leaf`, `resolve_optional`,
 * `resolve_required`, `is_join_flank_token`, `detect_field_trailing_sep`,
 * `resolve_slot`, `resolve_field`).
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
	lines.push(`#[derive(Debug, Clone, Copy)]`);
	lines.push(`pub(crate) enum SlotAccessor<'a> {`);
	lines.push(`    Field(&'a str),`);
	lines.push(`    Children,`);
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
	lines.push(`    let resolved = resolve_slot(node, SlotAccessor::Field(name), false)?;`);
	lines.push(
		`    Ok((resolved.kind != ResolvedFieldKind::Missing && !resolved.scalar.is_empty()).then_some(resolved.scalar))`
	);
	lines.push(`}`);
	lines.push('');
	lines.push(`pub(crate) fn resolve_required(node: &NodeData, name: &str) -> Result<String, ::askama::Error> {`);
	lines.push(`    Ok(resolve_slot(node, SlotAccessor::Field(name), true)?.scalar)`);
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
	lines.push(`pub(crate) fn resolve_slot(`);
	lines.push(`    node: &NodeData,`);
	lines.push(`    accessor: SlotAccessor<'_>,`);
	lines.push(`    required: bool,`);
	lines.push(`) -> Result<ResolvedField, ::askama::Error> {`);
	lines.push(`    match accessor {`);
	lines.push(`        SlotAccessor::Field(name) => match node.fields.as_ref().and_then(|fields| fields.get(name)) {`);
	lines.push(`            None => {`);
	lines.push(`                if required {`);
	lines.push(`                    Err(missing_required_field(node, name))`);
	lines.push(`                } else {`);
	lines.push(`                    Ok(ResolvedField::default())`);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(`            Some(FieldValue::Text(text)) => Ok(ResolvedField::from_scalar(text.to_owned())),`);
	lines.push(`            Some(FieldValue::Single(child)) => {`);
	lines.push(`                let rendered = render_node_value(child)?;`);
	lines.push(`                Ok(ResolvedField::from_scalar(rendered))`);
	lines.push(`            }`);
	lines.push(`            Some(FieldValue::Multiple(items)) => {`);
	lines.push(`                let mut rendered = Vec::new();`);
	lines.push(`                for item in items {`);
	lines.push(`                    if !item.named {`);
	lines.push(`                        continue;`);
	lines.push(`                    }`);
	lines.push(`                    rendered.push(render_node_value(item)?);`);
	lines.push(`                }`);
	lines.push(`                Ok(ResolvedField::from_items(`);
	lines.push(`                    rendered,`);
	lines.push(`                    separator_for(node.type_.0),`);
	lines.push(`                    false,`);
	lines.push(`                    detect_field_trailing_sep(node, name),`);
	lines.push(`                ))`);
	lines.push(`            }`);
	lines.push(`        },`);
	lines.push(`        SlotAccessor::Children => {`);
	lines.push(`            let mut child_nodes: Vec<(u32, usize, &NodeData)> = Vec::new();`);
	lines.push(`            let mut child_ordinal = 0usize;`);
	lines.push(`            let mut first_named_idx: Option<usize> = None;`);
	lines.push(`            let mut last_named_idx: Option<usize> = None;`);
	lines.push(`            if let Some(items) = &node.children {`);
	lines.push(`                for (index, child) in items.iter().enumerate() {`);
	lines.push(`                    if !child.named {`);
	lines.push(`                        continue;`);
	lines.push(`                    }`);
	lines.push(`                    if first_named_idx.is_none() {`);
	lines.push(`                        first_named_idx = Some(index);`);
	lines.push(`                    }`);
	lines.push(`                    last_named_idx = Some(index);`);
	lines.push(
		`                    child_nodes.push((child.span.map_or(u32::MAX, |span| span.start), child_ordinal, child));`
	);
	lines.push(`                    child_ordinal += 1;`);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(`            child_nodes.sort_by(|left, right| left.0.cmp(&right.0).then(left.1.cmp(&right.1)));`);
	lines.push(`            let mut children = Vec::new();`);
	lines.push(`            for (_, _, child) in child_nodes {`);
	lines.push(`                children.push(render_node_value(child)?);`);
	lines.push(`            }`);
	lines.push(`            if children.is_empty() {`);
	lines.push(`                if required {`);
	lines.push(`                    return Err(missing_required_field(node, "children"));`);
	lines.push(`                }`);
	lines.push(`                return Ok(ResolvedField::default());`);
	lines.push(`            }`);
	lines.push(`            let mut leading_sep = false;`);
	lines.push(`            let mut trailing_sep = false;`);
	lines.push(`            if let Some(items) = &node.children {`);
	lines.push(`                if let Some(first) = first_named_idx {`);
	lines.push(`                    if first > 0 {`);
	lines.push(`                        if let Some(before) = items.get(first - 1) {`);
	lines.push(
		`                            leading_sep = !before.named && before.text.as_deref().map_or(false, is_join_flank_token);`
	);
	lines.push(`                        }`);
	lines.push(`                    }`);
	lines.push(`                }`);
	lines.push(`                if let Some(last) = last_named_idx {`);
	lines.push(`                    if let Some(after) = items.get(last + 1) {`);
	lines.push(
		`                        trailing_sep = !after.named && after.text.as_deref().map_or(false, is_join_flank_token);`
	);
	lines.push(`                    }`);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(`            Ok(ResolvedField::from_items(`);
	lines.push(`                children,`);
	lines.push(`                separator_for(node.type_.0),`);
	lines.push(`                leading_sep,`);
	lines.push(`                trailing_sep,`);
	lines.push(`            ))`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(
		`pub(crate) fn resolve_field(node: &NodeData, name: &str, required: bool) -> Result<ResolvedField, ::askama::Error> {`
	);
	lines.push(`    resolve_slot(node, SlotAccessor::Field(name), required)`);
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

function renderDispatchFn(_structs: EmittedStruct[], _kindIdByKind?: ReadonlyMap<string, number>): string {
	const lines: string[] = [];
	lines.push(`/// Legacy direct NodeData render entrypoint.`);
	lines.push(`///`);
	lines.push(`/// Normal native package flow uses typed transport plus`);
	lines.push(`/// \`render_transport_dispatch\`; keep this only for compatibility`);
	lines.push(`/// with internal NodeData-based engine paths.`);
	lines.push(`pub fn render_dispatch(node: &NodeData) -> Result<String, ::askama::Error> {`);
	lines.push(`    let mut buf = String::new();`);
	lines.push(`    render_nodedata_into(node, &mut buf)?;`);
	lines.push(`    Ok(buf)`);
	lines.push(`}`);
	return lines.join('\n');
}

function renderNodedataIntoFn(structs: EmittedStruct[], kindIdByKind?: ReadonlyMap<string, number>): string {
	const lines: string[] = [];
	lines.push(`/// Legacy direct NodeData render bridge.`);
	lines.push(`///`);
	lines.push(`/// Retained for sittir-core's internal EngineGrammar contract and`);
	lines.push(`/// trivia rendering. Normal native package flow should project to`);
	lines.push(`/// typed transport and call \`render_transport_dispatch\`.`);
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
	if (s.hasChildren) {
		lines.push(`${indent}let children = resolve_slot(node, SlotAccessor::Children, ${String(s.childrenRequired)})?;`);
	}
	for (const [index, f] of s.fields.entries()) {
		lines.push(
			`${indent}let field_${index} = resolve_slot(node, SlotAccessor::Field(${JSON.stringify(f.name)}), ${f.required})?;`
		);
	}
	if (s.hasVariant) lines.push(`${indent}let variant = resolve_variant(node);`);
	if (s.hasText) lines.push(`${indent}let text = resolve_text(node)?;`);
	if (s.hasChildren && s.childrenMultiple)
		lines.push(`${indent}let children_renderables = children.renderable_items();`);
	for (const [index, f] of s.fields.entries()) {
		if (f.view === 'scalar') continue;
		lines.push(`${indent}let field_${index}_renderables = field_${index}.renderable_items();`);
	}
	lines.push(`${indent}let template = ${s.name} {`);
	if (s.hasChildren) {
		if (s.childrenMultiple) {
			lines.push(`${indent}    children: ListNonterminalView {`);
			lines.push(`${indent}        items: children_renderables.as_slice(),`);
			lines.push(`${indent}        separator: children.separator,`);
			lines.push(`${indent}        leading: children.leading_sep,`);
			lines.push(`${indent}        trailing: children.trailing_sep,`);
			lines.push(`${indent}    },`);
		} else if (s.childrenRequired) {
			lines.push(
				...requiredResolvedFieldViewLines(
					'    children',
					'children',
					'missing_required_field(node, "children")',
					indent
				)
			);
		} else {
			lines.push(`${indent}    children: match children.kind {`);
			lines.push(`${indent}        ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,`);
			lines.push(
				`${indent}        ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),`
			);
			lines.push(`${indent}    },`);
		}
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
			if (node.fields.length === 0 && node.children.length > 0) {
				listContainers.add(kind);
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
			// Override polymorphs have visible child kinds (e.g. 'array_expression_list')
			// whose real parse-tree names differ from the internal form kinds
			// ('array_expression__form_list'). Pair them by position: variantChildKinds[i]
			// corresponds to the i-th non-passthrough form in polyForms order.
			const nonPassthroughForms = node.forms.filter((f) => !f.overridePassthrough);
			for (let i = 0; i < node.variantChildKinds.length; i++) {
				const childKind = node.variantChildKinds[i]!;
				if (!map.has(childKind) && i < nonPassthroughForms.length) {
					map.set(childKind, nonPassthroughForms[i]!.name);
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
			return { tag: 'concrete', kind: cls.kind, typeName: node.typeName };
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
 * The `render_dispatch(&NodeData)` path is retained as a legacy inverse
 * bridge for internal callers that still resolve through `NodeData`
 * rather than typed transport.
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

	// ---- impl AnyTransport::transport_named --------------------------------
	// Returns the inner transport struct's named flag so the children-slot
	// filter (.filter(|t| t.transport_named().unwrap_or(true))) can skip
	// anonymous fill items (e.g. duplicate commas in tuple_pattern).
	// Unit-literal variants have no struct, so they return None (= include).
	lines.push(`impl AnyTransport {`);
	lines.push(`    #[inline]`);
	lines.push(`    pub fn transport_named(&self) -> Option<bool> {`);
	lines.push(`        match self {`);
	for (const node of nodes) {
		// Only transport structs carry the transport_named field.
		// AssembledEnum nodes (perSlotEnum — e.g. RangeExpressionBinaryOperatorEnum) and
		// polymorph nodes (e.g. ArrayExpressionTransport) generate Rust enums, not structs,
		// and have no such field. Fall through to `_ => None` for those.
		if (node instanceof AssembledEnum || node.modelType === 'polymorph') continue;
		const variant = rustTransportVariantName(node);
		lines.push(`            Self::${variant}(t) => t.transport_named,`);
	}
	lines.push(`            _ => None,`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');

	return lines;
}
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
	switch (node.modelType) {
		case 'branch':
		case 'group':
		case 'polymorph': {
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
	const slotModel = renderSlotModelOf(node);
	const hasChildren = slotModel.unnamed.length > 0;
	const lines: string[] = [];
	lines.push(`fn ${fnName}(node: &${structName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
	if (hasChildren) {
		const childrenIsRequired = slotModel.unnamedRequired;
		const childrenIsMultiple = slotModel.unnamedMultiple;
		const childrenCls = classifyUnnamedSlot(slotModel, nodeMap);
		// For per-slot enum (heterogeneous) and concrete/supertype, all implement
		// RenderableTransport — use `child` directly as the expression.
		const childWriteCall = buildSlotWriteCall(childrenCls, 'child');
		if (childrenIsMultiple) {
			// Repeated unnamed children are always stored as Vec<T> on the transport
			// surface, even for 0-many grammar slots. Keep fallback render helpers
			// aligned with that struct shape.
			lines.push(`    for child in node.children.iter() {`);
			lines.push(`        ${childWriteCall}`);
			lines.push(`    }`);
			lines.push(`    Ok(())`);
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

/** Returns the set of field names whose slots contain mixed named+anonymous content. */
function buildFieldMixedByName(fields: readonly AssembledNonterminal[]): ReadonlySet<string> {
	const set = new Set<string>();
	for (const f of fields) {
		if (kindsOf(f).length > 0 && slotLiteralValues(f).length > 0) {
			set.add(f.name);
		}
	}
	return set;
}

/**
 * Classify a node's canonical unnamed slot model.
 *
 * Uses `classifySlotForEmit` — downgrades supertype/multi concrete slots to
 * heterogeneous (no Phase 1 transport type for those).
 */
function classifyUnnamedSlot(slotModel: RenderSlotModel, nodeMap: NodeMap): SlotClass {
	const cls = classifySlotForEmit(slotModel.unnamedKinds, nodeMap);
	// When the slot classifies as heterogeneous, mark whether all child kinds are
	// supertypes/polymorphs/multi (useBox=true → Box<AnyTransport> fallback) or
	// at least one has a concrete transport struct (useBox=false → per-slot enum).
	if (cls.tag === 'heterogeneous') {
		return { tag: 'heterogeneous', useBox: !hasAnyConcreteChildKind(slotModel.unnamedKinds, nodeMap) };
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
	const slotModel = renderSlotModelOf(node);

	// Build per-field kind maps for typed render call selection (Phase 1).
	const fieldKindsByName = buildFieldKindsByName(slotModel.named);
	const fieldMixedByName = buildFieldMixedByName(slotModel.named);
	const childrenCls = classifyUnnamedSlot(slotModel, nodeMap);

	lines.push(`fn ${fnName}(node: &${structName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
	lines.push(...buildTypedTemplateBody(struct, separator, fieldKindsByName, fieldMixedByName, childrenCls, nodeMap));
	lines.push(`}`);
	lines.push('');

	return lines;
}

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
function emitIterCollectBuffer(ident: string, sourceExpr: string, mapBody: string, filterAnon = false): string[] {
	const R = RENDERABLE_PREFIX;
	const lines: string[] = [`    let ${ident}_buf: Vec<${R}Renderable<'_>> = ${sourceExpr}.iter()`];
	if (filterAnon) {
		lines.push(`        .filter(|t| t.transport_named().unwrap_or(true))`);
	}
	lines.push(`        .map(|t| ${mapBody})`, `        .collect();`);
	return lines;
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
function emitListSlotBuffer(ident: string, required: boolean, filterAnon = false): string[] {
	const R = RENDERABLE_PREFIX;
	const mapBody = `${R}Renderable::Transport(t)`;
	if (required) {
		return emitIterCollectBuffer(ident, `node.${ident}`, mapBody, filterAnon);
	}
	return [
		`    let ${ident}_owned = node.${ident}.as_deref().unwrap_or(&[]);`,
		...emitIterCollectBuffer(ident, `${ident}_owned`, mapBody, filterAnon)
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
 * @param fieldMixedByName - set of field names whose slots have mixed named+anonymous
 *   content. When a field is in this set, it is always classified as heterogeneous
 *   regardless of what classifySlotForEmit returns, matching the transport struct
 *   field type emitted by rustTransportSlotType (which then chooses per-slot enum
 *   vs Box<AnyTransport> via `hasAnyConcreteChildKind`).
 * @param childrenCls - slot classification for the children slot. Falls back
 *   to heterogeneous when not provided.
 */
function buildTypedTemplateBody(
	struct: EmittedStruct,
	separator: string,
	fieldKindsByName: ReadonlyMap<string, readonly string[]> = new Map(),
	fieldMixedByName: ReadonlySet<string> = new Set(),
	childrenCls: SlotClass = { tag: 'heterogeneous' },
	nodeMap: NodeMap | undefined = undefined
): string[] {
	const lines: string[] = [];
	const templateName = struct.name;
	const sepLiteral = JSON.stringify(separator);
	const R = RENDERABLE_PREFIX;

	// Classify helper — use classifySlotForEmit when nodeMap is available so
	// that supertype/multi single-kind slots fall back to heterogeneous (Phase 1).
	// When fieldName is in fieldMixedByName, return heterogeneous with `useBox`
	// derived from whether any concrete child kind exists (per-slot enum vs
	// Box<AnyTransport> — matches `rustTransportSlotType`'s decision).
	const classifyField = (fieldName: string, kinds: readonly string[]): SlotClass => {
		if (fieldMixedByName.has(fieldName)) {
			const useBox = nodeMap === undefined || !hasAnyConcreteChildKind(kinds, nodeMap);
			return { tag: 'heterogeneous', useBox };
		}
		const cls = nodeMap !== undefined ? classifySlotForEmit(kinds, nodeMap) : classifySlot(kinds);
		if (cls.tag === 'heterogeneous') {
			const useBox = nodeMap === undefined || !hasAnyConcreteChildKind(kinds, nodeMap);
			return { tag: 'heterogeneous', useBox };
		}
		return cls;
	};

	// Emit children-slot buffer. For list slots (Vec<T>) use emitListSlotBuffer;
	// for single-child slots (T / Option<T>) use emitSingleChildBuffer which
	// exploits Option::as_slice() for zero-allocation feeding into ListNonterminalView.
	if (struct.hasChildren && struct.childrenMultiple) {
		if (struct.transportHasChildren) {
			// Filter anonymous fill items only when the children slot is Vec<AnyTransport>
			// (useBox !== false). Per-slot enum children ({TypeName}ChildTransportSlot) do not
			// have transport_named() and must not be filtered.
			const filterAnon = childrenCls.tag === 'heterogeneous' && childrenCls.useBox !== false;
			lines.push(...emitListSlotBuffer('children', true, filterAnon));
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
	if (struct.hasChildren && struct.childrenRequired && !struct.childrenMultiple && !struct.transportHasChildren) {
		lines.push(
			`    return Err(::askama::Error::Custom(format!("render_transport_dispatch: missing required children on '{}'", ${JSON.stringify(struct.kind)}).into()));`
		);
	}

	// Build template struct — all single-value fields use Renderable::Transport.
	lines.push(`    let template = ${templateName} {`);

	if (struct.hasChildren) {
		if (struct.childrenMultiple) {
			lines.push(`        children: ListNonterminalView {`);
			lines.push(`            items: children_buf.as_slice(),`);
			lines.push(`            separator: ${sepLiteral},`);
			lines.push(`            leading: false,`);
			lines.push(`            trailing: false,`);
			lines.push(`        },`);
		} else if (struct.childrenRequired) {
			if (childrenCls.tag === 'heterogeneous' && childrenCls.useBox === true) {
				lines.push(`        children: SingleNonterminalView(${R}Renderable::Transport(node.children.as_ref())),`);
			} else {
				lines.push(`        children: SingleNonterminalView(${R}Renderable::Transport(&node.children)),`);
			}
		} else if (!struct.transportHasChildren) {
			lines.push(`        children: OptionalNonterminalView::Missing,`);
		} else if (childrenCls.tag === 'heterogeneous' && childrenCls.useBox === true) {
			lines.push(`        children: match &node.children {`);
			lines.push(`            Some(v) => OptionalNonterminalView::Present(${R}Renderable::Transport(v.as_ref())),`);
			lines.push(`            None => OptionalNonterminalView::Missing,`);
			lines.push(`        },`);
		} else {
			lines.push(`        children: match &node.children {`);
			lines.push(`            Some(v) => OptionalNonterminalView::Present(${R}Renderable::Transport(v)),`);
			lines.push(`            None => OptionalNonterminalView::Missing,`);
			lines.push(`        },`);
		}
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
		const cls = classifyField(f.name, kinds);
		const isBoxed = cls.tag === 'heterogeneous' && cls.useBox !== false;
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
			} else if (isBoxed) {
				// Heterogeneous fallback — type is Box<AnyTransport> (no concrete
				// child kind to ground a per-slot enum). Deref through Box.
				lines.push(`        ${rIdent}: SingleNonterminalView(${R}Renderable::Transport(node.${rIdent}.as_ref())),`);
			} else {
				// Concrete / supertype / per-slot enum — Rust auto-coerces &T to
				// &dyn RenderableTransport (per-slot enum impls RenderableTransport).
				lines.push(`        ${rIdent}: SingleNonterminalView(${R}Renderable::Transport(&node.${rIdent})),`);
			}
		} else {
			// Optional single-value slot.
			if (!f.hasTransportField) {
				lines.push(`        ${rIdent}: OptionalNonterminalView::Missing,`);
			} else if (isBoxed) {
				// Heterogeneous fallback — type is Option<Box<AnyTransport>>.
				lines.push(`        ${rIdent}: match &node.${rIdent} {`);
				lines.push(`            Some(v) => OptionalNonterminalView::Present(${R}Renderable::Transport(v.as_ref())),`);
				lines.push(`            None => OptionalNonterminalView::Missing,`);
				lines.push(`        },`);
			} else {
				// Concrete / supertype / per-slot enum — Rust auto-coerces &T.
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
// lib.rs — expose legacy direct render + transport render entrypoints
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

#[deprecated(note = "legacy direct NodeData render bridge; normal native flow uses render_transport_dispatch via typed transport")]
pub use bridge::render_nodedata_into;
#[deprecated(note = "legacy direct NodeData render entrypoint; normal native flow uses render_transport_dispatch via typed transport")]
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
		structs.push(emitStruct(kind, node, mergeTemplateSurfaceFromBody(f.content, rendered?.surface)));
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
	const literalVariantByKey = new Map(
		projection.literals.map(
			(literal, index) => [`${literal.kind}\0${literal.text}`, rustLiteralTransportVariantName(literal, index)] as const
		)
	);
	const perSlotEnumLines: string[] = perSlotEnums.flatMap((entry) =>
		emitPerSlotChildEnum(entry, kidByKind, nodeMap, literalVariantByKey)
	);

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
	lines.push('    NodeData, FieldValue, OneOrMany, RenderableTransport, Source, Span, NodeTrivia, TransportTrivia,');
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
	const collectFromNode = (fields: readonly AssembledNonterminal[], slotModel: RenderSlotModel): void => {
		for (const field of fields) {
			const cls = classifySlotForEmit(kindsOf(field), nodeMap);
			if (cls.tag === 'supertype') used.add(cls.supertypeName);
		}
		if (slotModel.unnamed.length > 0) {
			const cls = classifyUnnamedSlot(slotModel, nodeMap);
			if (cls.tag === 'supertype') used.add(cls.supertypeName);
		}
	};

	for (const node of nodes) {
		const slotModel = renderSlotModelOf(node);
		collectFromNode(slotModel.named, slotModel);
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
	const { subtypes: validSubtypes, suppressedKinds } = collectEffectiveSupertypeTransportShape(supertypeNode, nodeMap);

	// Helper: is a subtype leaf-like (small, no Box needed)?
	const isLeafLike = (n: AssembledNode): boolean =>
		n.modelType === 'pattern' || n.modelType === 'keyword' || n.modelType === 'token' || n.modelType === 'enum';

	const emitDecodeTrials = (leafOnly = false, indent = '                ') => {
		for (const { subNode } of validSubtypes) {
			if (leafOnly && !isLeafLike(subNode)) continue;
			const variant = rustTypeIdent(subNode.typeName);
			const typeName = rustTransportStructName(subNode);
			if (isLeafLike(subNode)) {
				lines.push(`${indent}if let Ok(value) = ${typeName}::from_napi_value(env, napi_val) {`);
				lines.push(`${indent}    return Ok(Self::${variant}(value));`);
				lines.push(`${indent}}`);
			} else {
				lines.push(`${indent}if let Ok(value) = ${typeName}::from_napi_value(env, napi_val) {`);
				lines.push(`${indent}    return Ok(Self::${variant}(Box::new(value)));`);
				lines.push(`${indent}}`);
			}
		}
	};

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
		lines.push(`        let kind_id = if let Ok(kind_id) = u16::from_napi_value(env, napi_val) {`);
		lines.push(`            Some(kind_id)`);
		lines.push(`        } else if let Ok(obj) = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val) {`);
		lines.push(`            obj.get::<u16>("$type")?`);
		lines.push(`        } else {`);
		lines.push(`            None`);
		lines.push(`        };`);
		lines.push(`        if let Some(kind_id) = kind_id {`);
		lines.push(`            return match kind_id {`);
		const emittedIds = new Set<number>();
		const selfId = kindIdByKind.get(supertypeNode.kind);
		if (selfId !== undefined) {
			lines.push(`                ${selfId} => {`);
			emitDecodeTrials();
			lines.push(
				`                    Err(::napi::Error::from_reason(${JSON.stringify(
					`unknown aliased kind id {kind_id} in ${enumName}`
				)}))`
			);
			lines.push(`                },`);
			emittedIds.add(selfId);
		}
		for (const suppressedKind of suppressedKinds) {
			const id = kindIdByKind.get(suppressedKind);
			if (id === undefined || emittedIds.has(id)) continue;
			lines.push(`                ${id} => {`);
			emitDecodeTrials();
			lines.push(
				`                    Err(::napi::Error::from_reason(${JSON.stringify(
					`unknown reserved supertype kind id {kind_id} in ${enumName}`
				)}))`
			);
			lines.push(`                },`);
			emittedIds.add(id);
		}
		for (const { subKind, subNode } of validSubtypes) {
			const variant = rustTypeIdent(subNode.typeName);
			const typeName = rustTransportStructName(subNode);
			const acceptedKinds = new Set([subKind, ...collectConcreteTransportKinds(subKind, nodeMap)]);
			if (subNode instanceof AssembledEnum) {
				for (const resolvedKind of subNode.resolvedKinds) {
					acceptedKinds.add(resolvedKind);
				}
			}
			for (const acceptedKind of acceptedKinds) {
				const id = kindIdByKind.get(acceptedKind);
				if (id === undefined || emittedIds.has(id)) continue;
				emittedIds.add(id);
				if (isLeafLike(subNode)) {
					lines.push(`                ${id} => Ok(Self::${variant}(`);
					lines.push(`                    ${typeName}::from_napi_value(env, napi_val)?`);
					lines.push(`                )),`);
				} else {
					lines.push(`                ${id} => Ok(Self::${variant}(Box::new(`);
					lines.push(`                    ${typeName}::from_napi_value(env, napi_val)?`);
					lines.push(`                ))),`);
				}
			}
		}
		lines.push(`                other => Err(::napi::Error::from_reason(format!(`);
		lines.push(`                    "unknown kind id {other} in ${enumName}",`);
		lines.push(`                ))),`);
		lines.push(`            };`);
		lines.push(`        }`);
		lines.push(`        if String::from_napi_value(env, napi_val).is_ok() {`);
		emitDecodeTrials(false, '            ');
		lines.push(`        }`);
		lines.push(`        Err(::napi::Error::from_reason(${JSON.stringify(`$type property missing in ${enumName}`)}))`);
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
 * Each arm delegates to the concrete kind's render fn through the parent
 * typed helper. Arm count is bounded by the supertype's subtype
 * count (~5–40), not the full grammar (~1040 for rust).
 *
 * @param supertypeNode - the assembled supertype node
 * @param nodeMap       - for typeName + modelType lookups
 */
function emitSupertypeRenderHelper(supertypeNode: AssembledSupertype, nodeMap: NodeMap): string[] {
	const enumName = `${rustTypeIdent(supertypeNode.typeName)}Transport`;
	const fnName = `render_${rustSnakeIdent(supertypeNode.typeName)}`;
	const lines: string[] = [];
	const { subtypes: validSubtypes } = collectEffectiveSupertypeTransportShape(supertypeNode, nodeMap);

	const isLeafLike = (n: AssembledNode): boolean =>
		n.modelType === 'pattern' || n.modelType === 'keyword' || n.modelType === 'token' || n.modelType === 'enum';

	lines.push(`fn ${fnName}(t: &${enumName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
	lines.push(`    match t {`);
	for (const { subNode } of validSubtypes) {
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

function collectConcreteTransportKinds(kind: string, nodeMap: NodeMap, seen: Set<string> = new Set()): string[] {
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

function expandConcreteTransportKinds(
	kinds: readonly string[],
	nodeMap: NodeMap
): { kind: string; node: AssembledNode; concreteName: string }[] {
	const expanded: { kind: string; node: AssembledNode; concreteName: string }[] = [];
	const seen = new Set<string>();

	const includeKind = (kind: string): void => {
		if (seen.has(kind)) return;
		const node = nodeMap.nodes.get(kind);
		if (node === undefined) return;
		const concreteName = concreteTransportTypeName(kind, nodeMap);
		if (concreteName !== null) {
			seen.add(kind);
			expanded.push({ kind, node, concreteName });
			return;
		}
		if (node.modelType !== 'supertype') return;
		for (const concreteKind of collectConcreteTransportKinds(kind, nodeMap)) {
			includeKind(concreteKind);
		}
	};

	for (const kind of kinds) {
		includeKind(kind);
	}

	return expanded;
}

/**
 * Per-slot children enum entry: identifies a heterogeneous slot (named or
 * unnamed) on a parent node, plus the set of concrete kinds it accepts.
 *
 * Per cleanup-rules.md §E1 (no special treatment for unnamed vs named slots):
 * BOTH kinds of heterogeneous slots get per-slot typed enums. Per-slot enums
 * give us Box-elision (non-recursive variants stay inline in the parent
 * struct) that `Box<AnyTransport>` cannot.
 */
interface PerSlotChildEnum {
	/** PascalCase typeName of the parent node. */
	typeName: string;
	/** Field name — set for named-slot enums (e.g. `body` for `mod_item.body`).
	 *  Undefined for unnamed-slot (`$children`) enums. */
	fieldName?: string;
	/** Concrete kinds in this slot. */
	kinds: readonly string[];
	/** Terminal literal children that may appear in runtime `$children`. */
	literals: readonly TransportLiteral[];
}

/**
 * Returns `true` when at least one kind in `kinds` can produce a concrete
 * transport type (i.e. `concreteTransportTypeName` returns non-null).
 * When all kinds are supertypes / multi / polymorph, a per-slot enum would be
 * empty and must not be emitted — callers fall back to `Box<AnyTransport>`.
 */
function hasAnyConcreteChildKind(kinds: readonly string[], nodeMap: NodeMap): boolean {
	return expandConcreteTransportKinds(kinds, nodeMap).length > 0;
}

/**
 * Collect all nodes whose `structuralChildren` classify as `heterogeneous`
 * (multiple distinct kinds, no grammar supertype covering them) — these need
 * a `{TypeName}ChildTransportSlot` per-slot enum emitted before the struct.
 *
 * Polymorph forms are also covered: each form that has heterogeneous children
 * contributes its own entry (keyed by `formTypeName` so the enum name is
 * distinct from the parent struct).
 *
 * Per cleanup-rules §E1, named heterogeneous fields ALSO get per-slot enums
 * (`{TypeName}{FieldName}TransportSlot`). Under option (c) of the task, the
 * enum is emitted alongside the existing `Box<AnyTransport>` field type so
 * the enum is available for future use without changing field types yet.
 *
 * @param nodes   - assembled nodes from the transport projection
 * @param nodeMap - for classification
 */
function collectPerSlotChildEnums(nodes: readonly AssembledNode[], nodeMap: NodeMap): PerSlotChildEnum[] {
	const entries: PerSlotChildEnum[] = [];
	const seen = new Set<string>();
	// All existing transport struct / enum names — used ONLY by the named-slot
	// pass below to guard against any naming collision between named-slot enum
	// names (`<TypeName><FieldName>TransportSlot`) and existing struct names.
	// One observed collision class is polymorph-form-derived names (e.g.
	// `AssertsAnnotationAssertsTransport` from form `asserts_annotation__form_asserts`
	// coincides with parent `asserts_annotation` + named field `asserts`), but
	// the set covers ALL transport struct names — branch, group, polymorph,
	// supertype enum, etc. — so we catch every collision class, not just
	// polymorph forms. Pre-populating from every `rustTransportStructName(node)`
	// is the single, scope-correct guard.
	const reservedTransportNames = new Set<string>();
	for (const node of nodes) {
		reservedTransportNames.add(rustTransportStructName(node));
	}

	const consider = (typeName: string, slotModel: RenderSlotModel): void => {
		if (slotModel.unnamed.length === 0) return;
		const allKinds = slotModel.unnamedKinds;
		const literalSet = new Set<string>();
		const literals: TransportLiteral[] = [];
		for (const child of slotModel.unnamed) {
			for (const text of slotLiteralValues(child)) {
				const key = `${text}\0${text}`;
				if (literalSet.has(key)) continue;
				literalSet.add(key);
				literals.push({ kind: text, text });
			}
		}
		const cls = classifyUnnamedSlot(slotModel, nodeMap);
		if (cls.tag !== 'heterogeneous') return;
		// If all child kinds map to supertypes/polymorphs/multi (no concrete transport
		// struct exists for any of them), emitting an empty enum would fail to compile.
		// Fall back to Box<AnyTransport> by skipping enum collection for this slot.
		if (!hasAnyConcreteChildKind(allKinds, nodeMap)) return;
		const enumName = perSlotEnumName(typeName);
		if (seen.has(enumName)) return;
		seen.add(enumName);
		entries.push({ typeName, kinds: allKinds, literals });
	};

	// Per cleanup-rules §E1, named heterogeneous fields ALSO get per-slot typed
	// enums (symmetry with unnamed `$children`). Per §E6, only genuinely
	// multi-shape slots widen — single-shape stays single-shape. This pass mirrors
	// the unnamed pass above for named fields, deduping via the same `seen` set.
	const considerNamed = (typeName: string, field: AssembledNonterminal): void => {
		const namedKinds = kindsOf(field);
		const literalSet = new Set<string>();
		const literals: TransportLiteral[] = [];
		for (const text of slotLiteralValues(field)) {
			const key = `${text}\0${text}`;
			if (literalSet.has(key)) continue;
			literalSet.add(key);
			literals.push({ kind: text, text });
		}
		// Mixed-content override: a field with named kinds AND anonymous literal
		// content is heterogeneous regardless of classifier (mirror the same logic
		// used in `rustTransportSlotType` and `bridgeClassForField`).
		const hasMixedContent = namedKinds.length > 0 && literals.length > 0;
		const cls = hasMixedContent ? ({ tag: 'heterogeneous' } as const) : classifySlotForEmit(namedKinds, nodeMap);
		if (cls.tag !== 'heterogeneous') return;
		// Empty-enum guard: bail if no kind maps to a concrete transport struct.
		if (!hasAnyConcreteChildKind(namedKinds, nodeMap)) return;
		const enumName = perSlotEnumName(typeName, field.name);
		if (seen.has(enumName)) return;
		// Collision guard: refuse to emit when the synthesized name shadows an
		// existing transport struct or enum (e.g. polymorph-form-derived names).
		if (reservedTransportNames.has(enumName)) return;
		seen.add(enumName);
		entries.push({ typeName, fieldName: field.name, kinds: namedKinds, literals });
	};

	for (const node of nodes) {
		const slotModel = renderSlotModelOf(node);
		consider(node.typeName, slotModel);
		for (const field of slotModel.named) {
			considerNamed(node.typeName, field);
		}
	}
	return entries;
}

/**
 * Emit a `{TypeName}ChildTransportSlot` per-slot children enum for a heterogeneous
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
	nodeMap: NodeMap,
	literalVariantByKey: ReadonlyMap<string, string>
): string[] {
	const enumName = perSlotEnumName(entry.typeName, entry.fieldName);
	const lines: string[] = [];
	const hasSupertypeSourceKinds = entry.kinds.some((kind) => nodeMap.nodes.get(kind)?.modelType === 'supertype');

	// Expand any supertype child kinds to their concrete transport-bearing kinds,
	// then dedupe so aliased / overlapping paths emit one variant per concrete kind.
	const validKinds = expandConcreteTransportKinds(entry.kinds, nodeMap);

	// If no valid concrete kinds remain (all were supertypes/polymorphs), fall back
	// to emitting an empty enum — this should be caught upstream by the caller.
	const isLeafLike = (n: AssembledNode): boolean =>
		n.modelType === 'pattern' || n.modelType === 'keyword' || n.modelType === 'token' || n.modelType === 'enum';

	// Spec 024 cleanup-§E1: named-slot enums are load-bearing alongside unnamed
	// `$children` enums — `rustTransportSlotType` returns the per-slot enum name
	// for any heterogeneous slot with at least one concrete child kind. No
	// `#[allow(dead_code)]` needed; both the enum and its `_transport_slot_to_any`
	// bridge fn are referenced (struct field type + bridge expression).
	lines.push(`#[derive(Debug, Clone)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const { node, concreteName } of validKinds) {
		const variant = rustTypeIdent(node.typeName);
		const variantType = isLeafLike(node) ? concreteName : `Box<${concreteName}>`;
		lines.push(`    ${variant}(${variantType}),`);
	}
	for (const literal of entry.literals) {
		const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
		if (variant !== undefined) {
			lines.push(`    ${variant},`);
		}
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
		lines.push(`        let kind_id = if let Ok(kind_id) = u16::from_napi_value(env, napi_val) {`);
		lines.push(`            Some(kind_id)`);
		lines.push(`        } else if let Ok(obj) = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val) {`);
		lines.push(`            obj.get::<u16>("$type")?`);
		lines.push(`        } else {`);
		lines.push(`            None`);
		lines.push(`        };`);
		lines.push(`        if let Some(kind_id) = kind_id {`);
		lines.push(`            match kind_id {`);
		const emittedIds = new Set<number>();
		for (const { kind, node, concreteName } of validKinds) {
			const variant = rustTypeIdent(node.typeName);
			const typeName = concreteName;
			const acceptedKinds = new Set<string>(acceptedTransportKinds(kind, nodeMap));
			if (node instanceof AssembledEnum) {
				for (const resolvedKind of node.resolvedKinds) {
					acceptedKinds.add(resolvedKind);
				}
			}
			for (const acceptedKind of acceptedKinds) {
				const id = kindIdByKind.get(acceptedKind);
				if (id === undefined || emittedIds.has(id)) continue;
				emittedIds.add(id);
				if (isLeafLike(node)) {
					lines.push(`                ${id} => return Ok(Self::${variant}(`);
					lines.push(`                    ${typeName}::from_napi_value(env, napi_val)?`);
					lines.push(`                )),`);
				} else {
					lines.push(`                ${id} => return Ok(Self::${variant}(Box::new(`);
					lines.push(`                    ${typeName}::from_napi_value(env, napi_val)?`);
					lines.push(`                ))),`);
				}
			}
		}
		for (const literal of entry.literals) {
			const id = kindIdByKind.get(literal.kind);
			const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
			if (id === undefined || variant === undefined || emittedIds.has(id)) continue;
			emittedIds.add(id);
			lines.push(`                ${id} => return Ok(Self::${variant}),`);
		}
		if (hasSupertypeSourceKinds) {
			lines.push(`                _ => {}`);
		} else {
			lines.push(`                other => return Err(::napi::Error::from_reason(format!(`);
			lines.push(`                    "unknown kind id {other} in ${enumName}",`);
			lines.push(`                ))),`);
		}
		lines.push(`            }`);
		lines.push(`        }`);
		const fallbackGuard = hasSupertypeSourceKinds
			? 'String::from_napi_value(env, napi_val).is_ok() || ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val).is_ok()'
			: 'String::from_napi_value(env, napi_val).is_ok()';
		lines.push(`        if ${fallbackGuard} {`);
		for (const { node, concreteName } of validKinds) {
			const variant = rustTypeIdent(node.typeName);
			if (isLeafLike(node)) {
				lines.push(`            if let Ok(value) = ${concreteName}::from_napi_value(env, napi_val) {`);
				lines.push(`                return Ok(Self::${variant}(value));`);
				lines.push(`            }`);
			} else {
				lines.push(`            if let Ok(value) = ${concreteName}::from_napi_value(env, napi_val) {`);
				lines.push(`                return Ok(Self::${variant}(Box::new(value)));`);
				lines.push(`            }`);
			}
		}
		lines.push(`        }`);
		if (hasSupertypeSourceKinds) {
			lines.push(`        if let Some(other) = kind_id {`);
			lines.push(`            return Err(::napi::Error::from_reason(format!(`);
			lines.push(`                "unknown kind id {other} in ${enumName}",`);
			lines.push(`            )));`);
			lines.push(`        }`);
		}
		lines.push(`        Err(::napi::Error::from_reason(${JSON.stringify(`$type property missing in ${enumName}`)}))`);
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

	// Bridge helper: converts per-slot enum → AnyTransport for the NodeData
	// bridge (used by `render_nodedata_into` / `render_dispatch`). AnyTransport
	// is a sized enum — no Box needed. Both named-slot and unnamed `$children`
	// bridge fns are load-bearing after spec 024 §E1 (named field type became the
	// per-slot enum, so the bridge MUST convert via this fn instead of derefing
	// a `Box<AnyTransport>`).
	const bridgeFnName =
		entry.fieldName !== undefined
			? `${rustSnakeIdent(entry.typeName)}_${rustSnakeIdent(entry.fieldName)}_transport_slot_to_any`
			: `${rustSnakeIdent(entry.typeName)}_child_transport_slot_to_any`;
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
	for (const literal of entry.literals) {
		const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
		if (variant !== undefined) {
			lines.push(`        ${enumName}::${variant} => AnyTransport::${variant},`);
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
	for (const literal of entry.literals) {
		const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
		if (variant !== undefined) {
			lines.push(
				`            ${enumName}::${variant} => dest.write_str(${JSON.stringify(literal.text)}).map_err(::askama::Error::from),`
			);
		}
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
	lines.push('        let kind_id = if let Ok(kind_id) = u16::from_napi_value(env, napi_val) {');
	lines.push('            Some(kind_id)');
	lines.push('        } else if let Ok(obj) = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val) {');
	lines.push('            obj.get::<u16>("$type")?');
	lines.push('        } else {');
	lines.push('            None');
	lines.push('        };');
	lines.push('        if let Some(kind_id) = kind_id {');
	lines.push('            return match kind_id {');

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
		lines.push(`                // kind: ${node.kind} (${constName})`);
		lines.push(`                ${id} => Ok(AnyTransport::${variant}(`);
		lines.push(`                    ${structName}::from_napi_value(env, napi_val)?`);
		lines.push(`                )),`);
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
		lines.push(`                // literal kind: ${literal.kind} → ${JSON.stringify(literal.text)}`);
		lines.push(`                ${id} => Ok(AnyTransport::${variant}),`);
	}

	lines.push('                other => Err(::napi::Error::from_reason(format!(');
	lines.push('                    "unknown kind id {other} in AnyTransport"');
	lines.push('                ))),');
	lines.push('            };');
	lines.push('        }');
	lines.push('        if String::from_napi_value(env, napi_val).is_ok() {');
	for (const node of nodes) {
		const variant = rustTransportVariantName(node);
		const structName = rustTransportStructName(node);
		lines.push(`            if let Ok(value) = ${structName}::from_napi_value(env, napi_val) {`);
		lines.push(`                return Ok(AnyTransport::${variant}(value));`);
		lines.push('            }');
	}
	lines.push('        }');
	lines.push('        Err(::napi::Error::from_reason("$type property missing in AnyTransport"))');
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
	switch (node.modelType) {
		case 'branch':
		case 'group':
		case 'polymorph': {
			const slotModel = renderSlotModelOf(node);
			return renderTransportDataToNodeFn(
				rustTransportToNodeFnName(node.typeName),
				rustTransportStructName(node),
				node.kind,
				slotModel,
				true,
				true,
				kindIdByKind,
				nodeMap,
				node.typeName
			);
		}
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
	slotModel: RenderSlotModel,
	defaultNamed: boolean,
	hasOptionalText: boolean,
	kindIdByKind?: ReadonlyMap<string, number>,
	nodeMap?: NodeMap,
	/** PascalCase typeName of the owning struct — passed to
	 *  `renderTransportChildrenBinding` (for the per-slot child enum bridge fn
	 *  on the unnamed `$children` slot) and to `buildBridge*` (for the per-slot
	 *  enum bridge fn on named heterogeneous fields landed by spec 024 §E1). */
	ownerTypeName?: string
): string[] {
	const kindArg = kindIdExpr(kind, kindIdByKind);
	const lines: string[] = [];
	lines.push(`fn ${fnName}(transport: ${structName}) -> Result<TransportNodeData, ::askama::Error> {`);
	lines.push('    let mut fields = TransportHashMap::new();');
	for (const field of slotModel.named) {
		const access = `transport.${rustFieldIdent(field.name)}`;
		// When nodeMap is available and the field is a single-concrete-kind slot,
		// the struct field type is a concrete transport type (not AnyTransport).
		// Wrap it into AnyTransport for the bridge helper, which expects the
		// type-erased form. Fall back to direct access when the field is already
		// AnyTransport (heterogeneous / polymorph / supertype / multi).
		if (isMultiple(field)) {
			if (isRequired(field)) {
				const bridged = buildBridgeListRequired(field, access, nodeMap, ownerTypeName);
				lines.push(
					`    fields.insert(${JSON.stringify(field.name)}.to_string(), transport_field_values(${bridged})?);`
				);
			} else {
				lines.push(`    if let Some(value) = ${access} {`);
				const bridged = buildBridgeOptionalList(field, 'value', nodeMap, ownerTypeName);
				lines.push(
					`        fields.insert(${JSON.stringify(field.name)}.to_string(), transport_field_values(${bridged})?);`
				);
				lines.push('    }');
			}
		} else if (isRequired(field)) {
			const bridged = buildBridgeSingleRequired(field, access, nodeMap, ownerTypeName);
			lines.push(`    fields.insert(${JSON.stringify(field.name)}.to_string(), transport_field_value(${bridged})?);`);
		} else {
			lines.push(`    if let Some(value) = ${access} {`);
			const bridged = buildBridgeOptionalSingle(field, 'value', nodeMap, ownerTypeName);
			lines.push(
				`        fields.insert(${JSON.stringify(field.name)}.to_string(), transport_field_value(${bridged})?);`
			);
			lines.push('    }');
		}
	}
	lines.push('    let fields = if fields.is_empty() { None } else { Some(fields) };');
	lines.push(...renderTransportChildrenBinding(slotModel, nodeMap, ownerTypeName));
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
 * Returns `{ kind: 'transportSlot', toAnyFn }` — call
 *   `<ownerSnake>_<fieldSnake>_transport_slot_to_any(…)` (the heterogeneous
 *   per-slot typed enum landed on the named field after spec 024 cleanup-§E1).
 * Returns `undefined` — already `AnyTransport`, pass unchanged.
 */
type BridgeFieldClass =
	| { readonly kind: 'concrete'; readonly variant: string }
	| { readonly kind: 'supertype'; readonly toAnyFn: string }
	| { readonly kind: 'transportSlot'; readonly toAnyFn: string }
	| undefined;

function bridgeClassForField(
	field: AssembledNonterminal,
	nodeMap: NodeMap | undefined,
	ownerTypeName: string | undefined
): BridgeFieldClass {
	if (nodeMap === undefined) return undefined;
	const namedKinds = kindsOf(field);
	// Apply the same hasMixedContent check used in rustTransportSlotType: if a
	// slot mixes named kinds with anonymous literals (e.g. function_modifiers.modifier),
	// it is heterogeneous regardless of what classifySlotForEmit says.
	const hasMixedContent = namedKinds.length > 0 && slotLiteralValues(field).length > 0;
	const cls = hasMixedContent ? ({ tag: 'heterogeneous' } as const) : classifySlotForEmit(namedKinds, nodeMap);
	if (cls.tag === 'concrete') return { kind: 'concrete', variant: rustTypeIdent(cls.typeName) };
	if (cls.tag === 'supertype') {
		return { kind: 'supertype', toAnyFn: `${rustSnakeIdent(cls.supertypeName)}_transport_to_any` };
	}
	// Heterogeneous: when the slot has at least one concrete child kind AND the
	// owner is known, the field type is the per-slot enum
	// `<TypeName><FieldName>TransportSlot` (spec 024 cleanup-§E1 flip — symmetry
	// with unnamed `$children`). Bridge via the matching `_transport_slot_to_any`
	// fn emitted alongside the enum. Empty-enum fallback (no concrete child kind)
	// keeps the old `Box<AnyTransport>` shape — bc === undefined, deref via `*`.
	if (ownerTypeName !== undefined && hasAnyConcreteChildKind(namedKinds, nodeMap)) {
		const toAnyFn = `${rustSnakeIdent(ownerTypeName)}_${rustSnakeIdent(field.name)}_transport_slot_to_any`;
		return { kind: 'transportSlot', toAnyFn };
	}
	return undefined; // heterogeneous + empty-enum fallback — already AnyTransport
}

/**
 * For the bridge path: build a Rust expression for a REQUIRED SINGLE field
 * that converts the typed transport value to `AnyTransport`.
 *
 * - heterogeneous (empty-enum fallback): `*access` (Box<AnyTransport> deref)
 * - concrete: `AnyTransport::Variant(access)`
 * - supertype: `<supertype>_transport_to_any(access)`
 * - per-slot enum: `<owner>_<field>_transport_slot_to_any(access)`
 *
 * @param field - the assembled field
 * @param access - Rust expression for the field (e.g. `transport.name`)
 * @param nodeMap - for classification; absent = assume heterogeneous
 * @param ownerTypeName - parent node typeName (for per-slot-enum bridge fn name)
 */
function buildBridgeSingleRequired(
	field: AssembledNonterminal,
	access: string,
	nodeMap: NodeMap | undefined,
	ownerTypeName: string | undefined
): string {
	const bc = bridgeClassForField(field, nodeMap, ownerTypeName);
	if (bc === undefined) return `*${access}`; // Box<AnyTransport> → deref to AnyTransport
	if (bc.kind === 'concrete') return `AnyTransport::${bc.variant}(${access})`;
	// supertype + transportSlot both carry toAnyFn — same emission shape.
	return `${bc.toAnyFn}(${access})`;
}

/**
 * For the bridge path: build a Rust expression for a REQUIRED LIST field
 * that converts each element to `AnyTransport`.
 */
function buildBridgeListRequired(
	field: AssembledNonterminal,
	access: string,
	nodeMap: NodeMap | undefined,
	ownerTypeName: string | undefined
): string {
	const bc = bridgeClassForField(field, nodeMap, ownerTypeName);
	if (bc === undefined) return `${access}.into_iter().collect::<Vec<_>>()`;
	if (bc.kind === 'concrete') {
		return `${access}.into_iter().map(|v| AnyTransport::${bc.variant}(v)).collect::<Vec<_>>()`;
	}
	// supertype + transportSlot both carry toAnyFn — same emission shape.
	return `${access}.into_iter().map(|v| ${bc.toAnyFn}(v)).collect::<Vec<_>>()`;
}

/**
 * For the bridge path: convert an OPTIONAL SINGLE field's already-unwrapped
 * value (after `if let Some(value) = access`) to `AnyTransport`.
 */
function buildBridgeOptionalSingle(
	field: AssembledNonterminal,
	valueExpr: string,
	nodeMap: NodeMap | undefined,
	ownerTypeName: string | undefined
): string {
	const bc = bridgeClassForField(field, nodeMap, ownerTypeName);
	if (bc === undefined) return `*${valueExpr}`; // Box<AnyTransport> → deref to AnyTransport
	if (bc.kind === 'concrete') return `AnyTransport::${bc.variant}(${valueExpr})`;
	// supertype + transportSlot both carry toAnyFn — same emission shape.
	return `${bc.toAnyFn}(${valueExpr})`;
}

/**
 * For the bridge path: convert an OPTIONAL LIST field's already-unwrapped
 * value (after `if let Some(value) = access`) to `Vec<AnyTransport>`.
 */
function buildBridgeOptionalList(
	field: AssembledNonterminal,
	valueExpr: string,
	nodeMap: NodeMap | undefined,
	ownerTypeName: string | undefined
): string {
	const bc = bridgeClassForField(field, nodeMap, ownerTypeName);
	if (bc === undefined) return `${valueExpr}.into_iter().collect::<Vec<_>>()`;
	if (bc.kind === 'concrete') {
		return `${valueExpr}.into_iter().map(|v| AnyTransport::${bc.variant}(v)).collect::<Vec<_>>()`;
	}
	// supertype + transportSlot both carry toAnyFn — same emission shape.
	return `${valueExpr}.into_iter().map(|v| ${bc.toAnyFn}(v)).collect::<Vec<_>>()`;
}

function renderTransportChildrenBinding(
	slotModel: RenderSlotModel,
	nodeMap?: NodeMap,
	/** PascalCase typeName of the owning struct — used for the per-slot
	 *  child enum bridge function name when the slot is heterogeneous. */
	ownerTypeName?: string
): string[] {
	if (slotModel.unnamed.length === 0) return ['    let children = None;'];
	// Determine if children slot is typed (concrete/supertype) or erased (AnyTransport
	// or per-slot child enum). For the bridge path, typed children need to be wrapped
	// into AnyTransport via AnyTransport::Variant(child) or <supertype>_transport_to_any(child)
	// before passing to transport_children().
	const childrenCls = nodeMap !== undefined ? classifyUnnamedSlot(slotModel, nodeMap) : undefined;
	const reqd = slotModel.unnamedRequired;
	const isMultipleSlot = slotModel.unnamedMultiple;

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
				const bridgeFn = `${rustSnakeIdent(ownerTypeName)}_child_transport_slot_to_any`;
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
				// Children type is Vec<AnyTransport>; pass through as Vec<AnyTransport>.
				return `${expr}.into_iter().collect::<Vec<_>>()`;
			}
			// Per-slot child enum: convert each variant to AnyTransport.
			if (ownerTypeName !== undefined) {
				const bridgeFn = `${rustSnakeIdent(ownerTypeName)}_child_transport_slot_to_any`;
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
		// Vec<T> slot — convert to Vec<AnyTransport> for transport_children.
		// needsWrap: true whenever wrapVec() must transform the expression (i.e., the
		// type is not already the expected Vec<AnyTransport>). All classified slots
		// (concrete, supertype, heterogeneous/useBox, per-slot child enum) need wrapping
		// now that the generated field type is Vec<T>.
		const bridged = wrapVec('transport.children');
		return [`    let children = Some(transport_children(${bridged})?);`];
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

function leafBooleanPresenceLiteral(node: AssembledNode, nodeMap: NodeMap): string | undefined {
	if (node.modelType !== 'keyword' && node.modelType !== 'token') return undefined;
	const literal = node.text;
	if (!literal) return undefined;
	for (const [, owner] of nodeMap.nodes) {
		for (const field of structuralFieldsOf(owner)) {
			if (keywordPresenceValue(field, nodeMap) !== literal) continue;
			if (
				field.values.some(
					(value) => isNodeRef(value) && (isUnresolvedRef(value.node) ? value.node.name : value.node.kind) === node.kind
				)
			) {
				return literal;
			}
		}
	}
	return undefined;
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
	const slotModel = renderSlotModelOf(node);
	return renderTransportDataStruct(rustTransportStructName(node), node, slotModel, nodeMap);
}

function renderPolymorphTransportDefs(
	node: Extract<AssembledNode, { modelType: 'polymorph' }>,
	nodeMap: NodeMap
): string[] {
	const slotModel = renderSlotModelOf(node);
	return renderTransportDataStruct(rustTransportStructName(node), node, slotModel, nodeMap);
}

function renderTransportDataStruct(
	structName: string,
	node: AssembledNode,
	slotModel: RenderSlotModel,
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
			for (const field of slotModel.named) {
				lines.push(...renderTransportField(field, node.typeName, nodeMap));
			}
			if (slotModel.unnamed.length > 0) {
				lines.push('    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]');
				lines.push(`    pub children: ${rustTransportChildrenType(slotModel, node.typeName, nodeMap)},`);
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
		// Tokens are anonymous (named=false); patterns and keywords are named (named=true).
		const leafNamed = node.modelType !== 'token';
		lines.push(
			...renderLeafTransportNapiImpls(
				structName,
				leafNamed,
				leafDefaultTextLiteral(node),
				leafBooleanPresenceLiteral(node, nodeMap)
			)
		);
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
 * @param named - Whether this leaf node is named in tree-sitter. Tokens are always
 *   anonymous (`false`); patterns and keywords are always named (`true`). Used to
 *   hardcode `transport_named` in non-debug mode so the children filter
 *   `.filter(|t| t.transport_named().unwrap_or(true))` works correctly without
 *   needing to read `$named` from the JS object.
 */
function renderLeafTransportNapiImpls(
	structName: string,
	named: boolean,
	defaultTextLiteral?: string,
	booleanLiteral?: string
): string[] {
	const lines: string[] = [];

	// Release mode: read plain JS string — no metadata round-trip.
	// transport_named is hardcoded (not read from JS) because named/anonymous
	// is a grammar-level fact that never changes at runtime.
	lines.push(`#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]`);
	lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${structName} {`);
	lines.push(`    unsafe fn from_napi_value(`);
	lines.push(`        env: ::napi::sys::napi_env,`);
	lines.push(`        napi_val: ::napi::sys::napi_value,`);
	lines.push(`    ) -> ::napi::Result<Self> {`);
	lines.push(`        let text = if let Ok(text) = String::from_napi_value(env, napi_val) {`);
	lines.push(`            text`);
	if (defaultTextLiteral !== undefined) {
		lines.push(`        } else if u16::from_napi_value(env, napi_val).is_ok() {`);
		lines.push(`            ${JSON.stringify(defaultTextLiteral)}.to_string()`);
	}
	if (booleanLiteral !== undefined) {
		lines.push(`        } else if let Ok(present) = bool::from_napi_value(env, napi_val) {`);
		lines.push(`            if !present {`);
		lines.push(
			`                return Err(::napi::Error::from_reason(${JSON.stringify(
				`${structName} received false; omit the field instead of sending false`
			)}));`
		);
		lines.push(`            }`);
		lines.push(`            ${JSON.stringify(booleanLiteral)}.to_string()`);
	}
	lines.push(`        } else {`);
	lines.push(`            let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
	lines.push(
		defaultTextLiteral !== undefined
			? `            obj.get("$text")?.unwrap_or_else(|| ${JSON.stringify(defaultTextLiteral)}.to_string())`
			: `            obj.get("$text")?.unwrap_or_default()`
	);
	lines.push(`        };`);
	lines.push(`        Ok(Self {`);
	for (const f of TRANSPORT_METADATA_FIELDS) {
		if (f.rustName === 'transport_named') {
			lines.push(`            transport_named: Some(${named}),`);
		} else {
			lines.push(`            ${f.rustName}: None,`);
		}
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
	if (booleanLiteral !== undefined) {
		lines.push(`        if let Ok(text) = String::from_napi_value(env, napi_val) {`);
		lines.push(`            return Ok(Self {`);
		for (const f of TRANSPORT_METADATA_FIELDS) {
			if (f.rustName === 'transport_named') {
				lines.push(`                transport_named: Some(${named}),`);
			} else {
				lines.push(`                ${f.rustName}: None,`);
			}
		}
		lines.push(`                text,`);
		lines.push(`            });`);
		lines.push(`        }`);
		lines.push(`        if let Ok(present) = bool::from_napi_value(env, napi_val) {`);
		lines.push(`            if !present {`);
		lines.push(
			`                return Err(::napi::Error::from_reason(${JSON.stringify(
				`${structName} received false; omit the field instead of sending false`
			)}));`
		);
		lines.push(`            }`);
		lines.push(`            return Ok(Self {`);
		for (const f of TRANSPORT_METADATA_FIELDS) {
			if (f.rustName === 'transport_named') {
				lines.push(`                transport_named: Some(${named}),`);
			} else {
				lines.push(`                ${f.rustName}: None,`);
			}
		}
		lines.push(`                text: ${JSON.stringify(booleanLiteral)}.to_string(),`);
		lines.push(`            });`);
		lines.push(`        }`);
	}
	lines.push(`        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
	lines.push(
		defaultTextLiteral !== undefined
			? `        let text: String = obj.get("$text")?.unwrap_or_else(|| ${JSON.stringify(defaultTextLiteral)}.to_string());`
			: '        let text: String = obj.get("$text")?.unwrap_or_default();'
	);
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

function leafDefaultTextLiteral(node: AssembledNode): string | undefined {
	if (node.modelType !== 'keyword' && node.modelType !== 'token') return undefined;
	return node.text || undefined;
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

function renderTransportField(field: AssembledNonterminal, typeName: string, nodeMap: NodeMap): string[] {
	const lines: string[] = [];
	const rustName = rustFieldIdent(field.name);
	// Generator-owned NodeData stores raw fields as `_<name>` top-level keys.
	// Keep the JS/native render boundary dumb by teaching the generated napi
	// structs to read the same storage keys directly.
	lines.push(`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(`_${field.name}`)}))]`);
	lines.push(
		`    pub ${rustName}: ${rustTransportSlotType(
			kindsOf(field),
			nodeMap,
			{ required: isRequired(field), multiple: isMultiple(field), unnamed: false },
			typeName,
			field.name,
			slotLiteralValues(field)
		)},`
	);
	return lines;
}

/**
 * Unified emitter for the Rust type of a transport slot — covers BOTH the
 * named-field path (`renderTransportField` → `pub <field>: T`) and the unnamed
 * children path (the `pub children: T` line in `renderTransportStruct`).
 *
 * Per cleanup-rules §E1 ("no special treatment for unnamed vs named slots"),
 * named heterogeneous fields get the same per-slot typed enum treatment as
 * unnamed `$children` slots (`{TypeName}{FieldName}TransportSlot` vs
 * `{TypeName}ChildTransportSlot`). Single source of truth for the slot-type
 * cardinality matrix:
 *
 *   - `concrete`      → `T` / `Vec<T>` / `Option<T>` / `Option<Vec<T>>`
 *   - `supertype`     → `T` / `Vec<T>` / `Option<T>` / `Option<Vec<T>>`
 *   - `heterogeneous` → per-slot enum (or `Box<AnyTransport>` fallback when
 *     no concrete child kind exists)
 *
 * Subtle cardinality difference preserved during the merge: unnamed `$children`
 * slots historically emit a bare `Vec<T>` even when `required=false` (an "empty"
 * unnamed slot is just an empty Vec, never `None`). Named multi-fields use
 * `Option<Vec<T>>` for optional. The `unnamed` flag preserves this split until
 * the buffer-emit logic (`emitListSlotBuffer`) is also unified.
 *
 * @param slotKinds   - Named child kinds for this slot (terminals excluded; see
 *   `kindsOf`).
 * @param nodeMap     - For classification + concrete transport name lookup.
 * @param cardinality - Slot cardinality. `unnamed: true` forces `Vec<T>` (no
 *   `Option<Vec<T>>`) when `multiple` for the historical unnamed semantics.
 * @param typeName    - Parent node's PascalCase typeName (per-slot enum name
 *   prefix).
 * @param fieldName   - Named-field name (for `{TypeName}{FieldName}TransportSlot`),
 *   or `undefined` for the unnamed `$children` slot
 *   (`{TypeName}ChildTransportSlot`).
 * @param literalTexts - Anonymous literal terminal values appearing in this
 *   slot. A slot with BOTH named kinds AND literal terminals is forced
 *   heterogeneous (mixed-content override) so single-named-kind slots like
 *   `function_modifiers.modifier` don't get misclassified as `concrete`.
 *   Pass `[]` when not applicable (e.g. unnamed `$children`, which lets the
 *   classifier handle literal-vs-named on its own).
 */
function rustTransportSlotType(
	slotKinds: readonly string[],
	nodeMap: NodeMap,
	cardinality: { required: boolean; multiple: boolean; unnamed: boolean },
	typeName: string,
	fieldName: string | undefined,
	literalTexts: readonly string[] = []
): string {
	const { required, multiple, unnamed } = cardinality;
	// Optional multiple wraps in `Option<Vec<T>>` for named fields. Unnamed
	// `$children` historically uses a bare `Vec<T>` for `optional(repeat(...))`;
	// preserved until `emitListSlotBuffer` (line ~1826) handles the optional
	// case for unnamed children too.
	const wrap = (inner: string): string => {
		if (multiple) {
			const vec = `Vec<${inner}>`;
			if (required || unnamed) return vec;
			return `Option<${vec}>`;
		}
		return required ? inner : `Option<${inner}>`;
	};
	// Mixed-content override: a field with named kinds AND anonymous literal
	// content is heterogeneous regardless of classifier (e.g. `function_modifiers.modifier`
	// which accepts `extern_modifier` OR bare keywords like `async`/`const`/`unsafe`).
	// `kindsOf()` intentionally skips TerminalValue entries, so without this
	// check the slot would be misclassified as `concrete`.
	const hasMixedContent = slotKinds.length > 0 && literalTexts.length > 0;
	const cls = hasMixedContent ? ({ tag: 'heterogeneous' } as const) : classifySlotForEmit(slotKinds, nodeMap);
	switch (cls.tag) {
		case 'concrete': {
			const base = concreteTransportTypeName(cls.kind, nodeMap);
			if (base !== null) return wrap(base);
			// Unknown kind — fall back to AnyTransport.
			// Vec<AnyTransport> is safe (Vec provides indirection). Single-value
			// AnyTransport fields need Box<> to break recursive size cycles.
			return wrap(multiple ? 'AnyTransport' : 'Box<AnyTransport>');
		}
		case 'supertype': {
			return wrap(`${rustTypeIdent(cls.supertypeName)}Transport`);
		}
		case 'heterogeneous': {
			// Empty-enum guard: when no kind maps to a concrete transport struct
			// (all are supertypes/polymorphs/multi), per-slot enum collection skips
			// this slot. Fall back to AnyTransport.
			if (!hasAnyConcreteChildKind(slotKinds, nodeMap)) {
				return wrap(multiple ? 'AnyTransport' : 'Box<AnyTransport>');
			}
			return wrap(perSlotEnumName(typeName, fieldName));
		}
		default:
			return assertNever(cls);
	}
}

/**
 * Emit the Rust type for a node's `children` transport field. Thin adapter
 * over `rustTransportSlotType` — wires the unnamed-slot cardinality through
 * the unified slot-type emitter.
 *
 * @param slotModel - Canonical named/unnamed slot model for the node.
 * @param typeName - PascalCase typeName of the parent node (for per-slot enum name).
 * @param nodeMap  - For kind classification.
 */
function rustTransportChildrenType(slotModel: RenderSlotModel, typeName: string, nodeMap: NodeMap): string {
	return rustTransportSlotType(
		slotModel.unnamedKinds,
		nodeMap,
		{
			required: slotModel.unnamedRequired,
			multiple: slotModel.unnamedMultiple,
			unnamed: true
		},
		typeName,
		undefined,
		[]
	);
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
		if (node.modelType === 'supertype' || node.modelType === 'multi') {
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

/**
 * Name for a per-slot children enum for a heterogeneous children slot.
 * Format: `{TypeName}ChildTransportSlot` (e.g., `SuiteChildTransportSlot`)
 * for the unnamed `$children` slot, and `{TypeName}{FieldName}TransportSlot`
 * for named heterogeneous fields. The `TransportSlot` suffix marks the enum
 * as a synthetic codegen wrapper that does NOT correspond to a real
 * tree-sitter kind with a KindId.
 *
 * @param typeName - The parent node's typeName (PascalCase).
 * @param fieldName - Optional named-slot field name (snake_case / lowercase).
 */
function perSlotEnumName(typeName: string, fieldName?: string): string {
	const base = rustTypeIdent(typeName);
	if (fieldName !== undefined) {
		// Named slot: e.g. ModItem.body → `ModItemBodyTransportSlot`.
		// Field names are typically snake_case / lowercase (e.g. `body`, `type_arguments`).
		// PascalCase them so the resulting enum name reads correctly.
		const segments = fieldName.split(/[^A-Za-z0-9]+/).filter((s) => s.length > 0);
		const pascalField = segments
			.map((s) => (s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1)))
			.join('');
		const sanitized = rustTypeIdent(pascalField);
		return `${base}${sanitized}TransportSlot`;
	}
	// Unnamed slot ($children): e.g. Suite → `SuiteChildTransportSlot`.
	return `${base}ChildTransportSlot`;
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
			// Enum-valued fields cross the native boundary as NodeData-shaped objects.
			// Some grammars send the resolved leaf kind in `$type` (primitive_type),
			// while others keep the parent enum kind and expose the chosen literal
			// under `$text` or `_<literal>` child fields (fragment_specifier).
			lines.push(`        if let Ok(kind_id) = u16::from_napi_value(env, napi_val) {`);
			lines.push(`            match kind_id {`);
			for (const v of values) {
				const entry = findKindEntry(kindEntries, v);
				const variant = literalToVariantName(v);
				if (entry !== undefined) {
					lines.push(`                ${entry.id} => return Ok(Self::${variant}), // ${JSON.stringify(v)}`);
				} else {
					lines.push(`                // ${JSON.stringify(v)}: no parser symbol — cannot dispatch by KindId`);
				}
			}
			lines.push(`                _ => {}`);
			lines.push(`            }`);
			lines.push(`        }`);
			lines.push(`        if let Ok(text) = String::from_napi_value(env, napi_val) {`);
			lines.push(`            match text.as_str() {`);
			for (const v of values) {
				lines.push(`                ${JSON.stringify(v)} => return Ok(Self::${literalToVariantName(v)}),`);
			}
			lines.push(`                _ => {}`);
			lines.push(`            }`);
			lines.push(`        }`);
			lines.push(`        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
			lines.push(`        if let Some(kind_id) = obj.get::<u16>("$type")? {`);
			lines.push(`            match kind_id {`);
			for (const v of values) {
				const entry = findKindEntry(kindEntries, v);
				const variant = literalToVariantName(v);
				if (entry !== undefined) {
					lines.push(`                ${entry.id} => return Ok(Self::${variant}), // ${JSON.stringify(v)}`);
				} else {
					lines.push(`                // ${JSON.stringify(v)}: no parser symbol — cannot dispatch by KindId`);
				}
			}
			lines.push(`                _ => {}`);
			lines.push(`            }`);
			lines.push(`        }`);
			lines.push(`        if let Some(text) = obj.get::<String>("$text")? {`);
			lines.push(`            match text.as_str() {`);
			for (const v of values) {
				lines.push(`                ${JSON.stringify(v)} => return Ok(Self::${literalToVariantName(v)}),`);
			}
			lines.push(`                _ => {}`);
			lines.push(`            }`);
			lines.push(`        }`);
			for (const v of values) {
				const variant = literalToVariantName(v);
				lines.push(
					`        if obj.get::<::napi::bindgen_prelude::Object>(${JSON.stringify(`_${v}`)})?.is_some() { return Ok(Self::${variant}); }`
				);
			}
			lines.push(`        Err(::napi::Error::from_reason(${JSON.stringify(`unknown enum payload for ${enumName}`)}))`);
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
