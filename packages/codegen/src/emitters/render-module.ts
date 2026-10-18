import { relaxedDisplayIds, relaxedKeywordIds } from './kind-id-rust.ts';
import { ERROR_KIND_ID } from '@sittir/common/error-kind';
import { depthMembersOf } from '../compiler/model/layout-kinds.ts';
import type { SlotBearingCompound } from '../compiler/model/node-map.ts';
import { parseSeamLabel, isDepthText, INDENT_TEXT, DEPTH_BREAK } from '../dsl/primitives/spacing.ts';
import { isFixedTextLeaf, isTerminalNode } from '../compiler/model/node-map.ts';
import { CONTINUATION_KINDS, NEWLINE_KINDS, PREFERRED_NEWLINE, breakingKindsOfText, TIGHT_KINDS, layoutKindsOfText, leafEdgesOf } from '../compiler/model/layout-kinds.ts';
import { STRING } from '../types/rule-types.ts'; // @rule-type-consts
import { wordCharAsciiTable } from '../util/word-matcher.ts';
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
	isNonEmpty,
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
	presenceKeyword,
	readNames,
	separatorKindArgs,
	slotArgs,
	takesUntagged,
	nodeArgs,
	variantKindArgs,
	type ReadFactsCtx,
	type NodeLiteral,
	type NodeProjection
} from './node-projection.ts';
import { listViewOwners } from './factories.ts';
import { interiorOf } from './interior.ts';
import { ENVELOPE_PINS, assertEnvelopeExtrasPinned, type EnvelopeClaims, type EnvelopePin } from './envelope-claims.ts';
import { BOXED_PAYLOADS, PAYLOAD_CEILING_BYTES } from './boxed-payloads.ts';
import { getNodeProjection } from './node-projection-cache.ts';
import { RECORD_HEADER_WORDS, recordArgs, recordLayoutOf, slotRecordForm, type RecordLayout, type RecordPlace } from './record-layout.ts';
import {
	RESERVED_SUPERTYPE_ENUM_NAMES,
	RUST_KEYWORDS,
	acceptedNodeKinds,
	classifySlotForEmit,
	findSupertypeKindByTypeName,
	rustFieldIdent,
	rustTypeIdent,
	supertypeNodeKinds,
	type SlotClass
} from './node-common.ts';
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
	type KindEnumEntry
} from './kind-discriminant.ts';
import { pascalCase } from '../compiler/model/casing.ts';
import {
	carriesPerNodeValue,
	seatTableName,
	seatedTableNames,
	edgeSitesOf,
	type EdgeSiteRow,
	isKindEdge,
	planRenderOptions,
	renderOptionsRs,
	type RenderOptionsPlan,
	type SeatWrapper,
	type SpacingSite,
	type DelimiterSite
} from './render-options-rs.ts';
import { displayedKinds } from '../compiler/model/display-name.ts';
import { BLANK_KIND_ID, collectSitePreferences, hasBlankArm, type SitePreference } from '../compiler/model/site-preferences.ts';
import { readOptionsBlock, type OptionsConfig } from '../dsl/wire/options-block.ts';
import { addressTablesFor, EMPTY_ADDRESSES, type AddressTables } from './options.ts';
import {
	anonTokenNameOfText,
	depthRegionsOf,
	tokenNameOfText,
	whitespaceTextOf,
	type RenderRules
} from '../compiler/model/render-rules.ts';
import {
	escapeBraces,
	doubledFlanks,
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
import { continuationTriviaKinds, triviaKinds, whitespaceTriviaKinds } from '../compiler/model/trivia.ts';

export interface RustRenderModuleEmit {
	hashRs: { path: string; contents: string };
	hashTs: { path: string; contents: string };
	nodeRs: { path: string; contents: string };
	optionsRs: { path: string; contents: string };
	libRs: { path: string; contents: string };
	recordsTs: { path: string; contents: string };
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
	readonly boxedPayloads?: readonly string[];
	readonly envelopePins?: Readonly<Record<string, EnvelopePin>>;
}

export function grammarRenderInputs(grammar: GrammarName, inputs: RenderOptionsInputs): RenderOptionsInputs {
	return { ...inputs, boxedPayloads: BOXED_PAYLOADS[grammar] ?? [], envelopePins: ENVELOPE_PINS[grammar] ?? {} };
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
		addresses,
		boxedPayloads
	} = config;
	return {
		emit: emitRenderModule(grammar, templates, nodeMap, generatedIdTables, {
			renderRules,
			visibleExternals,
			options,
			kindEntries,
			sites,
			addresses,
			boxedPayloads
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
			addresses: config.addresses,
			boxedPayloads: config.boxedPayloads
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

function nodeRsHeader(lang: GrammarName): string {
	return `${generatedHeader(lang)}
//
// Per-kind view structs and render bodies, AnyNode enum + per-kind
// node structs + typed dispatch (render_node_dispatch) + node
// bridge helpers.`;
}

type EmittedNonterminalView = 'scalar' | 'list' | 'field';

const RESERVED_NODE_STRUCT_NAMES = new Set(['AnyNode', 'ProtectedNode', 'LiteralNode']);

interface EffectiveSupertypeNodeSubtype {
	readonly subKind: string;
	readonly subNode: AssembledNode;
}

interface EffectiveSupertypeNodeShape {
	readonly subtypes: readonly EffectiveSupertypeNodeSubtype[];
	readonly suppressedKinds: readonly string[];
	readonly parseNames: ReadonlyMap<string, string>;
}

function collectEffectiveSupertypeNodeShape(
	supertypeNode: AssembledSupertype,
	nodeMap: NodeMap
): EffectiveSupertypeNodeShape {
	const walk = supertypeNodeKinds(supertypeNode, nodeMap);
	const variantKindByName = new Map<string, string>();
	const subtypes: EffectiveSupertypeNodeSubtype[] = [];
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
	hasNodeField: boolean;
	storageName: string;
	isUnnamed: boolean;
	hasLeadingDelimiter: boolean;
	hasTrailingDelimiter: boolean;
	trailingDelimiter: 'mandatory' | 'optional' | 'none';
	leadingDelimiter: 'mandatory' | 'optional' | 'none';
	separator?: string;
	backingNodeField?: string;
	backingInnerRequired?: boolean;
	backingDirectField?: string;
}

interface EmittedStruct {
	kind: string;
	body: Body;
	flanks: ReadonlyMap<string, Flanks>;
	fields: EmittedField[];
	nodeHasChildren: boolean;
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
		hasNodeField: requiredByName.has(slot.name) || multipleByName.has(slot.name),
		storageName: storageByName.get(slot.name) ?? slot.name,
		isUnnamed: unnamedNames.has(slot.name),
		separator: separatorByName.get(slot.name)
	}));
	fields.sort((a, b) => compareOrdinal(a.name, b.name));
	if (nodeMap !== undefined) {
		for (const f of fields) {
			if (f.hasNodeField || f.required || f.multiple) continue;
			for (const helperSlot of slotModel.unnamed) {
				const helperNodeName = `_${helperSlot.name}`;
				const helperNode = nodeMap.nodes.get(helperNodeName);
				if (helperNode === undefined) continue;
				const helperSlots = helperNode.slots;
				const innerSlot = helperSlots.find((s) => s.name === f.name);
				if (innerSlot !== undefined) {
					f.backingNodeField = helperSlot.storageName;
					f.backingInnerRequired = isNodeRequired(innerSlot);
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
		nodeHasChildren: slotModel.unnamed.length > 0,
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
		required: isNodeRequired(slot),
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
			if (sep === undefined && node instanceof AssembledList) sep = node.separator;
			if (sep !== undefined) separators.set(kind, sep);
		}
	}
	return { separators };
}

function literalWrite(valueExpr: string, fixed: string | undefined): string {
	if (fixed !== undefined && isDepthText(fixed)) {
		return fixed === INDENT_TEXT
			? `{ w.indent(); w.seam(${breakingKindsOfText(DEPTH_BREAK)}); Ok::<(), ::sittir_core::render::RenderError>(()) }`
			: `{ w.dedent(${NEWLINE_KINDS}); Ok::<(), ::sittir_core::render::RenderError>(()) }`;
	}
	if (fixed !== undefined && isWhitespaceOnly(fixed)) {
		return `{ w.seam(${layoutKindsOfText(fixed)}); Ok::<(), ::sittir_core::render::RenderError>(()) }`;
	}
	return `w.text(${valueExpr})`;
}

function buildSlotWriteCall(cls: SlotClass, expr: string): string {
	switch (cls.tag) {
		case 'concrete':
			return `if let Some(v) = ${expr}.node_or_write(w)? { render_${rustSnakeIdent(cls.typeName)}(v, w)?; }`;
		case 'supertype':
			return `if let Some(v) = ${expr}.node_or_write(w)? { render_${rustSnakeIdent(cls.supertypeName)}(v, w)?; }`;
		case 'heterogeneous':
			return `${expr}.render(w)?;`;
		default:
			return assertNever(cls);
	}
}

function renderTypedDispatch(
	structs: EmittedStruct[],
	payloadNodes: readonly AssembledNode[],
	literals: readonly NodeLiteral[],
	fixed: FixedLiterals,
	meta: MetaData,
	nodeMap: NodeMap,
	usedSupertypeNames: ReadonlySet<string>,
	kindIdByKind: ReadonlyMap<string, number>,
	plan: RenderPlan,
	kindEntries: readonly KindEntryLike[],
	boxedPayloads: readonly string[]
): string[] {
	const structsByKind = new Map(structs.map((s) => [s.kind, s]));
	const lines: string[] = [];

	for (const node of payloadNodes) {
		lines.push(...renderTypedKindFn(node, structsByKind, meta, nodeMap, kindIdByKind, plan));
	}
	for (const literal of fixed.values()) lines.push(...renderFixedLiteralFn(literal));

	for (const [, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype)) continue;
		if (!usedSupertypeNames.has(node.typeName)) continue;
		const enumName = `${rustTypeIdent(node.typeName)}Node`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		lines.push(...emitSupertypeRenderHelper(node, nodeMap, fixed, boxedPayloads));
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
	lines.push(`/// Render a node tree to text. Takes the root's own \`SlotValue\``);
	lines.push(`/// carrier, so the root renders through the SAME single \`SpacingWriter\``);
	lines.push(`/// wrap — a second entry point would be a second place the root seam`);
	lines.push(`/// policy could drift. A root of the grammar's root kind renders as a`);
	lines.push(`/// document.`);
	lines.push(
		`pub fn render_node_dispatch(node: &RenderRoot, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<String, ::sittir_core::render::RenderError> {`
	);
	lines.push(`    let mut s = String::new();`);
	lines.push(
		`    let w = ::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER).with_table(&options::WHITESPACE).with_indent(&ctx.options.indent).with_sources(ctx.sources).with_options(ctx.options).with_recording(ctx.recording);`
	);
	lines.push(`    let document = ::sittir_core::view::KindTest::kind_in(node, &w, kind::ROOT_KINDS);`);
	lines.push(`    let mut w = w.with_document(document);`);
	lines.push(`    node.render(&mut w)?;`);
	lines.push(`    w.finish()?;`);
	lines.push(`    Ok(s)`);
	lines.push(`}`);
	lines.push('');

	lines.push(
		...kindOfImplLines(
			'AnyNode',
			[
				...payloadNodes.map((node) => ({ variant: rustNodeVariantName(node), payload: true })),
				...[...fixed.values()].map((literal) => ({
					variant: literal.variant,
					payload: literal.edged,
					ids: literal.ownId === undefined ? [] : [literal.ownId]
				}))
			],
			[]
		)
	);
	lines.push(`impl ::sittir_core::render::Render for AnyNode {`);
	lines.push(
		`    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	lines.push(`        match self {`);
	for (const node of payloadNodes) {
		const variant = rustNodeVariantName(node);
		lines.push(`            AnyNode::${variant}(t) => t.render(w),`);
	}
	for (const literal of fixed.values()) lines.push(`            ${fixedRenderArm(`AnyNode::${literal.variant}`, literal)}`);
	lines.push(`            AnyNode::Verbatim(t) => t.render(w),`);
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
	plan: RenderPlan
): string[] {
	switch (node.modelType) {
		case 'branch':
		case 'envelope':
		case 'list': {
			const struct = structsByKind.get(node.kind);
			if (struct === undefined) {
				return renderTypedBranchFallbackFn(node, nodeMap);
			}
			return renderTypedBranchFn(node, struct, meta, nodeMap, kindIdByKind, plan);
		}
		case 'polymorph':
		case 'alias': {
			if (node instanceof AssembledSupertype) return [];
			const struct = structsByKind.get(node.kind);
			if (struct === undefined) {
				return renderTypedBranchFallbackFn(node, nodeMap);
			}
			return renderTypedBranchFn(node, struct, meta, nodeMap, kindIdByKind, plan);
		}
		case 'pattern':
		case 'keyword':
		case 'punctuation':
		case 'enum':
			return renderTypedLeafFn(node, nodeMap, kindIdByKind.get(node.kind));
		default:
			return [];
	}
}

function renderTypedBranchFallbackFn(node: AssembledNode, nodeMap: NodeMap): string[] {
	const fnName = rustTypedRenderFnName(node.typeName);
	const structName = rustNodeStructName(node);
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
			const slotCls = slotClassOfShape(nodeSlotShapeOf(slot, nodeMap), nodeMap);
			const writeChild = buildSlotWriteCall(slotCls, 'child');
			if (isMultiple(slot)) {
				lines.push(`    for child in node.${slotIdent}.iter() {`);
				lines.push(`        ${writeChild}`);
				lines.push(`    }`);
			} else if (isNodeRequired(slot)) {
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

function leafEdgesCall(node: AssembledNode, nodeMap: NodeMap, kindId: number | undefined): string | undefined {
	if (node instanceof AssembledLeaf && kindId !== undefined && leafEdgesOf(node, nodeMap) !== undefined) {
		return `w.leaf_kind(::sittir_core::types::KindId(${kindId}));`;
	}
	return undefined;
}

function leafRenderExpr(node: AssembledNode, on: string, nodeMap: NodeMap, kindId: number | undefined): string {
	const write = leafTextWrite(node, on);
	const edges = leafEdgesCall(node, nodeMap, kindId);
	return edges === undefined ? write : `{ ${edges} ${write} }`;
}

function renderTypedLeafFn(node: AssembledNode, nodeMap: NodeMap, kindId: number | undefined): string[] {
	const fnName = rustTypedRenderFnName(node.typeName);
	const typeName = rustNodeStructName(node);
	const body = node instanceof AssembledEnum ? `t.render(w)` : leafTextWrite(node, 't');
	const edges = leafEdgesCall(node, nodeMap, kindId);
	return [
		`fn ${fnName}(t: &${typeName}, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`,
		...(edges === undefined ? [] : [`    ${edges}`]),
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
	plan: RenderPlan
): string[] {
	return [
		`fn ${rustTypedRenderFnName(node.typeName)}(node: &${rustNodeStructName(node)}, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`,
		...buildTypedTemplateBody(
			struct,
			meta.separators.get(node.kind) ?? '',
			nodeMap,
			renderSlotModelOf(node),
			node,
			kindIdByKind,
			plan
		),
		`}`,
		''
	];
}

function separatorTextFn(
	candidateKindNames: readonly string[],
	fallbackSeparator: string,
	kindIdByKind: ReadonlyMap<string, number>
): string | undefined {
	const arms: string[] = [];
	for (const name of candidateKindNames) {
		const id = kindIdByKind.get(name);
		if (id === undefined) continue;
		arms.push(`KindId(${id}) => ${JSON.stringify(name)}`);
	}
	if (arms.length === 0) return undefined;
	return `|kind| match kind { ${[...arms, `_ => ${fallbackSeparator}`].join(', ')} }`;
}

function buildTypedTemplateBody(
	struct: EmittedStruct,
	separator: string,
	nodeMap: NodeMap,
	slotModel: RenderSlotModel | undefined = undefined,
	node: AssembledNode | undefined,
	kindIdByKind: ReadonlyMap<string, number>,
	plan: RenderPlan
): string[] {
	const lines: string[] = [];
	const sepLiteral = JSON.stringify(separator);

	const shapeByName = new Map<string, NodeSlotShape>();
	if (nodeMap !== undefined && slotModel !== undefined) {
		for (const f of [...slotModel.named, ...slotModel.unnamed]) shapeByName.set(f.name, nodeSlotShapeOf(f, nodeMap));
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
				const unit = `${rustNodeStructName(shape.kind)}::${rustNodeVariantName(shape.kind)}`;
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
			const items = f.hasNodeField ? `&node.${rIdent}` : 'NO_ITEMS';
			const fieldSepLiteral = f.separator !== undefined ? JSON.stringify(f.separator) : sepLiteral;
			const separatedList = node instanceof AssembledList ? node : undefined;
			const leadingExpr =
				separatedList?.leadingDelimiter === 'optional'
					? 'node.delimiter.is_some_and(|d| d.has(::sittir_core::types::Delimiter::LEADING))'
					: separatedList?.leadingDelimiter === 'mandatory'
						? 'true'
						: 'false';
			const trailingOption =
				separatedList?.trailingDelimiter === 'optional'
					? 'node.delimiter.is_some_and(|d| d.has(::sittir_core::types::Delimiter::TRAILING))'
					: separatedList?.trailingDelimiter === 'mandatory'
						? 'true'
						: 'false';
			const trailingExpr = separatedList?.singleElementNeedsTrailing
				? `${f.hasNodeField ? `node.${rIdent}` : 'NO_ITEMS'}.len() == 1 || ${trailingOption}`
				: trailingOption;
			const separatorSite = separatedList === undefined ? undefined : separatorSiteOf(plan, separatedList);
			const fallback =
				separatorSite?.defaultText === undefined ? fieldSepLiteral : JSON.stringify(separatorSite.defaultText);
			const separatorText =
				separatedList?.separatorRule !== undefined
					? separatorTextFn(separatedList.separatorCandidateKindNames, fallback, kindIdByKind)
					: undefined;
			const wireKey = JSON.stringify(slotWireKey(f.storageName));
			const spacing = spacingFieldExprs(plan, node, f.name);
			const spaced = (site: string | undefined): string => (site === undefined ? 'KindId::BLANK' : `${site}.unwrap_or(KindId::BLANK)`);
			bound.add(ident);
			if (separatorText !== undefined) lines.push(`    let ${ident}_separator: fn(KindId) -> &'static str = ${separatorText};`);
			lines.push(`    let ${ident} = ListView {`);
			lines.push(`        items: ${items},`);
			lines.push(`        template: ${template},`);
			if (separatorText !== undefined) {
				lines.push(`        token: node.separator_kind.map_or(${fallback}, ${ident}_separator),`);
				lines.push(`        separators: Some((::sittir_core::layout::slot_tokens(node.layout.as_deref(), ${wireKey}), ${ident}_separator)),`);
			} else {
				lines.push(`        token: ${fieldSepLiteral},`);
				lines.push(`        separators: None,`);
			}
			lines.push(`        before: ${spaced(spacing.before)},`);
			lines.push(`        after: ${spaced(spacing.after)},`);
			lines.push(`        leading: ${leadingExpr},`);
			lines.push(`        trailing: ${trailingExpr},`);
			lines.push(`        head: ${spacing.head ?? 'None'},`);
			lines.push(`        tail: ${spacing.tail ?? 'None'},`);
			lines.push(
				`        units: ${f.hasNodeField ? `::sittir_core::layout::list_units(node.layout.as_deref(), ${wireKey})` : 'None'},`
			);
			lines.push(`    };`);
			continue;
		}
		if (f.required) {
			bind(ident, f.hasNodeField ? `&node.${rIdent}` : '""');
			continue;
		}
		if (f.backingNodeField) {
			const backing = `node.${rustFieldIdent(f.backingNodeField)}.as_ref().and_then(|h| h.node())`;
			const inner = f.backingInnerRequired ? `.map(|h| &h.${ident})` : `.and_then(|h| h.${ident}.as_ref())`;
			const value = f.backingDirectField
				? `node.${rustFieldIdent(f.backingDirectField)}.as_ref().or_else(|| ${backing}${inner})`
				: `${backing}${inner}`;
			bind(ident, `View::new(${value}, ${template})`);
			continue;
		}
		bind(
			ident,
			f.hasNodeField ? `View::new(&node.${rIdent}, ${template})` : `View::new(None::<&str>, ${template})`
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
			`render body for '${struct.kind}' names '${name}', which its node has no slot for (slots: ${struct.fields.map((f) => f.name).join(', ') || 'none'})`
		);
	}
	for (const name of refs.seams) {
		if (seamFieldNames.has(rustFieldIdent(name))) continue;
		throw new Error(
			`render body for '${struct.kind}' names seam '${name}', which its node has no spacing site for`
		);
	}
	for (const flank of doubledFlanks(struct.body)) {
		if (process.env.SEAM_FLANK_CENSUS) console.error(`SEAM2 ${struct.kind} ${flank}`);
		else throw new Error(`render body for '${struct.kind}' emits two seams at one flank: ${flank}`);
	}
	lines.push(
		...printRustBody(struct.body, {
			field: rustFieldIdent,
			optional: (name) => struct.fields.some((f) => rustFieldIdent(f.name) === rustFieldIdent(name) && !f.required),
			edge: kindEdgeWriterOf(plan, node),
			site: (name) => {
				if (node === undefined)
					throw new Error(`render body for '${struct.kind}' names spacing site '${name}' without its node`);
				const site = plan.spacingSites.find((s) => s.source === node.kind && (s.address === name || s.fieldIdent === name));
				if (site === undefined) throw new Error(`render body for '${struct.kind}' names spacing site '${name}', which has no site`);
				return `options::${site.constName}`;
			},
			kinds: (names) => rustKindIdSlice(names, nodeMap, kindIdByKind, struct.kind),
			unitSlot: (name) => {
				const f = struct.fields.find((field) => rustFieldIdent(field.name) === rustFieldIdent(name));
				if (f === undefined || !f.hasNodeField || f.view === 'list' || f.multiple || shapeByName.get(f.name)?.tag === 'presence') return undefined;
				return slotWireKey(f.storageName);
			},
			innerGap: (name) => node instanceof AbstractAssembledCompound && node.innerSite?.key === name
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
pub mod node;

pub use node::{render_node_dispatch, render_node_parts, AnyNode, RenderRoot};
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
	depthRegions: [],
	indentId: 0,
	dedentId: 0,
	whitespaceText: [],
	kindFlags: [],
			leafEdges: [],
			seatWrappers: [],
			gaps: [],
	indentChars: [],
	indent: '',
	newlineArms: [],
	newline: PREFERRED_NEWLINE
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
	const plan = planRenderOptions(
		sites,
		kindEntries,
		nodeMap,
		whitespaceTextOf(inputs.visibleExternals, nodeMap),
		declaredIndent,
		lang,
		depthRegionsOf(inputs.renderRules, nodeMap),
		seatWrappersOf(nodeMap, generatedIdTables)
	);
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
	const support = renderNodeSupport(lang, nodeMap, structs, meta, generatedIdTables, plan, inputs.boxedPayloads ?? [], inputs.envelopePins);

	const nodeRs =
		[
			nodeRsHeader(lang),
			'',
			commonRustUseImports(),
			'use ::sittir_core::layout::Layout as _;',
			'use ::sittir_core::options::Edged as _;',
			'use super::options;',
			'use super::{field_ids as field, kind_ids as kind};',
			'use ::sittir_core::VerbatimNode;',
			'',
			support.text
		].join('\n') + '\n';
	const optionsRs = renderOptionsRs(plan, addresses, optionsKindEntries);
	const { hashRs, hashTs } = emitHashFiles(lang, [
		{ filename: 'node.rs', content: nodeRs },
		{ filename: 'options.rs', content: optionsRs }
	]);

	return {
		hashRs,
		hashTs,
		optionsRs: {
			path: `${renderModuleSrcDir(lang)}/options.rs`,
			contents: optionsRs
		},
		nodeRs: {
			path: `${renderModuleSrcDir(lang)}/node.rs`,
			contents: nodeRs
		},
		libRs: {
			path: `${renderModuleSrcDir(lang)}/mod.rs`,
			contents: libRsContents(lang)
		},
		recordsTs: {
			path: `packages/${lang}/src/records.ts`,
			contents: recordsTs(lang, support.records)
		}
	};
}

function recordsTs(lang: GrammarName, records: ReadonlyMap<string, RecordLayout>): string {
	const entries = [...records].map(([name, layout]) => {
		const places = layout.places.map((place) => {
			const at = 'bit' in place ? `word: ${place.word}, bit: ${place.bit}` : `word: ${place.word}, width: ${place.width}${place.run === undefined ? '' : `, run: ${place.run}`}`;
			return ` ${place.field}: { ${at} },`;
		});
		return `\t${name}: {${[` words: ${layout.words},`, ...places].join('')} },`;
	});
	return `// @generated from packages/${lang}/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${lang} --all --output packages/${lang}/src
//
// Each node's record layout, as ${renderModuleSrcDir(lang)}/node.rs stamps it.

export const RECORD_HEADER_WORDS = ${RECORD_HEADER_WORDS};

export const records = {
${entries.join('\n')}
} as const;
`;
}

interface ReadPrint {
	readonly grammar: GrammarName;
	readonly ctx: ReadFactsCtx;
	readonly envelopeExtras: Map<string, EnvelopeClaims>;
	readonly printedEnums: Set<string>;
	readonly admitted: Map<string, number[]>;
	readonly blankChoices: Set<string>;
	readonly variants: Map<string, readonly string[]>;
	readonly choicePayloads: Set<string>;
	readonly boxedPayloads: readonly string[];
	readonly nodes: Set<string>;
	readonly records: Map<string, RecordLayout>;
}

function readPrintOf(
	grammar: GrammarName,
	structs: readonly EmittedStruct[],
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[],
	generatedIdTables: GeneratedIdTables,
	boxedPayloads: readonly string[]
): ReadPrint {
	return {
		boxedPayloads,
		grammar,
		envelopeExtras: new Map(),
		printedEnums: new Set(),
		ctx: {
			nodeMap,
			kindEntries,
			names: readNames(kindEntries, generatedFieldIds(generatedIdTables)),
			listOwners: new Set(listViewOwners(nodeMap).map((node) => node.kind)),
			envelopeIds: new Set(aliasEnvelopeIds(aliasEnvelopesOf(nodeMap))),
			folds: foldsWithRelaxed(generatedIdTables.folds ?? new Map(), nodeMap, kindEntries),
			grammar
		},
		admitted: new Map(),
		nodes: new Set(),
		blankChoices: new Set(),
		variants: new Map(),
		choicePayloads: new Set(),
		records: new Map()
	};
}

function foldsWithRelaxed(
	folds: ReadonlyMap<number, readonly number[]>,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[]
): ReadonlyMap<number, readonly number[]> {
	const relaxed = [...new Set([...relaxedKeywordIds(nodeMap, kindEntries), ...relaxedDisplayIds(nodeMap, kindEntries).flatMap(([, ids]) => ids)])];
	const word = nodeMap.word === null || nodeMap.word === undefined ? undefined : findKindEntry(kindEntries, nodeMap.word);
	if (relaxed.length === 0 || word === undefined) return folds;
	const merged = new Map(folds);
	merged.set(word.id, [...new Set([...(folds.get(word.id) ?? []), ...relaxed])]);
	return merged;
}

const TRANSPORT_DERIVE = '#[derive(Debug, Clone, PartialEq, ::sittir_core::Node)]';
const TRANSPORT_DERIVE_UNIT = '#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Node)]';
const TRANSPORT_DERIVE_ENUM_KIND = '#[derive(Debug, Clone, Copy, PartialEq, Eq, ::sittir_core::Node)]';

function nodeDeclaration(read: ReadPrint, derive: string, args: string, keyword: 'struct' | 'enum', name: string): string[] {
	read.nodes.add(name);
	return [derive, `#[node(${args})]`, `pub ${keyword} ${name} {`];
}

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
		const extras = ids.filter((id) => id !== variant.aliasTypeId);
		read.envelopeExtras.set(`${enumName}.${variantName}`, { display: variant.aliasTypeId, extras });
		const decodes = extras.length === 0 ? '' : `, decodes(${extras.map((id) => read.ctx.names.kind(id)).join(', ')})`;
		return [`    #[kind(${variantKindArgs([variant.aliasTypeId], true, read.ctx)}${decodes})]`];
	}
	return ids.length === 0 ? [] : [`    #[kind(${variantKindArgs(ids, false, read.ctx)})]`];
}

function renderNodeSupport(
	lang: GrammarName,
	nodeMap: NodeMap,
	structs: EmittedStruct[],
	meta: MetaData,
	generatedIdTables: GeneratedIdTables,
	plan: RenderPlan,
	boxedPayloads: readonly string[],
	envelopePins: Readonly<Record<string, EnvelopePin>> | undefined
): { readonly text: string; readonly records: ReadonlyMap<string, RecordLayout> } {
	const projection = getNodeProjection(nodeMap);
	const nodes = projection.nodes;

	const kindEntries = collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);
	const kidByKind = buildKindIdByKind(kindEntries);
	const fixed = collectFixedLiterals(projection, nodeMap, kindEntries, kidByKind, plan);
	const payloadNodes = nodes.filter((node) => !isFixedTextLeaf(node));

	const read = readPrintOf(lang, structs, nodeMap, kindEntries, generatedIdTables, boxedPayloads);
	const anyNodeLines = renderAnyNode(payloadNodes, fixed, nodeMap, kindEntries, read);

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
		const enumName = `${rustTypeIdent(node.typeName)}Node`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		supertypeEnumLines.push(
			...emitSupertypeNodeEnum(node, kidByKind, nodeMap, fixed, kindEntries, selfAliasIdsBySupertype.get(node.kind), read)
		);
	}

	const perSlotEnums = collectPerSlotChildEnums(nodes, nodeMap);
	const choices = shareIdenticalChoices(perSlotEnums, (entry) =>
		emitPerSlotChildEnum(entry, kidByKind, nodeMap, fixed, kindEntries, plan, read)
	);
	for (const name of choices.folded) read.nodes.delete(name);
	const perSlotEnumLines: string[] = choices.emitted.flatMap(({ lines }) => lines);
	const bodyOf = new Map(structs.map((struct) => [struct.kind, struct.body]));
	const structLines = nodes.flatMap((node) =>
		isFixedTextLeaf(node)
			? renderFixedLiteralNode(rustNodeStructName(node), fixedLiteralOf(fixed, node.kind), read)
			: renderNodeStruct(node, nodeMap, choices.names, kindEntries, plan, read, bodyOf.get(node.kind))
	);
	assertReadableNodes(nodes, nodeMap, choices.names, read);
	assertEnvelopeExtrasPinned(read.grammar, envelopePins, read.envelopeExtras, read.printedEnums, kindEntries);
	const seatTargetLines = renderSeatTargets(
		nodes,
		nodeMap,
		plan,
		kindEntries,
		usedSupertypeNames,
		choices.emitted.map(({ entry }) => entry),
		fixed,
		read
	);

	const rendered = pruneUnreferencedBridges(
		[
			...anyNodeLines,
			'',
			...renderTriviaNodeSupport(nodeMap, fixed, kindEntries, read),
			'',
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
				kindEntries,
				read.boxedPayloads
			),
			...renderNodeEntry(),
			'',
			...payloadCeilingAssertions(read.boxedPayloads, read.choicePayloads)
		].join('\n')
	);
	return { text: [rendered, '', grammarTriviaStatement(read.nodes)].join('\n'), records: read.records };
}

function grammarTriviaStatement(nodes: ReadonlySet<string>): string {
	return `::sittir_core::grammar_trivia!(TriviaNode; ${[...nodes].join(', ')});`;
}

function supertypeAdmitsVerbatim(supertypeNode: AssembledSupertype, nodeMap: NodeMap): boolean {
	return expandConcreteNodeKinds([supertypeNode.kind], nodeMap).some(({ node }) => node.modelType === 'pattern');
}

function supertypeVerbatimIsImmediate(supertypeNode: AssembledSupertype, nodeMap: NodeMap): boolean {
	let sawScalar = false;
	for (const { node } of expandConcreteNodeKinds([supertypeNode.kind], nodeMap)) {
		if (!(node instanceof AssembledLeaf)) continue;
		sawScalar = true;
		if (!node.immediate) return false;
	}
	return sawScalar;
}

function verbatimRenderArm(enumName: string, immediate: boolean): string {
	const call = 'inner.render(w)';
	return `${enumName}::Verbatim(inner) => ${immediate ? `{ w.seam(${TIGHT_KINDS}); ${call} }` : call},`;
}

function pruneUnreferencedBridges(rendered: string): string {
	const lines = rendered.split('\n');
	const out: string[] = [];
	let i = 0;
	while (i < lines.length) {
		const m = lines[i]?.match(/^fn (\w+_node_to_any)\(/);
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
		'#![allow(dead_code, unused_imports, non_snake_case, non_camel_case_types, unused_mut, unused_variables, reason = "One template serves every grammar: a grammar need not use every emitted item, import or binding, and type names follow tree-sitter kind spellings")]'
	);
	lines.push(
		'#![allow(clippy::large_enum_variant, reason = "Choice payload sizes are checked by the generated pinned ceiling assertions")]'
	);
	lines.push(
		'#![allow(clippy::unnecessary_wraps, clippy::trivially_copy_pass_by_ref, clippy::needless_pass_by_value, reason = "each generated function role has one signature: a render function takes its node by reference and returns RenderResult, and a conversion into AnyNode takes its node by value, whatever one body needs")]'
	);
	lines.push('');
	lines.push('use ::sittir_core::view::{KindOf, KindTest, View, ListView, NO_ITEMS};');
	lines.push('use ::sittir_core::render::Render;');
	lines.push('use ::sittir_core::types::{KindId, Source, Span};');
	lines.push('');
	return lines.join('\n');
}

function collectUsedSupertypeNames(nodes: readonly AssembledNode[], nodeMap: NodeMap): Set<string> {
	const used = new Set<string>();

	const collectFromSlots = (slots: readonly AssembledNonterminal[]): void => {
		for (const slot of slots) {
			const shape = nodeSlotShapeOf(slot, nodeMap);
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
				const enumName = `${rustTypeIdent(subNode.typeName)}Node`;
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

function anyNodePrepareArms(
	payloadNodes: readonly AssembledNode[],
	fixed: FixedLiterals
): PrepareArm[] {
	return [
		...payloadNodes.map((node) => ({ variant: rustNodeVariantName(node), payload: true })),
		...[...fixed.values()].map((literal) => ({ variant: literal.variant, payload: false, edged: literal.edged })),
		{ variant: 'Verbatim', payload: true }
	];
}

function isPrepareFilled(slot: AssembledNonterminal): boolean {
	return slot.registeredOption === 'choice' && !isMultiple(slot);
}

function isNodeRequired(slot: AssembledNonterminal): boolean {
	return isMultiple(slot) ? isNonEmpty(slot) : isRequired(slot) && !isPrepareFilled(slot);
}

function boxedInEnum(node: AssembledNode, boxedPayloads: readonly string[]): boolean {
	return boxedPayloads.includes(rustNodeStructName(node));
}

function choicePayloadType(node: AssembledNode, read: ReadPrint): string {
	const name = rustNodeStructName(node);
	read.choicePayloads.add(name);
	return boxedInEnum(node, read.boxedPayloads) ? `Box<${name}>` : name;
}

export function payloadCeilingAssertions(pinned: readonly string[], payloads: ReadonlySet<string>): string[] {
	const stale = pinned.find((name) => !payloads.has(name));
	if (stale !== undefined) throw new Error(`${stale} is pinned in boxed-payloads.ts but no choice holds it: unpin it`);
	const n = PAYLOAD_CEILING_BYTES;
	return [...payloads].sort().map((name) =>
		pinned.includes(name)
			? `const _: () = assert!(::core::mem::size_of::<${name}>() > ${n}, "${name} is within the ${n}-byte payload ceiling: unpin it in boxed-payloads.ts");`
			: `const _: () = assert!(::core::mem::size_of::<${name}>() <= ${n}, "${name} is over the ${n}-byte payload ceiling: pin it in boxed-payloads.ts");`
	);
}

function kindIdStoredFirst<T>(entries: readonly T[], nodeOf: (entry: T) => AssembledNode): T[] {
	return [...entries].sort((a, b) => Number(isKindIdStored(nodeOf(b))) - Number(isKindIdStored(nodeOf(a))));
}

function claimSupertypeIds(
	supertypeNode: AssembledSupertype,
	enumName: string,
	shape: EffectiveSupertypeNodeShape,
	selfAliasIds: readonly number[] | undefined,
	kindIdByKind: ReadonlyMap<string, number>,
	kindEntries: readonly KindEnumEntry[],
	nodeMap: NodeMap
): Map<string, number[]> {
	const claimedBy = new Map<string, number[]>();
	const emittedIds = new Set<number>();
	const selfId = kindIdByKind.get(supertypeNode.kind);
	if (selfId !== undefined) emittedIds.add(selfId);
	for (const suppressedKind of shape.suppressedKinds) {
		const id = kindIdByKind.get(suppressedKind);
		if (id !== undefined) emittedIds.add(id);
	}
	for (const aliasId of selfAliasIds ?? []) emittedIds.add(aliasId);
	const members = kindIdStoredFirst(shape.subtypes, (s) => s.subNode).map(({ subKind, subNode }) => {
		const variant = rustTypeIdent(subNode.typeName);
		const idsOf = (parseName: string | undefined): number[] =>
			resolveAcceptedNodeIds({ kind: subKind, node: subNode, nodeMap, kindIdByKind, kindEntries, parseName });
		const acceptedIds = idsOf(shape.parseNames.get(subKind));
		assertRoutableNodeIds(
			acceptedIds,
			subKind,
			variant,
			enumName,
			`under supertype '${supertypeNode.kind}'`,
			kindEntries
		);
		return { variant, ownIds: idsOf(undefined), acceptedIds };
	});
	const claim = (variant: string, ids: readonly number[]): void => {
		for (const id of ids) {
			if (emittedIds.has(id)) continue;
			emittedIds.add(id);
			claimedBy.set(variant, [...(claimedBy.get(variant) ?? []), id]);
		}
	};
	for (const member of members) claim(member.variant, member.ownIds);
	for (const member of members) claim(member.variant, member.acceptedIds);
	return claimedBy;
}

function emitSupertypeNodeEnum(
	supertypeNode: AssembledSupertype,
	kindIdByKind: ReadonlyMap<string, number>,
	nodeMap: NodeMap,
	fixed: FixedLiterals,
	kindEntries: readonly KindEnumEntry[],
	selfAliasIds: readonly number[] | undefined,
	read: ReadPrint
): string[] {
	const enumName = `${rustTypeIdent(supertypeNode.typeName)}Node`;
	const lines: string[] = [];
	const shape = collectEffectiveSupertypeNodeShape(supertypeNode, nodeMap);
	const validSubtypes = shape.subtypes;
	const admitsVerbatim = supertypeAdmitsVerbatim(supertypeNode, nodeMap);

	const isBoxed = (subNode: AssembledNode): boolean => boxedInEnum(subNode, read.boxedPayloads);

	const claimedBy = claimSupertypeIds(supertypeNode, enumName, shape, selfAliasIds, kindIdByKind, kindEntries, nodeMap);

	lines.push(...nodeDeclaration(read, TRANSPORT_DERIVE, 'choice', 'enum', enumName));
	for (const { subKind, subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		lines.push(...variantKindLines(enumName, variant, subNode, claimedBy.get(variant) ?? [], read));
		lines.push(...(isFixedTextLeaf(subNode) ? fixedVariantLines(fixedLiteralOf(fixed, subKind)) : [`    ${variant}(${choicePayloadType(subNode, read)}),`]));
	}
	if (admitsVerbatim) lines.push(`    #[node(verbatim)]`, `    Verbatim(VerbatimNode),`);
	lines.push(`}`);
	lines.push(``);
	read.variants.set(enumName, [...validSubtypes.map(({ subNode }) => rustTypeIdent(subNode.typeName)), ...(admitsVerbatim ? ['Verbatim'] : [])]);
	admit(read, enumName, [...claimedBy.values()].flat());
	lines.push(
		...prepareEnumImpl(enumName, [
			...validSubtypes.map(({ subKind, subNode }) => ({
				variant: rustTypeIdent(subNode.typeName),
				payload: !isFixedTextLeaf(subNode),
				edged: isFixedTextLeaf(subNode) && fixedLiteralOf(fixed, subKind).edged
			})),
			...(admitsVerbatim ? [{ variant: 'Verbatim', payload: true }] : [])
		])
	);

	lines.push(
		...kindOfImplLines(
			enumName,
			validSubtypes.map(({ subKind, subNode }) => {
				const variant = rustTypeIdent(subNode.typeName);
				if (!isFixedTextLeaf(subNode)) return { variant, payload: true };
				const { ownId, edged } = fixedLiteralOf(fixed, subKind);
				return { variant, payload: edged, ids: ownId === undefined ? [] : [ownId] };
			}),
			admitsVerbatim
				? validSubtypes
						.filter(({ subNode }) => subNode.modelType === 'pattern')
						.map(({ subKind }) => kindIdByKind.get(subKind))
						.filter((id): id is number => id !== undefined)
				: undefined
		)
	);

	lines.push(`fn ${rustSnakeIdent(supertypeNode.typeName)}_node_to_any(t: ${enumName}) -> AnyNode {`);
	lines.push(`    match t {`);
	for (const { subKind, subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		const boxed = isBoxed(subNode);
		if (isFixedTextLeaf(subNode)) {
			const unit = fixedLiteralOf(fixed, subKind);
			lines.push(`        ${fixedPattern(`${enumName}::${variant}`, unit, 'edges')} => ${fixedPattern(`AnyNode::${variant}`, unit, 'edges')},`);
		} else if (subNode instanceof AssembledSupertype) {
			const subBridgeFn = `${rustSnakeIdent(subNode.typeName)}_node_to_any`;
			if (boxed) {
				lines.push(`        ${enumName}::${variant}(inner) => ${subBridgeFn}(*inner),`);
			} else {
				lines.push(`        ${enumName}::${variant}(inner) => ${subBridgeFn}(inner),`);
			}
		} else {
			lines.push(`        ${enumName}::${variant}(inner) => AnyNode::${rustTypeIdent(subNode.typeName)}(inner),`);
		}
	}
	if (admitsVerbatim) lines.push(`        ${enumName}::Verbatim(inner) => AnyNode::Verbatim(inner),`);
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

function emitSupertypeRenderHelper(supertypeNode: AssembledSupertype, nodeMap: NodeMap, fixed: FixedLiterals, boxedPayloads: readonly string[]): string[] {
	const enumName = `${rustTypeIdent(supertypeNode.typeName)}Node`;
	const fnName = `render_${rustSnakeIdent(supertypeNode.typeName)}`;
	const lines: string[] = [];
	const { subtypes: validSubtypes } = collectEffectiveSupertypeNodeShape(supertypeNode, nodeMap);

	lines.push(
		`fn ${fnName}(t: &${enumName}, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	lines.push(`    match t {`);
	for (const { subKind, subNode } of validSubtypes) {
		const variant = rustTypeIdent(subNode.typeName);
		if (isFixedTextLeaf(subNode)) {
			lines.push(`        ${fixedRenderArm(`${enumName}::${variant}`, fixedLiteralOf(fixed, subKind))}`);
			continue;
		}
		const innerExpr = boxedInEnum(subNode, boxedPayloads) ? `inner.as_ref()` : `inner`;
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

function collectConcreteNodeKindIds(kind: string, nodeMap: NodeMap, seen: Set<string> = new Set()): number[] {
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
		for (const nestedId of collectConcreteNodeKindIds(name, nodeMap, seen)) ids.add(nestedId);
	}
	return [...ids];
}

interface AcceptedNodeIdsInput {
	kind: string;
	node: AssembledNode;
	nodeMap: NodeMap;
	kindIdByKind: ReadonlyMap<string, number>;
	kindEntries: readonly KindEnumEntry[];
	stampedIds?: readonly number[];
	parseAliases?: Readonly<Record<string, string>>;
	parseName?: string;
}

function resolveAcceptedNodeIds(input: AcceptedNodeIdsInput): number[] {
	const { kind, node, nodeMap, kindIdByKind, kindEntries, stampedIds, parseAliases, parseName } = input;
	let acceptedIds: number[];
	if (stampedIds !== undefined) {
		acceptedIds = [...stampedIds];
	} else {
		const nameKeyedIds = [
			...new Set<string>([...concreteKindsOf(kind, nodeMap), ...acceptedNodeKinds(kind, nodeMap, parseAliases)])
		]
			.map((k) => kindIdByKind.get(k))
			.filter((id): id is number => id !== undefined);
		acceptedIds = [...new Set([...nameKeyedIds, ...collectConcreteNodeKindIds(kind, nodeMap)])];
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

function assertRoutableNodeIds(
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

function expandConcreteNodeKinds(
	kinds: readonly string[],
	nodeMap: NodeMap
): { kind: string; node: AssembledNode; concreteName: string }[] {
	const expanded: { kind: string; node: AssembledNode; concreteName: string }[] = [];
	const seen = new Set<string>();

	const includeKind = (kind: string): void => {
		if (seen.has(kind)) return;
		const node = nodeMap.nodes.get(kind);
		if (node === undefined) return;
		const concreteName = concreteNodeTypeName(kind, nodeMap);
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
			const req = isNodeRequired(f);
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
	literals: readonly NodeLiteral[];
	parseAliases: Readonly<Record<string, string>>;
	acceptedIdsByKind: ReadonlyMap<string, readonly number[]>;
	verbatimImmediate: boolean;
}

function hasAnyConcreteChildKind(kinds: readonly string[], nodeMap: NodeMap): boolean {
	return expandConcreteNodeKinds(kinds, nodeMap).length > 0;
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
	const reservedNodeNames = new Set<string>();
	for (const node of nodes) {
		reservedNodeNames.add(rustNodeStructName(node));
	}

	const consider = (typeName: string, ownerKind: string, field: AssembledNonterminal): void => {
		if (nodeSlotShapeOf(field, nodeMap).tag !== 'union') return;
		const slotKinds: string[] = [];
		const literalSet = new Set<string>();
		const literals: NodeLiteral[] = [];
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
		if (reservedNodeNames.has(enumName)) return;
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
	readonly folded: readonly string[];
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
	const folded: string[] = [];
	for (const entry of entries) {
		const name = perSlotEnumName(entry.typeName, entry.fieldName);
		const lines = render(entry);
		const body = lines.join('\n').replace(new RegExp(`\\b${name}\\b`, 'g'), '\0');
		const shared = nameByBody.get(body);
		if (shared === undefined) {
			nameByBody.set(body, name);
			emitted.push({ entry, lines });
		} else folded.push(name);
		names.set(choiceKey(entry.typeName, entry.fieldName), shared ?? name);
	}
	return { emitted, names, folded };
}

function choiceNameOf(choices: ChoiceNames, typeName: string, fieldName: string): string {
	const name = choices.get(choiceKey(typeName, fieldName));
	if (name === undefined) {
		throw new Error(`render-module: ${typeName}.${fieldName} is typed by its own choice, but none was collected for it`);
	}
	return name;
}

function resolveLiteralKindId(literal: NodeLiteral, kindEntries: readonly KindEnumEntry[]): number | undefined {
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
	literal: NodeLiteral,
	entry: PerSlotChildEnum,
	plan: RenderPlan,
	kindEntries: readonly KindEnumEntry[]
): LiteralArmSeams | undefined {
	const owner = literal.enumKind ?? entry.ownerKind;
	const sites: { before?: string; after?: string } = {};
	const token = tokenNameOfText(literal.text, kindEntries);
	for (const site of plan.spacingSites) {
		if (site.source !== owner || site.side !== 'seam' || site.seat !== undefined) continue;
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
	kindEntries: readonly KindEnumEntry[]
): ReadonlyMap<string, ChoiceUnit> {
	const units = new Map<string, ChoiceUnit>();
	for (const { node } of validKinds) {
		if (!isFixedTextLeaf(node)) continue;
		const unit = fixedLiteralOf(fixed, node.kind);
		units.set(unit.variant, { fixed: unit, siteImmediate: false, seams: undefined });
	}
	for (const literal of entry.literals) {
		const unit = fixedLiteralOf(fixed, literal.kind, literal.text);
		const seams = literalSeamsOf(literal, entry, plan, kindEntries);
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
	const call = fixedRenderCall(unit.fixed);
	const write = unit.siteImmediate ? `{ w.seam(${TIGHT_KINDS}); ${call} }` : call;
	const pattern = fixedPattern(`${enumName}::${unit.fixed.variant}`, unit.fixed, 'edges');
	return unit.seams === undefined ? [`            ${pattern} => ${write},`] : literalSeamedArm(pattern, write, unit.seams);
}

function literalSeamedArm(pattern: string, write: string, seams: LiteralArmSeams): string[] {
	const site = (side: 'before' | 'after'): string[] =>
		seams[side] === undefined ? [] : [`                w.site_at(options::${seams[side]});`];
	return [
		`            ${pattern} => {`,
		...site('before'),
		`                let written = ${write};`,
		'                written?;',
		...site('after'),
		'                Ok(())',
		'            }'
	];
}

function unitKindIdsOf(
	entry: PerSlotChildEnum,
	units: ReadonlyMap<string, ChoiceUnit>,
	acceptedIdsOf: (kind: string, node: AssembledNode) => readonly number[],
	validKinds: readonly { readonly kind: string; readonly node: AssembledNode }[],
	fixed: FixedLiterals,
	kindEntries: readonly KindEnumEntry[]
): readonly { readonly id: number; readonly unit: FixedLiteral }[] {
	const ids: { id: number; unit: FixedLiteral }[] = [];
	const seen = new Set<number>();
	const push = (id: number, unit: FixedLiteral): void => {
		if (seen.has(id)) return;
		seen.add(id);
		ids.push({ id, unit });
	};
	for (const literal of entry.literals) {
		const id = resolveLiteralKindId(literal, kindEntries);
		if (id !== undefined) push(id, fixedLiteralOf(fixed, literal.kind));
	}
	for (const { kind, node } of validKinds) {
		if (!isFixedTextLeaf(node)) continue;
		for (const id of acceptedIdsOf(kind, node)) push(id, fixedLiteralOf(fixed, node.kind));
	}
	return ids;
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

	const validKinds = expandConcreteNodeKinds(entry.kinds, nodeMap);
	const nodeKinds = validKinds.filter(({ node }) => !isFixedTextLeaf(node));
	const units = choiceUnitsOf(entry, validKinds, fixed, plan, kindEntries);
	const admitsVerbatim = validKinds.some(({ node }) => node.modelType === 'pattern');

	const isBoxed = (variantNode: AssembledNode): boolean => boxedInEnum(variantNode, read.boxedPayloads);
	const modelSlot = nodeMap.nodes.get(ownerKind)?.slots.find((candidate) => candidate.name === entry.fieldName);
	const blank = modelSlot !== undefined && hasBlankArm(modelSlot);

	const acceptedIdsOf = (kind: string, node: AssembledNode): readonly number[] => {
		const acceptedIds = resolveAcceptedNodeIds({
			kind,
			node,
			nodeMap,
			kindIdByKind,
			kindEntries,
			stampedIds: entry.acceptedIdsByKind.get(kind),
			parseAliases: entry.parseAliases
		});
		assertRoutableNodeIds(
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
	const emittedIds = new Set<number>();
	const claimedBy = new Map<string, number[]>();
	const claim = (variant: string, id: number): void => {
		claimedBy.set(variant, [...(claimedBy.get(variant) ?? []), id]);
	};
	for (const { id, unit } of unitIds) {
		emittedIds.add(id);
		claim(unit.variant, id);
	}
	if (blank) emittedIds.add(BLANK_KIND_ID);
	for (const { kind, node } of kindIdStoredFirst(nodeKinds, (v) => v.node)) {
		const variant = rustTypeIdent(node.typeName);
		for (const id of acceptedIdsOf(kind, node)) {
			if (emittedIds.has(id)) continue;
			emittedIds.add(id);
			claim(variant, id);
		}
	}

	const altIds = new Map(modelSlot === undefined ? [] : kindEnumAltIdPairs(modelSlot, nodeMap));
	lines.push(...nodeDeclaration(read, TRANSPORT_DERIVE, 'choice', 'enum', enumName));
	for (const { node } of nodeKinds) {
		const variant = rustTypeIdent(node.typeName);
		lines.push(...variantKindLines(enumName, variant, node, claimedBy.get(variant) ?? [], read));
		lines.push(`    ${variant}(${choicePayloadType(node, read)}),`);
	}
	for (const [variant, unit] of units) {
		const claimed = claimedBy.get(variant) ?? [];
		lines.push(...variantKindLines(enumName, variant, undefined, [...claimed, ...alternatesOf(claimed, altIds)], read));
		lines.push(...fixedVariantLines(unit.fixed));
	}
	if (blank) lines.push(`    #[node(blank)]`, `    ${BLANK_VARIANT},`);
	if (admitsVerbatim) lines.push(`    #[node(verbatim)]`, `    Verbatim(VerbatimNode),`);
	lines.push(`}`);
	lines.push(``);
	read.variants.set(enumName, [...nodeKinds.map(({ node }) => rustTypeIdent(node.typeName)), ...units.keys(), ...(blank ? [BLANK_VARIANT] : []), ...(admitsVerbatim ? ['Verbatim'] : [])]);
	admit(read, enumName, [...claimedBy.values()].flat());
	if (blank) read.blankChoices.add(enumName);
	lines.push(
		...prepareEnumImpl(enumName, [
			...nodeKinds.map(({ node }) => ({ variant: rustTypeIdent(node.typeName), payload: true })),
			...[...units].map(([variant, unit]) => ({ variant, payload: false, edged: unit.fixed.edged })),
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
					payload: unit.edged,
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

	lines.push(`impl ::sittir_core::render::Render for ${enumName} {`);
	lines.push(
		`    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	lines.push(`        match self {`);
	for (const { kind, node } of nodeKinds) {
		const variant = rustTypeIdent(node.typeName);
		const innerExpr = isBoxed(node) ? 'inner.as_ref()' : 'inner';
		const call = `${innerExpr}.render(w)`;
		const arm =
			!(node instanceof AssembledLeaf) && isLeftImmediateKind(kind, nodeMap) ? `{ w.seam(${TIGHT_KINDS}); ${call} }` : call;
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

function renderAnyNode(
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
	for (const node of payloadNodes) {
		const id = kindIdByKind.get(node.kind);
		if (id === undefined) continue;
		if (emittedNodeIds.has(id)) continue;
		emittedNodeIds.add(id);
		const variant = rustNodeVariantName(node);
		claimedBy.set(variant, [...(claimedBy.get(variant) ?? []), id]);
	}
	for (const literal of fixed.values()) {
		const id = literal.ownId;
		if (id === undefined || emittedNodeIds.has(id)) continue;
		emittedNodeIds.add(id);
		claimedBy.set(literal.variant, [...(claimedBy.get(literal.variant) ?? []), id]);
	}

	lines.push(...nodeDeclaration(read, TRANSPORT_DERIVE, 'choice', 'enum', 'AnyNode'));
	for (const node of payloadNodes) {
		const variant = rustNodeVariantName(node);
		lines.push(...variantKindLines('AnyNode', variant, node, claimedBy.get(variant) ?? [], read));
		lines.push(`    ${variant}(${choicePayloadType(node, read)}),`);
	}
	for (const literal of fixed.values()) {
		lines.push(...variantKindLines('AnyNode', literal.variant, undefined, claimedBy.get(literal.variant) ?? [], read));
		lines.push(...fixedVariantLines(literal));
	}
	lines.push('    #[node(error)]');
	lines.push('    Verbatim(VerbatimNode),');
	lines.push('}');
	lines.push('');
	read.variants.set('AnyNode', [...payloadNodes.map(rustNodeVariantName), ...[...fixed.values()].map((literal) => literal.variant), 'Verbatim']);
	admit(read, 'AnyNode', [...claimedBy.values()].flat());
	lines.push(...prepareEnumImpl('AnyNode', anyNodePrepareArms(payloadNodes, fixed)));

	return lines;
}

function renderNodeEntry(): string[] {
	return [
		'use ::sittir_core::types::Source as NodeSource;',
		'',
		'/// The render entry point. The root arrives in the same `SlotValue`',
		'/// carrier every slot position uses, so a root that is itself an',
		'/// unexpanded read stub reproduces its source instead of failing to',
		'/// deserialize as its own kind.',
		'pub type RenderRoot = ::sittir_core::SlotValue<AnyNode>;',
		'',
		'pub fn render_node_parts(',
		'    mut node: RenderRoot,',
		"    ctx: &::sittir_core::prepare::RenderContext<'_>,",
		') -> Result<(NodeSource, String), ::sittir_core::render::RenderError> {',
		'    ::sittir_core::prepare::Prepare::prepare(&mut node, ctx)?;',
		'    let rendered = render_node_dispatch(&node, ctx)?;',
		'    Ok((NodeSource::Factory, rendered))',
		'}'
	];
}


function renderTriviaNodeSupport(
	nodeMap: NodeMap,
	fixed: FixedLiterals,
	kindEntries: readonly KindEnumEntry[],
	read: ReadPrint
): string[] {
	const depthMembers = depthMembersOf(nodeMap);
	const extrasNodes = [...triviaKinds(nodeMap)]
		.filter((kind) => kind !== depthMembers.indent && kind !== depthMembers.dedent)
		.map((kind) => nodeMap.nodes.get(kind))
		.filter((node): node is AssembledNode => node !== undefined && !(node instanceof AssembledSupertype));
	const unitOf = (node: AssembledNode): FixedLiteral | undefined => {
		const unit = isFixedTextLeaf(node) ? fixedLiteralOf(fixed, node.kind) : undefined;
		if (unit?.edged === true) throw new Error(`trivia kind '${node.kind}' is a unit a list seats, but trivia holds no edges`);
		return unit;
	};

	const kindIdByKind = buildKindIdByKind(kindEntries);
	const textIds = [
		...extrasNodes.flatMap((node) => {
			const id = kindIdByKind.get(node.kind);
			return id === undefined || !(node instanceof AbstractAssembledCompound) ? [] : [id];
		}),
		...(read.ctx.kindEntries.some((entry) => entry.id === ERROR_KIND_ID) ? [ERROR_KIND_ID] : [])
	];

	const depthVariants = [
		{ kind: depthMembers.indent, variant: 'Indent', delta: 1 },
		{ kind: depthMembers.dedent, variant: 'Dedent', delta: -1 }
	].flatMap(({ kind, variant, delta }) => {
		const id = kind === undefined ? undefined : kindIdByKind.get(kind);
		return id === undefined ? [] : [{ variant, id, delta }];
	});

	const whitespaceKinds = new Set(whitespaceTriviaKinds(nodeMap));
	const continuationKinds = new Set(continuationTriviaKinds(nodeMap));
	const payloadOf = (node: AssembledNode): string =>
		continuationKinds.has(node.kind) ? TRIVIA_TEXT : rustNodeStructName(node);

	const lines: string[] = [];
	lines.push(...nodeDeclaration(read, TRANSPORT_DERIVE, 'choice, codec_only', 'enum', 'TriviaNode'));
	for (const node of extrasNodes) {
		const variant = rustNodeVariantName(node);
		const id = kindIdByKind.get(node.kind);
		if (id !== undefined) lines.push(`    #[kind(${variantKindArgs([id], false, read.ctx)})]`);
		lines.push(unitOf(node) === undefined ? `    ${variant}(${payloadOf(node)}),` : `    ${variant},`);
	}
	for (const { variant, id } of depthVariants) lines.push(`    #[kind(${variantKindArgs([id], false, read.ctx)})]`, `    ${variant},`);
	lines.push('    #[node(verbatim)]');
	lines.push('    Verbatim(VerbatimNode),');
	lines.push('    #[node(text)]', `    #[kind(${variantKindArgs(textIds, false, read.ctx)})]`);
	lines.push(`    Text(${TRIVIA_TEXT}),`);
	lines.push('}');
	lines.push('');
	lines.push(
		...prepareEnumImpl('TriviaNode', [
			...extrasNodes.map((node) => ({ variant: rustNodeVariantName(node), payload: unitOf(node) === undefined })),
			...depthVariants.map(({ variant }) => ({ variant, payload: false })),
			{ variant: 'Verbatim', payload: true },
			{ variant: 'Text', payload: true }
		], false)
	);

	lines.push('impl ::sittir_core::render::Render for TriviaNode {');
	lines.push(
		'    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {'
	);
	lines.push('        match self {');
	for (const node of extrasNodes) {
		const variant = rustNodeVariantName(node);
		const unit = unitOf(node);
		lines.push(
			unit === undefined
				? `            TriviaNode::${variant}(t) => t.render(w),`
				: `            TriviaNode::${variant} => ${unit.renderFn}(w),`
		);
	}
	for (const { variant, delta } of depthVariants) lines.push(`            TriviaNode::${variant} => { w.layout_depth(${delta}); Ok(()) }`);
	lines.push('            TriviaNode::Verbatim(t) => t.render(w),');
	lines.push('            TriviaNode::Text(t) => t.render(w),');
	lines.push('        }');
	lines.push('    }');
	lines.push('}');
	lines.push('');

	const members = extrasNodes.flatMap((node) => {
		const id = kindIdByKind.get(node.kind);
		if (id === undefined || !(whitespaceKinds.has(node.kind) || continuationKinds.has(node.kind))) return [];
		const unit = unitOf(node) ?? (whitespaceKinds.has(node.kind) ? fixedLiteralOf(fixed, node.kind) : undefined);
		return [{ id, member: unit === undefined ? `TriviaNode::${rustNodeVariantName(node)}(text)` : `TriviaNode::${unit.variant}` }];
	});
	const layoutMembers = [...members, ...depthVariants.map(({ variant, id }) => ({ id, member: `TriviaNode::${variant}` }))];
	lines.push(
		'impl ::sittir_core::trivia::FromTriviaText for TriviaNode {',
		`    fn from_text(text: ${TRIVIA_TEXT}) -> Self {`,
		'        TriviaNode::Text(text)',
		'    }',
		'',
		`    fn from_layout(${layoutMembers.length > 0 ? 'text' : '_text'}: ${TRIVIA_TEXT}) -> Option<Self> {`
	);
	for (const { id, member } of layoutMembers) {
		lines.push(`        if text.kind == ${variantKindArgs([id], false, read.ctx)} { return Some(${member}); }`);
	}
	lines.push('        None', '    }', '}', '');

	lines.push('impl ::sittir_core::trivia::TriviaSeam for TriviaNode {');
	lines.push('    fn seam_gap(&self) -> Option<(::sittir_core::layout_kinds::LayoutKinds, Option<&str>)> {');
	lines.push('        match self {');
	for (const node of extrasNodes) {
		if (continuationKinds.has(node.kind)) {
			const unit = unitOf(node);
			lines.push(
				unit === undefined
					? `            TriviaNode::${rustNodeVariantName(node)}(t) if !t.verbatim() => Some((${CONTINUATION_KINDS}, Some(&t.text))),`
					: `            TriviaNode::${unit.variant} => Some((${CONTINUATION_KINDS}, Some(${rustStringLiteral(unit.text)}))),`
			);
			continue;
		}
		if (!whitespaceKinds.has(node.kind)) continue;
		const unit = fixedLiteralOf(fixed, node.kind);
		lines.push(`            TriviaNode::${unit.variant} => Some((${layoutKindsOfText(unit.text)}, None)),`);
	}
	lines.push('            _ => None,');
	lines.push('        }');
	lines.push('    }');
	if (depthVariants.length > 0) {
		lines.push('', '    fn depth(&self) -> i32 {', '        match self {');
		for (const { variant, delta } of depthVariants) lines.push(`            TriviaNode::${variant} => ${delta},`);
		lines.push('            _ => 0,', '        }', '    }');
		lines.push('', '    fn depth_member(delta: i32) -> Option<Self> {', '        match delta.signum() {');
		for (const { variant, delta } of depthVariants) lines.push(`            ${delta} => Some(TriviaNode::${variant}),`);
		lines.push('            _ => None,', '        }', '    }');
	}
	lines.push('}');
	lines.push('');

	lines.push('pub type NodeLayout = ::sittir_core::layout::NodeLayout<TriviaNode>;');
	lines.push('');

	return lines;
}

const PREPARE_MOD = '::sittir_core::prepare';
const TRIVIA_TEXT = '::sittir_core::trivia::TriviaText';
const BLANK_VARIANT = 'Blank';
const PREPARE_SIG = `fn prepare(&mut self, ctx: &${PREPARE_MOD}::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {`;
const READ_COORDINATE = [
	`    fn read_coordinate(tree: &::tree_sitter::Tree, ctx: &::sittir_core::read::ReadCtx<'_>, index: ::sittir_core::types::NodeIndex) -> Option<Result<Self, ::sittir_core::read::ReadError>> {`,
	`        Some(::sittir_core::read::read_coordinate(tree, ctx, index))`,
	`    }`
];

interface PrepareArm {
	readonly variant: string;
	readonly payload: boolean;
	readonly edged?: boolean;
}

function prepareEnumImpl(enumName: string, arms: readonly PrepareArm[], reads = true): string[] {
	const anyPayload = arms.some((a) => a.payload);
	const unit = (a: PrepareArm): string => `${enumName}::${a.variant}${a.edged === true ? '(_)' : ''}`;
	return [
		`impl ${PREPARE_MOD}::Prepare for ${enumName} {`,
		`    ${anyPayload ? PREPARE_SIG : PREPARE_SIG.replace('ctx:', '_ctx:')}`,
		`        match self {`,
		...arms.map((a) => (a.payload ? `            ${enumName}::${a.variant}(t) => t.prepare(ctx),` : `            ${unit(a)} => Ok(()),`)),
		`        }`,
		`    }`,
		...(anyPayload || arms.some((a) => a.edged === true)
			? [
					`    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {`,
					`        match self {`,
					...arms.map((a) =>
						a.payload
							? `            ${enumName}::${a.variant}(t) => t.gap_edges(),`
							: a.edged === true
								? `            ${enumName}::${a.variant}(edges) => Some(edges),`
								: `            ${enumName}::${a.variant} => None,`
					),
					`        }`,
					`    }`,
					`    fn snapshot_edge(&self) -> Option<::sittir_core::prepare::SnapshotEdge> {`,
					`        match self {`,
					...arms.map((a) => (a.payload ? `            ${enumName}::${a.variant}(t) => t.snapshot_edge(),` : `            ${unit(a)} => None,`)),
					`        }`,
					`    }`,
					`    fn source_separator(&self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Option<::sittir_core::types::KindId> {`,
					`        match self {`,
					...arms.map((a) => (a.payload ? `            ${enumName}::${a.variant}(t) => t.source_separator(ctx),` : `            ${unit(a)} => None,`)),
					`        }`,
					`    }`
				]
			: []),
		...(reads ? READ_COORDINATE : []),
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
		...READ_COORDINATE,
		`}`,
		''
	];
}

function synthesizedSpacingSites(plan: RenderPlan, node: AssembledNode): readonly SpacingSite[] {
	return plan.spacingSites.filter((site) => site.source === node.kind && site.side !== undefined && site.seat === undefined);
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
	node: AssembledNode | undefined
): (name: string) => { readonly kindId: number; readonly side: 'before' | 'after' } | undefined {
	const sides = node === undefined ? new Map<string, 'before' | 'after'>() : kindEdgeSidesOf(plan, node);
	if (node === undefined || sides.size === 0) return () => undefined;
	const kindId = edgeIdOf(plan, node);
	return (name) => {
		const side = sides.get(rustFieldIdent(name));
		return side === undefined ? undefined : { kindId, side };
	};
}

const edgeRowKindsCache = new WeakMap<RenderPlan, ReadonlySet<number>>();

function edgeRowKindsOf(plan: RenderPlan): ReadonlySet<number> {
	const cached = edgeRowKindsCache.get(plan);
	if (cached !== undefined) return cached;
	const kinds = new Set(edgeSitesOf(plan).map((row) => row.kind));
	edgeRowKindsCache.set(plan, kinds);
	return kinds;
}

interface EdgeArmSlots {
	readonly before?: string;
	readonly after?: string;
}

const edgeRowsCache = new WeakMap<RenderPlan, ReadonlyMap<number, EdgeSiteRow>>();

function edgeRowsOf(plan: RenderPlan): ReadonlyMap<number, EdgeSiteRow> {
	const cached = edgeRowsCache.get(plan);
	if (cached !== undefined) return cached;
	const rows = new Map(edgeSitesOf(plan).map((row) => [row.kind, row]));
	edgeRowsCache.set(plan, rows);
	return rows;
}

function edgeArmSlotsOf(
	plan: RenderPlan,
	node: AssembledNode,
	body: Body | undefined
): EdgeArmSlots | undefined {
	const id = node.kindId;
	const row = id === undefined ? undefined : edgeRowsOf(plan).get(id);
	if (body === undefined || row === undefined || (row.beforeArms.length === 0 && row.afterArms.length === 0)) return undefined;
	const edge = kindEdgeWriterOf(plan, node);
	const out: { before?: string; after?: string } = {};
	body.forEach((member, i) => {
		const written = member.kind === 'seam' ? edge(member.field) : undefined;
		if (written === undefined) return;
		const arms = written.side === 'before' ? row.beforeArms : row.afterArms;
		if (arms.length === 0) return;
		const slot = body[written.side === 'before' ? i + 1 : i - 1];
		if (slot?.kind !== 'slot') {
			throw new Error(`kind '${node.kind}' has edge arm sites on its ${written.side} edge, but the member beside that edge is not a slot to read the arm from`);
		}
		out[written.side] = slot.name;
	});
	return out;
}

function edgeIdOf(plan: RenderPlan, node: AssembledNode): number {
	const id = node.kindId;
	if (id !== undefined && edgeRowKindsOf(plan).has(id)) return id;
	throw new Error(`kind '${node.kind}' has kind-edge sites but no edge row to prepare and write them from`);
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
	return plan.delimiterSites.find((site) => site.source === node.kind);
}

function separatorSiteOf(plan: RenderPlan, node: AssembledNode): SpacingSite | undefined {
	return plan.spacingSites.find((site) => site.source === node.kind && site.role === 'separator');
}

function slotItems(field: AssembledNonterminal, mutable: boolean): string {
	const [iter, present] = mutable ? ['iter_mut', 'Option::as_mut'] : ['iter', 'Option::as_ref'];
	return `self.${rustFieldIdent(field.storageName)}.${iter}().map(${hasOptionalElements(field) ? present : 'Some'})`;
}

function slotGapFills(node: AssembledNode): string[] {
	const slotModel = renderSlotModelOf(node);
	return [...slotModel.named, ...slotModel.unnamed].filter(isMultiple).map((field) => {
		const slot = `::sittir_core::layout::Layout::slot(&self.layout, ${JSON.stringify(slotWireKey(field.storageName))})`;
		return `        ::sittir_core::prepare::fill_slot_gaps(${slotItems(field, true)}, ${slot});`;
	});
}

function listItemField(node: AssembledList): AssembledNonterminal {
	const slotModel = renderSlotModelOf(node);
	const field = [...slotModel.named, ...slotModel.unnamed].find(isMultiple);
	if (field === undefined) throw new Error(`list '${node.kind}' has no multiple slot to hold its items`);
	return field;
}

function listItemWireKey(node: AssembledList): string {
	return slotWireKey(listItemField(node).storageName);
}

function listItemsExpr(node: AssembledList): string {
	return slotItems(listItemField(node), false);
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

function seatWrappersOf(nodeMap: NodeMap, tables: GeneratedIdTables): SeatWrapper[] {
	const fields = new Map(generatedFieldIds(tables).map(({ name, id }) => [name, id]));
	return [...nodeMap.nodes.values()].flatMap((node) => {
		const slot = wrapperSlotOf(node);
		const id = slot === undefined ? undefined : node.kindId;
		if (slot === undefined || id === undefined) return [];
		if (slot.isUnnamed) return [{ id }];
		const field = fields.get(slot.name!);
		if (field === undefined) throw new Error(`the wrapper '${node.display.name}' holds its content in '${slot.name}', which has no field id`);
		return [{ id, field }];
	});
}

function slotElementsReach(slot: AssembledNonterminal, nodeMap: NodeMap, reaches: SeatReach): boolean {
	const kinds = kindsOf(slot);
	const cls = classifySlotForEmit(kinds, nodeMap);
	if (cls.tag === 'concrete') return reaches(cls.kind);
	if (cls.tag === 'supertype') {
		const kind = findSupertypeKindByTypeName(cls.supertypeName, nodeMap);
		return kind !== undefined && reaches(kind);
	}
	return expandConcreteNodeKinds(kinds, nodeMap).some(({ kind }) => reaches(kind));
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
				seated.has(kind) ||
				(node instanceof AssembledSupertype &&
					collectEffectiveSupertypeNodeShape(node, nodeMap).subtypes.some(({ subKind }) => reach.has(subKind))) ||
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

function seatTargetSig(usesCtx: boolean): string {
	const ctx = usesCtx ? 'ctx' : '_ctx';
	return `    fn seat_target(&mut self, table: &[Option<::sittir_core::types::SiteId>], ${ctx}: &::sittir_core::prepare::RenderContext<'_>) -> Option<(&mut ::sittir_core::options::Edges, ::sittir_core::types::SiteId)> {`;
}

interface SeatArm {
	readonly variant: string;
	readonly line: string;
}

function seatTargetMatchImpl(typeName: string, arms: readonly SeatArm[], read: ReadPrint): string[] {
	if (arms.length === 0) return [];
	const variants = read.variants.get(typeName);
	if (variants === undefined) throw new Error(`enum '${typeName}' has seat arms but no recorded variants`);
	const covered = new Set(arms.map((arm) => arm.variant));
	const rest = variants.filter((variant) => !covered.has(variant));
	return [
		`impl ::sittir_core::prepare::SeatTarget for ${typeName} {`,
		seatTargetSig(arms.some((arm) => arm.line.includes('ctx'))),
		'        match self {',
		...arms.map((arm) => `            ${arm.line}`),
		...(rest.length === 0 ? [] : [`            ${rest.map((variant) => `Self::${variant} { .. }`).join(' | ')} => None,`]),
		'        }',
		'    }',
		'}',
		''
	];
}

function seatArm(variant: string, kind: string, node: AssembledNode, fixed: FixedLiterals): SeatArm {
	return { variant, line: isFixedTextLeaf(node) ? fixedSeatArm(`Self::${variant}`, fixedLiteralOf(fixed, kind)) : `Self::${variant}(t) => t.seat_target(table, ctx),` };
}

function seatTargetStructImpl(
	node: AssembledNode,
	nodeMap: NodeMap,
	plan: RenderPlan,
	fixed: FixedLiterals,
	read: ReadPrint
): string[] {
	const reaches = seatReachOf(plan, nodeMap);
	if (!reaches(node.kind)) return [];
	const kind = node.kind;
	if (isFixedTextLeaf(node)) return seatTargetMatchImpl(rustNodeStructName(node), [{ variant: fixedLiteralOf(fixed, node.kind).variant, line: fixedSeatArm(`Self::${fixedLiteralOf(fixed, node.kind).variant}`, fixedLiteralOf(fixed, node.kind)) }], read);
	const body: string[] = [];
	if (seatedKindsOf(plan).has(node.kind)) {
		const id = node.kindId;
		if (id === undefined) throw new Error(`kind '${kind}' is seated in a list but has no kind id to find its seat by`);
		body.push(
			`        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(${id})) {`,
			'            return Some((self.layout.edges_mut(), site));',
			'        }'
		);
	}
	const wrapper = wrapperSlotOf(node);
	const wraps = wrapper !== undefined && slotElementsReach(wrapper, nodeMap, reaches);
	if (wraps) {
		const field = `self.${rustFieldIdent(wrapper.name!)}`;
		const held = isNodeRequired(wrapper) ? `&mut ${field}` : `${field}.as_mut()`;
		const content = isNodeRequired(wrapper) ? 'Some(content)' : 'content';
		body.push(
			`        match ${content === 'content' ? held : `Some(${held})`} {`,
			'            Some(::sittir_core::SlotValue::Node(inner)) => return inner.seat_target(table, ctx),',
			'            Some(::sittir_core::SlotValue::Coord(coord)) => {',
			'                if let Some(site) = ::sittir_core::prepare::coord_seat(coord, table, ctx) {',
			'                    return Some((self.layout.edges_mut(), site));',
			'                }',
			'            }',
			'            None => {}',
			'        }'
		);
	}
	return [
		`impl ::sittir_core::prepare::SeatTarget for ${rustNodeStructName(node)} {`,
		seatTargetSig(wraps),
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
	perSlotEnums: readonly PerSlotChildEnum[],
	fixed: FixedLiterals,
	read: ReadPrint
): string[] {
	const reaches = seatReachOf(plan, nodeMap);
	const lines: string[] = [];
	for (const node of nodes) {
		if (node instanceof AssembledEnum || node instanceof AssembledSupertype) continue;
		lines.push(...seatTargetStructImpl(node, nodeMap, plan, fixed, read));
	}
	for (const [, node] of nodeMap.nodes) {
		if (!(node instanceof AssembledSupertype) || !usedSupertypeNames.has(node.typeName)) continue;
		const enumName = `${rustTypeIdent(node.typeName)}Node`;
		if (RESERVED_SUPERTYPE_ENUM_NAMES.has(enumName)) continue;
		const subtypes = collectEffectiveSupertypeNodeShape(node, nodeMap).subtypes;
		const reaching = subtypes.filter(({ subKind }) => reaches(subKind)).map(({ subKind, subNode }) => seatArm(rustTypeIdent(subNode.typeName), subKind, subNode, fixed));
		lines.push(...seatTargetMatchImpl(enumName, reaching, read));
	}
	for (const entry of perSlotEnums) {
		const nodes = expandConcreteNodeKinds(entry.kinds, nodeMap).filter(({ kind }) => reaches(kind));
		const variants = new Set(nodes.map(({ node }) => rustTypeIdent(node.typeName)));
		const literals = new Map(
			entry.literals
				.filter(({ kind }) => reaches(kind))
				.map(({ kind }) => fixedLiteralOf(fixed, kind))
				.filter((unit) => !variants.has(unit.variant))
				.map((unit) => [unit.variant, unit])
		);
		const reaching = [
			...nodes.map(({ kind, node }) => seatArm(rustTypeIdent(node.typeName), kind, node, fixed)),
			...[...literals.values()].map((unit) => ({ variant: unit.variant, line: fixedSeatArm(`Self::${unit.variant}`, unit) }))
		];
		lines.push(...seatTargetMatchImpl(perSlotEnumName(entry.typeName, entry.fieldName), reaching, read));
	}
	const anyReaching = nodes.filter((node) => reaches(node.kind)).map((node) => seatArm(rustNodeVariantName(node), node.kind, node, fixed));
	lines.push(...seatTargetMatchImpl('AnyNode', anyReaching, read));
	return lines;
}

function seatedListFields(plan: RenderPlan, node: AssembledNode, nodeMap: NodeMap): ReadonlySet<string> {
	const reaches = seatReachOf(plan, nodeMap);
	const slotModel = renderSlotModelOf(node);
	const seated = seatedTableNames(plan);
	const fields = new Set<string>();
	for (const field of [...slotModel.named, ...slotModel.unnamed]) {
		if (field.name === undefined || !isMultiple(field)) continue;
		if (!seated.has(seatTableName(node.kind, field.name))) continue;
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
		const table = `options::${seatTableName(node.kind, field.name)}`;
		const items = hasOptionalElements(field) ? 'iter_mut().map(Option::as_mut)' : 'iter_mut().map(Some)';
		lines.push(`        ::sittir_core::prepare::fill_seated_gaps(self.${ident}.${items}, ${table}, ctx);`);
	}
	return lines;
}
function optionDefaultFills(plan: RenderPlan, node: AssembledNode, choices: ChoiceNames): string[] {
	const kind = node.kind;
	return renderSlotModelOf(node)
		.named.filter(isPrepareFilled)
		.map((slot) => {
			const site = plan.spacingSites.find(
				(candidate) =>
					candidate.source === node.kind &&
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
			const build = `${choiceNameOf(choices, node.typeName, slot.name)}::from_kind_id(ctx.options.site_arm(options::${site.constName}).arm)`;
			return `        if self.${ident}.is_none() { self.${ident} = ${build}.map(::sittir_core::SlotValue::Node); }`;
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
		`        let inner = ::sittir_core::layout::Layout::inner_item(&self.layout);`,
		`        let first = ::sittir_core::prepare::outermost(${items('first')}, inner, ::sittir_core::options::Side::Before);`,
		`        let last = ::sittir_core::prepare::outermost(${items('last')}, inner, ::sittir_core::options::Side::After);`,
		`        let root = ::sittir_core::layout::Layout::snapshot_edge(&self.layout).map(|edge| edge.span);`,
		`        let flanks = ::sittir_core::prepare::root_flanks(first, last, root, ${allowedOf('before')}, ${allowedOf('after')}, &options::WHITESPACE, ctx);`,
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
		if (kindEdgeSidesOf(plan, node).size > 0) body.push('        ::sittir_core::prepare::prepare_edges(self, ctx);');
		body.push(...slotGapFills(node));
		for (const site of synthesizedSpacingSites(plan, node)) {
			if (!carriesPerNodeValue(site)) continue;
			body.push(
				`        self.${rustFieldIdent(site.fieldIdent)}.get_or_insert(ctx.options.site_arm(options::${site.constName}).arm);`
			);
		}
		body.push(...seatLoops(plan, node, nodeMap));
		if (delim !== undefined) {
			const fallback = `ctx.options.delimiter_at(options::${delim.constName})`;
			const value =
				trailing === undefined
					? fallback
					: `::sittir_core::prepare::source_trailing_delimiter(self.layout.as_deref(), ::sittir_core::types::KindId(${trailing.kind}), &[${trailing.separators.map((id) => `::sittir_core::types::KindId(${id})`).join(', ')}], ${fallback}, ctx)`;
			body.push(`        self.delimiter.get_or_insert(${value});`);
		}
		const sep = node instanceof AssembledList ? separatorSiteOf(plan, node) : undefined;
		if (sep !== undefined && node instanceof AssembledList) {
			body.push(
				`        if let Some(kind) = ::sittir_core::layout::Layout::slot(&self.layout, ${JSON.stringify(listItemWireKey(node))}).and_then(|slot| slot.separator).and_then(Self::separator_kind_of) {`,
				'            self.separator_kind.get_or_insert(kind);',
				'        }',
				`        self.separator_kind.get_or_insert(ctx.options.site_arm(options::${sep.constName}).arm);`,
				`        ::sittir_core::prepare::fill_slot_separators(&mut self.layout, ${JSON.stringify(listItemWireKey(node))}, ${listItemsExpr(node)}, Self::separator_kind_of, ctx);`
			);
		}
		body.push(...optionDefaultFills(plan, node, choices));
		for (const f of fillFields) body.push(`        self.${f}.prepare(ctx)?;`);
	}
	return [
		`impl ${PREPARE_MOD}::Prepare for ${structName} {`,
		`    ${body.length > 0 ? PREPARE_SIG : PREPARE_SIG.replace('ctx:', '_ctx:')}`,
		...body,
		`        Ok(())`,
		`    }`,
		`    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {`,
		`        Some(self.layout.edges_mut())`,
		`    }`,
		`    fn source_separator(&self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Option<::sittir_core::types::KindId> {`,
		`        ::sittir_core::layout::source_separator(self.layout.as_deref(), ctx)`,
		`    }`,
		`    fn snapshot_edge(&self) -> Option<::sittir_core::prepare::SnapshotEdge> {`,
		`        ::sittir_core::layout::Layout::snapshot_edge(&self.layout)`,
		`    }`,
		...READ_COORDINATE,
		`}`,
		''
	];
}

function edgedImplLines(typeName: string, kindId: number, armSlots?: EdgeArmSlots): string[] {
	const id = `::sittir_core::types::KindId(${kindId})`;
	const arm = (side: 'before' | 'after', slot: string | undefined): string =>
		slot === undefined
			? 'None'
			: `self.${rustFieldIdent(slot)}.arm_among(ctx, ctx.options.edge_arm_sites(${id}, ::sittir_core::options::Side::${side === 'before' ? 'Before' : 'After'}))`;
	return [
		`impl ::sittir_core::options::Edged for ${typeName} {`,
		`    fn kind_id(&self) -> ::sittir_core::types::KindId { ${id} }`,
		`    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }`,
		`    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }`,
		...(armSlots === undefined
			? []
			: [
					`    fn edge_arm_kinds(&self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> (Option<::sittir_core::types::KindId>, Option<::sittir_core::types::KindId>) {`,
					`        use ::sittir_core::prepare::ArmOf;`,
					`        (${arm('before', armSlots.before)}, ${arm('after', armSlots.after)})`,
					`    }`
				]),
		`}`,
		''
	];
}

/** The `KindOf` answer a generated node type gives a kind-gated body:
 *  a struct is its own kind, an enum answers for the variant it holds, and a
 *  verbatim value stands for whichever pattern kinds the position admits. */
function kindOfImplLines(
	typeName: string,
	arms: readonly { variant: string; payload: boolean; ids?: readonly number[] }[],
	verbatimIds: readonly number[] | undefined,
	ownIds?: readonly number[]
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
		lines.push(`        }`);
	}
	lines.push(`    }`, `}`, ``);
	return lines;
}

function renderNodeStruct(
	node: AssembledNode,
	nodeMap: NodeMap,
	choices: ChoiceNames,
	kindEntries: readonly KindEnumEntry[],
	plan: RenderPlan,
	read: ReadPrint,
	templateBody: Body | undefined
): string[] {
	if (node instanceof AssembledEnum) {
		return renderEnumType(node, kindEntries, plan, read);
	}
	const slotModel = renderSlotModelOf(node);
	return renderNodeDataStruct(rustNodeStructName(node), node, slotModel, nodeMap, choices, plan, kindEntries, read, templateBody);
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

function renderNodeDataStruct(
	structName: string,
	node: AssembledNode,
	slotModel: RenderSlotModel,
	nodeMap: NodeMap,
	choices: ChoiceNames,
	plan: RenderPlan,
	kindEntries: readonly KindEnumEntry[],
	read: ReadPrint,
	templateBody?: Body
): string[] {
	const isLeafNode = node.modelType === 'pattern';
	const lines: string[] = [];
	const fillFields: string[] = [];
	const ownId = findKindEntry(kindEntries, node.kind)?.id;
	const printedSlots = isCompoundOf(node) ? structSlotsOf(node, slotModel, nodeMap) : [];
	admit(read, structName, node instanceof AssembledAlias ? [node.aliasTypeId] : ownId === undefined ? [] : [ownId]);
	const layout = recordLayoutOf(
		isCompoundOf(node)
			? printedSlots.map(({ slot }) => ({ field: rustFieldIdent(slot.storageName), form: slotRecordForm(nodeSlotShapeOf(slot, nodeMap), isMultiple(slot)) }))
			: []
	);
	read.records.set(structName, layout);
	const placeOf = new Map(layout.places.map((place) => [place.field, place]));
	lines.push(...nodeDeclaration(read, TRANSPORT_DERIVE, `${nodeArgs(node, ownId, read.ctx, printedSlots.map(({ slot }) => slot))}, words = ${layout.words}`, 'struct', structName));
	if (isCompoundOf(node)) {
		lines.push(...renderLayoutField());
		for (const { slot, owner, forceOptional } of printedSlots) {
			const field = rustFieldIdent(slot.storageName);
			lines.push(...renderNodeField(slot, owner.kind, owner.typeName, nodeMap, choices, slotAttr(slot, owner, node, nodeMap, read, placeOf.get(field)), forceOptional));
			fillFields.push(field);
		}
		if (node instanceof AssembledList) {
			if (node.leadingDelimiter === 'optional' || node.trailingDelimiter === 'optional') {
				lines.push(wireKeyAttr('_delimiter'), `    #[flank(${flankArgs(node)})]`, '    pub delimiter: Option<::sittir_core::types::Delimiter>,');
			}
			if (node.separatorRule !== undefined) {
				lines.push(wireKeyAttr('_separator'), `    #[separator_kind(${separatorKindArgs(node, read.ctx)})]`, '    pub separator_kind: Option<KindId>,');
			}
		}
		for (const site of synthesizedSpacingSites(plan, node)) {
			if (!carriesPerNodeValue(site)) continue;
			lines.push(wireKeyAttr(site.wireKey), `    pub ${rustFieldIdent(site.fieldIdent)}: Option<KindId>,`);
		}
	} else if (isTerminalNode(node)) {
		lines.push(...renderLayoutField(), ...renderLeafTextField());
	}
	lines.push('}');
	lines.push('');
	lines.push(...kindOfImplLines(structName, [], undefined, ownId === undefined ? [] : [ownId]));
	const ownKind = ownId === undefined ? 'None' : `Some(::sittir_core::types::KindId(${ownId}))`;
	const edgedId = node.kindId;
	if (edgedId !== undefined) lines.push(...edgedImplLines(structName, edgedId, edgeArmSlotsOf(plan, node, templateBody)));
	lines.push(`impl ::sittir_core::render::Render for ${structName} {`);
	lines.push(
		`    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`
	);
	const body = isLeafNode ? leafRenderExpr(node, 'self', nodeMap, ownId) : `${rustTypedRenderFnName(node.typeName)}(self, w)`;
	const owner = !isLeafNode || ownsTrivia(kindEntries, node.kind);
	lines.push(`        ${layoutRenderCall('self.layout.as_deref()', ownKind, owner, body)}`);
	lines.push(`    }`);
	lines.push(`}`);
	lines.push('');
	lines.push(...prepareStructImpl(structName, node, fillFields, plan, isCompoundOf(node), nodeMap, choices, kindEntries));
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
	readonly edged: boolean;
}

type FixedLiterals = ReadonlyMap<string, FixedLiteral>;

function collectFixedLiterals(
	projection: NodeProjection,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[],
	kindIdByKind: ReadonlyMap<string, number>,
	plan: RenderPlan
): FixedLiterals {
	const fixed = new Map<string, FixedLiteral>();
	const entryOf = (kind: string): KindEnumEntry | undefined => findKindEntry(kindEntries, kind);
	const seated = seatedKindsOf(plan);
	for (const node of projection.nodes) {
		if (!isFixedTextLeaf(node)) continue;
		fixed.set(node.kind, {
			kind: node.kind,
			variant: rustNodeVariantName(node),
			renderFn: rustTypedRenderFnName(node.typeName),
			text: node.text,
			ownId: entryOf(node.kind)?.id,
			acceptedIds: [
				...new Set([
					...resolveAcceptedNodeIds({ kind: node.kind, node, nodeMap, kindIdByKind, kindEntries }),
					...(projection.wireIds.get(node.kind) ?? [])
				])
			],
			owner: ownsTrivia(kindEntries, node.kind),
			immediate: isImmediateLeaf(node),
			edged: seated.has(node.display.name)
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
			immediate: isImmediateLeafKind(literal.kind, nodeMap),
			edged: seated.has(literal.kind)
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

function fixedVariantLines(fixed: FixedLiteral): string[] {
	return fixed.edged ? ['    #[node(edged)]', `    ${fixed.variant}(::sittir_core::options::Edges),`] : [`    ${fixed.variant},`];
}

function fixedPattern(path: string, fixed: FixedLiteral, bind: string = '_'): string {
	return fixed.edged ? `${path}(${bind})` : path;
}

function fixedRenderCall(fixed: FixedLiteral): string {
	return fixed.edged
		? `::sittir_core::render::render_edged(::sittir_core::types::KindId(${fixed.ownId}), edges, w, ${fixed.renderFn})`
		: `${fixed.renderFn}(w)`;
}

function fixedRenderArm(path: string, fixed: FixedLiteral): string {
	return `${fixedPattern(path, fixed, 'edges')} => ${fixedRenderCall(fixed)},`;
}

function fixedSeatArm(path: string, fixed: FixedLiteral): string {
	if (!fixed.edged || fixed.ownId === undefined) {
		throw new Error(`kind '${fixed.kind}' is a fixed literal, a unit variant with no edges, but a list seats it`);
	}
	return `${path}(edges) => ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(${fixed.ownId})).map(|site| (edges, site)),`;
}

function renderFixedLiteralFn(fixed: FixedLiteral): string[] {
	const write = literalWrite(rustStringLiteral(fixed.text), fixed.text);
	const body = fixed.immediate ? `{ w.seam(${TIGHT_KINDS}); ${write} }` : write;
	const ownKind = fixed.ownId === undefined ? 'None' : `Some(::sittir_core::types::KindId(${fixed.ownId}))`;
	return [
		`fn ${fixed.renderFn}(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {`,
		`    ${layoutRenderCall('None', ownKind, fixed.owner, body)}`,
		'}',
		''
	];
}

function layoutRenderCall(layout: string, ownKind: string, owner: boolean, body: string): string {
	return `NodeLayout::render(${layout}, ${ownKind}, ::sittir_core::layout::TriviaRole::${owner ? 'Owner' : 'Token'}, w, |w| ${body})`;
}

function ownsTrivia(kindEntries: readonly KindEnumEntry[], kind: string): boolean {
	return findKindEntry(kindEntries, kind)?.anon !== true;
}

function fixedLiteralIds(fixed: FixedLiteral): number[] {
	return [...new Set(fixed.acceptedIds.length > 0 ? fixed.acceptedIds : fixed.ownId === undefined ? [] : [fixed.ownId])];
}

function renderFixedLiteralNode(typeName: string, fixed: FixedLiteral, read: ReadPrint): string[] {
	const ids = fixedLiteralIds(fixed);
	admit(read, typeName, ids);
	read.variants.set(typeName, [fixed.variant]);
	return [
		...nodeDeclaration(read, TRANSPORT_DERIVE_UNIT, 'choice', 'enum', typeName),
		...variantKindLines(typeName, fixed.variant, undefined, ids, read),
		...fixedVariantLines(fixed),
		'}',
		'',
		...kindOfImplLines(typeName, [], undefined, fixed.ownId === undefined ? [] : [fixed.ownId]),
		...(fixed.edged ? prepareEnumImpl(typeName, [{ variant: fixed.variant, payload: false, edged: true }]) : inertPrepareImpl(typeName)),
		`impl ::sittir_core::render::Render for ${typeName} {`,
		'    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {',
		...(fixed.edged
			? ['        match self {', `            ${fixedRenderArm(`Self::${fixed.variant}`, fixed)}`, '        }']
			: [`        ${fixed.renderFn}(w)`]),
		'    }',
		'}',
		''
	];
}

const LAYOUT_FIELD = { wireKey: '$_layout', rustName: 'layout', rustType: 'Option<Box<NodeLayout>>' } as const;

function slotWireKey(storageName: string): string {
	return `_${storageName}`;
}

function wireKeyAttr(key: string): string {
	return `    #[wire(key = ${JSON.stringify(key)})]`;
}

function renderLayoutField(): string[] {
	return [wireKeyAttr(LAYOUT_FIELD.wireKey), `    pub ${LAYOUT_FIELD.rustName}: ${LAYOUT_FIELD.rustType},`];
}

function renderLeafTextField(): string[] {
	return [wireKeyAttr('$text'), '    pub text: String,'];
}


interface StructSlot {
	readonly slot: AssembledNonterminal;
	readonly owner: AssembledNode;
	readonly forceOptional: boolean;
}

export function nodeSlotNumbers(node: AssembledNode, nodeMap: NodeMap): ReadonlyMap<string, number> {
	if (!isCompoundOf(node)) return new Map();
	return new Map(structSlotsOf(node, renderSlotModelOf(node), nodeMap).map(({ slot }, index) => [slot.storageName, index]));
}

function structSlotsOf(node: AssembledNode, slotModel: RenderSlotModel, nodeMap: NodeMap): StructSlot[] {
	const position = new Map(node.slots.map((slot, index) => [slot.storageName, index]));
	const at = (slot: AssembledNonterminal): number => position.get(slot.storageName) ?? node.slots.length;
	const out: StructSlot[] = [...slotModel.named, ...slotModel.unnamed]
		.sort((a, b) => at(a) - at(b))
		.map((slot) => ({ slot, owner: node, forceOptional: false }));
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

function slotAttr(slot: AssembledNonterminal, owner: AssembledNode, node: AssembledNode, nodeMap: NodeMap, read: ReadPrint, place: RecordPlace | undefined): string {
	const facts = node instanceof AssembledAlias ? '' : interiorOf(node) !== undefined ? captureArgs(slot) : slotArgs(slot, owner, nodeSlotShapeOf(slot, nodeMap), read.ctx);
	const args = [facts, place === undefined ? '' : recordArgs(place)].filter((part) => part !== '').join(', ');
	return args === '' ? '#[slot]' : `#[slot(${args})]`;
}

function readsItsSlots(node: AssembledNode): boolean {
	return node.modelType !== 'pattern' && !(node instanceof AssembledAlias) && interiorOf(node) === undefined;
}

type TypedSlotShape = Exclude<NodeSlotShape, { readonly tag: 'presence' | 'text' }>;

function slotNodeTypeName(slot: AssembledNonterminal, shape: TypedSlotShape, choices: ChoiceNames, typeName: string): string {
	switch (shape.tag) {
		case 'kind':
			return shape.node;
		case 'supertype':
			return `${rustTypeIdent(shape.supertypeName)}Node`;
		case 'union':
			return choiceNameOf(choices, typeName, slot.name);
		case 'any':
			return 'AnyNode';
		default:
			return assertNever(shape);
	}
}

function assertReadableNodes(
	nodes: readonly AssembledNode[],
	nodeMap: NodeMap,
	choices: ChoiceNames,
	read: ReadPrint
): void {
	for (const node of nodes) {
		if (isFixedTextLeaf(node) || node instanceof AssembledEnum || !(node instanceof AbstractAssembledCompound) || !readsItsSlots(node)) continue;
		const untagged: { name: string; ids: readonly number[] }[] = [];
		for (const { slot, owner } of structSlotsOf(node, renderSlotModelOf(node), nodeMap)) {
			const shape = nodeSlotShapeOf(slot, nodeMap);
			const typeName = shape.tag === 'presence' || shape.tag === 'text' ? undefined : slotNodeTypeName(slot, shape, choices, owner.typeName);
			const blank = typeName !== undefined && read.blankChoices.has(typeName);
			if (blank !== hasBlankArm(slot)) {
				throw new Error(
					`render-module: ${node.kind}.${slot.name} ${hasBlankArm(slot) ? 'is' : 'is not'} registered as a blank option, but its choice ${typeName ?? '(none)'} ${blank ? 'has' : 'has no'} blank arm`
				);
			}
			if (!takesUntagged(slot, read.ctx)) continue;
			const ids =
				shape.tag === 'presence'
					? [presenceKeyword(shape, owner, slot, read.ctx).id]
					: typeName === undefined
						? []
						: read.admitted.get(typeName);
			if (ids === undefined) throw new Error(`render-module: ${node.kind}.${slot.name} is typed ${typeName}, which printed no admitted kind ids`);
			untagged.push({ name: slot.name, ids });
		}
		assertOneUntaggedSlot(node.kind, untagged, read.ctx.kindEntries);
	}
}

function renderNodeField(
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
	lines.push(wireKeyAttr(slotWireKey(field.storageName)));
	if (readAttr !== undefined) lines.push(`    ${readAttr}`);
	const required = forceOptional ? false : isNodeRequired(field);
	const adjacent = slotVerbatimIsImmediate(field, nodeMap);
	lines.push(
		`    pub ${rustName}: ${rustNodeSlotType(
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

export type NodeSlotShape =
	| { readonly tag: 'presence'; readonly text: string; readonly kind?: AssembledNode }
	| { readonly tag: 'text' }
	| { readonly tag: 'kind'; readonly kind: string; readonly typeName: string; readonly node: string }
	| { readonly tag: 'supertype'; readonly supertypeName: string }
	| { readonly tag: 'union' }
	| { readonly tag: 'any' };

export function nodeSlotShapeOf(slot: AssembledNonterminal, nodeMap: NodeMap): NodeSlotShape {
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
			const node = concreteNodeTypeName(cls.kind, nodeMap);
			return node === null
				? { tag: 'any' }
				: { tag: 'kind', kind: cls.kind, typeName: cls.typeName, node };
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

function slotClassOfShape(shape: NodeSlotShape, nodeMap: NodeMap): SlotClass {
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

function rustNodeSlotType(
	slot: AssembledNonterminal,
	nodeMap: NodeMap,
	choices: ChoiceNames,
	cardinality: { required: boolean; multiple: boolean; optionalElement?: boolean; adjacent: boolean },
	parentKind: string,
	typeName: string
): string {
	const { required, multiple, optionalElement, adjacent } = cardinality;
	const shape = nodeSlotShapeOf(slot, nodeMap);
	if (shape.tag === 'presence') return 'bool';
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
			const items = optionalElement ? `Option<${element}>` : element;
			return required ? `::sittir_core::NonEmptyVec<${items}>` : `Vec<${items}>`;
		}
		const sized = slotCarrier(createsBackEdge ? `Box<${inner}>` : inner, adjacent);
		return required ? sized : `Option<${sized}>`;
	};

	const inner = slotNodeTypeName(slot, shape, choices, typeName);
	return wrap(shape.tag === 'any' && !multiple ? `Box<${inner}>` : inner);
}

function concreteNodeTypeName(kind: string, nodeMap: NodeMap): string | null {
	const node = nodeMap.nodes.get(kind);
	if (node !== undefined) {
		if (node instanceof AssembledSupertype) {
			return null;
		}
		return rustNodeStructName(node);
	}
	return null;
}

function perSlotEnumName(typeName: string, fieldName: string): string {
	const base = rustTypeIdent(typeName);
	const segments = fieldName.split(/[^A-Za-z0-9]+/).filter((s) => s.length > 0);
	const pascalField = pascalCase(segments.join('_'));
	const sanitized = rustTypeIdent(pascalField);
	return `${base}${sanitized}NodeSlot`;
}

export function rustNodeStructName(node: AssembledNode): string {
	if (node instanceof AssembledEnum) {
		return enumTypeName(node);
	}
	const name = `${rustTypeIdent(node.typeName)}Node`;
	return RESERVED_NODE_STRUCT_NAMES.has(name) ? `${rustTypeIdent(node.typeName)}KindNode` : name;
}

function rustNodeVariantName(node: AssembledNode): string {
	return rustTypeIdent(node.typeName);
}

function rustSnakeIdent(name: string): string {
	const snake = name
		.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
		.replace(/[^A-Za-z0-9_]/g, '_')
		.toLowerCase();
	return snake.length > 0 ? snake : 'node';
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
	const bySlot = new Map<string, { before?: string; after?: string }>();
	for (const site of plan.spacingSites) {
		if (site.source !== node.kind || site.side !== 'seam' || site.seat !== undefined) continue;
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
	if (id === undefined) throw new Error(`node.rs: enum member ${JSON.stringify(text)} of '${node.kind}' has no kind id`);
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
	if (ownId === undefined) throw new Error(`node.rs: enum kind '${node.kind}' has no kind id`);
	lines.push(...nodeDeclaration(read, TRANSPORT_DERIVE_ENUM_KIND, enumKindArgs(ownId, read.ctx), 'enum', enumName));
	for (const arm of arms) {
		lines.push(`    #[kind(${variantKindArgs(arm.ids, false, read.ctx)})]`);
		lines.push(`    ${arm.variant},`);
	}
	lines.push(`}`);
	lines.push('');
	admit(read, enumName, [ownId, ...arms.flatMap((arm) => arm.ids)]);
	lines.push(...inertPrepareImpl(enumName));

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
