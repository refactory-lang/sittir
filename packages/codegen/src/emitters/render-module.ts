import { writeSync } from 'node:fs';
import type { NodeMap } from '../compiler/types.ts';
import { isAsciiIdentifier } from '../util/identifier-shape.ts';
import type { AssembledNode, RenderTemplateSurface, AssembledNonterminal } from '../compiler/model/node-map.ts';
import {
	AssembledBranch,
	AbstractAssembledCompound,
	AssembledEnvelope,
	AssembledPolymorph,
	AssembledEnum,
	AssembledKeyword,
	AssembledPattern,
	AssembledSupertype,
	AssembledToken,
	AssembledLeaf,
	AssembledList,
	deriveUnnamedChildrenCardinality,
	hasOptionalElements,
	isMultiple,
	isRequired,
	isNodeRef,
	isTerminalValue,
	kindsOf,
	aliasTargetToSourceMapOf,
	acceptedIdPairsByKindOf,
	storageKindOfRef,
	storageKindOfValue,
	isLeftImmediateKind
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
	classifyPrimitiveField,
	type PrimitiveFieldStorage,
	wordCharAsciiTable,
	literalMergePairs,
	fieldTypeComponents
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

	emitLeaf(_node: AssembledPattern | AssembledKeyword | AssembledEnum): void {}

	emitBranch(_node: AssembledBranch | AssembledEnvelope | AssembledPolymorph | AssembledList): void {}

	emitGroup(_node: AssembledBranch | AssembledEnvelope | AssembledPolymorph): void {}

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

const RESERVED_TRANSPORT_STRUCT_NAMES = new Set(['AnyTransport', 'ProtectedTransport', 'LiteralTransport']);

function isReservedSupertypeTransportNode(node: AssembledNode): node is AssembledSupertype {
	return (
		node instanceof AssembledSupertype && RESERVED_SUPERTYPE_ENUM_NAMES.has(`${rustTypeIdent(node.typeName)}Transport`)
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
	for (const subKind of supertypeNode.subtypeNames) {
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
		.replace(/^_+/, '')
		.split('_')
		.filter(Boolean)
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join('');
}

interface EmittedField {
	name: string;
	view: EmittedNonterminalView;
	required: boolean;
	multiple: boolean;
	hasTransportField: boolean;
	storageName: string;
	isUnnamed: boolean;
	hasLeadingDelimiter: boolean;
	hasTrailingDelimiter: boolean;
	trailingDelimiter: 'mandatory' | 'optional' | 'none';
	leadingDelimiter: 'mandatory' | 'optional' | 'none';
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
				hasTrailingDelimiter: merged.hasTrailingDelimiter || slot.hasTrailingDelimiter,
				hasLeadingDelimiter: merged.hasLeadingDelimiter || slot.hasLeadingDelimiter
			}),
		first.with({ values: [...first.values] })
	);
}

function renderSlotAuditVariantsOf(
	node: AssembledBranch | AssembledEnvelope | AssembledPolymorph | AssembledList
): readonly (readonly AssembledNonterminal[])[] {
	return [node.slots];
}

