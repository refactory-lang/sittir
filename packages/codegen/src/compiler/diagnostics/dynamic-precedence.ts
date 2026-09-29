import { sourceChain } from '../../dsl/conflict-resolutions.ts';
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { RawGrammar } from '../types.ts';
import { authoredRuleNames } from './rule-causes.ts';

function sortedValues(values: readonly number[]): number[] {
	return [...values].sort((left, right) => left - right);
}

function contains(landed: readonly number[], upstream: readonly number[]): boolean {
	const remaining = [...landed];
	return upstream.every((value) => {
		const at = remaining.indexOf(value);
		if (at < 0) return false;
		remaining.splice(at, 1);
		return true;
	});
}

export function dynamicPrecedenceRecords(
	raw: Pick<RawGrammar, 'name' | 'derivationRecords' | 'ruleCauses' | 'undeclaredRules'>
): GrammarDiagnostic[] {
	const records = raw.derivationRecords;
	if (records === undefined) return [];
	const landedBySource = new Map<string, { values: number[]; rules: string[] }>();
	for (const [name, values] of Object.entries(records.dynamicPrecedence)) {
		const chain = sourceChain(name, records.sourceEdges);
		const source = chain[chain.length - 1]!;
		const landed = landedBySource.get(source) ?? { values: [], rules: [] };
		landed.values.push(...values);
		landed.rules.push(name);
		landedBySource.set(source, landed);
	}
	const authored = new Set(authoredRuleNames(raw));
	const rules = [...new Set([...Object.keys(records.upstreamDynamicPrecedence), ...landedBySource.keys()])].sort();
	return rules.flatMap((rule): GrammarDiagnostic[] => {
		const upstream = sortedValues(records.upstreamDynamicPrecedence[rule] ?? []);
		const landedEntry = landedBySource.get(rule) ?? { values: [], rules: [] };
		const landed = sortedValues(landedEntry.values);
		const details = { rule, upstream, landed, landedIn: [...landedEntry.rules].sort() };
		if ([rule, ...landedEntry.rules].some((name) => authored.has(name))) {
			if (upstream.join() === landed.join()) return [];
			return [
				{
					scope: 'grammar',
					code: 'conflict-dynamic-precedence-authored',
					severity: 'info',
					grammar: raw.name,
					ownerKind: rule,
					message: `the authored '${rule}' changes its dynamic precedence from [${upstream.join(', ')}] upstream to [${landed.join(', ')}]`,
					canProceed: true,
					details
				}
			];
		}
		if (contains(landed, upstream)) return [];
		return [
			{
				scope: 'grammar',
				code: 'conflict-dynamic-precedence-lost',
				severity: 'fail',
				grammar: raw.name,
				ownerKind: rule,
				message: `reshaping lost dynamic precedence of '${rule}': upstream [${upstream.join(', ')}], landed [${landed.join(', ')}]; upstream's GLR tie-breaker no longer applies`,
				proposal: `Keep the prec.dynamic wrapper on the rule reshaping produces from '${rule}', so the parse path carries the same total.`,
				canProceed: false,
				details
			}
		];
	});
}
