import type * as TS from 'web-tree-sitter';
import type { ConcreteSeam } from './closure.ts';
import type { WitnessKind } from './file.ts';
import {
	absorbedAt,
	errorNear,
	type LexEvent,
	leavesOf,
	lexStatesOf,
	memberBefore,
	ownerNode,
	type ParseOracle,
	sameTree,
	SEAM_SPACE,
	SPACE_IN_HIDDEN_TOKEN,
	SPACE_IS_PARSE_ERROR,
	spaceIsPadding
} from './oracle.ts';
import type { SeamWalk } from './walk.ts';

export type SpacedVerdict = 'same' | 'differs' | 'inseparable';

export interface SeamWitness {
	readonly seam: string;
	readonly previous: string;
	readonly next: string;
	readonly verdict: SpacedVerdict;
	readonly reason?: string;
	readonly after?: string;
	readonly witness: WitnessKind;
}

interface Outcome {
	readonly verdict: SpacedVerdict;
	readonly reason?: string;
}

function spacedOutcome(
	oracle: ParseOracle,
	source: string,
	original: TS.Node,
	at: number,
	next: TS.Node
): Outcome | undefined {
	const spaced = `${source.slice(0, at)}${SEAM_SPACE}${source.slice(at)}`;
	using tree = oracle.parse(spaced);
	const leaves = leavesOf(tree.root);
	const absorbed = absorbedAt(leaves, at);
	if (absorbed !== undefined) return { verdict: 'inseparable', reason: absorbed };
	if (tree.root.hasError)
		return errorNear(tree.root, at, at + 1) ? { verdict: 'inseparable', reason: SPACE_IS_PARSE_ERROR } : undefined;
	const moved = leaves.find((leaf) => leaf.startIndex === at + 1 && leaf.grammarType === next.grammarType);
	if (moved === undefined || !spaceIsPadding(oracle.lexEvents(spaced), at, moved))
		return { verdict: 'inseparable', reason: SPACE_IN_HIDDEN_TOKEN };
	return { verdict: sameTree(tree.root, original) ? 'same' : 'differs' };
}

export interface MergeWitness extends SeamWitness {
	readonly state: number;
	readonly symbol: number;
}

export interface CorpusWitnesses {
	readonly spaced: readonly SeamWitness[];
	readonly merged: readonly MergeWitness[];
}

const GAP = /^[ \t]+$/;

function mergedOutcome(oracle: ParseOracle, source: string, original: TS.Node, from: number, to: number): Outcome {
	using tree = oracle.parse(`${source.slice(0, from)}${source.slice(to)}`);
	if (tree.root.hasError) return { verdict: 'differs', reason: 'removing the space is a parse error' };
	return sameTree(tree.root, original) ? { verdict: 'same' } : { verdict: 'differs', reason: 'removing the space changes the parse' };
}

function byFirstName(
	seams: readonly ConcreteSeam[],
	firstNames: (seam: ConcreteSeam) => Iterable<string>
): (leaf: TS.Node) => ConcreteSeam[] {
	const index = new Map<string, Set<ConcreteSeam>>();
	for (const seam of seams)
		for (const name of firstNames(seam)) {
			let set = index.get(name);
			if (set === undefined) index.set(name, (set = new Set()));
			set.add(seam);
		}
	return (leaf) => [...new Set([...(index.get(leaf.type) ?? []), ...(index.get(leaf.grammarType) ?? [])])];
}

