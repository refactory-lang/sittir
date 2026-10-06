import type { SlotBearingCompound } from '../compiler/model/node-map.ts';
import { parseSeamLabel, isDepthText, INDENT_TEXT, DEPTH_BREAK } from '../dsl/primitives/spacing.ts';
import { isFixedTextLeaf, isTerminalNode, kindIdText } from '../compiler/model/node-map.ts';
import { STRING } from '../types/rule-types.ts'; // @rule-type-consts
import { wordCharAsciiTable } from '../util/word-matcher.ts';
import { isBuilderTextLeaf, isBuilderlessPunctuationLeaf } from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { isAsciiIdentifier } from '../util/identifier-shape.ts';
import type { AssembledNode, RenderTemplateSurface, AssembledNonterminal } from '../compiler/model/node-map.ts';
import {
	AbstractAssembledCompound,
	AssembledAlias,
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
import {
	assertOneUntaggedSlot,
	captureArgs,
	enumKindArgs,
	flankArgs,
	presenceKeywordId,
	readNames,
	separatorKindArgs,
	slotArgs,
	takesUntagged,
	transportArgs,
	variantKindArgs,
	type ReadFactsCtx,
	type TransportLiteral,
	type TransportProjection
} from './transport-projection.ts';
import { listViewOwners } from './factories.ts';
import { interiorOf } from './interior.ts';
import { assertEnvelopeExtrasPinned, type EnvelopeClaims } from './envelope-claims.ts';
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
	slotLiteralValues,
	isSlotBearingCompound,
	classifyPrimitiveField,
	literalMergePairs,
	fieldTypeComponents,
	kindEnumAltIdPairs,
	slotSeparatorTexts,
	compareOrdinal,
	aliasEnvelopeIds,
	aliasEnvelopesOf
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
import { pascalCase, toScreamingSnakeCase } from '../compiler/model/casing.ts';
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
import { displayNameOf, displayedKinds } from '../compiler/model/display-name.ts';
import { BLANK_KIND_ID, collectSitePreferences, hasBlankArm, type SitePreference, type SpacingSide } from '../compiler/model/site-preferences.ts';
import { readOptionsBlock, type OptionsConfig } from '../dsl/wire/options-block.ts';
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
import { generatedFieldIds, type GeneratedIdTables } from '../dsl/symbol-table.ts';
import type { CodegenEmitter } from './emitter.ts';
import type { Rule } from '../types/rule.ts';
import type { KindEntryLike } from '../dsl/symbol-table.ts';
import type { GrammarName } from '../grammars.ts';
import { triviaKinds, whitespaceTriviaKinds } from '../compiler/model/trivia.ts';

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
	generatedIdTables: GeneratedIdTables;
}

interface SynthesizeRenderModuleBundleConfig extends RenderOptionsInputs {
	grammar: GrammarName;
	nodeMap: NodeMap;
	generatedIdTables: GeneratedIdTables;
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
	readonly #generatedIdTables: GeneratedIdTables;
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
	payloadNodes: readonly AssembledNode[],
	literals: readonly TransportLiteral[],
	fixed: FixedLiterals,
	meta: MetaData,
	nodeMap: NodeMap,
	usedSupertypeNames: ReadonlySet<string>,
	kindIdByKind: ReadonlyMap<string, number>,
	plan: RenderPlan,
	kindEntries: readonly KindEntryLike[]
): string[] {
	const structsByKind = new Map(structs.map((s) => [s.kind, s]));
	const lines: string[] = [];

	for (const node of payloadNodes) {
		lines.push(...renderTypedKindFn(node, structsByKind, meta, nodeMap, kindIdByKind, plan, kindEntries));
	}
	for (const literal of fixed.values()) lines.push(...renderFixedLiteralFn(literal));

	for (const [, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype)) continue;
		if (!usedSupertypeNames.has(node.typeName)) continue;
		const enumName = `${rustTypeIdent(node.typeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		lines.push(...emitSupertypeRenderHelper(node, nodeMap, fixed));
	}

	const wordTable = wordCharAsciiTable(nodeMap.wordMatcher ?? /\w/);
	const mergePairs = literalMergePairs(literals, kindEntries, nodeMap.normalizedRules);
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
			[
				...payloadNodes.map((node) => ({ variant: rustTransportVariantName(node), payload: true })),
				...[...fixed.values()].map((literal) => ({
					variant: literal.variant,
					payload: false,
					ids: literal.ownId === undefined ? [] : [literal.ownId]
				}))
			],
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
	for (const node of payloadNodes) {
		const variant = rustTransportVariantName(node);
		lines.push(`            AnyTransport::${variant}(t) => t.render(w),`);
	}
	for (const literal of fixed.values()) lines.push(`            AnyTransport::${literal.variant} => ${literal.renderFn}(w),`);
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
	kindIdByKind: ReadonlyMap<string, number>,
	plan: RenderPlan,
	kindEntries: readonly KindEntryLike[]
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
			const slotCls = slotClassOfShape(transportSlotShapeOf(slot, nodeMap), nodeMap);
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
	kindIdByKind: ReadonlyMap<string, number>,
	plan: RenderPlan,
	kindEntries: readonly KindEntryLike[]
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
	candidateKindNames: readonly string[],
	fallbackSeparator: string,
	kindIdByKind: ReadonlyMap<string, number>
): string[] | undefined {
	const arms: string[] = [];
	for (const name of candidateKindNames) {
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
	nodeMap: NodeMap,
	slotModel: RenderSlotModel | undefined = undefined,
	node: AssembledNode | undefined,
	kindIdByKind: ReadonlyMap<string, number>,
	plan: RenderPlan,
	kindEntries: readonly KindEntryLike[]
): string[] {
	const lines: string[] = [];
	const sepLiteral = JSON.stringify(separator);

	const shapeByName = new Map<string, TransportSlotShape>();
	if (nodeMap !== undefined && slotModel !== undefined) {
		for (const f of [...slotModel.named, ...slotModel.unnamed]) shapeByName.set(f.name, transportSlotShapeOf(f, nodeMap));
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
		const shape = shapeByName.get(f.name);
		if (shape?.tag === 'presence') {
			if (shape.kind !== undefined) {
				const unit = `${rustTransportStructName(shape.kind)}::${rustTransportVariantName(shape.kind)}`;
				bind(ident, `View::new(::sittir_core::view::Presence::new(node.${rIdent}, ${unit}), ${template})`);
				continue;
			}
			const keyword = `${flanks?.prefix ?? ''}${shape.text}${flanks?.suffix ?? ''}`;
			bind(ident, `View::new(&node.${rIdent}, ${rustStringLiteral(escapeBraces(keyword))})`);
			continue;
		}
		if (shape?.tag === 'text') {
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
			const trailingOption =
				separatedList?.trailingDelimiter === 'optional'
					? 'node.delimiter.map(|d| d & 2 != 0).unwrap_or(false)'
					: separatedList?.trailingDelimiter === 'mandatory'
						? 'true'
						: 'false';
			const trailingExpr = separatedList?.singleElementNeedsTrailing
				? `(${items}).len() == 1 || ${trailingOption}`
				: trailingOption;
			const separatorSite = separatedList === undefined ? undefined : separatorSiteOf(plan, separatedList);
			const fallback =
				separatorSite?.defaultText === undefined ? fieldSepLiteral : JSON.stringify(separatorSite.defaultText);
			const separatorMatchLines =
				separatedList?.separatorRule !== undefined
					? buildSeparatorKindMatchLines(separatedList.separatorCandidateKindNames, fallback, kindIdByKind)
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
			kinds: (names) => rustKindIdSlice(names, nodeMap, kindIdByKind, struct.kind),
			innerGap: (name) => node instanceof AbstractAssembledCompound && node.innerGaps.some((gap) => gap.key === name)
		})
	);
	return lines;
}

function rustKindIdSlice(
	names: readonly string[],
	nodeMap: NodeMap,
	kindIdByKind: ReadonlyMap<string, number>,
	ownerKind: string
): string {
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

pub mod field_ids;
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
	whitespaceText: [],
	kindFlags: [],
	indentChars: [],
	indent: ''
};
const EMPTY_PLANNED_OPTIONS: PlannedRenderOptions = { plan: EMPTY_PLAN, addresses: EMPTY_ADDRESSES, kindEntries: [] };

function planRenderOptionsFor(
	lang: GrammarName,
	nodeMap: NodeMap,
	generatedIdTables: GeneratedIdTables,
	inputs: RenderOptionsInputs
): PlannedRenderOptions {
	if (inputs.renderRules === undefined) return EMPTY_PLANNED_OPTIONS;
	const kindEntries =
		inputs.kindEntries ?? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);
	const sites =
		inputs.sites ??
		collectSitePreferences({ nodeMap, kindEntries, renderRules: inputs.renderRules, options: inputs.options });
	const declaredIndent =
		inputs.options === undefined ? undefined : readOptionsBlock(inputs.options, displayedKinds(nodeMap)).indent;
	const plan = planRenderOptions(sites, kindEntries, nodeMap, whitespaceTextOf(inputs.visibleExternals, nodeMap), declaredIndent, lang);
	const addresses = inputs.addresses ?? addressTablesFor(nodeMap, kindEntries, sites, inputs.options);
	return { plan, addresses, kindEntries };
}

export function emitRenderModule(
	lang: GrammarName,
	templates: EmittedTemplates,
	nodeMap: NodeMap,
	generatedIdTables: GeneratedIdTables,
	inputs: RenderOptionsInputs = {}
): RustRenderModuleEmit {
	const { plan, addresses, kindEntries: optionsKindEntries } = planRenderOptionsFor(lang, nodeMap, generatedIdTables, inputs);
	const structs: EmittedStruct[] = [];
	for (const kind of [...templates.bodies.keys()].sort((a, b) => compareOrdinal(a, b))) {
		structs.push(emitStruct(kind, nodeMap.nodes.get(kind), templates.bodies.get(kind)!, nodeMap));
	}
	const meta = collectMetaData(nodeMap);

	const transportRs =
		[
			transportRsHeader(lang),
			'',
			commonRustUseImports(),
			'use ::sittir_core::layout::Layout as _;',
			'use ::sittir_core::options::Edged as _;',
			'use super::options;',
			'use super::{field_ids as field, kind_ids as kind};',
			'',
			renderTransportSupport(lang, nodeMap, structs, meta, generatedIdTables, plan)
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

interface ReadPrint {
	readonly grammar: GrammarName;
	readonly ctx: ReadFactsCtx;
	readonly envelopeExtras: Map<string, EnvelopeClaims>;
	readonly printedEnums: Set<string>;
	readonly admitted: Map<string, number[]>;
	readonly blankChoices: Set<string>;
}

function readPrintOf(
	grammar: GrammarName,
	structs: readonly EmittedStruct[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[],
	generatedIdTables: GeneratedIdTables
): ReadPrint {
	return {
		grammar,
		envelopeExtras: new Map(),
		printedEnums: new Set(),
		ctx: {
			nodeMap,
			kindEntries,
			names: readNames(kindEntries, generatedFieldIds(generatedIdTables)),
			listOwners: new Set(listViewOwners(nodeMap).map((node) => node.kind)),
			envelopeIds: new Set(aliasEnvelopeIds(aliasEnvelopesOf(nodeMap))),
			folds: generatedIdTables.folds ?? new Map(),
			grammar
		},
		admitted: new Map(),
		blankChoices: new Set()
	};
}

const TRANSPORT_DERIVE = '#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]';
const TRANSPORT_DERIVE_UNIT = '#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]';
const TRANSPORT_DERIVE_ENUM_KIND = '#[derive(Debug, Clone, Copy, PartialEq, Eq, ::sittir_core::Transport)]';

function admit(read: ReadPrint, typeName: string, ids: readonly number[]): void {
	const known = read.admitted.get(typeName);
	if (known === undefined) read.admitted.set(typeName, [...new Set(ids)]);
	else for (const id of ids) if (!known.includes(id)) known.push(id);
}

function variantKindLines(
	enumName: string,
	variantName: string,
	variant: AssembledNode | undefined,
	ids: readonly number[],
	read: ReadPrint
): string[] {
	read.printedEnums.add(enumName);
	if (variant instanceof AssembledAlias) {
		read.envelopeExtras.set(`${enumName}.${variantName}`, {
			display: variant.aliasTypeId,
			extras: ids.filter((id) => id !== variant.aliasTypeId)
		});
		return [`    #[kind(${variantKindArgs([variant.aliasTypeId], true, read.ctx)})]`];
	}
	return ids.length === 0 ? [] : [`    #[kind(${variantKindArgs(ids, false, read.ctx)})]`];
}

