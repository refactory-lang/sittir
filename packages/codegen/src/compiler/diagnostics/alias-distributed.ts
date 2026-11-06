import { ALIAS, FIELD, OPTIONAL, REPEAT, REPEAT1, SEQ, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../../types/rule.ts';
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { DisplayUnions } from '../types.ts';
import { isPrecWrapper } from '../../types/runtime-shapes.ts';
import { RuleWalker } from '../../dsl/rule-walker.ts';
import type { SymbolSource } from '../../dsl/rule-patterns.ts';
import { inlineTokenAliasSkipsOf, type InlineTokenAliasSkip, type InlineTokenAliasSkipSite } from '../../dsl/rule-transforms.ts';
import { assertNever } from '../../polymorph-variant.ts';

type R = Rule<'evaluate'>;

function distributedShape(content: R, symbols: SymbolSource, seen: ReadonlySet<string>): string | undefined {
	if (content.type === SEQ) return content.members.length >= 2 ? `a sequence of ${content.members.length} members` : undefined;
	if (content.type === REPEAT || content.type === REPEAT1) return 'a repeat';
	if (content.type === OPTIONAL || content.type === FIELD || isPrecWrapper(content)) {
		return distributedShape((content as { content: R }).content, symbols, seen);
	}
	if (content.type === SYMBOL && !seen.has(content.name) && symbols.isInlined(content.name)) {
		const body = symbols.rules[content.name] as R | undefined;
		return body === undefined ? undefined : distributedShape(body, symbols, new Set([...seen, content.name]));
	}
	return undefined;
}

export function diagnoseDistributedAliases(input: { grammar: string; symbols: SymbolSource }): GrammarDiagnostic[] {
	const walker = new RuleWalker<R>();
	const out: GrammarDiagnostic[] = [];
	for (const [owner, rule] of Object.entries(input.symbols.rules as Readonly<Record<string, R>>)) {
		walker.fold(rule, out, (acc, r) => {
			if (r.type !== ALIAS || !r.named) return acc;
			const shape = distributedShape(r.content as R, input.symbols, new Set());
			if (shape === undefined) return acc;
			acc.push({
				scope: 'grammar',
				code: 'alias-distributed',
				severity: 'error',
				grammar: input.grammar,
				ownerKind: owner,
				message: `alias('${String(r.value)}') over ${shape}: tree-sitter applies the alias to every member, so the model would describe one node where the parser issues several`,
				canProceed: false,
				details: { target: r.value, shape }
			});
			return acc;
		});
	}
	return out;
}

export function diagnoseMixedDisplayUnions(input: {
	grammar: string;
	displayUnions: DisplayUnions | undefined;
	symbols: SymbolSource;
}): GrammarDiagnostic[] {
	const out: GrammarDiagnostic[] = [];
	for (const [display, members] of input.displayUnions ?? []) {
		const terminals: string[] = [];
		const nonterminals: string[] = [];
		for (const member of members) {
			if (member.literal) {
				terminals.push(member.storage);
				continue;
			}
			if (input.symbols.rules[member.storage] === undefined && !input.symbols.externals.has(member.storage)) {
				out.push({
					scope: 'grammar',
					code: 'display-union-unknown-member',
					severity: 'error',
					grammar: input.grammar,
					ownerKind: display,
					message: `display '${display}' lists '${member.storage}', which is neither a rule, an external nor a literal of this grammar`,
					canProceed: false,
					details: { display, member: member.storage }
				});
				continue;
			}
			(input.symbols.isTerminal(member.storage) ? terminals : nonterminals).push(member.storage);
		}
		if (terminals.length === 0 || nonterminals.length === 0) continue;
		out.push({
			scope: 'grammar',
			code: 'display-union-mixed',
			severity: 'error',
			grammar: input.grammar,
			ownerKind: display,
			message: `display '${display}' sits over terminals (${terminals.join(', ')}) and nonterminals (${nonterminals.join(', ')}); enrich resolves every such display, so this is a broken invariant`,
			canProceed: false,
			details: { display, terminals, nonterminals }
		});
	}
	return out;
}

const INLINE_TOKEN_ALIAS_CAUSES: Readonly<Record<InlineTokenAliasSkip, (display: string) => string>> = {
	'display-is-rule': (display) => `'${display}' is also a rule of this grammar`,
	'word-display': (display) => `'${display}' is a display of the word rule`,
	'storage-name-taken': (display) => `the rule '_${display}' already exists with a different body`,
	'bodies-disagree': (display) => `the sites of '${display}' alias different token bodies`
};

function inlineTokenAliasProposal(site: InlineTokenAliasSkipSite): string {
	const { display, reason, bodyIndex } = site;
	switch (reason) {
		case 'display-is-rule':
		case 'word-display':
			return `alias the token under a display that no rule and no word alias uses`;
		case 'storage-name-taken':
			return `rule('_${display}_token', <the token body>) in rules:, and alias($._${display}_token, $.${display}) at this site`;
		case 'bodies-disagree':
			return `one hidden rule per distinct body, rule('_${display}_<n>', <body n>) for each, and at each site alias($._${display}_${bodyIndex + 1}, $.${display}) for that site's own body, so no site changes what it accepts`;
		default:
			return assertNever(reason);
	}
}

export function diagnoseInlineTokenAliases(input: { grammar: string; symbols: SymbolSource; word: string | undefined }): GrammarDiagnostic[] {
	const rules = input.symbols.rules as Readonly<Record<string, R>>;
	return inlineTokenAliasSkipsOf({ ...rules }, { word: input.word })
		.map((site) => ({
			scope: 'grammar',
			code: 'alias-inline-token',
			severity: 'error',
			grammar: input.grammar,
			ownerKind: site.owner,
			message: `alias('${site.display}') over an inline token has no storage rule: ${INLINE_TOKEN_ALIAS_CAUSES[site.reason](site.display)}, so enrich did not mint one and the alias would read as the token's own text`,
			canProceed: false,
			details: { owner: site.owner, display: site.display, reason: site.reason, bodyCount: site.bodyCount },
			proposal: inlineTokenAliasProposal(site)
		}));
}
