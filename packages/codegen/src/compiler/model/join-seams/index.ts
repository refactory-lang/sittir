import { existsSync } from 'node:fs';
import { corpusDir, loadCorpusEntries } from '../../../corpus.ts';
import { collectGeneratedKindEntries, type BuiltParser, type GeneratedIdTables } from '../../../dsl/symbol-table.ts';
import type { GrammarRule } from '../../../grammar-shapes/grammar-json.ts';
import { canonical } from '../../../transpile/evaluate-for-derivation.ts';
import type { ExternalRole } from '../../../types/ir.ts';
import type { AnyRule, Rule, RuleId } from '../../../types/rule.ts';
import { ownRuleIds, ruleIdsWithin } from '../../../dsl/rule-attrs.ts';
import { sha256 } from '../../../util/content-hash.ts';
import { compareOrdinal } from '../../../emitters/shared.ts';
import type { NodeMap } from '../../types.ts';
import { lineEndingsOf } from '../line-endings.ts';
import type { CharSet } from '../pattern-automaton.ts';
import { lineTerminated } from '../trivia.ts';
import { SeamClosure, type ConcreteSeam, type ConcreteSighting } from './closure.ts';
import { corpusWitnesses, type SeamWitness } from './corpus-witness.ts';
import {
	joinSeamsFileOf,
	unprovenArms,
	type BlockedJoinCheck,
	type JoinPairRecord,
	type JoinProof,
	type JoinSeamFacts,
	type JoinSeamRecord,
	type JoinSeamsFile,
	type DisagreeingSeamRecord,
	type SpacedWitness,
	type JoinStamp,
	type TightSeamRecord
} from './file.ts';
import { forEachSeamKey, GrammarView, type SpaceRead, type ViewRule } from './grammar-view.ts';
import { type Context, type Instance, InstanceBuilder, render } from './instances.ts';
import {
	absorbedAt,
	errorNear,
	leavesOf,
	lexStatesOf,
	memberBefore,
	ParseOracle,
	parsesAsBuilt,
	sameTree,
	SEAM_SPACE,
	SPACE_IN_HIDDEN_TOKEN,
	SPACE_IS_PARSE_ERROR,
	spaceIsPadding
} from './oracle.ts';
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
	readonly whitespace?: true;
	verdict: JoinVerdict;
	reason?: string;
	after?: string;
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
	readonly corpus: readonly string[];
	readonly tokenRules: ReadonlyMap<number, GrammarRule>;
}

export type JoinInputs = Pick<
	JoinSeamInput,
	'externalRoles' | 'externalBodies' | 'wordMatcher' | 'whitespace' | 'lineEnds' | 'corpus' | 'tokenRules'
>;

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
	readonly tight: ReadonlySet<RuleId>;
	readonly tightAfter: ReadonlyMap<RuleId, ReadonlySet<RuleId>>;
}

export interface ResolvedJoins extends JoinFacts {
	readonly unmapped: readonly string[];
}

export const NO_JOINS: JoinFacts = {
	joinsNext: new Set(),
	joinsPrevious: new Set(),
	joinsNextKinds: new Set(),
	pairs: [],
	seamIds: new Map(),
	tight: new Set(),
	tightAfter: new Map()
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

export function joinsOutsideLists(joins: JoinFacts, lists: ReadonlySet<RuleId> | undefined): JoinFacts {
	if (lists === undefined) return joins;
	const outside = (ids: ReadonlySet<RuleId>): ReadonlySet<RuleId> => new Set([...ids].filter((id) => !lists.has(id)));
	return { ...joins, joinsNext: outside(joins.joinsNext), joinsPrevious: outside(joins.joinsPrevious) };
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
	return joinArmOf(joins, ownRuleIds(rule));
}

interface SeamArms {
	readonly joinsNext: ReadonlySet<string>;
	readonly joinsPrevious: ReadonlySet<string>;
	readonly pairs: ReadonlySet<string>;
}

const PRINTABLE_FIRST = 0x21;
const PRINTABLE_LAST = 0x7e;
const MAX_RESPELLINGS = 16;
const MAX_SIGHTINGS = 16;
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
	idTables: GeneratedIdTables,
	grammar: string
): JoinSeamInput {
	const parser = idTables.parser;
	if (parser === null) throw new Error(`join seams: ${grammar} has no built parser to read its join seams from`);
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
		spliced: (name) => !nodeMap.nodes.has(name),
		corpus: corpusSourcesOf(grammar),
		tokenRules: tokenRulesOf(parser, idTables)
	};
}

