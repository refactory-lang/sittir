import type { BuiltParser } from '../../../dsl/symbol-table.ts';
import type { GrammarRule } from '../../../grammar-shapes/grammar-json.ts';
import { canonical } from '../../../transpile/evaluate-for-derivation.ts';
import type { ExternalRole } from '../../../types/ir.ts';
import type { AnyRule, Rule, RuleId } from '../../../types/rule.ts';
import { ruleIdsWithin } from '../../../dsl/rule-attrs.ts';
import { sha256 } from '../../../util/content-hash.ts';
import type { NodeMap } from '../../types.ts';
import { lineEndingsOf } from '../line-endings.ts';
import type { CharSet } from '../pattern-automaton.ts';
import { lineTerminated } from '../trivia.ts';
import { SeamClosure, type ConcreteSeam } from './closure.ts';
import {
	joinSeamsFileOf,
	unprovenArms,
	type BlockedJoinCheck,
	type JoinPairRecord,
	type JoinProof,
	type JoinSeamFacts,
	type JoinSeamRecord,
	type JoinSeamsFile,
	type JoinStamp
} from './file.ts';
import { forEachSeamKey, GrammarView, type ViewRule } from './grammar-view.ts';
import { type Context, type Instance, InstanceBuilder, render } from './instances.ts';
import { errorNear, leavesOf, ParseOracle, sameTree } from './oracle.ts';
import { readParserTables } from './parser-tables.ts';
import { isRuleIdUnder } from '../../rule-catalog.ts';
import { alignRuleIds, rebasedIdsOf } from './rule-ids.ts';
import { SeamWalk } from './walk.ts';

type JoinVerdict = 'differs' | 'same' | 'unbuildable' | 'tight-only' | 'inseparable';

interface JoinCheck {
	readonly seam: string;
	readonly state: number;
	readonly symbol: number;
	readonly previous: string;
	readonly next: string;
	verdict: JoinVerdict;
	reason?: string;
}

export interface JoinSeamInput {
	readonly parser: BuiltParser;
	readonly evaluated: Readonly<Record<string, Rule<'evaluate'>>>;
	readonly externalRoles: ReadonlyMap<string, ExternalRole['role']>;
	readonly externalBodies: ReadonlyMap<string, ViewRule>;
	readonly wordMatcher: RegExp | undefined;
	readonly whitespace: CharSet;
	readonly lineEnds: ReadonlySet<string>;
	readonly spliced: (name: string) => boolean;
}

export type JoinInputs = Pick<JoinSeamInput, 'externalRoles' | 'externalBodies' | 'wordMatcher' | 'whitespace' | 'lineEnds'>;

export interface JoinArm {
	readonly previous: boolean;
	readonly next: boolean;
}

export interface JoinFacts {
	readonly joinsNext: ReadonlySet<RuleId>;
	readonly joinsPrevious: ReadonlySet<RuleId>;
	readonly joinsNextKinds: ReadonlySet<string>;
	readonly pairs: readonly string[];
	readonly seamIds: ReadonlyMap<string, ReadonlySet<RuleId>>;
}

export interface ResolvedJoins extends JoinFacts {
	readonly unmapped: readonly string[];
}

export const NO_JOINS: JoinFacts = {
	joinsNext: new Set(),
	joinsPrevious: new Set(),
	joinsNextKinds: new Set(),
	pairs: [],
	seamIds: new Map()
};

export function unreachedJoinSeams(
	joins: JoinFacts,
	rules: Readonly<Record<string, AnyRule>>,
	slots: Iterable<{ readonly sourceRuleIds?: readonly RuleId[] }>
): string[] {
	const reached = new Set(Object.values(rules).flatMap(ruleIdsWithin));
	const slotIds = [...slots].map((slot) => slot.sourceRuleIds ?? []);
	for (const ids of slotIds) for (const id of ids) reached.add(id);
	const covers = (slot: readonly RuleId[], ids: ReadonlySet<RuleId>): boolean => {
		const arm = joinArmOf(joins, ids);
		const own = joinArmOf(joins, slot);
		return (
			(own.previous || !arm.previous) &&
			(own.next || !arm.next) &&
			[...ids].some((id) => slot.some((ancestor) => isRuleIdUnder(id, ancestor)))
		);
	};
	const held = (ids: ReadonlySet<RuleId>): boolean =>
		[...ids].some((id) => reached.has(id)) || slotIds.some((slot) => covers(slot, ids));
	return [...joins.seamIds].filter(([, ids]) => !held(ids)).map(([seam]) => seam);
}

