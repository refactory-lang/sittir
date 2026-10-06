import type { NodeMap } from '../types.ts';
import {
	AbstractAssembledCompound,
	AssembledPattern,
	AssembledPolymorph,
	type AssembledNode,
	type FullFormAffix,
	AssembledPunctuation,
	AssembledSupertype,
	isNodeRef,
	storageKindOfRef
} from './node-map.ts';
import { leadingRegex } from './leaf-pattern.ts';
import { endsWithLineBreak, patternDfa, requiresNonSpace } from './pattern-automaton.ts';
import { declaresWhitespace, whitespaceSymbolsOf } from './whitespace-arms.ts';
import { escapeRegexLiteral } from '../../util/word-matcher.ts';
import { SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { extrasClosure } from '../../dsl/extras.ts';
import { ruleListParts } from '../../dsl/rule-patterns.ts';
import { RuleWalker } from '../../dsl/rule-walker.ts';
import type { RenderRule } from '../../types/rule.ts';

const triviaKindsByNodeMap = new WeakMap<NodeMap, ReadonlySet<string>>();
export const COMMENT_IR_KEY = 'comment';

export interface TriviaSibling {
	readonly lead: RegExp;
	readonly texts?: readonly string[];
	readonly builder: string;
}

export type LeadAlternative = { readonly literal: string } | { readonly pattern: string };

export interface TriviaForm {
	readonly kind: string;
	readonly open: string;
	readonly close: string;
	readonly coercer: string;
	readonly siblings: readonly TriviaSibling[];
}

export function defaultTriviaForm(nodeMap: NodeMap): TriviaForm | undefined {
	const comment = [...nodeMap.nodes.values()].find((node) => node.irKey === COMMENT_IR_KEY);
	if (comment === undefined) return undefined;
	const defaultRef =
		comment instanceof AssembledSupertype
			? comment.subtypes.filter(isNodeRef).find((ref) => ref.default === true)
			: undefined;
	const arm = defaultRef === undefined ? comment : nodeMap.nodes.get(storageKindOfRef(defaultRef.node));
	if (!(arm instanceof AbstractAssembledCompound) || arm.fullForm === undefined) {
		throw new Error(`trivia: ir.${COMMENT_IR_KEY} has no default arm with a full form to take delimiters from`);
	}
	const fullForm = arm.fullForm;
	const fixedText = (affix: FullFormAffix): string => {
		const [text] = affix.texts;
		if (text === undefined || affix.texts.length !== 1)
			throw new Error(`trivia: the default comment kind '${arm.kind}' has a spelled delimiter`);
		return text;
	};
	if (arm.fromFunctionName === undefined)
		throw new Error(`trivia: the default comment kind '${arm.kind}' has no coercer`);
	return {
		kind: arm.kind,
		open: fixedText(fullForm.open),
		close: fixedText(fullForm.close),
		coercer: arm.fromFunctionName,
		siblings: siblingLeads(nodeMap, arm)
	};
}

export interface SpelledTriviaForm {
	readonly kind: string;
	readonly opens: readonly string[];
	readonly closes: readonly string[];
}

export type SpelledTriviaTable = { readonly forms: readonly SpelledTriviaForm[] } | { readonly reason: string };

export function spelledTriviaTable(nodeMap: NodeMap): SpelledTriviaTable | undefined {
	const comment = [...nodeMap.nodes.values()].find((node) => node.irKey === COMMENT_IR_KEY);
	if (comment === undefined) return undefined;
	if (!(comment instanceof AssembledSupertype)) return { reason: `ir.${COMMENT_IR_KEY} is one kind, '${comment.kind}'` };
	const forms = comment.subtypes.filter(isNodeRef).flatMap((ref): SpelledTriviaForm[] => {
		const arm = nodeMap.nodes.get(storageKindOfRef(ref.node));
		const form = arm instanceof AbstractAssembledCompound ? arm.fullForm : undefined;
		if (arm === undefined || form === undefined) return [];
		return [{ kind: arm.kind, opens: form.open.texts, closes: form.close.texts }];
	});
	if (forms.length < 2) return { reason: `fewer than two kinds of ir.${COMMENT_IR_KEY} have a fixed spelling` };
	const clash = spelledFormsClash(forms);
	if (clash !== undefined) return { reason: clash };
	const longest = (form: SpelledTriviaForm): number => Math.max(...form.opens.map((open) => open.length));
	return { forms: [...forms].sort((a, b) => longest(b) - longest(a) || (a.kind < b.kind ? -1 : 1)) };
}

export function spelledFormsClash(forms: readonly SpelledTriviaForm[]): string | undefined {
	for (const [index, a] of forms.entries()) {
		for (const b of forms.slice(index + 1)) {
			for (const open of a.opens) {
				const other = b.opens.find((text) => open === '' || text === '' || open.startsWith(text) || text.startsWith(open));
				if (other !== undefined) {
					return `'${a.kind}' (${JSON.stringify(open)}) and '${b.kind}' (${JSON.stringify(other)}) are not told apart by how they open`;
				}
			}
		}
	}
	return undefined;
}

export function siblingLeads(nodeMap: NodeMap, node: AssembledNode): TriviaSibling[] {
	if (!(node instanceof AssembledPolymorph)) return [];
	return node.arms.flatMap((ref) => {
		if (ref.type !== SYMBOL || ref.annotations?.default === true) return [];
		const arm = nodeMap.nodes.get(ref.name);
		if (arm?.irKey === undefined) throw new Error(`trivia: '${node.kind}' arm '${ref.name}' has no builder`);
		const leads = leadSources(nodeMap, ref.name, new Set());
		const sources = leads.map((lead) => ('literal' in lead ? escapeRegexLiteral(lead.literal) : `(?:${lead.pattern})`));
		const texts = leads.flatMap((lead) => ('literal' in lead ? [lead.literal] : []));
		return [
			{
				lead: leadingRegex(ref.name, sources.join('|')),
				...(texts.length === leads.length ? { texts } : {}),
				builder: `ir.${arm.irKey}`
			}
		];
	});
}

function leadSources(nodeMap: NodeMap, kind: string, seen: ReadonlySet<string>): LeadAlternative[] {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined || seen.has(kind)) throw new Error(`trivia: cannot read how '${kind}' starts`);
	const within = new Set([...seen, kind]);
	return node.leadingTerminals.flatMap((terminal) => {
		if (terminal === 'empty') throw new Error(`trivia: '${kind}' can start empty, so any text could read as it`);
		if ('symbol' in terminal) return leadSources(nodeMap, terminal.symbol, within);
		return ['literal' in terminal ? { literal: terminal.literal } : { pattern: terminal.pattern }];
	});
}

