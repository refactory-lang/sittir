import type { SlotBearingCompound } from '../compiler/model/node-map.ts';
import { parseSeamLabel, isDepthText, INDENT_TEXT, DEPTH_BREAK } from '../dsl/primitives/spacing.ts';
import { isFixedTextLeaf } from '../compiler/model/node-map.ts';
import { isVisibleTextLeaf, isHiddenPunctuationLeaf } from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { isAsciiIdentifier } from '../util/identifier-shape.ts';
import type { AssembledNode, RenderTemplateSurface, AssembledNonterminal } from '../compiler/model/node-map.ts';
import {
	AbstractAssembledCompound,
	AssembledPolymorph,
	AssembledEnum,
	AssembledKeyword,
	AssembledPattern,
	AssembledSupertype,
	AssembledPunctuation,
	AssembledLeaf,
	AssembledList,
	deriveUnnamedChildrenCardinality,
	hasOptionalElements,
	isMultiple,
	isRequired,
	isNodeRef,
	isTerminalValue,
	kindsOf,
	concreteKindsOf,
	aliasTargetToSourceMapOf,
	acceptedIdPairsByKindOf,
	storageKindOfRef,
	storageKindOfValue,
	isSurfaceHiddenIn,
	isLeftImmediateKind,
	isKindIdStored,
	fixedTextOfKind
} from '../compiler/model/node-map.ts';
import { assertNever } from '../polymorph-variant.ts';
import { computeBundleHash, type BundleFile } from './bundle-hash.ts';
import { renderModuleSrcDir } from './render-module-paths.ts';
import { type TransportLiteral } from './transport-projection.ts';
import { getTransportProjection } from './transport-projection-cache.ts';
import {
	RESERVED_SUPERTYPE_ENUM_NAMES,
	RUST_KEYWORDS,
	acceptedTransportKinds,
	classifySlotForEmit,
	findSupertypeKindByTypeName,
	rustFieldIdent,
	rustTypeIdent,
	supertypeTransportKinds,
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
	fieldTypeComponents,
	slotSeparatorTexts,
	compareOrdinal
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
import {
	carriesPerNodeValue,
	edgeKindId,
	seatTableName,
	seatedTableNames,
	edgeSitesOf,
	isKindEdge,
	planRenderOptions,
	renderOptionsRs,
	type RenderOptionsPlan,
	type SpacingSite,
	type DelimiterSite
} from './render-options-rs.ts';
import { displayNameOf } from '../compiler/model/display-name.ts';
import { collectSitePreferences, type SitePreference, type SpacingSide } from '../compiler/model/site-preferences.ts';
import type { OptionsConfig } from '../dsl/wire/options-block.ts';
import { addressTablesFor, EMPTY_ADDRESSES, type AddressTables } from './options.ts';
import {
	anonTokenNameOfText,
	tokenNameOfText,
	whitespaceTextOf,
	type RenderRules
} from '../compiler/model/render-rules.ts';
import {
	escapeBraces,
	liftGates,
	mentions,
	printRustBody,
	references,
	rustStringLiteral,
	isWhitespaceOnly,
	templateOf,
	type Body,
	type Flanks,
	type ViewKind
} from './render-body.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import type { CodegenEmitter } from './emitter.ts';
import { collectSeparatorCandidateKindNames } from './wrap.ts';
import type { Rule } from '../types/rule.ts';
import type { KindEntryLike } from '../compiler/generated-metadata.ts';
import type { GrammarName } from '../grammars.ts';


export interface RustRenderModuleEmit {
	hashRs: { path: string; contents: string };
	hashTs: { path: string; contents: string };
	transportRs: { path: string; contents: string };
	optionsRs: { path: string; contents: string };
	libRs: { path: string; contents: string };
}

export interface RenderModuleBundle {
	emit: RustRenderModuleEmit;
}

export interface RenderOptionsInputs {
	readonly renderRules?: RenderRules;
	readonly options?: OptionsConfig;
	readonly visibleExternals?: Readonly<Record<string, Rule<'evaluate'>>>;
	readonly kindEntries?: readonly KindEnumEntry[];
	readonly sites?: readonly SitePreference[];
	readonly addresses?: AddressTables;
}

export interface RenderModuleEmitterConfig extends RenderOptionsInputs {
	grammar: GrammarName;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
}

interface SynthesizeRenderModuleBundleConfig extends RenderOptionsInputs {
	grammar: GrammarName;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
	templates: EmittedTemplates;
}

function synthesizeRenderModuleBundle(config: SynthesizeRenderModuleBundleConfig): RenderModuleBundle {
	const {
		grammar,
		nodeMap,
		generatedIdTables,
		templates,
		renderRules,
		visibleExternals,
		options,
		kindEntries,
		sites,
		addresses
	} = config;
	return {
		emit: emitRenderModule(grammar, templates, nodeMap, generatedIdTables, {
			renderRules,
			visibleExternals,
			options,
			kindEntries,
			sites,
			addresses
		})
	};
}

export class RenderModuleEmitter implements CodegenEmitter<RenderModuleBundle, EmittedTemplates> {
	readonly #grammar: GrammarName;
	readonly #nodeMap: NodeMap;
	readonly #generatedIdTables?: GeneratedIdTables;
	readonly #options: RenderOptionsInputs;

	constructor(config: RenderModuleEmitterConfig) {
		this.#grammar = config.grammar;
		this.#nodeMap = config.nodeMap;
		this.#generatedIdTables = config.generatedIdTables;
		this.#options = {
			renderRules: config.renderRules,
			visibleExternals: config.visibleExternals,
			options: config.options,
			kindEntries: config.kindEntries,
			sites: config.sites,
			addresses: config.addresses
		};
	}

	emitLeaf(_node: AssembledPattern | AssembledKeyword | AssembledPunctuation | AssembledEnum): void {}

	emitBranch(_node: SlotBearingCompound): void {}

	finalize(templates: EmittedTemplates): RenderModuleBundle {
		return synthesizeRenderModuleBundle({
			grammar: this.#grammar,
			nodeMap: this.#nodeMap,
			generatedIdTables: this.#generatedIdTables,
			templates,
			...this.#options
		});
	}
}

function hashRsHeader(lang: GrammarName): string {
	return `// @generated from packages/${lang}/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${lang} --all --output packages/${lang}/src
//
// The SHA-256 digest of this render module's generated sources at codegen
// time. The grammar-owned \`sittir-${lang}\` native module exports it as
// \`SittirEngine.renderModuleHash\`; the backend shim
// (packages/${lang}/src/backend.ts) compares it against the TS-side copy to
// detect a native binary built from older generated code.
`;
}

function hashTsHeader(lang: GrammarName): string {
	return `// @generated from packages/${lang}/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${lang} --all --output packages/${lang}/src
//
// Companion to ${renderModuleSrcDir(lang)}/hash.rs; the two must agree at
// runtime for the native backend to be picked. A mismatch means the native
// binary predates the last regeneration.
`;
}

function generatedHeader(lang: GrammarName): string {
	return `// @generated from packages/${lang}/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${lang} --all --output packages/${lang}/src`;
}

function transportRsHeader(lang: GrammarName): string {
	return `${generatedHeader(lang)}
//
// Per-kind view structs and render bodies, AnyTransport enum + FromNapiValue
// impls + per-kind transport structs + typed dispatch
// (render_transport_dispatch) + transport bridge helpers.`;
}

type EmittedNonterminalView = 'scalar' | 'list' | 'field';

const RESERVED_TRANSPORT_STRUCT_NAMES = new Set(['AnyTransport', 'ProtectedTransport', 'LiteralTransport']);

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
	nodeMap: NodeMap
): EffectiveSupertypeTransportShape {
	const walk = supertypeTransportKinds(supertypeNode, nodeMap);
	const variantKindByName = new Map<string, string>();
	const subtypes: EffectiveSupertypeTransportSubtype[] = [];
	for (const subKind of walk.kinds) {
		const subNode = nodeMap.nodes.get(subKind);
		if (subNode === undefined) continue;
		const variantName = rustTypeIdent(subNode.typeName);
		const existingKind = variantKindByName.get(variantName);
		if (existingKind !== undefined && existingKind !== subKind) {
			throw new Error(
				`reserved supertype flattening collision: ${supertypeNode.kind} emits variant ${variantName} for both ${existingKind} and ${subKind}`
			);
		}
		variantKindByName.set(variantName, subKind);
		subtypes.push({ subKind, subNode });
	}
	return { subtypes, suppressedKinds: walk.suppressed, parseNames: walk.parseNames };
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
	kind: string;
	body: Body;
	flanks: ReadonlyMap<string, Flanks>;
	fields: EmittedField[];
	transportHasChildren: boolean;
	hasVariant: boolean;
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

function renderSlotAuditVariantsOf(node: SlotBearingCompound): readonly (readonly AssembledNonterminal[])[] {
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

function emitStruct(kind: string, node: AssembledNode | undefined, body: Body, nodeMap?: NodeMap): EmittedStruct {
	const surface = mergeTemplateSurfaceFromBody(body, buildSlotModelSurface(node));
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
	fields.sort((a, b) => compareOrdinal(a.name, b.name));
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
					f.backingInnerRequired = isTransportRequired(innerSlot);
					f.backingDirectField = innerSlot.storageName;
					break;
				}
			}
		}
	}
	const viewOf = (slotName: string): ViewKind => {
		const field = fields.find((f) => f.name === slotName);
		if (field === undefined) return 'text';
		if (field.view === 'list' || field.multiple) return 'list';
		return field.required ? 'single' : 'optional';
	};
	const lifted = liftGates(body, viewOf);
	return {
		kind,
		body: lifted.body,
		flanks: lifted.flanks,
		fields,
		transportHasChildren: slotModel.unnamed.length > 0,
		hasVariant: surface.usesVariant
	};
}

function mergeTemplateSurfaceFromBody(body: Body, surface: RenderTemplateSurface | undefined): RenderTemplateSurface {
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
	const refs = references(body);
	for (const name of refs.tests) {
		guarded.add(name);
		record(name, 'scalar');
	}
	for (const name of refs.slots) {
		record(name, 'scalar');
	}
	return {
		slots: [...byName.values()],
		usesChildren: (surface?.usesChildren ?? false) || mentions(body, 'children'),
		usesVariant: (surface?.usesVariant ?? false) || mentions(body, 'variant'),
		usesText: (surface?.usesText ?? false) || mentions(body, 'text')
	};
}

