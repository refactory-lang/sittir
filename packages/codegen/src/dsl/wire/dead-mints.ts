import { getEnrichMints, nativeRuleFn, type GrammarResult } from '../enrich.ts';
import { ruleListEntryOf, type RuleListEntry } from '../rule-patterns.ts';
import type { Rule } from '../../types/rule.ts';
import { collectSymbolRefs, grammarRootNames } from '../../util/reachable-rules.ts';
import { protectedWireRuleNames, symbolNamesOf, type WiredOpts } from './wire.ts';

type WiredGrammar = GrammarResult['grammar'];

export const DEAD_ENRICH_MINTS_KEY = '__deadEnrichMints__' as const;

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

function withoutDeadConflicts(conflicts: unknown, dead: ReadonlySet<string>): unknown {
	if (!Array.isArray(conflicts)) return conflicts;
	return conflicts.filter((group) => ![...symbolNamesOf(group)].some((name) => dead.has(name)));
}

export function blankDeadEnrichMints(grammar: WiredGrammar, enriched: unknown, opts: WiredOpts): void {
	const dead = deadEnrichMints(grammar, { mints: getEnrichMints(enriched), protectedNames: protectedWireRuleNames(opts) });
	Object.defineProperty(grammar, DEAD_ENRICH_MINTS_KEY, { value: dead, enumerable: false, writable: false, configurable: true });
	if (dead.size === 0) return;
	const ruleOrder = Object.keys(grammar.rules).join('\n');
	const blank = nativeRuleFn<() => Rule>('blank');
	for (const name of dead) grammar.rules[name] = blank();
	if (Object.keys(grammar.rules).join('\n') !== ruleOrder) throw new Error('blankDeadEnrichMints: blanking changed the rule order');
	grammar.inline = withoutDeadNames(grammar.inline, dead);
	grammar.supertypes = withoutDeadNames(grammar.supertypes, dead);
	grammar.conflicts = withoutDeadConflicts(grammar.conflicts, dead);
}

export function getDeadEnrichMints(grammar: unknown): ReadonlySet<string> {
	if (!grammar || typeof grammar !== 'object') return new Set();
	const dead = (grammar as Record<string, unknown>)[DEAD_ENRICH_MINTS_KEY];
	return dead instanceof Set ? (dead as ReadonlySet<string>) : new Set();
}
