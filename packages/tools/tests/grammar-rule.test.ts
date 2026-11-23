import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { formatRule, grammarRule, type GrammarJsonRule } from '../src/scripts/grammar-rule.ts';

describe('formatRule', () => {
	it('prints each rule type in the compact form', () => {
		const rule: GrammarJsonRule = {
			type: 'SEQ',
			members: [
				{ type: 'FIELD', name: 'name', content: { type: 'SYMBOL', name: 'identifier' } },
				{ type: 'REPEAT', content: { type: 'STRING', value: ',' } },
				{ type: 'CHOICE', members: [{ type: 'PATTERN', value: '\\d+' }, { type: 'BLANK' }] },
				{ type: 'ALIAS', named: true, value: 'type', content: { type: 'SYMBOL', name: '_type' } },
				{ type: 'ALIAS', named: false, value: '+', content: { type: 'STRING', value: '+' } },
				{ type: 'REPEAT1', content: { type: 'SYMBOL', name: 'statement' } },
				{ type: 'TOKEN', content: { type: 'STRING', value: 'x' } },
				{ type: 'IMMEDIATE_TOKEN', content: { type: 'STRING', value: 'y' } },
				{ type: 'PREC_LEFT', value: 2, content: { type: 'SYMBOL', name: 'a' } }
			]
		};
		expect(formatRule(rule)).toBe(
			'seq(field(name, identifier), repeat(","), opt(/\\d+/), alias(_type, type), alias("+", "+"), repeat1(statement), token("x"), immediate_token("y"), prec.left(2, a))'
		);
	});

	it('prints a choice of several alternatives as choice and a precedence without a suffix as prec', () => {
		expect(
			formatRule({
				type: 'CHOICE',
				members: [
					{ type: 'SYMBOL', name: 'a' },
					{ type: 'SYMBOL', name: 'b' }
				]
			})
		).toBe('choice(a, b)');
		expect(formatRule({ type: 'PREC', value: 1, content: { type: 'SYMBOL', name: 'c' } })).toBe('prec(1, c)');
	});

	it('refuses a rule type it does not know', () => {
		expect(() => formatRule({ type: 'WAT' })).toThrow(/unknown grammar rule type WAT/);
	});
});

describe('grammarRule', () => {
	function withGrammarJson(json: unknown, check: (path: string) => void): void {
		const dir = mkdtempSync(join(tmpdir(), 'grammar-rule-test-'));
		try {
			const path = join(dir, 'grammar.json');
			writeFileSync(path, JSON.stringify(json));
			check(path);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}

	it('prints the named rule from the grammar', () => {
		withGrammarJson({ rules: { ret: { type: 'SEQ', members: [{ type: 'STRING', value: 'return' }] } } }, (path) => {
			expect(grammarRule(path, 'ret')).toBe('seq("return")');
		});
	});

	it('refuses a kind the grammar does not name', () => {
		withGrammarJson({ rules: {} }, (path) => {
			expect(() => grammarRule(path, 'missing')).toThrow(/no rule missing in/);
		});
	});
});
