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
import type { Rule, RuleBase, RenderRule, Multiplicity } from '../types/rule.ts';
import type { CodegenEmitter } from './emitter.ts';
import { classifyTemplateEmission, literalMergePairs, wordCharAsciiTable } from './shared.ts';
import { getTransportProjection } from './transport-projection-cache.ts';
import { flanksOf, spacedSeparatorOf, type RenderRules } from '../compiler/model/render-rules.ts';
import {
	ADJACENT,
	EMPTY,
	SPACE,
	branches,
	concat,
	edgeChar,
	equalBodies,
	equalNodes,
	gate,
	indented,
	isExpression,
	isPlainText,
	mentions,
	opensAsTag,
	refersTo,
	slot as slotRef,
	text,
	weight,
	whitespace,
	type Body
} from './render-body.ts';

export interface EmitTemplatesConfig {
	grammar: string;
	nodeMap: NodeMap;
	renderRules?: RenderRules;
	grammarSha?: string;
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
}

export interface SeamCensusSummary {
	readonly boundaries: readonly SeamBoundaryRecord[];
	readonly staticGlued: number;
	readonly staticSpaced: number;
	readonly runtimeDerivable: number;
	readonly runtimeVarying: number;
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
}

interface SlotLookupMiss {
	readonly kind: string | undefined;
	readonly ruleType: string;
	readonly ruleId: string | undefined;
	readonly name: string | undefined;
	readonly fieldName: string | undefined;
	readonly recoveredBy: 'fieldName' | 'symbol-name' | 'alias-source' | 'none';
	readonly structural: boolean;
}
const DBG_SLOT_MISS = process.env.DBG_SLOT_MISS === '1';
const SLOT_MISS_LOG: SlotLookupMiss[] = [];