export function joinArmOf(joins: JoinFacts, ids: Iterable<RuleId | undefined>): JoinArm {
	let previous = false;
	let next = false;
	for (const id of ids) {
		if (id === undefined) continue;
		previous ||= joins.joinsPrevious.has(id);
		next ||= joins.joinsNext.has(id);
	}
	return { previous, next };
}

export function ruleJoinArm(
	joins: JoinFacts,
	rule: { readonly id?: RuleId; readonly absorbedIds?: readonly RuleId[] }
): JoinArm {
	return joinArmOf(joins, [rule.id, ...(rule.absorbedIds ?? [])]);
}

interface SeamArms {
	readonly joinsNext: ReadonlySet<string>;
	readonly joinsPrevious: ReadonlySet<string>;
	readonly pairs: ReadonlySet<string>;
}

const PRINTABLE_FIRST = 0x21;
const PRINTABLE_LAST = 0x7e;
const MAX_RESPELLINGS = 16;
const FORK_REASON = 'the target is a fork state; the instance lexed the token in another state';

function kindsJoiningNext(view: GrammarView, joining: ReadonlySet<number>): Set<string> {
	const joins = (rule: GrammarRule): boolean =>
		view
			.lastLiterals(rule)
			.some((literal) => view.isPunct(literal) && view.literalIds(literal).some((id) => joining.has(id)));
	const out = new Set<string>();
	for (const id of joining) if (view.tables.named[id] === 0) out.add(view.tables.names[id]!);
	for (const [name, rule] of Object.entries(view.rules)) if (!view.isLexical(name) && joins(rule)) out.add(name);
	for (const rule of view.keyOf.keys()) if (rule.type === 'ALIAS' && joins(rule.content)) out.add(rule.value);
	return out;
}

export function joinSeamInputOf(
	nodeMap: NodeMap,
	evaluated: Readonly<Record<string, Rule<'evaluate'>>>,
	parser: BuiltParser
): JoinSeamInput {
	const externalRoles = new Map<string, ExternalRole['role']>();
	for (const [kind, node] of nodeMap.nodes)
		if (node.externalRole !== undefined) externalRoles.set(kind, node.externalRole);
	const externalBodies = new Map<string, ViewRule>();
	for (const external of parser.grammar.externals ?? []) {
		if (external.type !== 'SYMBOL') continue;
		const body = evaluated[external.name];
		if (body !== undefined) externalBodies.set(external.name, body);
	}
	return {
		parser,
		evaluated,
		externalRoles,
		externalBodies,
		wordMatcher: nodeMap.wordMatcher,
		whitespace: lineEndingsOf(nodeMap).whitespace,
		lineEnds: new Set([...nodeMap.nodes.keys()].filter((kind) => lineTerminated(nodeMap, kind) === true)),
		spliced: (name) => !nodeMap.nodes.has(name)
	};
}

export function joinInputsHash(inputs: JoinInputs): string {
	return sha256(
		JSON.stringify(
			canonical({
				externalRoles: inputs.externalRoles,
				externalBodies: inputs.externalBodies,
				wordMatcher: inputs.wordMatcher === undefined ? null : [inputs.wordMatcher.source, inputs.wordMatcher.flags],
				whitespace: inputs.whitespace.ranges,
				lineEnds: inputs.lineEnds
			})
		)
	);
}

export function joinStampOf(input: JoinSeamInput): JoinStamp {
	return { parser: input.parser.record, inputs: joinInputsHash(input) };
}

