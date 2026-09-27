import type { NodeMap } from '../types.ts';
import {
	AbstractAssembledCompound,
	AssembledPolymorph,
	type AssembledNode,
	type FullFormAffix,
	AssembledPunctuation,
	AssembledSupertype,
	isNodeRef,
	storageKindOfRef
} from './node-map.ts';
import { anchoredLeafRegex, leadingRegex } from './leaf-pattern.ts';
import { declaresWhitespace, whitespaceSymbolsOf } from './whitespace-arms.ts';
import { escapeRegexLiteral } from '../../util/word-matcher.ts';
import { SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { extrasClosure } from '../../dsl/extras.ts';
import { ruleListParts } from '../../dsl/rule-patterns.ts';

const triviaKindsByNodeMap = new WeakMap<NodeMap, ReadonlySet<string>>();
export const COMMENT_IR_KEY = 'comment';

export interface TriviaSibling {
	readonly lead: RegExp;
	readonly builder: string;
}

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

export function siblingLeads(nodeMap: NodeMap, node: AssembledNode): TriviaSibling[] {
	if (!(node instanceof AssembledPolymorph)) return [];
	return node.arms.flatMap((ref) => {
		if (ref.type !== SYMBOL || ref.annotations?.default === true) return [];
		const arm = nodeMap.nodes.get(ref.name);
		if (arm?.irKey === undefined) throw new Error(`trivia: '${node.kind}' arm '${ref.name}' has no builder`);
		const leads = leadSources(nodeMap, ref.name, new Set());
		return [{ lead: leadingRegex(ref.name, leads.join('|')), builder: `ir.${arm.irKey}` }];
	});
}

function leadSources(nodeMap: NodeMap, kind: string, seen: ReadonlySet<string>): string[] {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined || seen.has(kind)) throw new Error(`trivia: cannot read how '${kind}' starts`);
	const within = new Set([...seen, kind]);
	return node.leadingTerminals.flatMap((terminal) => {
		if (terminal === 'empty') throw new Error(`trivia: '${kind}' can start empty, so any text could read as it`);
		if ('symbol' in terminal) return leadSources(nodeMap, terminal.symbol, within);
		return ['literal' in terminal ? escapeRegexLiteral(terminal.literal) : `(?:${terminal.pattern})`];
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
	const { literals, patterns: sources } = ruleListParts(nodeMap.extras ?? []);
	const patterns = [...sources, ...literals.map(escapeRegexLiteral)];
	if (patterns.length === 0) return undefined;
	return anchoredLeafRegex('extras', `(?:${patterns.map((pattern) => `(?:${pattern})`).join('|')})+`);
}

export function whitespaceTriviaKinds(nodeMap: NodeMap): string[] {
	const extrasRun = lexicalExtrasRun(nodeMap);
	if (extrasRun === undefined || !declaresWhitespace(nodeMap)) return [];
	return [...whitespaceSymbolsOf(nodeMap).values()].filter((kind) => {
		const node = nodeMap.nodes.get(kind);
		return node instanceof AssembledPunctuation && extrasRun.test(node.text);
	});
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
