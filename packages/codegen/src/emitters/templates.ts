import type { SlotBearingCompound } from '../compiler/model/node-map.ts';
import { emitShapeFailure } from '../compiler/diagnostics/emit-diagnostics.ts';
import { CHOICE, DEDENT, EOF, INDENT, NEWLINE, PATTERN, SEQ, STRING, SUPERTYPE, SYMBOL } from '../types/rule-types.ts'; // @rule-type-consts
import { isBuilderTextLeaf, seamNeedsSpace, wordCharPredicate } from '../compiler/model/node-map.ts';
import { isNonterminalRuleType, collectFixedLiteral, ruleListParts } from '../dsl/rule-patterns.ts';
import type { NodeMap } from '../compiler/types.ts';
import {
	AbstractAssembledCompound, AssembledLexedPattern,
	isMultiple,
	isRequired,
	kindsOf,
	isTerminalValue,
	edgeClassesOfKind,
	edgeCharSetsOfKind,
	patternLeadingEdgeClass,
	patternTrailingEdgeClass,
	concreteKindsOf,
	storageKindOfValue,
	fixedTextOfKind,
	isNodeRef,
	surfaceHiddenOfRef,
	isUnresolvedRef,
	isFixedTextLeaf
} from '../compiler/model/node-map.ts';
import type { AssembledNode, AssembledNonterminal, NodeOrTerminal, SeamEdgeClass } from '../compiler/model/node-map.ts';
import type { Rule, RuleBase, RenderRule, Multiplicity, SeamOrigin, RuleSeparator } from '../types/rule.ts';
import type { DiagnosticSink } from '../types/diagnostics.ts';
import type { DroppedTokens, MisplacedToken } from '../compiler/diagnostics/grammar-diagnostics.ts';
import { DEDENT_TEXT, INDENT_TEXT, type Layout } from '../dsl/primitives/spacing.ts';
import type { CodegenEmitter } from './emitter.ts';
import { classifyTemplateEmission, listDelimitersOf, type ListDelimiters } from './shared.ts';
import { wordCharAsciiTable } from '../util/word-matcher.ts';
import { ruleJoinArm, type JoinFacts } from '../compiler/model/join-seams/index.ts';
import {
	flanksOf,
	hasArmEdgeSeams,
	isSeamChoice,
	isWhitespaceChoice,
	slotPunctuationTokenOfNode,
	keywordKindOfLiteral,
	seamChoiceDefault,
	seamPartOf,
	spacedSeparatorOf,
	spacingSitesOf,
	type RenderRules
} from '../compiler/model/render-rules.ts';
import type { KindEntryLike } from '../dsl/symbol-table.ts';
import {
	ADJACENT,
	adjacentInto,
	DEDENT as DEDENT_BODY,
	DYNAMIC_EDGE,
	EMPTY,
	INDENT as INDENT_BODY,
	MARKER_EDGE,
	SPACE,
	branches,
	concat,
	edgeChar,
	equalBodies,
	gate,
	gateOptionalSlotSeams,
	gateKeywordSlotSeams,
	isExpression,
	mentions,
	references,
	dropSlotSeams,
	duplicateSlots,
	literalBody,
	seam,
	slot as slotRef,
	text,
	weight,
	writesTokenSeam,
	withJoinArm,
	armTests,
	type Body,
	type BodyNode,
	type IfArm
} from './render-body.ts';

export interface EmitTemplatesConfig {
	grammar: string;
	nodeMap: NodeMap;
	renderRules?: RenderRules;
	grammarSha?: string;
	kindEntries: readonly KindEntryLike[];
	joins: JoinFacts;
	diagnostics?: DiagnosticSink;
}

export interface EmittedTemplates {
	bodies: Map<string, Body>;
	seamCensus: SeamCensusSummary;
	droppedTokens: readonly DroppedTokens[];
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
	readonly literalDefaultOrigin: number;
	readonly wordDefaultOrigin: number;
	readonly cascadeOrigin: number;
	readonly fallbackOrigin: number;
}

export interface EmitCtx {
	readonly nodeMap: NodeMap;
	readonly wordMatcher: RegExp;
	readonly isWordChar: (c: string) => boolean;
	readonly isJoinPair: (l: string, r: string) => boolean;
	readonly joins: JoinFacts;
	readonly externals: readonly string[];
	readonly rules: Record<string, RenderRule>;
	readonly visitingHelpers: Set<string>;
	readonly emittedSlotNames: Set<string>;
	readonly seamBoundaries?: SeamBoundaryRecord[];
	readonly joinPairClassCombos?: ReadonlySet<string>;
	readonly joinPairLeftChars?: ReadonlySet<string>;
	readonly joinPairRightChars?: ReadonlySet<string>;
	readonly ownerKind?: string;
	readonly ownerSlots?: Readonly<Record<string, AssembledNonterminal>>;
	readonly lexedTop?: RenderRule;
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
	#droppedTokens: DroppedTokens[] = [];
	readonly #seamBoundaries: SeamBoundaryRecord[] = [];
	readonly #paddingFields = new Map<string, Set<string>>();

