import { describe, expect, it } from 'vitest';
import { mintInlineTextTokens } from '../rule-transforms.ts';
import type { Rule } from '../../types/rule.ts';

const pattern = (value: string) => ({ type: 'PATTERN', value }) as unknown as Rule;
const str = (value: string) => ({ type: 'STRING', value }) as unknown as Rule;
const sym = (name: string) => ({ type: 'SYMBOL', name }) as unknown as Rule;
const seq = (...members: Rule[]) => ({ type: 'SEQ', members }) as unknown as Rule;
const token = (content: Rule) => ({ type: 'TOKEN', content }) as unknown as Rule;
const prec = (content: Rule) => ({ type: 'PREC', value: 1, content }) as unknown as Rule;
const alias = (content: Rule, value: string) => ({ type: 'ALIAS', named: true, value, content }) as unknown as Rule;

describe('mintInlineTextTokens', () => {
	it('names an inline pattern after the rule that holds it', () => {
		const { rules, mintedNames } = mintInlineTextTokens({ escape: seq(str('\\'), pattern('[dD]')) }, { symbol: sym });
		expect(mintedNames).toEqual(['escape_text']);
		expect(rules.escape).toEqual(seq(str('\\'), sym('escape_text')));
		expect(rules.escape_text).toEqual(pattern('[dD]'));
	});

	it('numbers the sites of one rule in order', () => {
		const { rules, mintedNames } = mintInlineTextTokens({ esc: seq(pattern('a'), token(seq(str('x'), pattern('b')))) }, { symbol: sym });
		expect(mintedNames).toEqual(['esc_text1', 'esc_text2']);
		expect(rules.esc).toEqual(seq(sym('esc_text1'), sym('esc_text2')));
		expect(rules.esc_text2).toEqual(token(seq(str('x'), pattern('b'))));
	});

	it('leaves a terminal rule, a literal token and a named alias alone', () => {
		const input = {
			word: prec(pattern('[a-z]+')),
			lt: seq(token(prec(str('<'))), sym('word')),
			named: seq(alias(pattern('[0-9]+'), 'number'))
		};
		const { rules, mintedNames } = mintInlineTextTokens(input, { symbol: sym });
		expect(mintedNames).toEqual([]);
		expect(rules).toEqual(input);
	});

	it('shares one kind among identical bodies, named after the first owner in rule order', () => {
		const { rules, mintedNames } = mintInlineTextTokens({ a: seq(pattern('x'), str(';')), b: seq(str('('), pattern('x')) }, { symbol: sym });
		expect(mintedNames).toEqual(['a_text']);
		expect(rules.b).toEqual(seq(str('('), sym('a_text')));
	});

	it('numbers only the distinct bodies of one rule', () => {
		const { rules, mintedNames } = mintInlineTextTokens({ a: seq(pattern('x'), pattern('y'), pattern('x')) }, { symbol: sym });
		expect(mintedNames).toEqual(['a_text1', 'a_text2']);
		expect(rules.a).toEqual(seq(sym('a_text1'), sym('a_text2'), sym('a_text1')));
	});

	it('keeps the site annotations on the reference, not on the minted rule', () => {
		const annotations = { variantOf: 'a' };
		const { rules } = mintInlineTextTokens({ a: seq({ ...pattern('x'), annotations } as unknown as Rule) }, { symbol: sym });
		expect(rules.a).toEqual(seq({ ...sym('a_text'), annotations } as unknown as Rule));
		expect(rules.a_text).toEqual(pattern('x'));
	});

	it('names a site after the rule that held it in the naming rules, not the rule it moved into', () => {
		const upstream = { comment: seq(str('//'), pattern('a'), pattern('b')) };
		const lifted = { comment: seq(str('//'), sym('comment_arm1')), comment_arm1: seq(pattern('a'), pattern('b')) };
		const { rules, mintedNames } = mintInlineTextTokens(lifted, { symbol: sym, namingRules: upstream });
		expect(mintedNames).toEqual(['comment_text1', 'comment_text2']);
		expect(rules.comment_arm1).toEqual(seq(sym('comment_text1'), sym('comment_text2')));
	});

	it('refuses a minted name the grammar already has', () => {
		expect(() => mintInlineTextTokens({ esc: seq(pattern('a')), esc_text: str('x') }, { symbol: sym })).toThrow(/esc_text/);
	});
});
