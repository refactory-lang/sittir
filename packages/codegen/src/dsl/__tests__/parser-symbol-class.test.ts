import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AnyRule } from '../../types/rule.ts';
import { stableGrammars } from '../../grammars.ts';
import { parserSymbolClassOf, tokenUseCounts, type ParserSymbolClass, type ParserSymbolCtx } from '../rule-patterns.ts';

const ROOT = fileURLToPath(new URL('../../../../../', import.meta.url));

interface GrammarJson {
	readonly rules: Record<string, AnyRule>;
	readonly extras?: readonly AnyRule[];
	readonly externals?: readonly { readonly type: string; readonly name?: string }[];
	readonly inline?: readonly string[];
}

type Node = {
	readonly type: string;
	readonly name?: string;
	readonly named?: boolean;
	readonly content?: Node;
	readonly members?: readonly Node[];
};

function children(rule: Node): readonly Node[] {
	return [...(rule.content === undefined ? [] : [rule.content]), ...(rule.members ?? [])];
}

function reachableRules(grammar: GrammarJson): Set<string> {
	const seen = new Set<string>();
	const visit = (rule: Node | undefined): void => {
		if (rule === undefined) return;
		if (rule.type === 'SYMBOL' && rule.name !== undefined && !seen.has(rule.name)) {
			seen.add(rule.name);
			visit(grammar.rules[rule.name] as unknown as Node | undefined);
		}
		for (const child of children(rule)) visit(child);
	};
	visit({ type: 'SYMBOL', name: Object.keys(grammar.rules)[0]! });
	for (const extra of grammar.extras ?? []) visit(extra as unknown as Node);
	for (const external of grammar.externals ?? []) visit(external as unknown as Node);
	return seen;
}

function aliasStorages(grammar: GrammarJson, reachable: ReadonlySet<string>): Set<string> {
	const out = new Set<string>();
	const visit = (rule: Node): void => {
		if (rule.type === 'ALIAS' && rule.named === true && rule.content?.type === 'SYMBOL') out.add(rule.content.name!);
		for (const child of children(rule)) visit(child);
	};
	for (const name of reachable) {
		const rule = grammar.rules[name];
		if (rule !== undefined) visit(rule as unknown as Node);
	}
	return out;
}

function parserClasses(grammar: string): (name: string) => ParserSymbolClass {
	const parser = readFileSync(`${ROOT}packages/${grammar}/.sittir/src/parser.c`, 'utf8');
	const tokenCount = Number(/#define TOKEN_COUNT (\d+)/.exec(parser)![1]);
	const start = parser.indexOf('enum ts_symbol_identifiers');
	const body = parser.slice(start, parser.indexOf('};', start));
	const rows = new Map<string, number>();
	for (const [, symbol, id] of body.matchAll(/\n\s+sym_(\w+) = (\d+),/g)) rows.set(symbol!, Number(id));
	return (name) => {
		const id = rows.get(name);
		if (id === undefined) return 'inlined';
		return id < tokenCount ? 'terminal' : 'nonterminal';
	};
}

describe('parserSymbolClassOf agrees with the generated parser at every alias site', () => {
	for (const grammar of stableGrammars()) {
		it(grammar, () => {
			const json = JSON.parse(readFileSync(`${ROOT}packages/${grammar}/.sittir/src/grammar.json`, 'utf8')) as GrammarJson;
			const ctx: ParserSymbolCtx = {
				rules: json.rules,
				externals: new Set((json.externals ?? []).flatMap((e) => (e.type === 'SYMBOL' && e.name ? [e.name] : []))),
				inline: new Set(json.inline ?? []),
				tokenUses: tokenUseCounts(json.rules)
			};
			const parserClassOf = parserClasses(grammar);
			const disagreements = [...aliasStorages(json, reachableRules(json))].sort().flatMap((name) => {
				const predicted = parserSymbolClassOf(name, ctx);
				const actual = parserClassOf(name);
				return predicted === actual ? [] : [`${name}: predicted ${predicted}, parser ${actual}`];
			});
			expect(disagreements).toEqual([]);
		});
	}
});