const lineTerminatedByNodeMap = new WeakMap<NodeMap, Map<string, boolean | undefined>>();

export function triviaKinds(nodeMap: NodeMap): ReadonlySet<string> {
	const cached = triviaKindsByNodeMap.get(nodeMap);
	if (cached !== undefined) return cached;
	const kinds = extrasClosure(
		[...ruleListParts(nodeMap.extras ?? []).names, ...whitespaceTriviaKinds(nodeMap)],
		[...nodeMap.nodes].flatMap(([kind, node]) => (node instanceof AssembledSupertype ? [kind] : [])),
		(kind) => {
			const node = nodeMap.nodes.get(kind);
			return node instanceof AssembledSupertype
				? node.subtypeNames.filter((subtype) => nodeMap.nodes.has(subtype))
				: undefined;
		}
	);
	triviaKindsByNodeMap.set(nodeMap, kinds);
	return kinds;
}

export function lexicalExtrasRun(nodeMap: NodeMap): RegExp | undefined {
	return nodeMap.nodelessExtrasRun;
}

export function whitespaceTriviaKinds(nodeMap: NodeMap): string[] {
	const nodelessExtrasRun = lexicalExtrasRun(nodeMap);
	if (nodelessExtrasRun === undefined || !declaresWhitespace(nodeMap)) return [];
	return [...whitespaceSymbolsOf(nodeMap).values()].filter((kind) => {
		const node = nodeMap.nodes.get(kind);
		return node instanceof AssembledPunctuation && nodelessExtrasRun.test(node.text);
	});
}