function corpusSourcesOf(grammar: string): readonly string[] {
	if (existsSync(corpusDir(grammar))) return loadCorpusEntries(grammar).map((entry) => entry.source);
	console.warn(`[codegen] join seams: ${grammar} has no corpus at ${corpusDir(grammar)}; its seams are derived without corpus witnesses`);
	return [];
}

function tokenRulesOf(parser: BuiltParser, idTables: GeneratedIdTables): Map<number, GrammarRule> {
	const externals = new Set((parser.grammar.externals ?? []).flatMap((rule) => (rule.type === 'SYMBOL' ? [rule.name] : [])));
	const out = new Map<number, GrammarRule>();
	for (const entry of collectGeneratedKindEntries(idTables)) {
		if (entry.terminal !== true) continue;
		if (parser.grammar.rules[entry.kind] !== undefined || externals.has(entry.kind)) out.set(entry.id, { type: 'SYMBOL', name: entry.kind });
		else if (entry.literalText !== undefined) out.set(entry.id, { type: 'STRING', value: entry.literalText });
	}
	return out;
}

export function joinInputsHash(inputs: JoinInputs): string {
	return sha256(
		JSON.stringify(
			canonical({
				externalRoles: inputs.externalRoles,
				externalBodies: inputs.externalBodies,
				wordMatcher: inputs.wordMatcher === undefined ? null : [inputs.wordMatcher.source, inputs.wordMatcher.flags],
				whitespace: inputs.whitespace.ranges,
				lineEnds: inputs.lineEnds,
				corpus: inputs.corpus,
				tokenRules: inputs.tokenRules
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
		(kind) => input.lineEnds.has(kind),
		input.tokenRules
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
			if (!view.isPunct(previous)) continue;
			for (const next of nexts) {
				if (!joins(state, previous, next)) continue;
				const check: JoinCheck = { seam: seam.key, state, symbol, previous, next, verdict: 'unbuildable' };
				checks.push(check);
				bySeam.set(check, seam);
			}
		}
	}
	const checked = new Set(checks.map((check) => `${check.seam}|${check.state}|${check.symbol}|${check.next}`));
	const strongest = (reads: readonly SpaceRead[]): SpaceRead =>
		reads.includes('space') ? 'space' : reads.includes('unknown') ? 'unknown' : 'other';
	const stateLeading = new Map<number, SpaceRead>();
	const leadingAt = (state: number): SpaceRead => {
		let known = stateLeading.get(state);
		if (known === undefined) stateLeading.set(state, (known = strongest([...tables.valid[state]!].map((id) => view.readsSpace(id, '')))));
		return known;
	};
	const leadingOfSeam = (seam: ConcreteSeam): SpaceRead => strongest([...seam.lexed].map(leadingAt));
	const trailingOf = (symbol: number): SpaceRead => view.readsSpace(symbol, textOf(symbol));
	const readsAt = (seam: ConcreteSeam, symbol: number): SpaceRead => strongest([leadingOfSeam(seam), trailingOf(symbol)]);
	const readOfSeam = (seam: ConcreteSeam): SpaceRead =>
		strongest([leadingOfSeam(seam), ...[...seam.pairs].map((pair) => trailingOf(walk.symbolOfPair(pair)))]);
	const spaceable = seams.filter((seam) => readOfSeam(seam) === 'space');
	const unknown = seams.filter((seam) => readOfSeam(seam) === 'unknown');
	for (const seam of spaceable) {
		const firsts = new Set([...view.firstLiterals(seam.node), ...builder.firstLeaves(seam.node).flatMap((leaf) => view.sampleStartingWith(leaf, '') ?? [])]);
		for (const pair of seam.pairs) {
			const state = walk.sourceOfPair(pair);
			const symbol = walk.symbolOfPair(pair);
			if (readsAt(seam, symbol) !== 'space') continue;
			const previous = textOf(symbol);
			for (const next of firsts) {
				const key = `${seam.key}|${state}|${symbol}|${next}`;
				if (checked.has(key)) continue;
				checked.add(key);
				const check: JoinCheck = { seam: seam.key, state, symbol, previous, next, whitespace: true, verdict: 'unbuildable' };
				checks.push(check);
				bySeam.set(check, seam);
			}
		}
	}
	using oracle = new ParseOracle(language);
	const { rules } = view;
	const memberAt = (root: Parameters<typeof leavesOf>[0], at: number, seam: string): string | undefined => {
		const leaves = leavesOf(root);
		const k = leaves.findIndex((leaf) => leaf.endIndex === at && leaf.startIndex < at);
		const next = leaves[k + 1];
		return k < 0 || next === undefined || next.startIndex !== at ? undefined : memberBefore(rules, seam, leaves[k]!, next);
	};
	const resolved = new Map<string, 'differs' | 'same'>();
	const checkKey = (seam: string, state: number, symbol: number, next: string): string =>
		`${seam}|${state}|${symbol}|${next}`;
	const attempt = (
		check: JoinCheck,
		sighting: ConcreteSighting,
		override?: Context,
		respell?: readonly [number, string]
	): void => {
		check.reason = undefined;
		check.after = undefined;
		const built = builder.build(sighting, bySeam.get(check)!.node, check.next, override);
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
		const spaced = render(instance.tokens, instance.seamAt, SEAM_SPACE);
		const tight = render(instance.tokens, instance.seamAt, '');
		if (spaced === null || tight === null) return fail(check, 'seam not renderable');
		using tightTree = oracle.parse(tight.text);
		const asBuilt = parsesAsBuilt(tightTree.root, tight.seam, check.previous, check.next);
		using spacedTree = oracle.parse(spaced.text);
		const leaves = leavesOf(spacedTree.root);
		const absorbed = absorbedAt(leaves, spaced.seam);
		if (absorbed !== undefined) {
			if (!asBuilt) return fail(check, 'the tight text does not parse as built');
			check.verdict = 'inseparable';
			check.reason = absorbed;
			check.after = memberAt(tightTree.root, tight.seam, check.seam);
			return;
		}
		if (spacedTree.root.hasError) {
			if (!errorNear(spacedTree.root, spaced.seam, spaced.seam + 1)) return fail(check, 'spaced text has a parse error away from the seam');
			if (!asBuilt) return fail(check, 'spaced text has a parse error at the seam');
			check.verdict = 'inseparable';
			check.reason = SPACE_IS_PARSE_ERROR;
			check.after = memberAt(tightTree.root, tight.seam, check.seam);
			return;
		}
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
		const same = !tightTree.root.hasError && sameTree(spacedTree.root, tightTree.root);
		const events = oracle.lexEvents(spaced.text);
		if (!spaceIsPadding(events, spaced.seam, after)) {
			check.verdict = 'inseparable';
			check.reason = SPACE_IN_HIDDEN_TOKEN;
			check.after = memberBefore(rules, check.seam, before, after);
			return;
		}
		const hits = lexStatesOf(events, before.endIndex, undefined, tables.names[check.symbol]!);
		hits.add(before.parseState);
		for (const hit of hits) {
			const key = checkKey(check.seam, hit, check.symbol, check.next);
			if (!resolved.has(key)) resolved.set(key, same ? 'same' : 'differs');
		}
		const own = resolved.get(checkKey(check.seam, check.state, check.symbol, check.next));
		if (hits.has(check.state)) check.after = memberBefore(rules, check.seam, before, after);
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
		const seam = bySeam.get(check)!;
		const [sighting, ...others] = seam.sightings(walk.pairKey(check.state, check.symbol));
		if (sighting === undefined) {
			fail(check, 'no sighting');
			continue;
		}
		attempt(check, sighting);
		if (check.verdict !== 'unbuildable' || check.reason === FORK_REASON) continue;
		const first = check.reason;
		for (const context of builder.alternativeContexts(sighting)) {
			attempt(check, sighting, context);
			if (check.verdict !== 'unbuildable') break;
		}
		if (check.verdict === 'unbuildable') {
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
					attempt(check, sighting, undefined, [k, spelling]);
					if (check.verdict !== 'unbuildable' || tries >= MAX_RESPELLINGS) break;
				}
			}
		}
		for (const other of others.slice(0, MAX_SIGHTINGS)) {
			if (check.verdict !== 'unbuildable') break;
			attempt(check, other);
		}
		if (check.verdict === 'unbuildable') check.reason = first;
	}
	const leafNames = (leaf: GrammarRule): readonly string[] =>
		leaf.type === 'SYMBOL'
			? view.nodeTypesOf(leaf.name)
			: leaf.type === 'ALIAS'
				? [leaf.value, ...(leaf.content.type === 'SYMBOL' ? view.nodeTypesOf(leaf.content.name) : [])]
				: [];
	const corpus = corpusWitnesses(input.corpus, oracle, walk, [...spaceable, ...unknown], seams, (seam) => [
		...view.firstLiterals(seam.node),
		...builder.firstLeaves(seam.node, true).flatMap(leafNames)
	]);
	const witnesses: SeamWitness[] = [
		...checks.flatMap(({ seam, previous, next, verdict, reason, after }): SeamWitness[] =>
			verdict === 'same' || verdict === 'differs' || verdict === 'inseparable'
				? [{ seam, previous, next, verdict, ...(reason === undefined ? {} : { reason }), ...(after === undefined ? {} : { after }), witness: 'built' }]
				: []
		),
		...corpus.spaced,
		...corpus.merged
	];
	const { tight, disagreeing } = tightSeamsOf(witnesses);
	const pairOf = (check: JoinCheck): string => `${check.previous.at(-1)}${check.next[0]}`;
	const joinChecks: JoinCheck[] = [
		...checks.filter((check) => check.whitespace !== true),
		...corpus.merged.flatMap(({ seam, state, symbol, previous, next, verdict }): JoinCheck[] =>
			verdict === 'differs' ? [{ seam, state, symbol, previous, next, verdict }] : []
		)
	];
	const tightSeams = new Set(tight.flatMap((record) => (record.after === undefined ? [record.seam] : [])));
	const kept = joinChecks.filter(
		(check) => (check.verdict === 'differs' || check.verdict === 'unbuildable') && !tightSeams.has(check.seam)
	);
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
	const provenArms = armsOf(joinChecks.filter((check) => check.verdict === 'differs'));
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
	const seamPairOf = (check: JoinCheck): string => `${check.seam}|${pairOf(check)}`;
	const decided = new Set(joinChecks.filter((check) => check.verdict !== 'unbuildable').map(seamPairOf));
	const blockedBy = new Map<string, { readonly seam: string; readonly pair: string; readonly states: Set<number>; readonly reasons: Set<string> }>();
	for (const check of joinChecks) {
		if (tightSeams.has(check.seam) || check.verdict !== 'unbuildable' || decided.has(seamPairOf(check))) continue;
		if (!unprovenPrevious.has(check.seam) && !unprovenPairs.has(pairOf(check))) continue;
		let gap = blockedBy.get(seamPairOf(check));
		if (gap === undefined) blockedBy.set(seamPairOf(check), (gap = { seam: check.seam, pair: pairOf(check), states: new Set(), reasons: new Set() }));
		gap.states.add(check.state);
		if (check.reason !== undefined) gap.reasons.add(check.reason);
	}
	const blocked = [...blockedBy.values()].map(
		({ seam, pair, states, reasons }): BlockedJoinCheck => ({
			seam,
			pair,
			states: [...states].sort((a, b) => a - b),
			reasons: [...reasons].sort(compareOrdinal)
		})
	);
	return joinSeamsFileOf(joinStampOf(input), {
		seams: armed,
		pairs,
		joinsNextKinds: [...kindsJoiningNext(view, new Set(kept.map((check) => check.symbol)))],
		blocked,
		tight,
		disagreeing
	});
}