function renderTransportSupport(
	lang: GrammarName,
	nodeMap: NodeMap,
	structs: EmittedStruct[],
	meta: MetaData,
	generatedIdTables: GeneratedIdTables,
	plan: RenderPlan
): string {
	const projection = getTransportProjection(nodeMap);
	const nodes = projection.nodes;

	const kindEntries = collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);
	const kidByKind = buildKindIdByKind(kindEntries);
	const fixed = collectFixedLiterals(projection, nodeMap, kindEntries, kidByKind);
	const payloadNodes = nodes.filter((node) => !isFixedTextLeaf(node));

	const read = readPrintOf(lang, structs, nodeMap, kindEntries, generatedIdTables);
	const anyTransportLines = renderAnyTransportWithNapiFromValue(payloadNodes, fixed, nodeMap, kindEntries, read);

	const usedSupertypeNames = collectUsedSupertypeNames(nodes, nodeMap);
	const selfAliasIdsBySupertype = new Map<string, number[]>();
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
	const supertypeEnumLines: string[] = [];
	for (const [, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype)) continue;
		if (!usedSupertypeNames.has(node.typeName)) continue;
		const enumName = `${rustTypeIdent(node.typeName)}Transport`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		supertypeEnumLines.push(
			...emitSupertypeTransportEnum(node, kidByKind, nodeMap, fixed, kindEntries, selfAliasIdsBySupertype.get(node.kind), read)
		);
	}

	const perSlotEnums = collectPerSlotChildEnums(nodes, nodeMap);
	const choices = shareIdenticalChoices(perSlotEnums, (entry) =>
		emitPerSlotChildEnum(entry, kidByKind, nodeMap, fixed, kindEntries, plan, read)
	);
	const perSlotEnumLines: string[] = choices.emitted.flatMap(({ lines }) => lines);
	const structLines = nodes.flatMap((node) =>
		isFixedTextLeaf(node)
			? renderFixedLiteralTransport(rustTransportStructName(node), fixedLiteralOf(fixed, node.kind), read)
			: renderTransportStruct(node, nodeMap, choices.names, kindEntries, plan, read)
	);
	assertReadableTransports(nodes, nodeMap, choices.names, read);
	assertEnvelopeExtrasPinned(read.grammar, read.envelopeExtras, read.printedEnums);
	const seatTargetLines = renderSeatTargets(
		nodes,
		nodeMap,
		plan,
		kindEntries,
		usedSupertypeNames,
		choices.emitted.map(({ entry }) => entry)
	);

	return pruneUnreferencedBridges(
		[
			...anyTransportLines,
			'',
			...renderTriviaTransportSupport(nodeMap, fixed, kindEntries),
			'',
			...renderVerbatimTransport(),
			...(supertypeEnumLines.length > 0 ? [...supertypeEnumLines, ''] : []),
			...(perSlotEnumLines.length > 0 ? [...perSlotEnumLines, ''] : []),
			...structLines,
			...seatTargetLines,
			'',
			'',
			...renderTypedDispatch(
				structs,
				payloadNodes,
				projection.literals,
				fixed,
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
		'#[derive(Debug, Clone, PartialEq)]',
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

function commonRustUseImports(): string {
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
	lines.push('#[cfg(feature = "napi-bindings")]');
	lines.push('use ::napi_derive::napi;');
	lines.push('');
	return lines.join('\n');
}

function collectUsedSupertypeNames(nodes: readonly AssembledNode[], nodeMap: NodeMap): Set<string> {
	const used = new Set<string>();

	const collectFromSlots = (slots: readonly AssembledNonterminal[]): void => {
		for (const slot of slots) {
			const shape = transportSlotShapeOf(slot, nodeMap);
			if (shape.tag === 'supertype') used.add(shape.supertypeName);
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

function anyTransportPrepareArms(
	payloadNodes: readonly AssembledNode[],
	fixed: FixedLiterals
): { readonly variant: string; readonly payload: boolean }[] {
	return [
		...payloadNodes.map((node) => ({ variant: rustTransportVariantName(node), payload: true })),
		...[...fixed.values()].map((literal) => ({ variant: literal.variant, payload: false })),
		{ variant: 'Verbatim', payload: true }
	];
}

function isPrepareFilled(slot: AssembledNonterminal): boolean {
	return slot.registeredOption === 'choice' && !isMultiple(slot);
}

function isTransportRequired(slot: AssembledNonterminal): boolean {
	return isRequired(slot) && !isPrepareFilled(slot);
}

function nodeTransportHasRequiredField(node: AssembledNode): boolean {
	if (isTerminalNode(node)) {
		return true;
	}
	return node.slots.some((slot) => isTransportRequired(slot));
}

function isLeafLikeNode(n: AssembledNode): boolean {
	return isTerminalNode(n);
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

function wirePropertyRead(key: string, rustType?: string): string {
	const turbofish = rustType === undefined ? '' : `::<${rustType}>`;
	return `::sittir_core::boundary::property${turbofish}(env, napi_val, c${rustStringLiteral(key)})?`;
}

function emitTransportEnumFromNapiValueBody(
	enumName: string,
	kindIdArms: readonly string[],
	admitsVerbatim: boolean,
	textArms: readonly string[] = []
): string[] {
	const lines: string[] = [];
	lines.push(`        match ::sittir_core::slot::transport_value_type(env, napi_val)? {`);
	lines.push(`            ::napi::ValueType::Number => {`);
	lines.push(`                match u16::from_napi_value(env, napi_val)? {`);
	for (const arm of kindIdArms) lines.push(`    ${arm}`);
	lines.push(`                }`);
	lines.push(`            }`);
	lines.push(`            ::napi::ValueType::Object => {`);
	lines.push(`                let kind_id: u16 = ${wirePropertyRead('$type')}.ok_or_else(||`);
	lines.push(
		`                    ::napi::Error::from_reason(${JSON.stringify(`$type property missing in ${enumName}`)})`
	);
	lines.push(`                )?;`);
	if (textArms.length > 0) lines.push(`                let text: Option<String> = ${wirePropertyRead('$text')};`);
	lines.push(`                match kind_id {`);
	if (admitsVerbatim) {
		lines.push(`                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {`);
		lines.push(
			`                        text: ${wirePropertyRead('$text')}.ok_or_else(|| ::napi::Error::from_reason(${JSON.stringify(`ERROR node without $text in ${enumName}`)}))?,`
		);
		lines.push(`                    })),`);
	}
	for (const arm of textArms) lines.push(`    ${arm}`);
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
	if (isBuilderTextLeaf(node)) return 1;
	if (isBuilderlessPunctuationLeaf(node)) return 2;
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
	kindIdByKind: ReadonlyMap<string, number>,
	nodeMap: NodeMap,
	fixed: FixedLiterals,
	kindEntries: readonly KindEnumEntry[],
	selfAliasIds: readonly number[] | undefined,
	read: ReadPrint
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
			if (isFixedTextLeaf(subNode)) continue;
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

	const claimedBy = new Map<string, number[]>();
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
			.filter((t) => t.order >= 0 && !isFixedTextLeaf(t.subNode))
			.sort((a, b) => a.order - b.order)
			.map((t) => ({
				typeName: rustTransportStructName(t.subNode),
				variant: rustTypeIdent(t.subNode.typeName)
			}));
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
				unit: isFixedTextLeaf(subNode) ? fixedLiteralOf(fixed, subKind) : undefined,
				boxed: isBoxed(subKind, subNode),
				ownIds: idsOf(undefined),
				acceptedIds
			};
		});
		const claim = (member: (typeof members)[number], ids: readonly number[]): void => {
			for (const id of ids) {
				if (emittedIds.has(id)) continue;
				emittedIds.add(id);
				claimedBy.set(member.variant, [...(claimedBy.get(member.variant) ?? []), id]);
				if (member.unit !== undefined) {
					arms.push(unitDecodeArm(id, member.unit, 'Self'));
				} else if (member.boxed) {
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

	lines.push(TRANSPORT_DERIVE);
	lines.push(`#[transport(choice)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const { subKind, subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		const typeName = rustTransportStructName(subNode);
		const variantType = isBoxed(subKind, subNode) ? `Box<${typeName}>` : typeName;
		lines.push(...variantKindLines(enumName, variant, subNode, claimedBy.get(variant) ?? [], read));
		lines.push(isFixedTextLeaf(subNode) ? `    ${variant},` : `    ${variant}(${variantType}),`);
	}
	if (admitsVerbatim) lines.push(`    Verbatim(VerbatimTransport),`);
	lines.push(`}`);
	lines.push(``);
	admit(read, enumName, [...claimedBy.values()].flat());
	lines.push(
		...prepareEnumImpl(enumName, [
			...validSubtypes.map(({ subNode }) => ({
				variant: rustTypeIdent(subNode.typeName),
				payload: !isFixedTextLeaf(subNode)
			})),
			...(admitsVerbatim ? [{ variant: 'Verbatim', payload: true }] : [])
		])
	);

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
			validSubtypes.map(({ subKind, subNode }) => {
				const variant = rustTypeIdent(subNode.typeName);
				if (!isFixedTextLeaf(subNode)) return { variant, payload: true };
				const ownId = fixedLiteralOf(fixed, subKind).ownId;
				return { variant, payload: false, ids: ownId === undefined ? [] : [ownId] };
			}),
			admitsVerbatim
				? validSubtypes
						.filter(({ subNode }) => subNode.modelType === 'pattern')
						.map(({ subKind }) => kindIdByKind.get(subKind))
						.filter((id): id is number => id !== undefined)
				: undefined
		)
	);

	lines.push(`fn ${rustSnakeIdent(supertypeNode.typeName)}_transport_to_any(t: ${enumName}) -> AnyTransport {`);
	lines.push(`    match t {`);
	for (const { subKind, subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		const boxed = isBoxed(subKind, subNode);
		if (isFixedTextLeaf(subNode)) {
			lines.push(`        ${enumName}::${variant} => AnyTransport::${variant},`);
		} else if (subNode instanceof AssembledSupertype) {
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

function emitSupertypeRenderHelper(supertypeNode: AssembledSupertype, nodeMap: NodeMap, fixed: FixedLiterals): string[] {
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
		if (isFixedTextLeaf(subNode)) {
			lines.push(`        ${enumName}::${variant} => ${fixedLiteralOf(fixed, subKind).renderFn}(w),`);
			continue;
		}
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
	kindEntries: readonly KindEnumEntry[];
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
	if (parseName !== undefined) {
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
	if (node.modelType === 'pattern' && node.fixedLiteralText !== undefined) {
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
	kindEntries: readonly KindEnumEntry[]
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
		if (transportSlotShapeOf(field, nodeMap).tag !== 'union') return;
		const slotKinds: string[] = [];
		const literalSet = new Set<string>();
		const literals: TransportLiteral[] = [];
		for (const component of fieldTypeComponents(field, nodeMap)) {
			if (component.kind === 'nodeKind') {
				if (!slotKinds.includes(component.rawKind)) slotKinds.push(component.rawKind);
				continue;
			}
			if (component.kind !== 'literal') continue;
			if (component.enumKind !== undefined && nodeMap.nodes.get(component.enumKind)?.hidden === false) {
				if (!slotKinds.includes(component.enumKind)) slotKinds.push(component.enumKind);
				continue;
			}
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

type ChoiceNames = ReadonlyMap<string, string>;

interface SharedChoices {
	readonly emitted: readonly { readonly entry: PerSlotChildEnum; readonly lines: readonly string[] }[];
	readonly names: ChoiceNames;
}

function choiceKey(typeName: string, fieldName: string): string {
	return `${typeName}\0${fieldName}`;
}

function shareIdenticalChoices(
	entries: readonly PerSlotChildEnum[],
	render: (entry: PerSlotChildEnum) => readonly string[]
): SharedChoices {
	const emitted: { entry: PerSlotChildEnum; lines: readonly string[] }[] = [];
	const nameByBody = new Map<string, string>();
	const names = new Map<string, string>();
	for (const entry of entries) {
		const name = perSlotEnumName(entry.typeName, entry.fieldName);
		const lines = render(entry);
		const body = lines.join('\n').replace(new RegExp(`\\b${name}\\b`, 'g'), '\0');
		const shared = nameByBody.get(body);
		if (shared === undefined) {
			nameByBody.set(body, name);
			emitted.push({ entry, lines });
		}
		names.set(choiceKey(entry.typeName, entry.fieldName), shared ?? name);
	}
	return { emitted, names };
}

function choiceNameOf(choices: ChoiceNames, typeName: string, fieldName: string): string {
	const name = choices.get(choiceKey(typeName, fieldName));
	if (name === undefined) {
		throw new Error(`render-module: ${typeName}.${fieldName} is typed by its own choice, but none was collected for it`);
	}
	return name;
}

function resolveLiteralKindId(literal: TransportLiteral, kindEntries: readonly KindEnumEntry[]): number | undefined {
	if (literal.resolvedKindId !== undefined) {
		return literal.resolvedKindId;
	}
	const isKindDerived = literal.kind !== literal.text;
	if (!isKindDerived) return undefined;
	const id = findKindEntry(kindEntries, literal.kind)?.id ?? findKindEntryForLiteral(kindEntries, literal.text)?.id;
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

function literalSeamsOf(
	literal: TransportLiteral,
	entry: PerSlotChildEnum,
	plan: RenderPlan,
	kindEntries: readonly KindEnumEntry[],
	nodeMap: NodeMap
): LiteralArmSeams | undefined {
	const owner = displayNameOf(literal.enumKind ?? entry.ownerKind, nodeMap);
	const sites: { before?: string; after?: string } = {};
	const token = tokenNameOfText(literal.text, kindEntries);
	for (const site of plan.spacingSites) {
		if (site.kind !== owner || site.side !== 'seam' || site.seat !== undefined) continue;
		const seam = parseSeamLabel(site.address);
		if (token !== undefined && seam?.token === token) sites[seam.side] = site.constName;
	}
	return sites.before !== undefined || sites.after !== undefined ? sites : undefined;
}

interface ChoiceUnit {
	readonly fixed: FixedLiteral;
	readonly siteImmediate: boolean;
	readonly seams: LiteralArmSeams | undefined;
}

function choiceUnitsOf(
	entry: PerSlotChildEnum,
	validKinds: readonly { readonly node: AssembledNode }[],
	fixed: FixedLiterals,
	plan: RenderPlan,
	kindEntries: readonly KindEnumEntry[],
	nodeMap: NodeMap
): ReadonlyMap<string, ChoiceUnit> {
	const units = new Map<string, ChoiceUnit>();
	for (const { node } of validKinds) {
		if (!isFixedTextLeaf(node)) continue;
		const unit = fixedLiteralOf(fixed, node.kind);
		units.set(unit.variant, { fixed: unit, siteImmediate: false, seams: undefined });
	}
	for (const literal of entry.literals) {
		const unit = fixedLiteralOf(fixed, literal.kind, literal.text);
		const seams = literalSeamsOf(literal, entry, plan, kindEntries, nodeMap);
		const prior = units.get(unit.variant);
		if (
			prior?.seams !== undefined &&
			seams !== undefined &&
			(prior.seams.before !== seams.before || prior.seams.after !== seams.after)
		) {
			throw new Error(
				`render-module: ${entry.ownerKind}.${entry.fieldName} stores the fixed literal '${literal.kind}' at two sites with different seams`
			);
		}
		units.set(unit.variant, {
			fixed: unit,
			siteImmediate: (prior?.siteImmediate ?? false) || (literal.immediate === true && !unit.immediate),
			seams: prior?.seams ?? seams
		});
	}
	return units;
}

function choiceUnitArm(enumName: string, unit: ChoiceUnit): string[] {
	const call = `${unit.fixed.renderFn}(w)`;
	const write = unit.siteImmediate ? `{ w.adjacent(); ${call} }` : call;
	return unit.seams === undefined
		? [`            ${enumName}::${unit.fixed.variant} => ${write},`]
		: literalSeamedArm(enumName, unit.fixed.variant, write, unit.seams);
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

interface UnitKindIds {
	readonly ids: readonly { readonly id: number; readonly unit: FixedLiteral }[];
	readonly allResolved: boolean;
}

function unitKindIdsOf(
	entry: PerSlotChildEnum,
	units: ReadonlyMap<string, ChoiceUnit>,
	acceptedIdsOf: (kind: string, node: AssembledNode) => readonly number[],
	validKinds: readonly { readonly kind: string; readonly node: AssembledNode }[],
	fixed: FixedLiterals,
	kindEntries: readonly KindEnumEntry[]
): UnitKindIds {
	const ids: { id: number; unit: FixedLiteral }[] = [];
	const seen = new Set<number>();
	const push = (id: number, unit: FixedLiteral): void => {
		if (seen.has(id)) return;
		seen.add(id);
		ids.push({ id, unit });
	};
	let allResolved = true;
	for (const literal of entry.literals) {
		const id = resolveLiteralKindId(literal, kindEntries);
		if (id === undefined) allResolved = false;
		else push(id, fixedLiteralOf(fixed, literal.kind));
	}
	for (const { kind, node } of validKinds) {
		if (!isFixedTextLeaf(node)) continue;
		for (const id of acceptedIdsOf(kind, node)) push(id, fixedLiteralOf(fixed, node.kind));
	}
	return { ids, allResolved };
}

function prepareFilledSlotOf(entry: PerSlotChildEnum, nodeMap: NodeMap): AssembledNonterminal | undefined {
	const slot = nodeMap.nodes.get(entry.ownerKind)?.slots.find((candidate) => candidate.name === entry.fieldName);
	return slot !== undefined && isPrepareFilled(slot) ? slot : undefined;
}

function fromKindIdImpl(
	enumName: string,
	entry: PerSlotChildEnum,
	unitIds: UnitKindIds,
	hasPayloadVariants: boolean,
	blank: boolean
): string[] {
	if (hasPayloadVariants || !unitIds.allResolved) {
		throw new Error(
			`render-module: ${entry.ownerKind}.${entry.fieldName} is a registered choice option filled at prepare, but ${enumName} has an arm no kind id can build`
		);
	}
	return [
		`impl ${enumName} {`,
		'    pub fn from_kind_id(id: u16) -> Option<Self> {',
		'        match id {',
		...unitIds.ids.map(({ id, unit }) => `            ${id} => Some(Self::${unit.variant}),`),
		...(blank ? [`            ${BLANK_KIND_ID} => Some(Self::${BLANK_VARIANT}),`] : []),
		'            _ => None,',
		'        }',
		'    }',
		'}',
		''
	];
}

function alternatesOf(ids: readonly number[], alternates: ReadonlyMap<number, number>): number[] {
	return [...alternates].filter(([, stored]) => ids.includes(stored)).map(([alt]) => alt);
}

function emitPerSlotChildEnum(
	entry: PerSlotChildEnum,
	kindIdByKind: ReadonlyMap<string, number>,
	nodeMap: NodeMap,
	fixed: FixedLiterals,
	kindEntries: readonly KindEnumEntry[],
	plan: RenderPlan,
	read: ReadPrint
): string[] {
	const enumName = perSlotEnumName(entry.typeName, entry.fieldName);
	const lines: string[] = [];
	const ownerKind = entry.ownerKind;

	const validKinds = expandConcreteTransportKinds(entry.kinds, nodeMap);
	const nodeKinds = validKinds.filter(({ node }) => !isFixedTextLeaf(node));
	const units = choiceUnitsOf(entry, validKinds, fixed, plan, kindEntries, nodeMap);
	const admitsVerbatim = validKinds.some(({ node }) => node.modelType === 'pattern');

	const isBoxed = (variantKind: string, variantNode: AssembledNode): boolean =>
		boxedInEnum(variantKind, ownerKind, variantNode, nodeMap);
	const modelSlot = nodeMap.nodes.get(ownerKind)?.slots.find((candidate) => candidate.name === entry.fieldName);
	const blank = modelSlot !== undefined && hasBlankArm(modelSlot);

	const acceptedIdsOf = (kind: string, node: AssembledNode): readonly number[] => {
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
			rustTypeIdent(node.typeName),
			enumName,
			`in ${ownerKind}.${entry.fieldName}`,
			kindEntries
		);
		return acceptedIds;
	};
	const unitIds = unitKindIdsOf(entry, units, acceptedIdsOf, validKinds, fixed, kindEntries);
	const kindIdArms: string[] = [];
	const emittedIds = new Set<number>();
	const claimedBy = new Map<string, number[]>();
	const claim = (variant: string, id: number): void => {
		claimedBy.set(variant, [...(claimedBy.get(variant) ?? []), id]);
	};
	for (const { id, unit } of unitIds.ids) {
		emittedIds.add(id);
		claim(unit.variant, id);
		kindIdArms.push(unitDecodeArm(id, unit, 'Self'));
	}
	if (blank) {
		emittedIds.add(BLANK_KIND_ID);
		kindIdArms.push(`                ${BLANK_KIND_ID} => Ok(Self::${BLANK_VARIANT}),`);
	}
	for (const { kind, node, concreteName } of kindIdStoredFirst(nodeKinds, (v) => v.node)) {
		const variant = rustTypeIdent(node.typeName);
		const typeName = concreteName;
		const acceptedIds = acceptedIdsOf(kind, node);
		const boxed = isBoxed(kind, node);
		for (const id of acceptedIds) {
			if (emittedIds.has(id)) continue;
			emittedIds.add(id);
			claim(variant, id);
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
		const parseEntry = findKindEntry(kindEntries, parseName);
		const aliasId = parseEntry?.parseId ?? parseEntry?.id ?? kindIdByKind.get(parseName);
		if (aliasId === undefined || emittedIds.has(aliasId)) continue;
		emittedIds.add(aliasId);
		const leafTrials = expandConcreteTransportKinds([storageKind], nodeMap)
			.map((e) => ({ e, order: aliasLeafTrialOrder(e.node), own: validKindSet.get(e.kind) }))
			.filter((t) => t.order >= 0 && t.own !== undefined && !isFixedTextLeaf(t.own.node))
			.sort((a, b) => a.order - b.order)
			.map((t) => ({ typeName: t.own!.concreteName, variant: rustTypeIdent(t.own!.node.typeName) }));
		kindIdArms.push(...emitAliasUnwrapRecurseArm(aliasId, enumName, 'alias-wrapper', leafTrials));
	}
	kindIdArms.push(`                other => Err(::napi::Error::from_reason(format!(`);
	kindIdArms.push(`                    "unknown kind id {other} in ${enumName}",`);
	kindIdArms.push(`                ))),`);

	const altIds = new Map(modelSlot === undefined ? [] : kindEnumAltIdPairs(modelSlot, nodeMap));
	lines.push(TRANSPORT_DERIVE);
	lines.push(`#[transport(choice)]`);
	lines.push(`pub enum ${enumName} {`);
	for (const { kind, node, concreteName } of nodeKinds) {
		const variant = rustTypeIdent(node.typeName);
		const variantType = isBoxed(kind, node) ? `Box<${concreteName}>` : concreteName;
		lines.push(...variantKindLines(enumName, variant, node, claimedBy.get(variant) ?? [], read));
		lines.push(`    ${variant}(${variantType}),`);
	}
	for (const variant of units.keys()) {
		const claimed = claimedBy.get(variant) ?? [];
		lines.push(...variantKindLines(enumName, variant, undefined, [...claimed, ...alternatesOf(claimed, altIds)], read));
		lines.push(`    ${variant},`);
	}
	if (blank) lines.push(`    #[transport(blank)]`, `    ${BLANK_VARIANT},`);
	if (admitsVerbatim) lines.push(`    Verbatim(VerbatimTransport),`);
	lines.push(`}`);
	lines.push(``);
	admit(read, enumName, [...claimedBy.values()].flat());
	if (blank) read.blankChoices.add(enumName);
	lines.push(
		...prepareEnumImpl(enumName, [
			...nodeKinds.map(({ node }) => ({ variant: rustTypeIdent(node.typeName), payload: true })),
			...[...units.keys()].map((variant) => ({ variant, payload: false })),
			...(blank ? [{ variant: BLANK_VARIANT, payload: false }] : []),
			...(admitsVerbatim ? [{ variant: 'Verbatim', payload: true }] : [])
		])
	);
	lines.push(
		...kindOfImplLines(
			enumName,
			[
				...nodeKinds.map(({ node }) => ({ variant: rustTypeIdent(node.typeName), payload: true })),
				...[...units.values()].map(({ fixed: unit }) => ({
					variant: unit.variant,
					payload: false,
					ids: unit.ownId === undefined ? [] : [unit.ownId]
				})),
				...(blank ? [{ variant: BLANK_VARIANT, payload: false, ids: [] }] : [])
			],
			admitsVerbatim
				? validKinds
						.filter(({ node }) => node.modelType === 'pattern')
						.map(({ kind }) => kindIdByKind.get(kind))
						.filter((id): id is number => id !== undefined)
				: undefined
		)
	);

	if (prepareFilledSlotOf(entry, nodeMap) !== undefined) {
		lines.push(...fromKindIdImpl(enumName, entry, unitIds, nodeKinds.length > 0, blank));
	}
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

	lines.push(`impl ::sittir_core::render::Render for ${enumName} {`);
	lines.push(
		`    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	lines.push(`        match self {`);
	for (const { kind, node } of nodeKinds) {
		const variant = rustTypeIdent(node.typeName);
		const innerExpr = isBoxed(kind, node) ? 'inner.as_ref()' : 'inner';
		const call = `${innerExpr}.render(w)`;
		const arm =
			!(node instanceof AssembledLeaf) && isLeftImmediateKind(kind, nodeMap) ? `{ w.adjacent(); ${call} }` : call;
		lines.push(`            ${enumName}::${variant}(inner) => ${arm},`);
	}
	for (const unit of units.values()) lines.push(...choiceUnitArm(enumName, unit));
	if (blank) lines.push(`            ${enumName}::${BLANK_VARIANT} => Ok(()),`);
	if (admitsVerbatim) lines.push(`            ${verbatimRenderArm(enumName, entry.verbatimImmediate)}`);
	lines.push(`        }`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push(``);

	return lines;
}

function renderAnyTransportWithNapiFromValue(
	payloadNodes: readonly AssembledNode[],
	fixed: FixedLiterals,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[],
	read: ReadPrint
): string[] {
	const kindIdByKind = buildKindIdByKind(kindEntries);

	const lines: string[] = [];

	const emittedNodeIds = new Set<number>();
	const claimedBy = new Map<string, number[]>();
	const idArms: string[] = [];
	for (const node of payloadNodes) {
		const id = kindIdByKind.get(node.kind);
		if (id === undefined) continue;
		if (emittedNodeIds.has(id)) continue;
		emittedNodeIds.add(id);
		const variant = rustTransportVariantName(node);
		const structName = rustTransportStructName(node);
		const constName = toScreamingSnakeCase(kindIdMemberName(nodeMap, node.kind), node.kind);
		claimedBy.set(variant, [...(claimedBy.get(variant) ?? []), id]);
		idArms.push(`                // kind: ${node.kind} (${constName})`);
		idArms.push(`                ${id} => Ok(AnyTransport::${variant}(`);
		idArms.push(`                    ${structName}::from_napi_value(env, napi_val)?`);
		idArms.push(`                )),`);
	}
	for (const literal of fixed.values()) {
		const id = literal.ownId;
		if (id === undefined || emittedNodeIds.has(id)) continue;
		emittedNodeIds.add(id);
		claimedBy.set(literal.variant, [...(claimedBy.get(literal.variant) ?? []), id]);
		idArms.push(`                // kind: ${literal.kind}`);
		idArms.push(unitDecodeArm(id, literal, 'AnyTransport'));
	}

	lines.push(TRANSPORT_DERIVE);
	lines.push('#[transport(choice)]');
	lines.push('pub enum AnyTransport {');
	for (const node of payloadNodes) {
		const variant = rustTransportVariantName(node);
		const structName = rustTransportStructName(node);
		lines.push(...variantKindLines('AnyTransport', variant, node, claimedBy.get(variant) ?? [], read));
		lines.push(`    ${variant}(${structName}),`);
	}
	for (const literal of fixed.values()) {
		lines.push(...variantKindLines('AnyTransport', literal.variant, undefined, claimedBy.get(literal.variant) ?? [], read));
		lines.push(`    ${literal.variant},`);
	}
	lines.push('    Verbatim(VerbatimTransport),');
	lines.push('}');
	lines.push('');
	admit(read, 'AnyTransport', [...claimedBy.values()].flat());
	lines.push(...prepareEnumImpl('AnyTransport', anyTransportPrepareArms(payloadNodes, fixed)));

	lines.push('#[cfg(feature = "napi-bindings")]');
	lines.push('impl ::napi::bindgen_prelude::FromNapiValue for AnyTransport {');
	lines.push('    unsafe fn from_napi_value(');
	lines.push('        env: ::napi::sys::napi_env,');
	lines.push('        napi_val: ::napi::sys::napi_value,');
	lines.push('    ) -> ::napi::Result<Self> {');
	lines.push('        let kind_id = if let Ok(kind_id) = u16::from_napi_value(env, napi_val) {');
	lines.push('            Some(kind_id)');
	lines.push('        } else {');
	lines.push(`            ${wirePropertyRead('$type', 'u16')}`);
	lines.push('        };');
	lines.push('        if let Some(kind_id) = kind_id {');
	lines.push('            return match kind_id {');

	lines.push(...idArms);

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


function renderTriviaTransportSupport(
	nodeMap: NodeMap,
	fixed: FixedLiterals,
	kindEntries: readonly KindEnumEntry[]
): string[] {
	const extrasNodes = [...triviaKinds(nodeMap)]
		.map((kind) => nodeMap.nodes.get(kind))
		.filter((node): node is AssembledNode => node !== undefined && !(node instanceof AssembledSupertype));
	const unitOf = (node: AssembledNode): FixedLiteral | undefined =>
		isFixedTextLeaf(node) ? fixedLiteralOf(fixed, node.kind) : undefined;

	const lines: string[] = [];
	lines.push('#[derive(Debug, Clone, PartialEq)]');
	lines.push('pub enum TriviaTransport {');
	for (const node of extrasNodes) {
		const variant = rustTransportVariantName(node);
		lines.push(unitOf(node) === undefined ? `    ${variant}(${rustTransportStructName(node)}),` : `    ${variant},`);
	}
	lines.push('    Verbatim(VerbatimTransport),');
	lines.push('    Text(::sittir_core::trivia::TriviaText),');
	lines.push('}');
	lines.push('');
	lines.push(
		...prepareEnumImpl('TriviaTransport', [
			...extrasNodes.map((node) => ({ variant: rustTransportVariantName(node), payload: unitOf(node) === undefined })),
			{ variant: 'Verbatim', payload: true },
			{ variant: 'Text', payload: true }
		])
	);

	lines.push('impl ::sittir_core::render::Render for TriviaTransport {');
	lines.push(
		'    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {'
	);
	lines.push('        match self {');
	for (const node of extrasNodes) {
		const variant = rustTransportVariantName(node);
		const unit = unitOf(node);
		lines.push(
			unit === undefined
				? `            TriviaTransport::${variant}(t) => t.render(w),`
				: `            TriviaTransport::${variant} => ${unit.renderFn}(w),`
		);
	}
	lines.push('            TriviaTransport::Verbatim(t) => t.render(w),');
	lines.push('            TriviaTransport::Text(t) => t.render(w),');
	lines.push('        }');
	lines.push('    }');
	lines.push('}');
	lines.push('');

	const whitespaceKinds = new Set(whitespaceTriviaKinds(nodeMap));
	const kindIdByKind = buildKindIdByKind(kindEntries);
	lines.push('impl ::sittir_core::trivia::TriviaSeam for TriviaTransport {');
	lines.push('    fn seam_text(&self) -> Option<&str> {');
	lines.push('        match self {');
	for (const node of extrasNodes) {
		if (!whitespaceKinds.has(node.kind)) continue;
		const unit = fixedLiteralOf(fixed, node.kind);
		lines.push(`            TriviaTransport::${unit.variant} => Some(${rustStringLiteral(unit.text)}),`);
	}
	lines.push('            _ => None,');
	lines.push('        }');
	lines.push('    }');
	lines.push('}');
	lines.push('');

	const kindIdArms: string[] = [];
	for (const node of extrasNodes) {
		const id = kindIdByKind.get(node.kind);
		if (id === undefined) continue;
		const variant = rustTransportVariantName(node);
		const unit = unitOf(node);
		kindIdArms.push(
			unit === undefined
				? `                ${id} => Ok(Self::${variant}(${rustTransportStructName(node)}::from_napi_value(env, napi_val)?)),`
				: unitDecodeArm(id, unit, 'Self')
		);
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
	const textArms = extrasNodes.flatMap((node) => {
		const id = kindIdByKind.get(node.kind);
		return id === undefined || !(node instanceof AbstractAssembledCompound)
			? []
			: [
					`                ${id} if text.is_some() => Ok(Self::Text(::sittir_core::trivia::TriviaText { kind: ::sittir_core::types::KindId(${id}), text: text.unwrap_or_default() })),`
				];
	});
	lines.push(...emitTransportEnumFromNapiValueBody('TriviaTransport', kindIdArms, true, textArms));
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

	lines.push('pub type TransportLayout = ::sittir_core::layout::TransportLayout<TriviaTransport>;');
	lines.push('');

	return lines;
}

const PREPARE_MOD = '::sittir_core::prepare';
const BLANK_VARIANT = 'Blank';
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
		...(anyPayload
			? [
					`    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {`,
					`        match self {`,
					...arms.map((a) =>
						a.payload ? `            ${enumName}::${a.variant}(t) => t.source_gap(),` : `            ${enumName}::${a.variant} => None,`
					),
					`        }`,
					`    }`,
					`    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {`,
					`        match self {`,
					...arms.map((a) =>
						a.payload ? `            ${enumName}::${a.variant}(t) => t.gap_edges(),` : `            ${enumName}::${a.variant} => None,`
					),
					`        }`,
					`    }`
				]
			: []),
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
	kindEntries: readonly KindEntryLike[]
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

function edgeIdOf(plan: RenderPlan, node: AssembledNode, kindEntries: readonly KindEntryLike[]): number {
	const kind = node.display.name;
	const id = edgeKindId(kindEntries, kind);
	if (id !== undefined && edgeRowKindsOf(plan, kindEntries).has(id)) return id;
	throw new Error(`kind '${kind}' has kind-edge sites but no edge row to prepare and write them from`);
}

function sourceTrailingSeparator(
	node: AssembledList,
	kindEntries: readonly KindEnumEntry[]
): { readonly kind: number; readonly separators: readonly number[] } | undefined {
	if (node.trailingDelimiter !== 'optional') return undefined;
	const idOf = (entry: KindEnumEntry | undefined, spelled: string): number => {
		if (entry === undefined) {
			throw new Error(`list '${node.kind}' has an optional trailing separator ${JSON.stringify(spelled)} with no kind id to find in its source`);
		}
		return entry.id;
	};
	const model = renderSlotModelOf(node);
	const field = [...model.named, ...model.unnamed].find(isMultiple);
	const literals = field === undefined ? [] : slotSeparatorTexts(field, false);
	const separators = [
		...literals.map((text) => idOf(findKindEntryForLiteral(kindEntries, text), text)),
		...node.separatorTokenArms.map((arm) =>
			arm.type === STRING ? idOf(findKindEntryForLiteral(kindEntries, arm.value), arm.value) : idOf(findKindEntry(kindEntries, arm.name), arm.name)
		)
	];
	return { kind: idOf(findKindEntry(kindEntries, node.kind), node.kind), separators: [...new Set(separators)] };
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
		const items = hasOptionalElements(field) ? 'iter_mut().map(Option::as_mut)' : 'iter_mut().map(Some)';
		const allowedOf = (site: SpacingSite | undefined) =>
			site === undefined ? '&[]' : `options::allowed(options::${site.constName})`;
		const call = (list: string) =>
			`::sittir_core::prepare::fill_list_gaps(${list}.${items}, ${JSON.stringify(token)}, ${allowedOf(first)}, ${allowedOf(sites.after)}, &options::WHITESPACE, ctx);`;
		body.push(
			isTransportRequired(field)
				? `        ${call(`self.${ident}`)}`
				: `        if let Some(gap_items) = self.${ident}.as_mut() { ${call('gap_items')} }`
		);
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
	kindEntries: readonly KindEntryLike[]
): string[] {
	const reaches = seatReachOf(plan, nodeMap);
	if (!reaches(node.kind)) return [];
	const kind = node.display.name;
	if (isFixedTextLeaf(node)) {
		throw new Error(`kind '${kind}' is a fixed literal, a unit variant with no edges, but a list seats it`);
	}
	const body: string[] = [];
	if (seatedKindsOf(plan).has(kind)) {
		const id = edgeKindId(kindEntries, kind);
		if (id === undefined) throw new Error(`kind '${kind}' is seated in a list but has no kind id to find its seat by`);
		body.push(
			`        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(${id})) {`,
			'            return Some((self.layout.edges_mut(), site));',
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
	kindEntries: readonly KindEntryLike[],
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

function seatedListFields(plan: RenderPlan, node: AssembledNode, nodeMap: NodeMap): ReadonlySet<string> {
	const reaches = seatReachOf(plan, nodeMap);
	const slotModel = renderSlotModelOf(node);
	const seated = seatedTableNames(plan);
	const fields = new Set<string>();
	for (const field of [...slotModel.named, ...slotModel.unnamed]) {
		if (field.name === undefined || !isMultiple(field)) continue;
		if (!seated.has(seatTableName(node.display.name, field.name))) continue;
		if (!slotElementsReach(field, nodeMap, reaches)) continue;
		fields.add(field.name);
	}
	return fields;
}


function seatLoops(plan: RenderPlan, node: AssembledNode, nodeMap: NodeMap): string[] {
	const lines: string[] = [];
	const seated = seatedListFields(plan, node, nodeMap);
	const slotModel = renderSlotModelOf(node);
	for (const field of [...slotModel.named, ...slotModel.unnamed]) {
		if (field.name === undefined || !seated.has(field.name)) continue;
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
function optionDefaultFills(plan: RenderPlan, node: AssembledNode, choices: ChoiceNames): string[] {
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
			const build = `${choiceNameOf(choices, node.typeName, slot.name)}::from_kind_id(ctx.options.spacing[options::${site.constName}].arm)`;
			return `        if self.${ident}.is_none() { self.${ident} = ${build}.map(::sittir_core::SlotValue::Transport); }`;
		});
}

function rootEdgeStamp(plan: RenderPlan, node: AssembledNode, fillFields: readonly string[]): string[] {
	if (!node.grammarRoot || fillFields.length === 0) return [];
	const sites = new Map<'before' | 'after', SpacingSite>();
	for (const site of synthesizedSpacingSites(plan, node)) {
		if (site.side === 'seam' && isKindEdge(site)) sites.set(parseSeamLabel(site.address)!.side, site);
	}
	const allowedOf = (side: 'before' | 'after'): string => {
		const site = sites.get(side);
		if (site === undefined) throw new Error(`render: the grammar root '${node.kind}' has no ${side} edge site`);
		return `options::allowed(options::${site.constName})`;
	};
	const items = (end: 'first' | 'last'): string =>
		`[${(end === 'first' ? fillFields : [...fillFields].reverse()).map((f) => `::sittir_core::prepare::EdgeItems::${end}_item(&self.${f})`).join(', ')}].into_iter().flatten().next()`;
	return [
		`        let first = ${items('first')};`,
		`        let last = ${items('last')};`,
		`        let flanks = ::sittir_core::prepare::root_flanks(first, last, ${allowedOf('before')}, ${allowedOf('after')}, &options::WHITESPACE, ctx);`,
		`        ::sittir_core::prepare::fill_edges(self, flanks);`
	];
}

function prepareStructImpl(
	structName: string,
	node: AssembledNode,
	fillFields: readonly string[],
	plan: RenderPlan,
	isCompound: boolean,
	nodeMap: NodeMap,
	choices: ChoiceNames,
	kindEntries: readonly KindEnumEntry[]
): string[] {
	const body: string[] = ['        self.layout.prepare(ctx)?;'];
	if (isCompound) {
		body.push(...rootEdgeStamp(plan, node, fillFields));
		const delim = node instanceof AssembledList ? delimiterSiteOf(plan, node) : undefined;
		const trailing = delim !== undefined && node instanceof AssembledList ? sourceTrailingSeparator(node, kindEntries) : undefined;
		const edged = kindEdgeSidesOf(plan, node).size > 0;
		if (edged || trailing !== undefined) body.push('        let flank = self.layout.take_flank();');
		if (edged) {
			body.push(
				'        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);',
				'        ::sittir_core::prepare::prepare_edges(self, ctx);'
			);
		}
		body.push(...listGapClassification(plan, node));
		for (const site of synthesizedSpacingSites(plan, node)) {
			if (!carriesPerNodeValue(site)) continue;
			body.push(
				`        self.${rustFieldIdent(site.fieldIdent)}.get_or_insert(ctx.options.spacing[options::${site.constName}].arm);`
			);
		}
		body.push(...seatLoops(plan, node, nodeMap));
		if (delim !== undefined) {
			const fallback = `ctx.options.delimiter[options::${delim.constName}]`;
			const value =
				trailing === undefined
					? fallback
					: `::sittir_core::prepare::source_trailing_delimiter(flank.as_ref(), ::sittir_core::types::KindId(${trailing.kind}), &[${trailing.separators.join(', ')}], ${fallback}, ctx)`;
			body.push(`        self.delimiter.get_or_insert(${value});`);
		}
		const sep = node instanceof AssembledList ? separatorSiteOf(plan, node) : undefined;
		if (sep !== undefined)
			body.push(`        self.separator_kind.get_or_insert(ctx.options.spacing[options::${sep.constName}].arm);`);
		body.push(...optionDefaultFills(plan, node, choices));
		for (const f of fillFields) body.push(`        self.${f}.prepare(ctx)?;`);
	}
	return [
		`impl ${PREPARE_MOD}::Prepare for ${structName} {`,
		`    ${body.length > 0 ? PREPARE_SIG : PREPARE_SIG.replace('ctx:', '_ctx:')}`,
		...body,
		`        Ok(())`,
		`    }`,
		`    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {`,
		`        self.layout.gap()`,
		`    }`,
		`    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {`,
		`        Some(self.layout.edges_mut())`,
		`    }`,
		`}`,
		''
	];
}

function edgedImplLines(typeName: string, kindId: number): string[] {
	return [
		`impl ::sittir_core::options::Edged for ${typeName} {`,
		`    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(${kindId}) }`,
		`    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }`,
		`    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }`,
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
	choices: ChoiceNames,
	kindEntries: readonly KindEnumEntry[],
	plan: RenderPlan,
	read: ReadPrint
): string[] {
	if (node instanceof AssembledEnum) {
		return renderEnumType(node, kindEntries, plan, read);
	}
	const slotModel = renderSlotModelOf(node);
	return renderTransportDataStruct(rustTransportStructName(node), node, slotModel, nodeMap, choices, plan, kindEntries, read);
}

function isCompoundOf(node: AssembledNode): boolean {
	return (
		node.modelType === 'branch' ||
		node.modelType === 'envelope' ||
		node.modelType === 'list' ||
		node.modelType === 'alias' ||
		(node.modelType === 'polymorph' && !(node instanceof AssembledSupertype))
	);
}

function renderTransportDataStruct(
	structName: string,
	node: AssembledNode,
	slotModel: RenderSlotModel,
	nodeMap: NodeMap,
	choices: ChoiceNames,
	plan: RenderPlan,
	kindEntries: readonly KindEnumEntry[],
	read: ReadPrint
): string[] {
	const isLeafNode = node.modelType === 'pattern';
	const lines: string[] = [];
	const fillFields: string[] = [];
	const ownId = findKindEntry(kindEntries, node.kind)?.id;
	if (!isLeafNode) {
		lines.push('#[cfg_attr(feature = "napi-bindings", napi(object))]');
	}
	lines.push(TRANSPORT_DERIVE);
	const printedSlots = isCompoundOf(node) ? structSlotsOf(node, slotModel, nodeMap) : [];
	lines.push(`#[transport(${transportArgs(node, ownId, read.ctx, printedSlots.map(({ slot }) => slot))})]`);
	admit(read, structName, node instanceof AssembledAlias ? [node.aliasTypeId] : ownId === undefined ? [] : [ownId]);
	lines.push(`pub struct ${structName} {`);
	if (isCompoundOf(node)) {
		lines.push(...renderLayoutField());
		for (const { slot, owner, forceOptional } of printedSlots) {
			lines.push(
				...renderTransportField(
					slot,
					owner.kind,
					owner.typeName,
					nodeMap,
					choices,
					slotReadAttr(slot, owner, node, nodeMap, read),
					forceOptional
				)
			);
			fillFields.push(rustFieldIdent(slot.storageName));
		}
		{
			if (node instanceof AssembledList) {
				if (node.leadingDelimiter === 'optional' || node.trailingDelimiter === 'optional') {
					lines.push(
						'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_delimiter"))]',
						`    #[flank(${flankArgs(node)})]`,
						'    pub delimiter: Option<u8>,'
					);
				}
				if (node.separatorRule !== undefined) {
					lines.push(
						'    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_separator"))]',
						`    #[separator_kind(${separatorKindArgs(node, read.ctx)})]`,
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
	} else if (isTerminalNode(node)) {
		lines.push(...renderLeafTransportPlainFields());
	}
	lines.push('}');
	lines.push('');
	lines.push(...kindOfImplLines(structName, [], undefined, ownId === undefined ? [] : [ownId]));
	const ownKind = ownId === undefined ? 'None' : `Some(::sittir_core::types::KindId(${ownId}))`;
	const edgedId = edgeKindId(kindEntries, node.display.name);
	if (edgedId !== undefined) lines.push(...edgedImplLines(structName, edgedId));
	lines.push(`impl ::sittir_core::render::Render for ${structName} {`);
	lines.push(
		`    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	const body = isLeafNode ? leafRenderExpr(node, 'self') : `${rustTypedRenderFnName(node.typeName)}(self, w)`;
	const owner = !isLeafNode || ownsTrivia(kindEntries, node.kind);
	lines.push(`        ${layoutRenderCall('self.layout.as_ref()', ownKind, owner, body)}`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(...prepareStructImpl(structName, node, fillFields, plan, isCompoundOf(node), nodeMap, choices, kindEntries));
	if (isLeafNode) {
		lines.push(
			...renderLeafTransportNapiImpls(structName, kindIdText(node))
		);
	}
	lines.push(...renderBoxedEnumNapiImpls(structName));
	return lines;
}

interface FixedLiteral {
	readonly kind: string;
	readonly variant: string;
	readonly renderFn: string;
	readonly text: string;
	readonly ownId: number | undefined;
	readonly acceptedIds: readonly number[];
	readonly owner: boolean;
	readonly immediate: boolean;
}

type FixedLiterals = ReadonlyMap<string, FixedLiteral>;

function collectFixedLiterals(
	projection: TransportProjection,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[],
	kindIdByKind: ReadonlyMap<string, number>
): FixedLiterals {
	const fixed = new Map<string, FixedLiteral>();
	const entryOf = (kind: string): KindEnumEntry | undefined => findKindEntry(kindEntries, kind);
	for (const node of projection.nodes) {
		if (!isFixedTextLeaf(node)) continue;
		fixed.set(node.kind, {
			kind: node.kind,
			variant: rustTransportVariantName(node),
			renderFn: rustTypedRenderFnName(node.typeName),
			text: node.text,
			ownId: entryOf(node.kind)?.id,
			acceptedIds: [
				...new Set([
					...resolveAcceptedTransportIds({ kind: node.kind, node, nodeMap, kindIdByKind, kindEntries }),
					...(projection.wireIds.get(node.kind) ?? [])
				])
			],
			owner: ownsTrivia(kindEntries, node.kind),
			immediate: isImmediateLeaf(node)
		});
	}
	for (const literal of projection.literals) {
		if (projection.nodeKinds.has(literal.kind) || fixed.has(literal.kind)) continue;
		const id = resolveLiteralKindId(literal, kindEntries);
		if (id === undefined) continue;
		const member = kindEntries.find((entry) => entry.id === id)?.member;
		if (member === undefined) {
			throw new Error(`render-module: fixed literal '${literal.kind}' resolves kind id ${id}, which no kind entry has`);
		}
		fixed.set(literal.kind, {
			kind: literal.kind,
			variant: rustTypeIdent(member),
			renderFn: rustTypedRenderFnName(member),
			text: literal.text,
			ownId: id,
			acceptedIds: [...new Set([id, ...(projection.wireIds.get(literal.kind) ?? [])])],
			owner: ownsTrivia(kindEntries, literal.kind),
			immediate: isImmediateLeafKind(literal.kind, nodeMap)
		});
	}
	const kindByVariant = new Map<string, string>();
	for (const literal of fixed.values()) {
		const prior = kindByVariant.get(literal.variant);
		if (prior !== undefined) {
			throw new Error(`render-module: fixed literals '${prior}' and '${literal.kind}' are both named ${literal.variant}`);
		}
		kindByVariant.set(literal.variant, literal.kind);
	}
	return fixed;
}

function unitDecodeArm(id: number, unit: FixedLiteral, enumPath: string): string {
	return `                ${id} => Ok(${enumPath}::${unit.variant}),`;
}

function fixedLiteralOf(fixed: FixedLiterals, kind: string, text?: string): FixedLiteral {
	const literal = fixed.get(kind);
	if (literal === undefined) {
		throw new Error(`render-module: '${kind}' is stored as a kind id, but no fixed-literal kind was collected for it`);
	}
	if (text !== undefined && text !== literal.text) {
		throw new Error(
			`render-module: '${kind}' is a fixed literal spelled ${JSON.stringify(literal.text)}, but a slot stores it as ${JSON.stringify(text)}`
		);
	}
	return literal;
}

function renderFixedLiteralFn(fixed: FixedLiteral): string[] {
	const write = literalWrite(rustStringLiteral(fixed.text), fixed.text);
	const body = fixed.immediate ? `{ w.adjacent(); ${write} }` : write;
	const ownKind = fixed.ownId === undefined ? 'None' : `Some(::sittir_core::types::KindId(${fixed.ownId}))`;
	return [
		`fn ${fixed.renderFn}(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`,
		`    ${layoutRenderCall('None', ownKind, fixed.owner, body)}`,
		'}',
		''
	];
}

function layoutRenderCall(layout: string, ownKind: string, owner: boolean, body: string): string {
	return `TransportLayout::render(${layout}, ${ownKind}, ::sittir_core::layout::TriviaRole::${owner ? 'Owner' : 'Token'}, w, |w| ${body})`;
}

function ownsTrivia(kindEntries: readonly KindEnumEntry[], kind: string): boolean {
	return findKindEntry(kindEntries, kind)?.anon !== true;
}

function fixedLiteralIds(fixed: FixedLiteral): number[] {
	return [...new Set(fixed.acceptedIds.length > 0 ? fixed.acceptedIds : fixed.ownId === undefined ? [] : [fixed.ownId])];
}

function renderFixedLiteralTransport(typeName: string, fixed: FixedLiteral, read: ReadPrint): string[] {
	const ids = fixedLiteralIds(fixed);
	admit(read, typeName, ids);
	return [
		TRANSPORT_DERIVE_UNIT,
		'#[transport(choice)]',
		`pub enum ${typeName} {`,
		...variantKindLines(typeName, fixed.variant, undefined, ids, read),
		`    ${fixed.variant},`,
		'}',
		'',
		...kindOfImplLines(typeName, [], undefined, fixed.ownId === undefined ? [] : [fixed.ownId]),
		...inertPrepareImpl(typeName),
		...fixedLiteralNapiImpls(typeName, fixed),
		...renderBoxedEnumNapiImpls(typeName),
		`impl ::sittir_core::render::Render for ${typeName} {`,
		'    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {',
		`        ${fixed.renderFn}(w)`,
		'    }',
		'}',
		''
	];
}

function fixedLiteralNapiImpls(typeName: string, fixed: FixedLiteral): string[] {
	return kindIdNapiImpls(typeName, [{ variant: fixed.variant, ids: fixedLiteralIds(fixed) }]);
}

interface KindIdArm {
	readonly variant: string;
	readonly ids: readonly number[];
}

function kindIdNapiImpls(typeName: string, arms: readonly KindIdArm[]): string[] {
	return [
		'#[cfg(feature = "napi-bindings")]',
		`impl ::napi::bindgen_prelude::FromNapiValue for ${typeName} {`,
		'    unsafe fn from_napi_value(',
		'        env: ::napi::sys::napi_env,',
		'        napi_val: ::napi::sys::napi_value,',
		'    ) -> ::napi::Result<Self> {',
		'        match u16::from_napi_value(env, napi_val)? {',
		...arms.flatMap((arm) => (arm.ids.length === 0 ? [] : [`            ${arm.ids.join(' | ')} => Ok(Self::${arm.variant}),`])),
		'            other => Err(::napi::Error::from_reason(format!(',
		`                ${JSON.stringify(`kind id {other} is not a kind ${typeName} takes`)},`,
		'            ))),',
		'        }',
		'    }',
		'}',
		'',
		'#[cfg(feature = "napi-bindings")]',
		`impl ::napi::bindgen_prelude::ToNapiValue for ${typeName} {`,
		'    unsafe fn to_napi_value(',
		'        _env: ::napi::sys::napi_env,',
		'        _val: Self,',
		'    ) -> ::napi::Result<::napi::sys::napi_value> {',
		`        Err(::napi::Error::from_reason(${JSON.stringify(`${typeName} is receive-only`)}))`,
		'    }',
		'}',
		''
	];
}

function renderLeafTransportNapiImpls(structName: string, defaultTextLiteral?: string): string[] {
	const lines: string[] = [];

	lines.push(`#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]`);
	lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${structName} {`);
	lines.push(`    unsafe fn from_napi_value(`);
	lines.push(`        env: ::napi::sys::napi_env,`);
	lines.push(`        napi_val: ::napi::sys::napi_value,`);
	lines.push(`    ) -> ::napi::Result<Self> {`);
	lines.push(`        let mut layout: ${LAYOUT_FIELD.rustType} = None;`);
	lines.push(`        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {`);
	lines.push(`            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,`);
	if (defaultTextLiteral !== undefined) {
		lines.push(`            ::napi::ValueType::Number => ${rustStringLiteral(defaultTextLiteral)}.to_string(),`);
	} else {
		lines.push(`            ::napi::ValueType::Number => {`);
		lines.push(`                let id = u32::from_napi_value(env, napi_val)?;`);
		lines.push(`                return Err(::napi::Error::from_reason(format!(`);
		lines.push(
			`                    ${JSON.stringify(`kind id {} ({:?}) has no fixed text: ${structName} renders from a node, not a kind id`)},`
		);
		lines.push(`                    id,`);
		lines.push(
			`                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))`
		);
		lines.push(`                )));`);
		lines.push(`            }`);
	}
	lines.push(`            _ => {`);
	lines.push(`                layout = ${wirePropertyRead(LAYOUT_FIELD.jsName)};`);
	lines.push(
		defaultTextLiteral !== undefined
			? `                ${wirePropertyRead('$text')}.unwrap_or_else(|| ${rustStringLiteral(defaultTextLiteral)}.to_string())`
			: `                ${wirePropertyRead('$text')}.unwrap_or_default()`
	);
	lines.push(`            }`);
	lines.push(`        };`);
	lines.push(`        Ok(Self {`);
	lines.push(`            layout,`);
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
	lines.push(
		defaultTextLiteral !== undefined
			? `        let text: String = ${wirePropertyRead('$text')}.unwrap_or_else(|| ${rustStringLiteral(defaultTextLiteral)}.to_string());`
			: `        let text: String = ${wirePropertyRead('$text')}.unwrap_or_default();`
	);
	lines.push(`        let layout = ${wirePropertyRead(LAYOUT_FIELD.jsName)};`);
	lines.push(`        Ok(Self {`);
	lines.push(`            layout,`);
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

const LAYOUT_FIELD = { jsName: '$_layout', rustName: 'layout', rustType: 'Option<TransportLayout>' } as const;

function renderLayoutField(): string[] {
	return [
		`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(LAYOUT_FIELD.jsName)}))]`,
		`    pub ${LAYOUT_FIELD.rustName}: ${LAYOUT_FIELD.rustType},`
	];
}

function renderLeafTransportPlainFields(): string[] {
	return [`    pub ${LAYOUT_FIELD.rustName}: ${LAYOUT_FIELD.rustType},`, '    pub text: String,'];
}

interface StructSlot {
	readonly slot: AssembledNonterminal;
	readonly owner: AssembledNode;
	readonly forceOptional: boolean;
}

function structSlotsOf(node: AssembledNode, slotModel: RenderSlotModel, nodeMap: NodeMap): StructSlot[] {
	const out: StructSlot[] = [...slotModel.named, ...slotModel.unnamed].map((slot) => ({ slot, owner: node, forceOptional: false }));
	const emittedStorageNames = new Set(out.map(({ slot }) => slot.storageName));
	for (const unnamedSlot of slotModel.unnamed) {
		if (isMultiple(unnamedSlot)) continue;
		const aliasVisible = unnamedSlot.values.some(
			(v) => v.parseKind?.name !== undefined && !isSurfaceHiddenIn(v.parseKind.name, nodeMap)
		);
		if (aliasVisible) continue;
		const helperNode = nodeMap.nodes.get(`_${unnamedSlot.name}`);
		if (helperNode === undefined) continue;
		for (const innerSlot of helperNode.slots) {
			if (innerSlot.isUnnamed) continue;
			if (emittedStorageNames.has(innerSlot.storageName)) continue;
			out.push({ slot: innerSlot, owner: helperNode, forceOptional: true });
			emittedStorageNames.add(innerSlot.storageName);
		}
	}
	return out;
}

function slotReadAttr(slot: AssembledNonterminal, owner: AssembledNode, node: AssembledNode, nodeMap: NodeMap, read: ReadPrint): string | undefined {
	if (node instanceof AssembledAlias) return undefined;
	if (interiorOf(node) !== undefined) return `#[slot(${captureArgs(slot)})]`;
	const args = slotArgs(slot, owner, transportSlotShapeOf(slot, nodeMap), read.ctx);
	return args === '' ? '#[slot]' : `#[slot(${args})]`;
}

function readsItsSlots(node: AssembledNode): boolean {
	return node.modelType !== 'pattern' && !(node instanceof AssembledAlias) && interiorOf(node) === undefined;
}

type NodeSlotShape = Exclude<TransportSlotShape, { readonly tag: 'presence' | 'text' }>;

function slotTransportTypeName(slot: AssembledNonterminal, shape: NodeSlotShape, choices: ChoiceNames, typeName: string): string {
	switch (shape.tag) {
		case 'kind':
			return shape.transport;
		case 'supertype':
			return `${rustTypeIdent(shape.supertypeName)}Transport`;
		case 'union':
			return choiceNameOf(choices, typeName, slot.name);
		case 'any':
			return 'AnyTransport';
		default:
			return assertNever(shape);
	}
}

function assertReadableTransports(
	nodes: readonly AssembledNode[],
	nodeMap: NodeMap,
	choices: ChoiceNames,
	read: ReadPrint
): void {
	for (const node of nodes) {
		if (isFixedTextLeaf(node) || node instanceof AssembledEnum || !(node instanceof AbstractAssembledCompound) || !readsItsSlots(node)) continue;
		const untagged: { name: string; ids: readonly number[] }[] = [];
		for (const { slot, owner } of structSlotsOf(node, renderSlotModelOf(node), nodeMap)) {
			const shape = transportSlotShapeOf(slot, nodeMap);
			const typeName = shape.tag === 'presence' || shape.tag === 'text' ? undefined : slotTransportTypeName(slot, shape, choices, owner.typeName);
			const blank = typeName !== undefined && read.blankChoices.has(typeName);
			if (blank !== hasBlankArm(slot)) {
				throw new Error(
					`render-module: ${node.kind}.${slot.name} ${hasBlankArm(slot) ? 'is' : 'is not'} registered as a blank option, but its choice ${typeName ?? '(none)'} ${blank ? 'has' : 'has no'} blank arm`
				);
			}
			if (!takesUntagged(slot, read.ctx)) continue;
			const ids =
				shape.tag === 'presence'
					? [presenceKeywordId(shape, owner, slot, read.ctx)]
					: typeName === undefined
						? []
						: read.admitted.get(typeName);
			if (ids === undefined) throw new Error(`render-module: ${node.kind}.${slot.name} is typed ${typeName}, which printed no admitted kind ids`);
			untagged.push({ name: slot.name, ids });
		}
		assertOneUntaggedSlot(node.kind, untagged, read.ctx.kindEntries);
	}
}

function renderTransportField(
	field: AssembledNonterminal,
	parentKind: string,
	typeName: string,
	nodeMap: NodeMap,
	choices: ChoiceNames,
	readAttr: string | undefined,
	forceOptional = false
): string[] {
	const lines: string[] = [];
	const rustName = rustFieldIdent(field.storageName);
	lines.push(`    #[cfg_attr(feature = "napi-bindings", napi(js_name = ${JSON.stringify(`_${field.storageName}`)}))]`);
	if (readAttr !== undefined) lines.push(`    ${readAttr}`);
	const required = forceOptional ? false : isTransportRequired(field);
	const adjacent = slotVerbatimIsImmediate(field, nodeMap);
	lines.push(
		`    pub ${rustName}: ${rustTransportSlotType(
			field,
			nodeMap,
			choices,
			{ required, multiple: isMultiple(field), optionalElement: hasOptionalElements(field), adjacent },
			parentKind,
			typeName
		)},`
	);
	return lines;
}

export type TransportSlotShape =
	| { readonly tag: 'presence'; readonly text: string; readonly kind?: AssembledNode }
	| { readonly tag: 'text' }
	| { readonly tag: 'kind'; readonly kind: string; readonly typeName: string; readonly transport: string }
	| { readonly tag: 'supertype'; readonly supertypeName: string }
	| { readonly tag: 'union' }
	| { readonly tag: 'any' };

export function transportSlotShapeOf(slot: AssembledNonterminal, nodeMap: NodeMap): TransportSlotShape {
	const primitive = classifyPrimitiveField(slot, nodeMap);
	if (primitive !== undefined) {
		return primitive.kind === 'boolean'
			? { tag: 'presence', text: primitive.text, ...presenceKindOf(slot, nodeMap) }
			: { tag: 'text' };
	}
	const kinds = kindsOf(slot);
	const cls =
		(kinds.length > 0 && slotLiteralValues(slot).length > 0) || hasBlankArm(slot)
			? ({ tag: 'heterogeneous' } as const)
			: classifySlotForEmit(kinds, nodeMap);
	switch (cls.tag) {
		case 'concrete': {
			const transport = concreteTransportTypeName(cls.kind, nodeMap);
			return transport === null
				? { tag: 'any' }
				: { tag: 'kind', kind: cls.kind, typeName: cls.typeName, transport };
		}
		case 'supertype':
			return { tag: 'supertype', supertypeName: cls.supertypeName };
		case 'heterogeneous':
			return hasAnyConcreteChildKind(kinds, nodeMap) ||
				fieldTypeComponents(slot, nodeMap).some((component) => component.kind === 'literal')
				? { tag: 'union' }
				: { tag: 'any' };
		default:
			return assertNever(cls);
	}
}

function presenceKindOf(slot: AssembledNonterminal, nodeMap: NodeMap): { kind?: AssembledNode } {
	const [value] = slot.values;
	if (slot.values.length !== 1 || value === undefined || !isNodeRef(value)) return {};
	const node = nodeMap.nodes.get(storageKindOfRef(value.node));
	return node !== undefined && isFixedTextLeaf(node) ? { kind: node } : {};
}

function slotClassOfShape(shape: TransportSlotShape, nodeMap: NodeMap): SlotClass {
	switch (shape.tag) {
		case 'kind': {
			const node = nodeMap.nodes.get(shape.kind);
			return node !== undefined && isFixedTextLeaf(node)
				? { tag: 'heterogeneous', useBox: false }
				: { tag: 'concrete', kind: shape.kind, typeName: shape.typeName };
		}
		case 'supertype':
			return { tag: 'supertype', supertypeName: shape.supertypeName };
		case 'union':
			return { tag: 'heterogeneous', useBox: false };
		case 'any':
		case 'presence':
		case 'text':
			return { tag: 'heterogeneous', useBox: true };
		default:
			return assertNever(shape);
	}
}

function slotCarrier(inner: string, adjacent: boolean): string {
	return adjacent ? `::sittir_core::SlotValue<${inner}, true>` : `::sittir_core::SlotValue<${inner}>`;
}

function rustTransportSlotType(
	slot: AssembledNonterminal,
	nodeMap: NodeMap,
	choices: ChoiceNames,
	cardinality: { required: boolean; multiple: boolean; optionalElement?: boolean; adjacent: boolean },
	parentKind: string,
	typeName: string
): string {
	const { required, multiple, optionalElement, adjacent } = cardinality;
	const shape = transportSlotShapeOf(slot, nodeMap);
	if (shape.tag === 'presence') return 'Option<bool>';
	if (shape.tag === 'text') return required ? 'String' : 'Option<String>';

	const scc = nodeMap.scc;
	let reachableKinds: readonly string[] = [];
	if (!multiple && scc !== undefined) {
		if (shape.tag === 'kind') {
			reachableKinds = [shape.kind];
		} else if (shape.tag === 'supertype') {
			const supertypeKind = findSupertypeKindByTypeName(shape.supertypeName, nodeMap);
			reachableKinds = supertypeKind !== undefined ? [supertypeKind] : kindsOf(slot);
		} else {
			reachableKinds = kindsOf(slot);
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

	const inner = slotTransportTypeName(slot, shape, choices, typeName);
	return wrap(shape.tag === 'any' && !multiple ? `Box<${inner}>` : inner);
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
	const pascalField = pascalCase(segments.join('_'));
	const sanitized = rustTypeIdent(pascalField);
	return `${base}${sanitized}TransportSlot`;
}

export function rustTransportStructName(node: AssembledNode): string {
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
		const pascal = pascalCase(literal);
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

function enumMemberId(node: AssembledEnum, text: string): number {
	const id = node.resolvedByText.get(text)?.id;
	if (id === undefined) throw new Error(`transport.rs: enum member ${JSON.stringify(text)} of '${node.kind}' has no kind id`);
	return id;
}

function renderEnumType(node: AssembledEnum, kindEntries: readonly KindEnumEntry[], plan: RenderPlan, read: ReadPrint): string[] {
	const publicName = enumTypeName(node);
	const seamPairs = armSeamPairsOf(plan, node, kindEntries);
	const enumName = publicName;
	const values = node.values;
	const lines: string[] = [];

	const arms = values.map((v) => ({ variant: literalToVariantName(v), ids: [enumMemberId(node, v)] }));
	const ownId = findKindEntry(kindEntries, node.kind)?.id;
	if (ownId === undefined) throw new Error(`transport.rs: enum kind '${node.kind}' has no kind id`);
	lines.push(TRANSPORT_DERIVE_ENUM_KIND);
	lines.push(`#[transport(${enumKindArgs(ownId, read.ctx)})]`);
	lines.push(`pub enum ${enumName} {`);
	for (const arm of arms) {
		lines.push(`    #[kind(${variantKindArgs(arm.ids, false, read.ctx)})]`);
		lines.push(`    ${arm.variant},`);
	}
	lines.push(`}`);
	lines.push('');
	admit(read, enumName, [ownId, ...arms.flatMap((arm) => arm.ids)]);
	lines.push(...inertPrepareImpl(enumName));

	lines.push(...kindIdNapiImpls(enumName, arms));
	lines.push(...kindOfImplLines(enumName, arms.map((arm) => ({ ...arm, payload: false })), undefined));
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