function continuesLine(nodeMap: NodeMap, kind: string): boolean {
	const node = nodeMap.nodes.get(kind);
	if (!(node instanceof AssembledPattern) || node.textPattern === undefined) return false;
	const dfa = patternDfa(node.textPattern);
	return dfa !== undefined && requiresNonSpace(dfa) && endsWithLineBreak(dfa);
}

export function continuationTriviaKinds(nodeMap: NodeMap): string[] {
	const kinds = triviaKinds(nodeMap);
	const direct = [...kinds].filter((kind) => continuesLine(nodeMap, kind));
	const byDefault = [...kinds].flatMap((kind) => {
		const node = nodeMap.nodes.get(kind);
		const arm = node instanceof AssembledSupertype ? node.defaultVariantSubtype : undefined;
		return node instanceof AssembledSupertype && arm !== undefined && continuesLine(nodeMap, storageKindOfRef(arm.node))
			? node.subtypeNames
			: [];
	});
	return [...new Set([...direct, ...byDefault])].filter((kind) => kinds.has(kind));
}

export interface WhitespaceTrivia {
	readonly run: RegExp;
	readonly kindIdByText: ReadonlyMap<string, number>;
}

export function whitespaceTrivia(nodeMap: NodeMap): WhitespaceTrivia | undefined {
	const run = lexicalExtrasRun(nodeMap);
	if (run === undefined) return undefined;
	const kindIdByText = new Map<string, number>();
	for (const kind of whitespaceTriviaKinds(nodeMap)) {
		const node = nodeMap.nodes.get(kind);
		if (!(node instanceof AssembledPunctuation) || node.kindId === undefined) {
			throw new Error(`trivia: whitespace kind '${kind}' has no literal and kind id`);
		}
		kindIdByText.set(node.text, node.kindId);
	}
	return { run, kindIdByText };
}

export function lineTerminated(nodeMap: NodeMap, kind: string): boolean | undefined {
	let byKind = lineTerminatedByNodeMap.get(nodeMap);
	if (byKind === undefined) lineTerminatedByNodeMap.set(nodeMap, (byKind = new Map()));
	if (!byKind.has(kind)) byKind.set(kind, verdict(resolvedLineEnds(nodeMap, kind, new Set())));
	return byKind.get(kind);
}

type ResolvedLineEnd = 'open' | 'closed' | 'empty' | 'unknown';

function resolvedLineEnds(nodeMap: NodeMap, kind: string, seen: ReadonlySet<string>): ResolvedLineEnd[] {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined || seen.has(kind)) return ['unknown'];
	const within = new Set([...seen, kind]);
	return node.lineEnds.flatMap((end) => (typeof end === 'string' ? [end] : resolvedLineEnds(nodeMap, end.symbol, within)));
}

function verdict(ends: readonly ResolvedLineEnd[]): boolean | undefined {
	if (ends.includes('closed') || ends.includes('empty')) return false;
	if (ends.includes('unknown')) return undefined;
	return ends.length > 0;
}

const referenceWalker = new RuleWalker<RenderRule>();

export function stampTriviaInterior(nodeMap: NodeMap): void {
	const referencers = new Map<string, Set<string>>();
	for (const [kind, rule] of Object.entries(nodeMap.normalizedRules ?? {})) {
		referenceWalker.fold(rule, undefined, (_, r) => {
			if (r.type === SYMBOL && r.name !== kind) referencers.set(r.name, (referencers.get(r.name) ?? new Set()).add(kind));
			return undefined;
		});
	}
	const interior = new Set(triviaKinds(nodeMap));
	for (let grew = true; grew; ) {
		grew = false;
		for (const [kind, from] of referencers) {
			if (interior.has(kind) || ![...from].every((referencer) => interior.has(referencer))) continue;
			interior.add(kind);
			grew = true;
		}
	}
	for (const kind of interior) {
		const node = nodeMap.nodes.get(kind);
		if (node !== undefined) node.triviaInterior = true;
	}
}