	constructor(config: EmitTemplatesConfig) {
		this.#wordMatcher = config.nodeMap.wordMatcher ?? /\w/;
		if (config.renderRules !== undefined) {
			for (const site of spacingSitesOf(config.renderRules, config.nodeMap)) {
				if (site.padding !== true) continue;
				const fields = this.#paddingFields.get(site.kind) ?? new Set<string>();
				fields.add(site.address);
				this.#paddingFields.set(site.kind, fields);
			}
		}
		this.#kindEntries = config.kindEntries;
		const joins = config.joins;
		const joinPairs = new Set(joins.pairs);
		this.#ctx = {
			nodeMap: config.nodeMap,
			wordMatcher: this.#wordMatcher,
			isWordChar: wordCharPredicate(this.#wordMatcher),
			isJoinPair: (l: string, r: string) => joinPairs.has(l + r),
			joins,
			...(() => {
				const table = wordCharAsciiTable(this.#wordMatcher);
				const cls = (char: string) => (table[char.charCodeAt(0)] ? 'word' : 'not-word');
				const combos = new Set<string>();
				const lefts = new Set<string>();
				const rights = new Set<string>();
				for (const pair of joins.pairs) {
					combos.add(`${cls(pair[0]!)}\0${cls(pair[1]!)}`);
					lefts.add(pair[0]!);
					rights.add(pair[1]!);
				}
				return { joinPairClassCombos: combos, joinPairLeftChars: lefts, joinPairRightChars: rights };
			})(),
			externals: ruleListParts(config.nodeMap.externals ?? []).names,
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
			droppedTokens: [...this.#droppedTokens],
			seamCensus: {
				boundaries,
				staticGlued: boundaries.filter((b) => b.resolution === 'static-glued').length,
				staticSpaced: boundaries.filter((b) => b.resolution === 'static-spaced').length,
				runtimeDerivable: boundaries.filter((b) => b.resolution === 'runtime-derivable').length,
				runtimeVarying: boundaries.filter((b) => b.resolution === 'runtime-varying').length,
				preferenceOrigin: boundaries.filter((b) => b.origin === 'preference').length,
				literalDefaultOrigin: boundaries.filter((b) => b.origin === 'literal-default').length,
				wordDefaultOrigin: boundaries.filter((b) => b.origin === 'word-default').length,
				cascadeOrigin: boundaries.filter((b) => b.origin === 'cascade').length,
				fallbackOrigin: boundaries.filter((b) => b.origin === 'fallback').length
			}
		};
	}

	#armWrittenSeams(node: AssembledNode, slotName: string): ReadonlySet<string> {
		const slot = node instanceof AbstractAssembledCompound ? node.slots.find((candidate) => candidate.name === slotName) : undefined;
		if (slot?.registeredOption !== 'choice') return new Set();
		return new Set(this.#slotSeamNames(node, slotName).filter((name) => name !== slotName).flatMap((name) => [`${name}_before`, `${name}_after`]));
	}

	#slotSeamNames(node: AssembledNode, slotName: string): readonly string[] {
		if (!(node instanceof AbstractAssembledCompound)) return [slotName];
		const slot = node.slots.find((candidate) => candidate.name === slotName);
		const tokens = (slot?.values ?? []).flatMap((value) => {
			const token = slotPunctuationTokenOfNode(
				this.#ctx.nodeMap.nodes.get(storageKindOfValue(value) ?? ''),
				this.#kindEntries,
				this.#ctx.nodeMap.wordMatcher
			);
			return token === undefined ? [] : [token];
		});
		return [slotName, ...tokens];
	}

	#mixedSlotKeywordKinds(node: AssembledNode, slotName: string): readonly string[] | undefined {
		if (!(node instanceof AbstractAssembledCompound)) return undefined;
		const texts = (node.slots.find((candidate) => candidate.name === slotName)?.values ?? []).flatMap((value) =>
			isTerminalValue(value) && value.value !== '' ? [value.value] : []
		);
		const keywords = texts.flatMap((text) => {
			const kind = keywordKindOfLiteral(text, this.#ctx.nodeMap, this.#kindEntries);
			return kind === undefined ? [] : [kind];
		});
		return keywords.length > 0 && keywords.length < texts.length ? keywords : undefined;
	}

	#emitNode(node: AssembledNode): void {
		if (classifyTemplateEmission(node) !== 'emit') return;

		this.#ctx.visitingHelpers.clear();
		this.#ctx.emittedSlotNames.clear();
		const emitted = emitOne(node, this.#ctx);
		const body =
			emitted === undefined
				? undefined
				: dropSlotSeams(
						gateKeywordSlotSeams(
							gateOptionalSlotSeams(emitted, (slot) => this.#slotSeamNames(node, slot), (field) => this.#paddingFields.get(node.kind)?.has(field) === true),
							(slot) => this.#mixedSlotKeywordKinds(node, slot)
						),
						(slot) => this.#armWrittenSeams(node, slot)
					);

		if (body === undefined) {
			this.#bodies.set(node.kind, EMPTY);
			return;
		}
		if (process.env['SITTIR_SLOT_PRESERVATION'] !== '0') {
			assertSlotPreservation(node, body);
			assertNoDuplicateSlots(node, body);
		}
		this.#bodies.set(node.kind, body);
		this.#recordDroppedTokens(node, body);
	}

	#recordDroppedTokens(node: AssembledNode, body: Body): void {
		if (!(node instanceof AbstractAssembledCompound)) return;
		const rule = this.#ctx.rules[node.kind] ?? node.renderRule;
		const tokens = droppedLiteralTexts(rule, body, node);
		const misplaced = positionedDroppedLiterals(rule, body, node, (kind) => concreteKindsOf(kind, this.#ctx.nodeMap));
		if (tokens.length > 0 || misplaced.length > 0) this.#droppedTokens.push({ kind: node.kind, tokens, misplaced });
	}
}

function templateTexts(body: Body, out: Set<string>): Set<string> {
	for (const node of body as readonly { kind: string; text?: string; arms?: readonly { body: Body }[]; fallback?: Body }[]) {
		if (node.kind === 'text' && node.text !== undefined) out.add(node.text);
		for (const arm of node.arms ?? []) templateTexts(arm.body, out);
		if (node.fallback !== undefined) templateTexts(node.fallback, out);
	}
	return out;
}

interface Written {
	readonly slot: boolean;
	readonly value: string;
}

function writtenBy(body: Body, takes: (test: string, kinds: readonly string[] | undefined) => boolean, out: Written[] = []): Written[] {
	for (const n of body) {
		if (n.kind === 'slot') out.push({ slot: true, value: n.name });
		else if (n.kind === 'text' || n.kind === 'tokenSeam') out.push({ slot: false, value: n.text });
		else if (n.kind === 'if') {
			const arm = n.arms.find((candidate) => armTests(candidate).some((test) => takes(test, candidate.kinds)));
			if (arm !== undefined) writtenBy(arm.body, takes, out);
			else if (n.fallback !== undefined) writtenBy(n.fallback, takes, out);
		}
	}
	return out;
}

const ASSIGNMENT_BUDGET = 4096;

function gateKindsOf(body: Body, test: string, out: (readonly string[])[] = []): (readonly string[])[] {
	for (const n of body) {
		if (n.kind !== 'if') continue;
		for (const arm of n.arms) {
			if (arm.test === test && arm.kinds !== undefined) out.push(arm.kinds);
			gateKindsOf(arm.body, test, out);
		}
		if (n.fallback !== undefined) gateKindsOf(n.fallback, test, out);
	}
	return out;
}

function testsOf(body: Body, out: string[] = []): string[] {
	for (const n of body) {
		if (n.kind !== 'if') continue;
		for (const arm of n.arms) {
			out.push(...armTests(arm));
			testsOf(arm.body, out);
		}
		if (n.fallback !== undefined) testsOf(n.fallback, out);
	}
	return out;
}

function bodyHasSlot(body: Body, name: string): boolean {
	return body.some((n) => (n.kind === 'slot' && n.name === name) || (n.kind === 'if' && (n.arms.some((arm) => bodyHasSlot(arm.body, name)) || (n.fallback !== undefined && bodyHasSlot(n.fallback, name)))));
}

function leafSlotOf(rule: RenderRule): string | undefined {
	const names = new Set<string>();
	let nested = false;
	const walk = (r: RenderRule, inside: boolean): void => {
		if (isSeamChoice(r)) return;
		const named = (r as { fieldName?: string }).fieldName;
		if (named !== undefined) {
			if (inside) nested = true;
			names.add(named);
			if (r.type === SEQ || r.type === CHOICE) for (const member of r.members) walk(member, true);
			return;
		}
		if (r.type === SEQ || r.type === CHOICE) for (const member of r.members) walk(member, inside);
	};
	walk(rule, false);
	return names.size === 1 && !nested ? [...names][0] : undefined;
}

function kindsHeldAt(rule: RenderRule, slot: string): readonly string[] {
	const kinds = new Set<string>();
	const walk = (r: RenderRule, inside: boolean): void => {
		if (isSeamChoice(r)) return;
		const inField = inside || (r as { fieldName?: string }).fieldName === slot;
		if (r.type === SYMBOL && inField) kinds.add(r.name);
		if (r.type === SEQ || r.type === CHOICE) for (const member of r.members) walk(member, inField);
	};
	walk(rule, false);
	return [...kinds];
}

function requiredSlotsOf(rule: RenderRule): ReadonlySet<string> {
	const names = new Set<string>();
	const walk = (r: RenderRule): void => {
		if (isSeamChoice(r)) return;
		const multiplicity = (r as { multiplicity?: Multiplicity }).multiplicity;
		if (multiplicity !== undefined && multiplicity !== 'single') return;
		const named = (r as { fieldName?: string }).fieldName;
		if (named !== undefined) names.add(named);
		if (r.type === SEQ) for (const member of r.members) walk(member);
		if (r.type === CHOICE && r.members.length > 0) {
			const [first, ...rest] = r.members.map((member) => requiredSlotsOf(member));
			for (const name of first!) if (rest.every((other) => other.has(name))) names.add(name);
		}
	};
	walk(rule);
	return names;
}

export function positionedDroppedLiterals(rule: RenderRule, body: Body, node: AbstractAssembledCompound, expand: (kind: string) => readonly string[] = (kind) => [kind]): MisplacedToken[] {
	const present = new Set<string>();
	for (const slot of node.slots) for (const value of slot.values) if (isTerminalValue(value)) present.add(value.value);
	const single = (name: string): boolean => {
		const slot = node.slots.find((candidate) => candidate.name === name);
		return slot !== undefined && slot.values.length > 0 && slot.values.every((value) => value.multiplicity === 'single');
	};
	const admitted = (name: string): readonly string[] =>
		(node.slots.find((candidate) => candidate.name === name)?.values ?? []).flatMap((value) => storageKindOfValue(value) ?? []);
	const written = (slot: string, token: string, side: MisplacedToken['side'], arm: RenderRule, outer: readonly RenderRule[]): boolean | { readonly tested: number } => {
		const held = new Set([...outer, arm].flatMap((rule) => [...requiredSlotsOf(rule)]));
		const nearest = (name: string): readonly string[] => [arm, ...outer.toReversed()].map((rule) => kindsHeldAt(rule, name)).find((names) => names.length > 0) ?? [];
		const gatesOf = (name: string): readonly ReadonlySet<string>[] => gateKindsOf(body, name).map((kinds) => new Set(kinds.flatMap(expand)));
		const classesAt = (name: string): readonly (string | undefined)[] => {
			const kinds = [...new Set((nearest(name).length > 0 ? nearest(name) : name === slot ? admitted(name) : []).flatMap(expand))];
			if (kinds.length === 0) return [undefined];
			const gates = gatesOf(name);
			const byGates = new Map<string, string>();
			for (const kind of kinds) {
				const signature = gates.map((gate) => (gate.has(kind) ? '1' : '0')).join('');
				if (!byGates.has(signature)) byGates.set(signature, kind);
			}
			return [...byGates.values()];
		};
		const tested = [...new Set([slot, ...testsOf(body).filter((test) => held.has(test))])];
		const domains = tested.map(classesAt);
		if (domains.reduce((count, domain) => count * domain.length, 1) > ASSIGNMENT_BUDGET) return { tested: tested.length };
		const cases = domains.reduce<ReadonlyMap<string, string | undefined>[]>(
			(partial, domain, i) => partial.flatMap((assigned) => domain.map((kind) => new Map(assigned).set(tested[i]!, kind))),
			[new Map()]
		);
		return cases.every((assignment) => {
			const items = writtenBy(body, (test, gated) => {
				if (test !== slot && !held.has(test)) return false;
				if (gated === undefined) return true;
				const kind = assignment.get(test);
				return kind === undefined || gated.flatMap(expand).includes(kind);
			});
			const at = items.findIndex((item) => item.slot && item.value === slot);
			if (at < 0) return false;
			for (let j = side === 'after' ? at + 1 : at - 1; j >= 0 && j < items.length; j += side === 'after' ? 1 : -1) {
				if (items[j]!.slot) return false;
				if (items[j]!.value.includes(token)) return true;
			}
			return false;
		});
	};
	const out: MisplacedToken[] = [];
	const delimited = (r: RenderRule): void => {
		const multiplicity = (r as { multiplicity?: Multiplicity }).multiplicity;
		const separator = (r as { separator?: RuleSeparator }).separator;
		if (separator === undefined || (multiplicity !== 'array' && multiplicity !== 'nonEmptyArray')) return;
		const token = separatorToString(r);
		const id = r.id;
		const slot = id === undefined ? undefined : node.slots.find((candidate) => candidate.sourceRuleIds.includes(id));
		if (token === undefined || slot === undefined || !bodyHasSlot(body, slot.name)) return;
		const written = listDelimitersOf(slot, node);
		const writes = (mode: ListDelimiters['leadingDelimiter']): boolean => mode === 'mandatory' && written.separator === token;
		if (separator.leading === 'mandatory' && !writes(written.leadingDelimiter)) out.push({ token, side: 'before', slot: slot.name });
		if (separator.trailing === 'mandatory' && !writes(written.trailingDelimiter)) out.push({ token, side: 'after', slot: slot.name });
	};
	const walk = (r: RenderRule, outer: readonly RenderRule[] = []): void => {
		if (r.tokenized === true) return;
		delimited(r);
		if (r.type === CHOICE) {
			for (const member of r.members) walk(member, outer);
			return;
		}
		if (r.type !== SEQ) return;
		const members = r.members.filter((member) => !isSeamChoice(member));
		members.forEach((member, i) => {
			if (member.type !== STRING) {
				walk(member, [...outer, r]);
				return;
			}
			const multiplicity = (member as { multiplicity?: Multiplicity }).multiplicity;
			if (multiplicity !== undefined && multiplicity !== 'single') return;
			if (member.nonterminal === true || member.value.trim() === '' || member.value === INDENT_TEXT || member.value === DEDENT_TEXT || present.has(member.value)) return;
			const before = i > 0 ? leafSlotOf(members[i - 1]!) : undefined;
			const after = i + 1 < members.length ? leafSlotOf(members[i + 1]!) : undefined;
			const anchor = before !== undefined ? { slot: before, side: 'after' as const } : after !== undefined ? { slot: after, side: 'before' as const } : undefined;
			if (anchor === undefined || !single(anchor.slot) || !bodyHasSlot(body, anchor.slot)) return;
			const placed = written(anchor.slot, member.value, anchor.side, r, outer);
			if (placed === true) return;
			out.push({ token: member.value, side: anchor.side, slot: anchor.slot, ...(placed === false ? {} : { undecided: { budget: ASSIGNMENT_BUDGET, tested: placed.tested } }) });
		});
	};
	walk(rule);
	return out;
}

export function droppedLiteralTexts(rule: RenderRule, body: Body, node: AbstractAssembledCompound): string[] {
	const present = templateTexts(body, new Set());
	for (const slot of node.slots) for (const value of slot.values) if (isTerminalValue(value)) present.add(value.value);
	const dropped = new Set<string>();
	const walk = (r: RenderRule): void => {
		if (r.tokenized === true) return;
		switch (r.type) {
			case STRING:
				if (r.nonterminal !== true && r.value.trim() !== '' && r.value !== INDENT_TEXT && r.value !== DEDENT_TEXT && ![...present].some((text) => text.includes(r.value))) dropped.add(r.value);
				return;
			case SEQ:
			case CHOICE:
				for (const member of r.members) walk(member);
				return;
			default:
				return;
		}
	};
	walk(rule);
	return [...dropped];
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
		case 'lexedPattern':
		case 'envelope':
			return emitBranchTemplate(node, ctxK);
		case 'polymorph':
		case 'alias':
			return emitBranchTemplate(node, ctxK);
		case 'supertype':
		case 'pattern':
		case 'keyword':
		case 'punctuation':
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

export function emitBranchTemplate(node: SlotBearingCompound, ctx: EmitCtx): Body {
	const top = ctx.rules[node.kind] ?? node.renderRule;
	const ctxWithSlots: EmitCtx = {
		...ctx,
		ownerKind: node.kind,
		ownerSlots: ownerSlotsFor(node),
		...(node instanceof AssembledLexedPattern ? { lexedTop: top } : {})
	};
	return emitRule(top, ctxWithSlots);
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
		if (seamNeedsSpace({ left: leftE, right: rightE })) return STATIC_SPACED;
		if (ctx.joinPairClassCombos?.has(`${leftE}\0${rightE}`)) return RUNTIME_VARYING;
		return STATIC_GLUED;
	}
	return STATIC_SPACED;
}

function withinTrailingGate(body: Body, tail: Body): Body {
	const last = body.at(-1);
	if (last?.kind !== 'if' || last.fallback !== undefined || last.arms.length !== 1) return concat(body, tail);
	const arm = last.arms[0]!;
	return [...body.slice(0, -1), { ...last, arms: [{ ...arm, body: concat(arm.body, tail) }] }];
}

function joinStaticSeam(body: Body, segment: Body, spaced: boolean, seams: Body = EMPTY): Body {
	if (spaced) return concat(body, seams.length > 0 ? seams : SPACE, segment);
	if (seams.length === 0 && isExpression(segment) && segment[0]!.kind !== 'tokenSeam') {
		return concat(withinTrailingGate(body, ADJACENT), segment);
	}
	return concat(body, seams, segment);
}

export function emitRule(rule: RenderRule, ctx: EmitCtx): Body {
	return withJoinArm(emitRuleShape(rule, ctx), ruleJoinArm(ctx.joins, rule));
}

function emitRuleShape(rule: RenderRule, ctx: EmitCtx): Body {
	const flanks = flanksOf(rule);
	if (flanks !== undefined) return emitRule(flanks.inner, ctx);
	switch (rule.type) {
		case STRING: {
			const stringFieldName = (rule as { fieldName?: string }).fieldName;
			if (rule.nonterminal === true && stringFieldName !== undefined) {
				return emitScalarSlot(stringFieldName);
			}
			if (rule.nonterminal === true && rule.aliasedTo !== undefined) {
				const slot = lookupSlot(rule, ctx);
				if (slot !== undefined) return emitSlotReference(rule, slot, ctx);
			}
			if ((rule as { multiplicity?: Multiplicity }).multiplicity === 'optional') {
				return EMPTY;
			}
			return literalBody(rule.value, ctx.lexedTop !== undefined);
		}

		case PATTERN: {
			const slot = lookupSlot(rule, ctx);
			if (slot !== undefined) return emitSlotReference(rule, slot, ctx);
			throw new Error(
				`emitRule: PATTERN in kind '${ctx.ownerKind ?? '(unknown)'}' has no slot: its rule id ` +
					`(${rule.id ?? 'none'}) is not among the sourceRuleIds of any of that kind's slots.`
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
			const ORIGIN_RANK: Record<SeamOrigin, number> = {
				preference: 4,
				'literal-default': 3,
				'word-default': 2,
				cascade: 1,
				fallback: 0
			};
			const ARM_RANK: Record<string, number> = { indent: 3, dedent: 3, newline: 2, blankline: 2, tight: 1, space: 0 };
			const seamChoiceBetween = (
				leftPartIdx: number,
				rightPartIdx: number
			): {
				readonly origin: SeamOrigin;
				readonly arm: Layout | undefined;
				readonly label: string | undefined;
			} => {
				const from = partIndices[leftPartIdx]! + 1;
				const to = partIndices[rightPartIdx]!;
				let bestOrigin: SeamOrigin = 'fallback';
				let bestArm: Layout | undefined;
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
			const recordSeam = (
				l: string,
				r: string,
				resolution: SeamBoundaryRecord['resolution'],
				origin: SeamOrigin
			): void => {
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
					if (rule === ctx.lexedTop) {
						recordSeam(l, r, 'static-glued', 'fallback');
						body = concat(body, seams, adjacentInto(segment));
						seams = EMPTY;
						lastRealPartIdx = rightPartIdx;
						continue;
					}
					const leftRule = partRules[lastRealPartIdx]!;
					const rightRule = partRules[rightPartIdx]!;
					const armSeamed = hasArmEdgeSeams(leftRule, 'last') || hasArmEdgeSeams(rightRule, 'first');
					const stamped = rule.members[partIndices[rightPartIdx]!]!.staticSeamBefore;
					if (stamped !== undefined && !armSeamed) {
						const spaced = stamped === 'spaced';
						recordSeam(
							l,
							r,
							spaced ? 'static-spaced' : 'static-glued',
							seamChoiceBetween(lastRealPartIdx, rightPartIdx).origin
						);
						body = joinStaticSeam(body, segment, spaced, seams);
						seams = EMPTY;
						lastRealPartIdx = rightPartIdx;
						continue;
					}
					const classification = armSeamed ? RUNTIME_VARYING : classifySeqBoundary(l, r, leftRule, rightRule, ctx);
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
		case EOF:
			return EMPTY;

		default: {
			const _exhaustive: never = rule;
			throw new Error(`emitRule: unhandled RenderRule.type ${(_exhaustive as RenderRule).type}`);
		}
	}
}

function lookupSlot(rule: RenderRule, ctx: EmitCtx): AssembledNonterminal | undefined {
	return rule.id === undefined || ctx.ownerKind === undefined ? undefined : ctx.nodeMap.slotByRuleId.get(ctx.ownerKind)?.get(rule.id);
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
	if (
		multiVal &&
		((multiVal as { trailing?: boolean }).trailing === true || (multiVal as { leading?: boolean }).leading === true)
	) {
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
			ctx.joinPairRightChars?.has(first) === false &&
			ctx.joinPairLeftChars?.has(last) === false;
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
					const seam = (ctx.isWordChar(l) && ctx.isWordChar(r)) || ctx.isJoinPair(l, r);
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
	const sep = allImmediate ? '' : (separatorToString(rule) ?? slot?.separator ?? '');
	if (
		!hasFlankSignal(rule, slot) &&
		!allImmediate &&
		!isNonterminalSeparatorRule(rule) &&
		slot !== undefined &&
		ctx !== undefined
	) {
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
	const slotName = slotNameInBody(slot);
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
			throw emitShapeFailure({ code: 'nonterminal-without-fixed-text', message: `emitSymbol: '${rule.name}' is nonterminal: false but renders no fixed text` });
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
		return emitFieldNameSlot(symbolFieldName, rule, ctx);
	}

	const slot = lookupSlot(rule, ctx);
	if (slot && !isInlineableHiddenHelper && !(slot.isUnnamed && rule.type === SYMBOL && rule.inline === true)) {
		return emitSlotReference(rule, slot, ctx);
	}
	if (rule.type === SYMBOL && rule.inline === true) {
		const targetNode = ctx.nodeMap.nodes.get(rule.name);
		if (targetNode && 'renderRule' in targetNode && targetNode.renderRule) {
			if (ctx.visitingHelpers.has(rule.name)) {
				const slotName = rule.name.replace(/^_+/, '') || 'children';
				return emitScalarSlot(slotName);
			}
			ctx.visitingHelpers.add(rule.name);
			try {
				const helperRenderRule = ctx.rules[rule.name] ?? (targetNode as { renderRule: RenderRule }).renderRule;
				const helperCtx: EmitCtx = {
					...ctx,
					ownerKind: targetNode.kind,
					ownerSlots: ownerSlotsFor(targetNode)
				};
				const helperBody = emitRule(helperRenderRule, helperCtx);
				const multiplicity = (rule as { multiplicity?: Multiplicity }).multiplicity;
				if (multiplicity === 'array' || multiplicity === 'nonEmptyArray') {
					const listName = slot
						? (slot.storageName.replace(/^_+/, '') || 'children')
						: (pickConditionalKey(helperRenderRule, helperCtx) ??
							(rule.name.replace(/^_+/, '') || 'children'));
					return emitListSlot(listName, rule, slot, helperCtx);
				}
				if (multiplicity === 'optional' && helperBody.length !== 0) {
					const symbolFieldKey = symbolFieldName;
					const addressableFieldKey =
						symbolFieldKey !== undefined &&
						(ctx.ownerSlots === undefined || ctx.ownerSlots[symbolFieldKey] !== undefined)
							? symbolFieldKey
							: undefined;
					const condKey =
						addressableFieldKey ??
						pickConditionalKey(helperRenderRule, helperCtx) ??
						(rule.name.replace(/^_+/, '') || 'children');
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
			const slotName = rule.name.replace(/^_+/, '') || 'children';
			return emitScalarSlot(slotName);
		}
		ctx.visitingHelpers.add(rule.name);
		try {
			const target = ctx.rules[rule.name]!;
			const helperBody = emitRule(target, ctx);
			const multiplicity = (rule as { multiplicity?: Multiplicity }).multiplicity;
			if (multiplicity === 'array' || multiplicity === 'nonEmptyArray') {
				const listName = slot
					? (slot.storageName.replace(/^_+/, '') || 'children')
					: (pickConditionalKey(target, ctx) ?? (rule.name.replace(/^_+/, '') || 'children'));
				return emitListSlot(listName, rule, slot, ctx);
			}
			if (multiplicity === 'optional' && helperBody.length !== 0) {
				const condKey = pickConditionalKey(target, ctx) ?? (rule.name.replace(/^_+/, '') || 'children');
				return gate(condKey, helperBody);
			}
			return helperBody;
		} finally {
			ctx.visitingHelpers.delete(rule.name);
		}
	}
	const slotName = rule.name.replace(/^_+/, '') || 'children';
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
	if (isWhitespaceChoice(content)) return undefined;
	const contentFieldName = (content as { fieldName?: string }).fieldName;
	if (contentFieldName !== undefined) {
		const key = contentFieldName;
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
		return sym.name.replace(/^_+/, '') || 'children';
	}
	return undefined;
}

function scanArmBody(body: Body): {
	key: string | undefined;
	needsGate: boolean;
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
				case 'wordSeam':
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
	return { key: depth0Ref ?? firstGated, needsGate: depth0Payload };
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
			return (rule as { fieldName?: string }).fieldName === undefined ? ({ ...rule, fieldName } as RenderRule) : rule;
		case SEQ:
		case CHOICE:
			return { ...rule, members: rule.members.map((m) => withFieldOnCarriers(m, fieldName)) } as RenderRule;
		default:
			return rule;
	}
}

const withoutSlotJoins = (body: Body): Body => body.map((n) => (n.kind === 'slot' ? { kind: 'slot', name: n.name } : n));

const isLiteralOnly = (body: Body): boolean =>
	body.every((n) => n.kind === 'text' || n.kind === 'space' || n.kind === 'seam' || n.kind === 'adjacent');

export function emitKindGatedLiterals(
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
	const arms: KindGatedArm[] = [];
	let key: string | undefined;
	const beforeSlots = new Set(ctx.emittedSlotNames);
	for (const member of rule.members) {
		const arm = fieldName === undefined ? member : withFieldOnCarriers(member, fieldName);
		const kinds = armSlotKinds(arm);
		if (kinds === undefined) return bail(`arm carries no single slot: ${JSON.stringify(arm).slice(0, 160)}`);
		const body = emitRule(arm, ctx);
		restoreEmittedSlotNames(ctx, beforeSlots);
		const at = body.findIndex((n) => n.kind === 'slot');
		const unit = kinds.length === 1 ? ctx.nodeMap.nodes.get(kinds[0]!) : undefined;
		if (at >= 0 && unit !== undefined && isFixedTextLeaf(unit) && body.every((n) => n.kind === 'slot' || n.kind === 'seam')) {
			const slotName = (body[at] as { name: string }).name;
			if (key !== undefined && slotName !== key) return bail(`slot ${slotName} differs from ${key}`);
			key = slotName;
			arms.push({ prefix: undefined, residual: EMPTY, kinds });
			continue;
		}
		if (at < 0) {
			if (kinds.length !== 1 || !isLiteralOnly(body))
				return bail(`slotless arm not a lone literal kind: ${JSON.stringify(body).slice(0, 160)}`);
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
	if (!arms.some((arm) => arm.prefix !== undefined)) return bail('no arm keeps text before the slot');
	const prefix = (arms.find((a) => a.prefix !== undefined && a.residual.length > 0) ?? arms.find((a) => a.prefix !== undefined)!).prefix!;
	if (!arms.every((a) => a.prefix === undefined || equalBodies(withoutSlotJoins(a.prefix), withoutSlotJoins(prefix))))
		return leadGatedLiterals(arms, key, prefix, ctx) ?? bail(`prefixes differ: ${JSON.stringify(arms.map((a) => a.prefix)).slice(0, 300)}`);
	if (arms.some((a) => a.prefix === undefined) && prefix.some((n) => n.kind !== 'slot'))
		return leadGatedLiterals(arms, key, prefix, ctx) ?? bail(`a lone literal arm cannot share leading text: ${JSON.stringify(prefix).slice(0, 160)}`);
	const gated = kindGates(
		arms.map((arm) => ({ body: arm.residual, kinds: arm.kinds })),
		key
	);
	if (gated.length === 0) return bail('no arm has a residual literal');
	ctx.emittedSlotNames.add(key);
	return concat(prefix, branches(gated, undefined));
}

function selfGatedBody(body: Body, key: string): Body | undefined {
	const [only] = body;
	if (body.length !== 1 || only?.kind !== 'if' || only.fallback !== undefined || only.arms.length !== 1) return undefined;
	const [arm] = only.arms;
	return arm!.test === key && arm!.kinds === undefined && arm!.or === undefined ? arm!.body : undefined;
}

interface KindGatedArm {
	prefix: Body | undefined;
	residual: Body;
	kinds: readonly string[];
}

function kindGates(bodies: readonly { body: Body; kinds: readonly string[] }[], key: string): IfArm[] {
	const gated: { kinds: string[]; body: Body }[] = [];
	for (const { body, kinds } of bodies) {
		if (body.length === 0) continue;
		const same = gated.find((g) => equalBodies(g.body, body));
		if (same) {
			for (const k of kinds) if (!same.kinds.includes(k)) same.kinds.push(k);
		} else {
			gated.push({ kinds: [...kinds], body });
		}
	}
	return gated.map((g) => ({ test: key, kinds: g.kinds, body: g.body }));
}

function leadGatedLiterals(arms: readonly KindGatedArm[], key: string, prefix: Body, ctx: EmitCtx): Body | undefined {
	const parts = arms.map((arm) => ({ lead: arm.prefix?.slice(0, -1) ?? EMPTY, residual: arm.residual, kinds: arm.kinds }));
	if (!parts.every((part) => isLiteralOnly(part.lead))) return undefined;
	const concrete = parts.map((part) => new Set(part.kinds.flatMap((kind) => concreteKindsOf(kind, ctx.nodeMap))));
	if (concrete.some((kinds) => kinds.size === 0)) return undefined;
	for (const [i, a] of parts.entries()) {
		for (const [j, b] of parts.entries()) {
			if (j <= i || (equalBodies(a.lead, b.lead) && equalBodies(a.residual, b.residual))) continue;
			if ([...concrete[i]!].some((kind) => concrete[j]!.has(kind))) return undefined;
		}
	}
	const leads = kindGates(
		parts.map((part) => ({ body: part.lead, kinds: part.kinds })),
		key
	);
	const residuals = kindGates(
		parts.map((part) => ({ body: part.residual, kinds: part.kinds })),
		key
	);
	if (leads.length === 0 && residuals.length === 0) return undefined;
	ctx.emittedSlotNames.add(key);
	return concat(leads.length === 0 ? EMPTY : branches(leads, undefined), prefix.slice(-1), residuals.length === 0 ? EMPTY : branches(residuals, undefined));
}

interface EmittedArm {
	readonly index: number;
	readonly rule: RenderRule;
	readonly body: Body;
	readonly delta: readonly string[];
}

interface ExclusiveArm {
	readonly indices: readonly number[];
	readonly body: Body;
	readonly held: ReadonlySet<string>;
	readonly required: readonly (readonly string[])[];
	readonly kindsAt: ReadonlyMap<string, readonly string[]>;
}

interface ArmTest {
	readonly slots: readonly string[];
	readonly kinds?: readonly string[];
}

function slotNameInBody(slot: AssembledNonterminal): string {
	return slot.storageName.replace(/^_+/, '') || 'children';
}

function requiredParts(rule: RenderRule, ctx: EmitCtx): readonly (readonly string[])[] {
	if (isSeamChoice(rule)) return [];
	const multiplicity = (rule as { multiplicity?: Multiplicity }).multiplicity;
	if (multiplicity === 'optional' || multiplicity === 'array') return [];
	if (rule.type === SEQ) return rule.members.flatMap((member) => requiredParts(member as RenderRule, ctx));
	if (rule.type !== SYMBOL && rule.type !== CHOICE) return [];
	const slot = lookupSlot(rule, ctx);
	const own = slot === undefined ? undefined : slotNameInBody(slot);
	if (rule.type === SYMBOL) return own === undefined ? [] : [[own]];
	const firsts = rule.members.map((member) => requiredParts(member as RenderRule, ctx)[0] ?? (own === undefined ? undefined : [own]));
	if (firsts.some((part) => part === undefined)) return own === undefined ? [] : [[own]];
	return [[...new Set(firsts.flatMap((part) => part!))]];
}

function slotKindsOf(rule: RenderRule, ctx: EmitCtx): ReadonlyMap<string, readonly string[]> {
	const kinds = new Map<string, string[]>();
	const textual = new Set<string>();
	const walk = (r: RenderRule, inside: string | undefined): void => {
		if (isSeamChoice(r)) return;
		const own = r.type === SYMBOL || r.type === CHOICE ? lookupSlot(r, ctx) : undefined;
		const slot = inside ?? (own === undefined ? undefined : slotNameInBody(own));
		if (slot !== undefined && r.type === SYMBOL) {
			const names = kinds.get(slot) ?? [];
			if (!names.includes(r.name)) names.push(r.name);
			kinds.set(slot, names);
			return;
		}
		if (slot !== undefined && (r.type === STRING || r.type === PATTERN)) textual.add(slot);
		if (r.type === SEQ || r.type === CHOICE) for (const member of r.members) walk(member as RenderRule, slot);
	};
	walk(rule, undefined);
	for (const slot of textual) kinds.delete(slot);
	return kinds;
}

function exclusiveArmsOf(arms: readonly EmittedArm[], ctx: EmitCtx): ExclusiveArm[] | undefined {
	const held = arms.map((arm) => new Set(references(arm.body).slots));
	const shared = held.some((slots, i) => [...slots].some((slot) => held.some((other, j) => j !== i && other.has(slot))));
	if (!shared) return undefined;
	const out: { indices: number[]; body: Body; held: Set<string>; required: (readonly string[])[]; kindsAt: Map<string, readonly string[]> }[] = [];
	arms.forEach((arm, i) => {
		const required = requiredParts(arm.rule, ctx);
		const kindsAt = new Map(
			[...slotKindsOf(arm.rule, ctx)].map(([slot, names]) => [slot, [...new Set(names.flatMap((name) => concreteKindsOf(name, ctx.nodeMap)))]] as const)
		);
		const same = out.find((candidate) => equalBodies(candidate.body, arm.body));
		if (same === undefined) {
			out.push({ indices: [arm.index], body: arm.body, held: held[i]!, required: [...required], kindsAt: new Map(kindsAt) });
			return;
		}
		for (const [slot, kinds] of kindsAt) same.kindsAt.set(slot, [...new Set([...(same.kindsAt.get(slot) ?? []), ...kinds])]);
		same.indices.push(arm.index);
		for (const slot of held[i]!) same.held.add(slot);
		same.required = same.required.filter((part) => required.some((other) => other.length === part.length && other.every((slot) => part.includes(slot))));
	});
	return out;
}

function exclusiveChain(arms: readonly ExclusiveArm[]): Body | readonly ExclusiveArm[] {
	if (arms.length === 1) return arms[0]!.body;
	const admits = (arm: ExclusiveArm, slot: string, kinds: readonly string[] | undefined): boolean => {
		const own = arm.kindsAt.get(slot);
		return kinds === undefined || own === undefined || own.some((kind) => kinds.includes(kind));
	};
	const confined = (arm: ExclusiveArm, slot: string, kinds: readonly string[] | undefined): boolean => {
		const own = arm.kindsAt.get(slot);
		return kinds === undefined || (own !== undefined && own.every((kind) => kinds.includes(kind)));
	};
	const holds = (arm: ExclusiveArm, test: ArmTest): boolean => test.slots.some((slot) => arm.held.has(slot) && admits(arm, slot, test.kinds));
	const requires = (arm: ExclusiveArm, test: ArmTest): boolean =>
		arm.required.some((own) => own.every((slot) => test.slots.includes(slot) && confined(arm, slot, test.kinds)));
	const testsOf = (arm: ExclusiveArm, byKind: boolean): ArmTest[] =>
		byKind
			? arm.required.flatMap((part) => (part.length === 1 && arm.kindsAt.has(part[0]!) ? [{ slots: part, kinds: arm.kindsAt.get(part[0]!)! }] : []))
			: arm.required.map((part) => ({ slots: part }));
	const split = (single: boolean, byKind: boolean) => {
		for (const arm of arms) {
			for (const test of testsOf(arm, byKind)) {
				const present = arms.filter((other) => holds(other, test));
				const absent = arms.filter((other) => !requires(other, test));
				if (present.length < arms.length && absent.length < arms.length && (!single || present.length === 1)) return { test, present, absent };
			}
		}
		return undefined;
	};
	const chosen = split(true, false) ?? split(true, true) ?? split(false, false) ?? split(false, true);
	if (chosen === undefined) return arms;
	const present = exclusiveChain(chosen.present);
	if (!isBody(present)) return present;
	const absent = exclusiveChain(chosen.absent);
	if (!isBody(absent)) return absent;
	const [test, ...or] = chosen.test.slots;
	const arm: IfArm =
		chosen.test.kinds !== undefined
			? { test: test!, kinds: chosen.test.kinds, body: present }
			: or.length === 0
				? { test: test!, body: present }
				: { test: test!, or, body: present };
	const only = absent.length === 1 && absent[0]!.kind === 'if' ? absent[0] : undefined;
	return only === undefined ? branches([arm], absent) : branches([arm, ...only.arms], only.fallback);
}

function isBody(chain: Body | readonly ExclusiveArm[]): chain is Body {
	return chain.length === 0 || 'kind' in chain[0]!;
}

function lowerExclusiveArms(rule: RenderRule, arms: readonly ExclusiveArm[], ctx: EmitCtx): Body {
	const chain = exclusiveChain(arms);
	if (isBody(chain)) return chain;
	const kind = ctx.currentKind ?? '(unknown)';
	const slots = [...new Set(chain.flatMap((arm) => [...arm.held]))].sort();
	const indices = chain.flatMap((arm) => arm.indices);
	throw emitShapeFailure({
		code: 'shared-slot-choice',
		ownerKind: kind,
		message: `${kind}: arms ${indices.join(', ')} of its choice hold slots (${slots.join(', ')}), and neither a slot's presence nor its kind tells them apart, so a node's slots can't say which arm to render`,
		proposal: `name each arm's form: edits: { ${kind}: { <path of each arm>: variant('<name>') } }`,
		details: { rule: rule.id, arms: indices, slots }
	});
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
			const unionName = slotNameInBody(slot);
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
		return emitFieldNameSlot(choiceFieldName, rule, ctx);
	}
	if (rule.id === '__synthetic_exclusive_choice__') {
		return concat(...rule.members.map((m) => emitRule(m, ctx)));
	}
	{
		interface ArmInfo {
			key: string;
			body: Body;
			needsGate: boolean;
			delta: string[];
		}
		const armInfos: ArmInfo[] = [];
		const emitted: EmittedArm[] = [];
		let ungateableArm = false;
		let literalFallback: Body | undefined;
		let literalFallbackAmbiguous = false;
		for (const arm of rule.members) {
			const beforeSlots = new Set(ctx.emittedSlotNames);
			const body = emitRule(arm as RenderRule, ctx);
			const delta = [...ctx.emittedSlotNames].filter((s) => !beforeSlots.has(s));
			restoreEmittedSlotNames(ctx, beforeSlots);
			if (body.length === 0) continue;
			emitted.push({ index: rule.members.indexOf(arm), rule: arm as RenderRule, body, delta });
			const { key, needsGate } = scanArmBody(body);
			if (key === undefined || ctx.ownerSlots?.[key] === undefined) {
				if (isLiteralOnly(body)) {
					if (literalFallback === undefined) literalFallback = body;
					else if (!equalBodies(literalFallback, body)) literalFallbackAmbiguous = true;
					continue;
				}
				ungateableArm = true;
				break;
			}
			armInfos.push({ key, body, needsGate, delta });
		}
		if (process.env.SITTIR_DEBUG_FLATCHOICE) {
			process.stderr.write(
				`[flatchoice] id=${String((rule as { id?: string }).id)} ungateable=${ungateableArm} litFallback=${JSON.stringify(literalFallback)} arms=${armInfos.length} bodies=${JSON.stringify(armInfos.map((i) => i.body))}\n`
			);
		}
		if (!ungateableArm && literalFallback === undefined) {
			const flat = flatSlotBody(armInfos.map((info) => info.body));
			if (flat !== undefined) {
				for (const name of flat.slots) ctx.emittedSlotNames.add(name);
				return flat.body;
			}
		}
		if (!ungateableArm) {
			const exclusive = exclusiveArmsOf(emitted, ctx);
			if (exclusive !== undefined) {
				const lowered = lowerExclusiveArms(rule, exclusive, ctx);
				for (const { delta } of emitted) for (const s of delta) ctx.emittedSlotNames.add(s);
				return lowered;
			}
			const blocks = armInfos.map((info) => ({
				key: info.key,
				block: info.needsGate ? gate(info.key, info.body) : info.body,
				raw: info.needsGate ? info.body : selfGatedBody(info.body, info.key)
			}));
			const claimed = (body: Body): Body => {
				for (const info of armInfos) for (const s of info.delta) ctx.emittedSlotNames.add(s);
				return body;
			};
			if (literalFallback !== undefined && !literalFallbackAmbiguous && blocks.length >= 1 && blocks.every((b) => b.raw !== undefined)) {
				return claimed(branches(blocks.map((b) => ({ test: b.key, body: b.raw! })), literalFallback));
			}
			if (blocks.length >= 2) return claimed(concat(...blocks.map((b) => b.block)));
		}
	}
	for (const member of rule.members) {
		const body = emitRule(member, ctx);
		if (body.length !== 0) return body;
	}
	return EMPTY;
}

export function flatSlotOrder(armOrders: readonly (readonly string[])[]): string[] {
	const first: string[] = [];
	for (const order of armOrders) for (const name of order) if (!first.includes(name)) first.push(name);
	const after = new Map(first.map((name) => [name, new Set<string>()]));
	const waiting = new Map(first.map((name) => [name, 0]));
	for (const order of armOrders) {
		order.forEach((name, i) => {
			const next = order[i + 1];
			if (next === undefined || after.get(name)!.has(next)) return;
			after.get(name)!.add(next);
			waiting.set(next, waiting.get(next)! + 1);
		});
	}
	const placed: string[] = [];
	while (placed.length < first.length) {
		const ready = first.find((name) => !placed.includes(name) && waiting.get(name) === 0);
		if (ready === undefined) return first;
		placed.push(ready);
		for (const next of after.get(ready)!) waiting.set(next, waiting.get(next)! - 1);
	}
	return placed;
}

export function flatSlotBody(armBodies: readonly Body[]): { readonly body: Body; readonly slots: readonly string[] } | undefined {
	const lists = armBodies.map(selfGatedSlotUnits);
	if (!lists.every((units): units is SlotUnit[] => units !== null)) return undefined;
	const unitOf = new Map<string, Body>();
	const armsHolding = new Map<string, number>();
	for (const units of lists) {
		for (const unit of units) {
			const seen = unitOf.get(unit.name);
			if (seen !== undefined && !equalBodies(seen, unit.body)) return undefined;
			unitOf.set(unit.name, unit.body);
		}
		for (const name of new Set(units.map((unit) => unit.name))) armsHolding.set(name, (armsHolding.get(name) ?? 0) + 1);
	}
	if (![...armsHolding.values()].some((count) => count >= 2)) return undefined;
	const armOrders = lists.map((units) => units.map((unit) => unit.name));
	const order = flatSlotOrder(armOrders);
	const isSubsequence = (needle: readonly string[], hay: readonly string[]): boolean => {
		let i = 0;
		for (const name of hay) if (i < needle.length && needle[i] === name) i++;
		return i === needle.length;
	};
	const parseable = armOrders.every((arm) => {
		const held = new Set(arm);
		const projected = order.filter((name) => held.has(name));
		return armOrders.some((other) => isSubsequence(projected, other));
	});
	return parseable ? { body: concat(...order.map((name) => unitOf.get(name)!)), slots: order } : undefined;
}

interface SlotUnit {
	readonly name: string;
	readonly body: Body;
}

function unitSlotOf(node: BodyNode | undefined): string | undefined {
	if (node?.kind === 'slot') return node.name;
	if (node?.kind !== 'if' || node.arms.length !== 1 || node.fallback !== undefined) return undefined;
	const arm = node.arms[0]!;
	const only = arm.body.length === 1 ? arm.body[0] : undefined;
	return only?.kind === 'slot' && only.name === arm.test && arm.or === undefined && arm.kinds === undefined ? arm.test : undefined;
}

function selfGatedSlotUnits(body: Body): SlotUnit[] | null {
	const units: { name: string; body: BodyNode[] }[] = [];
	let before: BodyNode[] = [];
	for (let i = 0; i < body.length; i++) {
		const node = body[i]!;
		if (node.kind === 'seam') {
			const prev = units[units.length - 1];
			if (before.length === 0 && prev !== undefined && node.field === `${prev.name}_after`) prev.body.push(node);
			else if (node.field === `${unitSlotOf(body[i + 1]) ?? ''}_before`) before.push(node);
			else return null;
			continue;
		}
		const name = unitSlotOf(node);
		if (name === undefined) return null;
		units.push({ name, body: [...before, ...(node.kind === 'slot' ? gate(name, slotRef(name)) : [node])] });
		before = [];
	}
	return units.length > 0 && before.length === 0 ? units : null;
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

function rendersAsDeclaredTokenSeam(value: NodeOrTerminal, body: Body): boolean {
	if (!isNodeRef(value) || isUnresolvedRef(value.node)) return false;
	const node = value.node;
	return node.kindEntry?.visibleExternal === true && isFixedTextLeaf(node) && writesTokenSeam(body, node.text);
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
		if (slot.isUnnamed && slotKinds.length > 0 && slot.values.every((v) => !isNodeRef(v) || surfaceHiddenOfRef(v.node)))
			continue;
		if (slot.values.length > 0 && slot.values.every((v) => rendersAsDeclaredTokenSeam(v, body))) continue;
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
			case 'keyword':
			case 'punctuation':
				if (isBuilderTextLeaf(node)) te.emitLeaf(node);
				break;
			case 'branch':
			case 'lexedPattern':
			case 'envelope':
				te.emitBranch(node);
				break;
			case 'polymorph':
			case 'alias':
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

export function stampStaticSpacing(
	nodeMap: NodeMap,
	grammar: string,
	renderRules: RenderRules | undefined,
	kindEntries: readonly KindEntryLike[],
	joins: JoinFacts
): void {
	runTemplateEmitter({ grammar, nodeMap, renderRules, kindEntries, joins });
}