function tightSeamsOf(witnesses: readonly SeamWitness[]): {
	readonly tight: TightSeamRecord[];
	readonly disagreeing: DisagreeingSeamRecord[];
} {
	const bySeam = new Map<string, SeamWitness[]>();
	for (const witness of witnesses) {
		const list = bySeam.get(witness.seam);
		if (list === undefined) bySeam.set(witness.seam, [witness]);
		else list.push(witness);
	}
	const tightOf = ({ previous, next, witness, reason, after }: SeamWitness): Omit<TightSeamRecord, 'seam'> => ({
		previous,
		next,
		witness,
		reason: reason!,
		...(after === undefined ? {} : { after })
	});
	const spacedOf = ({ previous, next, verdict, witness, after }: SeamWitness): SpacedWitness => ({
		previous,
		next,
		verdict: verdict as SpacedWitness['verdict'],
		witness,
		...(after === undefined ? {} : { after })
	});
	const tight: TightSeamRecord[] = [];
	const disagreeing: DisagreeingSeamRecord[] = [];
	for (const [seam, list] of bySeam) {
		const inseparable = list.filter((witness) => witness.verdict === 'inseparable');
		const spaced = list.filter((witness) => witness.verdict !== 'inseparable');
		if (inseparable.length === 0) continue;
		if (spaced.length === 0) {
			const { after: _, ...record } = tightOf(inseparable[0]!);
			tight.push({ seam, ...record });
			continue;
		}
		for (const after of new Set(inseparable.map((witness) => witness.after))) {
			const own = inseparable.find((witness) => witness.after === after)!;
			const against = spaced.find((witness) => after === undefined || witness.after === undefined || witness.after === after);
			if (against === undefined) tight.push({ seam, ...tightOf(own) });
			else disagreeing.push({ seam, reason: 'disagree', tight: tightOf(own), spaced: spacedOf(against) });
		}
	}
	return { tight, disagreeing };
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
	const resolvedIds = new Map<string, ReadonlySet<RuleId>>();
	const seamIds = new Map<string, ReadonlySet<RuleId>>();
	const idsOf = (keys: readonly string[], record?: Map<string, ReadonlySet<RuleId>>): Set<RuleId> => {
		const out = new Set<RuleId>();
		for (const key of keys) {
			const ids = idsOfKey.get(key);
			if (ids === undefined) {
				unmapped.push(`${key}: no rule id`);
				continue;
			}
			let all = resolvedIds.get(key);
			if (all === undefined) resolvedIds.set(key, (all = new Set([...ids].flatMap((id) => [id, ...rebased(id)]))));
			record?.set(key, all);
			for (const id of all) out.add(id);
		}
		return out;
	};
	const joinsNext = idsOf(facts.seams.filter((record) => record.next !== undefined).map((record) => record.seam), seamIds);
	const joinsPrevious = idsOf(
		facts.seams.filter((record) => record.previous !== undefined).map((record) => record.seam),
		seamIds
	);
	const tightAfter = new Map<RuleId, Set<RuleId>>();
	for (const { seam, after } of facts.tight) {
		if (after === undefined) continue;
		const previous = idsOf([after]);
		for (const id of idsOf([seam])) {
			let set = tightAfter.get(id);
			if (set === undefined) tightAfter.set(id, (set = new Set()));
			for (const member of previous) set.add(member);
		}
	}
	return {
		joinsNext,
		joinsPrevious,
		joinsNextKinds: new Set(facts.joinsNextKinds),
		pairs: facts.pairs.map((record) => record.pair),
		seamIds,
		tight: idsOf(facts.tight.flatMap((record) => (record.after === undefined ? [record.seam] : []))),
		tightAfter,
		unmapped
	};
}

function fail(check: JoinCheck, reason: string): void {
	check.verdict = 'unbuildable';
	check.reason = reason;
}