export function deriveJoinSeams(input: JoinSeamInput): JoinSeamsFile {
	const { grammar, language } = input.parser;
	const startRule = Object.keys(grammar.rules)[0]!;
	const tables = readParserTables(language.language, startRule);
	const view = new GrammarView(
		grammar,
		tables,
		{ roles: input.externalRoles, bodies: input.externalBodies },
		input.wordMatcher,
		input.whitespace,
		(kind) => input.lineEnds.has(kind)
	);
	const walk = new SeamWalk(view);
	walk.run();
	const closure = new SeamClosure(walk);
	const seams = closure
		.concreteSeams()
		.filter((seam) => !view.extrasOnly.has(seam.key.slice(0, seam.key.indexOf(':'))));
	const builder = new InstanceBuilder(view, walk, closure);
	const punctChars: string[] = [];
	for (let code = PRINTABLE_FIRST; code <= PRINTABLE_LAST; code++)
		if (view.isPunct(String.fromCharCode(code))) punctChars.push(String.fromCharCode(code));
	const literalTexts = new Map<number, string[]>();
	const namedTerminals = new Map<number, number[]>();
	const textOf = (symbol: number): string => walk.joinText.get(symbol) ?? tables.names[symbol]!;
	const joins = (state: number, previous: string, next: string): boolean => {
		let literals = literalTexts.get(state);
		if (literals === undefined) {
			literals = [...tables.valid[state]!]
				.filter((id) => tables.isTerminal(id) && tables.named[id] === 0 && tables.visible[id] === 1)
				.map((id) => tables.names[id]!);
			literalTexts.set(state, literals);
		}
		if (
			literals.some(
				(literal) =>
					view.isPunct(literal) &&
					literal.length > previous.length &&
					literal.startsWith(previous) &&
					literal[previous.length] === next[0]
			)
		)
			return true;
		let named = namedTerminals.get(state);
		if (named === undefined) {
			named = [...tables.valid[state]!].filter(
				(id) => tables.isTerminal(id) && (tables.named[id] === 1 || tables.visible[id] === 0)
			);
			namedTerminals.set(state, named);
		}
		const joined = previous + next;
		return named.some((id) => view.lexesLonger(id, joined, previous.length));
	};
	const nextTokens = (seam: ConcreteSeam): string[] => {
		const out = new Set(view.firstLiterals(seam.node).filter((literal) => view.isPunct(literal)));
		for (const leaf of builder.firstLeaves(seam.node)) {
			for (const char of punctChars) {
				const sample = view.sampleStartingWith(leaf, char);
				if (sample !== undefined) out.add(sample);
			}
		}
		return [...out];
	};
	const checks: JoinCheck[] = [];
	const bySeam = new Map<JoinCheck, ConcreteSeam>();
	for (const seam of seams) {
		const nexts = nextTokens(seam);
		if (nexts.length === 0) continue;
		for (const pair of seam.pairs) {
			const state = walk.sourceOfPair(pair);
			const symbol = walk.symbolOfPair(pair);
			const previous = textOf(symbol);
			for (const next of nexts) {
				if (!joins(state, previous, next)) continue;
				const check: JoinCheck = { seam: seam.key, state, symbol, previous, next, verdict: 'unbuildable' };
				checks.push(check);
				bySeam.set(check, seam);
			}
		}
	}
	using oracle = new ParseOracle(language);
	const resolved = new Map<string, 'differs' | 'same'>();
	const checkKey = (seam: string, state: number, symbol: number, next: string): string =>
		`${seam}|${state}|${symbol}|${next}`;
	const attempt = (check: JoinCheck, override?: Context, respell?: readonly [number, string]): void => {
		check.reason = undefined;
		const seam = bySeam.get(check)!;
		const sighting = seam.sighting(walk.pairKey(check.state, check.symbol));
		if (sighting === undefined) return fail(check, 'no sighting');
		const built = builder.build(sighting, seam.node, check.next, override);
		if (typeof built === 'string') return fail(check, built);
		const instance: Instance =
			respell === undefined
				? built
				: {
						seamAt: built.seamAt,
						tokens: built.tokens.map((token, k) => (k === respell[0] ? { ...token, text: respell[1] } : token))
					};
		if (instance.tokens[instance.seamAt]?.immediate === true) {
			check.verdict = 'tight-only';
			check.reason = 'the next token is immediate';
			return;
		}
		const missing = instance.tokens.find((token) => token.text === null);
		if (missing !== undefined) return fail(check, `token without text: ${tables.names[missing.symbol] ?? '?'}`);
		const spaced = render(instance.tokens, instance.seamAt, ' ');
		const tight = render(instance.tokens, instance.seamAt, '');
		if (spaced === null || tight === null) return fail(check, 'seam not renderable');
		using spacedTree = oracle.parse(spaced.text);
		const leaves = leavesOf(spacedTree.root);
		const absorbing = leaves.find(
			(leaf) =>
				leaf.startIndex <= spaced.seam &&
				leaf.endIndex > spaced.seam &&
				(leaf.startIndex === spaced.seam || leaf.startIndex === spaced.seam - check.previous.length)
		);
		if (absorbing !== undefined) {
			check.verdict = 'inseparable';
			check.reason =
				absorbing.startIndex === spaced.seam
					? 'the space lexes into the next token'
					: 'the space lexes into the previous token';
			return;
		}
		if (spacedTree.root.hasError)
			return fail(
				check,
				errorNear(spacedTree.root, spaced.seam, spaced.seam + 1)
					? 'spaced text has a parse error at the seam'
					: 'spaced text has a parse error away from the seam'
			);
		const at = leaves.findIndex((leaf) => leaf.endIndex === spaced.seam);
		const before = leaves[at];
		const after = leaves[at + 1];
		if (
			before === undefined ||
			after === undefined ||
			before.text !== check.previous ||
			after.startIndex !== spaced.seam + 1 ||
			after.text !== check.next
		)
			return fail(check, 'seam tokens not where built');
		using tightTree = oracle.parse(tight.text);
		const same = !tightTree.root.hasError && sameTree(spacedTree.root, tightTree.root);
		const hits = oracle.lexStatesAt(spaced.text, leaves[at - 1]?.endIndex ?? 0, tables.names[check.symbol]!);
		hits.add(before.parseState);
		for (const hit of hits) {
			const key = checkKey(check.seam, hit, check.symbol, check.next);
			if (!resolved.has(key)) resolved.set(key, same ? 'same' : 'differs');
		}
		const own = resolved.get(checkKey(check.seam, check.state, check.symbol, check.next));
		if (hits.has(check.state) || own !== undefined)
			check.verdict = hits.has(check.state) ? (same ? 'same' : 'differs') : own!;
		else fail(check, walk.forkStates.has(check.state) ? FORK_REASON : 'the instance lexed the token in another state');
	};
	for (const check of checks) {
		const prior = resolved.get(checkKey(check.seam, check.state, check.symbol, check.next));
		if (prior !== undefined) {
			check.verdict = prior;
			continue;
		}
		attempt(check);
		if (check.verdict !== 'unbuildable' || check.reason === FORK_REASON) continue;
		const first = check.reason;
		const seam = bySeam.get(check)!;
		const sighting = seam.sighting(walk.pairKey(check.state, check.symbol));
		for (const context of sighting === undefined ? [] : builder.alternativeContexts(sighting)) {
			attempt(check, context);
			if (check.verdict !== 'unbuildable') break;
		}
		if (check.verdict === 'unbuildable' && sighting !== undefined) {
			const base = builder.build(sighting, seam.node, check.next);
			let tries = 0;
			for (
				let k = 0;
				typeof base !== 'string' &&
				k < base.tokens.length &&
				check.verdict === 'unbuildable' &&
				tries < MAX_RESPELLINGS;
				k++
			) {
				if (k === base.seamAt || k === base.seamAt - 1) continue;
				for (const spelling of base.tokens[k]!.spellings) {
					tries++;
					attempt(check, undefined, [k, spelling]);
					if (check.verdict !== 'unbuildable' || tries >= MAX_RESPELLINGS) break;
				}
			}
		}
		if (check.verdict === 'unbuildable') check.reason = first;
	}
	const pairOf = (check: JoinCheck): string => `${check.previous.at(-1)}${check.next[0]}`;
	const kept = checks.filter((check) => check.verdict === 'differs' || check.verdict === 'unbuildable');
	const pairKeys = (list: readonly JoinCheck[]): Set<string> =>
		new Set(list.map((check) => `${check.state}|${check.symbol}`));
	const joinsNextOf = (pairs: ReadonlySet<string>): Set<string> => {
		const out = new Set<string>();
		for (const seam of seams) {
			const symbols = view
				.firstLiterals(seam.node)
				.filter((literal) => view.isPunct(literal))
				.flatMap((literal) => view.literalIds(literal));
			if (symbols.length === 0) continue;
			for (const state of seam.lexed) {
				if (!symbols.some((symbol) => pairs.has(`${state}|${symbol}`))) continue;
				out.add(seam.key);
				break;
			}
		}
		return out;
	};
	const armsOf = (list: readonly JoinCheck[]): SeamArms => ({
		joinsNext: joinsNextOf(pairKeys(list)),
		joinsPrevious: new Set(list.map((check) => check.seam)),
		pairs: new Set(list.map(pairOf))
	});
	const keptArms = armsOf(kept);
	const provenArms = armsOf(checks.filter((check) => check.verdict === 'differs'));
	const proofOf = (arm: keyof SeamArms, key: string): JoinProof => (provenArms[arm].has(key) ? 'proven' : 'unproven');
	const armed = [...new Set([...keptArms.joinsPrevious, ...keptArms.joinsNext])].map(
		(seam): JoinSeamRecord => ({
			seam,
			...(keptArms.joinsPrevious.has(seam) ? { previous: proofOf('joinsPrevious', seam) } : {}),
			...(keptArms.joinsNext.has(seam) ? { next: proofOf('joinsNext', seam) } : {})
		})
	);
	const pairs = [...keptArms.pairs].map((pair): JoinPairRecord => ({ pair, proof: proofOf('pairs', pair) }));
	const unproven = unprovenArms({ seams: armed, pairs });
	const unprovenPrevious = new Set(unproven.previous);
	const unprovenPairs = new Set(unproven.pairs);
	const blocked = checks
		.filter((check) => check.verdict === 'unbuildable' && (unprovenPrevious.has(check.seam) || unprovenPairs.has(pairOf(check))))
		.map(
			({ seam, state, previous, next, reason }): BlockedJoinCheck => ({
				seam,
				state,
				previous,
				next,
				...(reason === undefined ? {} : { reason })
			})
		);
	return joinSeamsFileOf(joinStampOf(input), {
		seams: armed,
		pairs,
		joinsNextKinds: [...kindsJoiningNext(view, new Set(kept.map((check) => check.symbol)))],
		blocked
	});
}

