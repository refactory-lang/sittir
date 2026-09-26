import { ALIAS, FIELD, OPTIONAL, REPEAT, REPEAT1, SEQ, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, Rule } from '../../types/rule.ts';
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { DisplayUnions } from '../types.ts';
import { isPrecWrapper } from '../../types/runtime-shapes.ts';
import { RuleWalker } from '../../dsl/rule-walker.ts';
import { terminalContentOf } from '../../dsl/rule-patterns.ts';
import { findOwnKindEntry, type KindEntryLike } from '../generated-metadata.ts';

type R = Rule<'evaluate'>;

export interface CatalogSymbolCtx {
	readonly rules: Readonly<Record<string, AnyRule>>;
	readonly externals: ReadonlySet<string>;
	readonly inline: ReadonlySet<string>;
	readonly kindEntries: readonly KindEntryLike[];
}

function isInlinedName(name: string, ctx: CatalogSymbolCtx): boolean {
	return ctx.inline.has(name) && findOwnKindEntry(ctx.kindEntries, name) === undefined;
}

function isTerminalName(name: string, ctx: CatalogSymbolCtx): boolean {
	if (!isInlinedName(name, ctx)) return findOwnKindEntry(ctx.kindEntries, name)?.terminal === true;
	const body = ctx.rules[name];
	return body !== undefined && terminalContentOf(body, (member) => isTerminalName(member, ctx));
}

function distributedShape(content: R, symbols: CatalogSymbolCtx, seen: ReadonlySet<string>): string | undefined {
	if (content.type === SEQ)
		return content.members.length >= 2 ? `a sequence of ${content.members.length} members` : undefined;
	if (content.type === REPEAT || content.type === REPEAT1) return 'a repeat';
	if (content.type === OPTIONAL || content.type === FIELD || isPrecWrapper(content)) {
		return distributedShape((content as { content: R }).content, symbols, seen);
	}
	if (content.type === SYMBOL && !seen.has(content.name) && isInlinedName(content.name, symbols)) {
		const body = symbols.rules[content.name] as R | undefined;
		return body === undefined ? undefined : distributedShape(body, symbols, new Set([...seen, content.name]));
	}
	return undefined;
}

export function diagnoseDistributedAliases(input: { grammar: string; symbols: CatalogSymbolCtx }): GrammarDiagnostic[] {
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
	symbols: CatalogSymbolCtx;
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
			(isTerminalName(member.storage, input.symbols) ? terminals : nonterminals).push(member.storage);
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
