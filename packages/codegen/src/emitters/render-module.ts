/**
 * Rust render-module emitter. Owns codegen output for
 * `rust/crates/sittir-{lang}/src/render/*.rs` and the companion
 * `packages/{lang}/src/hash.ts` that the TS backend shim imports.
 *
 * Spec 012:
 *  - T016 (initial scaffold): hash.rs + hash.ts emission.
 *  - T027/T028/T029: per-kind `#[derive(Template)]` structs + direct
 *    typed-transport render dispatch in
 *    `rust/crates/sittir-{lang}/src/render/templates.rs`.
 *  - T030: canonical `.jinja` copying into
 *    `rust/crates/sittir-{lang}/templates/`.
 *
 * The emitter is pure — given a grammar's template bundle + node map,
 * it returns the string contents of each file it would write. The CLI
 * (T017) owns filesystem I/O and the template-directory copy.
 */

import type { NodeMap } from '../compiler/types.ts';
import { isAsciiIdentifier } from '../util/identifier-shape.ts';
import type {
	AssembledNode,
	RenderTemplateSurface,
	AssembledNonterminal,
	AssembledSupertype
} from '../compiler/model/node-map.ts';
import {
	AssembledBranch,
	AssembledEnum,
	AssembledGroup,
	AssembledSeparatedList,
	deriveUnnamedChildrenCardinality,
	isMultiple,
	isRequired,
	isNodeRef,
	isTerminalValue,
	kindsOf,
	structuralFieldsOf,
	allFormFieldsOf,
	allSlotsOf,
	aliasTargetToSourceMapOf,
	acceptedIdPairsByKindOf,
	storageKindOfRef
} from '../compiler/model/node-map.ts';
import { assertNever } from '../polymorph-variant.ts';
import type { TemplateFile } from './template-hash.ts';
import { computeTemplateBundleHash } from './template-hash.ts';
import { renderModuleSrcDir, renderModuleTemplatesDir } from './render-module-paths.ts';
import { type TransportLiteral } from './transport-projection.ts';
import { getTransportProjection } from './transport-projection-cache.ts';
import {
	acceptedTransportKinds,
	buildSupertypeTransportSet,
	classifySlot,
	type SlotClass
} from './transport-common.ts';
import {
	keywordPresenceValue,
	slotLiteralValues,
	isSlotBearingCompound,
	classifyBranchSlots,
	classifyPrimitiveField,
	type PrimitiveFieldStorage,
	wordCharAsciiTable
} from './shared.ts';
import type { EmittedTemplates } from './templates.ts';
import {
	collectKindEntries,
	collectCatalogKinds,
	findKindEntry,
	findKindEntryForLiteral,
	hasCatalogEntry,
	kindIdMemberName,
	type KindEnumEntry
} from './kind-discriminant.ts';
import { toScreamingSnakeCase } from './kind-id-rust.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import type { CodegenEmitter } from './emitter.ts';
import { collectSeparatorCandidateKindNames } from './wrap.ts';
import type { Rule } from '../types/rule.ts';

export type Grammar = 'rust' | 'typescript' | 'python';
const SUPPORTED_GRAMMARS = ['rust', 'typescript', 'python'] as const;

export function isRenderModuleGrammar(grammar: string): grammar is Grammar {
	return (SUPPORTED_GRAMMARS as readonly string[]).includes(grammar);
}

export interface RustRenderModuleEmit {
	hashRs: { path: string; contents: string };
	hashTs: { path: string; contents: string };
	templatesRs: { path: string; contents: string };
	transportRs: { path: string; contents: string };
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

interface SynthesizeRenderModuleBundleConfig {
	grammar: Grammar;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
	templates: EmittedTemplates;
}

function synthesizeRenderModuleBundle(config: SynthesizeRenderModuleBundleConfig): RenderModuleBundle {
	const { grammar, nodeMap, generatedIdTables, templates } = config;
	const files = templateFilesFromEmittedTemplates(templates);
	return {
		emit: emitRenderModule(grammar, files, nodeMap, generatedIdTables),
		templateCopies: planRenderModuleTemplateCopies(grammar, templates)
	};
}

export class RenderModuleEmitter implements CodegenEmitter<RenderModuleBundle, EmittedTemplates> {
	readonly #grammar: Grammar;
	readonly #nodeMap: NodeMap;
	readonly #generatedIdTables?: GeneratedIdTables;

	constructor(config: RenderModuleEmitterConfig) {
		this.#grammar = config.grammar;
		this.#nodeMap = config.nodeMap;
		this.#generatedIdTables = config.generatedIdTables;
	}

	// No per-node accumulation needed — emitRenderModule reads the full nodeMap.
	emitLeaf(_node: Extract<AssembledNode, { modelType: 'pattern' | 'keyword' | 'enum' }>): void {}

	// TEMPORARY: 'separatedList' widened in alongside 'branch' (no-op body,
	// same as 'branch') — see isSlotBearingCompound's doc comment (shared.ts).
	emitBranch(_node: Extract<AssembledNode, { modelType: 'branch' }> | AssembledSeparatedList): void {}

	emitGroup(_node: Extract<AssembledNode, { modelType: 'group' }>): void {}

	finalize(templates: EmittedTemplates): RenderModuleBundle {
		return synthesizeRenderModuleBundle({
			grammar: this.#grammar,
			nodeMap: this.#nodeMap,
			generatedIdTables: this.#generatedIdTables,
			templates
		});
	}
}

function hashRsHeader(lang: Grammar): string {
	return `// @generated from packages/${lang}/templates/*.jinja — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${lang} --all --output packages/${lang}/src
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
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${lang} --all --output packages/${lang}/src
//
// Companion to ${renderModuleSrcDir(lang)}/hash.rs; the two must
// agree byte-for-byte at runtime for the native backend to be picked
// (FR-020). Mismatch is caught by packages/${lang}/src/backend.ts and
// falls through to the TS engine silently.
`;
}

function generatedHeader(lang: Grammar): string {
	return `// @generated from packages/${lang}/node-model.json5 and packages/${lang}/templates/*.jinja — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${lang} --all --output packages/${lang}/src`;
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

function transportRsHeader(lang: Grammar): string {
	return `${generatedHeader(lang)}
//
// AnyTransport enum + FromNapiValue impls + per-kind transport structs +
// typed dispatch (render_transport_dispatch) + transport bridge helpers.`;
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

const RESERVED_SUPERTYPE_ENUM_NAMES = new Set(['LiteralTransport']);

const RESERVED_TRANSPORT_STRUCT_NAMES = new Set([
	'AnyTransport',
	'VerbatimTransport',
	'ProtectedTransport',
	'LiteralTransport'
]);

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
	readonly parseNames: ReadonlyMap<string, string>;
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
		readonly parseNames: Map<string, string>;
	} = {
		variantKindByName: new Map(),
		emittedKinds: new Set(),
		suppressedKinds: new Set(),
		subtypes: [],
		parseNames: new Map()
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
			suppressedKinds: [...state.suppressedKinds],
			parseNames: state.parseNames
		};
	}
	seen.add(supertypeNode.kind);
	for (const [storage, parse] of Object.entries(supertypeNode.subtypeParseNames ?? {})) {
		if (!state.parseNames.has(storage)) state.parseNames.set(storage, parse);
	}
	for (const subKind of supertypeNode.subtypes) {
		const subNode = nodeMap.nodes.get(subKind);
		if (subNode === undefined) continue;
		if (isReservedSupertypeTransportNode(subNode)) {
			state.suppressedKinds.add(subKind);
			collectEffectiveSupertypeTransportShape(subNode, nodeMap, seen, state);
			continue;
		}
		appendSubtype(subKind, subNode);
	}
	return {
		subtypes: state.subtypes,
		suppressedKinds: [...state.suppressedKinds],
		parseNames: state.parseNames
	};
}

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
	hasTransportField: boolean;
	storageName: string;
	isUnnamed: boolean;
	hasLeading: boolean;
	hasTrailing: boolean;
	separator?: string;
	backingTransportField?: string;
	backingInnerRequired?: boolean;
	backingDirectField?: string;
}

