import type { RenderRule } from '../../types/rule.ts';
import { CHOICE, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import {
	AbstractAssembledCompound,
	AssembledPattern,
	isFixedTextLeaf,
	wordCharPredicate,
	type AssembledNode,
	type Delimited,
	type DelimiterEnd
} from './node-map.ts';
import { CharSet, LINE_TERMINATORS, leadingChars, patternDfa } from './pattern-automaton.ts';

function firstChars(text: string): CharSet {
	return text === '' ? CharSet.EMPTY : CharSet.chars(text[0]!);
}

function patternLeaders(pattern: string | undefined): CharSet {
	const dfa = pattern === undefined ? undefined : patternDfa(pattern);
	return dfa === undefined ? CharSet.ALL : leadingChars(dfa);
}

function childRules(rule: RenderRule): readonly RenderRule[] {
	if ('members' in rule && Array.isArray(rule.members)) return rule.members as readonly RenderRule[];
	return 'content' in rule && rule.content !== undefined ? [rule.content as RenderRule] : [];
}

class DelimitedFacts {
	private readonly nodes: ReadonlyMap<string, AssembledNode>;
	private readonly leaders = new Map<string, CharSet>();

	constructor(nodes: ReadonlyMap<string, AssembledNode>) {
		this.nodes = nodes;
	}

	leadersOfKind(kind: string): CharSet {
		const known = this.leaders.get(kind);
		if (known !== undefined) return known;
		this.leaders.set(kind, CharSet.EMPTY);
		const node = this.nodes.get(kind);
		let result = CharSet.EMPTY;
		if (node instanceof AssembledPattern) result = patternLeaders(node.textPattern);
		else if (node !== undefined && isFixedTextLeaf(node)) result = firstChars(node.text);
		else if (node instanceof AbstractAssembledCompound) result = this.leadersOfRule(node.renderRule);
		this.leaders.set(kind, result);
		return result;
	}

	leadersOfRule(rule: RenderRule): CharSet {
		if (rule.type === STRING) return firstChars(rule.value);
		if (rule.type === PATTERN) return patternLeaders(rule.value);
		if (rule.type === SYMBOL) return this.leadersOfKind(rule.name);
		if (rule.type === SEQ) {
			let result = CharSet.EMPTY;
			for (const member of rule.members) {
				result = result.union(this.leadersOfRule(member));
				if (!this.mayBeEmpty(member)) break;
			}
			return result;
		}
		return childRules(rule).reduce((all, child) => all.union(this.leadersOfRule(child)), CharSet.EMPTY);
	}

	mayBeEmpty(rule: RenderRule): boolean {
		return rule.multiplicity === 'optional' || rule.multiplicity === 'array';
	}

	alternatives(rule: RenderRule, seen = new Set<string>()): readonly RenderRule[] {
		if (rule.type === CHOICE) return rule.members.flatMap((arm) => this.alternatives(arm, seen));
		if (rule.type === SYMBOL) {
			const node = this.nodes.get(rule.name);
			if (node instanceof AbstractAssembledCompound && node.renderRule.type === CHOICE && !seen.has(rule.name)) {
				seen.add(rule.name);
				return this.alternatives(node.renderRule, seen);
			}
			return [rule];
		}
		if (rule.type === SEQ) return [rule];
		return childRules(rule).length > 0 ? childRules(rule).flatMap((child) => this.alternatives(child, seen)) : [rule];
	}

	isVariableText(rule: RenderRule, seen = new Set<string>()): boolean {
		if (rule.type === STRING) return false;
		if (rule.type === PATTERN) return true;
		if (rule.type === SYMBOL) {
			const node = this.nodes.get(rule.name);
			if (node instanceof AssembledPattern) return true;
			if (!(node instanceof AbstractAssembledCompound) || seen.has(rule.name)) return false;
			seen.add(rule.name);
			return this.isVariableText(node.renderRule, seen);
		}
		return childRules(rule).some((child) => this.isVariableText(child, seen));
	}

	isText(rule: RenderRule, seen = new Set<string>()): boolean {
		if (rule.type === STRING || rule.type === PATTERN) return true;
		if (rule.type === SYMBOL) {
			const node = this.nodes.get(rule.name);
			if (node instanceof AssembledPattern || (node !== undefined && isFixedTextLeaf(node))) return true;
			if (!(node instanceof AbstractAssembledCompound) || seen.has(rule.name)) return false;
			seen.add(rule.name);
			return this.isText(node.renderRule, seen);
		}
		return childRules(rule).every((child) => this.isText(child, seen));
	}
}

function endOf(member: RenderRule, nodes: ReadonlyMap<string, AssembledNode>): DelimiterEnd | undefined {
	if (member.multiplicity !== undefined) return undefined;
	if (member.type === STRING) return { text: member.value };
	if (member.type !== SYMBOL) return undefined;
	const node = nodes.get(member.name);
	if (node === undefined) return undefined;
	if (node instanceof AssembledPattern) return { slot: member.fieldName ?? member.name };
	return isFixedTextLeaf(node) ? { text: node.text } : undefined;
}

const WORD_PROBE_LIMIT = 4096;

function holdsWordChar(set: CharSet, isWordChar: (char: string) => boolean): boolean {
	if (set.size() > WORD_PROBE_LIMIT) return true;
	return set.ranges.some(([lo, hi]) => {
		for (let code = lo; code <= hi; code++) if (isWordChar(String.fromCodePoint(code))) return true;
		return false;
	});
}

function delimitedOf(
	node: AbstractAssembledCompound,
	facts: DelimitedFacts,
	nodes: ReadonlyMap<string, AssembledNode>,
	isWordChar: (char: string) => boolean
): Delimited | undefined {
	const rule = node.renderRule;
	if (rule.type !== SEQ || rule.members.length < 3) return undefined;
	const open = endOf(rule.members[0]!, nodes);
	const close = endOf(rule.members.at(-1)!, nodes);
	if (open === undefined || close === undefined) return undefined;
	const closing = facts.leadersOfRule(rule.members.at(-1)!);
	if (holdsWordChar(closing, isWordChar)) return undefined;
	const arms = rule.members.slice(1, -1).flatMap((member) => facts.alternatives(member));
	const armLeaders = arms.map((arm) => facts.leadersOfRule(arm));
	const hazardous = arms.map(
		(arm, i) => facts.isText(arm) && facts.isVariableText(arm) && !armLeaders[i]!.minus(closing.complement()).isEmpty()
	);
	if (!hazardous.some(Boolean)) return undefined;
	const excluded = armLeaders.reduce(
		(all, leaders, i) => (hazardous[i] ? all : all.union(leaders)),
		closing.union(LINE_TERMINATORS)
	);
	const nodeKinds = arms.flatMap((arm) => (arm.type === SYMBOL && !facts.isText(arm) ? [arm.name] : []));
	return { open, close, excluded: excluded.ranges, nodeKinds, varying: open.slot !== undefined || close.slot !== undefined };
}

export function stampDelimited(nodes: ReadonlyMap<string, AssembledNode>, wordMatcher: RegExp | undefined): void {
	const facts = new DelimitedFacts(nodes);
	const isWordChar = wordCharPredicate(wordMatcher);
	for (const node of nodes.values()) {
		if (node instanceof AbstractAssembledCompound) node.delimited = delimitedOf(node, facts, nodes, isWordChar);
	}
}