export function corpusWitnesses(
	sources: readonly string[],
	oracle: ParseOracle,
	walk: SeamWalk,
	spaceSeams: readonly ConcreteSeam[],
	seams: readonly ConcreteSeam[],
	firstNames: (seam: ConcreteSeam) => Iterable<string>
): CorpusWitnesses {
	const { tables } = walk.view;
	const spaceSeamsOf = byFirstName(spaceSeams, firstNames);
	const seamsOf = byFirstName(seams, firstNames);
	const terminalIds = (name: string): readonly number[] =>
		(tables.idsByName.get(name) ?? []).filter((id) => tables.isTerminal(id));
	const holds = (seam: ConcreteSeam, next: TS.Node): boolean => {
		const owner = seam.key.slice(0, seam.key.indexOf(':'));
		return !(tables.idsByName.get(owner) ?? []).some((id) => tables.visible[id] === 1) || ownerNode(seam.key, next) !== null;
	};
	const spaced: SeamWitness[] = [];
	const merged: MergeWitness[] = [];
	const seen = new Set<string>();
	const done = (seam: ConcreteSeam, after: string | undefined): boolean =>
		seen.has(`${seam.key}|${after}|inseparable`) && (seen.has(`${seam.key}|${after}|same`) || seen.has(`${seam.key}|${after}|differs`));
	for (const source of sources) {
		using tree = oracle.parse(source);
		if (tree.root.hasError) continue;
		const leaves = leavesOf(tree.root);
		const gapBefore = (k: number): string => source.slice(leaves[k - 1]!.endIndex, leaves[k]!.startIndex);
		const touching = leaves.flatMap((leaf, k) =>
			k > 0 && leaf.endIndex > leaf.startIndex && spaceSeamsOf(leaf).length > 0 ? [leaf] : []
		);
		const gapped = leaves.flatMap((leaf, k) =>
			k > 0 && leaf.endIndex > leaf.startIndex && GAP.test(gapBefore(k)) && seamsOf(leaf).length > 0 ? [k] : []
		);
		if (touching.length === 0 && gapped.length === 0) continue;
		const events = oracle.lexEvents(source);
		const endingAt = new Map<number, LexEvent[]>();
		for (const event of events) {
			const list = endingAt.get(event.end);
			if (list === undefined) endingAt.set(event.end, [event]);
			else list.push(event);
		}
		const previousAt = (at: number): LexEvent[] => (endingAt.get(at) ?? []).filter((event) => event.offset < at);
		for (const next of touching) {
			const at = next.startIndex;
			const nextStates = lexStatesOf(events, next.endIndex, at);
			const previousEvents = previousAt(at);
			const visiblePrevious = leaves.find((leaf) => leaf.endIndex === at && leaf.startIndex < at);
			const afterOf = (seam: ConcreteSeam): string | undefined =>
				visiblePrevious === undefined ? undefined : memberBefore(walk.view.rules, seam.key, visiblePrevious, next);
			const matched = spaceSeamsOf(next).filter(
				(seam) =>
					holds(seam, next) &&
					!done(seam, afterOf(seam)) &&
					[...nextStates].some((state) => seam.lexed.has(state)) &&
					previousEvents.some((event) =>
						terminalIds(event.symbol).some((id) => seam.pairs.has(walk.pairKey(event.state, id)))
					)
			);
			if (matched.length === 0) continue;
			const outcome = spacedOutcome(oracle, source, tree.root, at, next);
			if (outcome === undefined) continue;
			const previous = visiblePrevious?.text ?? source.slice(previousEvents[0]!.offset, at);
			for (const seam of matched) {
				const after = afterOf(seam);
				const key = `${seam.key}|${after}|${outcome.verdict}`;
				if (seen.has(key)) continue;
				seen.add(key);
				spaced.push({ seam: seam.key, previous, next: next.text, ...outcome, ...(after === undefined ? {} : { after }), witness: 'corpus' });
			}
		}
		for (const k of gapped) {
			const previous = leaves[k - 1]!;
			const next = leaves[k]!;
			const nextStates = lexStatesOf(events, next.endIndex, previous.endIndex);
			if (nextStates.size === 0) continue;
			const pairs: (readonly [ConcreteSeam, number, number])[] = [];
			for (const seam of seamsOf(next)) {
				if (!holds(seam, next) || ![...nextStates].some((state) => seam.lexed.has(state))) continue;
				for (const event of previousAt(previous.endIndex))
					for (const id of terminalIds(event.symbol))
						if (seam.pairs.has(walk.pairKey(event.state, id))) pairs.push([seam, event.state, id]);
			}
			const join = `${previous.text.at(-1)}${next.text[0]}`;
			const fresh = pairs.filter(([seam, state, id]) => !seen.has(`${seam.key}|${state}|${id}|${join}`));
			if (fresh.length === 0) continue;
			const outcome = mergedOutcome(oracle, source, tree.root, previous.endIndex, next.startIndex);
			for (const [seam, state, symbol] of fresh) {
				seen.add(`${seam.key}|${state}|${symbol}|${join}`);
				const after = memberBefore(walk.view.rules, seam.key, previous, next);
				merged.push({ seam: seam.key, state, symbol, previous: previous.text, next: next.text, ...outcome, ...(after === undefined ? {} : { after }), witness: 'corpus' });
			}
		}
	}
	return { spaced, merged };
}
