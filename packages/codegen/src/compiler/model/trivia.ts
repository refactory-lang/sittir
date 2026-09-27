import type { NodeMap } from '../types.ts';
import type { RenderRule } from '../../types/rule.ts';
import { AbstractAssembledCompound, AssembledPolymorph, AssembledSupertype, isNodeRef, storageKindOfRef } from './node-map.ts';
import { leadingRegex } from './leaf-pattern.ts';
import { escapeRegexLiteral } from '../../util/word-matcher.ts';
import { SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { extrasClosure } from '../../dsl/extras.ts';

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
		comment instanceof AssembledSupertype ? comment.subtypes.filter(isNodeRef).find((ref) => ref.default === true) : undefined;
	const arm = defaultRef === undefined ? comment : nodeMap.nodes.get(storageKindOfRef(defaultRef.node));
	if (!(arm instanceof AbstractAssembledCompound) || arm.renderRule.type !== 'SEQ') {
		throw new Error(`trivia: ir.${COMMENT_IR_KEY} has no default arm whose rule is a sequence to take delimiters from`);
	}
	const members = arm.renderRule.members;
	const literalRun = (from: readonly RenderRule[]): string[] => {
		const run: string[] = [];
		for (const member of from) {
			if (member.type !== 'STRING') break;
			run.push(member.value);
		}
		return run;
	};
	if (arm.fromFunctionName === undefined) throw new Error(`trivia: the default comment kind '${arm.kind}' has no coercer`);
	return {
		kind: arm.kind,
		open: literalRun(members).join(''),
		close: literalRun([...members].reverse()).reverse().join(''),
		coercer: arm.fromFunctionName,
		siblings: arm instanceof AssembledPolymorph ? siblingArms(nodeMap, arm) : []
	};
}

function siblingArms(nodeMap: NodeMap, polymorph: AssembledPolymorph): TriviaSibling[] {
	return polymorph.arms.flatMap((ref) => {
		if (ref.type !== SYMBOL || ref.annotations?.default === true) return [];
		const node = nodeMap.nodes.get(ref.name);
		if (node?.irKey === undefined) throw new Error(`trivia: '${polymorph.kind}' arm '${ref.name}' has no builder`);
		const leads = leadSources(nodeMap, ref.name, new Set());
		return [{ lead: leadingRegex(ref.name, leads.join('|')), builder: `ir.${node.irKey}` }];
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
		[...(nodeMap.extras ?? [])].filter((kind) => nodeMap.nodes.has(kind)),
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
