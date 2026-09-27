import type { NodeMap } from '../types.ts';
import type { RenderRule } from '../../types/rule.ts';
import { AbstractAssembledCompound, AssembledSupertype, isNodeRef, storageKindOfRef } from './node-map.ts';
import { extrasClosure } from '../../dsl/extras.ts';

const triviaKindsByNodeMap = new WeakMap<NodeMap, ReadonlySet<string>>();
export const COMMENT_IR_KEY = 'comment';

export interface TriviaForm {
	readonly kind: string;
	readonly open: string;
	readonly close: string;
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
	return {
		kind: arm.kind,
		open: literalRun(members).join(''),
		close: literalRun([...members].reverse()).reverse().join('')
	};
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
