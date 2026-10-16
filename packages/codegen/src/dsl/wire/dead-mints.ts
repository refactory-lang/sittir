import { ruleListEntryOf, type RuleListEntry } from '../rule-patterns.ts';
import { collectSymbolRefs, grammarRootNames } from '../../util/reachable-rules.ts';
import { symbolNamesOf } from './wire.ts';

function ruleListEntries(entries: unknown): RuleListEntry[] {
	return (Array.isArray(entries) ? entries : []).flatMap((entry) => ruleListEntryOf(entry) ?? []);
}

export interface ReachableGrammar {
	readonly rules: Readonly<Record<string, unknown>>;
	readonly extras?: unknown;
	readonly supertypes?: unknown;
	readonly externals?: unknown;
	readonly word?: unknown;
}

export interface DeadMintCtx {
	readonly mints: ReadonlySet<string>;
	readonly protectedNames: readonly string[];
}

export function reachableRuleNames(grammar: ReachableGrammar, ctx: Pick<DeadMintCtx, 'protectedNames'>): ReadonlySet<string> {
	const roots = [
		...grammarRootNames({ rules: grammar.rules, extras: ruleListEntries(grammar.extras) }),
		...symbolNamesOf(grammar.supertypes),
		...symbolNamesOf(grammar.externals),
		...(typeof grammar.word === 'string' ? [grammar.word] : []),
		...ctx.protectedNames
	];
	const reachable = new Set<string>();
	const pending = roots.filter((name) => name in grammar.rules);
	while (pending.length > 0) {
		const name = pending.pop()!;
		if (reachable.has(name)) continue;
		reachable.add(name);
		const refs = new Set<string>();
		collectSymbolRefs(grammar.rules[name], refs);
		for (const ref of refs) if (ref in grammar.rules && !reachable.has(ref)) pending.push(ref);
	}
	return reachable;
}

export function deadEnrichMints(grammar: ReachableGrammar, ctx: DeadMintCtx): ReadonlySet<string> {
	const reachable = reachableRuleNames(grammar, ctx);
	return new Set([...ctx.mints].filter((name) => name in grammar.rules && !reachable.has(name)));
}

export function withoutDeadNames(list: unknown, dead: ReadonlySet<string>): unknown {
	if (!Array.isArray(list)) return list;
	return list.filter((entry) => ![...symbolNamesOf([entry])].some((name) => dead.has(name)));
}