const DBG_SEAM_VARIES = process.env.DBG_SEAM_VARIES === '1';
const SEAM_VARIES_TALLY = new Map<string, number>();
function tallySeamVariesReason(reason: string): void {
	if (!DBG_SEAM_VARIES) return;
	SEAM_VARIES_TALLY.set(reason, (SEAM_VARIES_TALLY.get(reason) ?? 0) + 1);
}
function dumpSeamVariesTally(grammar: string): void {
	if (!DBG_SEAM_VARIES || SEAM_VARIES_TALLY.size === 0) return;
	const total = [...SEAM_VARIES_TALLY.values()].reduce((a, b) => a + b, 0);
	process.stderr.write(`\n=== seam runtime-varying reasons [${grammar}] — ${total} total ===\n`);
	for (const [reason, count] of [...SEAM_VARIES_TALLY.entries()].sort((a, b) => b[1] - a[1])) {
		process.stderr.write(`  ${count.toString().padStart(4)}  ${reason}\n`);
	}
	SEAM_VARIES_TALLY.clear();
}
function dumpSlotMissLog(grammar: string): void {
	if (!DBG_SLOT_MISS || SLOT_MISS_LOG.length === 0) return;
	const tally = { fieldName: 0, 'symbol-name': 0, 'alias-source': 0, none: 0 } as Record<string, number>;
	let structural = 0;
	for (const m of SLOT_MISS_LOG) {
		if (m.structural) structural++;
		else tally[m.recoveredBy] = (tally[m.recoveredBy] ?? 0) + 1;
	}
	const unexpected = SLOT_MISS_LOG.length - structural;
	process.stderr.write(
		`\n=== slotByRuleId MISS inventory [${grammar}] — ${SLOT_MISS_LOG.length} total: ` +
			`${structural} structural (choice with seq arms, no single slot to resolve), ${unexpected} unexpected ` +
			`(recovered fieldName=${tally.fieldName} symbol-name=${tally['symbol-name']} UNRESOLVED=${tally.none}) ===\n`
	);
	for (const m of SLOT_MISS_LOG) {
		const tag = m.structural ? 'structural ' : m.recoveredBy === 'none' ? 'UNRESOLVED ' : `recov:${m.recoveredBy} `;
		const label = m.name ? `${m.ruleType}(${m.name})` : m.ruleType;
		process.stderr.write(
			`  ${tag} kind=${m.kind ?? '?'} ${label}${m.fieldName ? ` field=${m.fieldName}` : ''} id=${m.ruleId ?? '<none>'}\n`
		);
	}
	SLOT_MISS_LOG.length = 0;
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
	readonly #config: EmitTemplatesConfig;
	readonly #wordMatcher: RegExp;
	readonly #ctx: EmitCtx;
	#bodies = new Map<string, Body>();
	readonly #seamBoundaries: SeamBoundaryRecord[] = [];

	constructor(config: EmitTemplatesConfig) {
		this.#config = config;
		this.#wordMatcher = config.nodeMap.wordMatcher ?? /\w/;
		this.#ctx = {
			nodeMap: config.nodeMap,
			wordMatcher: this.#wordMatcher,
			isWordChar: (() => {
				const table = wordCharAsciiTable(this.#wordMatcher);
				return (c: string) => (c.charCodeAt(0) < 128 ? table[c.charCodeAt(0)]! : /[\p{L}\p{N}]/u.test(c));
			})(),
			isLiteralMergePair: (() => {
				const pairs = new Set(
					literalMergePairs(getTransportProjection(config.nodeMap).literals).map(([a, b]) => a * 128 + b)
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
				for (const [a, b] of literalMergePairs(getTransportProjection(config.nodeMap).literals)) {
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
			seamBoundaries: this.#seamBoundaries
		};
	}

	emitLeaf(node: AssembledNode): void {
		this.#emitNode(node);
	}

	emitBranch(node: AssembledNode): void {
		this.#emitNode(node);
	}

	emitGroup(node: AssembledNode): void {
		this.#emitNode(node);
	}

	finalize(): EmittedTemplates {
		dumpSlotMissLog(this.#config.grammar);
		dumpSeamVariesTally(this.#config.grammar);
		const boundaries = [...this.#seamBoundaries];
		return {
			bodies: new Map(this.#bodies),
			seamCensus: {
				boundaries,
				staticGlued: boundaries.filter((b) => b.resolution === 'static-glued').length,
				staticSpaced: boundaries.filter((b) => b.resolution === 'static-spaced').length,
				runtimeDerivable: boundaries.filter((b) => b.resolution === 'runtime-derivable').length,
				runtimeVarying: boundaries.filter((b) => b.resolution === 'runtime-varying').length
			}
		};
	}

	#emitNode(node: AssembledNode): void {
		if (classifyTemplateEmission(node) !== 'emit') return;

		this.#ctx.visitingHelpers.clear();
		this.#ctx.emittedSlotNames.clear();
		const body = emitOne(node, this.#ctx);

		if (body === undefined) {
			this.#bodies.set(node.kind, EMPTY);
			return;
		}
		if (process.env['SITTIR_SLOT_PRESERVATION'] !== '0') {
			assertSlotPreservation(node, body);
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

function describeVariesReason(rule: RenderRule, side: 'starts' | 'ends', ctx: EmitCtx, visiting: Set<string>): string {
	const flanks = flanksOf(rule);
	if (flanks !== undefined) return describeVariesReason(flanks.inner, side, ctx, visiting);
	const mult = (rule as { multiplicity?: Multiplicity }).multiplicity;
	if (mult !== undefined && mult !== 'single') return `multiplicity:${mult}`;
	switch (rule.type) {
		case PATTERN:
			return side === 'ends' ? 'pattern-end-ambiguous' : 'pattern-start-varies';
		case SEQ: {
			const members = side === 'starts' ? rule.members : [...rule.members].reverse();
			for (const m of members) {
				const e = renderRuleEdge(m, side, ctx, new Set(visiting));
				if (e !== 'empty') return describeVariesReason(m, side, ctx, new Set(visiting));
			}
			return 'seq-all-empty';
		}
		case CHOICE: {
			const edges = rule.members.map((m) => renderRuleEdge(m, side, ctx, new Set(visiting)));
			return `choice-mismatch:${[...new Set(edges)].sort().join(',')}`;
		}
		case SYMBOL: {
			if (visiting.has(rule.name)) return 'symbol-cycle';
			visiting.add(rule.name);
			const node = ctx.nodeMap.nodes.get(rule.name);
			if (node !== undefined) {
				if (node.modelType === 'pattern') return side === 'ends' ? 'pattern-end-ambiguous' : 'pattern-start-varies';
				return `kind-edge-varies:${node.modelType}`;
			}
			const helper = ctx.rules[rule.name];
			return helper !== undefined ? describeVariesReason(helper, side, ctx, visiting) : 'no-helper';
		}
		default:
			return `unhandled-type:${rule.type}`;
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
	readonly leftVaries: boolean;
	readonly rightVaries: boolean;
	readonly mergePairAmbiguous: boolean;
}

const STATIC_GLUED: SeqBoundaryClassification = {
	resolution: 'static-glued',
	leftVaries: false,
	rightVaries: false,
	mergePairAmbiguous: false
};
const STATIC_SPACED: SeqBoundaryClassification = {
	resolution: 'static-spaced',
	leftVaries: false,
	rightVaries: false,
	mergePairAmbiguous: false
};

function classifySeqBoundary(
	l: string,
	r: string,
	leftRule: RenderRule,
	rightRule: RenderRule,
	ctx: EmitCtx
): SeqBoundaryClassification {
	const partEdge = (rule: RenderRule, side: 'starts' | 'ends', c: string): SeamEdgeClass => {
		if (side === 'starts' ? c !== '{' : c !== '}') return ctx.isWordChar(c) ? 'word' : 'not-word';
		const e = renderRuleEdge(rule, side, ctx, new Set());
		return e === 'empty' ? 'varies' : e;
	};
	if (l === '}' || r === '{') {
		const leftE = partEdge(leftRule, 'ends', l);
		const rightE = partEdge(rightRule, 'starts', r);
		if (leftE === 'varies' || rightE === 'varies') {
			return {
				resolution: 'runtime-varying',
				leftVaries: leftE === 'varies',
				rightVaries: rightE === 'varies',
				mergePairAmbiguous: false
			};
		}
		if (seamNeedsSpace(leftE, rightE)) return STATIC_SPACED;
		if (ctx.mergePairClassCombos?.has(`${leftE}\0${rightE}`)) {
			return { resolution: 'runtime-varying', leftVaries: false, rightVaries: false, mergePairAmbiguous: true };
		}
		return STATIC_GLUED;
	}
	const charClass = (c: string): SeamEdgeClass => (ctx.isWordChar(c) ? 'word' : 'not-word');
	const spaced = seamNeedsSpace(charClass(l), charClass(r)) || (l !== r && ctx.isLiteralMergePair(l, r));
	return spaced ? STATIC_SPACED : STATIC_GLUED;
}

function joinStaticSeam(body: Body, segment: Body, spaced: boolean): Body {
	if (spaced) return concat(body, SPACE, segment);
	return isExpression(segment) ? concat(body, ADJACENT, segment) : concat(body, segment);
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
			return text(rule.value);
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
			const indentMemberIdx = rule.members.findIndex((m) => m.type === INDENT);
			const parts: Body[] = [];
			let indentPartIdx = -1;
			const partRules: RenderRule[] = [];
			const partIndices: number[] = [];
			rule.members.forEach((m, i) => {
				const part = emitRule(m, ctx);
				if (part.length === 0) return;
				if (i === indentMemberIdx) indentPartIdx = parts.length;
				parts.push(part);
				partRules.push(m);
				partIndices.push(i);
			});
			if (parts.length === 0) return EMPTY;
			const recordSeam = (l: string, r: string, resolution: SeamBoundaryRecord['resolution']): void => {
				ctx.seamBoundaries?.push({ kind: ctx.currentKind ?? '(unknown)', left: l, right: r, resolution });
			};
			const stampSeam = (rightPartIdx: number, resolution: 'glued' | 'spaced'): void => {
				const memberIdx = partIndices[rightPartIdx]!;
				rule.members[memberIdx] = { ...rule.members[memberIdx]!, staticSeamBefore: resolution };
			};
			const joinParts = (segments: Body[], firstIdx: number): Body => {
				let body = segments[0]!;
				for (let i = 1; i < segments.length; i++) {
					const rightPartIdx = firstIdx + i;
					const stamped = rule.members[partIndices[rightPartIdx]!]!.staticSeamBefore;
					const l = edgeChar(body, 'ends');
					const r = edgeChar(segments[i]!, 'starts');
					if (stamped !== undefined) {
						const spaced = stamped === 'spaced';
						recordSeam(l, r, spaced ? 'static-spaced' : 'static-glued');
						body = joinStaticSeam(body, segments[i]!, spaced);
						continue;
					}
					const leftRule = partRules[rightPartIdx - 1]!;
					const rightRule = partRules[rightPartIdx]!;
					const classification = classifySeqBoundary(l, r, leftRule, rightRule, ctx);
					if (classification.resolution === 'runtime-varying') {
						recordSeam(l, r, 'runtime-varying');
						if (DBG_SEAM_VARIES) {
							if (classification.leftVaries)
								tallySeamVariesReason(`left:${describeVariesReason(leftRule, 'ends', ctx, new Set())}`);
							if (classification.rightVaries)
								tallySeamVariesReason(`right:${describeVariesReason(rightRule, 'starts', ctx, new Set())}`);
							if (classification.mergePairAmbiguous) tallySeamVariesReason('merge-pair-ambiguous');
						}
						body = concat(body, segments[i]!);
						continue;
					}
					recordSeam(l, r, classification.resolution);
					const isGlued = classification.resolution !== 'static-spaced';
					stampSeam(rightPartIdx, isGlued ? 'glued' : 'spaced');
					body = joinStaticSeam(body, segments[i]!, !isGlued);
				}
				return body;
			};
			let seqBody: Body;
			if (indentPartIdx !== -1 && indentPartIdx < parts.length - 1) {
				const before = joinParts(parts.slice(0, indentPartIdx + 1), 0);
				const after = joinParts(parts.slice(indentPartIdx + 1), indentPartIdx + 1);
				recordSeam(edgeChar(before, 'ends'), edgeChar(after, 'starts'), 'runtime-varying');
				tallySeamVariesReason('seq-indent-adjacent');
				seqBody = concat(before, indented(after));
			} else {
				seqBody = joinParts(parts, 0);
			}
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
		case NEWLINE:
			return whitespace('\n');
		case DEDENT:
			return EMPTY;

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
	let recoveredBy: SlotLookupMiss['recoveredBy'] = 'none';
	if (ctx.ownerSlots) {
		const boundaryFieldName = (rule as { fieldName?: string }).fieldName;
		if (boundaryFieldName !== undefined) {
			const byFieldName = ctx.ownerSlots[boundaryFieldName.toLowerCase()];
			if (byFieldName) {
				recovered = byFieldName;
				recoveredBy = 'fieldName';
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
				recoveredBy = 'symbol-name';
			}
		}
		if (recovered === undefined && rule.type === SYMBOL && rule.aliasedTo !== undefined) {
			const aliasSourceName = rule.name.replace(/^_+/, '').toLowerCase();
			const byAliasSource = ctx.ownerSlots[aliasSourceName];
			if (byAliasSource) {
				recovered = byAliasSource;
				recoveredBy = 'alias-source';
			}
		}
	}
	if (DBG_SLOT_MISS) {
		SLOT_MISS_LOG.push({
			kind: ctx.currentKind,
			ruleType: rule.type,
			ruleId: rule.id,
			name: (rule as { name?: string }).name,
			fieldName: (rule as { fieldName?: string }).fieldName,
			recoveredBy,
			structural: rule.type === CHOICE && rule.members.some((m) => m.type === SEQ)
		});
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
	let detail = '';
	if (sep !== '') {
		const first = sep[0]!;
		const last = sep[sep.length - 1]!;
		const blocked =
			!ctx.isWordChar(first) &&
			!ctx.isWordChar(last) &&
			ctx.mergePairRightChars?.has(first) === false &&
			ctx.mergePairLeftChars?.has(last) === false;
		verdict = blocked ? 'runtime-derivable' : 'runtime-varying';
		detail = `sep=${JSON.stringify(sep)}`;
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
			detail = `ends={${[...ends].join('')}} starts={${[...starts].join('')}}`;
		} else {
			detail = 'edges unknown';
		}
	}
	if (process.env['DBG_LIST_SEAM'] === '1') {
		console.error(`[list-seam] ${ctx.currentKind ?? '?'}: ${detail} -> ${verdict}`);
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
			resolution: staticListInterior(slot, sep, ctx)
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
		return text(rule.literal);
	}
	if (rule.nonterminal === false) {
		const fixed = fixedTextOfKind(ctx.nodeMap.nodes.get(rule.name)) ?? collectFixedLiteral(ctx.rules[rule.name]!);
		if (fixed === undefined)
			throw new Error(`emitSymbol: '${rule.name}' is nonterminal: false but renders no fixed text`);
		return fixed.trim() === '' ? whitespace(fixed) : text(fixed);
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
				case 'whitespace':
				case 'adjacent':
					if (depth === 0) depth0Payload = true;
					break;
				case 'space':
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
				case 'indent':
					if (depth === 0) depth0Payload = true;
					walk(node.body, depth);
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

function emitChoice(rule: Extract<RenderRule, { type: 'CHOICE' }>, ctx: EmitCtx): Body {
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
				if (node instanceof AssembledKeyword) te.emitLeaf(node);
				break;
			case 'branch':
			case 'envelope':
				if (node.hoisted) te.emitGroup(node);
				else te.emitBranch(node);
				break;
			case 'polymorph':
				if (node.hoisted) te.emitGroup(node);
				else te.emitBranch(node);
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