function renderSlotAuditKey(slot: AssembledNonterminal): string {
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
	const {
		multipleByName,
		requiredByName,
		storageByName,
		separatorByName,
		trailingModeByName,
		leadingModeByName,
		unnamedNames
	} = collectSlotEmissionMetadata(node, slotModel);
	const fields: EmittedField[] = surface.slots.map((slot) => ({
		...slot,
		multiple: multipleByName.get(slot.name) ?? false,
		required: requiredByName.has(slot.name) ? (requiredByName.get(slot.name) as boolean) : slot.required,
		trailingDelimiter: trailingModeByName.get(slot.name) ?? slot.trailingDelimiter,
		leadingDelimiter: leadingModeByName.get(slot.name) ?? slot.leadingDelimiter,
		hasTransportField: requiredByName.has(slot.name) || multipleByName.has(slot.name),
		storageName: storageByName.get(slot.name) ?? slot.name,
		isUnnamed: unnamedNames.has(slot.name),
		separator: separatorByName.get(slot.name)
	}));
	fields.sort((a, b) => a.name.localeCompare(b.name));
	if (nodeMap !== undefined) {
		for (const f of fields) {
			if (f.hasTransportField || f.required || f.multiple) continue;
			for (const helperSlot of slotModel.unnamed) {
				const helperNodeName = `_${helperSlot.name}`;
				const helperNode = nodeMap.nodes.get(helperNodeName);
				if (helperNode === undefined) continue;
				const helperSlots = helperNode.slots;
				const innerSlot = helperSlots.find((s) => s.name === f.name);
				if (innerSlot !== undefined) {
					f.backingTransportField = helperSlot.storageName;
					f.backingInnerRequired = isRequired(innerSlot);
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
			hasLeadingDelimiter: false,
			hasTrailingDelimiter: false,
			trailingDelimiter: 'none',
			leadingDelimiter: 'none'
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
		hasLeadingDelimiter: slot.hasLeadingDelimiter,
		hasTrailingDelimiter: slot.hasTrailingDelimiter,
		trailingDelimiter: slot.trailingDelimiter,
		leadingDelimiter: slot.leadingDelimiter
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
		const hasBorrows = s.hasChildren || s.hasVariant || s.hasText || s.fields.length > 0;
		lines.push(`pub struct ${s.name}${hasBorrows ? "<'a>" : ''} {`);
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
	if (f.view === 'list' || f.multiple) {
		return `ListNonterminalView<'a>`;
	}
	if (f.required) return `SingleNonterminalView<'a>`;
	return `OptionalNonterminalView<'a>`;
}

function childrenFieldType(s: Pick<EmittedStruct, 'childrenRequired' | 'childrenMultiple'>): string {
	if (s.childrenMultiple) return `ListNonterminalView<'a>`;
	return s.childrenRequired ? `SingleNonterminalView<'a>` : `OptionalNonterminalView<'a>`;
}

interface MetaData {
	separators: Map<string, string>;
}

function collectMetaData(nodeMap: NodeMap): MetaData {
	const separators = new Map<string, string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (!node.userFacing) continue;
		if (node instanceof AbstractAssembledCompound || node instanceof AssembledList) {
			let sep: string | undefined;
			const allSlots = node.slots;
			outer: for (const slot of allSlots) {
				for (const v of slot.values) {
					if ((v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray') && v.separator) {
						sep = v.separator;
						break outer;
					}
				}
			}
			if (sep === undefined && node instanceof AbstractAssembledCompound && !node.hoisted) {
				sep = node.separator ?? undefined;
			}
			if (sep !== undefined) separators.set(kind, sep);
		}
	}
	return { separators };
}

function classifySlotForEmit(kinds: readonly string[], nodeMap: NodeMap): SlotClass {
	const supertypeMap = buildSupertypeTransportSet(nodeMap);
	const cls = classifySlot(kinds, supertypeMap);
	if (cls.tag === 'concrete') {
		const node = nodeMap.nodes.get(cls.kind);
		if (node === undefined) return { tag: 'heterogeneous' };
		if (node instanceof AssembledSupertype) {
			const enumName = `${rustTypeIdent(node.typeName)}Transport`;
			if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) return { tag: 'heterogeneous' };
			return { tag: 'supertype', supertypeName: node.typeName };
		}
		return { tag: 'concrete', kind: cls.kind, typeName: node.typeName };
	}
	if (cls.tag === 'supertype') {
		const enumName = `${rustTypeIdent(cls.supertypeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) return { tag: 'heterogeneous' };
	}
	return cls;
}

function buildSlotWriteCall(cls: SlotClass, expr: string): string {
	switch (cls.tag) {
		case 'concrete':
			return `if let Some(v) = ${expr}.node_or_write(dest)? { render_${rustSnakeIdent(cls.typeName)}(v, dest)?; }`;
		case 'supertype':
			return `if let Some(v) = ${expr}.node_or_write(dest)? { render_${rustSnakeIdent(cls.supertypeName)}(v, dest)?; }`;
		case 'heterogeneous':
			return `${expr}.render_into(dest)?;`;
		default:
			return assertNever(cls);
	}
}

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

	for (const node of nodes) {
		lines.push(...renderTypedKindFn(node, structsByKind, meta, nodeMap, kindIdByKind));
	}

	for (const [, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype)) continue;
		if (!usedSupertypeNames.has(node.typeName)) continue;
		const enumName = `${rustTypeIdent(node.typeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		lines.push(...emitSupertypeRenderHelper(node, nodeMap));
	}

	const wordTable = wordCharAsciiTable(nodeMap.wordMatcher ?? /\w/);
	const mergePairs = literalMergePairs(literals);
	lines.push(`/// Word-class table derived from this grammar's Link-pinned word pattern.`);
	lines.push(
		`static GRAMMAR_WORD_MATCHER: ::sittir_core::spacing::WordMatcher = ::sittir_core::spacing::WordMatcher::new(`
	);
	lines.push(`    [${wordTable.map((b) => (b ? 'true' : 'false')).join(', ')}],`);
	lines.push(`    char::is_alphanumeric,`);
	lines.push(`)`);
	lines.push(
		`.with_literal_merge_pairs(&[${mergePairs.map(([a, b]) => `(${a}, ${b})`).join(', ')}]); // ${
			mergePairs.length === 0
				? 'no multi-char punctuation transitions in this grammar'
				: mergePairs.map(([a, b]) => JSON.stringify(String.fromCharCode(a) + String.fromCharCode(b))).join(' ')
		}`
	);
	lines.push('');
	lines.push(`/// Render a transport tree to text. Takes the trait rather than`);
	lines.push(`/// \`&AnyTransport\` so the root's own \`SlotValue\` carrier renders through`);
	lines.push(`/// the SAME single SpacingWriter wrap — a second entry point would be a`);
	lines.push(`/// second place the root seam policy could drift.`);
	lines.push(
		`pub fn render_transport_dispatch(transport: &dyn RenderableTransport) -> Result<String, ::askama::Error> {`
	);
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

	lines.push(`impl RenderableTransport for AnyTransport {`);
	lines.push(`    fn render_into(`);
	lines.push(`        &self,`);
	lines.push(`        dest: &mut dyn ::std::fmt::Write,`);
	lines.push(`    ) -> Result<(), ::askama::Error> {`);
	lines.push(`        match self {`);
	for (const node of nodes) {
		const variant = rustTransportVariantName(node);
		const isLeafLikeNode = node.modelType === 'pattern' || node.modelType === 'token';
		if (isLeafLikeNode) {
			lines.push(`            AnyTransport::${variant}(t) => t.render_into(dest),`);
		} else if (node instanceof AssembledEnum) {
			lines.push(`            AnyTransport::${variant}(t) => t.render_into(dest),`);
		} else {
			lines.push(`            AnyTransport::${variant}(t) => t.render_into(dest),`);
		}
	}
	for (const [index, literal] of literals.entries()) {
		const variant = rustLiteralTransportVariantName(literal, index);
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
		case 'envelope':
		case 'list': {
			const struct = structsByKind.get(node.kind);
			if (struct === undefined) {
				return renderTypedBranchFallbackFn(node, nodeMap);
			}
			return renderTypedBranchFn(node, struct, meta, nodeMap, kindIdByKind);
		}
		case 'polymorph': {
			if (node instanceof AssembledSupertype) return [];
			const struct = structsByKind.get(node.kind);
			if (struct === undefined) {
				return renderTypedBranchFallbackFn(node, nodeMap);
			}
			return renderTypedBranchFn(node, struct, meta, nodeMap, kindIdByKind);
		}
		case 'pattern':
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
				lines.push(`    ${buildSlotWriteCall(slotCls, `node.${slotIdent}`)}`);
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
	const mark = node instanceof AssembledLeaf && node.immediate ? [`    ::sittir_core::spacing::mark_adjacent();`] : [];
	return [
		`fn ${fnName}(t: &${typeName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`,
		...mark,
		`    ${body}`,
		`}`,
		``
	];
}

function buildFieldKindsByName(slots: readonly AssembledNonterminal[]): ReadonlyMap<string, readonly string[]> {
	const map = new Map<string, readonly string[]>();
	for (const f of slots) {
		map.set(f.name, kindsOf(f));
	}
	return map;
}

function buildFieldMixedByName(slots: readonly AssembledNonterminal[]): ReadonlySet<string> {
	const set = new Set<string>();
	for (const f of slots) {
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
	const nodeSeparator = meta.separators.get(node.kind) ?? '';
	const slotModel = renderSlotModelOf(node);

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

function emitIterCollectBuffer(ident: string, sourceExpr: string, mapBody: string): string[] {
	const R = RENDERABLE_PREFIX;
	return [
		`    let ${ident}_buf: Vec<${R}Renderable<'_>> = ${sourceExpr}.iter()`,
		`        .map(|t| ${mapBody})`,
		`        .collect();`
	];
}

function emitListSlotBuffer(ident: string, required: boolean, optionalElement = false): string[] {
	const R = RENDERABLE_PREFIX;
	const mapBody = optionalElement
		? `match t { Some(t) => ${R}Renderable::Transport(t), None => ${R}Renderable::Text("") }`
		: `${R}Renderable::Transport(t)`;
	if (required) {
		return emitIterCollectBuffer(ident, `node.${ident}`, mapBody);
	}
	return [
		`    let ${ident}_owned = node.${ident}.as_deref().unwrap_or(&[]);`,
		...emitIterCollectBuffer(ident, `${ident}_owned`, mapBody)
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

	const primitiveByName = new Map<string, PrimitiveFieldStorage>();
	if (nodeMap !== undefined && slotModel !== undefined) {
		for (const f of [...slotModel.named, ...slotModel.unnamed]) {
			const cls = classifyPrimitiveField(f, nodeMap);
			if (cls !== undefined) primitiveByName.set(f.name, cls);
		}
	}

	if (slotModel !== undefined) {
		const allSlots = [...slotModel.named, ...slotModel.unnamed];
		const allCheckable = allSlots.every((slot) => {
			if (isMultiple(slot)) return true;
			if (primitiveByName.get(slot.name)?.kind === 'boolean') return true;
			return !isRequired(slot);
		});
		if (allCheckable && allSlots.length > 0) {
			const seenStorage = new Set<string>();
			const checks: string[] = [];
			for (const slot of allSlots) {
				if (seenStorage.has(slot.storageName)) continue;
				seenStorage.add(slot.storageName);
				const rIdent = rustFieldIdent(slot.storageName);
				if (primitiveByName.get(slot.name)?.kind === 'boolean') {
					checks.push(`!node.${rIdent}.unwrap_or(false)`);
				} else if (isMultiple(slot) && isRequired(slot)) {
					checks.push(`node.${rIdent}.is_empty()`);
				} else if (isMultiple(slot)) {
					checks.push(`node.${rIdent}.as_deref().is_none_or(<[_]>::is_empty)`);
				} else {
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

	const emittedBufferIdents = new Set<string>();
	for (const f of struct.fields) {
		if (!f.hasTransportField) continue;
		if (f.view !== 'list' && !f.multiple) continue;
		const rIdent = rustFieldIdent(f.storageName);
		if (emittedBufferIdents.has(rIdent)) continue;
		emittedBufferIdents.add(rIdent);
		const slotForBuf =
			slotModel !== undefined
				? [...slotModel.named, ...slotModel.unnamed].find((s) => s.storageName === f.storageName)
				: undefined;
		lines.push(...emitListSlotBuffer(rIdent, f.required, slotForBuf !== undefined && hasOptionalElements(slotForBuf)));
	}

	lines.push(`    let template = ${templateName} {`);

	if (struct.hasVariant) {
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
			const items = f.hasTransportField ? `${rIdent}_buf.as_slice()` : '&[]';
			const fieldSepLiteral = f.separator !== undefined ? JSON.stringify(f.separator) : sepLiteral;
			const separatedList = node instanceof AssembledList ? node : undefined;
			const leadingExpr =
				separatedList?.leadingDelimiter === 'optional'
					? 'node.delimiter.map(|d| d & 1 != 0).unwrap_or(false)'
					: separatedList?.leadingDelimiter === 'mandatory'
						? 'true'
						: 'false';
			const trailingExpr =
				separatedList?.trailingDelimiter === 'optional'
					? 'node.delimiter.map(|d| d & 2 != 0).unwrap_or(false)'
					: separatedList?.trailingDelimiter === 'mandatory'
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
			if (!f.hasTransportField) {
				lines.push(`        ${templateIdent}: SingleNonterminalView(${R}Renderable::Text("")),`);
			} else if (isBoxed) {
				lines.push(`        ${templateIdent}: SingleNonterminalView(${R}Renderable::Transport(&node.${rIdent})),`);
			} else {
				lines.push(`        ${templateIdent}: SingleNonterminalView(${R}Renderable::Transport(&node.${rIdent})),`);
			}
		} else {
			if (f.backingTransportField) {
				const backingRIdent = rustFieldIdent(f.backingTransportField);
				if (f.backingDirectField) {
					const directRIdent = rustFieldIdent(f.backingDirectField);
					if (f.backingInnerRequired) {
						lines.push(`        ${templateIdent}: node.${directRIdent}.as_ref().or_else(|| {`);
						lines.push(
							`            node.${backingRIdent}.as_ref().and_then(|h| h.node()).map(|h| &h.${templateIdent})`
						);
						lines.push(`        }).map_or(OptionalNonterminalView::Missing, |v| {`);
						lines.push(`            OptionalNonterminalView::Present(${R}Renderable::Transport(v))`);
						lines.push(`        }),`);
					} else {
						lines.push(`        ${templateIdent}: node.${directRIdent}.as_ref().or_else(|| {`);
						lines.push(
							`            node.${backingRIdent}.as_ref().and_then(|h| h.node()).and_then(|h| h.${templateIdent}.as_ref())`
						);
						lines.push(`        }).map_or(OptionalNonterminalView::Missing, |inner| {`);
						lines.push(`            OptionalNonterminalView::Present(${R}Renderable::Transport(inner))`);
						lines.push(`        }),`);
					}
				} else if (f.backingInnerRequired) {
					lines.push(`        ${templateIdent}: match node.${backingRIdent}.as_ref().and_then(|h| h.node()) {`);
					lines.push(
						`            Some(v) => OptionalNonterminalView::Present(${R}Renderable::Transport(&v.${templateIdent})),`
					);
					lines.push(`            None => OptionalNonterminalView::Missing,`);
					lines.push(`        },`);
				} else {
					lines.push(`        ${templateIdent}: match node.${backingRIdent}.as_ref().and_then(|h| h.node()) {`);
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
				lines.push(`        ${templateIdent}: match &node.${rIdent} {`);
				lines.push(`            Some(v) => OptionalNonterminalView::Present(${R}Renderable::Transport(v)),`);
				lines.push(`            None => OptionalNonterminalView::Missing,`);
				lines.push(`        },`);
			} else {
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

function libRsContents(lang: Grammar): string {
	return `// @generated from packages/${lang}/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${lang} --all --output packages/${lang}/src

pub mod hash;
pub mod kind_ids;
pub mod templates;
pub mod transport;

pub use transport::{render_transport_dispatch, render_transport_parts, AnyTransport, RenderRoot};
pub use hash::TEMPLATE_BUNDLE_HASH;
pub use kind_ids::*;
`;
}

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
	const sortedFiles = [...files].sort((a, b) => a.filename.localeCompare(b.filename));
	for (const f of sortedFiles) {
		if (!f.filename.endsWith('.jinja')) continue;
		const kind = f.filename.slice(0, -'.jinja'.length);
		const node = nodeMap.nodes.get(kind);
		structs.push(emitStruct(kind, node, mergeTemplateSurfaceFromBody(f.content, buildSlotModelSurface(node)), nodeMap));
	}
	const meta = collectMetaData(nodeMap);
	const hasNumericDispatch = generatedIdTables !== undefined;

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

	const kindEntries: readonly KindEnumEntry[] | undefined = generatedIdTables
		? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
		: undefined;

	const anyTransportLines = kindEntries
		? renderAnyTransportWithNapiFromValue(nodes, projection.literals, nodeMap, kindEntries)
		: renderAnyTransportWithStringTag(nodes, projection.literals);

	const usedSupertypeNames = collectUsedSupertypeNames(nodes, nodeMap);
	const kidByKind = kindEntries ? buildKindIdByKind(kindEntries) : undefined;
	const selfAliasIdsBySupertype = new Map<string, number[]>();
	if (kindEntries !== undefined) {
		for (const [, node] of nodeMap.nodes) {
			if (!(node instanceof AssembledSupertype)) continue;
			for (const [storage, parse] of Object.entries(node.subtypeParseNames ?? {})) {
				if (!(nodeMap.nodes.get(storage) instanceof AssembledSupertype)) continue;
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
		if (!(node instanceof AssembledSupertype)) continue;
		if (!usedSupertypeNames.has(node.typeName)) continue;
		const enumName = `${rustTypeIdent(node.typeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		supertypeEnumLines.push(
			...emitSupertypeTransportEnum(node, kidByKind, nodeMap, kindEntries, selfAliasIdsBySupertype.get(node.kind))
		);
	}

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
			...renderLiteralTransportStruct(projection.literals),
			...renderTriviaTransportSupport(nodeMap, kindEntries),
			'',
			...(supertypeEnumLines.length > 0 ? [...supertypeEnumLines, ''] : []),
			...(perSlotEnumLines.length > 0 ? [...perSlotEnumLines, ''] : []),
			...nodes.flatMap((node) => renderTransportStruct(node, nodeMap, generatedIdTables !== undefined, kindEntries)),
			'',
			...renderGrammarRenderable(),
			'',
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
				if (lines[i] === '') i++;
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
	lines.push('    FieldValue, OneOrMany, RenderableTransport, Source, Span, NodeTrivia,');
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
		'        _values: &dyn ::askama::Values,',
		"        sep: &'a str,",
		"    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {",
		'        ::sittir_core::filters::joinWithTrailing(xs, sep)',
		'    }',
		'',
		'    #[::askama::filter_fn]',
		'    #[allow(non_snake_case)]',
		"    pub fn joinWithLeading<'a, T: JoinSource<'a> + ?Sized>(",
		"        xs: &'a T,",
		'        _values: &dyn ::askama::Values,',
		"        sep: &'a str,",
		"    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {",
		'        ::sittir_core::filters::joinWithLeading(xs, sep)',
		'    }',
		'',
		'    #[::askama::filter_fn]',
		'    #[allow(non_snake_case)]',
		"    pub fn joinWithFlanks<'a, T: JoinSource<'a> + ?Sized>(",
		"        xs: &'a T,",
		'        _values: &dyn ::askama::Values,',
		"        sep: &'a str,",
		"    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {",
		'        ::sittir_core::filters::joinWithFlanks(xs, sep)',
		'    }',
		'',
		'    pub use ::sittir_core::filters::{',
		'        upper, lower,',
		'        isBlank, isPresent,',
		'        markSeam,',
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
	let changed = true;
	while (changed) {
		changed = false;
		for (const [, node] of nodeMap.nodes) {
			if (!(node instanceof AssembledSupertype)) continue;
			if (!used.has(node.typeName)) continue;
			for (const subKind of node.subtypeNames) {
				const subNode = nodeMap.nodes.get(subKind);
				if (subNode === undefined || !(subNode instanceof AssembledSupertype)) continue;
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
		'}'
	];
}

function nodeTransportHasRequiredField(node: AssembledNode): boolean {
	if (node.modelType === 'pattern' || node.modelType === 'token' || node.modelType === 'enum') {
		return true;
	}
	return node.slots.some((slot) => isRequired(slot));
}

function isLeafLikeNode(n: AssembledNode): boolean {
	return n.modelType === 'pattern' || n.modelType === 'token' || n.modelType === 'enum';
}

function boxedInEnum(
	variantKind: string,
	enumOwnerKind: string,
	variantNode: AssembledNode,
	nodeMap: NodeMap
): boolean {
	void variantKind;
	void enumOwnerKind;
	void variantNode;
	void nodeMap;
	return false;
}

function emitTransportEnumFromNapiValueBody(enumName: string, kindIdArms: readonly string[]): string[] {
	const lines: string[] = [];
	lines.push(`        match ::sittir_core::slot::transport_value_type(env, napi_val)? {`);
	lines.push(`            ::napi::ValueType::Number => {`);
	lines.push(`                match u16::from_napi_value(env, napi_val)? {`);
	for (const arm of kindIdArms) lines.push(`    ${arm}`);
	lines.push(`                }`);
	lines.push(`            }`);
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
			`${enumName}: expected u16 kind_id or object with $type`
		)})),`
	);
	lines.push(`        }`);
	return lines;
}

interface AliasLeafTrial {
	readonly typeName: string;
	readonly variant: string;
}

function emitAliasUnwrapRecurseArm(
	aliasId: number,
	enumName: string,
	errorLabel: string,
	leafTrials: readonly AliasLeafTrial[] = []
): string[] {
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
	for (const trial of leafTrials) {
		arms.push(
			`                    if let Ok(v) = ${trial.typeName}::from_napi_value(env, napi_val) { return Ok(Self::${trial.variant}(v)); }`
		);
	}
	arms.push(
		`                    Err(::napi::Error::from_reason(${JSON.stringify(
			`${errorLabel} kind id ${aliasId} in ${enumName}: no kind-keyed child slot to unwrap`
		)}))`
	);
	arms.push(`                },`);
	return arms;
}

function aliasLeafTrialOrder(node: AssembledNode): number {
	if (node instanceof AssembledEnum) return 0;
	if (node instanceof AssembledKeyword) return 1;
	if (node instanceof AssembledToken) return 2;
	if (node instanceof AssembledPattern) return 3;
	return -1;
}

function supertypeClosureOf(kinds: readonly string[], nodeMap: NodeMap): Set<string> {
	const seen = new Set<string>();
	const queue = [...kinds];
	while (queue.length > 0) {
		const kind = queue.pop()!;
		if (seen.has(kind)) continue;
		seen.add(kind);
		const node = nodeMap.nodes.get(kind);
		if (node instanceof AssembledSupertype) queue.push(...node.subtypeNames);
	}
	return seen;
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

	const isBoxed = (subKind: string, subNode: AssembledNode): boolean =>
		boxedInEnum(subKind, ownerKind, subNode, nodeMap);

	const emitDecodeTrials = (leafOnly = false, indent = '                '): string[] => {
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

	lines.push(`#[derive(Debug, Clone)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const { subKind, subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		const typeName = rustTransportStructName(subNode);
		const variantType = isBoxed(subKind, subNode) ? `Box<${typeName}>` : typeName;
		lines.push(`    ${variant}(${variantType}),`);
	}
	lines.push(`}`);
	lines.push(``);

	if (kindIdByKind !== undefined) {
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
			const selfAliasLeafTrials = validSubtypes
				.map(({ subKind, subNode }) => ({
					subKind,
					subNode,
					order: aliasLeafTrialOrder(subNode)
				}))
				.filter((t) => t.order >= 0)
				.sort((a, b) => a.order - b.order)
				.map((t) => ({ typeName: rustTransportStructName(t.subNode), variant: rustTypeIdent(t.subNode.typeName) }));
			for (const aliasId of selfAliasIds ?? []) {
				if (emittedIds.has(aliasId)) continue;
				emittedIds.add(aliasId);
				arms.push(...emitAliasUnwrapRecurseArm(aliasId, enumName, 'self-alias', selfAliasLeafTrials));
			}
			for (const { subKind, subNode } of validSubtypes) {
				const variant = rustTypeIdent(subNode.typeName);
				const typeName = rustTransportStructName(subNode);
				const acceptedIds = resolveAcceptedTransportIds({
					kind: subKind,
					node: subNode,
					nodeMap,
					kindIdByKind,
					kindEntries,
					parseName: parseNames.get(subKind)
				});
				assertRoutableTransportIds(
					acceptedIds,
					subKind,
					variant,
					enumName,
					`under supertype '${ownerKind}'`,
					kindEntries
				);
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
		lines.push(...emitTransportEnumFromNapiValueBody(enumName, kindIdArms));
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

	lines.push(...renderBoxedEnumNapiImpls(enumName));

	lines.push(`fn ${rustSnakeIdent(supertypeNode.typeName)}_transport_to_any(t: ${enumName}) -> AnyTransport {`);
	lines.push(`    match t {`);
	for (const { subKind, subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		const boxed = isBoxed(subKind, subNode);
		if (subNode instanceof AssembledSupertype) {
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
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

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

	lines.push(`fn ${fnName}(t: &${enumName}, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {`);
	lines.push(`    match t {`);
	for (const { subKind, subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		const innerExpr = boxedInEnum(subKind, ownerKind, subNode, nodeMap) ? `inner.as_ref()` : `inner`;
		lines.push(`        ${enumName}::${variant}(inner) => ${innerExpr}.render_into(dest),`);
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
	if (!(node instanceof AssembledSupertype)) return [kind];
	const concreteKinds = new Set<string>();
	for (const subtype of node.subtypeNames) {
		for (const concreteKind of collectConcreteTransportKinds(subtype, nodeMap, seen)) {
			concreteKinds.add(concreteKind);
		}
	}
	return [...concreteKinds];
}

function collectConcreteTransportKindIds(kind: string, nodeMap: NodeMap, seen: Set<string> = new Set()): number[] {
	if (seen.has(kind)) return [];
	seen.add(kind);
	const node = nodeMap.nodes.get(kind);
	if (node === undefined || !(node instanceof AssembledSupertype)) return [];
	const ids = new Set<number>();
	for (const subtype of node.subtypes) {
		if (subtype.storageKindId !== undefined) {
			ids.add(subtype.storageKindId);
			continue;
		}
		if (!isNodeRef(subtype)) continue;
		const name = storageKindOfRef(subtype.node);
		for (const nestedId of collectConcreteTransportKindIds(name, nodeMap, seen)) ids.add(nestedId);
	}
	return [...ids];
}

interface AcceptedTransportIdsInput {
	kind: string;
	node: AssembledNode;
	nodeMap: NodeMap;
	kindIdByKind: ReadonlyMap<string, number>;
	kindEntries?: readonly KindEnumEntry[];
	stampedIds?: readonly number[];
	parseAliases?: Readonly<Record<string, string>>;
	parseName?: string;
}

const DBG_KINDID_FASTPATH = process.env.DBG_KINDID_FASTPATH === '1';
let literalKindIdFastPathHits = 0;
let literalKindIdFallbackHits = 0;
let transportIdsFastPathHits = 0;
let transportIdsFallbackHits = 0;
let kindidFastPathDumpRegistered = false;
function registerKindIdFastPathDump(): void {
	if (kindidFastPathDumpRegistered) return;
	kindidFastPathDumpRegistered = true;
	process.once('exit', () => {
		writeSync(
			2,
			`[DBG_KINDID_FASTPATH] resolveLiteralKindId: stamp=${literalKindIdFastPathHits} fallback=${literalKindIdFallbackHits}; ` +
				`resolveAcceptedTransportIds: stamp=${transportIdsFastPathHits} fallback=${transportIdsFallbackHits}\n`
		);
	});
}

function resolveAcceptedTransportIds(input: AcceptedTransportIdsInput): number[] {
	const { kind, node, nodeMap, kindIdByKind, kindEntries, stampedIds, parseAliases, parseName } = input;
	if (DBG_KINDID_FASTPATH) registerKindIdFastPathDump();
	let acceptedIds: number[];
	if (stampedIds !== undefined) {
		if (DBG_KINDID_FASTPATH) transportIdsFastPathHits++;
		acceptedIds = [...stampedIds];
	} else {
		if (DBG_KINDID_FASTPATH) transportIdsFallbackHits++;
		const nameKeyedIds = [
			...new Set<string>([
				...collectConcreteTransportKinds(kind, nodeMap),
				...acceptedTransportKinds(kind, nodeMap, parseAliases)
			])
		]
			.map((k) => kindIdByKind.get(k))
			.filter((id): id is number => id !== undefined);
		acceptedIds = [...new Set([...nameKeyedIds, ...collectConcreteTransportKindIds(kind, nodeMap)])];
	}
	if (parseName !== undefined && kindEntries !== undefined) {
		const parseEntry = findKindEntry(kindEntries, parseName);
		const parseId = parseEntry?.parseId ?? parseEntry?.id;
		if (parseId !== undefined) acceptedIds.push(parseId);
		const storageId = findKindEntry(kindEntries, kind)?.id;
		if (storageId !== undefined && !acceptedIds.includes(storageId)) acceptedIds.push(storageId);
	}
	if (node instanceof AssembledEnum) {
		acceptedIds.push(...enumMemberAcceptedIds(node));
	}
	if (node.modelType === 'pattern' && node.fixedLiteralText !== undefined && kindEntries !== undefined) {
		const literalId = findKindEntryForLiteral(kindEntries, node.fixedLiteralText)?.id;
		if (literalId !== undefined) acceptedIds.push(literalId);
	}
	const terminalIds = nodeMap?.terminalAliasWireIds?.get(kind);
	if (terminalIds !== undefined) {
		for (const id of terminalIds) if (!acceptedIds.includes(id)) acceptedIds.push(id);
	}
	return acceptedIds;
}

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
		if (!(node instanceof AssembledSupertype)) return;
		for (const concreteKind of collectConcreteTransportKinds(kind, nodeMap)) {
			includeKind(concreteKind);
		}
	};

	for (const kind of kinds) {
		includeKind(kind);
	}

	return expanded;
}

interface SlotEmissionMetadata {
	readonly multipleByName: Map<string, boolean>;
	readonly requiredByName: Map<string, boolean>;
	readonly storageByName: Map<string, string>;
	readonly separatorByName: Map<string, string>;
	readonly trailingModeByName: Map<string, 'mandatory' | 'optional' | 'none'>;
	readonly leadingModeByName: Map<string, 'mandatory' | 'optional' | 'none'>;
	readonly unnamedNames: Set<string>;
}

function collectSlotEmissionMetadata(
	node: AssembledNode | undefined,
	slotModel: ReturnType<typeof renderSlotModelOf>
): SlotEmissionMetadata {
	const multipleByName = new Map<string, boolean>();
	const requiredByName = new Map<string, boolean>();
	const storageByName = new Map<string, string>();
	const separatorByName = new Map<string, string>();
	const trailingModeByName = new Map<string, 'mandatory' | 'optional' | 'none'>();
	const leadingModeByName = new Map<string, 'mandatory' | 'optional' | 'none'>();
	const unnamedNames = new Set<string>();
	if (node) {
		for (const f of [...slotModel.named, ...slotModel.unnamed]) {
			const mul = isMultiple(f);
			const req = isRequired(f);
			multipleByName.set(f.name, mul);
			requiredByName.set(f.name, req);
			storageByName.set(f.name, f.storageName);
			if (f.trailingDelimiter !== 'none') trailingModeByName.set(f.name, f.trailingDelimiter);
			if (f.leadingDelimiter !== 'none') leadingModeByName.set(f.name, f.leadingDelimiter);
			for (const v of f.values) {
				if (v.separator) {
					separatorByName.set(f.name, v.separator);
					break;
				}
			}
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
					if (storageByName.get(alias) === f.storageName) {
						unnamedNames.add(alias);
					}
				}
			}
		}
	}
	return {
		multipleByName,
		requiredByName,
		storageByName,
		separatorByName,
		trailingModeByName,
		leadingModeByName,
		unnamedNames
	};
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

function isImmediateLeafKind(kind: string, nodeMap: NodeMap): boolean {
	const node = nodeMap.nodes.get(kind);
	return node instanceof AssembledLeaf && node.immediate;
}

function slotVerbatimIsImmediate(slot: AssembledNonterminal, nodeMap: NodeMap): boolean {
	let sawScalarSource = false;
	for (const v of slot.values) {
		if (isTerminalValue(v)) {
			sawScalarSource = true;
			if (v.immediate !== true) return false;
		} else if (isNodeRef(v)) {
			const kind = storageKindOfValue(v);
			if (kind === undefined) continue;
			const node = nodeMap.nodes.get(kind);
			if (node instanceof AssembledLeaf) {
				sawScalarSource = true;
				if (!node.immediate) return false;
			}
		}
	}
	return sawScalarSource;
}

function collectPerSlotChildEnums(nodes: readonly AssembledNode[], nodeMap: NodeMap): PerSlotChildEnum[] {
	const entries: PerSlotChildEnum[] = [];
	const seen = new Set<string>();
	const reservedTransportNames = new Set<string>();
	for (const node of nodes) {
		reservedTransportNames.add(rustTransportStructName(node));
	}

	const consider = (typeName: string, ownerKind: string, field: AssembledNonterminal): void => {
		const slotKinds: string[] = [];
		const literalSet = new Set<string>();
		const literals: TransportLiteral[] = [];
		for (const component of fieldTypeComponents(field, nodeMap)) {
			if (component.kind === 'nodeKind') {
				if (!slotKinds.includes(component.rawKind)) slotKinds.push(component.rawKind);
				continue;
			}
			if (component.kind !== 'literal') continue;
			const literalKind = component.rawKind ?? component.value;
			const key = `${literalKind}\0${component.value}`;
			if (literalSet.has(key)) continue;
			literalSet.add(key);
			literals.push({
				kind: literalKind,
				text: component.value,
				resolvedKindId: component.resolvedKindId,
				immediate: component.immediate
			});
		}
		const hasMixedContent = slotKinds.length > 0 && literals.length > 0;
		const cls = hasMixedContent ? ({ tag: 'heterogeneous' } as const) : classifySlotForEmit(slotKinds, nodeMap);
		if (cls.tag !== 'heterogeneous') return;
		if (!hasAnyConcreteChildKind(slotKinds, nodeMap) && literals.length === 0) return;
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
		for (const field of [...slotModel.named, ...slotModel.unnamed]) {
			consider(node.typeName, node.kind, field);
		}
	}
	return entries;
}

function resolveLiteralKindId(
	literal: TransportLiteral,
	kindEntries: readonly KindEnumEntry[] | undefined,
	kindIdByKind?: ReadonlyMap<string, number>
): number | undefined {
	if (DBG_KINDID_FASTPATH) registerKindIdFastPathDump();
	if (literal.resolvedKindId !== undefined) {
		if (DBG_KINDID_FASTPATH) literalKindIdFastPathHits++;
		return literal.resolvedKindId;
	}
	if (DBG_KINDID_FASTPATH) literalKindIdFallbackHits++;
	if (kindEntries === undefined) return kindIdByKind?.get(literal.kind);
	const byText = (): number | undefined => findKindEntryForLiteral(kindEntries, literal.text)?.id;
	const byKind = (): number | undefined => findKindEntry(kindEntries, literal.kind)?.id;
	const isKindDerived = literal.kind !== literal.text;
	const id = isKindDerived ? (byKind() ?? byText()) : (byText() ?? byKind());
	if (id === undefined && isKindDerived && hasCatalogEntry(kindEntries, literal.kind)) {
		throw new Error(
			`resolveLiteralKindId: kind-derived literal '${literal.kind}' (text ${JSON.stringify(literal.text)}) ` +
				`has a catalog entry but resolved zero routable ids — neither the mint stamp, kind-name lookup, ` +
				`nor text lookup found one`
		);
	}
	return id;
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

	const validKinds = expandConcreteTransportKinds(entry.kinds, nodeMap);

	const isBoxed = (variantKind: string, variantNode: AssembledNode): boolean =>
		boxedInEnum(variantKind, ownerKind, variantNode, nodeMap);

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
	lines.push(`}`);
	lines.push(``);

	if (kindIdByKind !== undefined) {
		const kindIdArms: string[] = [];
		const emittedIds = new Set<number>();
		for (const literal of entry.literals) {
			const id = resolveLiteralKindId(literal, kindEntries, kindIdByKind);
			const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
			if (id === undefined || variant === undefined || emittedIds.has(id)) continue;
			emittedIds.add(id);
			kindIdArms.push(`                ${id} => Ok(Self::${variant}),`);
		}
		const enumArmsFirst = [...validKinds].sort(
			(a, b) => Number(b.node instanceof AssembledEnum) - Number(a.node instanceof AssembledEnum)
		);
		for (const { kind, node, concreteName } of enumArmsFirst) {
			const variant = rustTypeIdent(node.typeName);
			const typeName = concreteName;
			const acceptedIds = resolveAcceptedTransportIds({
				kind,
				node,
				nodeMap,
				kindIdByKind,
				kindEntries,
				stampedIds: entry.acceptedIdsByKind.get(kind),
				parseAliases: entry.parseAliases
			});
			assertRoutableTransportIds(
				acceptedIds,
				kind,
				variant,
				enumName,
				`in ${ownerKind}.${entry.fieldName}`,
				kindEntries
			);
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
		const kindsClosure = supertypeClosureOf(entry.kinds, nodeMap);
		const validKindSet = new Map(validKinds.map((v) => [v.kind, v] as const));
		const aliasPairs: Record<string, string> = { ...entry.parseAliases };
		for (const closureKind of kindsClosure) {
			const closureNode = nodeMap.nodes.get(closureKind);
			if (!(closureNode instanceof AssembledSupertype)) continue;
			for (const [storage, parse] of Object.entries(closureNode.subtypeParseNames ?? {})) {
				aliasPairs[parse] ??= storage;
			}
		}
		for (const [parseName, storageKind] of Object.entries(aliasPairs)) {
			if (!kindsClosure.has(storageKind)) continue;
			if (!(nodeMap.nodes.get(storageKind) instanceof AssembledSupertype)) continue;
			const parseEntry = kindEntries !== undefined ? findKindEntry(kindEntries, parseName) : undefined;
			const aliasId = parseEntry?.parseId ?? parseEntry?.id ?? kindIdByKind.get(parseName);
			if (aliasId === undefined || emittedIds.has(aliasId)) continue;
			emittedIds.add(aliasId);
			const leafTrials = expandConcreteTransportKinds([storageKind], nodeMap)
				.map((e) => ({ e, order: aliasLeafTrialOrder(e.node), own: validKindSet.get(e.kind) }))
				.filter((t) => t.order >= 0 && t.own !== undefined)
				.sort((a, b) => a.order - b.order)
				.map((t) => ({ typeName: t.own!.concreteName, variant: rustTypeIdent(t.own!.node.typeName) }));
			kindIdArms.push(...emitAliasUnwrapRecurseArm(aliasId, enumName, 'alias-wrapper', leafTrials));
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
		lines.push(...emitTransportEnumFromNapiValueBody(enumName, kindIdArms));
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

	lines.push(...renderBoxedEnumNapiImpls(enumName));

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
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	lines.push(`impl RenderableTransport for ${enumName} {`);
	lines.push(`    fn render_into(`);
	lines.push(`        &self,`);
	lines.push(`        dest: &mut dyn ::std::fmt::Write,`);
	lines.push(`    ) -> Result<(), ::askama::Error> {`);
	lines.push(`        match self {`);
	for (const { kind, node } of validKinds) {
		const variant = rustTypeIdent(node.typeName);
		const innerExpr = isBoxed(kind, node) ? 'inner.as_ref()' : 'inner';
		const call = `${innerExpr}.render_into(dest)`;
		const arm =
			!(node instanceof AssembledLeaf) && isLeftImmediateKind(kind, nodeMap)
				? `{ ::sittir_core::spacing::mark_adjacent(); ${call} }`
				: call;
		lines.push(`            ${enumName}::${variant}(inner) => ${arm},`);
	}
	for (const literal of entry.literals) {
		const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
		if (variant !== undefined) {
			const arm =
				literal.immediate === true || isImmediateLeafKind(literal.kind, nodeMap)
					? `{ ::sittir_core::spacing::mark_adjacent(); dest.write_str(${JSON.stringify(literal.text)}).map_err(::askama::Error::from) }`
					: `dest.write_str(${JSON.stringify(literal.text)}).map_err(::askama::Error::from)`;
			lines.push(`            ${enumName}::${variant} => ${arm},`);
		}
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
	const kindIdByKind = buildKindIdByKind(kindEntries);

	const lines: string[] = [];

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

	const emittedNodeIds = new Set<number>();
	for (const node of nodes) {
		const id = kindIdByKind.get(node.kind);
		if (id === undefined) continue;
		if (emittedNodeIds.has(id)) continue;
		emittedNodeIds.add(id);
		const variant = rustTransportVariantName(node);
		const structName = rustTransportStructName(node);
		const constName = toScreamingSnakeCase(kindIdMemberName(nodeMap, node.kind), node.kind);
		lines.push(`                // kind: ${node.kind} (${constName})`);
		lines.push(`                ${id} => Ok(AnyTransport::${variant}(`);
		lines.push(`                    ${structName}::from_napi_value(env, napi_val)?`);
		lines.push(`                )),`);
	}

	for (const [index, literal] of literals.entries()) {
		const id = resolveLiteralKindId(literal, kindEntries, kindIdByKind);
		if (id === undefined) continue;
		if (emittedNodeIds.has(id)) continue;
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
	lines.push('        Err(::napi::Error::from_reason(');
	lines.push('            "AnyTransport: expected u16 kind_id or object with $type",');
	lines.push('        ))');
	lines.push('    }');
	lines.push('}');

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

function renderTransportEntry(): string[] {
	return [
		'use ::sittir_core::types::Source as TransportSource;',
		'',
		'/// The render entry point. The root arrives in the same `SlotValue`',
		'/// carrier every slot position uses, so a root that is itself an',
		'/// unexpanded read stub reproduces its source instead of failing to',
		'/// deserialize as its own kind.',
		'pub type RenderRoot = ::sittir_core::SlotValue<AnyTransport>;',
		'',
		'pub fn render_transport_parts(transport: RenderRoot) -> Result<(TransportSource, String), ::askama::Error> {',
		'    let rendered = render_transport_dispatch(&transport)?;',
		'    Ok((TransportSource::Factory, rendered))',
		'}'
	];
}

function renderLiteralTransportStruct(_literals: readonly TransportLiteral[]): string[] {
	return [];
}

function emitTriviaKindIdArm(id: number, variant: string, structName: string): string[] {
	return [`                ${id} => Ok(Self::${variant}(${structName}::from_napi_value(env, napi_val)?)),`];
}

function renderTriviaTransportSupport(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): string[] {
	const extrasKindNames = nodeMap.extras ?? new Set<string>();
	const extrasNodes: AssembledNode[] = [];
	for (const kindName of extrasKindNames) {
		const node = nodeMap.nodes.get(kindName);
		if (node !== undefined) extrasNodes.push(node);
	}

	const lines: string[] = [];
	lines.push('#[derive(Debug, Clone)]');
	lines.push('pub enum TriviaTransport {');
	for (const node of extrasNodes) {
		lines.push(`    ${rustTransportVariantName(node)}(${rustTransportStructName(node)}),`);
	}
	lines.push('}');
	lines.push('');

	lines.push('impl RenderableTransport for TriviaTransport {');
	lines.push('    fn render_into(');
	lines.push('        &self,');
	lines.push('        dest: &mut dyn ::std::fmt::Write,');
	lines.push('    ) -> Result<(), ::askama::Error> {');
	lines.push('        match self {');
	for (const node of extrasNodes) {
		const variant = rustTransportVariantName(node);
		lines.push(`            TriviaTransport::${variant}(t) => t.render_into(dest),`);
	}
	lines.push('        }');
	lines.push('    }');
	lines.push('}');
	lines.push('');

	const kindIdByKind = kindEntries ? buildKindIdByKind(kindEntries) : undefined;
	const kindIdArms: string[] = [];
	for (const node of extrasNodes) {
		const id = kindIdByKind?.get(node.kind);
		if (id === undefined) continue;
		kindIdArms.push(...emitTriviaKindIdArm(id, rustTransportVariantName(node), rustTransportStructName(node)));
	}
	kindIdArms.push('                other => Err(::napi::Error::from_reason(format!(');
	kindIdArms.push('                    "unknown kind id {other} in TriviaTransport",');
	kindIdArms.push('                ))),');

	lines.push('#[cfg(feature = "napi-bindings")]');
	lines.push('impl ::napi::bindgen_prelude::FromNapiValue for TriviaTransport {');
	lines.push('    unsafe fn from_napi_value(');
	lines.push('        env: ::napi::sys::napi_env,');
	lines.push('        napi_val: ::napi::sys::napi_value,');
	lines.push('    ) -> ::napi::Result<Self> {');
	lines.push(...emitTransportEnumFromNapiValueBody('TriviaTransport', kindIdArms));
	lines.push('    }');
	lines.push('}');
	lines.push('');

	lines.push('#[cfg(feature = "napi-bindings")]');
	lines.push('impl ::napi::bindgen_prelude::ToNapiValue for TriviaTransport {');
	lines.push('    unsafe fn to_napi_value(');
	lines.push('        env: ::napi::sys::napi_env,');
	lines.push('        _val: Self,');
	lines.push('    ) -> ::napi::Result<::napi::sys::napi_value> {');
	lines.push('        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())');
	lines.push('    }');
	lines.push('}');
	lines.push('');

	lines.push('#[derive(Debug, Clone, Default)]');
	lines.push('pub struct TransportTrivia {');
	lines.push('    pub leading: Option<Vec<::sittir_core::SlotValue<TriviaTransport>>>,');
	lines.push('    pub trailing: Option<Vec<::sittir_core::SlotValue<TriviaTransport>>>,');
	lines.push('}');
	lines.push('');
	lines.push('#[cfg(feature = "napi-bindings")]');
	lines.push('impl ::napi::bindgen_prelude::FromNapiValue for TransportTrivia {');
	lines.push('    unsafe fn from_napi_value(');
	lines.push('        env: ::napi::sys::napi_env,');
	lines.push('        napi_val: ::napi::sys::napi_value,');
	lines.push('    ) -> ::napi::Result<Self> {');
	lines.push('        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;');
	lines.push('        let leading: Option<Vec<::sittir_core::SlotValue<TriviaTransport>>> = obj.get("leading")?;');
	lines.push('        let trailing: Option<Vec<::sittir_core::SlotValue<TriviaTransport>>> = obj.get("trailing")?;');
	lines.push('        Ok(TransportTrivia { leading, trailing })');
	lines.push('    }');
	lines.push('}');
	lines.push('');
	lines.push('#[cfg(feature = "napi-bindings")]');
	lines.push('impl ::napi::bindgen_prelude::ToNapiValue for TransportTrivia {');
	lines.push('    unsafe fn to_napi_value(');
	lines.push('        env: ::napi::sys::napi_env,');
	lines.push('        _val: Self,');
	lines.push('    ) -> ::napi::Result<::napi::sys::napi_value> {');
	lines.push('        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())');
	lines.push('    }');
	lines.push('}');
	lines.push('');
	lines.push('#[cfg(feature = "napi-bindings")]');
	lines.push('impl ::napi::bindgen_prelude::ValidateNapiValue for TransportTrivia {}');
	lines.push('');
	lines.push('#[cfg(feature = "napi-bindings")]');
	lines.push('impl ::napi::bindgen_prelude::TypeName for TransportTrivia {');
	lines.push("    fn type_name() -> &'static str {");
	lines.push('        "TransportTrivia"');
	lines.push('    }');
	lines.push('    fn value_type() -> ::napi::ValueType {');
	lines.push('        ::napi::ValueType::Object');
	lines.push('    }');
	lines.push('}');
	lines.push('');

	return lines;
}

function leafBooleanPresenceLiteral(node: AssembledNode, nodeMap: NodeMap): string | undefined {
	if (node.modelType !== 'token') return undefined;
	const literal = node.text;
	if (!literal) return undefined;
	for (const [, owner] of nodeMap.nodes) {
		for (const field of owner.slots) {
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
	const isLeafNode = node.modelType === 'pattern' || node.modelType === 'token';
	const lines: string[] = [];
	if (!isLeafNode) {
		lines.push('#[cfg_attr(feature = "napi-bindings", napi(object))]');
	}
	lines.push('#[derive(Debug, Clone)]');
	lines.push(`pub struct ${structName} {`);
	const isCompoundNode =
		node.modelType === 'branch' ||
		node.modelType === 'envelope' ||
		node.modelType === 'list' ||
		(node.modelType === 'polymorph' && !(node instanceof AssembledSupertype));
	if (isCompoundNode) {
		lines.push(...renderTransportMetadataFields(true));
		for (const field of [...slotModel.named, ...slotModel.unnamed]) {
			lines.push(...renderTransportField(field, node.kind, node.typeName, nodeMap));
		}
		{
			const emittedStorageNames = new Set([
				...slotModel.named.map((f) => f.storageName),
				...slotModel.unnamed.map((f) => f.storageName)
			]);
			for (const unnamedSlot of slotModel.unnamed) {
				if (isMultiple(unnamedSlot)) continue;
				const aliasVisible = unnamedSlot.values.some(
					(v) => v.parseKind?.name !== undefined && !v.parseKind.name.startsWith('_')
				);
				if (aliasVisible) continue;
				const helperNodeName = `_${unnamedSlot.name}`;
				const helperNode = nodeMap.nodes.get(helperNodeName);
				if (helperNode === undefined) continue;
				const helperSlots = helperNode.slots;
				for (const innerSlot of helperSlots) {
					if (innerSlot.isUnnamed) continue;
					if (emittedStorageNames.has(innerSlot.storageName)) continue;
					lines.push(...renderTransportField(innerSlot, helperNode.kind, helperNode.typeName, nodeMap, true));
					emittedStorageNames.add(innerSlot.storageName);
				}
			}
			if (node instanceof AssembledList) {
				if (node.leadingDelimiter === 'optional' || node.trailingDelimiter === 'optional') {
					lines.push(
						'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_delimiter"))]',
						'    pub delimiter: Option<u8>,'
					);
				}
				if (node.separatorRule !== undefined) {
					lines.push(
						'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_separator"))]',
						'    pub separator_kind: Option<u16>,'
					);
				}
			}
		}
	} else if (node.modelType === 'pattern' || node.modelType === 'token' || node.modelType === 'enum') {
		lines.push(...renderLeafTransportPlainFields());
	}
	lines.push('}');
	lines.push('');
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
	if (isLeafNode) {
		const leafNamed = !(node instanceof AssembledToken);
		lines.push(
			...renderLeafTransportNapiImpls(
				structName,
				leafNamed,
				leafDefaultTextLiteral(node),
				leafBooleanPresenceLiteral(node, nodeMap)
			)
		);
	}
	lines.push(...renderBoxedEnumNapiImpls(structName));
	return lines;
}

function declareLeafTriviaCapture(): string {
	return `        let mut __trivia: Option<TransportTrivia> = None;`;
}

function renderLeafTransportNapiImpls(
	structName: string,
	named: boolean,
	defaultTextLiteral?: string,
	booleanLiteral?: string
): string[] {
	const lines: string[] = [];

	lines.push(`#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]`);
	lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${structName} {`);
	lines.push(`    unsafe fn from_napi_value(`);
	lines.push(`        env: ::napi::sys::napi_env,`);
	lines.push(`        napi_val: ::napi::sys::napi_value,`);
	lines.push(`    ) -> ::napi::Result<Self> {`);
	lines.push(declareLeafTriviaCapture());
	lines.push(`        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {`);
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
	lines.push(`                __trivia = obj.get("$triviaData")?;`);
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
		} else if (f.rustName === 'transport_trivia_data') {
			lines.push(`            transport_trivia_data: __trivia,`);
		} else {
			lines.push(`            ${f.rustName}: None,`);
		}
	}
	lines.push(`            text,`);
	lines.push(`        })`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');

	lines.push(`#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]`);
	lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${structName} {`);
	lines.push(`    unsafe fn from_napi_value(`);
	lines.push(`        env: ::napi::sys::napi_env,`);
	lines.push(`        napi_val: ::napi::sys::napi_value,`);
	lines.push(`    ) -> ::napi::Result<Self> {`);
	if (booleanLiteral !== undefined) {
		lines.push(`        match ::sittir_core::slot::transport_value_type(env, napi_val)? {`);
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
	if (node.modelType === 'token') return node.text || undefined;
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
	{ jsName: '$triviaData', rustName: 'transport_trivia_data', rustType: 'Option<TransportTrivia>' }
];

const TRANSPORT_TEXT_FIELD: TransportMetadataField = {
	jsName: '$text',
	rustName: 'transport_text',
	rustType: 'Option<String>'
};

function renderTransportMetadataFields(includeText: boolean): string[] {
	const lines: string[] = [];
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
	forceOptional = false
): string[] {
	const lines: string[] = [];
	const rustName = rustFieldIdent(field.storageName);
	lines.push(`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(`_${field.storageName}`)}))]`);
	const required = forceOptional ? false : isRequired(field);
	const primitive = classifyPrimitiveField(field, nodeMap);
	const adjacent = slotVerbatimIsImmediate(field, nodeMap);
	const primitiveType =
		primitive?.kind === 'boolean'
			? 'Option<bool>'
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
				{ required, multiple: isMultiple(field), optionalElement: hasOptionalElements(field), adjacent },
				parentKind,
				typeName,
				field.name,
				slotLiteralValues(field)
			)
		},`
	);
	return lines;
}

function slotCarrier(inner: string, adjacent: boolean): string {
	return adjacent ? `::sittir_core::SlotValue<${inner}, true>` : `::sittir_core::SlotValue<${inner}>`;
}

function rustTransportSlotType(
	slotKinds: readonly string[],
	nodeMap: NodeMap,
	cardinality: { required: boolean; multiple: boolean; optionalElement?: boolean; adjacent: boolean },
	parentKind: string,
	typeName: string,
	fieldName: string,
	literalTexts: readonly string[] = []
): string {
	const { required, multiple, optionalElement, adjacent } = cardinality;
	const hasMixedContent = slotKinds.length > 0 && literalTexts.length > 0;
	const cls = hasMixedContent ? ({ tag: 'heterogeneous' } as const) : classifySlotForEmit(slotKinds, nodeMap);

	const scc = nodeMap.scc;
	let reachableKinds: readonly string[] = [];
	if (!multiple && scc !== undefined) {
		if (cls.tag === 'concrete') {
			reachableKinds = [cls.kind];
		} else if (cls.tag === 'supertype') {
			const supertypeKind = findSupertypeKindByTypeName(cls.supertypeName, nodeMap);
			reachableKinds = supertypeKind !== undefined ? [supertypeKind] : slotKinds;
		} else {
			reachableKinds = slotKinds;
		}
	}
	const createsBackEdge = scc !== undefined && reachableKinds.some((k) => scc.sameSCC(parentKind, k));

	const wrap = (inner: string): string => {
		if (multiple) {
			const element = slotCarrier(inner, adjacent);
			const vec = optionalElement ? `Vec<Option<${element}>>` : `Vec<${element}>`;
			if (required) return vec;
			return `Option<${vec}>`;
		}
		const sized = slotCarrier(createsBackEdge ? `Box<${inner}>` : inner, adjacent);
		return required ? sized : `Option<${sized}>`;
	};

	switch (cls.tag) {
		case 'concrete': {
			const base = concreteTransportTypeName(cls.kind, nodeMap);
			if (base !== null) return wrap(base);
			return wrap(multiple ? 'AnyTransport' : 'Box<AnyTransport>');
		}
		case 'supertype': {
			return wrap(`${rustTypeIdent(cls.supertypeName)}Transport`);
		}
		case 'heterogeneous': {
			if (!hasAnyConcreteChildKind(slotKinds, nodeMap)) {
				return wrap(multiple ? 'AnyTransport' : 'Box<AnyTransport>');
			}
			return wrap(perSlotEnumName(typeName, fieldName));
		}
		default:
			return assertNever(cls);
	}
}

let supertypeKindByTypeNameCache: WeakMap<NodeMap, Map<string, string>> = new WeakMap();
function findSupertypeKindByTypeName(supertypeName: string, nodeMap: NodeMap): string | undefined {
	let map = supertypeKindByTypeNameCache.get(nodeMap);
	if (map === undefined) {
		map = new Map<string, string>();
		for (const [kind, node] of nodeMap.nodes) {
			if (node instanceof AssembledSupertype) {
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
		if (node instanceof AssembledSupertype) {
			return null;
		}
		if (node instanceof AssembledEnum) {
			return enumTypeName(node);
		}
		return `${rustTypeIdent(node.typeName)}Transport`;
	}
	return null;
}

function perSlotEnumName(typeName: string, fieldName: string): string {
	const base = rustTypeIdent(typeName);
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

const LITERAL_TO_VARIANT_NAME: ReadonlyMap<string, string> = new Map([
	['+', 'Plus'],
	['-', 'Minus'],
	['*', 'Star'],
	['/', 'Slash'],
	['%', 'Percent'],
	['&', 'Amp'],
	['|', 'Pipe'],
	['^', 'Caret'],
	['~', 'Tilde'],
	['!', 'Bang'],
	['?', 'Question'],
	['==', 'EqEq'],
	['!=', 'BangEq'],
	['<', 'Lt'],
	['>', 'Gt'],
	['<=', 'LtEq'],
	['>=', 'GtEq'],
	['<<', 'LtLt'],
	['>>', 'GtGt'],
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
	['&&', 'AmpAmp'],
	['||', 'PipePipe'],
	['??', 'QuestionQuestion'],
	['..', 'DotDot'],
	['..=', 'DotDotEq'],
	['...', 'DotDotDot'],
	['?.', 'QuestionDot'],
	['=>', 'FatArrow'],
	['->', 'ThinArrow'],
	['=', 'Eq'],
	['.', 'Dot'],
	[',', 'Comma'],
	[';', 'Semi'],
	[':', 'Colon'],
	['::', 'ColonColon'],
	['@', 'At'],
	['#', 'Hash'],
	['$', 'Dollar'],
	['_', 'Underscore'],
	['(', 'LParen'],
	[')', 'RParen'],
	['[', 'LBracket'],
	[']', 'RBracket'],
	['{', 'LBrace'],
	['}', 'RBrace'],
	['</', 'LtSlash'],
	['true', 'True'],
	['false', 'False'],
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

	lines.push(`#[derive(Debug, Clone, Copy, PartialEq, Eq)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const v of values) {
		lines.push(`    ${literalToVariantName(v)},`);
	}
	lines.push(`}`);
	lines.push('');

	if (hasNapi) {
		lines.push(`#[cfg(feature = "napi-bindings")]`);
		lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${enumName} {`);
		lines.push(`    unsafe fn from_napi_value(`);
		lines.push(`        env: ::napi::sys::napi_env,`);
		lines.push(`        napi_val: ::napi::sys::napi_value,`);
		lines.push(`    ) -> ::napi::Result<Self> {`);

		if (kindEntries !== undefined) {
			const kindIdMatchArms = (indent: string): void => {
				for (const v of values) {
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
			lines.push(`        match ::sittir_core::slot::transport_value_type(env, napi_val)? {`);
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
