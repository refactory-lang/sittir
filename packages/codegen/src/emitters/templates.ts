import {
	CHOICE,
	DEDENT,
	INDENT,
	NEWLINE,
	PATTERN,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
} from '../types/rule-types.ts'; // @rule-type-consts
import { isWordOrVisibleTextLeaf } from '../compiler/model/node-map.ts';
import { isNonterminalRuleType, collectFixedLiteral } from '../dsl/rule-patterns.ts';
import type { NodeMap } from '../compiler/types.ts';
import {
	AbstractAssembledCompound,
	AssembledKeyword,
	isMultiple,
	isRequired,
	kindsOf,
	isTerminalValue,
	edgeClassesOfKind,
	edgeCharSetsOfKind,
	patternLeadingEdgeClass,
	patternTrailingEdgeClass,
	storageKindOfValue,
	fixedTextOfKind
} from '../compiler/model/node-map.ts';
import type {
	AssembledBranch,
	AssembledEnvelope,
	AssembledNode,
	AssembledNonterminal,
	AssembledPolymorph,
	AssembledList,
	NodeOrTerminal,
	SeamEdgeClass
} from '../compiler/model/node-map.ts';
import type { Rule, RuleBase, RenderRule, Multiplicity, SeamOrigin } from '../types/rule.ts';
import type { DiagnosticSink } from '../types/diagnostics.ts';
import type { WhitespaceArm } from '../dsl/primitives/spacing.ts';
import type { CodegenEmitter } from './emitter.ts';
import { classifyTemplateEmission, literalMergePairs, wordCharAsciiTable } from './shared.ts';
import { getTransportProjection } from './transport-projection-cache.ts';
import { flanksOf, isSeamChoice, punctuationTokenOfNode, seamChoiceDefault, seamPartOf, spacedSeparatorOf, type RenderRules } from '../compiler/model/render-rules.ts';
import type { KindEntryLike } from '../compiler/generated-metadata.ts';
import { ADJACENT, DEDENT as DEDENT_BODY, DYNAMIC_EDGE, EMPTY, INDENT as INDENT_BODY, MARKER_EDGE, SPACE, branches, concat, edgeChar, equalBodies, equalNodes, gate, gateOptionalSlotSeams, isExpression, isPlainText, mentions, opensAsTag, refersTo, duplicateSlots, literalBody, seam, slot as slotRef, text, weight, type Body } from './render-body.ts';

export interface EmitTemplatesConfig {
	grammar: string;
	nodeMap: NodeMap;
	renderRules?: RenderRules;
	grammarSha?: string;
	kindEntries?: readonly KindEntryLike[];
	diagnostics?: DiagnosticSink;
}

export interface EmittedTemplates {
	bodies: Map<string, Body>;
	seamCensus: SeamCensusSummary;
}

export interface SeamBoundaryRecord {
	readonly kind: string;
	readonly left: string;
	readonly right: string;
	readonly resolution: 'static-glued' | 'static-spaced' | 'runtime-derivable' | 'runtime-varying';
	readonly origin: SeamOrigin;
}

export interface SeamCensusSummary {
	readonly boundaries: readonly SeamBoundaryRecord[];
	readonly staticGlued: number;
	readonly staticSpaced: number;
	readonly runtimeDerivable: number;
	readonly runtimeVarying: number;
	readonly preferenceOrigin: number;
	readonly tokenDefaultOrigin: number;
	readonly wordDefaultOrigin: number;
	readonly cascadeOrigin: number;
	readonly fallbackOrigin: number;
}

export interface EmitCtx {
	readonly nodeMap: NodeMap;
	readonly wordMatcher: RegExp;
	readonly isWordChar: (c: string) => boolean;
	readonly isLiteralMergePair: (l: string, r: string) => boolean;
	readonly externals: readonly string[];
	readonly rules: Record<string, RenderRule>;
	readonly visitingHelpers: Set<string>;
	readonly emittedSlotNames: Set<string>;
	readonly seamBoundaries?: SeamBoundaryRecord[];
	readonly mergePairClassCombos?: ReadonlySet<string>;
	readonly mergePairLeftChars?: ReadonlySet<string>;
	readonly mergePairRightChars?: ReadonlySet<string>;
	readonly ownerSlots?: Readonly<Record<string, AssembledNonterminal>>;
	readonly currentKind?: string;
	readonly diagnostics?: DiagnosticSink;
}

export function stringifyRule(rule: RenderRule): string {
	switch (rule.type) {
		case STRING:
			return rule.value;
		case SEQ:
			return rule.members.map(stringifyRule).join('');
		default:
			return '';
	}
}

export class TemplateEmitter implements CodegenEmitter<EmittedTemplates> {
	readonly #wordMatcher: RegExp;
	readonly #ctx: EmitCtx;
	readonly #kindEntries: readonly KindEntryLike[];
	#bodies = new Map<string, Body>();
	readonly #seamBoundaries: SeamBoundaryRecord[] = [];