export function joinFactsOf(facts: JoinSeamFacts, input: Pick<JoinSeamInput, 'parser' | 'evaluated' | 'spliced'>): ResolvedJoins {
	const rules = input.parser.grammar.rules;
	const alignment = alignRuleIds(rules, input.evaluated);
	const idsOfKey = new Map<string, Set<RuleId>>();
	forEachSeamKey(rules, (rule, _, key) => {
		const ids = alignment.idsOf.get(rule);
		if (ids === undefined) return;
		let set = idsOfKey.get(key);
		if (set === undefined) idsOfKey.set(key, (set = new Set()));
		for (const id of ids) set.add(id);
	});
	const unmapped = [...alignment.unaligned];
	const rebased = rebasedIdsOf(input.evaluated, input.spliced);
	const seamIds = new Map<string, ReadonlySet<RuleId>>();
	const idsOf = (keys: readonly string[]): Set<RuleId> => {
		const out = new Set<RuleId>();
		for (const key of keys) {
			const ids = idsOfKey.get(key);
			if (ids === undefined) {
				unmapped.push(`${key}: no rule id`);
				continue;
			}
			let all = seamIds.get(key);
			if (all === undefined) seamIds.set(key, (all = new Set([...ids].flatMap((id) => [id, ...rebased(id)]))));
			for (const id of all) out.add(id);
		}
		return out;
	};
	const joinsNext = idsOf(facts.seams.filter((record) => record.next !== undefined).map((record) => record.seam));
	const joinsPrevious = idsOf(facts.seams.filter((record) => record.previous !== undefined).map((record) => record.seam));
	return {
		joinsNext,
		joinsPrevious,
		joinsNextKinds: new Set(facts.joinsNextKinds),
		pairs: facts.pairs.map((record) => record.pair),
		seamIds,
		unmapped
	};
}

function fail(check: JoinCheck, reason: string): void {
	check.verdict = 'unbuildable';
	check.reason = reason;
}
