import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { REPO_ROOT } from '@sittir/codegen/grammars';

export interface GrammarRuleOptions {
	grammar: string;
	kind: string;
}

export interface GrammarJsonRule {
	type: string;
	name?: string;
	value?: string | number;
	named?: boolean;
	content?: GrammarJsonRule;
	members?: GrammarJsonRule[];
}

interface GrammarJson {
	rules: Record<string, GrammarJsonRule>;
}

const PRECEDENCE_TYPES = new Set(['PREC', 'PREC_LEFT', 'PREC_RIGHT', 'PREC_DYNAMIC']);

export function formatRule(rule: GrammarJsonRule): string {
	switch (rule.type) {
		case 'SYMBOL':
			return String(rule.name);
		case 'STRING':
			return JSON.stringify(rule.value);
		case 'PATTERN':
			return `/${rule.value}/`;
		case 'BLANK':
			return 'blank';
		case 'SEQ':
			return `seq(${(rule.members ?? []).map(formatRule).join(', ')})`;
		case 'CHOICE': {
			const members = rule.members ?? [];
			const blanks = members.filter((member) => member.type === 'BLANK').length;
			if (members.length === 2 && blanks === 1) {
				const other = members.find((member) => member.type !== 'BLANK') as GrammarJsonRule;
				return `opt(${formatRule(other)})`;
			}
			return `choice(${members.map(formatRule).join(', ')})`;
		}
		case 'REPEAT':
			return `repeat(${formatRule(requireContent(rule))})`;
		case 'REPEAT1':
			return `repeat1(${formatRule(requireContent(rule))})`;
		case 'FIELD':
			return `field(${rule.name}, ${formatRule(requireContent(rule))})`;
		case 'ALIAS': {
			const alias = rule.named === true ? String(rule.value) : JSON.stringify(rule.value);
			return `alias(${formatRule(requireContent(rule))}, ${alias})`;
		}
		case 'TOKEN':
			return `token(${formatRule(requireContent(rule))})`;
		case 'IMMEDIATE_TOKEN':
			return `immediate_token(${formatRule(requireContent(rule))})`;
		default:
			if (PRECEDENCE_TYPES.has(rule.type)) {
				const name = rule.type.toLowerCase().replace('prec_', 'prec.');
				return `${name}(${String(rule.value)}, ${formatRule(requireContent(rule))})`;
			}
			throw new Error(`unknown grammar rule type ${rule.type}`);
	}
}

function requireContent(rule: GrammarJsonRule): GrammarJsonRule {
	if (rule.content === undefined) {
		throw new Error(`${rule.type} rule has no content`);
	}
	return rule.content;
}

export function grammarRule(path: string, kind: string): string {
	const grammar = JSON.parse(readFileSync(path, 'utf8')) as GrammarJson;
	const rule = grammar.rules?.[kind];
	if (rule === undefined) {
		throw new Error(`no rule ${kind} in ${path}`);
	}
	return formatRule(rule);
}

export async function run(opts: GrammarRuleOptions): Promise<number> {
	try {
		const path = resolve(join(REPO_ROOT, 'packages', opts.grammar, '.sittir', 'src', 'grammar.json'));
		console.log(grammarRule(path, opts.kind));
		return 0;
	} catch (error) {
		console.error(`grammar-rule: ${error instanceof Error ? error.message : String(error)}`);
		return 1;
	}
}