function buildSlotModelSurface(node: AssembledNode | undefined): RenderTemplateSurface {
	const slotModel = renderSlotModelOf(node);
	const slots = slotModel.named.map((slot) => ({
		name: slot.name,
		view: (isMultiple(slot) ? 'field' : 'scalar') as 'scalar' | 'list' | 'field',
		required: isTransportRequired(slot),
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
			if (sep === undefined && node instanceof AbstractAssembledCompound) {
				sep = node.separator ?? undefined;
			}
			if (sep !== undefined) separators.set(kind, sep);
		}
	}
	return { separators };
}

function literalWrite(valueExpr: string, fixed: string | undefined): string {
	if (fixed !== undefined && isDepthText(fixed)) {
		return fixed === INDENT_TEXT
			? `{ w.indent(); w.seam(${rustStringLiteral(DEPTH_BREAK)}); Ok::<(), ::sittir_core::render::RenderError>(()) }`
			: `{ w.dedent(${rustStringLiteral(DEPTH_BREAK)}); Ok::<(), ::sittir_core::render::RenderError>(()) }`;
	}
	if (fixed !== undefined && isWhitespaceOnly(fixed)) {
		return `{ w.token_seam(${valueExpr}); Ok::<(), ::sittir_core::render::RenderError>(()) }`;
	}
	return `w.text(${valueExpr})`;
}

function literalWriteArm(text: string, immediate: boolean): string {
	const tail = literalWrite(rustStringLiteral(text), text);
	return immediate ? `{ w.adjacent(); ${tail} }` : tail;
}

function buildSlotWriteCall(cls: SlotClass, expr: string): string {
	switch (cls.tag) {
		case 'concrete':
			return `if let Some(v) = ${expr}.transport_or_write(w)? { render_${rustSnakeIdent(cls.typeName)}(v, w)?; }`;
		case 'supertype':
			return `if let Some(v) = ${expr}.transport_or_write(w)? { render_${rustSnakeIdent(cls.supertypeName)}(v, w)?; }`;
		case 'heterogeneous':
			return `${expr}.render(w)?;`;
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
	kindIdByKind: ReadonlyMap<string, number> | undefined = undefined,
	plan: RenderPlan = EMPTY_PLAN,
	kindEntries: readonly KindEntryLike[] | undefined = undefined
): string[] {
	const structsByKind = new Map(structs.map((s) => [s.kind, s]));
	const lines: string[] = [];

	for (const node of nodes) {
		lines.push(...renderTypedKindFn(node, structsByKind, meta, nodeMap, kindIdByKind, plan, kindEntries));
	}

	for (const [, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype)) continue;
		if (!usedSupertypeNames.has(node.typeName)) continue;
		const enumName = `${rustTypeIdent(node.typeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		lines.push(...emitSupertypeRenderHelper(node, nodeMap));
	}

	const wordTable = wordCharAsciiTable(nodeMap.wordMatcher ?? /\w/);
	const mergePairs = literalMergePairs(literals, kindEntries ?? []);
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
		`pub fn render_transport_dispatch(transport: &dyn ::sittir_core::render::Render, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<String, ::sittir_core::render::RenderError> {`
	);
	lines.push(`    let mut s = String::new();`);
	lines.push(
		`    let mut w = ::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER).with_table(&options::WHITESPACE).with_indent(&ctx.options.indent).with_sources(ctx.sources).with_options(ctx.options);`
	);
	lines.push(`    transport.render(&mut w)?;`);
	lines.push(`    w.finish()?;`);
	lines.push(`    Ok(s)`);
	lines.push(`}`);
	lines.push('');

	lines.push(
		...kindOfImplLines(
			'AnyTransport',
			nodes.map((node) => ({ variant: rustTransportVariantName(node), payload: true })),
			undefined,
			undefined,
			'false'
		)
	);
	lines.push(`impl ::sittir_core::render::Render for AnyTransport {`);
	lines.push(
		`    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	lines.push(`        match self {`);
	for (const node of nodes) {
		const variant = rustTransportVariantName(node);
		lines.push(`            AnyTransport::${variant}(t) => t.render(w),`);
	}
	for (const [index, literal] of literals.entries()) {
		const variant = rustLiteralTransportVariantName(literal, index);
		lines.push(
			`            AnyTransport::${variant} => ${literalWrite(rustStringLiteral(literal.text), literal.text)},`
		);
	}
	lines.push(`            AnyTransport::Verbatim(t) => t.render(w),`);
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
	kindIdByKind: ReadonlyMap<string, number> | undefined = undefined,
	plan: RenderPlan = EMPTY_PLAN,
	kindEntries: readonly KindEntryLike[] | undefined = undefined
): string[] {
	switch (node.modelType) {
		case 'branch':
		case 'envelope':
		case 'list': {
			const struct = structsByKind.get(node.kind);
			if (struct === undefined) {
				return renderTypedBranchFallbackFn(node, nodeMap);
			}
			return renderTypedBranchFn(node, struct, meta, nodeMap, kindIdByKind, plan, kindEntries);
		}
		case 'polymorph':
		case 'alias': {
			if (node instanceof AssembledSupertype) return [];
			const struct = structsByKind.get(node.kind);
			if (struct === undefined) {
				return renderTypedBranchFallbackFn(node, nodeMap);
			}
			return renderTypedBranchFn(node, struct, meta, nodeMap, kindIdByKind, plan, kindEntries);
		}
		case 'pattern':
		case 'keyword':
		case 'punctuation':
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
	lines.push(
		`fn ${fnName}(node: &${structName}, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	if (allSlots.length === 0) {
		lines.push(`    Ok(())`);
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
				if (isTransportRequired(slot)) {
					lines.push(`    for child in node.${slotIdent}.iter() {`);
				} else {
					lines.push(`    if let Some(items) = &node.${slotIdent} {`);
					lines.push(`        for child in items.iter() {`);
				}
				lines.push(`        ${writeChild}`);
				if (!isTransportRequired(slot)) {
					lines.push(`        }`);
				}
				lines.push(`    }`);
			} else if (isTransportRequired(slot)) {
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

function leafTextWrite(node: AssembledNode, on: string): string {
	return literalWrite(`&${on}.text`, fixedTextOfKind(node));
}

function isImmediateLeaf(node: AssembledNode): boolean {
	return node instanceof AssembledLeaf && node.immediate;
}

function leafRenderExpr(node: AssembledNode, on: string): string {
	const write = leafTextWrite(node, on);
	return isImmediateLeaf(node) ? `{ w.adjacent(); ${write} }` : write;
}

function renderTypedLeafFn(node: AssembledNode): string[] {
	const fnName = rustTypedRenderFnName(node.typeName);
	const typeName = rustTransportStructName(node);
	const body = node instanceof AssembledEnum ? `t.render(w)` : leafTextWrite(node, 't');
	const adjacent = isImmediateLeaf(node) ? [`    w.adjacent();`] : [];
	return [
		`fn ${fnName}(t: &${typeName}, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`,
		...adjacent,
		`    ${body}`,
		`}`,
		``
	];
}

function renderTypedBranchFn(
	node: AssembledNode,
	struct: EmittedStruct,
	meta: MetaData,
	nodeMap: NodeMap,
	kindIdByKind: ReadonlyMap<string, number> | undefined = undefined,
	plan: RenderPlan = EMPTY_PLAN,
	kindEntries: readonly KindEntryLike[] | undefined = undefined
): string[] {
	return [
		`fn ${rustTypedRenderFnName(node.typeName)}(node: &${rustTransportStructName(node)}, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`,
		...buildTypedTemplateBody(
			struct,
			meta.separators.get(node.kind) ?? '',
			nodeMap,
			renderSlotModelOf(node),
			node,
			kindIdByKind,
			plan,
			kindEntries
		),
		`}`,
		''
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
		`token: match node.separator_kind {`,
		...arms.map((arm) => `    ${arm}`),
		`    _ => ${fallbackSeparator},`,
		`},`
	];
}

function buildTypedTemplateBody(
	struct: EmittedStruct,
	separator: string,
	nodeMap: NodeMap | undefined = undefined,
	slotModel: RenderSlotModel | undefined = undefined,
	node: AssembledNode | undefined = undefined,
	kindIdByKind: ReadonlyMap<string, number> | undefined = undefined,
	plan: RenderPlan = EMPTY_PLAN,
	kindEntries: readonly KindEntryLike[] | undefined = undefined
): string[] {
	const lines: string[] = [];
	const sepLiteral = JSON.stringify(separator);

	const primitiveByName = new Map<string, PrimitiveFieldStorage>();
	if (nodeMap !== undefined && slotModel !== undefined) {
		for (const f of [...slotModel.named, ...slotModel.unnamed]) {
			const cls = classifyPrimitiveField(f, nodeMap);
			if (cls !== undefined) primitiveByName.set(f.name, cls);
		}
	}

	const bound = new Set<string>();
	const bind = (ident: string, expr: string): void => {
		bound.add(ident);
		lines.push(`    let ${ident} = ${expr};`);
	};
	if (struct.hasVariant) bind('variant', '""');

	for (const f of struct.fields) {
		const rIdent = rustFieldIdent(f.storageName);
		const ident = rustFieldIdent(f.name);
		const flanks = struct.flanks.get(f.name);
		const template = rustStringLiteral(templateOf(flanks));
		const primitive = primitiveByName.get(f.name);
		if (primitive?.kind === 'boolean') {
			const keyword = `${flanks?.prefix ?? ''}${primitive.text}${flanks?.suffix ?? ''}`;
			bind(ident, `View::new(&node.${rIdent}, ${rustStringLiteral(escapeBraces(keyword))})`);
			continue;
		}
		if (primitive?.kind === 'verbatim') {
			if (f.required) bind(ident, `&node.${rIdent}`);
			else bind(ident, `View::new(&node.${rIdent}, ${template})`);
			continue;
		}
		if (f.view === 'list' || f.multiple) {
			const items = !f.hasTransportField
				? 'NO_ITEMS'
				: f.required
					? `&node.${rIdent}`
					: `node.${rIdent}.as_deref().unwrap_or(&[])`;
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
			const separatorSite = separatedList === undefined ? undefined : separatorSiteOf(plan, separatedList);
			const fallback =
				separatorSite?.defaultText === undefined ? fieldSepLiteral : JSON.stringify(separatorSite.defaultText);
			const separatorMatchLines =
				separatedList?.separatorRule !== undefined
					? buildSeparatorKindMatchLines(separatedList.separatorRule, fallback, kindIdByKind)
					: undefined;
			const spacing = spacingFieldExprs(plan, node, f.name);
			const spaced = (site: string | undefined): string => (site === undefined ? '0' : `${site}.unwrap_or(0)`);
			bound.add(ident);
			lines.push(`    let ${ident} = ListView {`);
			lines.push(`        items: ${items},`);
			lines.push(`        template: ${template},`);
			if (separatorMatchLines !== undefined) {
				lines.push(...separatorMatchLines.map((l) => `        ${l}`));
			} else {
				lines.push(`        token: ${fieldSepLiteral},`);
			}
			lines.push(`        before: ${spaced(spacing.before)},`);
			lines.push(`        after: ${spaced(spacing.after)},`);
			lines.push(`        leading: ${leadingExpr},`);
			lines.push(`        trailing: ${trailingExpr},`);
			lines.push(`        head: ${spacing.head ?? 'None'},`);
			lines.push(`        tail: ${spacing.tail ?? 'None'},`);
			lines.push(`    };`);
			continue;
		}
		if (f.required) {
			bind(ident, f.hasTransportField ? `&node.${rIdent}` : '""');
			continue;
		}
		if (f.backingTransportField) {
			const backing = `node.${rustFieldIdent(f.backingTransportField)}.as_ref().and_then(|h| h.transport())`;
			const inner = f.backingInnerRequired ? `.map(|h| &h.${ident})` : `.and_then(|h| h.${ident}.as_ref())`;
			const value = f.backingDirectField
				? `node.${rustFieldIdent(f.backingDirectField)}.as_ref().or_else(|| ${backing}${inner})`
				: `${backing}${inner}`;
			bind(ident, `View::new(${value}, ${template})`);
			continue;
		}
		bind(
			ident,
			f.hasTransportField ? `View::new(&node.${rIdent}, ${template})` : `View::new(None::<&str>, ${template})`
		);
	}

	const seamFieldNames = new Set(
		(node === undefined ? [] : synthesizedSpacingSites(plan, node).filter((s) => s.side === 'seam')).map((site) =>
			rustFieldIdent(site.fieldIdent)
		)
	);

	const refs = references(struct.body);
	for (const name of [...refs.tests, ...refs.slots]) {
		if (bound.has(rustFieldIdent(name))) continue;
		throw new Error(
			`render body for '${struct.kind}' names '${name}', which its transport has no slot for (slots: ${struct.fields.map((f) => f.name).join(', ') || 'none'})`
		);
	}
	for (const name of refs.seams) {
		if (seamFieldNames.has(rustFieldIdent(name))) continue;
		throw new Error(
			`render body for '${struct.kind}' names seam '${name}', which its transport has no spacing site for`
		);
	}
	lines.push(
		...printRustBody(struct.body, {
			field: rustFieldIdent,
			edge: kindEdgeWriterOf(plan, node, kindEntries),
			site: (name) => {
				if (node === undefined)
					throw new Error(`render body for '${struct.kind}' names spacing site '${name}' without its node`);
				const owner = node.display.name;
				return `options::SITE_${toScreamingSnakeCase(owner, owner)}_${toScreamingSnakeCase(name, name)}`;
			},
			kinds: (names) => rustKindIdSlice(names, nodeMap, kindIdByKind, struct.kind)
		})
	);
	return lines;
}

function rustKindIdSlice(
	names: readonly string[],
	nodeMap: NodeMap | undefined,
	kindIdByKind: ReadonlyMap<string, number> | undefined,
	ownerKind: string
): string {
	if (nodeMap === undefined || kindIdByKind === undefined) {
		throw new Error(
			`render body for '${ownerKind}' gates a literal on kinds [${names.join(', ')}] but has no kind id table`
		);
	}
	const ids = new Set<number>();
	for (const name of names) {
		const direct = kindIdByKind.get(name);
		if (direct !== undefined) ids.add(direct);
		for (const concrete of concreteKindsOf(name, nodeMap)) {
			const id = kindIdByKind.get(concrete);
			if (id !== undefined) ids.add(id);
		}
	}
	if (ids.size === 0) {
		throw new Error(
			`render body for '${ownerKind}' gates a literal on kinds [${names.join(', ')}], none of which has a kind id`
		);
	}
	return `&[${[...ids]
		.sort((a, b) => a - b)
		.map((id) => `::sittir_core::types::KindId(${id})`)
		.join(', ')}]`;
}

function libRsContents(lang: GrammarName): string {
	return `// @generated from packages/${lang}/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${lang} --all --output packages/${lang}/src

pub mod hash;
pub mod kind_ids;
pub mod options;
pub mod transport;

pub use transport::{render_transport_dispatch, render_transport_parts, AnyTransport, RenderRoot};
pub use hash::RENDER_MODULE_HASH;
pub use kind_ids::*;
`;
}

export function emitHashFiles(
	lang: GrammarName,
	sources: readonly BundleFile[]
): {
	hashRs: RustRenderModuleEmit['hashRs'];
	hashTs: RustRenderModuleEmit['hashTs'];
} {
	const hash = computeBundleHash(sources);
	return {
		hashRs: {
			path: `${renderModuleSrcDir(lang)}/hash.rs`,
			contents: `${hashRsHeader(lang)}\npub const RENDER_MODULE_HASH: &str = "${hash}";\n`
		},
		hashTs: {
			path: `packages/${lang}/src/hash.ts`,
			contents: `${hashTsHeader(lang)}\nexport const RENDER_MODULE_HASH = '${hash}'\n`
		}
	};
}

type RenderPlan = RenderOptionsPlan;

interface PlannedRenderOptions {
	readonly plan: RenderPlan;
	readonly addresses: AddressTables;
	readonly kindEntries: readonly KindEnumEntry[];
}

const EMPTY_PLAN: RenderPlan = {
	spacingSites: [],
	sitePaths: [],
	delimiterSites: [],
	depthSites: [],
	indentId: 0,
	dedentId: 0,
	whitespaceText: []
};
const EMPTY_PLANNED_OPTIONS: PlannedRenderOptions = { plan: EMPTY_PLAN, addresses: EMPTY_ADDRESSES, kindEntries: [] };

function planRenderOptionsFor(
	nodeMap: NodeMap,
	generatedIdTables: GeneratedIdTables | undefined,
	inputs: RenderOptionsInputs
): PlannedRenderOptions {
	if (generatedIdTables === undefined || inputs.renderRules === undefined) return EMPTY_PLANNED_OPTIONS;
	const kindEntries =
		inputs.kindEntries ?? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);
	const sites =
		inputs.sites ??
		collectSitePreferences({ nodeMap, kindEntries, renderRules: inputs.renderRules, options: inputs.options });
	const plan = planRenderOptions(sites, kindEntries, nodeMap, whitespaceTextOf(inputs.visibleExternals, nodeMap));
	const addresses = inputs.addresses ?? addressTablesFor(nodeMap, kindEntries, sites, inputs.options);
	return { plan, addresses, kindEntries };
}

export function emitRenderModule(
	lang: GrammarName,
	templates: EmittedTemplates,
	nodeMap: NodeMap,
	generatedIdTables?: GeneratedIdTables,
	inputs: RenderOptionsInputs = {}
): RustRenderModuleEmit {
	const { plan, addresses, kindEntries: optionsKindEntries } = planRenderOptionsFor(nodeMap, generatedIdTables, inputs);
	const structs: EmittedStruct[] = [];
	for (const kind of [...templates.bodies.keys()].sort((a, b) => compareOrdinal(a, b))) {
		structs.push(emitStruct(kind, nodeMap.nodes.get(kind), templates.bodies.get(kind)!, nodeMap));
	}
	const meta = collectMetaData(nodeMap);
	const hasNumericDispatch = generatedIdTables !== undefined;

	const transportRs =
		[
			transportRsHeader(lang),
			'',
			commonRustUseImports(hasNumericDispatch),
			'use ::sittir_core::render_with_trivia;',
			'use ::sittir_core::options::Edged as _;',
			'use super::options;',
			'',
			renderTransportSupport(nodeMap, structs, meta, generatedIdTables, plan)
		].join('\n') + '\n';
	const optionsRs = renderOptionsRs(plan, addresses, optionsKindEntries);
	const { hashRs, hashTs } = emitHashFiles(lang, [
		{ filename: 'transport.rs', content: transportRs },
		{ filename: 'options.rs', content: optionsRs }
	]);

	return {
		hashRs,
		hashTs,
		optionsRs: {
			path: `${renderModuleSrcDir(lang)}/options.rs`,
			contents: optionsRs
		},
		transportRs: {
			path: `${renderModuleSrcDir(lang)}/transport.rs`,
			contents: transportRs
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
	generatedIdTables?: GeneratedIdTables,
	plan: RenderPlan = EMPTY_PLAN
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
		emitPerSlotChildEnum(entry, kidByKind, nodeMap, literalVariantByKey, kindEntries, plan)
	);
	const seatTargetLines = renderSeatTargets(nodes, nodeMap, plan, kindEntries, usedSupertypeNames, perSlotEnums);

	return pruneUnreferencedBridges(
		[
			...anyTransportLines,
			'',
			...renderLiteralTransportStruct(projection.literals),
			...renderTriviaTransportSupport(nodeMap, kindEntries),
			'',
			...renderVerbatimTransport(),
			...(supertypeEnumLines.length > 0 ? [...supertypeEnumLines, ''] : []),
			...(perSlotEnumLines.length > 0 ? [...perSlotEnumLines, ''] : []),
			...nodes.flatMap((node) =>
				renderTransportStruct(node, nodeMap, generatedIdTables !== undefined, kindEntries, plan)
			),
			...seatTargetLines,
			'',
			'',
			...renderTypedDispatch(
				structs,
				nodes,
				projection.literals,
				meta,
				nodeMap,
				usedSupertypeNames,
				kidByKind,
				plan,
				kindEntries
			),
			...renderTransportEntry()
		].join('\n')
	);
}

function renderVerbatimTransport(): string[] {
	return [
		"/// Text that is a slot's content with no kind of its own: a bare string in",
		'/// a slot whose members all render from their own text, where the variant',
		'/// tag is render-invisible and picking one would be a guess.',
		'#[derive(Debug, Clone)]',
		'pub struct VerbatimTransport {',
		'    pub text: String,',
		'}',
		'',
		'impl ::sittir_core::render::Render for VerbatimTransport {',
		'    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {',
		'        w.text(&self.text)',
		'    }',
		'}',
		'',
		...inertPrepareImpl('VerbatimTransport')
	];
}

function supertypeAdmitsVerbatim(supertypeNode: AssembledSupertype, nodeMap: NodeMap): boolean {
	return expandConcreteTransportKinds([supertypeNode.kind], nodeMap).some(({ node }) => node.modelType === 'pattern');
}

function supertypeVerbatimIsImmediate(supertypeNode: AssembledSupertype, nodeMap: NodeMap): boolean {
	let sawScalar = false;
	for (const { node } of expandConcreteTransportKinds([supertypeNode.kind], nodeMap)) {
		if (!(node instanceof AssembledLeaf)) continue;
		sawScalar = true;
		if (!node.immediate) return false;
	}
	return sawScalar;
}

function verbatimRenderArm(enumName: string, immediate: boolean): string {
	const call = 'inner.render(w)';
	return `${enumName}::Verbatim(inner) => ${immediate ? `{ w.adjacent(); ${call} }` : call},`;
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
	lines.push('use ::sittir_core::view::{KindOf, KindTest, View, ListView, NO_ITEMS};');
	lines.push('use ::sittir_core::render::Render;');
	lines.push('use ::sittir_core::types::{');
	lines.push('    FieldValue, OneOrMany, Source, Span, NodeTrivia,');
	lines.push('};');
	lines.push('');
	if (hasNumericDispatch) {
		lines.push('#[cfg(feature = "napi-bindings")]');
		lines.push('use ::napi_derive::napi;');
		lines.push('');
	}
	return lines.join('\n');
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
	const names = new Set(
		kindEntries.flatMap((e) => [
			e.kind,
			...(e.symbolName !== undefined ? [e.symbolName] : []),
			...(e.parseName !== undefined ? [e.parseName] : [])
		])
	);
	for (const name of names) {
		const id = findKindEntry(kindEntries, name)?.id;
		if (id !== undefined) map.set(name, id);
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
		'    #[serde(skip)]',
		'    Verbatim(VerbatimTransport),',
		'}',
		'',
		...prepareEnumImpl('AnyTransport', anyTransportPrepareArms(nodes, literals))
	];
}

function anyTransportPrepareArms(
	nodes: readonly AssembledNode[],
	literals: readonly TransportLiteral[]
): { readonly variant: string; readonly payload: boolean }[] {
	return [
		...nodes.map((node) => ({ variant: rustTransportVariantName(node), payload: true })),
		...literals.map((literal, index) => ({ variant: rustLiteralTransportVariantName(literal, index), payload: false })),
		{ variant: 'Verbatim', payload: true }
	];
}

function isPrepareFilled(slot: AssembledNonterminal): boolean {
	return slot.registeredOption === 'choice' && isRequired(slot) && !isMultiple(slot);
}

function isTransportRequired(slot: AssembledNonterminal): boolean {
	return isRequired(slot) && !isPrepareFilled(slot);
}

function nodeTransportHasRequiredField(node: AssembledNode): boolean {
	if (node.modelType === 'pattern' || isFixedTextLeaf(node) || node.modelType === 'enum') {
		return true;
	}
	return node.slots.some((slot) => isTransportRequired(slot));
}

function isLeafLikeNode(n: AssembledNode): boolean {
	return n.modelType === 'pattern' || isFixedTextLeaf(n) || n.modelType === 'enum';
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

function emitTransportEnumFromNapiValueBody(
	enumName: string,
	kindIdArms: readonly string[],
	admitsVerbatim: boolean
): string[] {
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
	if (admitsVerbatim) {
		lines.push(
			`            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),`
		);
	}
	lines.push(
		`            _ => Err(::napi::Error::from_reason(${JSON.stringify(
			`${enumName}: expected u16 kind_id${admitsVerbatim ? ', string,' : ''} or object with $type`
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
	if (isVisibleTextLeaf(node)) return 1;
	if (isHiddenPunctuationLeaf(node)) return 2;
	if (node instanceof AssembledPattern) return 3;
	return -1;
}

function kindIdStoredFirst<T>(entries: readonly T[], nodeOf: (entry: T) => AssembledNode): T[] {
	return [...entries].sort((a, b) => Number(isKindIdStored(nodeOf(b))) - Number(isKindIdStored(nodeOf(a))));
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
	const admitsVerbatim = supertypeAdmitsVerbatim(supertypeNode, nodeMap);

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
	if (admitsVerbatim) lines.push(`    Verbatim(VerbatimTransport),`);
	lines.push(`}`);
	lines.push(``);
	lines.push(
		...prepareEnumImpl(enumName, [
			...validSubtypes.map(({ subNode }) => ({ variant: rustTypeIdent(subNode.typeName), payload: true })),
			...(admitsVerbatim ? [{ variant: 'Verbatim', payload: true }] : [])
		])
	);

	if (kindIdByKind !== undefined) {
		const buildKindIdArms = (): string[] => {
			const arms: string[] = [];
			const emittedIds = new Set<number>();
			const selfId = kindIdByKind.get(supertypeNode.kind);
			if (selfId !== undefined) {
				arms.push(`                ${selfId} => {`);
				for (const t of emitDecodeTrials(false, '                    ')) arms.push(t);
				arms.push(
					`                    Err(::napi::Error::from_reason(${JSON.stringify(`aliased kind id ${selfId} in ${enumName} decodes as none of its members`)}))`
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
					`                    Err(::napi::Error::from_reason(${JSON.stringify(`reserved supertype kind id ${id} in ${enumName} decodes as none of its members`)}))`
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
			const members = kindIdStoredFirst(validSubtypes, (s) => s.subNode).map(({ subKind, subNode }) => {
				const variant = rustTypeIdent(subNode.typeName);
				const idsOf = (parseName: string | undefined): number[] =>
					resolveAcceptedTransportIds({ kind: subKind, node: subNode, nodeMap, kindIdByKind, kindEntries, parseName });
				const acceptedIds = idsOf(parseNames.get(subKind));
				assertRoutableTransportIds(
					acceptedIds,
					subKind,
					variant,
					enumName,
					`under supertype '${ownerKind}'`,
					kindEntries
				);
				return {
					variant,
					typeName: rustTransportStructName(subNode),
					boxed: isBoxed(subKind, subNode),
					ownIds: idsOf(undefined),
					acceptedIds
				};
			});
			const claim = (member: (typeof members)[number], ids: readonly number[]): void => {
				for (const id of ids) {
					if (emittedIds.has(id)) continue;
					emittedIds.add(id);
					if (member.boxed) {
						arms.push(`                ${id} => Ok(Self::${member.variant}(Box::new(`);
						arms.push(`                    ${member.typeName}::from_napi_value(env, napi_val)?`);
						arms.push(`                ))),`);
					} else {
						arms.push(`                ${id} => Ok(Self::${member.variant}(`);
						arms.push(`                    ${member.typeName}::from_napi_value(env, napi_val)?`);
						arms.push(`                )),`);
					}
				}
			};
			for (const member of members) claim(member, member.ownIds);
			for (const member of members) claim(member, member.acceptedIds);
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

	lines.push(
		...kindOfImplLines(
			enumName,
			validSubtypes.map(({ subNode }) => ({ variant: rustTypeIdent(subNode.typeName), payload: true })),
			admitsVerbatim
				? validSubtypes
						.filter(({ subNode }) => subNode.modelType === 'pattern')
						.map(({ subKind }) => kindIdByKind?.get(subKind))
						.filter((id): id is number => id !== undefined)
				: undefined
		)
	);

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
	if (admitsVerbatim) lines.push(`        ${enumName}::Verbatim(inner) => AnyTransport::Verbatim(inner),`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	const supertypeRenderFn = `render_${rustSnakeIdent(supertypeNode.typeName)}`;
	lines.push(`impl ::sittir_core::render::Render for ${enumName} {`);
	lines.push(
		`    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	lines.push(`        ${supertypeRenderFn}(self, w)`);
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

	lines.push(
		`fn ${fnName}(t: &${enumName}, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	lines.push(`    match t {`);
	for (const { subKind, subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		const innerExpr = boxedInEnum(subKind, ownerKind, subNode, nodeMap) ? `inner.as_ref()` : `inner`;
		lines.push(`        ${enumName}::${variant}(inner) => ${innerExpr}.render(w),`);
	}
	if (supertypeAdmitsVerbatim(supertypeNode, nodeMap)) {
		lines.push(`        ${verbatimRenderArm(enumName, supertypeVerbatimIsImmediate(supertypeNode, nodeMap))}`);
	}
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	return lines;
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

function resolveAcceptedTransportIds(input: AcceptedTransportIdsInput): number[] {
	const { kind, node, nodeMap, kindIdByKind, kindEntries, stampedIds, parseAliases, parseName } = input;
	let acceptedIds: number[];
	if (stampedIds !== undefined) {
		acceptedIds = [...stampedIds];
	} else {
		const nameKeyedIds = [
			...new Set<string>([...concreteKindsOf(kind, nodeMap), ...acceptedTransportKinds(kind, nodeMap, parseAliases)])
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
	for (const concreteKind of concreteKindsOf(kind, nodeMap)) {
		const concrete = nodeMap.nodes.get(concreteKind);
		if (concrete instanceof AssembledEnum) acceptedIds.push(...enumMemberAcceptedIds(concrete));
	}
	if (node.modelType === 'pattern' && node.fixedLiteralText !== undefined && kindEntries !== undefined) {
		const literalId = findKindEntryForLiteral(kindEntries, node.fixedLiteralText)?.id;
		if (literalId !== undefined) acceptedIds.push(literalId);
	}
	// An anonymous token the parser shows as a kind in this member's closure
	// arrives under the token's own id (`print` shown as `identifier`,
	// nested under `primary_expression`), so every concrete kind's terminal
	// aliases are accepted here, not only the member's own.
	for (const aliasedKind of [kind, ...concreteKindsOf(kind, nodeMap)]) {
		const terminalIds = nodeMap?.terminalAliasWireIds?.get(aliasedKind);
		if (terminalIds === undefined) continue;
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
		for (const concreteKind of concreteKindsOf(kind, nodeMap)) {
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
			const req = isTransportRequired(f);
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
	verbatimImmediate: boolean;
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
				immediate: component.immediate,
				...(component.enumKind === undefined ? {} : { enumKind: component.enumKind })
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
			acceptedIdsByKind,
			verbatimImmediate: slotVerbatimIsImmediate(field, nodeMap)
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
	if (literal.resolvedKindId !== undefined) {
		return literal.resolvedKindId;
	}
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

interface LiteralArmSeams {
	readonly before?: string;
	readonly after?: string;
}

function literalArmSeamSites(
	entry: PerSlotChildEnum,
	literalVariantByKey: ReadonlyMap<string, string>,
	plan: RenderPlan,
	kindEntries: readonly KindEnumEntry[],
	nodeMap: NodeMap
): ReadonlyMap<string, LiteralArmSeams> {
	const out = new Map<string, LiteralArmSeams>();
	for (const literal of entry.literals) {
		const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
		if (variant === undefined) continue;
		const owner = displayNameOf(literal.enumKind ?? entry.ownerKind, nodeMap);
		const sites: { before?: string; after?: string } = {};
		const token = tokenNameOfText(literal.text, kindEntries);
		for (const site of plan.spacingSites) {
			if (site.kind !== owner || site.side !== 'seam' || site.seat !== undefined) continue;
			const seam = parseSeamLabel(site.address);
			if (token !== undefined && seam?.token === token) sites[seam.side] = site.constName;
		}
		if (sites.before !== undefined || sites.after !== undefined) out.set(variant, sites);
	}
	return out;
}

function literalSeamedArm(enumName: string, variant: string, write: string, seams: LiteralArmSeams): string[] {
	const site = (side: 'before' | 'after'): string[] =>
		seams[side] === undefined ? [] : [`                w.site_at(options::${seams[side]});`];
	return [
		`            ${enumName}::${variant} => {`,
		...site('before'),
		`                let written = ${write};`,
		'                written?;',
		...site('after'),
		'                Ok(())',
		'            }'
	];
}

interface LiteralKindIds {
	readonly ids: readonly { readonly id: number; readonly variant: string }[];
	readonly allResolved: boolean;
}

function literalKindIdsOf(
	entry: PerSlotChildEnum,
	kindIdByKind: ReadonlyMap<string, number> | undefined,
	literalVariantByKey: ReadonlyMap<string, string>,
	kindEntries: readonly KindEnumEntry[] | undefined
): LiteralKindIds {
	if (kindIdByKind === undefined) return { ids: [], allResolved: entry.literals.length === 0 };
	const ids: { id: number; variant: string }[] = [];
	const seen = new Set<number>();
	let allResolved = true;
	for (const literal of entry.literals) {
		const id = resolveLiteralKindId(literal, kindEntries, kindIdByKind);
		const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
		if (id === undefined || variant === undefined) {
			allResolved = false;
			continue;
		}
		if (seen.has(id)) continue;
		seen.add(id);
		ids.push({ id, variant });
	}
	return { ids, allResolved };
}

function prepareFilledSlotOf(entry: PerSlotChildEnum, nodeMap: NodeMap): AssembledNonterminal | undefined {
	const slot = nodeMap.nodes.get(entry.ownerKind)?.slots.find((candidate) => candidate.name === entry.fieldName);
	return slot !== undefined && isPrepareFilled(slot) ? slot : undefined;
}

function fromKindIdImpl(enumName: string, entry: PerSlotChildEnum, literalIds: LiteralKindIds): string[] {
	if (entry.kinds.length > 0 || !literalIds.allResolved) {
		throw new Error(
			`render-module: ${entry.ownerKind}.${entry.fieldName} is a registered choice option filled at prepare, but ${enumName} has an arm no kind id can build`
		);
	}
	return [
		`impl ${enumName} {`,
		'    pub fn from_kind_id(id: u16) -> Option<Self> {',
		'        match id {',
		...literalIds.ids.map(({ id, variant }) => `            ${id} => Some(Self::${variant}),`),
		'            _ => None,',
		'        }',
		'    }',
		'}',
		''
	];
}

function emitPerSlotChildEnum(
	entry: PerSlotChildEnum,
	kindIdByKind: ReadonlyMap<string, number> | undefined,
	nodeMap: NodeMap,
	literalVariantByKey: ReadonlyMap<string, string>,
	kindEntries?: readonly KindEnumEntry[],
	plan: RenderPlan = EMPTY_PLAN
): string[] {
	const enumName = perSlotEnumName(entry.typeName, entry.fieldName);
	const lines: string[] = [];
	const ownerKind = entry.ownerKind;
	const literalSeams = literalArmSeamSites(entry, literalVariantByKey, plan, kindEntries ?? [], nodeMap);

	const validKinds = expandConcreteTransportKinds(entry.kinds, nodeMap);
	const admitsVerbatim = validKinds.some(({ node }) => node.modelType === 'pattern');

	const isBoxed = (variantKind: string, variantNode: AssembledNode): boolean =>
		boxedInEnum(variantKind, ownerKind, variantNode, nodeMap);

	lines.push(`#[derive(Debug, Clone)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const { kind, node, concreteName } of validKinds) {
		const variant = rustTypeIdent(node.typeName);
		const variantType = isBoxed(kind, node) ? `Box<${concreteName}>` : concreteName;
		lines.push(`    ${variant}(${variantType}),`);
	}
	const literalVariants: string[] = [];
	for (const literal of entry.literals) {
		const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
		if (variant !== undefined) {
			lines.push(`    ${variant},`);
			literalVariants.push(variant);
		}
	}
	if (admitsVerbatim) lines.push(`    Verbatim(VerbatimTransport),`);
	lines.push(`}`);
	lines.push(``);
	lines.push(
		...prepareEnumImpl(enumName, [
			...validKinds.map(({ node }) => ({ variant: rustTypeIdent(node.typeName), payload: true })),
			...literalVariants.map((variant) => ({ variant, payload: false })),
			...(admitsVerbatim ? [{ variant: 'Verbatim', payload: true }] : [])
		])
	);
	lines.push(
		...kindOfImplLines(
			enumName,
			[
				...validKinds.map(({ node }) => ({ variant: rustTypeIdent(node.typeName), payload: true })),
				...entry.literals.flatMap((literal) => {
					const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
					if (variant === undefined) return [];
					const id = resolveLiteralKindId(literal, kindEntries, kindIdByKind);
					return [{ variant, payload: false, ids: id === undefined ? [] : [id] }];
				})
			],
			admitsVerbatim
				? validKinds
						.filter(({ node }) => node.modelType === 'pattern')
						.map(({ kind }) => kindIdByKind?.get(kind))
						.filter((id): id is number => id !== undefined)
				: undefined
		)
	);

	const literalIds = literalKindIdsOf(entry, kindIdByKind, literalVariantByKey, kindEntries);
	if (prepareFilledSlotOf(entry, nodeMap) !== undefined) lines.push(...fromKindIdImpl(enumName, entry, literalIds));
	if (kindIdByKind !== undefined) {
		const kindIdArms: string[] = [];
		const emittedIds = new Set<number>();
		for (const { id, variant } of literalIds.ids) {
			emittedIds.add(id);
			kindIdArms.push(`                ${id} => Ok(Self::${variant}),`);
		}
		for (const { kind, node, concreteName } of kindIdStoredFirst(validKinds, (v) => v.node)) {
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
	if (admitsVerbatim) lines.push(`        ${enumName}::Verbatim(inner) => AnyTransport::Verbatim(inner),`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	lines.push(`impl ::sittir_core::render::Render for ${enumName} {`);
	lines.push(
		`    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	lines.push(`        match self {`);
	for (const { kind, node } of validKinds) {
		const variant = rustTypeIdent(node.typeName);
		const innerExpr = isBoxed(kind, node) ? 'inner.as_ref()' : 'inner';
		const call = `${innerExpr}.render(w)`;
		const arm =
			!(node instanceof AssembledLeaf) && isLeftImmediateKind(kind, nodeMap) ? `{ w.adjacent(); ${call} }` : call;
		lines.push(`            ${enumName}::${variant}(inner) => ${arm},`);
	}
	for (const literal of entry.literals) {
		const variant = literalVariantByKey.get(`${literal.kind}\0${literal.text}`);
		if (variant !== undefined) {
			const immediate = literal.immediate === true || isImmediateLeafKind(literal.kind, nodeMap);
			const seams = literalSeams.get(variant);
			if (seams === undefined)
				lines.push(`            ${enumName}::${variant} => ${literalWriteArm(literal.text, immediate)},`);
			else lines.push(...literalSeamedArm(enumName, variant, literalWriteArm(literal.text, immediate), seams));
		}
	}
	if (admitsVerbatim) lines.push(`            ${verbatimRenderArm(enumName, entry.verbatimImmediate)}`);
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
	lines.push('    Verbatim(VerbatimTransport),');
	lines.push('}');
	lines.push('');
	lines.push(...prepareEnumImpl('AnyTransport', anyTransportPrepareArms(nodes, literals)));

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
		'pub fn render_transport_parts(',
		'    mut transport: RenderRoot,',
		"    ctx: &::sittir_core::prepare::RenderContext<'_>,",
		') -> Result<(TransportSource, String), ::sittir_core::render::RenderError> {',
		'    ::sittir_core::prepare::Prepare::prepare(&mut transport, ctx)?;',
		'    let rendered = render_transport_dispatch(&transport, ctx)?;',
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
	const extrasNodes: AssembledNode[] = [];
	const seenExtras = new Set<string>();
	const addExtra = (kindName: string): void => {
		if (seenExtras.has(kindName)) return;
		seenExtras.add(kindName);
		const node = nodeMap.nodes.get(kindName);
		if (node instanceof AssembledSupertype) node.subtypeNames.forEach(addExtra);
		else if (node !== undefined) extrasNodes.push(node);
	};
	(nodeMap.extras ?? new Set<string>()).forEach(addExtra);

	const lines: string[] = [];
	lines.push('#[derive(Debug, Clone)]');
	lines.push('pub enum TriviaTransport {');
	for (const node of extrasNodes) {
		lines.push(`    ${rustTransportVariantName(node)}(${rustTransportStructName(node)}),`);
	}
	lines.push('    Verbatim(VerbatimTransport),');
	lines.push('}');
	lines.push('');
	lines.push(
		...prepareEnumImpl('TriviaTransport', [
			...extrasNodes.map((node) => ({ variant: rustTransportVariantName(node), payload: true })),
			{ variant: 'Verbatim', payload: true }
		])
	);

	lines.push('impl ::sittir_core::render::Render for TriviaTransport {');
	lines.push(
		'    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {'
	);
	lines.push('        match self {');
	for (const node of extrasNodes) {
		const variant = rustTransportVariantName(node);
		lines.push(`            TriviaTransport::${variant}(t) => t.render(w),`);
	}
	lines.push('            TriviaTransport::Verbatim(t) => t.render(w),');
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
	lines.push(...emitTransportEnumFromNapiValueBody('TriviaTransport', kindIdArms, true));
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
	if (!isFixedTextLeaf(node)) return undefined;
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

const PREPARE_MOD = '::sittir_core::prepare';
const PREPARE_SIG = `fn prepare(&mut self, ctx: &${PREPARE_MOD}::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {`;

function prepareEnumImpl(
	enumName: string,
	arms: readonly { readonly variant: string; readonly payload: boolean }[]
): string[] {
	const anyPayload = arms.some((a) => a.payload);
	return [
		`impl ${PREPARE_MOD}::Prepare for ${enumName} {`,
		`    ${anyPayload ? PREPARE_SIG : PREPARE_SIG.replace('ctx:', '_ctx:')}`,
		`        match self {`,
		...arms.map((a) =>
			a.payload
				? `            ${enumName}::${a.variant}(t) => t.prepare(ctx),`
				: `            ${enumName}::${a.variant} => Ok(()),`
		),
		`        }`,
		`    }`,
		`}`,
		''
	];
}

function inertPrepareImpl(typeName: string): string[] {
	return [
		`impl ${PREPARE_MOD}::Prepare for ${typeName} {`,
		`    ${PREPARE_SIG.replace('ctx:', '_ctx:')}`,
		`        Ok(())`,
		`    }`,
		`}`,
		''
	];
}

function synthesizedSpacingSites(plan: RenderPlan, node: AssembledNode): readonly SpacingSite[] {
	const kind = node.display.name;
	return plan.spacingSites.filter((site) => site.kind === kind && site.side !== undefined && site.seat === undefined);
}

function kindEdgeSidesOf(plan: RenderPlan, node: AssembledNode): ReadonlyMap<string, 'before' | 'after'> {
	const out = new Map<string, 'before' | 'after'>();
	for (const site of synthesizedSpacingSites(plan, node)) {
		if (site.side !== 'seam' || !isKindEdge(site)) continue;
		out.set(rustFieldIdent(site.fieldIdent), parseSeamLabel(site.address)!.side);
	}
	return out;
}

function kindEdgeWriterOf(
	plan: RenderPlan,
	node: AssembledNode | undefined,
	kindEntries: readonly KindEntryLike[] | undefined
): (name: string) => { readonly kindId: number; readonly side: 'before' | 'after' } | undefined {
	const sides = node === undefined ? new Map<string, 'before' | 'after'>() : kindEdgeSidesOf(plan, node);
	if (node === undefined || sides.size === 0) return () => undefined;
	const kindId = edgeIdOf(plan, node, kindEntries);
	return (name) => {
		const side = sides.get(rustFieldIdent(name));
		return side === undefined ? undefined : { kindId, side };
	};
}

const edgeRowKindsCache = new WeakMap<RenderPlan, ReadonlySet<number>>();

function edgeRowKindsOf(plan: RenderPlan, kindEntries: readonly KindEntryLike[]): ReadonlySet<number> {
	const cached = edgeRowKindsCache.get(plan);
	if (cached !== undefined) return cached;
	const kinds = new Set(edgeSitesOf(plan, kindEntries).map((row) => row.kind));
	edgeRowKindsCache.set(plan, kinds);
	return kinds;
}

function edgeIdOf(plan: RenderPlan, node: AssembledNode, kindEntries: readonly KindEntryLike[] | undefined): number {
	const kind = node.display.name;
	if (kindEntries !== undefined) {
		const id = edgeKindId(kindEntries, kind);
		if (id !== undefined && edgeRowKindsOf(plan, kindEntries).has(id)) return id;
	}
	throw new Error(`kind '${kind}' has kind-edge sites but no edge row to prepare and write them from`);
}

function delimiterSiteOf(plan: RenderPlan, node: AssembledNode): DelimiterSite | undefined {
	const kind = node.display.name;
	return plan.delimiterSites.find((site) => site.kind === kind);
}

function separatorSiteOf(plan: RenderPlan, node: AssembledNode): SpacingSite | undefined {
	const kind = node.display.name;
	return plan.spacingSites.find((site) => site.kind === kind && site.role === 'separator');
}

function listGapSitesOf(
	plan: RenderPlan,
	node: AssembledNode,
	slot: string
): { readonly before?: SpacingSite; readonly after?: SpacingSite; readonly gap?: SpacingSite } {
	const kind = node.display.name;
	const of = (side: SpacingSide) =>
		plan.spacingSites.find((s) => s.kind === kind && s.slot === slot && s.side === side && s.seat === undefined);
	return { before: of('before'), after: of('after'), gap: of('gap') };
}

function listGapTokenOf(field: AssembledNonterminal): string | undefined {
	const texts = slotSeparatorTexts(field, false);
	return texts.length === 1 ? texts[0] : undefined;
}

function listGapClassification(plan: RenderPlan, node: AssembledNode): string[] {
	const body: string[] = [];
	const slotModel = renderSlotModelOf(node);
	for (const field of [...slotModel.named, ...slotModel.unnamed]) {
		if (!isMultiple(field)) continue;
		const sites = listGapSitesOf(plan, node, field.name);
		const first = sites.gap ?? sites.before;
		if (first === undefined && sites.after === undefined) continue;
		const token = sites.gap !== undefined ? '' : listGapTokenOf(field);
		if (token === undefined) continue;
		const ident = rustFieldIdent(field.storageName);
		const items = isTransportRequired(field)
			? `self.${ident}.iter()`
			: `self.${ident}.as_deref().unwrap_or(&[]).iter()`;
		const each = hasOptionalElements(field) ? 'item.as_ref().and_then(|i| i.coord())' : 'item.coord()';
		const allowedOf = (site: SpacingSite | undefined) =>
			site === undefined ? '&[]' : `options::allowed(options::${site.constName})`;
		body.push(
			`        {`,
			`            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = ${items}.map(|item| ${each}).collect();`,
			`            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, ${JSON.stringify(token)}, ${allowedOf(first)}, ${allowedOf(sites.after)}, &options::WHITESPACE);`
		);
		if (first !== undefined) {
			const f = rustFieldIdent(first.fieldIdent);
			body.push(`            if self.${f}.is_none() { self.${f} = before; }`);
		} else {
			body.push(`            let _ = before;`);
		}
		if (sites.after !== undefined) {
			const a = rustFieldIdent(sites.after.fieldIdent);
			body.push(`            if self.${a}.is_none() { self.${a} = after; }`);
		} else {
			body.push(`            let _ = after;`);
		}
		body.push(`        }`);
	}
	return body;
}

function spacingFieldExprs(
	plan: RenderPlan,
	node: AssembledNode | undefined,
	fieldName: string
): { readonly before?: string; readonly after?: string; readonly head?: string; readonly tail?: string } {
	if (node === undefined) return {};
	const sites = synthesizedSpacingSites(plan, node).filter((site) => site.slot === fieldName && site.side !== 'seam');
	const expr = (site: SpacingSite | undefined): string | undefined =>
		site === undefined ? undefined : `node.${rustFieldIdent(site.fieldIdent)}`;
	const flank = (site: SpacingSite | undefined): string | undefined =>
		site === undefined ? undefined : `Some(options::${site.constName})`;
	return {
		before: expr(sites.find((site) => site.side === 'before')),
		after: expr(sites.find((site) => site.side === 'after' || site.side === 'gap')),
		head: flank(sites.find((site) => site.side === 'start')),
		tail: flank(sites.find((site) => site.side === 'end'))
	};
}

type SeatReach = (kind: string) => boolean;

const seatReachCache = new WeakMap<RenderPlan, SeatReach>();

function wrapperSlotOf(node: AssembledNode): AssembledNonterminal | undefined {
	if (!(node instanceof AssembledPolymorph) || node instanceof AssembledSupertype) return undefined;
	const model = renderSlotModelOf(node);
	const slot = model.named[0] ?? model.unnamed[0];
	return slot?.name === undefined ? undefined : slot;
}

function slotElementsReach(slot: AssembledNonterminal, nodeMap: NodeMap, reaches: SeatReach): boolean {
	const kinds = kindsOf(slot);
	const cls = classifySlotForEmit(kinds, nodeMap);
	if (cls.tag === 'concrete') return reaches(cls.kind);
	if (cls.tag === 'supertype') {
		const kind = findSupertypeKindByTypeName(cls.supertypeName, nodeMap);
		return kind !== undefined && reaches(kind);
	}
	return expandConcreteTransportKinds(kinds, nodeMap).some(({ kind }) => reaches(kind));
}

function seatedKindsOf(plan: RenderPlan): ReadonlySet<string> {
	return new Set(plan.spacingSites.flatMap((site) => (site.seat === undefined ? [] : [site.seat.kind])));
}

function seatReachOf(plan: RenderPlan, nodeMap: NodeMap): SeatReach {
	const cached = seatReachCache.get(plan);
	if (cached !== undefined) return cached;
	const seated = seatedKindsOf(plan);
	const reach = new Set<string>();
	const has: SeatReach = (kind) => reach.has(kind);
	let changed = true;
	while (changed) {
		changed = false;
		for (const [kind, node] of nodeMap.nodes) {
			if (reach.has(kind)) continue;
			const wrapper = wrapperSlotOf(node);
			const reaches =
				seated.has(node.display.name) ||
				(node instanceof AssembledSupertype &&
					collectEffectiveSupertypeTransportShape(node, nodeMap).subtypes.some(({ subKind }) => reach.has(subKind))) ||
				(wrapper !== undefined && slotElementsReach(wrapper, nodeMap, has));
			if (reaches) {
				reach.add(kind);
				changed = true;
			}
		}
	}
	seatReachCache.set(plan, has);
	return has;
}

const SEAT_TARGET_SIG =
	'    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {';

function seatTargetMatchImpl(typeName: string, variants: readonly string[], exhaustive: boolean): string[] {
	if (variants.length === 0) return [];
	return [
		`impl ::sittir_core::prepare::SeatTarget for ${typeName} {`,
		SEAT_TARGET_SIG,
		'        match self {',
		...variants.map((variant) => `            Self::${variant}(t) => t.seat_target(table),`),
		...(exhaustive ? [] : ['            #[allow(unreachable_patterns)]', '            _ => None,']),
		'        }',
		'    }',
		'}',
		''
	];
}

function seatTargetStructImpl(
	node: AssembledNode,
	nodeMap: NodeMap,
	plan: RenderPlan,
	kindEntries: readonly KindEntryLike[] | undefined
): string[] {
	const reaches = seatReachOf(plan, nodeMap);
	if (!reaches(node.kind)) return [];
	const body: string[] = [];
	const kind = node.display.name;
	if (seatedKindsOf(plan).has(kind)) {
		const id = kindEntries === undefined ? undefined : edgeKindId(kindEntries, kind);
		if (id === undefined) throw new Error(`kind '${kind}' is seated in a list but has no kind id to find its seat by`);
		body.push(
			`        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(${id})) {`,
			'            return Some((self.edges.get_or_insert_with(Default::default), site));',
			'        }'
		);
	}
	const wrapper = wrapperSlotOf(node);
	if (wrapper !== undefined && slotElementsReach(wrapper, nodeMap, reaches)) {
		const held = isTransportRequired(wrapper)
			? '::sittir_core::SlotValue::Transport(inner)'
			: 'Some(::sittir_core::SlotValue::Transport(inner))';
		body.push(
			`        if let ${held} = &mut self.${rustFieldIdent(wrapper.name!)} {`,
			'            return inner.seat_target(table);',
			'        }'
		);
	}
	return [
		`impl ::sittir_core::prepare::SeatTarget for ${rustTransportStructName(node)} {`,
		SEAT_TARGET_SIG,
		...body,
		'        None',
		'    }',
		'}',
		''
	];
}

function renderSeatTargets(
	nodes: readonly AssembledNode[],
	nodeMap: NodeMap,
	plan: RenderPlan,
	kindEntries: readonly KindEntryLike[] | undefined,
	usedSupertypeNames: ReadonlySet<string>,
	perSlotEnums: readonly PerSlotChildEnum[]
): string[] {
	const reaches = seatReachOf(plan, nodeMap);
	const lines: string[] = [];
	for (const node of nodes) {
		if (node instanceof AssembledEnum || node instanceof AssembledSupertype) continue;
		lines.push(...seatTargetStructImpl(node, nodeMap, plan, kindEntries));
	}
	for (const [, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype) || !usedSupertypeNames.has(node.typeName)) continue;
		const enumName = `${rustTypeIdent(node.typeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		const subtypes = collectEffectiveSupertypeTransportShape(node, nodeMap).subtypes;
		const reaching = subtypes
			.filter(({ subKind }) => reaches(subKind))
			.map(({ subNode }) => rustTypeIdent(subNode.typeName));
		lines.push(...seatTargetMatchImpl(enumName, reaching, false));
	}
	for (const entry of perSlotEnums) {
		const reaching = expandConcreteTransportKinds(entry.kinds, nodeMap)
			.filter(({ kind }) => reaches(kind))
			.map(({ node }) => rustTypeIdent(node.typeName));
		lines.push(...seatTargetMatchImpl(perSlotEnumName(entry.typeName, entry.fieldName), reaching, false));
	}
	const anyReaching = nodes.filter((node) => reaches(node.kind)).map((node) => rustTransportVariantName(node));
	lines.push(...seatTargetMatchImpl('AnyTransport', anyReaching, false));
	return lines;
}

function seatLoops(plan: RenderPlan, node: AssembledNode, nodeMap: NodeMap): string[] {
	const lines: string[] = [];
	const reaches = seatReachOf(plan, nodeMap);
	const slotModel = renderSlotModelOf(node);
	const seated = seatedTableNames(plan);
	for (const field of [...slotModel.named, ...slotModel.unnamed]) {
		if (field.name === undefined || !isMultiple(field)) continue;
		if (!seated.has(seatTableName(node.display.name, field.name))) continue;
		if (!slotElementsReach(field, nodeMap, reaches)) continue;
		const ident = rustFieldIdent(field.name);
		const table = `options::${seatTableName(node.display.name, field.name)}`;
		const items = hasOptionalElements(field) ? 'iter_mut().map(Option::as_mut)' : 'iter_mut().map(Some)';
		lines.push(
			isTransportRequired(field)
				? `        ::sittir_core::prepare::fill_seated_gaps(self.${ident}.${items}, ${table}, ctx);`
				: `        if let Some(seated_items) = self.${ident}.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.${items}, ${table}, ctx); }`
		);
	}
	return lines;
}
function optionDefaultFills(plan: RenderPlan, node: AssembledNode): string[] {
	const kind = node.display.name;
	return renderSlotModelOf(node)
		.named.filter(isPrepareFilled)
		.map((slot) => {
			const site = plan.spacingSites.find(
				(candidate) =>
					candidate.kind === kind &&
					candidate.slot === slot.name &&
					candidate.side === undefined &&
					candidate.seat === undefined
			);
			if (site === undefined) {
				throw new Error(
					`render-module: ${kind}.${slot.name} is a registered choice option with no option site to fill it from`
				);
			}
			const ident = rustFieldIdent(slot.storageName);
			const build = `${perSlotEnumName(node.typeName, slot.name)}::from_kind_id(ctx.options.spacing[options::${site.constName}].arm)`;
			return `        if self.${ident}.is_none() { self.${ident} = ${build}.map(::sittir_core::SlotValue::Transport); }`;
		});
}

function prepareStructImpl(
	structName: string,
	node: AssembledNode,
	fillFields: readonly string[],
	plan: RenderPlan,
	isCompound: boolean,
	nodeMap: NodeMap
): string[] {
	const body: string[] = [];
	if (isCompound) {
		if (kindEdgeSidesOf(plan, node).size > 0) body.push('        ::sittir_core::prepare::prepare_edges(self, ctx);');
		body.push(...listGapClassification(plan, node));
		for (const site of synthesizedSpacingSites(plan, node)) {
			if (!carriesPerNodeValue(site)) continue;
			body.push(
				`        self.${rustFieldIdent(site.fieldIdent)}.get_or_insert(ctx.options.spacing[options::${site.constName}].arm);`
			);
		}
		body.push(...seatLoops(plan, node, nodeMap));
		const delim = node instanceof AssembledList ? delimiterSiteOf(plan, node) : undefined;
		if (delim !== undefined) {
			body.push(`        self.delimiter.get_or_insert(ctx.options.delimiter[options::${delim.constName}]);`);
		}
		const sep = node instanceof AssembledList ? separatorSiteOf(plan, node) : undefined;
		if (sep !== undefined)
			body.push(`        self.separator_kind.get_or_insert(ctx.options.spacing[options::${sep.constName}].arm);`);
		body.push(...optionDefaultFills(plan, node));
		for (const f of fillFields) body.push(`        self.${f}.prepare(ctx)?;`);
	}
	return [
		`impl ${PREPARE_MOD}::Prepare for ${structName} {`,
		`    ${body.length > 0 ? PREPARE_SIG : PREPARE_SIG.replace('ctx:', '_ctx:')}`,
		...body,
		`        Ok(())`,
		`    }`,
		`}`,
		''
	];
}

function edgedImplLines(typeName: string, kindId: number): string[] {
	return [
		`impl ::sittir_core::options::Edged for ${typeName} {`,
		`    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(${kindId}) }`,
		`    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }`,
		`    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }`,
		`}`,
		''
	];
}

/** The `KindOf` answer a generated transport type gives a kind-gated body:
 *  a struct is its own kind, an enum answers for the variant it holds, and a
 *  verbatim value stands for whichever pattern kinds the position admits. */
function kindOfImplLines(
	typeName: string,
	arms: readonly { variant: string; payload: boolean; ids?: readonly number[] }[],
	verbatimIds: readonly number[] | undefined,
	ownIds?: readonly number[],
	rest: 'exhaustive' | 'false' = 'exhaustive'
): string[] {
	const idList = (ids: readonly number[]): string =>
		`[${[...new Set(ids)]
			.sort((a, b) => a - b)
			.map((id) => `::sittir_core::types::KindId(${id})`)
			.join(', ')}]`;
	const containsAny = (ids: readonly number[]): string =>
		ids.length === 0 ? 'false' : `${idList(ids)}.iter().any(|k| kinds.contains(k))`;
	const lines = [
		`impl ::sittir_core::view::KindOf for ${typeName} {`,
		`    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {`
	];
	if (ownIds !== undefined) {
		lines.push(`        ${containsAny(ownIds)}`);
	} else {
		lines.push(`        match self {`);
		for (const arm of arms) {
			if (arm.payload && arm.ids === undefined)
				lines.push(`            Self::${arm.variant}(inner) => inner.kind_in(kinds),`);
			else if (arm.payload) lines.push(`            Self::${arm.variant}(_) => ${containsAny(arm.ids!)},`);
			else lines.push(`            Self::${arm.variant} => ${containsAny(arm.ids ?? [])},`);
		}
		if (verbatimIds !== undefined) lines.push(`            Self::Verbatim(_) => ${containsAny(verbatimIds)},`);
		if (rest === 'false') lines.push(`            _ => false,`);
		lines.push(`        }`);
	}
	lines.push(`    }`, `}`, ``);
	return lines;
}

function renderTransportStruct(
	node: AssembledNode,
	nodeMap: NodeMap,
	hasNapi: boolean = false,
	kindEntries?: readonly KindEnumEntry[],
	plan: RenderPlan = EMPTY_PLAN
): string[] {
	if (node instanceof AssembledEnum) {
		return renderEnumType(node, hasNapi, kindEntries, plan);
	}
	const slotModel = renderSlotModelOf(node);
	return renderTransportDataStruct(rustTransportStructName(node), node, slotModel, nodeMap, plan, kindEntries);
}

function renderTransportDataStruct(
	structName: string,
	node: AssembledNode,
	slotModel: RenderSlotModel,
	nodeMap: NodeMap,
	plan: RenderPlan = EMPTY_PLAN,
	kindEntries?: readonly KindEnumEntry[]
): string[] {
	const isLeafNode = node.modelType === 'pattern' || isFixedTextLeaf(node);
	const lines: string[] = [];
	const fillFields: string[] = [];
	if (!isLeafNode) {
		lines.push('#[cfg_attr(feature = "napi-bindings", napi(object))]');
	}
	lines.push('#[derive(Debug, Clone)]');
	lines.push(`pub struct ${structName} {`);
	const isCompoundNode =
		node.modelType === 'branch' ||
		node.modelType === 'envelope' ||
		node.modelType === 'list' ||
		node.modelType === 'alias' ||
		(node.modelType === 'polymorph' && !(node instanceof AssembledSupertype));
	if (isCompoundNode) {
		lines.push(...renderTransportMetadataFields());
		for (const field of [...slotModel.named, ...slotModel.unnamed]) {
			lines.push(...renderTransportField(field, node.kind, node.typeName, nodeMap));
			fillFields.push(rustFieldIdent(field.storageName));
		}
		{
			const emittedStorageNames = new Set([
				...slotModel.named.map((f) => f.storageName),
				...slotModel.unnamed.map((f) => f.storageName)
			]);
			for (const unnamedSlot of slotModel.unnamed) {
				if (isMultiple(unnamedSlot)) continue;
				const aliasVisible = unnamedSlot.values.some(
					(v) => v.parseKind?.name !== undefined && !isSurfaceHiddenIn(v.parseKind.name, nodeMap)
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
					fillFields.push(rustFieldIdent(innerSlot.storageName));
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
			for (const site of synthesizedSpacingSites(plan, node)) {
				if (!carriesPerNodeValue(site)) continue;
				lines.push(
					`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(site.wireKey)}))]`,
					`    pub ${rustFieldIdent(site.fieldIdent)}: Option<u16>,`
				);
			}
		}
	} else if (node.modelType === 'pattern' || isFixedTextLeaf(node) || node.modelType === 'enum') {
		lines.push(...renderLeafTransportPlainFields());
	}
	lines.push('}');
	lines.push('');
	const ownId = kindEntries === undefined ? undefined : findKindEntry(kindEntries, node.kind)?.id;
	lines.push(...kindOfImplLines(structName, [], undefined, ownId === undefined ? [] : [ownId]));
	const edgedId = kindEntries === undefined ? undefined : edgeKindId(kindEntries, node.display.name);
	if (edgedId !== undefined) lines.push(...edgedImplLines(structName, edgedId));
	lines.push(`impl ::sittir_core::render::Render for ${structName} {`);
	lines.push(
		`    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	if (isLeafNode) {
		lines.push(`        render_with_trivia!(self, w, ${leafRenderExpr(node, 'self')})`);
	} else {
		const renderFn = rustTypedRenderFnName(node.typeName);
		lines.push(`        render_with_trivia!(self, w, ${renderFn}(self, w))`);
	}
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(...prepareStructImpl(structName, node, fillFields, plan, isCompoundNode, nodeMap));
	if (isLeafNode) {
		lines.push(
			...renderLeafTransportNapiImpls(
				structName,
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
		lines.push(`            ::napi::ValueType::Number => ${rustStringLiteral(defaultTextLiteral)}.to_string(),`);
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
		lines.push(`                ${rustStringLiteral(booleanLiteral)}.to_string()`);
		lines.push(`            }`);
	}
	lines.push(`            _ => {`);
	lines.push(`                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
	lines.push(`                __trivia = obj.get("$_trivia")?;`);
	lines.push(
		defaultTextLiteral !== undefined
			? `                obj.get("$text")?.unwrap_or_else(|| ${rustStringLiteral(defaultTextLiteral)}.to_string())`
			: `                obj.get("$text")?.unwrap_or_default()`
	);
	lines.push(`            }`);
	lines.push(`        };`);
	lines.push(`        Ok(Self {`);
	for (const f of TRANSPORT_METADATA_FIELDS) {
		lines.push(`            ${f.rustName}: ${f.rustName === 'transport_trivia_data' ? '__trivia' : 'None'},`);
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
		for (const f of TRANSPORT_METADATA_FIELDS) lines.push(`                    ${f.rustName}: None,`);
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
		for (const f of TRANSPORT_METADATA_FIELDS) lines.push(`                    ${f.rustName}: None,`);
		lines.push(`                    text: ${rustStringLiteral(booleanLiteral)}.to_string(),`);
		lines.push(`                });`);
		lines.push(`            }`);
		lines.push(`            _ => {}`);
		lines.push(`        }`);
	}
	lines.push(`        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
	lines.push(
		defaultTextLiteral !== undefined
			? `        let text: String = obj.get("$text")?.unwrap_or_else(|| ${rustStringLiteral(defaultTextLiteral)}.to_string());`
			: '        let text: String = obj.get("$text")?.unwrap_or_default();'
	);
	for (const f of TRANSPORT_METADATA_FIELDS)
		lines.push(`        let ${f.rustName} = obj.get(${JSON.stringify(f.jsName)})?;`);
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
	if (isFixedTextLeaf(node)) {
		const text = node.text || undefined;
		return text !== undefined && isDepthText(text) ? undefined : text;
	}
	if (node.modelType === 'pattern') return node.fixedLiteralText || undefined;
	return undefined;
}

interface TransportMetadataField {
	jsName: string;
	rustName: string;
	rustType: string;
}

const TRANSPORT_METADATA_FIELDS: readonly TransportMetadataField[] = [
	{ jsName: '$_trivia', rustName: 'transport_trivia_data', rustType: 'Option<TransportTrivia>' },
	{ jsName: '$_edges', rustName: 'edges', rustType: 'Option<::sittir_core::options::Edges>' }
];

function renderTransportMetadataFields(): string[] {
	return TRANSPORT_METADATA_FIELDS.flatMap((f) => [
		`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(f.jsName)}))]`,
		`    pub ${f.rustName}: ${f.rustType},`
	]);
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
	const required = forceOptional ? false : isTransportRequired(field);
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

function armSeamPairsOf(
	plan: RenderPlan,
	node: AssembledEnum,
	kindEntries: readonly KindEntryLike[]
): Map<string, { before: string; after: string }> {
	const kind = node.display.name;
	const bySlot = new Map<string, { before?: string; after?: string }>();
	for (const site of plan.spacingSites) {
		if (site.kind !== kind || site.side !== 'seam' || site.seat !== undefined) continue;
		const seam = parseSeamLabel(site.address);
		if (seam === undefined) continue;
		const entry = bySlot.get(site.slot) ?? {};
		bySlot.set(site.slot, { ...entry, [seam.side]: site.constName });
	}
	const out = new Map<string, { before: string; after: string }>();
	for (const text of node.values) {
		const name = anonTokenNameOfText(text, kindEntries);
		if (name === undefined) continue;
		const pair = bySlot.get(name);
		if (pair?.before === undefined || pair.after === undefined) continue;
		out.set(text, { before: pair.before, after: pair.after });
	}
	return out;
}

function renderEnumType(
	node: AssembledEnum,
	hasNapi: boolean,
	kindEntries?: readonly KindEnumEntry[],
	plan: RenderPlan = EMPTY_PLAN
): string[] {
	const publicName = enumTypeName(node);
	const seamPairs = armSeamPairsOf(plan, node, kindEntries ?? []);
	const enumName = publicName;
	const values = node.values;
	const lines: string[] = [];

	lines.push(`#[derive(Debug, Clone, Copy, PartialEq, Eq)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const v of values) {
		lines.push(`    ${literalToVariantName(v)},`);
	}
	lines.push(`}`);
	lines.push('');
	lines.push(...inertPrepareImpl(enumName));

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

	lines.push(
		...kindOfImplLines(
			enumName,
			values.map((v) => {
				const id = node.resolvedByText.get(v)?.id;
				return { variant: literalToVariantName(v), payload: false, ids: id === undefined ? [] : [id] };
			}),
			undefined
		)
	);
	lines.push(`impl ::sittir_core::render::Render for ${enumName} {`);
	lines.push(
		`    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	if (seamPairs.size === 0) {
		lines.push(`        w.text(match self {`);
		for (const v of values) lines.push(`            Self::${literalToVariantName(v)} => ${JSON.stringify(v)},`);
		lines.push(`        })`);
	} else {
		lines.push(`        match self {`);
		for (const v of values) {
			const pair = seamPairs.get(v);
			const text = `w.text(${JSON.stringify(v)})`;
			lines.push(
				pair === undefined
					? `            Self::${literalToVariantName(v)} => ${text},`
					: `            Self::${literalToVariantName(v)} => { w.site_at(options::${pair.before}); ${text}?; w.site_at(options::${pair.after}); Ok(()) }`
			);
		}
		lines.push(`        }`);
	}
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');

	return lines;
}
