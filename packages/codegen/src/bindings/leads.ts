import type { RawGrammar } from '../compiler/types.ts';
import { lead, type Lead, type LeadMatch } from '../dsl/bind.ts';
import { separatedListBodyInfo, symbolFactsOf, unwrapPrec } from '../dsl/rule-patterns.ts';
import { predictedEntriesOf, renameAwareSymbolSource } from '../dsl/symbol-table.ts';
import type { Rule } from '../types/rule.ts';
import { isFieldType } from '../types/runtime-shapes.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import type { BindingFacts, ClaimFact } from './facts.ts';
import { boundKindName } from './names.ts';

export interface LeadDerivation {
	readonly leads: readonly Lead[];
	readonly diagnostics: readonly GrammarDiagnostic[];
}

interface LeadClaim {
	readonly item: string;
	readonly field: string;
	readonly line: number;
	readonly match: LeadMatch;
}

type Named = { readonly match: LeadMatch } | { readonly refused: string };

const matchKey = (match: LeadMatch): string =>
	JSON.stringify([match.kind, match.within?.field ?? null, (match.within?.admits ?? []).map(matchKey)]);

function nameVariants(match: LeadMatch, claims: readonly ClaimFact[]): Named {
	if (match.within === undefined) return { match };
	const key = matchKey(match);
	const vocabs = [...new Set(claims.flatMap((c) => (c.toplevel && c.within.length === 0 && c.match !== undefined && matchKey(c.match) === key ? [c.vocab] : [])))];
	if (vocabs.length > 1) return { refused: `two claims name one variant: ${vocabs.join(', ')}` };
	const admits: LeadMatch[] = [];
	for (const admit of match.within.admits) {
		const named = nameVariants(admit, claims);
		if ('refused' in named) return named;
		admits.push(named.match);
	}
	const [vocab] = vocabs;
	return { match: { kind: match.kind, within: { field: match.within.field, admits }, ...(vocab === undefined ? {} : { as: boundKindName(vocab, match.kind.startsWith('_')) }) } };
}

export function deriveLeads(input: { readonly file: string; readonly base: RawGrammar; readonly facts: BindingFacts }): LeadDerivation {
	const { file, base, facts } = input;
	const symbols = renameAwareSymbolSource({ ...symbolFactsOf(base), kindEntries: predictedEntriesOf(base.predictedKinds) });
	const diagnostics: GrammarDiagnostic[] = [];
	const refuse = (list: string, lines: readonly number[], reason: string): void => {
		diagnostics.push({
			scope: 'grammar',
			code: 'lead-refused',
			severity: 'fail',
			grammar: base.name,
			message: `${file}:${lines.join(', ')}: the receiver claim on ${list} derives no lead: ${reason}`,
			canProceed: false,
			details: { file, lines, list, reason }
		});
	};
	const itemOf = (list: string): string | undefined => {
		const rule = base.rules[list];
		const info = rule === undefined ? null : separatedListBodyInfo(unwrapPrec(rule) as Rule<'normalize'>, symbols);
		return info?.form === 'head' && isFieldType(info.element.type) && info.elementName !== null ? info.elementName : undefined;
	};
	const byList = new Map<string, LeadClaim[]>();
	for (const member of facts.members) {
		if (member.leadMatch === undefined || (member.route !== 'nested' && member.route !== 'rename')) continue;
		const list = member.route === 'nested' ? member.parent : member.owner;
		const item = itemOf(list);
		if (item === undefined) continue;
		if ('refused' in member.leadMatch) {
			refuse(list, [member.leadMatch.line], member.leadMatch.refused);
			continue;
		}
		(byList.get(list) ?? byList.set(list, []).get(list)!).push({ item, field: member.name, line: member.leadMatch.line, match: member.leadMatch.match });
	}
	const leads: Lead[] = [];
	for (const [list, claims] of [...byList].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
		const [first] = claims;
		if (first === undefined) continue;
		const lines = [...new Set(claims.map((c) => c.line))].sort((a, b) => a - b);
		const fields = [...new Set(claims.map((c) => c.field))];
		if (fields.length > 1) {
			refuse(list, lines, `the claims capture two lead fields: ${fields.map((f) => `@${f}`).join(', ')}`);
			continue;
		}
		if (claims.some((c) => matchKey(c.match) !== matchKey(first.match))) {
			refuse(list, lines, 'the claims anchor different match trees');
			continue;
		}
		const named = nameVariants(first.match, facts.claims);
		if ('refused' in named) {
			refuse(list, lines, named.refused);
			continue;
		}
		leads.push(lead(list, first.item, first.field, named.match));
	}
	return { leads, diagnostics };
}