export interface EmptyForm {
	readonly typeName: string;
	readonly gaps: readonly string[];
}

const emptyFormsByNodeMap = new WeakMap<NodeMap, ReadonlyMap<string, EmptyForm>>();

export function emptyForms(nodeMap: NodeMap): ReadonlyMap<string, EmptyForm> {
	const cached = emptyFormsByNodeMap.get(nodeMap);
	if (cached !== undefined) return cached;
	const typeNames = new Set([...nodeMap.nodes.values()].map((node) => node.typeName));
	const forms = new Map<string, EmptyForm>();
	for (const [kind, node] of nodeMap.nodes) {
		if (!(node instanceof AbstractAssembledCompound) || node.factoryName === undefined) continue;
		const gaps = node.innerGaps.map((gap) => gap.key);
		if (gaps.length === 0) continue;
		const typeName = `Empty${node.typeName}`;
		if (typeNames.has(typeName)) throw new Error(`trivia: '${kind}' would name its empty form ${typeName}, which a kind already names`);
		forms.set(kind, { typeName, gaps });
	}
	emptyFormsByNodeMap.set(nodeMap, forms);
	return forms;
}

export function innerGapsKeyed(nodeMap: NodeMap): boolean {
	return [...emptyForms(nodeMap).values()].some((form) => form.gaps.length > 1);
}

const lineTerminatedKindsByNodeMap = new WeakMap<NodeMap, ReadonlySet<string>>();

export function lineTerminatedKinds(nodeMap: NodeMap): ReadonlySet<string> {
	const cached = lineTerminatedKindsByNodeMap.get(nodeMap);
	if (cached !== undefined) return cached;
	const outermost = outermostEnds(nodeMap, (kind) => lineTerminated(nodeMap, kind) === true);
	lineTerminatedKindsByNodeMap.set(nodeMap, outermost);
	return outermost;
}

export function lineBreakTerminated(nodeMap: NodeMap, kind: string): boolean {
	return endsInNewlineRole(nodeMap, kind, new Set());
}

function endsInNewlineRole(nodeMap: NodeMap, kind: string, seen: ReadonlySet<string>): boolean {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined || seen.has(kind)) return false;
	if (node.externalRole === 'newline') return true;
	const within = new Set([...seen, kind]);
	const ends = node.lineEnds;
	return ends.length > 0 && ends.every((end) => typeof end !== 'string' && endsInNewlineRole(nodeMap, end.symbol, within));
}

const lineBreakTerminatedKindsByNodeMap = new WeakMap<NodeMap, ReadonlySet<string>>();

export function lineBreakTerminatedKinds(nodeMap: NodeMap): ReadonlySet<string> {
	const cached = lineBreakTerminatedKindsByNodeMap.get(nodeMap);
	if (cached !== undefined) return cached;
	const outermost = outermostEnds(nodeMap, (kind) => lineBreakTerminated(nodeMap, kind));
	lineBreakTerminatedKindsByNodeMap.set(nodeMap, outermost);
	return outermost;
}

function outermostEnds(nodeMap: NodeMap, holds: (kind: string) => boolean): ReadonlySet<string> {
	const holding = [...nodeMap.nodes.keys()].filter(holds);
	const ending = new Set<string>();
	const visit = (kind: string): void => {
		for (const end of nodeMap.nodes.get(kind)?.lineEnds ?? []) {
			if (typeof end === 'string' || ending.has(end.symbol)) continue;
			ending.add(end.symbol);
			visit(end.symbol);
		}
	};
	holding.forEach(visit);
	return new Set(holding.filter((kind) => !ending.has(kind)));
}