interface EmittedStruct {
	name: string;
	kind: string;
	fields: EmittedField[];
	hasChildren: boolean;
	transportHasChildren: boolean;
	childrenRequired: boolean;
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

function mergeRenderSlots(slots: readonly AssembledNonterminal[]): AssembledNonterminal | undefined {
	const [first, ...rest] = slots;
	if (!first) return undefined;
	return rest.reduce<AssembledNonterminal>(
		(merged, slot) =>
			merged.with({
				values: [...merged.values, ...slot.values],
				hasTrailing: merged.hasTrailing || slot.hasTrailing,
				hasLeading: merged.hasLeading || slot.hasLeading
			}),
		first.with({ values: [...first.values] })
	);
}

function renderSlotAuditVariantsOf(
	node: Extract<AssembledNode, { modelType: 'branch' | 'group' | 'separatedList' }>
): readonly (readonly AssembledNonterminal[])[] {
	return [Object.values(node.slots)];
}

function renderSlotAuditKey(slot: AssembledNonterminal): string {
	// Symmetric per-slot storage key (cleanup-rules §E1). Both named and unnamed
	// slots use the `_<storageName>` form — the storage key the JS factory writes.
	return `_${slot.storageName}`;
}

function renderSlotModelOf(node: AssembledNode | undefined): RenderSlotModel {
	if (node === undefined || !isSlotBearingCompound(node)) {
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
	const named = slots.filter((slot) => !slot.isUnnamed);
	const unnamed = slots.filter((slot) => slot.isUnnamed);
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
		const children = variant.filter((slot) => slot.isUnnamed);
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

function emitStruct(
	kind: string,
	node: AssembledNode | undefined,
	surface: RenderTemplateSurface,
	nodeMap?: NodeMap
): EmittedStruct {
	const name = structNameFor(kind, node);
	const slotModel = renderSlotModelOf(node);
	// Build name→multiple and name→required lookups from the assembled node's
	// slots so the typed dispatch emitter generates code consistent with what
	// the transport struct emits (Vec<...> vs Option<Vec<...>>,
	// Box<...> vs Option<Box<...>>). Named and unnamed slots are symmetric
	// (cleanup-rules §E1) — both contribute transport fields.
	const multipleByName = new Map<string, boolean>();
	const requiredByName = new Map<string, boolean>();
	const storageByName = new Map<string, string>();
	// Per-slot separator: read from the slot's own NodeRef/TerminalValue
	// metadata (stamped at evaluate / wrapper-deletion time). The separator
	// is a property of the value, not the node, so each list-multiplicity
	// slot's emission gets its own — no node-wide fallback that would mask
	// distinct per-slot separators behind a single first-match.
	const separatorByName = new Map<string, string>();
	const unnamedNames = new Set<string>();
	if (node) {
		for (const f of [...slotModel.named, ...slotModel.unnamed]) {
			const mul = isMultiple(f);
			const req = isRequired(f);
			multipleByName.set(f.name, mul);
			requiredByName.set(f.name, req);
			storageByName.set(f.name, f.storageName);
			for (const v of f.values) {
				if (v.separator) {
					separatorByName.set(f.name, v.separator);
					break;
				}
			}
			// Template walker emits one template var per kind referenced by an
			// unnamed slot (e.g. a slot with kinds [escape_sequence, string_content]
			// surfaces both names in the template). Register every kind as an
			// alias that points back to the slot's single storage so the template
			// variables all bind to the same transport field. Skip aliases that
			// collide with another slot's own name — declared fields take
			// precedence. Only register aliases for unnamed MULTIPLE slots:
			// single-value slots store one transport-shaped value that cannot
			// be re-routed through a kind-named template variable, and the
			// template-walker's "kind as variable" pattern only applies to the
			// list-style `{{ kind | join(...) }}` emission.
			if (f.isUnnamed && mul) {
				for (const k of kindsOf(f)) {
					const alias = k.replace(/^_+/, '');
					if (alias === f.name) continue;
					if (storageByName.has(alias)) continue;
					multipleByName.set(alias, mul);
					requiredByName.set(alias, req);
					storageByName.set(alias, f.storageName);
				}
			}
		}
		for (const f of slotModel.unnamed) {
			unnamedNames.add(f.name);
			if (f.isUnnamed && isMultiple(f)) {
				for (const k of kindsOf(f)) {
					const alias = k.replace(/^_+/, '');
					if (alias === f.name) continue;
					// Only mark as unnamed-alias when the alias resolves to this
					// unnamed slot — see storageByName guard above.
					if (storageByName.get(alias) === f.storageName) {
						unnamedNames.add(alias);
					}
				}
			}
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
		hasTransportField: requiredByName.has(slot.name) || multipleByName.has(slot.name),
		storageName: storageByName.get(slot.name) ?? slot.name,
		isUnnamed: unnamedNames.has(slot.name),
		separator: separatorByName.get(slot.name)
	}));
	fields.sort((a, b) => a.name.localeCompare(b.name));
	// Resolve group-lift backing transport fields for surface slots that have
	// no direct transport field but are produced by inlining a hidden group-lift
	// helper (e.g. `_const_item_optional1`). The template emitter inlined the
	// helper and surfaced its inner field (e.g. `value`) directly — but the
	// transport struct still carries the helper as a struct field under
	// `const_item_optional1`. Detect this by looking for unnamed assembled slots
	// whose helper node (`_<slotName>`) has a slot matching the surface slot name.
	if (nodeMap !== undefined) {
		for (const f of fields) {
			if (f.hasTransportField || f.required || f.multiple) continue;
			// Look for a helper backing this optional surface slot.
			for (const helperSlot of slotModel.unnamed) {
				// Helper nodes are hidden (leading `_`); the slot name has the `_` stripped.
				const helperNodeName = `_${helperSlot.name}`;
				const helperNode = nodeMap.nodes.get(helperNodeName);
				if (helperNode === undefined) continue;
				// Check if the helper node exposes the surface slot name.
				const helperSlots = allSlotsOf(helperNode);
				const innerSlot = helperSlots.find((s) => s.name === f.name);
				if (innerSlot !== undefined) {
					f.backingTransportField = helperSlot.storageName;
					// Record whether the inner field is required (non-Option) or
					// itself optional (Option<T>). Required inner fields can be
					// referenced directly as `Renderable::Transport(&v.<name>)`;
					// optional inner fields need a nested match to flatten the Option.
					f.backingInnerRequired = isRequired(innerSlot);
					// The CST reader (native side) exposes the inner field directly
					// at the parent level (e.g. `_value` on const_item, not wrapped
					// inside `_const_item_optional1`). Record the inner storageName
					// so the struct emitter can add a direct fallback field AND the
					// render fn can try it first (before the helper path).
					f.backingDirectField = innerSlot.storageName;
					break;
				}
			}
		}
	}
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
		usesChildren: (surface?.usesChildren ?? false) || /\bchildren\b/.test(body),
		usesVariant: (surface?.usesVariant ?? false) || /\bvariant\b/.test(body),
		usesText: (surface?.usesText ?? false) || /\btext\b/.test(body)
	};
}

function buildSlotModelSurface(node: AssembledNode | undefined): RenderTemplateSurface {
	const slotModel = renderSlotModelOf(node);
	const slots = slotModel.named.map((slot) => ({
		name: slot.name,
		view: (isMultiple(slot) ? 'field' : 'scalar') as 'scalar' | 'list' | 'field',
		required: isRequired(slot),
		hasLeading: slot.hasLeading,
		hasTrailing: slot.hasTrailing
	}));
	return {
		slots,
		usesChildren: false,
		usesVariant: false,
		usesText: false
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

function slotFieldType(f: EmittedField): string {
	// list view OR field-view-with-multiple → always-list (original cases).
	// Also treat any multiple-backed field as list: transport type Vec<X> or
	// Option<Vec<X>> doesn't implement AsRef<dyn RenderableTransport>, so
	// it must be emitted as ListNonterminalView populated from the *_buf slice.
	if (f.view === 'list' || f.multiple) {
		return `ListNonterminalView<'a>`;
	}
	// scalar OR field-view-single, non-multiple
	if (f.required) return `SingleNonterminalView<'a>`;
	return `OptionalNonterminalView<'a>`;
}

function childrenFieldType(s: Pick<EmittedStruct, 'childrenRequired' | 'childrenMultiple'>): string {
	if (s.childrenMultiple) return `ListNonterminalView<'a>`;
	return s.childrenRequired ? `SingleNonterminalView<'a>` : `OptionalNonterminalView<'a>`;
}

// ----------------------------------------------------------------------
// Direct-render metadata collection
// ----------------------------------------------------------------------

interface MetaData {
	separators: Map<string, string>; // kind → separator (fallback for inferred slots)
}

function collectMetaData(nodeMap: NodeMap): MetaData {
	const separators = new Map<string, string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (!node.userFacing) continue;
		// Separator — scan slot values for stamped separators (set by
		// deriveSlotsRawFromLeafAttr via stampSeparatorOnValues for named
		// field slots). Falls back to node.separator (AssembledBranch /
		// AssembledSeparatedList simplified-rule-or-raw-rule separator) for
		// container-shaped nodes whose separator lives on the rule rather
		// than slot values.
		//
		// TEMPORARY (separator-as-slot Task 2 follow-up — see
		// isSlotBearingCompound's doc comment, emitters/shared.ts):
		// AssembledSeparatedList widened in alongside AssembledBranch/
		// AssembledGroup so this scan (and its fallback) doesn't silently
		// skip 'separatedList' nodes. AssembledBranch.separator is
		// permanently dead (0/468 branches ever had a REPEAT-shaped
		// simplifiedRule — wrapper-deletion always converts it to a leaf
		// attribute first) but AssembledSeparatedList.separator is NOT dead:
		// its `rule` is always the raw REPEAT/REPEAT1 rule by construction,
		// so the fallback is live for it even though it's a no-op for branch.
		if (node instanceof AssembledBranch || node instanceof AssembledGroup || node instanceof AssembledSeparatedList) {
			let sep: string | undefined;
			// 1. Check field slot values for a stamped separator.
			const allSlots = node.fields;
			outer: for (const slot of allSlots) {
				for (const v of slot.values) {
					if ((v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray') && v.separator) {
						sep = v.separator;
						break outer;
					}
				}
			}
			// 2. Fall back to AssembledBranch/AssembledSeparatedList.separator
			//    (from simplified rule / raw rule) for list-container nodes
			//    where the separator lives on the top-level repeat and
			//    children are inferred/positional (no deriveSlotsRawFromLeafAttr
			//    path).
			if (sep === undefined && (node instanceof AssembledBranch || node instanceof AssembledSeparatedList)) {
				sep = node.separator ?? undefined;
			}
			if (sep !== undefined) separators.set(kind, sep);
		}
	}
	return { separators };
}

// ----------------------------------------------------------------------
// Slot classification — single source for slot type width
// ----------------------------------------------------------------------

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

function renderTypedDispatch(
	structs: EmittedStruct[],
	nodes: readonly AssembledNode[],
	literals: readonly TransportLiteral[],
	meta: MetaData,
	nodeMap: NodeMap,
	usedSupertypeNames: ReadonlySet<string> = new Set(),
	kindIdByKind: ReadonlyMap<string, number> | undefined = undefined
): string[] {
	const structsByKind = new Map(structs.map((s) => [s.kind, s]));
	const lines: string[] = [];

	// ---- per-kind fns ----------------------------------------------------
	for (const node of nodes) {
		lines.push(...renderTypedKindFn(node, structsByKind, meta, nodeMap, kindIdByKind));
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
	// Per-grammar word class, derived at emit time from the Link-pinned
	// wordMatcher (SpacingWriter spec: no new configuration). ASCII table
	// via the pair test in wordCharAsciiTable; >=0x80 falls back to
	// Unicode alphanumerics.
	const wordTable = wordCharAsciiTable(nodeMap.wordMatcher ?? /\w/);
	lines.push(`/// Word-class table derived from this grammar's Link-pinned word pattern.`);
	lines.push(
		`static GRAMMAR_WORD_MATCHER: ::sittir_core::spacing::WordMatcher = ::sittir_core::spacing::WordMatcher::new(`
	);
	lines.push(`    [${wordTable.map((b) => (b ? 'true' : 'false')).join(', ')}],`);
	lines.push(`    char::is_alphanumeric,`);
	lines.push(`);`);
	lines.push('');
	lines.push(`pub fn render_transport_dispatch(transport: &AnyTransport) -> Result<String, ::askama::Error> {`);
	lines.push(`    let mut s = String::new();`);
	lines.push(`    // SpacingWriter (2026-07-24 spec): root-level wrap — inserts a space`);
	lines.push(`    // only where a word-class char would collide with a word-class char`);
	lines.push(`    // across write seams, per this grammar's own word class. Wrap ONCE`);
	lines.push(`    // here — never per level.`);
	lines.push(`    let mut w = ::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER);`);
	lines.push(`    transport.render_into(&mut w)?;`);
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
	// Verbatim variant — text carried verbatim from a bare-string input.
	lines.push(`            AnyTransport::Verbatim(t) => dest.write_str(&t.text).map_err(::askama::Error::from),`);
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
		if (node instanceof AssembledEnum) continue;
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

function renderTypedKindFn(
	node: AssembledNode,
	structsByKind: Map<string, EmittedStruct>,
	meta: MetaData,
	nodeMap: NodeMap,
	kindIdByKind: ReadonlyMap<string, number> | undefined = undefined
): string[] {
	switch (node.modelType) {
		case 'branch':
		case 'group':
		// TEMPORARY: 'separatedList' shares 'branch'/'group's typed-render
		// path — see isSlotBearingCompound's doc comment (shared.ts).
		case 'separatedList': {
			const struct = structsByKind.get(node.kind);
			if (struct === undefined) {
				// No template for this kind — fall back to joining children/text.
				return renderTypedBranchFallbackFn(node, nodeMap);
			}
			return renderTypedBranchFn(node, struct, meta, nodeMap, kindIdByKind);
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

function renderTypedBranchFallbackFn(node: AssembledNode, nodeMap: NodeMap): string[] {
	const fnName = rustTypedRenderFnName(node.typeName);
	const structName = rustTransportStructName(node);
	const slotModel = renderSlotModelOf(node);
	const allSlots = [...slotModel.named, ...slotModel.unnamed];
	const lines: string[] = [];
	lines.push(`fn ${fnName}(node: &${structName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
	if (allSlots.length === 0) {
		lines.push(`    dest.write_str(node.transport_text.as_deref().unwrap_or_default()).map_err(::askama::Error::from)`);
	} else {
		// No template — render each slot in declaration order.
		for (const slot of allSlots) {
			const slotIdent = rustFieldIdent(slot.storageName);
			const slotKinds = kindsOf(slot);
			const slotLits = slotLiteralValues(slot);
			const hasMixedContent = slotKinds.length > 0 && slotLits.length > 0;
			const baseCls = hasMixedContent ? ({ tag: 'heterogeneous' } as const) : classifySlotForEmit(slotKinds, nodeMap);
			const slotCls: SlotClass =
				baseCls.tag === 'heterogeneous'
					? { tag: 'heterogeneous', useBox: !hasAnyConcreteChildKind(slotKinds, nodeMap) }
					: baseCls;
			const writeChild = buildSlotWriteCall(slotCls, 'child');
			if (isMultiple(slot)) {
				if (isRequired(slot)) {
					lines.push(`    for child in node.${slotIdent}.iter() {`);
				} else {
					lines.push(`    if let Some(items) = &node.${slotIdent} {`);
					lines.push(`        for child in items.iter() {`);
				}
				lines.push(`        ${writeChild}`);
				if (!isRequired(slot)) {
					lines.push(`        }`);
				}
				lines.push(`    }`);
			} else if (isRequired(slot)) {
				const singleExpr = slotCls.tag === 'heterogeneous' ? `node.${slotIdent}` : `&node.${slotIdent}`;
				const writeSingle = buildSlotWriteCall(slotCls, singleExpr);
				lines.push(`    ${writeSingle}`);
			} else {
				lines.push(`    if let Some(child) = &node.${slotIdent} {`);
				lines.push(`        ${writeChild}`);
				lines.push(`    }`);
			}
		}
		lines.push(`    Ok(())`);
	}
	lines.push(`}`);
	lines.push('');
	return lines;
}

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

function buildFieldKindsByName(fields: readonly AssembledNonterminal[]): ReadonlyMap<string, readonly string[]> {
	const map = new Map<string, readonly string[]>();
	for (const f of fields) {
		map.set(f.name, kindsOf(f));
	}
	return map;
}

function buildFieldMixedByName(fields: readonly AssembledNonterminal[]): ReadonlySet<string> {
	const set = new Set<string>();
	for (const f of fields) {
		if (kindsOf(f).length > 0 && slotLiteralValues(f).length > 0) {
			set.add(f.name);
		}
	}
	return set;
}

function renderTypedBranchFn(
	node: AssembledNode,
	struct: EmittedStruct,
	meta: MetaData,
	nodeMap: NodeMap,
	kindIdByKind: ReadonlyMap<string, number> | undefined = undefined
): string[] {
	const lines: string[] = [];
	const fnName = rustTypedRenderFnName(node.typeName);
	const structName = rustTransportStructName(node);
	// Node-wide fallback separator — used for list slots whose values don't
	// carry per-slot separator stamps (inferred/positional slots).
	const nodeSeparator = meta.separators.get(node.kind) ?? '';
	const slotModel = renderSlotModelOf(node);

	// Build per-field kind maps for typed render call selection — named and
	// unnamed slots are symmetric (cleanup-rules §E1).
	const allSlots = [...slotModel.named, ...slotModel.unnamed];
	const fieldKindsByName = buildFieldKindsByName(allSlots);
	const fieldMixedByName = buildFieldMixedByName(allSlots);

	lines.push(`fn ${fnName}(node: &${structName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
	lines.push(
		...buildTypedTemplateBody(
			struct,
			nodeSeparator,
			fieldKindsByName,
			fieldMixedByName,
			nodeMap,
			slotModel,
			node,
			kindIdByKind
		)
	);
	lines.push(`}`);
	lines.push('');

	return lines;
}

const RENDERABLE_PREFIX = '::sittir_core::filters::';

function emitIterCollectBuffer(ident: string, sourceExpr: string, mapBody: string, filterAnon = false): string[] {
	const R = RENDERABLE_PREFIX;
	const lines: string[] = [`    let ${ident}_buf: Vec<${R}Renderable<'_>> = ${sourceExpr}.iter()`];
	if (filterAnon) {
		lines.push(`        .filter(|t| t.transport_named().unwrap_or(true))`);
	}
	lines.push(`        .map(|t| ${mapBody})`, `        .collect();`);
	return lines;
}

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

function buildSeparatorKindMatchLines(
	separatorRule: Rule<'link'>,
	fallbackSeparator: string,
	kindIdByKind: ReadonlyMap<string, number> | undefined
): string[] | undefined {
	if (kindIdByKind === undefined) return undefined;
	const arms: string[] = [];
	for (const name of collectSeparatorCandidateKindNames(separatorRule)) {
		const id = kindIdByKind.get(name);
		if (id === undefined) continue;
		arms.push(`Some(${id}) => ${JSON.stringify(name)},`);
	}
	if (arms.length === 0) return undefined;
	return [
		`separator: match node.separator_kind {`,
		...arms.map((arm) => `    ${arm}`),
		`    _ => ${fallbackSeparator},`,
		`},`
	];
}

function buildTypedTemplateBody(
	struct: EmittedStruct,
	separator: string,
	fieldKindsByName: ReadonlyMap<string, readonly string[]> = new Map(),
	fieldMixedByName: ReadonlySet<string> = new Set(),
	nodeMap: NodeMap | undefined = undefined,
	slotModel: RenderSlotModel | undefined = undefined,
	node: AssembledNode | undefined = undefined,
	kindIdByKind: ReadonlyMap<string, number> | undefined = undefined
): string[] {
	const lines: string[] = [];
	const templateName = struct.name;
	const sepLiteral = JSON.stringify(separator);
	const R = RENDERABLE_PREFIX;

	// `'boolean'`/`'verbatim'`-classified fields (see `classifyPrimitiveField`
	// docstring) get a `bool`/`String` transport struct field
	// (`renderTransportField`), not a per-slot enum or `AnyTransport`.
	// Precompute once so both the `$text` fast-path "checkable" predicate
	// below and the main template-struct loop agree with what the struct
	// actually declares.
	const primitiveByName = new Map<string, PrimitiveFieldStorage>();
	if (nodeMap !== undefined && slotModel !== undefined) {
		for (const f of [...slotModel.named, ...slotModel.unnamed]) {
			const cls = classifyPrimitiveField(f, nodeMap);
			if (cls !== undefined) primitiveByName.set(f.name, cls);
		}
	}

	// `$text` fast-path — match JS render's `nodeHasStructure` short-circuit.
	// Shallow validator reads only `$type` + `$text` for nested nodes. With
	// per-slot Option<...> fields, those nodes deserialize successfully (no
	// throw) but every slot is `None`, so the template renders empty content.
	// JS render handles this by short-circuiting to `node.$text` when no slot
	// has data; mirror that here so native render produces matching bytes.
	//
	// Only emit when every slot is "checkable" — Option<T>, Option<Vec<T>>,
	// or Vec<T>. A required non-Optional non-Vec slot is always present, so
	// the structure check would always be `false` and the fast-path is dead
	// code; skip emission in that case.
	if (slotModel !== undefined) {
		const allSlots = [...slotModel.named, ...slotModel.unnamed];
		const allCheckable = allSlots.every((slot) => {
			if (isMultiple(slot)) return true; // Vec<T> or Option<Vec<T>> — both checkable.
			// `Option<bool>` (boolean-collapsed terminal-only field) is checkable
			// via `unwrap_or(false)` negation, same presence semantics as
			// `Option<T>::is_none()`.
			if (primitiveByName.get(slot.name)?.kind === 'boolean') return true;
			return !isRequired(slot); // Option<T> is checkable; required T is not.
		});
		if (allCheckable && allSlots.length > 0) {
			const seenStorage = new Set<string>();
			const checks: string[] = [];
			for (const slot of allSlots) {
				if (seenStorage.has(slot.storageName)) continue;
				seenStorage.add(slot.storageName);
				const rIdent = rustFieldIdent(slot.storageName);
				if (primitiveByName.get(slot.name)?.kind === 'boolean') {
					// `Option<bool>` field — `None` and `Some(false)` both mean absent.
					checks.push(`!node.${rIdent}.unwrap_or(false)`);
				} else if (isMultiple(slot) && isRequired(slot)) {
					// Vec<T> — empty when length 0.
					checks.push(`node.${rIdent}.is_empty()`);
				} else if (isMultiple(slot)) {
					// Option<Vec<T>>
					checks.push(`node.${rIdent}.as_deref().is_none_or(<[_]>::is_empty)`);
				} else {
					// Option<T>
					checks.push(`node.${rIdent}.is_none()`);
				}
			}
			if (checks.length > 0) {
				lines.push(`    if ${checks.join(' && ')} {`);
				lines.push(`        if let Some(text) = node.transport_text.as_deref() {`);
				lines.push(`            return dest.write_str(text).map_err(::askama::Error::from);`);
				lines.push(`        }`);
				lines.push(`    }`);
			}
		}
	}

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

	// Emit per-slot list buffers. Named and unnamed slots flow through one path
	// (cleanup-rules §E1 — no special-case for `children`).
	//
	// Deduplicate by `storageName`: when an unnamed slot's projection covers
	// multiple kinds, the template walker surfaces one template variable per
	// kind. emitStruct registers each kind as an alias pointing back to the
	// same storage, so several `EmittedField`s share a `storageName`. The
	// transport struct has exactly one Vec field per storage — emit the
	// `*_buf` once per unique storage to avoid duplicate `let` bindings.
	const emittedBufferIdents = new Set<string>();
	for (const f of struct.fields) {
		if (!f.hasTransportField) continue;
		// Emit a Renderable-slice buffer for every slot that becomes a
		// ListNonterminalView in the template struct — i.e. view='list' OR
		// multiple=true (including the new case where a scalar-view template var
		// is backed by a Vec transport field, e.g. `{{ lifetime }}` → Vec<X>).
		if (f.view !== 'list' && !f.multiple) continue;
		const rIdent = rustFieldIdent(f.storageName);
		if (emittedBufferIdents.has(rIdent)) continue;
		emittedBufferIdents.add(rIdent);
		lines.push(...emitListSlotBuffer(rIdent, f.required));
	}

	// Build template struct — all single-value fields use Renderable::Transport.
	lines.push(`    let template = ${templateName} {`);

	if (struct.hasVariant) {
		// Variant detection on typed transport is a known follow-up; default to "".
		lines.push(`        variant: "",`);
	}

	if (struct.hasText) {
		lines.push(`        text: node.transport_text.as_deref().unwrap_or(""),`);
	}

	for (const f of struct.fields) {
		const rIdent = rustFieldIdent(f.storageName);
		const templateIdent = rustFieldIdent(f.name);
		const primitive = primitiveByName.get(f.name);
		if (primitive?.kind === 'boolean') {
			// `Option<bool>` field — presence (`Some(true)`; `None`/`Some(false)`
			// both mean absent) gates the fixed literal text (the same text
			// `keywordPresenceValue` stamped on the struct-field decision in
			// `renderTransportField`). No transport dispatch needed.
			lines.push(`        ${templateIdent}: if node.${rIdent}.unwrap_or(false) {`);
			lines.push(
				`            OptionalNonterminalView::Present(${R}Renderable::Text(${JSON.stringify(primitive.text)}))`
			);
			lines.push(`        } else {`);
			lines.push(`            OptionalNonterminalView::Missing`);
			lines.push(`        },`);
			continue;
		}
		if (primitive?.kind === 'verbatim') {
			// `String`/`Option<String>` field — wrap sends the raw literal
			// text (no kind_id), never a presence bool — mirrors `f.required`
			// exactly like any other Option<T>/T field.
			if (f.required) {
				lines.push(`        ${templateIdent}: SingleNonterminalView(${R}Renderable::Text(&node.${rIdent})),`);
			} else {
				lines.push(`        ${templateIdent}: match &node.${rIdent} {`);
				lines.push(`            Some(v) => OptionalNonterminalView::Present(${R}Renderable::Text(v)),`);
				lines.push(`            None => OptionalNonterminalView::Missing,`);
				lines.push(`        },`);
			}
			continue;
		}
		const kinds = fieldKindsByName.get(f.name) ?? [];
		const cls = classifyField(f.name, kinds);
		const isBoxed = cls.tag === 'heterogeneous' && cls.useBox !== false;
		if (f.view === 'list' || f.multiple) {
			// Any slot that becomes a ListNonterminalView in the template struct:
			// - view='list' (iterated in template via {% for %} or | join)
			// - multiple=true (any view — transport field is Vec<X> or Option<Vec<X>>)
			// Vec doesn't implement AsRef<dyn RenderableTransport>, so always use
			// the *_buf slice. Empty list when transport-field absent.
			// Separator is per-slot (stamped on slot.values during evaluate /
			// wrapper-deletion); falls back to the node-wide `separator` parameter
			// for slots whose values don't carry one yet (TODO: migrate the
			// fallback away once slot value stamping covers all kinds).
			const items = f.hasTransportField ? `${rIdent}_buf.as_slice()` : '&[]';
			const fieldSepLiteral = f.separator !== undefined ? JSON.stringify(f.separator) : sepLiteral;
			// 'separatedList' kinds carry real per-instance leading/trailing/
			// separator-kind capture (Task 4's wire fields, mirrored onto this
			// struct by renderTransportDataStruct) — resolve them here instead
			// of the `false`/literal every other list-shaped slot still uses.
			// See docs/superpowers/specs/2026-07-12-separator-as-slot-design.md
			// ("Render" section).
			const separatedList = node instanceof AssembledSeparatedList ? node : undefined;
			// Three-way branch on `SeparatorFlankMode`: `'optional'` reads the
			// wire-captured per-instance bool; `'mandatory'` is always present
			// (hardcoded `true`, no per-instance capture exists — see
			// AssembledSeparatedList's `leadingMode`/`trailingMode` doc comment,
			// node-map.ts); `'none'`/`undefined` is always absent (`false`).
			const leadingExpr =
				separatedList?.leadingMode === 'optional'
					? 'node.leading_sep.unwrap_or(false)'
					: separatedList?.leadingMode === 'mandatory'
						? 'true'
						: 'false';
			const trailingExpr =
				separatedList?.trailingMode === 'optional'
					? 'node.trailing_sep.unwrap_or(false)'
					: separatedList?.trailingMode === 'mandatory'
						? 'true'
						: 'false';
			const separatorMatchLines =
				separatedList?.separatorRule !== undefined
					? buildSeparatorKindMatchLines(separatedList.separatorRule, fieldSepLiteral, kindIdByKind)
					: undefined;
			lines.push(`        ${templateIdent}: ListNonterminalView {`);
			lines.push(`            items: ${items},`);
			if (separatorMatchLines !== undefined) {
				lines.push(...separatorMatchLines.map((l) => `            ${l}`));
			} else {
				lines.push(`            separator: ${fieldSepLiteral},`);
			}
			lines.push(`            leading: ${leadingExpr},`);
			lines.push(`            trailing: ${trailingExpr},`);
			lines.push(`        },`);
		} else if (f.required) {
			// Required single-value slot (view='scalar' or view='field', non-list).
			if (!f.hasTransportField) {
				// Virtual presentation slot — no backing transport field.
				lines.push(`        ${templateIdent}: SingleNonterminalView(${R}Renderable::Text("")),`);
			} else if (isBoxed) {
				// Heterogeneous fallback — type is Box<AnyTransport> (no concrete
				// child kind to ground a per-slot enum). Deref through Box.
				lines.push(
					`        ${templateIdent}: SingleNonterminalView(${R}Renderable::Transport(node.${rIdent}.as_ref())),`
				);
			} else {
				// Concrete / supertype / per-slot enum — Rust auto-coerces &T to
				// &dyn RenderableTransport (per-slot enum impls RenderableTransport).
				lines.push(`        ${templateIdent}: SingleNonterminalView(${R}Renderable::Transport(&node.${rIdent})),`);
			}
		} else {
			// Optional single-value slot.
			if (f.backingTransportField) {
				// Group-lift inlining: the template emitter inlined a hidden helper
				// (e.g. `_const_item_optional1`) and exposed its inner field as this
				// surface slot (e.g. `value`). The transport struct carries the helper
				// as `Option<HelperTransport>` under the helper's storage name.
				//
				// The helper template (` = {{ value }}`) is inlined into the PARENT
				// template as `{% if value | isPresent %} = {{ value }}{% endif %}`.
				// The `{{ value }}` slot in the parent MUST resolve to the INNER
				// expression (e.g. `v.value`) — not the whole helper struct. Binding
				// the whole helper struct would double-render the separator literal
				// (` =  = expr` instead of ` = expr`).
				//
				// Two read paths exist:
				//  1. Factory path: the JS factory writes `_const_item_optional1: { _value: ... }`.
				//     The napi object has the helper object nested. Use node.<helper>.<inner>.
				//  2. CST path: the native CST reader writes `_value: "5"` directly at the
				//     parent level (tree-sitter places the field on the parent node, not the helper).
				//     The transport struct has a direct `value` field for this path.
				//
				// When `backingDirectField` is set, the struct has both the helper field AND a
				// direct inner field. Try the direct field first (CST path), fall back to the
				// helper (factory path).
				const backingRIdent = rustFieldIdent(f.backingTransportField);
				if (f.backingDirectField) {
					// Dual-path: try direct field (CST read) then helper (factory).
					const directRIdent = rustFieldIdent(f.backingDirectField);
					if (f.backingInnerRequired) {
						// Direct field is T (not Option): always present when field exists.
						lines.push(`        ${templateIdent}: node.${directRIdent}.as_ref().or_else(|| {`);
						lines.push(`            node.${backingRIdent}.as_ref().map(|h| &h.${templateIdent})`);
						lines.push(`        }).map_or(OptionalNonterminalView::Missing, |v| {`);
						lines.push(`            OptionalNonterminalView::Present(${R}Renderable::Transport(v))`);
						lines.push(`        }),`);
					} else {
						// Direct field is Option<T>; both paths need an Option unwrap.
						lines.push(`        ${templateIdent}: node.${directRIdent}.as_ref().or_else(|| {`);
						lines.push(`            node.${backingRIdent}.as_ref().and_then(|h| h.${templateIdent}.as_ref())`);
						lines.push(`        }).map_or(OptionalNonterminalView::Missing, |inner| {`);
						lines.push(`            OptionalNonterminalView::Present(${R}Renderable::Transport(inner))`);
						lines.push(`        }),`);
					}
				} else if (f.backingInnerRequired) {
					// Inner field is a direct (required) transport — reference directly.
					lines.push(`        ${templateIdent}: match &node.${backingRIdent} {`);
					lines.push(
						`            Some(v) => OptionalNonterminalView::Present(${R}Renderable::Transport(&v.${templateIdent})),`
					);
					lines.push(`            None => OptionalNonterminalView::Missing,`);
					lines.push(`        },`);
				} else {
					// Inner field is itself Option<T> — flatten with a nested match.
					lines.push(`        ${templateIdent}: match &node.${backingRIdent} {`);
					lines.push(`            Some(v) => match &v.${templateIdent} {`);
					lines.push(
						`                Some(inner) => OptionalNonterminalView::Present(${R}Renderable::Transport(inner)),`
					);
					lines.push(`                None => OptionalNonterminalView::Missing,`);
					lines.push(`            },`);
					lines.push(`            None => OptionalNonterminalView::Missing,`);
					lines.push(`        },`);
				}
			} else if (!f.hasTransportField) {
				lines.push(`        ${templateIdent}: OptionalNonterminalView::Missing,`);
			} else if (isBoxed) {
				// Heterogeneous fallback — type is Option<Box<AnyTransport>>.
				lines.push(`        ${templateIdent}: match &node.${rIdent} {`);
				lines.push(`            Some(v) => OptionalNonterminalView::Present(${R}Renderable::Transport(v.as_ref())),`);
				lines.push(`            None => OptionalNonterminalView::Missing,`);
				lines.push(`        },`);
			} else {
				// Concrete / supertype / per-slot enum — Rust auto-coerces &T.
				lines.push(`        ${templateIdent}: match &node.${rIdent} {`);
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
// lib.rs — expose transport render entrypoints
// ----------------------------------------------------------------------

function libRsContents(lang: Grammar): string {
	return `// @generated from packages/${lang}/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${lang} --all --output packages/${lang}/src

pub mod hash;
pub mod kind_ids;
pub mod templates;
pub mod transport;

pub use transport::{render_transport_dispatch, render_transport_parts, AnyTransport};
pub use hash::TEMPLATE_BUNDLE_HASH;
pub use kind_ids::*;
`;
}

// ----------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------

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

export function emitRenderModule(
	lang: Grammar,
	files: readonly TemplateFile[],
	nodeMap: NodeMap,
	generatedIdTables?: GeneratedIdTables
): RustRenderModuleEmit {
	const { hashRs, hashTs } = emitHashFiles(lang, files);
	const structs: EmittedStruct[] = [];
	// Same order the hash function sorts under — deterministic output.
	const sortedFiles = [...files].sort((a, b) => a.filename.localeCompare(b.filename));
	for (const f of sortedFiles) {
		if (!f.filename.endsWith('.jinja')) continue;
		const kind = f.filename.slice(0, -'.jinja'.length);
		const node = nodeMap.nodes.get(kind);
		// Only user-facing nodes get templates emitted (see templates.ts
		// emitJinjaTemplates); if the jinja file exists, the node exists
		// and is userFacing.
		structs.push(emitStruct(kind, node, mergeTemplateSurfaceFromBody(f.content, buildSlotModelSurface(node)), nodeMap));
	}
	const meta = collectMetaData(nodeMap);
	const hasNumericDispatch = generatedIdTables !== undefined;

	// --- templates.rs ---
	// Per-kind Template structs. The `filters` module must live here because
	// Askama resolves custom filters by searching for a sibling `filters`
	// module at the `#[derive(Template)]` site.
	const templatesRs = [
		templatesRsHeader(lang),
		'',
		commonRustUseImports(hasNumericDispatch),
		'use ::askama::Template as _AskamaTemplate;',
		'',
		filtersModule(),
		'',
		renderStructDefs(structs)
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
		transportRs: {
			path: `${renderModuleSrcDir(lang)}/transport.rs`,
			contents: transportRs + '\n'
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
	// Cross-supertype self-alias ids: a mint arm (`alias($._hidden_supertype,
	// $.visible)`) records its storage→parse pair on the REFERENCING
	// supertype's `subtypeParseNames`, but the id must also be accepted by the
	// STORAGE supertype's OWN enum — a delegated decode
	// (`ExpressionTransport` 432-arm → `ExpressionExceptRangeTransport`) hands
	// the same napi value down, so the inner enum sees the alias id too.
	// Collect globally (the pair never lives on the storage supertype itself).
	const selfAliasIdsBySupertype = new Map<string, number[]>();
	if (kindEntries !== undefined) {
		for (const [, node] of nodeMap.nodes) {
			if (node.modelType !== 'supertype') continue;
			for (const [storage, parse] of Object.entries((node as AssembledSupertype).subtypeParseNames ?? {})) {
				if (nodeMap.nodes.get(storage)?.modelType !== 'supertype') continue;
				const parseEntry = findKindEntry(kindEntries, parse);
				const parseId = parseEntry?.parseId ?? parseEntry?.id;
				if (parseId === undefined) continue;
				const ids = selfAliasIdsBySupertype.get(storage);
				if (ids === undefined) selfAliasIdsBySupertype.set(storage, [parseId]);
				else if (!ids.includes(parseId)) ids.push(parseId);
			}
		}
	}
	const supertypeEnumLines: string[] = [];
	for (const [, node] of nodeMap.nodes) {
		if (node.modelType !== 'supertype') continue;
		if (!usedSupertypeNames.has(node.typeName)) continue;
		// Skip supertypes whose enum name is reserved
		// (e.g. `_literal` → `LiteralTransport` is in RESERVED_SUPERTYPE_ENUM_NAMES).
		const enumName = `${rustTypeIdent(node.typeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		supertypeEnumLines.push(
			...emitSupertypeTransportEnum(
				node as AssembledSupertype,
				kidByKind,
				nodeMap,
				kindEntries,
				selfAliasIdsBySupertype.get(node.kind)
			)
		);
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
		emitPerSlotChildEnum(entry, kidByKind, nodeMap, literalVariantByKey, kindEntries)
	);

	return pruneUnreferencedBridges(
		[
			...anyTransportLines,
			'',
			...renderTransportValueTypeHelper(),
			...renderVerbatimTransportStruct(),
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
			// and BEFORE renderTransportEntry() so render_transport can call render_transport_dispatch.
			...renderTypedDispatch(structs, nodes, projection.literals, meta, nodeMap, usedSupertypeNames, kidByKind),
			...renderTransportEntry()
		].join('\n')
	);
}

function pruneUnreferencedBridges(rendered: string): string {
	const lines = rendered.split('\n');
	const out: string[] = [];
	let i = 0;
	while (i < lines.length) {
		const m = lines[i]?.match(/^fn (\w+_transport_to_any)\(/);
		if (m) {
			let j = i + 1;
			while (j < lines.length && lines[j] !== '}') j++;
			const name = m[1]!;
			const all = (rendered.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length;
			const block = lines.slice(i, j + 1).join('\n');
			const inBlock = (block.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length;
			if (all - inBlock === 0) {
				i = j + 1;
				if (lines[i] === '') i++; // swallow the trailing blank line
				continue;
			}
		}
		out.push(lines[i]!);
		i++;
	}
	return out.join('\n');
}

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
	lines.push('    FieldValue, OneOrMany, RenderableTransport, Source, Span, NodeTrivia, TransportTrivia,');
	lines.push('};');
	lines.push('');
	if (hasNumericDispatch) {
		lines.push('#[cfg(feature = "napi-bindings")]');
		lines.push('use ::napi_derive::napi;');
		lines.push('');
	}
	return lines.join('\n');
}

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

function collectUsedSupertypeNames(nodes: readonly AssembledNode[], nodeMap: NodeMap): Set<string> {
	const used = new Set<string>();

	const collectFromSlots = (slots: readonly AssembledNonterminal[]): void => {
		for (const slot of slots) {
			const cls = classifySlotForEmit(kindsOf(slot), nodeMap);
			if (cls.tag === 'supertype') used.add(cls.supertypeName);
		}
	};

	for (const node of nodes) {
		const slotModel = renderSlotModelOf(node);
		collectFromSlots([...slotModel.named, ...slotModel.unnamed]);
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

function enumMemberAcceptedIds(node: AssembledEnum): number[] {
	return [...node.resolvedByText.values()].map((e) => e.id);
}

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
		// Verbatim mirror — string-tag fallback path. Same semantics as the
		// napi-FromNapiValue path; required so per-slot-enum bridge fns can
		// reference AnyTransport::Verbatim(...) without conditional emission.
		'    #[serde(skip)]',
		'    Verbatim(VerbatimTransport),',
		'}'
	];
}

/**
 * Emit a per-supertype transport enum, its `Debug + Clone` body,
 * a custom `FromNapiValue` impl that reads `$type` as u16 and dispatches
 * to the appropriate concrete variant, a stub `ToNapiValue`, and a
 * `<supertype>_transport_to_any` bridge helper (per-slot enum → AnyTransport).
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

function nodeTransportHasRequiredField(node: AssembledNode): boolean {
	// Leaf types use renderLeafTransportNapiImpls — always safe on bare strings.
	if (
		node.modelType === 'pattern' ||
		node.modelType === 'keyword' ||
		node.modelType === 'token' ||
		node.modelType === 'enum'
	) {
		return true;
	}
	// For structural nodes (branch / group / polymorph): safe if any grammar
	// slot is required (non-optional). All-optional nodes are the greedy ones.
	return allFormFieldsOf(node).some((slot) => isRequired(slot));
}

function isLeafLikeNode(n: AssembledNode): boolean {
	return n.modelType === 'pattern' || n.modelType === 'keyword' || n.modelType === 'token' || n.modelType === 'enum';
}

function boxedInEnum(
	variantKind: string,
	enumOwnerKind: string,
	variantNode: AssembledNode,
	nodeMap: NodeMap
): boolean {
	// All transport enum variants are now inline. Box decisions moved to
	// the slot-field level (see `rustTransportSlotType` — singular slots
	// whose admit-set intersects parentKind's SCC get `Box<T>` at the
	// source of the back-edge). This keeps enums uniformly small in stack
	// frames and pushes the heap-indirection cost to the exact field that
	// creates the size cycle, not every variant of the enum.
	void variantKind;
	void enumOwnerKind;
	void variantNode;
	void nodeMap;
	return false;
}

function renderTransportValueTypeHelper(): string[] {
	// Hand-expanded `napi::type_of!` — the macro internally invokes a bare
	// `check_status!`, which would have to be in scope at the expansion site.
	return [
		'#[cfg(feature = "napi-bindings")]',
		'unsafe fn transport_value_type(',
		'    env: ::napi::sys::napi_env,',
		'    napi_val: ::napi::sys::napi_value,',
		') -> ::napi::Result<::napi::ValueType> {',
		'    let mut value_type = 0;',
		'    let status = unsafe { ::napi::sys::napi_typeof(env, napi_val, &mut value_type) };',
		'    if status != ::napi::sys::Status::napi_ok {',
		'        return Err(::napi::Error::new(',
		'            ::napi::Status::from(status),',
		'            "napi_typeof failed".to_owned(),',
		'        ));',
		'    }',
		'    Ok(::napi::ValueType::from(value_type))',
		'}',
		''
	];
}

function emitTransportEnumFromNapiValueBody(
	enumName: string,
	kindIdArms: readonly string[],
	admitsVerbatim: boolean
): string[] {
	const lines: string[] = [];
	lines.push(`        match transport_value_type(env, napi_val)? {`);
	// (a) Raw u16 input: kind_id sent directly (value-less kinds).
	lines.push(`            ::napi::ValueType::Number => {`);
	lines.push(`                match u16::from_napi_value(env, napi_val)? {`);
	for (const arm of kindIdArms) lines.push(`    ${arm}`);
	lines.push(`                }`);
	lines.push(`            }`);
	// (b) Bare string: wrap as Verbatim (only when this enum admits a
	//     pattern variant; bare strings carry no kind tag).
	if (admitsVerbatim) {
		lines.push(`            ::napi::ValueType::String => {`);
		lines.push(`                let text = String::from_napi_value(env, napi_val)?;`);
		lines.push(`                Ok(Self::Verbatim(VerbatimTransport { text }))`);
		lines.push(`            }`);
	}
	// (c) Object with numeric $type: strict kind_id dispatch.
	lines.push(`            ::napi::ValueType::Object => {`);
	lines.push(`                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
	lines.push(`                let kind_id: u16 = obj.get("$type")?.ok_or_else(||`);
	lines.push(
		`                    ::napi::Error::from_reason(${JSON.stringify(`$type property missing in ${enumName}`)})`
	);
	lines.push(`                )?;`);
	lines.push(`                match kind_id {`);
	for (const arm of kindIdArms) lines.push(`    ${arm}`);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(
		`            _ => Err(::napi::Error::from_reason(${JSON.stringify(
			`${enumName}: expected u16 kind_id, string, or object with $type`
		)})),`
	);
	lines.push(`        }`);
	return lines;
}

function emitAliasUnwrapRecurseArm(aliasId: number, enumName: string, errorLabel: string): string[] {
	const arms: string[] = [];
	arms.push(`                ${aliasId} => {`);
	arms.push(`                    if let Ok(obj) = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val) {`);
	arms.push(`                        if let Ok(keys) = ::napi::bindgen_prelude::Object::keys(&obj) {`);
	arms.push(`                            for key in keys {`);
	arms.push(`                                if !key.starts_with('_') {`);
	arms.push(`                                    continue;`);
	arms.push(`                                }`);
	arms.push(
		`                                if let Some(child) = obj.get::<::napi::bindgen_prelude::Unknown>(&key)? {`
	);
	arms.push(`                                    return Self::from_napi_value(env, ::napi::JsValue::raw(&child));`);
	arms.push(`                                }`);
	arms.push(`                            }`);
	arms.push(`                        }`);
	arms.push(`                    }`);
	arms.push(
		`                    Err(::napi::Error::from_reason(${JSON.stringify(
			`${errorLabel} kind id ${aliasId} in ${enumName}: no kind-keyed child slot to unwrap`
		)}))`
	);
	arms.push(`                },`);
	return arms;
}

function emitSupertypeTransportEnum(
	supertypeNode: AssembledSupertype,
	kindIdByKind: ReadonlyMap<string, number> | undefined,
	nodeMap: NodeMap,
	kindEntries?: readonly KindEnumEntry[],
	selfAliasIds?: readonly number[]
): string[] {
	const enumName = `${rustTypeIdent(supertypeNode.typeName)}Transport`;
	const lines: string[] = [];
	const {
		subtypes: validSubtypes,
		suppressedKinds,
		parseNames
	} = collectEffectiveSupertypeTransportShape(supertypeNode, nodeMap);
	const ownerKind = supertypeNode.kind;

	// SCC-driven Box rule. Box only when the variant kind and the
	// supertype's owner kind are in the same SCC of the singular-
	// reference graph (see `boxedInEnum` docstring). Leaf-like
	// variants (pattern / keyword / token / enum) are always inline.
	const isBoxed = (subKind: string, subNode: AssembledNode): boolean =>
		boxedInEnum(subKind, ownerKind, subNode, nodeMap);

	// See `admitsVerbatimCollapse` docstring for the full rationale.
	const admitsVerbatim = admitsVerbatimCollapse(supertypeNode.subtypes, nodeMap);

	const emitDecodeTrials = (leafOnly = false, indent = '                '): string[] => {
		// Self-alias / reserved-supertype kind_id: parser sent the supertype's
		// own kind_id rather than a concrete variant's. We don't know which
		// variant — try each in turn. Pattern/keyword/token/enum leaves have
		// safe FromNapiValue impls; branches/groups are skipped here unless
		// leafOnly=false because their impls can match coerced inputs greedily.
		const out: string[] = [];
		const sortedSubtypes = [...validSubtypes].sort(
			(a, b) => (nodeTransportHasRequiredField(b.subNode) ? 1 : 0) - (nodeTransportHasRequiredField(a.subNode) ? 1 : 0)
		);
		for (const { subKind, subNode } of sortedSubtypes) {
			if (leafOnly && !isLeafLikeNode(subNode)) continue;
			const variant = rustTypeIdent(subNode.typeName);
			const typeName = rustTransportStructName(subNode);
			if (isBoxed(subKind, subNode)) {
				out.push(`${indent}if let Ok(value) = ${typeName}::from_napi_value(env, napi_val) {`);
				out.push(`${indent}    return Ok(Self::${variant}(Box::new(value)));`);
				out.push(`${indent}}`);
			} else {
				out.push(`${indent}if let Ok(value) = ${typeName}::from_napi_value(env, napi_val) {`);
				out.push(`${indent}    return Ok(Self::${variant}(value));`);
				out.push(`${indent}}`);
			}
		}
		return out;
	};

	// Enum declaration — Debug + Clone only; no serde, no napi object derive.
	lines.push(`#[derive(Debug, Clone)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const { subKind, subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		const typeName = rustTransportStructName(subNode);
		const variantType = isBoxed(subKind, subNode) ? `Box<${typeName}>` : typeName;
		lines.push(`    ${variant}(${variantType}),`);
	}
	if (admitsVerbatim) {
		lines.push(`    Verbatim(VerbatimTransport),`);
	}
	lines.push(`}`);
	lines.push(``);

	if (kindIdByKind !== undefined) {
		// Build kind_id match arms shared between the raw-u16 input shape and
		// the object-with-$type input shape. Self-alias and suppressed-supertype
		// kind_ids fall back to emitDecodeTrials (we don't statically know which
		// variant the parser meant).
		const buildKindIdArms = (): string[] => {
			const arms: string[] = [];
			const emittedIds = new Set<number>();
			const selfId = kindIdByKind.get(supertypeNode.kind);
			if (selfId !== undefined) {
				arms.push(`                ${selfId} => {`);
				for (const t of emitDecodeTrials(false, '                    ')) arms.push(t);
				arms.push(
					`                    Err(::napi::Error::from_reason(${JSON.stringify(
						`unknown aliased kind id {kind_id} in ${enumName}`
					)}))`
				);
				arms.push(`                },`);
				emittedIds.add(selfId);
			}
			for (const suppressedKind of suppressedKinds) {
				const id = kindIdByKind.get(suppressedKind);
				if (id === undefined || emittedIds.has(id)) continue;
				arms.push(`                ${id} => {`);
				for (const t of emitDecodeTrials(false, '                    ')) arms.push(t);
				arms.push(
					`                    Err(::napi::Error::from_reason(${JSON.stringify(
						`unknown reserved supertype kind id {kind_id} in ${enumName}`
					)}))`
				);
				arms.push(`                },`);
				emittedIds.add(id);
			}
			// Parse-aliases of THIS supertype itself: a mint arm
			// (`alias($._expression_except_range, $.expression_group1)`) makes
			// the hidden supertype VISIBLE at that position, so runtime nodes
			// arrive under the alias occurrence's own id (`alias_sym_*`). The
			// grammar-agnostic reader stores such a node's single unlabeled
			// child under a kind-keyed slot (`{ $type: <aliasId>,
			// _<childKind>: <child> }` — read_node.rs kind-named-slot routing),
			// so no variant struct can decode the wrapper directly (decode
			// trials would probe the wrong object). Unwrap the kind-keyed slot
			// and re-dispatch Self on the concrete child, which carries its own
			// `$type`.
			for (const aliasId of selfAliasIds ?? []) {
				if (emittedIds.has(aliasId)) continue;
				emittedIds.add(aliasId);
				arms.push(...emitAliasUnwrapRecurseArm(aliasId, enumName, 'self-alias'));
			}
			for (const { subKind, subNode } of validSubtypes) {
				const variant = rustTypeIdent(subNode.typeName);
				const typeName = rustTransportStructName(subNode);
				// Owner-kind / supertype-membership ids stay name-resolved (spec §2.3
				// keep-list); enum member ids are stamped facts (PR-K3b). Aliased arm:
				// `parseNames.get(subKind)` also accepts the parse name's id — the
				// alias occurrence's own runtime symbol (`alias_sym_*`), the id
				// tree-sitter actually emits at that arm's position.
				const acceptedIds = resolveAcceptedTransportIds({
					kind: subKind,
					node: subNode,
					nodeMap,
					kindIdByKind,
					kindEntries,
					parseName: parseNames.get(subKind)
				});
				assertRoutableTransportIds(acceptedIds, subKind, variant, enumName, `under supertype '${ownerKind}'`, kindEntries);
				const boxed = isBoxed(subKind, subNode);
				for (const id of acceptedIds) {
					if (emittedIds.has(id)) continue;
					emittedIds.add(id);
					if (boxed) {
						arms.push(`                ${id} => Ok(Self::${variant}(Box::new(`);
						arms.push(`                    ${typeName}::from_napi_value(env, napi_val)?`);
						arms.push(`                ))),`);
					} else {
						arms.push(`                ${id} => Ok(Self::${variant}(`);
						arms.push(`                    ${typeName}::from_napi_value(env, napi_val)?`);
						arms.push(`                )),`);
					}
				}
			}
			arms.push(`                other => Err(::napi::Error::from_reason(format!(`);
			arms.push(`                    "unknown kind id {other} in ${enumName}",`);
			arms.push(`                ))),`);
			return arms;
		};
		const kindIdArms = buildKindIdArms();

		lines.push(`#[cfg(feature = "napi-bindings")]`);
		lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${enumName} {`);
		lines.push(`    unsafe fn from_napi_value(`);
		lines.push(`        env: ::napi::sys::napi_env,`);
		lines.push(`        napi_val: ::napi::sys::napi_value,`);
		lines.push(`    ) -> ::napi::Result<Self> {`);
		lines.push(...emitTransportEnumFromNapiValueBody(enumName, kindIdArms, admitsVerbatim));
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

	// Box<EnumName> napi-trait impls. Required because `Box-at-back-edge`
	// slot typing in rustTransportSlotType emits `Box<EnumName>` as a struct
	// field type whenever an enum-typed slot closes a singular size cycle.
	lines.push(...renderBoxedEnumNapiImpls(enumName));

	// Bridge helper: converts <Supertype>Transport → AnyTransport for the
	// per-slot→AnyTransport bridges. Each variant
	// wraps the inner concrete transport into the matching AnyTransport variant.
	// AnyTransport is a sized enum — no Box needed.
	lines.push(`fn ${rustSnakeIdent(supertypeNode.typeName)}_transport_to_any(t: ${enumName}) -> AnyTransport {`);
	lines.push(`    match t {`);
	for (const { subKind, subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		const boxed = isBoxed(subKind, subNode);
		if (subNode.modelType === 'supertype') {
			// Sub-supertype: delegate to its own bridge function which expands
			// the sub-supertype enum into the correct concrete AnyTransport variant.
			const subBridgeFn = `${rustSnakeIdent(subNode.typeName)}_transport_to_any`;
			if (boxed) {
				lines.push(`        ${enumName}::${variant}(inner) => ${subBridgeFn}(*inner),`);
			} else {
				lines.push(`        ${enumName}::${variant}(inner) => ${subBridgeFn}(inner),`);
			}
		} else {
			const anyVariant = rustTypeIdent(subNode.typeName);
			if (boxed) {
				lines.push(`        ${enumName}::${variant}(inner) => AnyTransport::${anyVariant}(*inner),`);
			} else {
				lines.push(`        ${enumName}::${variant}(inner) => AnyTransport::${anyVariant}(inner),`);
			}
		}
	}
	if (admitsVerbatim) {
		lines.push(`        ${enumName}::Verbatim(inner) => AnyTransport::Verbatim(inner),`);
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

function emitSupertypeRenderHelper(supertypeNode: AssembledSupertype, nodeMap: NodeMap): string[] {
	const enumName = `${rustTypeIdent(supertypeNode.typeName)}Transport`;
	const fnName = `render_${rustSnakeIdent(supertypeNode.typeName)}`;
	const lines: string[] = [];
	const { subtypes: validSubtypes } = collectEffectiveSupertypeTransportShape(supertypeNode, nodeMap);
	const ownerKind = supertypeNode.kind;

	// See `admitsVerbatimCollapse` docstring for the full rationale.
	const admitsVerbatim = admitsVerbatimCollapse(supertypeNode.subtypes, nodeMap);

	lines.push(`fn ${fnName}(t: &${enumName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
	lines.push(`    match t {`);
	for (const { subKind, subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		const concreteFn = rustTypedRenderFnName(subNode.typeName);
		// Boxed (in-cycle) variants need `.as_ref()` to reach the inner struct;
		// inline variants reference the inner value directly.
		const innerExpr = boxedInEnum(subKind, ownerKind, subNode, nodeMap) ? `inner.as_ref()` : `inner`;
		lines.push(`        ${enumName}::${variant}(inner) => ${concreteFn}(${innerExpr}, dest),`);
	}
	if (admitsVerbatim) {
		lines.push(`        ${enumName}::Verbatim(inner) => dest.write_str(&inner.text).map_err(::askama::Error::from),`);
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

interface AcceptedTransportIdsInput {
	kind: string;
	node: AssembledNode;
	nodeMap: NodeMap;
	kindIdByKind: ReadonlyMap<string, number>;
	kindEntries?: readonly KindEnumEntry[];
	/** Per-reference-site mint stamp (slot values only) — authoritative when present. */
	stampedIds?: readonly number[];
	/** Name-derived alias map for this slot/field (`aliasTargetToSourceMapOf`), used to
	 *  expand `kind`'s alias-site names when no mint stamp is available. */
	parseAliases?: Readonly<Record<string, string>>;
	/** This kind's own alias-occurrence parse name (e.g. supertype `subtypeParseNames`),
	 *  when it's reached only via `alias($.kind, $.parseName)` at this position. */
	parseName?: string;
}

/**
 * Single derivation of "which numeric kind_ids should route to this concrete
 * kind at this reference site" — shared by `emitPerSlotChildEnum` and
 * `emitSupertypeTransportEnum`, which previously reimplemented slightly
 * divergent versions of this chain (one had the mint-stamp fast path and the
 * fixed-literal fallback; the other had parse-alias resolution but neither of
 * those) — the exact kind of drift that let a routable kind silently resolve
 * zero ids in one path and not the other.
 */
function resolveAcceptedTransportIds(input: AcceptedTransportIdsInput): number[] {
	const { kind, node, nodeMap, kindIdByKind, kindEntries, stampedIds, parseAliases, parseName } = input;
	const acceptedIds: number[] =
		stampedIds !== undefined
			? [...stampedIds]
			: [
					...new Set<string>([
						...collectConcreteTransportKinds(kind, nodeMap),
						...acceptedTransportKinds(kind, nodeMap, parseAliases)
					])
				].map((k) => kindIdByKind.get(k)).filter((id): id is number => id !== undefined);
	if (parseName !== undefined && kindEntries !== undefined) {
		const parseEntry = findKindEntry(kindEntries, parseName);
		const parseId = parseEntry?.parseId ?? parseEntry?.id;
		if (parseId !== undefined) acceptedIds.push(parseId);
	}
	if (node instanceof AssembledEnum) {
		acceptedIds.push(...enumMemberAcceptedIds(node));
	}
	// A pattern whose sole realization is a fixed literal (e.g. `_semicolon` =
	// `choice($._automatic_semicolon, ';')` → `';'`) has no catalog row under
	// its own hidden name, so neither the mint stamp nor the name-derived
	// chain above resolves an id for it. Resolve through the same
	// literal-first chain already used for `entry.literals`.
	if (node.modelType === 'pattern' && node.fixedLiteralText !== undefined && kindEntries !== undefined) {
		const literalId = findKindEntryForLiteral(kindEntries, node.fixedLiteralText)?.id;
		if (literalId !== undefined) acceptedIds.push(literalId);
	}
	return acceptedIds;
}

/**
 * A concrete member kind that resolves zero ids would still get a variant in
 * the enum but no match arm ever routes to it — any node of this kind
 * arriving at this position falls through to the generated catch-all
 * `Err("unknown kind id")`, silently, with no compile error and no coverage
 * failure unless the corpus happens to exercise this exact shape. Kinds with
 * no catalog entry at all (VAPORIZED / inline / synthesized — see
 * `warnSkippedParserSymbol`) never had a parser symbol to route by in the
 * first place; that's a separate, already-surfaced condition, not this
 * check's concern.
 */
function assertRoutableTransportIds(
	acceptedIds: readonly number[],
	kind: string,
	variant: string,
	enumName: string,
	context: string,
	kindEntries: readonly KindEnumEntry[] | undefined
): void {
	if (acceptedIds.length > 0 || !hasCatalogEntry(kindEntries, kind)) return;
	throw new Error(
		`${enumName}: storage kind '${kind}' (variant ${variant}) resolved zero kind_ids — ` +
			`neither the mint-stamp chain, the name-derived alias chain, the parse-alias id, ` +
			`enum-member ids, nor the fixed-literal fallback found a routable id for it ${context}`
	);
}

function admitsVerbatimCollapse(kinds: readonly string[], nodeMap: NodeMap): boolean {
	const isHiddenPatternLeaf = (candidateKind: string): boolean =>
		candidateKind.startsWith('_') && nodeMap.nodes.get(candidateKind)?.modelType === 'pattern';
	const kindCollapses = (kind: string): boolean => {
		const node = nodeMap.nodes.get(kind);
		if (node === undefined) return false;
		if (node.modelType === 'pattern') return true;
		if (node.modelType !== 'branch' && node.modelType !== 'group') return false;
		const slotClass = classifyBranchSlots(node, nodeMap);
		if (slotClass.tag !== 'singleSlot' || slotClass.arity !== 'multiple') return false;
		return slotClass.slot.values.some((value) => isNodeRef(value) && isHiddenPatternLeaf(storageKindOfRef(value.node)));
	};
	return kinds.some((kind) => collectConcreteTransportKinds(kind, nodeMap).some(kindCollapses));
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

interface PerSlotChildEnum {
	typeName: string;
	ownerKind: string;
	fieldName: string;
	kinds: readonly string[];
	literals: readonly TransportLiteral[];
	parseAliases: Readonly<Record<string, string>>;
	acceptedIdsByKind: ReadonlyMap<string, readonly number[]>;
}

function hasAnyConcreteChildKind(kinds: readonly string[], nodeMap: NodeMap): boolean {
	return expandConcreteTransportKinds(kinds, nodeMap).length > 0;
}

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

	// Per cleanup-rules §E1: unnamed slots emit per-slot enums symmetric with named.
	// Each unnamed slot (e.g. `_attributed_parameter.parameter`) gets its own enum
	// named `<TypeName><FieldName>TransportSlot` (e.g. `AttributedParameterParameterTransportSlot`)
	// — no special-case "Child" suffix anymore.
	const consider = (typeName: string, ownerKind: string, field: AssembledNonterminal): void => {
		const slotKinds = kindsOf(field);
		const literalSet = new Set<string>();
		const literals: TransportLiteral[] = [];
		// Iterate the terminal values directly (not slotLiteralValues) so the
		// mint-time resolvedKindId stamp rides along (PR-K3a).
		for (const v of field.values) {
			if (!isTerminalValue(v)) continue;
			const text = v.value;
			const key = `${text}\0${text}`;
			if (literalSet.has(key)) continue;
			literalSet.add(key);
			literals.push({ kind: text, text, resolvedKindId: v.resolvedKindId });
		}
		// Mixed-content override: a slot with named kinds AND anonymous literal
		// content is heterogeneous regardless of classifier.
		const hasMixedContent = slotKinds.length > 0 && literals.length > 0;
		const cls = hasMixedContent ? ({ tag: 'heterogeneous' } as const) : classifySlotForEmit(slotKinds, nodeMap);
		if (cls.tag !== 'heterogeneous') return;
		if (!hasAnyConcreteChildKind(slotKinds, nodeMap)) return;
		const enumName = perSlotEnumName(typeName, field.name);
		if (seen.has(enumName)) return;
		if (reservedTransportNames.has(enumName)) return;
		seen.add(enumName);
		const parseAliases = aliasTargetToSourceMapOf(field);
		const acceptedIdsByKind = acceptedIdPairsByKindOf(field);
		entries.push({
			typeName,
			ownerKind,
			fieldName: field.name,
			kinds: slotKinds,
			literals,
			parseAliases,
			acceptedIdsByKind
		});
	};

	for (const node of nodes) {
		const slotModel = renderSlotModelOf(node);
		// Symmetric — named and unnamed slots both flow through `consider`.
		for (const field of [...slotModel.named, ...slotModel.unnamed]) {
			consider(node.typeName, node.kind, field);
		}
	}
	return entries;
}

function emitPerSlotChildEnum(
	entry: PerSlotChildEnum,
	kindIdByKind: ReadonlyMap<string, number> | undefined,
	nodeMap: NodeMap,
	literalVariantByKey: ReadonlyMap<string, string>,
	kindEntries?: readonly KindEnumEntry[]
): string[] {
	const enumName = perSlotEnumName(entry.typeName, entry.fieldName);
	const lines: string[] = [];
	const ownerKind = entry.ownerKind;

	// Expand any supertype child kinds to their concrete transport-bearing kinds,
	// then dedupe so aliased / overlapping paths emit one variant per concrete kind.
	const validKinds = expandConcreteTransportKinds(entry.kinds, nodeMap);

	// SCC-driven Box rule for this per-slot enum's variants. The owner kind
	// is the parent node that hosts the slot; a variant is boxed iff it and
	// the owner share an SCC in the singular-reference graph. Leaf-like
	// variants always stay inline (see `boxedInEnum`).
	const isBoxed = (variantKind: string, variantNode: AssembledNode): boolean =>
		boxedInEnum(variantKind, ownerKind, variantNode, nodeMap);

	// See `admitsVerbatimCollapse` docstring for the full rationale.
	const admitsVerbatim = admitsVerbatimCollapse(entry.kinds, nodeMap);

	// Spec 024 cleanup-§E1: named-slot enums are load-bearing alongside unnamed
	// `$children` enums — `rustTransportSlotType` returns the per-slot enum name
	// for any heterogeneous slot with at least one concrete child kind. No
	// `#[allow(dead_code)]` needed; both the enum and its `_transport_slot_to_any`
	// bridge fn are referenced (struct field type + bridge expression).
	lines.push(`#[derive(Debug, Clone)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const { kind, node, concreteName } of validKinds) {
		const variant = rustTypeIdent(node.typeName);
		const variantType = isBoxed(kind, node) ? `Box<${concreteName}>` : concreteName;
		lines.push(`    ${variant}(${variantType}),`);
	}
	for (const literal of entry.literals) {
		const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
		if (variant !== undefined) {
			lines.push(`    ${variant},`);
		}
	}
	if (admitsVerbatim) {
		lines.push(`    Verbatim(VerbatimTransport),`);
	}
	lines.push(`}`);
	lines.push(``);

	if (kindIdByKind !== undefined) {
		// Build the kind_id match arms shared between the raw-u16 input shape
		// and the object-with-$type input shape. Each accepted kind_id maps
		// to a typed variant — pattern/keyword/token/enum inline, branch/
		// group/polymorph boxed.
		const kindIdArms: string[] = [];
		const emittedIds = new Set<number>();
		for (const { kind, node, concreteName } of validKinds) {
			const variant = rustTypeIdent(node.typeName);
			const typeName = concreteName;
			// PR-K3c: value-backed kinds take their accepted ids straight from
			// the mint stamps (storageKindId + parseKindId subsume both name-
			// keyed alias redirects, per reference site). The name chain remains
			// only for kinds with no value in hand (supertype-expanded arms) or
			// id-less values.
			const acceptedIds = resolveAcceptedTransportIds({
				kind,
				node,
				nodeMap,
				kindIdByKind,
				kindEntries,
				stampedIds: entry.acceptedIdsByKind.get(kind),
				parseAliases: entry.parseAliases
			});
			assertRoutableTransportIds(acceptedIds, kind, variant, enumName, `in ${ownerKind}.${entry.fieldName}`, kindEntries);
			const boxed = isBoxed(kind, node);
			for (const id of acceptedIds) {
				if (emittedIds.has(id)) continue;
				emittedIds.add(id);
				if (boxed) {
					kindIdArms.push(`                ${id} => Ok(Self::${variant}(Box::new(`);
					kindIdArms.push(`                    ${typeName}::from_napi_value(env, napi_val)?`);
					kindIdArms.push(`                ))),`);
				} else {
					kindIdArms.push(`                ${id} => Ok(Self::${variant}(`);
					kindIdArms.push(`                    ${typeName}::from_napi_value(env, napi_val)?`);
					kindIdArms.push(`                )),`);
				}
			}
		}
		for (const literal of entry.literals) {
			// PR-K3a: the mint stamp (resolvedKindId, minted through the same
			// literal-first chain — #129) is authoritative when present. The
			// emit-time chain remains only for stamp-less literals (kind-
			// derived keyword/token texts) and the no-catalog fallback.
			const id =
				literal.resolvedKindId ??
				(kindEntries !== undefined
					? (findKindEntryForLiteral(kindEntries, literal.text) ?? findKindEntry(kindEntries, literal.kind))?.id
					: kindIdByKind.get(literal.kind));
			const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
			if (id === undefined || variant === undefined || emittedIds.has(id)) continue;
			emittedIds.add(id);
			kindIdArms.push(`                ${id} => Ok(Self::${variant}),`);
		}
		// Alias-canonicalized wrapper ids (narrow scope): one of this slot's
		// raw storage kinds (`entry.kinds`, pre-expansion) is a hidden
		// supertype that got flattened into `validKinds` above (per
		// `expandConcreteTransportKinds` — every supertype-modelType kind has
		// `concreteTransportTypeName === null`, so it's never its own
		// variant). When a value at this reference site was ALSO wrapped by
		// an enrich-minted `alias($._hidden_supertype, $.visible_name)` (the
		// `parseAliases` fact — `aliasTargetToSourceMapOf`, node-map.ts), the
		// alias occurrence's own wire id (e.g. python's
		// `_case_pattern_group1` / id 293, wrapping a matched
		// `union_pattern`) has no variant to land on directly — it must
		// unwrap its single kind-keyed child and re-dispatch, same as a
		// supertype's cross-supertype self-alias id. Scoped tightly to
		// exactly this shape (flattened-supertype storage target already
		// covered by this same enum); NOT a general alias-name fallback.
		for (const [parseName, storageKind] of Object.entries(entry.parseAliases)) {
			if (!entry.kinds.includes(storageKind)) continue;
			if (nodeMap.nodes.get(storageKind)?.modelType !== 'supertype') continue;
			const parseEntry = kindEntries !== undefined ? findKindEntry(kindEntries, parseName) : undefined;
			const aliasId = parseEntry?.parseId ?? parseEntry?.id ?? kindIdByKind.get(parseName);
			if (aliasId === undefined || emittedIds.has(aliasId)) continue;
			emittedIds.add(aliasId);
			kindIdArms.push(...emitAliasUnwrapRecurseArm(aliasId, enumName, 'alias-wrapper'));
		}
		kindIdArms.push(`                other => Err(::napi::Error::from_reason(format!(`);
		kindIdArms.push(`                    "unknown kind id {other} in ${enumName}",`);
		kindIdArms.push(`                ))),`);

		lines.push(`#[cfg(feature = "napi-bindings")]`);
		lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${enumName} {`);
		lines.push(`    unsafe fn from_napi_value(`);
		lines.push(`        env: ::napi::sys::napi_env,`);
		lines.push(`        napi_val: ::napi::sys::napi_value,`);
		lines.push(`    ) -> ::napi::Result<Self> {`);
		lines.push(...emitTransportEnumFromNapiValueBody(enumName, kindIdArms, admitsVerbatim));
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

	// Box<EnumName> napi-trait impls. See note on `renderBoxedEnumNapiImpls`.
	lines.push(...renderBoxedEnumNapiImpls(enumName));

	// Bridge helper: converts per-slot enum → AnyTransport for the NodeData
	// bridge (used by the typed render dispatch). AnyTransport
	// is a sized enum — no Box needed. Both named-slot and unnamed `$children`
	// bridge fns are load-bearing after spec 024 §E1 (named field type became the
	// per-slot enum, so the bridge MUST convert via this fn instead of derefing
	// a `Box<AnyTransport>`).
	// Every per-slot enum has a corresponding bridge fn keyed by typeName + slot name.
	const bridgeFnName = `${rustSnakeIdent(entry.typeName)}_${rustSnakeIdent(entry.fieldName)}_transport_slot_to_any`;
	lines.push(`fn ${bridgeFnName}(t: ${enumName}) -> AnyTransport {`);
	lines.push(`    match t {`);
	for (const { kind, node } of validKinds) {
		const variant = rustTypeIdent(node.typeName);
		if (isBoxed(kind, node)) {
			lines.push(`        ${enumName}::${variant}(inner) => AnyTransport::${variant}(*inner),`);
		} else {
			lines.push(`        ${enumName}::${variant}(inner) => AnyTransport::${variant}(inner),`);
		}
	}
	for (const literal of entry.literals) {
		const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
		if (variant !== undefined) {
			lines.push(`        ${enumName}::${variant} => AnyTransport::${variant},`);
		}
	}
	if (admitsVerbatim) {
		lines.push(`        ${enumName}::Verbatim(inner) => AnyTransport::Verbatim(inner),`);
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
	for (const { kind, node } of validKinds) {
		const variant = rustTypeIdent(node.typeName);
		const concreteFn = rustTypedRenderFnName(node.typeName);
		const innerExpr = isBoxed(kind, node) ? 'inner.as_ref()' : 'inner';
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
	if (admitsVerbatim) {
		lines.push(
			`            ${enumName}::Verbatim(inner) => dest.write_str(&inner.text).map_err(::askama::Error::from),`
		);
	}
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	return lines;
}

function renderAnyTransportWithNapiFromValue(
	nodes: readonly AssembledNode[],
	literals: readonly TransportLiteral[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[]
): string[] {
	// Node-arm id index — the shared `buildKindIdByKind` construction (DRY:
	// this was previously an inline duplicate of that helper). Literal arms
	// do NOT resolve through this map — see the literal-first note below.
	const kindIdByKind = buildKindIdByKind(kindEntries);

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
	// Verbatim is a synthetic variant: pattern-modeled per-slot enums upcast
	// their bare-string inputs (via VerbatimTransport) into AnyTransport
	// through their `*_transport_slot_to_any` bridge. AnyTransport itself
	// never constructs Verbatim directly — its FromNapiValue requires an
	// object with $type or a numeric kind_id. See VerbatimTransport docstring.
	lines.push('    Verbatim(VerbatimTransport),');
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
	// Resolution is literal-first (#129): `kindIdByKind` keys every entry by
	// its catalog kind BEFORE symbolName, so a literal whose text equals a
	// NAMED rule's name (python's `'type'`) resolved to the rule's id — which
	// a node arm had already claimed, so the literal arm was deduped away and
	// the anon token's id had NO arm at all. Resolve the literal TEXT through
	// the anon-scoped lookup, falling back to the catalog-key form for
	// literals keyed by parser-symbol name.
	for (const [index, literal] of literals.entries()) {
		// PR-K3a: mint stamp first; emit-time chain only for stamp-less
		// (kind-derived) literals.
		const id =
			literal.resolvedKindId ??
			(findKindEntryForLiteral(kindEntries, literal.text) ?? findKindEntry(kindEntries, literal.kind))?.id;
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
	// AnyTransport is kind_id-only: it admits the universe of typed nodes, so
	// no bare-string fast-path can pick the "right" variant. Per-slot enums
	// handle bare-string inputs via VerbatimTransport upstream. By the time
	// we reach AnyTransport, a missing kind_id is a real error.
	lines.push('        Err(::napi::Error::from_reason(');
	lines.push('            "AnyTransport: expected u16 kind_id or object with $type",');
	lines.push('        ))');
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

function renderTransportEntry(): string[] {
	return [
		'use ::sittir_core::types::Source as TransportSource;',
		'',
		'pub fn render_transport_parts(transport: AnyTransport) -> Result<(TransportSource, String), ::askama::Error> {',
		'    let rendered = render_transport_dispatch(&transport)?;',
		'    let source = transport_source(&transport);',
		'    Ok((source, rendered))',
		'}',
		'',
		'fn transport_source(transport: &AnyTransport) -> TransportSource {',
		'    TransportSource::Factory',
		'}'
	];
}

function renderLiteralTransportStruct(_literals: readonly TransportLiteral[]): string[] {
	return [];
}

function renderVerbatimTransportStruct(): string[] {
	return [
		'#[derive(Debug, Clone)]',
		'pub struct VerbatimTransport {',
		'    pub text: String,',
		'}',
		'',
		'#[cfg(feature = "napi-bindings")]',
		'impl ::napi::bindgen_prelude::FromNapiValue for VerbatimTransport {',
		'    unsafe fn from_napi_value(',
		'        env: ::napi::sys::napi_env,',
		'        napi_val: ::napi::sys::napi_value,',
		'    ) -> ::napi::Result<Self> {',
		'        // typeof guard: never call String::from_napi_value on a non-string',
		"        // (its failure path JSON.stringify's Object inputs — see",
		'        // transport_value_type).',
		'        if transport_value_type(env, napi_val)? != ::napi::ValueType::String {',
		'            return Err(::napi::Error::from_reason("VerbatimTransport: expected bare string"));',
		'        }',
		'        let text = String::from_napi_value(env, napi_val)?;',
		'        Ok(Self { text })',
		'    }',
		'}',
		'',
		'#[cfg(feature = "napi-bindings")]',
		'impl ::napi::bindgen_prelude::ToNapiValue for VerbatimTransport {',
		'    unsafe fn to_napi_value(',
		'        _env: ::napi::sys::napi_env,',
		'        _val: Self,',
		'    ) -> ::napi::Result<::napi::sys::napi_value> {',
		'        Err(::napi::Error::from_reason("VerbatimTransport is receive-only"))',
		'    }',
		'}',
		''
	];
}

function leafBooleanPresenceLiteral(node: AssembledNode, nodeMap: NodeMap): string | undefined {
	if (node.modelType !== 'keyword' && node.modelType !== 'token') return undefined;
	const literal = node.text;
	if (!literal) return undefined;
	for (const [, owner] of nodeMap.nodes) {
		for (const field of structuralFieldsOf(owner)) {
			if (keywordPresenceValue(field, nodeMap) !== literal) continue;
			if (field.values.some((value) => isNodeRef(value) && storageKindOfRef(value.node) === node.kind)) {
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
		// TEMPORARY (separator-as-slot Task 2 follow-up — see
		// isSlotBearingCompound's doc comment, shared.ts): 'separatedList'
		// shares 'branch's transport struct field emission for
		// byte-identical output pending Tasks 4-6's real per-instance
		// capture.
		case 'separatedList':
			lines.push(...renderTransportMetadataFields(true));
			// Per cleanup-rules §E1: named and unnamed slots emit symmetric per-slot
			// transport fields. JS factories write `_<storageName>` keys for every
			// slot regardless of named-ness, so the napi struct must declare a field
			// per slot with the matching `js_name` to deserialize.
			for (const field of [...slotModel.named, ...slotModel.unnamed]) {
				lines.push(...renderTransportField(field, node.kind, node.typeName, nodeMap));
			}
			// Group-lift inner field hoisting: for each unnamed slot that is a
			// group-lift helper (points to `_<slotName>`), also emit the helper's
			// inner NAMED fields as direct transport fields on the parent struct
			// (e.g. `_value: Option<ExpressionTransport>` on ConstItemTransport).
			//
			// The CST native reader exposes inner grammar fields at the parent
			// level (tree-sitter places `value` directly on `const_item`, not
			// nested inside `_const_item_optional1`). Adding the direct fields
			// lets napi deserialization read the CST path without a nested
			// helper object. The render fn then tries the direct field first,
			// falling back to the helper for factory-built transports.
			{
				// Track ALL already-emitted storage names to prevent duplicate fields.
				// Includes: named slots, unnamed slots (helpers themselves), and any
				// inner fields already hoisted from previous helpers in this loop.
				const emittedStorageNames = new Set([
					...slotModel.named.map((f) => f.storageName),
					...slotModel.unnamed.map((f) => f.storageName)
				]);
				for (const unnamedSlot of slotModel.unnamed) {
					const helperNodeName = `_${unnamedSlot.name}`;
					const helperNode = nodeMap.nodes.get(helperNodeName);
					if (helperNode === undefined) continue;
					const helperSlots = allSlotsOf(helperNode);
					for (const innerSlot of helperSlots) {
						if (innerSlot.isUnnamed) continue; // skip unnamed inner slots
						if (emittedStorageNames.has(innerSlot.storageName)) continue; // already present
						// Emit the inner field directly on the parent struct.
						// Use the HELPER node's kind/typeName so per-slot enum references
						// resolve to the helper's already-generated per-slot enum types
						// (e.g. FunctionTypeTraitFormTraitTransportSlot, not a new
						// FunctionTypeTraitTransportSlot that would be undefined).
						// forceOptional=true: the outer helper is Option<HelperTransport>,
						// so the hoisted direct field must always be Option<T> regardless
						// of whether the inner slot is required inside the helper.
						lines.push(...renderTransportField(innerSlot, helperNode.kind, helperNode.typeName, nodeMap, true));
						// Track to avoid emitting the same inner field from multiple helpers.
						emittedStorageNames.add(innerSlot.storageName);
					}
				}
				// Task 4's wire capture (wrap.ts's `emitSeparatedListWrap`) emits
				// `_leading_sep`/`_trailing_sep`/`_separator_kind` sibling wire keys
				// ONLY when the corresponding grammar-level mode/rule actually needs
				// per-instance capture (design's "Field shape and wire capture"
				// section) — mirror that same gating here so the struct never
				// declares a field the wire can't populate.
				if (node instanceof AssembledSeparatedList) {
					if (node.leadingMode === 'optional') {
						lines.push(
							'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_leading_sep"))]',
							'    pub leading_sep: Option<bool>,'
						);
					}
					if (node.trailingMode === 'optional') {
						lines.push(
							'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_trailing_sep"))]',
							'    pub trailing_sep: Option<bool>,'
						);
					}
					if (node.separatorRule !== undefined) {
						lines.push(
							'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_separator_kind"))]',
							'    pub separator_kind: Option<u16>,'
						);
					}
				}
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
	// Emit Box<StructName> napi impls so the `Box-at-back-edge` slot-field
	// typing in rustTransportSlotType can produce `Box<ConcreteTransport>`
	// without compile-time "trait FromNapiValue is not implemented" errors.
	// napi-rs's derive doesn't auto-generate Box wrappers; we forward
	// manually to the inner struct's impls (which the #[napi(object)] derive
	// or the manual leaf impls above provide). Dead Box impls for structs
	// never actually boxed get DCE'd by the compiler.
	lines.push(...renderBoxedEnumNapiImpls(structName));
	return lines;
}

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
	// typeof dispatch — never probe String::from_napi_value on a non-string
	// (its failure path JSON.stringify's Object inputs; see transport_value_type).
	lines.push(`        let text = match transport_value_type(env, napi_val)? {`);
	lines.push(`            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,`);
	if (defaultTextLiteral !== undefined) {
		lines.push(`            // Raw kind_id: value-less leaf sent as its numeric kind tag.`);
		lines.push(`            ::napi::ValueType::Number => ${JSON.stringify(defaultTextLiteral)}.to_string(),`);
	}
	if (booleanLiteral !== undefined) {
		lines.push(`            ::napi::ValueType::Boolean => {`);
		lines.push(`                if !bool::from_napi_value(env, napi_val)? {`);
		lines.push(
			`                    return Err(::napi::Error::from_reason(${JSON.stringify(
				`${structName} received false; omit the field instead of sending false`
			)}));`
		);
		lines.push(`                }`);
		lines.push(`                ${JSON.stringify(booleanLiteral)}.to_string()`);
		lines.push(`            }`);
	}
	lines.push(`            _ => {`);
	lines.push(`                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
	lines.push(
		defaultTextLiteral !== undefined
			? `                obj.get("$text")?.unwrap_or_else(|| ${JSON.stringify(defaultTextLiteral)}.to_string())`
			: `                obj.get("$text")?.unwrap_or_default()`
	);
	lines.push(`            }`);
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
		// typeof dispatch — never probe String::from_napi_value on a non-string
		// (its failure path JSON.stringify's Object inputs; see transport_value_type).
		lines.push(`        match transport_value_type(env, napi_val)? {`);
		lines.push(`            ::napi::ValueType::String => {`);
		lines.push(`                let text = String::from_napi_value(env, napi_val)?;`);
		lines.push(`                return Ok(Self {`);
		for (const f of TRANSPORT_METADATA_FIELDS) {
			if (f.rustName === 'transport_named') {
				lines.push(`                    transport_named: Some(${named}),`);
			} else {
				lines.push(`                    ${f.rustName}: None,`);
			}
		}
		lines.push(`                    text,`);
		lines.push(`                });`);
		lines.push(`            }`);
		lines.push(`            ::napi::ValueType::Boolean => {`);
		lines.push(`                if !bool::from_napi_value(env, napi_val)? {`);
		lines.push(
			`                    return Err(::napi::Error::from_reason(${JSON.stringify(
				`${structName} received false; omit the field instead of sending false`
			)}));`
		);
		lines.push(`                }`);
		lines.push(`                return Ok(Self {`);
		for (const f of TRANSPORT_METADATA_FIELDS) {
			if (f.rustName === 'transport_named') {
				lines.push(`                    transport_named: Some(${named}),`);
			} else {
				lines.push(`                    ${f.rustName}: None,`);
			}
		}
		lines.push(`                    text: ${JSON.stringify(booleanLiteral)}.to_string(),`);
		lines.push(`                });`);
		lines.push(`            }`);
		lines.push(`            _ => {}`);
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
	if (node.modelType === 'keyword' || node.modelType === 'token') return node.text || undefined;
	// Patterns whose sole realisation is a single fixed anonymous literal
	// (e.g. `_semicolon` → ";", `||` → "||") arrive over NAPI as a bare u16
	// kind-id rather than a string, because scalar_leaf_value in sittir-core
	// serialises anonymous single-leaf fields that way.  Accept the u16 branch
	// only for patterns that carry a known fixed literal (`fixedLiteralText`);
	// content-bearing patterns (identifier, number, …) must never collapse to a
	// constant — they come in on the String path and must stay on that path.
	if (node.modelType === 'pattern') return node.fixedLiteralText || undefined;
	return undefined;
}

interface TransportMetadataField {
	jsName: string;
	rustName: string;
	rustType: string;
	bridgeMap?: string;
	needsExplicitTypeAnnotation?: boolean;
}

const TRANSPORT_METADATA_FIELDS: readonly TransportMetadataField[] = [
	{ jsName: '$source', rustName: 'transport_source', rustType: 'Option<Source>' },
	{ jsName: '$named', rustName: 'transport_named', rustType: 'Option<bool>' },
	{ jsName: '$span', rustName: 'transport_span', rustType: 'Option<Span>' },
	// ADR-0017: $nodeHandle (u32) + $childIndex (u16) replace $nodeId.
	// napi-rs 3 passes these as f64 from JS; converted at the transport boundary.
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

const TRANSPORT_TEXT_FIELD: TransportMetadataField = {
	jsName: '$text',
	rustName: 'transport_text',
	rustType: 'Option<String>'
};

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

function renderLeafTransportPlainFields(): string[] {
	return [...TRANSPORT_METADATA_FIELDS.map((f) => `    pub ${f.rustName}: ${f.rustType},`), '    pub text: String,'];
}

function renderTransportField(
	field: AssembledNonterminal,
	parentKind: string,
	typeName: string,
	nodeMap: NodeMap,
	/** When true, override required→false regardless of the slot's own multiplicity.
	 *  Used for group-lift inner fields hoisted to the parent struct: those fields
	 *  are accessible only when the outer optional helper is present, so the direct
	 *  field on the parent is always Option<T>, even if the inner slot is required
	 *  inside the helper. */
	forceOptional = false
): string[] {
	const lines: string[] = [];
	const rustName = rustFieldIdent(field.storageName);
	// Generator-owned NodeData stores raw fields as `_<storageName>` top-level
	// keys. Keep the JS/native render boundary dumb by teaching the generated
	// napi structs to read the same storage keys directly. Symmetric for named
	// and unnamed slots (cleanup-rules §E1).
	lines.push(`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(`_${field.storageName}`)}))]`);
	// `'boolean'`/`'verbatim'`-classified fields (see `classifyPrimitiveField`
	// docstring) bypass `rustTransportSlotType` entirely and get a primitive
	// Rust type instead — wrap sends a presence bool or bare text for these,
	// never the kind_id/object shape `rustTransportSlotType`'s per-slot-enum
	// / `AnyTransport` machinery expects.
	const required = forceOptional ? false : isRequired(field);
	const primitive = classifyPrimitiveField(field, nodeMap);
	const primitiveType =
		primitive?.kind === 'boolean'
			? // `Option<bool>`, NOT bare `bool`: wrap OMITS the wire key entirely
				// when absent/false (confirmed via `tool probe-kind`) rather than
				// sending an explicit `false`. `#[napi(object)]` derive requires a
				// non-Option field's key to always be present, so a bare `bool`
				// throws "Missing field" on every absent instance — the common
				// case for an optional keyword modifier. Render-side glue treats
				// `None` the same as `Some(false)` (`unwrap_or(false)`).
				'Option<bool>'
			: primitive?.kind === 'verbatim'
				? required
					? 'String'
					: 'Option<String>'
				: undefined;
	lines.push(
		`    pub ${rustName}: ${
			primitiveType ??
			rustTransportSlotType(
				kindsOf(field),
				nodeMap,
				{ required, multiple: isMultiple(field) },
				parentKind,
				typeName,
				field.name,
				slotLiteralValues(field)
			)
		},`
	);
	return lines;
}

function rustTransportSlotType(
	slotKinds: readonly string[],
	nodeMap: NodeMap,
	cardinality: { required: boolean; multiple: boolean },
	parentKind: string,
	typeName: string,
	fieldName: string,
	literalTexts: readonly string[] = []
): string {
	const { required, multiple } = cardinality;
	// Mixed-content override: a field with named kinds AND anonymous literal
	// content is heterogeneous regardless of classifier (e.g. `function_modifiers.modifier`
	// which accepts `extern_modifier` OR bare keywords like `async`/`const`/`unsafe`).
	// `kindsOf()` intentionally skips TerminalValue entries, so without this
	// check the slot would be misclassified as `concrete`.
	const hasMixedContent = slotKinds.length > 0 && literalTexts.length > 0;
	const cls = hasMixedContent ? ({ tag: 'heterogeneous' } as const) : classifySlotForEmit(slotKinds, nodeMap);

	// Back-edge detection: a singular (non-Vec) slot creates a size cycle when
	// the slot's actual emitted type can hold a value that transitively
	// references parentKind. The "reachable kind set" depends on slot
	// classification:
	//   - concrete: the single kind admitted
	//   - supertype: the supertype kind itself (which the SCC graph treats as
	//     a relay node — edges flow supertype → subtypes)
	//   - heterogeneous: the slot's direct admit set (per-slot enum has no
	//     graph node; edges are direct parent → admits)
	// Vec slots don't propagate size cycles (Vec is heap-allocated, fixed size)
	// so they never need an extra Box.
	const scc = nodeMap.scc;
	let reachableKinds: readonly string[] = [];
	if (!multiple && scc !== undefined) {
		if (cls.tag === 'concrete') {
			reachableKinds = [cls.kind];
		} else if (cls.tag === 'supertype') {
			const supertypeKind = findSupertypeKindByTypeName(cls.supertypeName, nodeMap);
			reachableKinds = supertypeKind !== undefined ? [supertypeKind] : slotKinds;
		} else {
			// heterogeneous — per-slot enum admits slotKinds directly
			reachableKinds = slotKinds;
		}
	}
	const createsBackEdge = scc !== undefined && reachableKinds.some((k) => scc.sameSCC(parentKind, k));

	const wrap = (inner: string): string => {
		if (multiple) {
			const vec = `Vec<${inner}>`;
			if (required) return vec;
			return `Option<${vec}>`;
		}
		const sized = createsBackEdge ? `Box<${inner}>` : inner;
		return required ? sized : `Option<${sized}>`;
	};

	switch (cls.tag) {
		case 'concrete': {
			const base = concreteTransportTypeName(cls.kind, nodeMap);
			if (base !== null) return wrap(base);
			// Unknown kind — fall back to AnyTransport.
			// Vec<AnyTransport> is safe (Vec provides indirection). Single-value
			// AnyTransport fields need Box<> to break recursive size cycles
			// (AnyTransport is potentially recursive through any singular slot).
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

// Memoized lookup: supertype typeName → supertype kind. Used by back-edge
// detection in rustTransportSlotType to map a supertype-classified slot
// to the supertype kind that the SCC graph carries as a relay node.
let supertypeKindByTypeNameCache: WeakMap<NodeMap, Map<string, string>> = new WeakMap();
function findSupertypeKindByTypeName(supertypeName: string, nodeMap: NodeMap): string | undefined {
	let map = supertypeKindByTypeNameCache.get(nodeMap);
	if (map === undefined) {
		map = new Map<string, string>();
		for (const [kind, node] of nodeMap.nodes) {
			if (node.modelType === 'supertype') {
				map.set(node.typeName, kind);
			}
		}
		supertypeKindByTypeNameCache.set(nodeMap, map);
	}
	return map.get(supertypeName);
}

function renderBoxedEnumNapiImpls(enumName: string): string[] {
	return [
		`#[cfg(feature = "napi-bindings")]`,
		`impl ::napi::bindgen_prelude::FromNapiValue for Box<${enumName}> {`,
		`    unsafe fn from_napi_value(`,
		`        env: ::napi::sys::napi_env,`,
		`        napi_val: ::napi::sys::napi_value,`,
		`    ) -> ::napi::Result<Self> {`,
		`        ${enumName}::from_napi_value(env, napi_val).map(Box::new)`,
		`    }`,
		`}`,
		``,
		`#[cfg(feature = "napi-bindings")]`,
		`impl ::napi::bindgen_prelude::ToNapiValue for Box<${enumName}> {`,
		`    unsafe fn to_napi_value(`,
		`        env: ::napi::sys::napi_env,`,
		`        val: Self,`,
		`    ) -> ::napi::Result<::napi::sys::napi_value> {`,
		`        ${enumName}::to_napi_value(env, *val)`,
		`    }`,
		`}`,
		``
	];
}

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

function perSlotEnumName(typeName: string, fieldName: string): string {
	const base = rustTypeIdent(typeName);
	// Field names are typically snake_case / lowercase (e.g. `body`, `type_arguments`).
	// PascalCase them so the resulting enum name reads correctly.
	const segments = fieldName.split(/[^A-Za-z0-9]+/).filter((s) => s.length > 0);
	const pascalField = segments.map((s) => (s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1))).join('');
	const sanitized = rustTypeIdent(pascalField);
	return `${base}${sanitized}TransportSlot`;
}

function rustTransportStructName(node: AssembledNode): string {
	if (node instanceof AssembledEnum) {
		return enumTypeName(node);
	}
	const name = `${rustTypeIdent(node.typeName)}Transport`;
	return RESERVED_TRANSPORT_STRUCT_NAMES.has(name) ? `${rustTypeIdent(node.typeName)}KindTransport` : name;
}

function rustTransportVariantName(node: AssembledNode): string {
	return rustTypeIdent(node.typeName);
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

function literalToVariantName(literal: string): string {
	const known = LITERAL_TO_VARIANT_NAME.get(literal);
	if (known !== undefined) return known;

	// Alphanumeric / underscore — PascalCase each segment.
	if (isAsciiIdentifier(literal)) {
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

function enumTypeName(node: AssembledEnum): string {
	return `${rustTypeIdent(node.typeName)}Enum`;
}

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
			// typeof dispatch — never probe a typed read on a mismatched shape
			// (String::from_napi_value's failure path JSON.stringify's Object
			// inputs; see transport_value_type).
			const kindIdMatchArms = (indent: string): void => {
				for (const v of values) {
					// `values` are LITERAL member texts — read the node's
					// construction-time literal-chain resolution (PR-K3a;
					// anon-scoped first so a same-spelled named rule can't
					// shadow, #129).
					const entry = node.resolvedByText.get(v);
					const variant = literalToVariantName(v);
					if (entry !== undefined) {
						lines.push(`${indent}${entry.id} => return Ok(Self::${variant}), // ${JSON.stringify(v)}`);
					} else {
						lines.push(`${indent}// ${JSON.stringify(v)}: no parser symbol — cannot dispatch by KindId`);
					}
				}
				lines.push(`${indent}_ => {}`);
			};
			const textMatchArms = (indent: string): void => {
				for (const v of values) {
					lines.push(`${indent}${JSON.stringify(v)} => return Ok(Self::${literalToVariantName(v)}),`);
				}
				lines.push(`${indent}_ => {}`);
			};
			lines.push(`        match transport_value_type(env, napi_val)? {`);
			lines.push(`            ::napi::ValueType::Number => {`);
			lines.push(`                if let Ok(kind_id) = u16::from_napi_value(env, napi_val) {`);
			lines.push(`                    match kind_id {`);
			kindIdMatchArms(`                        `);
			lines.push(`                    }`);
			lines.push(`                }`);
			lines.push(`            }`);
			lines.push(`            ::napi::ValueType::String => {`);
			lines.push(`                match String::from_napi_value(env, napi_val)?.as_str() {`);
			textMatchArms(`                    `);
			lines.push(`                }`);
			lines.push(`            }`);
			lines.push(`            ::napi::ValueType::Object => {`);
			lines.push(`                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
			lines.push(`                if let Some(kind_id) = obj.get::<u16>("$type")? {`);
			lines.push(`                    match kind_id {`);
			kindIdMatchArms(`                        `);
			lines.push(`                    }`);
			lines.push(`                }`);
			lines.push(`                if let Some(text) = obj.get::<String>("$text")? {`);
			lines.push(`                    match text.as_str() {`);
			textMatchArms(`                        `);
			lines.push(`                    }`);
			lines.push(`                }`);
			for (const v of values) {
				const variant = literalToVariantName(v);
				lines.push(
					`                if obj.get::<::napi::bindgen_prelude::Object>(${JSON.stringify(`_${v}`)})?.is_some() { return Ok(Self::${variant}); }`
				);
			}
			lines.push(`            }`);
			lines.push(`            _ => {}`);
			lines.push(`        }`);
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