	constructor(config: EmitTemplatesConfig) {
		this.#wordMatcher = config.nodeMap.wordMatcher ?? /\w/;
		this.#kindEntries = config.kindEntries ?? [];
		this.#ctx = {
			nodeMap: config.nodeMap,
			wordMatcher: this.#wordMatcher,
			isWordChar: (() => {
				const table = wordCharAsciiTable(this.#wordMatcher);
				return (c: string) => (c.charCodeAt(0) < 128 ? table[c.charCodeAt(0)]! : /[\p{L}\p{N}]/u.test(c));
			})(),
			isLiteralMergePair: (() => {
				const pairs = new Set(
					literalMergePairs(getTransportProjection(config.nodeMap).literals, config.kindEntries ?? []).map(([a, b]) => a * 128 + b)
				);
				return (l: string, r: string) =>
					l.charCodeAt(0) < 128 && r.charCodeAt(0) < 128 && pairs.has(l.charCodeAt(0) * 128 + r.charCodeAt(0));
			})(),
			...(() => {
				const table = wordCharAsciiTable(this.#wordMatcher);
				const cls = (code: number) => (table[code] ? 'word' : 'not-word');
				const combos = new Set<string>();
				const lefts = new Set<string>();
				const rights = new Set<string>();
				for (const [a, b] of literalMergePairs(getTransportProjection(config.nodeMap).literals, config.kindEntries ?? [])) {
					combos.add(`${cls(a)}\0${cls(b)}`);
					lefts.add(String.fromCharCode(a));
					rights.add(String.fromCharCode(b));
				}
				return { mergePairClassCombos: combos, mergePairLeftChars: lefts, mergePairRightChars: rights };
			})(),
			externals: [...(config.nodeMap.externals ?? [])],
			rules: config.renderRules?.rules ?? config.nodeMap.normalizedRules ?? {},
			visitingHelpers: new Set<string>(),
			emittedSlotNames: new Set<string>(),
			seamBoundaries: this.#seamBoundaries,
			diagnostics: config.diagnostics
		};
	}

	emitLeaf(node: AssembledNode): void {
		this.#emitNode(node);
	}

	emitBranch(node: AssembledNode): void {
		this.#emitNode(node);
	}

	finalize(): EmittedTemplates {
		const boundaries = [...this.#seamBoundaries];
		return {
			bodies: new Map(this.#bodies),
			seamCensus: {
				boundaries,
				staticGlued: boundaries.filter((b) => b.resolution === 'static-glued').length,
				staticSpaced: boundaries.filter((b) => b.resolution === 'static-spaced').length,
				runtimeDerivable: boundaries.filter((b) => b.resolution === 'runtime-derivable').length,
				runtimeVarying: boundaries.filter((b) => b.resolution === 'runtime-varying').length,
				preferenceOrigin: boundaries.filter((b) => b.origin === 'preference').length,
				tokenDefaultOrigin: boundaries.filter((b) => b.origin === 'token-default').length,
				wordDefaultOrigin: boundaries.filter((b) => b.origin === 'word-default').length,
				cascadeOrigin: boundaries.filter((b) => b.origin === 'cascade').length,
				fallbackOrigin: boundaries.filter((b) => b.origin === 'fallback').length
			}
		};
	}

	#slotSeamNames(node: AssembledNode, slotName: string): readonly string[] {
		if (!(node instanceof AbstractAssembledCompound)) return [slotName];
		const slot = node.slots.find((candidate) => candidate.name === slotName);
		const tokens = (slot?.values ?? []).flatMap((value) => {
			const token = punctuationTokenOfNode(this.#ctx.nodeMap.nodes.get(storageKindOfValue(value) ?? ''), this.#kindEntries);
			return token === undefined ? [] : [token];
		});
		return [slotName, ...tokens];
	}

	#emitNode(node: AssembledNode): void {
		if (classifyTemplateEmission(node) !== 'emit') return;

		this.#ctx.visitingHelpers.clear();
		this.#ctx.emittedSlotNames.clear();
		const emitted = emitOne(node, this.#ctx);
		const body = emitted === undefined ? undefined : gateOptionalSlotSeams(emitted, (slot) => this.#slotSeamNames(node, slot));

		if (body === undefined) {
			this.#bodies.set(node.kind, EMPTY);
			return;
		}
		if (process.env['SITTIR_SLOT_PRESERVATION'] !== '0') {
			assertSlotPreservation(node, body);
			assertNoDuplicateSlots(node, body);
		}
		this.#bodies.set(node.kind, body);
	}
}

export function seamNeedsSpace(left: SeamEdgeClass, right: SeamEdgeClass): boolean {
	return left === 'word' && right === 'word';
}

function renderRuleEdge(
	rule: RenderRule,
	side: 'starts' | 'ends',
	ctx: EmitCtx,
	visiting: Set<string>
): SeamEdgeClass | 'empty' {
	const flanks = flanksOf(rule);
	if (flanks !== undefined) return renderRuleEdge(flanks.inner, side, ctx, visiting);
	const mult = (rule as { multiplicity?: Multiplicity }).multiplicity;
	if (rule.type === STRING) {
		if (mult === 'optional') return 'empty';
		const c = side === 'starts' ? rule.value[0] : rule.value[rule.value.length - 1];
		return c === undefined ? 'empty' : ctx.isWordChar(c) ? 'word' : 'not-word';
	}
	if (mult !== undefined && mult !== 'single') return 'varies';
	switch (rule.type) {
		case PATTERN:
			return side === 'starts' ? patternLeadingEdgeClass(rule.value, ctx) : patternTrailingEdgeClass(rule.value, ctx);
		case SEQ: {
			const members = side === 'starts' ? rule.members : [...rule.members].reverse();
			for (const m of members) {
				if (isSeamChoice(m)) continue;
				const e = renderRuleEdge(m, side, ctx, new Set(visiting));
				if (e !== 'empty') return e;
			}
			return 'empty';
		}
		case CHOICE: {
			const edges = rule.members.map((m) => renderRuleEdge(m, side, ctx, new Set(visiting)));
			const first = edges[0];
			if (first === undefined) return 'varies';
			return edges.every((e) => e === first && e !== 'empty') ? first : 'varies';
		}
		case SYMBOL: {
			if (visiting.has(rule.name)) return 'varies';
			visiting.add(rule.name);
			if (ctx.nodeMap.nodes.has(rule.name)) {
				return edgeClassesOfKind(rule.name, {
					nodes: ctx.nodeMap.nodes,
					normalizedRules: ctx.nodeMap.normalizedRules,
					isWordChar: ctx.isWordChar
				})[side];
			}
			const helper = ctx.rules[rule.name];
			return helper !== undefined ? renderRuleEdge(helper, side, ctx, visiting) : 'varies';
		}
		default:
			return 'varies';
	}
}

function ownerSlotsFor(node: AssembledNode): Readonly<Record<string, AssembledNonterminal>> | undefined {
	if (!(node instanceof AbstractAssembledCompound)) return undefined;
	return Object.fromEntries(node.slots.map((slot) => [slot.name, slot]));
}

function emitOne(node: AssembledNode, ctx: EmitCtx): Body | undefined {
	const ctxK: EmitCtx = { ...ctx, currentKind: node.kind };
	switch (node.modelType) {
		case 'branch':
		case 'envelope':
			return emitBranchTemplate(node, ctxK);
		case 'polymorph':
			return emitBranchTemplate(node, ctxK);
		case 'supertype':
		case 'pattern':
		case 'token':
		case 'enum':
			return undefined;
		case 'list':
			return emitBranchTemplate(node, ctxK);
		default: {
			const _exhaustive: never = node;
			throw new Error(`emitOne: unhandled modelType ${(_exhaustive as AssembledNode).modelType}`);
		}
	}
}

export function emitBranchTemplate(
	node: AssembledBranch | AssembledEnvelope | AssembledPolymorph | AssembledList,
	ctx: EmitCtx
): Body {
	const ctxWithSlots: EmitCtx = { ...ctx, ownerSlots: ownerSlotsFor(node) };
	return emitRule(ctx.rules[node.kind] ?? node.renderRule, ctxWithSlots);
}

interface SeqBoundaryClassification {
	readonly resolution: 'static-glued' | 'static-spaced' | 'runtime-varying';
}

const STATIC_GLUED: SeqBoundaryClassification = { resolution: 'static-glued' };
const STATIC_SPACED: SeqBoundaryClassification = { resolution: 'static-spaced' };
const RUNTIME_VARYING: SeqBoundaryClassification = { resolution: 'runtime-varying' };

function classifySeqBoundary(
	l: string,
	r: string,
	leftRule: RenderRule,
	rightRule: RenderRule,
	ctx: EmitCtx
): SeqBoundaryClassification {
	if (l === MARKER_EDGE || r === MARKER_EDGE) return STATIC_GLUED;
	const partEdge = (rule: RenderRule, side: 'starts' | 'ends', c: string): SeamEdgeClass => {
		if (c !== DYNAMIC_EDGE) return ctx.isWordChar(c) ? 'word' : 'not-word';
		const e = renderRuleEdge(rule, side, ctx, new Set());
		return e === 'empty' ? 'varies' : e;
	};
	if (l === DYNAMIC_EDGE || r === DYNAMIC_EDGE) {
		const leftE = partEdge(leftRule, 'ends', l);
		const rightE = partEdge(rightRule, 'starts', r);
		if (leftE === 'varies' || rightE === 'varies') return RUNTIME_VARYING;
		if (seamNeedsSpace(leftE, rightE)) return STATIC_SPACED;
		if (ctx.mergePairClassCombos?.has(`${leftE}\0${rightE}`)) return RUNTIME_VARYING;
		return STATIC_GLUED;
	}
	return STATIC_SPACED;
}

function joinStaticSeam(body: Body, segment: Body, spaced: boolean, seams: Body = EMPTY): Body {
	if (spaced) return concat(body, seams.length > 0 ? seams : SPACE, segment);
	return concat(body, isExpression(segment) ? ADJACENT : EMPTY, seams, segment);
}

export function emitRule(rule: RenderRule, ctx: EmitCtx): Body {
	const flanks = flanksOf(rule);
	if (flanks !== undefined) return emitRule(flanks.inner, ctx);
	switch (rule.type) {
		case STRING: {
			const stringFieldName = (rule as { fieldName?: string }).fieldName;
			if (rule.nonterminal === true && stringFieldName !== undefined) {
				return emitScalarSlot(stringFieldName.toLowerCase());
			}
			if ((rule as { multiplicity?: Multiplicity }).multiplicity === 'optional') {
				return EMPTY;
			}
			return literalBody(rule.value);
		}

		case PATTERN: {
			const slot = lookupSlot(rule, ctx);
			if (slot !== undefined) return emitSlotReference(rule, slot, ctx);
			const patternFieldName = (rule as { fieldName?: string }).fieldName;
			if (patternFieldName !== undefined) return emitFieldNameSlot(patternFieldName.toLowerCase(), rule, ctx);
			const ownerSlotNames = ctx.ownerSlots ? Object.keys(ctx.ownerSlots) : [];
			if (ownerSlotNames.length === 1) {
				return emitSlotReference(rule, ctx.ownerSlots![ownerSlotNames[0]!]!, ctx);
			}
			throw new Error(
				`emitRule: PATTERN with no field name and no lookupSlot hit for kind '${ctx.currentKind ?? '(unknown)'}' — ` +
					`owner has ${ownerSlotNames.length} registered slot(s) [${ownerSlotNames.join(', ')}], not exactly ` +
					`one, so there is no unambiguous slot to read. Extend lookupSlot's fallbacks for this shape instead ` +
					`of reaching for a hardcoded placeholder name.`
			);
		}

		case SEQ: {
			const parts: Body[] = [];
			const partRules: RenderRule[] = [];
			const partIndices: number[] = [];
			rule.members.forEach((m, i) => {
				const part = isSeamChoice(m) ? seam(seamPartOf(m).fieldName) : emitRule(m, ctx);
				if (part.length === 0) return;
				parts.push(part);
				partRules.push(m);
				partIndices.push(i);
			});
			if (parts.length === 0) return EMPTY;
			const ORIGIN_RANK: Record<SeamOrigin, number> = { preference: 4, 'token-default': 3, 'word-default': 2, cascade: 1, fallback: 0 };
			const ARM_RANK: Record<string, number> = { indent: 3, dedent: 3, newline: 2, blankline: 2, tight: 1, space: 0 };
			const seamChoiceBetween = (
				leftPartIdx: number,
				rightPartIdx: number
			): { readonly origin: SeamOrigin; readonly arm: WhitespaceArm | undefined; readonly label: string | undefined } => {
				const from = partIndices[leftPartIdx]! + 1;
				const to = partIndices[rightPartIdx]!;
				let bestOrigin: SeamOrigin = 'fallback';
				let bestArm: WhitespaceArm | undefined;
				let bestLabel: string | undefined;
				let bestArmRank = -1;
				for (let i = from; i < to; i++) {
					const member = rule.members[i]!;
					if (!isSeamChoice(member)) continue;
					const resolved = seamChoiceDefault(member);
					if (resolved === undefined) continue;
					const origin = resolved.origin ?? 'fallback';
					if (ORIGIN_RANK[origin] > ORIGIN_RANK[bestOrigin]) bestOrigin = origin;
					const rank = ARM_RANK[resolved.arm] ?? 0;
					if (rank > bestArmRank) {
						bestArmRank = rank;
						bestArm = resolved.arm;
						bestLabel = resolved.label;
					}
				}
				return { origin: bestOrigin, arm: bestArm, label: bestLabel };
			};
			const recordSeam = (l: string, r: string, resolution: SeamBoundaryRecord['resolution'], origin: SeamOrigin): void => {
				ctx.seamBoundaries?.push({ kind: ctx.currentKind ?? '(unknown)', left: l, right: r, resolution, origin });
			};
			const stampSeam = (rightPartIdx: number, resolution: 'glued' | 'spaced'): void => {
				const memberIdx = partIndices[rightPartIdx]!;
				rule.members[memberIdx] = { ...rule.members[memberIdx]!, staticSeamBefore: resolution };
			};
			const isSeam = (b: Body): boolean => b.every((n) => n.kind === 'seam');
			const leadingSeams = (b: Body): number => b.findIndex((n) => n.kind !== 'seam');
			const trailingSeams = (b: Body): number => b.length - [...b].reverse().findIndex((n) => n.kind !== 'seam');
			const joinParts = (segments: Body[], firstIdx: number): Body => {
				let body: Body | undefined;
				let seams: Body = EMPTY;
				let lastRealPartIdx = -1;
				for (let i = 0; i < segments.length; i++) {
					const whole = segments[i]!;
					if (isSeam(whole)) {
						seams = concat(seams, whole);
						continue;
					}
					const rightPartIdx = firstIdx + i;
					if (body === undefined) {
						body = concat(seams, whole);
						seams = EMPTY;
						lastRealPartIdx = rightPartIdx;
						continue;
					}
					const lead = leadingSeams(whole);
					const segment = whole.slice(lead);
					const cut = trailingSeams(body);
					seams = concat(body.slice(cut), seams, whole.slice(0, lead));
					body = body.slice(0, cut);
					const l = edgeChar(body, 'ends');
					const r = edgeChar(segment, 'starts');
					const stamped = rule.members[partIndices[rightPartIdx]!]!.staticSeamBefore;
					if (stamped !== undefined) {
						const spaced = stamped === 'spaced';
						recordSeam(l, r, spaced ? 'static-spaced' : 'static-glued', seamChoiceBetween(lastRealPartIdx, rightPartIdx).origin);
						body = joinStaticSeam(body, segment, spaced, seams);
						seams = EMPTY;
						lastRealPartIdx = rightPartIdx;
						continue;
					}
					const leftRule = partRules[lastRealPartIdx]!;
					const rightRule = partRules[rightPartIdx]!;
					const classification = classifySeqBoundary(l, r, leftRule, rightRule, ctx);
					const governing = seamChoiceBetween(lastRealPartIdx, rightPartIdx);
					if (classification.resolution === 'runtime-varying') {
						recordSeam(l, r, 'runtime-varying', governing.origin);
						body = concat(body, seams, segment);
						seams = EMPTY;
						lastRealPartIdx = rightPartIdx;
						continue;
					}
					let spaced = classification.resolution !== 'static-glued';
					if (governing.arm !== undefined) {
						spaced = governing.arm === 'space';
						if (!spaced && ctx.isWordChar(l) && ctx.isWordChar(r)) {
							ctx.diagnostics?.fail({
								code: 'seam-word-hazard',
								message: `${ctx.currentKind ?? '(unknown)'}: '${governing.label}' declares '${governing.arm}' between two word characters ('${l}', '${r}') — gluing them would change what they lex as`,
								details: { kind: ctx.currentKind, address: governing.label, arm: governing.arm, left: l, right: r }
							});
							spaced = true;
						}
					}
					recordSeam(l, r, spaced ? 'static-spaced' : 'static-glued', governing.origin);
					stampSeam(rightPartIdx, spaced ? 'spaced' : 'glued');
					body = joinStaticSeam(body, segment, spaced, seams);
					seams = EMPTY;
					lastRealPartIdx = rightPartIdx;
				}
				return concat(body ?? EMPTY, seams);
			};
			const seqBody = joinParts(parts, 0);
			if ((rule as { multiplicity?: Multiplicity }).multiplicity === 'optional' && seqBody.length !== 0) {
				warnMultiSlotMultiplicityGroup(rule, ctx);
				const condKey = pickConditionalKey(rule, ctx);
				if (condKey) return gate(condKey, seqBody);
			}
			return seqBody;
		}

		case SYMBOL:
			return emitSymbol(rule, ctx);

		case CHOICE:
			return emitChoice(rule, ctx);

		case INDENT:
			return INDENT_BODY;
		case NEWLINE:
			return text('\n');
		case DEDENT:
			return DEDENT_BODY;

		case SUPERTYPE:
			return EMPTY;

		default: {
			const _exhaustive: never = rule;
			throw new Error(`emitRule: unhandled RenderRule.type ${(_exhaustive as RenderRule).type}`);
		}
	}
}

function lookupSlot(rule: RenderRule, ctx: EmitCtx): AssembledNonterminal | undefined {
	if (rule.id) {
		const byId = ctx.nodeMap.slotByRuleId.get(rule.id);
		if (byId) return byId;
	}
	let recovered: AssembledNonterminal | undefined;
	if (ctx.ownerSlots) {
		const boundaryFieldName = (rule as { fieldName?: string }).fieldName;
		if (boundaryFieldName !== undefined) {
			const byFieldName = ctx.ownerSlots[boundaryFieldName.toLowerCase()];
			if (byFieldName) {
				recovered = byFieldName;
			}
		}
		if (
			recovered === undefined &&
			rule.type === SYMBOL &&
			(rule as { fieldName?: string }).fieldName === undefined &&
			!rule.name.startsWith('_')
		) {
			const exactName = rule.name.toLowerCase();
			const byExactName = ctx.ownerSlots[exactName];
			if (byExactName) {
				recovered = byExactName;
			}
		}
		if (recovered === undefined && rule.type === SYMBOL && rule.aliasedTo !== undefined) {
			const aliasSourceName = rule.name.replace(/^_+/, '').toLowerCase();
			const byAliasSource = ctx.ownerSlots[aliasSourceName];
			if (byAliasSource) {
				recovered = byAliasSource;
			}
		}
	}
	return recovered;
}

function separatorTokenOf(rule: RenderRule): RenderRule | undefined {
	const sep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator;
	if (sep === undefined) return undefined;
	const spaced = spacedSeparatorOf(rule);
	return spaced === undefined ? (sep.value as RenderRule) : spaced.token;
}

export function separatorToString(rule: RenderRule): string | undefined {
	const token = separatorTokenOf(rule);
	if (token === undefined) return undefined;
	if (isNonterminalRuleType(token as Rule<'evaluate'>)) return undefined;
	return stringifyRule(token);
}

function isNonterminalSeparatorRule(rule: RenderRule): boolean {
	const token = separatorTokenOf(rule);
	return token !== undefined && isNonterminalRuleType(token as Rule<'evaluate'>);
}

function hasFlankSignal(rule: RenderRule, slot?: AssembledNonterminal): boolean {
	const sep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator;
	if (sep?.trailing !== undefined || sep?.leading !== undefined) return true;
	if (slot === undefined) return false;
	const multiVal = slot.values.find((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');
	if (multiVal && ((multiVal as { trailing?: boolean }).trailing === true || (multiVal as { leading?: boolean }).leading === true)) {
		return true;
	}
	return slot.hasTrailingDelimiter || slot.hasLeadingDelimiter;
}

function staticListInterior(
	slot: AssembledNonterminal,
	sep: string,
	ctx: EmitCtx
): 'runtime-derivable' | 'runtime-varying' {
	let verdict: 'runtime-derivable' | 'runtime-varying' = 'runtime-varying';
	if (sep !== '') {
		const first = sep[0]!;
		const last = sep[sep.length - 1]!;
		const blocked =
			!ctx.isWordChar(first) &&
			!ctx.isWordChar(last) &&
			ctx.mergePairRightChars?.has(first) === false &&
			ctx.mergePairLeftChars?.has(last) === false;
		verdict = blocked ? 'runtime-derivable' : 'runtime-varying';
	} else {
		const edgeCtx = {
			nodes: ctx.nodeMap.nodes,
			normalizedRules: ctx.nodeMap.normalizedRules,
			isWordChar: ctx.isWordChar
		};
		const ends = new Set<string>();
		const starts = new Set<string>();
		let known = true;
		for (const v of slot.values) {
			if (isTerminalValue(v)) {
				if (v.value === '') {
					known = false;
					break;
				}
				ends.add(v.value[v.value.length - 1]!);
				starts.add(v.value[0]!);
				continue;
			}
			const kind = storageKindOfValue(v);
			const sets = kind === undefined ? {} : edgeCharSetsOfKind(kind, edgeCtx);
			if (sets.starts === undefined || sets.ends === undefined) {
				known = false;
				break;
			}
			for (const c of sets.ends) ends.add(c);
			for (const c of sets.starts) starts.add(c);
		}
		if (known && ends.size > 0 && starts.size > 0) {
			let seams = 0;
			for (const l of ends) {
				for (const r of starts) {
					const seam = (ctx.isWordChar(l) && ctx.isWordChar(r)) || (l !== r && ctx.isLiteralMergePair(l, r));
					if (seam) seams++;
				}
			}
			const combos = ends.size * starts.size;
			verdict = seams === combos || seams === 0 ? 'runtime-derivable' : 'runtime-varying';
		}
	}
	return verdict;
}

function emitListSlot(slotName: string, rule: RenderRule, slot?: AssembledNonterminal, ctx?: EmitCtx): Body {
	const allImmediate =
		slot !== undefined &&
		slot.values.length > 0 &&
		slot.values.every((v) => isTerminalValue(v) && v.immediate === true);
	const ruleSep = separatorToString(rule);
	const slotValueSep: string | undefined =
		ruleSep === undefined && slot !== undefined
			? slot.values.find(
					(v): v is NodeOrTerminal & { separator: string } =>
						(v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray') &&
						typeof (v as { separator?: string }).separator === 'string'
				)?.separator
			: undefined;
	const sep = allImmediate ? '' : (ruleSep ?? slotValueSep ?? '');
	if (!hasFlankSignal(rule, slot) && !allImmediate && !isNonterminalSeparatorRule(rule) && slot !== undefined && ctx !== undefined) {
		ctx.seamBoundaries?.push({
			kind: ctx.currentKind ?? '(unknown)',
			left: '·',
			right: '·',
			resolution: staticListInterior(slot, sep, ctx),
			origin: 'fallback'
		});
	}
	return slotRef(slotName);
}

function emitScalarSlot(slotName: string): Body {
	return slotRef(slotName);
}

function emitSlotReference(rule: RenderRule, slot: AssembledNonterminal, ctx: EmitCtx): Body {
	const slotName = (slot.storageName.replace(/^_+/, '') || 'children').toLowerCase();
	if (ctx.emittedSlotNames.has(slotName)) return EMPTY;
	ctx.emittedSlotNames.add(slotName);
	const mult = (rule as { multiplicity?: string }).multiplicity;
	if (mult === 'array' || mult === 'nonEmptyArray' || isMultiple(slot)) {
		return emitListSlot(slotName, rule, slot, ctx);
	}
	if (mult === 'optional' || !isRequired(slot)) {
		return gate(slotName, emitScalarSlot(slotName));
	}
	return emitScalarSlot(slotName);
}

function emitFieldNameSlot(slotName: string, rule: RenderRule, ctx: EmitCtx): Body {
	if (ctx.emittedSlotNames.has(slotName)) return EMPTY;
	ctx.emittedSlotNames.add(slotName);
	const mult = (rule as { multiplicity?: string }).multiplicity;
	if (mult === 'array' || mult === 'nonEmptyArray') {
		return emitListSlot(slotName, rule);
	}
	if (mult === 'optional') {
		return gate(slotName, emitScalarSlot(slotName));
	}
	return emitScalarSlot(slotName);
}

function emitSymbol(rule: Extract<RenderRule, { type: 'SYMBOL' }>, ctx: EmitCtx): Body {
	const symbolFieldName = (rule as { fieldName?: string }).fieldName;
	if (rule.literal !== undefined && symbolFieldName === undefined) {
		return literalBody(rule.literal);
	}
	if (rule.nonterminal === false) {
		const fixed = fixedTextOfKind(ctx.nodeMap.nodes.get(rule.name)) ?? collectFixedLiteral(ctx.rules[rule.name]!);
		if (fixed === undefined)
			throw new Error(`emitSymbol: '${rule.name}' is nonterminal: false but renders no fixed text`);
		return literalBody(fixed);
	}

	const isInlineableHiddenHelper =
		rule.type === SYMBOL &&
		rule.inline === true &&
		(() => {
			const target = ctx.nodeMap.nodes.get(rule.name);
			return (
				target !== undefined &&
				'renderRule' in target &&
				target.renderRule !== undefined &&
				target.renderRule.type !== CHOICE
			);
		})();

	if (symbolFieldName !== undefined && !isInlineableHiddenHelper) {
		const slot = lookupSlot(rule, ctx);
		if (slot) {
			return emitSlotReference(rule, slot, ctx);
		}
		return emitFieldNameSlot(symbolFieldName.toLowerCase(), rule, ctx);
	}

	const slot = lookupSlot(rule, ctx);
	if (slot && !isInlineableHiddenHelper && !(slot.isUnnamed && rule.type === SYMBOL && rule.inline === true)) {
		return emitSlotReference(rule, slot, ctx);
	}
	if (rule.type === SYMBOL && rule.inline === true) {
		const targetNode = ctx.nodeMap.nodes.get(rule.name);
		if (targetNode && 'renderRule' in targetNode && targetNode.renderRule) {
			if (ctx.visitingHelpers.has(rule.name)) {
				const slotName = (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
				return emitScalarSlot(slotName);
			}
			ctx.visitingHelpers.add(rule.name);
			try {
				const helperRenderRule = ctx.rules[rule.name] ?? (targetNode as { renderRule: RenderRule }).renderRule;
				const helperCtx: EmitCtx = {
					...ctx,
					ownerSlots: ownerSlotsFor(targetNode)
				};
				const helperBody = emitRule(helperRenderRule, helperCtx);
				const multiplicity = (rule as { multiplicity?: Multiplicity }).multiplicity;
				if (multiplicity === 'array' || multiplicity === 'nonEmptyArray') {
					const listName = slot
						? (slot.storageName.replace(/^_+/, '') || 'children').toLowerCase()
						: (pickConditionalKey(helperRenderRule, helperCtx) ??
							(rule.name.replace(/^_+/, '') || 'children').toLowerCase());
					return emitListSlot(listName, rule, slot, helperCtx);
				}
				if (multiplicity === 'optional' && helperBody.length !== 0) {
					const symbolFieldKey = symbolFieldName?.toLowerCase();
					const addressableFieldKey =
						symbolFieldKey !== undefined &&
						(ctx.ownerSlots === undefined || ctx.ownerSlots[symbolFieldKey] !== undefined)
							? symbolFieldKey
							: undefined;
					const condKey =
						addressableFieldKey ??
						pickConditionalKey(helperRenderRule, helperCtx) ??
						(rule.name.replace(/^_+/, '') || 'children').toLowerCase();
					return gate(condKey, helperBody);
				}
				return helperBody;
			} finally {
				ctx.visitingHelpers.delete(rule.name);
			}
		}
	}
	if (rule.type === SYMBOL && rule.inline === true && ctx.rules[rule.name]) {
		if (ctx.visitingHelpers.has(rule.name)) {
			const slotName = (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
			return emitScalarSlot(slotName);
		}
		ctx.visitingHelpers.add(rule.name);
		try {
			const target = ctx.rules[rule.name]!;
			const helperBody = emitRule(target, ctx);
			const multiplicity = (rule as { multiplicity?: Multiplicity }).multiplicity;
			if (multiplicity === 'array' || multiplicity === 'nonEmptyArray') {
				const listName = slot
					? (slot.storageName.replace(/^_+/, '') || 'children').toLowerCase()
					: (pickConditionalKey(target, ctx) ?? (rule.name.replace(/^_+/, '') || 'children').toLowerCase());
				return emitListSlot(listName, rule, slot, ctx);
			}
			if (multiplicity === 'optional' && helperBody.length !== 0) {
				const condKey = pickConditionalKey(target, ctx) ?? (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
				return gate(condKey, helperBody);
			}
			return helperBody;
		} finally {
			ctx.visitingHelpers.delete(rule.name);
		}
	}
	const slotName = (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
	return emitScalarSlot(slotName);
}

const warnedMultiSlotGroups = new Set<string>();
function warnMultiSlotMultiplicityGroup(rule: Extract<RenderRule, { type: 'SEQ' }>, ctx: EmitCtx): void {
	const keys = new Set<string>();
	let hasUnitMandatoryKey = false;
	for (const m of rule.members) {
		const k = pickConditionalKey(m, ctx);
		if (!k) continue;
		keys.add(k);
		const memberMult = (m as { multiplicity?: Multiplicity }).multiplicity;
		if (memberMult !== 'optional' && memberMult !== 'array') hasUnitMandatoryKey = true;
	}
	if (keys.size <= 1) return;
	if (hasUnitMandatoryKey) return;
	const slotsLabel = [...keys].join(',');
	const tag = `${ctx.currentKind ?? '?'}:${slotsLabel}`;
	if (warnedMultiSlotGroups.has(tag)) return;
	warnedMultiSlotGroups.add(tag);
	console.warn(
		`templates: multi-slot multiplicity group (kind '${ctx.currentKind ?? '?'}', slots ${[...keys].join(', ')}) — should have been a visible group`
	);
}

function pickConditionalKey(content: RenderRule, ctx: EmitCtx): string | undefined {
	if (isSeamChoice(content)) return undefined;
	const contentFieldName = (content as { fieldName?: string }).fieldName;
	if (contentFieldName !== undefined) {
		const key = contentFieldName.toLowerCase();
		if (ctx.ownerSlots === undefined || ctx.ownerSlots[key] !== undefined) return key;
	}
	if (content.type === SEQ) {
		let fallback: string | undefined;
		for (const m of content.members) {
			const key = pickConditionalKey(m, ctx);
			if (!key) continue;
			const memberMult = (m as { multiplicity?: Multiplicity }).multiplicity;
			if (memberMult !== 'optional' && memberMult !== 'array') return key;
			fallback ??= key;
		}
		return fallback;
	}
	if (content.type === CHOICE) {
		for (const m of content.members) {
			const key = pickConditionalKey(m, ctx);
			if (key) return key;
		}
		return undefined;
	}
	if (content.type === SYMBOL) {
		const sym = content as Extract<RenderRule, { type: 'SYMBOL' }>;
		return (sym.name.replace(/^_+/, '') || 'children').toLowerCase();
	}
	return undefined;
}

function commonTrailingTail(bodies: readonly Body[]): Body {
	if (bodies.length < 2) return EMPTY;
	const first = bodies[0]!;
	let n = first.length;
	for (let i = 1; i < bodies.length; i++) {
		const b = bodies[i]!;
		let k = 0;
		while (k < n && k < b.length && equalNodes(first[first.length - 1 - k]!, b[b.length - 1 - k]!)) k++;
		n = k;
		if (n === 0) return EMPTY;
	}
	const suffix = first.slice(first.length - n);
	const p = suffix.findIndex(opensAsTag);
	return p === -1 ? EMPTY : suffix.slice(p);
}

function scanArmBody(body: Body): {
	key: string | undefined;
	needsGate: boolean;
	discriminatorKey: string | undefined;
} {
	let depth0Ref: string | undefined;
	let firstGated: string | undefined;
	let depth0Payload = false;
	const walk = (nodes: Body, depth: number): void => {
		for (const node of nodes) {
			switch (node.kind) {
				case 'text':
					if (depth === 0 && node.text.trim() !== '') depth0Payload = true;
					break;
				case 'adjacent':
				case 'indent':
				case 'dedent':
				case 'tokenSeam':
					if (depth === 0) depth0Payload = true;
					break;
				case 'space':
				case 'seam':
					break;
				case 'slot':
					if (depth === 0) {
						depth0Ref ??= node.name;
						depth0Payload = true;
					} else {
						firstGated ??= node.name;
					}
					break;
				case 'if':
					for (const arm of node.arms) walk(arm.body, depth + 1);
					if (node.fallback !== undefined) walk(node.fallback, depth + 1);
					break;
				default: {
					const _exhaustive: never = node;
					throw new Error(`scanArmBody: unhandled node ${(_exhaustive as Body[number]).kind}`);
				}
			}
		}
	};
	walk(body, 0);
	return { key: depth0Ref ?? firstGated, needsGate: depth0Payload, discriminatorKey: firstGated };
}

function restoreEmittedSlotNames(ctx: EmitCtx, snapshot: ReadonlySet<string>): void {
	ctx.emittedSlotNames.clear();
	for (const s of snapshot) ctx.emittedSlotNames.add(s);
}

/** The kinds a choice arm admits into the slot it carries: the names of its
 *  symbol members, a supertype standing for its members. `undefined` when the
 *  arm carries no symbol or more than one, since a literal cannot be gated on
 *  two slots at once. */
function armSlotKinds(arm: RenderRule): readonly string[] | undefined {
	const kinds: string[] = [];
	let carriers = 0;
	const walk = (rule: RenderRule): void => {
		const flanks = flanksOf(rule);
		if (flanks !== undefined) {
			walk(flanks.inner);
			return;
		}
		if (isSeamChoice(rule)) return;
		switch (rule.type) {
			case SYMBOL:
				carriers += 1;
				if (!kinds.includes(rule.name)) kinds.push(rule.name);
				return;
			case PATTERN:
				carriers += 1;
				return;
			case CHOICE: {
				const before = carriers;
				let most = 0;
				for (const member of rule.members) {
					carriers = before;
					walk(member);
					most = Math.max(most, carriers - before);
				}
				carriers = before + most;
				return;
			}
			case SEQ:
				for (const member of rule.members) walk(member);
				return;
			default:
				return;
		}
	};
	walk(arm);
	return carriers === 1 && kinds.length > 0 ? kinds : undefined;
}

/** A choice's field name pushed down onto the members that carry a slot, so
 *  each arm emits as the parser tags it: the symbol takes the field, a
 *  literal beside it stays the arm's own text. */
function withFieldOnCarriers(rule: RenderRule, fieldName: string): RenderRule {
	if (isSeamChoice(rule)) return rule;
	switch (rule.type) {
		case SYMBOL:
		case PATTERN:
			return (rule as { fieldName?: string }).fieldName === undefined
				? ({ ...rule, fieldName } as RenderRule)
				: rule;
		case SEQ:
		case CHOICE:
			return { ...rule, members: rule.members.map((m) => withFieldOnCarriers(m, fieldName)) } as RenderRule;
		default:
			return rule;
	}
}

const isLiteralOnly = (body: Body): boolean =>
	body.every((n) => n.kind === 'text' || n.kind === 'space' || n.kind === 'seam' || n.kind === 'adjacent');

/** The arms of a choice that share one slot and differ only by the literal
 *  they put beside it, folded into the slot once and each literal gated on
 *  the kinds its arm admits. `for (init; cond; inc)`: the initializer's
 *  expression arm ends in `;` and its declaration arms do not, so the `;` is
 *  written when the initializer is an expression. Nothing else about the
 *  choice qualifies: an arm without a slot, an arm with two, or arms whose
 *  text before the slot differs leave the choice to the other resolutions. */
function emitKindGatedLiterals(
	rule: Extract<RenderRule, { type: 'CHOICE' }>,
	fieldName: string | undefined,
	ctx: EmitCtx
): Body | undefined {
	if (rule.members.length < 2) return undefined;
	if (!rule.members.some((m) => m.type === SEQ && m.members.some((x) => x.type === STRING))) return undefined;
	const trace = process.env.SITTIR_TRACE_GATED !== undefined && ctx.currentKind === process.env.SITTIR_TRACE_GATED;
	const bail = (why: string): undefined => {
		if (trace) process.stderr.write(`[gated] ${ctx.currentKind} field=${fieldName}: ${why}\n`);
		return undefined;
	};
	interface Arm {
		/** The body up to and through the slot; `undefined` for an arm that is
		 *  a literal kind alone, which the slot renders as itself. */
		prefix: Body | undefined;
		residual: Body;
		kinds: readonly string[];
	}
	const arms: Arm[] = [];
	let key: string | undefined;
	const beforeSlots = new Set(ctx.emittedSlotNames);
	for (const member of rule.members) {
		const arm = fieldName === undefined ? member : withFieldOnCarriers(member, fieldName);
		const kinds = armSlotKinds(arm);
		if (kinds === undefined) return bail(`arm carries no single slot: ${JSON.stringify(arm).slice(0, 160)}`);
		const body = emitRule(arm, ctx);
		restoreEmittedSlotNames(ctx, beforeSlots);
		const at = body.findIndex((n) => n.kind === 'slot');
		if (at < 0) {
			if (kinds.length !== 1 || !isLiteralOnly(body)) return bail(`slotless arm not a lone literal kind: ${JSON.stringify(body).slice(0, 160)}`);
			arms.push({ prefix: undefined, residual: EMPTY, kinds });
			continue;
		}
		if (body.slice(0, at).some((n) => n.kind === 'if')) return bail('gate before the slot');
		const slotName = (body[at] as { name: string }).name;
		if (key !== undefined && slotName !== key) return bail(`slot ${slotName} differs from ${key}`);
		key = slotName;
		const residual = body.slice(at + 1);
		if (!isLiteralOnly(residual)) return bail(`residual not literal-only: ${JSON.stringify(residual).slice(0, 160)}`);
		arms.push({ prefix: body.slice(0, at + 1), residual, kinds });
	}
	if (key === undefined) return bail('no arm carries the slot');
	const prefix = arms.find((a) => a.prefix !== undefined)!.prefix!;
	if (!arms.every((a) => a.prefix === undefined || equalBodies(a.prefix, prefix))) return bail(`prefixes differ: ${JSON.stringify(arms.map((a) => a.prefix)).slice(0, 300)}`);
	const gated: { kinds: string[]; body: Body }[] = [];
	for (const arm of arms) {
		if (arm.residual.length === 0) continue;
		const same = gated.find((g) => equalBodies(g.body, arm.residual));
		if (same) {
			for (const k of arm.kinds) if (!same.kinds.includes(k)) same.kinds.push(k);
		} else {
			gated.push({ kinds: [...arm.kinds], body: arm.residual });
		}
	}
	if (gated.length === 0) return bail('no arm has a residual literal');
	ctx.emittedSlotNames.add(key);
	return concat(
		prefix,
		branches(
			gated.map((g) => ({ test: key!, kinds: g.kinds, body: g.body })),
			undefined
		)
	);
}

function emitChoice(rule: Extract<RenderRule, { type: 'CHOICE' }>, ctx: EmitCtx): Body {
	{
		const gated = emitKindGatedLiterals(rule, (rule as { fieldName?: string }).fieldName, ctx);
		if (gated !== undefined) return gated;
	}
	const slot = lookupSlot(rule, ctx);
	if (slot) {
		const choiceRuleId = (rule as { id?: string }).id;
		const unionBacked =
			(rule as { fieldName?: string }).fieldName === undefined &&
			slot.isUnnamed &&
			choiceRuleId !== undefined &&
			slot.sourceRuleIds.includes(choiceRuleId);
		if (unionBacked) {
			const unionName = (slot.storageName.replace(/^_+/, '') || 'children').toLowerCase();
			const blockByKey = new Map<string, Body>();
			const arraySlotDeltaByKey = new Map<string, string[]>();
			for (const arm of rule.members) {
				const beforeSlots = new Set(ctx.emittedSlotNames);
				const body = emitRule(arm as RenderRule, ctx);
				const delta = [...ctx.emittedSlotNames].filter((s) => !beforeSlots.has(s));
				restoreEmittedSlotNames(ctx, beforeSlots);
				if (body.length === 0) continue;
				const { key, needsGate } = scanArmBody(body);
				if (key === undefined || key === unionName || ctx.ownerSlots?.[key] === undefined) continue;
				const block = needsGate ? gate(key, body) : body;
				const prev = blockByKey.get(key);
				if (prev === undefined || weight(block) > weight(prev)) {
					blockByKey.set(key, block);
					arraySlotDeltaByKey.set(key, delta);
				}
			}
			for (const delta of arraySlotDeltaByKey.values()) {
				for (const s of delta) ctx.emittedSlotNames.add(s);
			}
			return concat(...blockByKey.values(), emitSlotReference(rule, slot, ctx));
		}
		return emitSlotReference(rule, slot, ctx);
	}
	const choiceFieldName = (rule as { fieldName?: string }).fieldName;
	if (choiceFieldName !== undefined) {
		return emitFieldNameSlot(choiceFieldName.toLowerCase(), rule, ctx);
	}
	if (rule.id === '__synthetic_exclusive_choice__') {
		return concat(...rule.members.map((m) => emitRule(m, ctx)));
	}
	{
		interface ArmInfo {
			key: string;
			discriminatorKey: string | undefined;
			body: Body;
			needsGate: boolean;
			delta: string[];
		}
		const armInfos: ArmInfo[] = [];
		let ungateableArm = false;
		let literalFallback: Body | undefined;
		let literalFallbackAmbiguous = false;
		for (const arm of rule.members) {
			const beforeSlots = new Set(ctx.emittedSlotNames);
			const body = emitRule(arm as RenderRule, ctx);
			const delta = [...ctx.emittedSlotNames].filter((s) => !beforeSlots.has(s));
			restoreEmittedSlotNames(ctx, beforeSlots);
			if (body.length === 0) continue;
			const { key, needsGate, discriminatorKey } = scanArmBody(body);
			if (key === undefined || ctx.ownerSlots?.[key] === undefined) {
				if (isPlainText(body)) {
					if (literalFallback === undefined) literalFallback = body;
					else if (!equalBodies(literalFallback, body)) literalFallbackAmbiguous = true;
					continue;
				}
				ungateableArm = true;
				break;
			}
			armInfos.push({ key, discriminatorKey, body, needsGate, delta });
		}
		if (process.env.SITTIR_DEBUG_FLATCHOICE) {
			process.stderr.write(
				`[flatchoice] id=${String((rule as { id?: string }).id)} ungateable=${ungateableArm} litFallback=${JSON.stringify(literalFallback)} arms=${armInfos.length} bodies=${JSON.stringify(armInfos.map((i) => i.body))}\n`
			);
		}
		if (!ungateableArm && literalFallback === undefined && armInfos.length >= 2) {
			const unitLists = armInfos.map((i) => selfGatedSlotUnits(i.body));
			if (unitLists.every((u) => u !== null)) {
				const nameCounts = new Map<string, number>();
				for (const units of unitLists as SlotUnit[][]) {
					for (const u of new Set(units.map((x) => x.name))) nameCounts.set(u, (nameCounts.get(u) ?? 0) + 1);
				}
				if ([...nameCounts.values()].some((c) => c >= 2)) {
					const lists = unitLists as SlotUnit[][];
					const flatOrder: string[] = [];
					const seen = new Set<string>();
					for (const units of lists) {
						for (const u of units) {
							if (seen.has(u.name)) continue;
							seen.add(u.name);
							flatOrder.push(u.name);
						}
					}
					const armOrders = lists.map((units) => units.map((u) => u.name));
					const isSubseq = (needle: string[], hay: string[]): boolean => {
						let i = 0;
						for (const h of hay) if (i < needle.length && needle[i] === h) i++;
						return i === needle.length;
					};
					const allProjectionsParseable = armOrders.every((arm) => {
						const armSet = new Set(arm);
						const projected = flatOrder.filter((n) => armSet.has(n));
						return armOrders.some((other) => isSubseq(projected, other));
					});
					if (allProjectionsParseable) {
						const parts: Body[] = [];
						const emitted = new Set<string>();
						for (const units of lists) {
							for (const u of units) {
								if (emitted.has(u.name)) continue;
								emitted.add(u.name);
								parts.push(u.body);
							}
						}
						for (const n of emitted) ctx.emittedSlotNames.add(n);
						return concat(...parts);
					}
				}
			}
		}
		let hoistedTail: Body = EMPTY;
		if (!ungateableArm) {
			const countByKey = new Map<string, number>();
			for (const info of armInfos) countByKey.set(info.key, (countByKey.get(info.key) ?? 0) + 1);
			const sharedTailKey =
				armInfos.length >= 2 && countByKey.size === 1 && literalFallback === undefined ? armInfos[0]!.key : undefined;
			for (const info of armInfos) {
				if (
					(countByKey.get(info.key) ?? 0) > 1 &&
					info.discriminatorKey !== undefined &&
					info.discriminatorKey !== info.key &&
					ctx.ownerSlots?.[info.discriminatorKey] !== undefined
				) {
					info.key = info.discriminatorKey;
				}
			}
			if (sharedTailKey !== undefined) {
				const tail = commonTrailingTail(armInfos.map((i) => i.body));
				if (tail.length !== 0 && refersTo(tail, sharedTailKey)) {
					hoistedTail = tail;
					for (const info of armInfos) {
						info.body = info.body.slice(0, info.body.length - tail.length);
					}
				}
			}
		}
		const blockByKey = new Map<string, Body>();
		const rawBodyByKey = new Map<string, Body | undefined>();
		const arraySlotDeltaByKey = new Map<string, string[]>();
		for (const info of armInfos) {
			if (info.body.length === 0) continue;
			const block = info.needsGate ? gate(info.key, info.body) : info.body;
			const prev = blockByKey.get(info.key);
			if (prev === undefined || weight(block) > weight(prev)) {
				blockByKey.set(info.key, block);
				rawBodyByKey.set(info.key, info.needsGate ? info.body : undefined);
				arraySlotDeltaByKey.set(info.key, info.delta);
			}
		}
		const rawBodies = [...rawBodyByKey.values()];
		if (
			!ungateableArm &&
			literalFallback !== undefined &&
			!literalFallbackAmbiguous &&
			blockByKey.size >= 1 &&
			rawBodies.every((v) => v !== undefined)
		) {
			for (const delta of arraySlotDeltaByKey.values()) {
				for (const s of delta) ctx.emittedSlotNames.add(s);
			}
			return branches(
				[...blockByKey.keys()].map((key) => ({ test: key, body: rawBodyByKey.get(key)! })),
				literalFallback
			);
		}
		if (!ungateableArm && (blockByKey.size >= 2 || (hoistedTail.length !== 0 && blockByKey.size >= 1))) {
			for (const delta of arraySlotDeltaByKey.values()) {
				for (const s of delta) ctx.emittedSlotNames.add(s);
			}
			return concat(...blockByKey.values(), hoistedTail);
		}
	}
	for (const member of rule.members) {
		const body = emitRule(member, ctx);
		if (body.length !== 0) return body;
	}
	return EMPTY;
}

interface SlotUnit {
	readonly name: string;
	readonly body: Body;
}

function selfGatedSlotUnits(body: Body): SlotUnit[] | null {
	const units: SlotUnit[] = [];
	for (const node of body) {
		if (node.kind === 'slot') {
			units.push({ name: node.name, body: gate(node.name, slotRef(node.name)) });
			continue;
		}
		if (node.kind === 'if' && node.arms.length === 1 && node.fallback === undefined) {
			const arm = node.arms[0]!;
			const only = arm.body.length === 1 ? arm.body[0] : undefined;
			if (only?.kind === 'slot' && only.name === arm.test) {
				units.push({ name: arm.test, body: [node] });
				continue;
			}
		}
		return null;
	}
	return units.length > 0 ? units : null;
}

export function assertNoDuplicateSlots(node: AssembledNode, body: Body): void {
	const duplicated = duplicateSlots(body);
	if (duplicated.length > 0) {
		throw new Error(
			`TemplateEmitter duplicate-slot violation on kind '${node.kind}' (${node.modelType}): ` +
				`slot(s) [${duplicated.join(', ')}] appear more than once on one path of the body: ${JSON.stringify(body)}`
		);
	}
}

function assertSlotPreservation(node: AssembledNode, body: Body): void {
	const slots = node.slots;
	if (slots.length === 0) return;
	const missing: string[] = [];
	const seen = new Set<string>();
	for (const slot of slots) {
		if (kindsOf(slot).length === 0) continue;
		if (slot.values.length > 0 && slot.values.every((v) => v.multiplicity !== 'single')) continue;
		const slotKinds = kindsOf(slot);
		if (slotKinds.length > 0 && slotKinds.every((k) => mentions(body, k))) continue;
		if (slot.isUnnamed && slotKinds.length > 0 && slotKinds.every((k) => k.startsWith('_'))) continue;
		const name = slot.storageName;
		if (seen.has(name)) continue;
		seen.add(name);
		if (!mentions(body, name)) {
			missing.push(name);
		}
	}
	if (missing.length > 0) {
		const slotDetails = missing.map((m) => {
			const s = slots.find((sl) => sl.storageName === m);
			const named = s?.isUnnamed ? 'positional' : 'named';
			return s
				? `${m}(${named},mult=${s.values.map((v) => v.multiplicity).join('|')},kinds=${kindsOf(s).join(',')})`
				: m;
		});
		throw new Error(
			`TemplateEmitter slot-preservation violation on kind '${node.kind}' (${node.modelType}): ` +
				`missing slot(s) [${slotDetails.join(', ')}] in body: ${JSON.stringify(body)}`
		);
	}
}

export function runTemplateEmitter(config: EmitTemplatesConfig): EmittedTemplates {
	const te = new TemplateEmitter(config);
	for (const [, node] of config.nodeMap.nodes) {
		const templateEmission = classifyTemplateEmission(node);
		if (templateEmission !== 'emit') continue;

		switch (node.modelType) {
			case 'pattern':
			case 'enum':
				te.emitLeaf(node);
				break;
			case 'token':
				if (isWordOrVisibleTextLeaf(node)) te.emitLeaf(node);
				break;
			case 'branch':
			case 'envelope':
				te.emitBranch(node);
				break;
			case 'polymorph':
				te.emitBranch(node);
				break;
			case 'supertype':
				break;
			case 'list':
				te.emitBranch(node);
				break;
			default: {
				const _exhaustive: never = node;
				throw new Error(`runTemplateEmitter: unhandled modelType ${(_exhaustive as AssembledNode).modelType}`);
			}
		}
	}
	return te.finalize();
}

export function stampStaticSpacing(nodeMap: NodeMap, grammar: string, renderRules: RenderRules | undefined): void {
	runTemplateEmitter({ grammar, nodeMap, renderRules });
}
