import { describe, expect, it } from 'vitest';
import { ALIAS, CHOICE, PATTERN, STRING, SYMBOL } from '../../../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule } from '../../../types/rule.ts';
import type { RuleListEntry } from '../../../dsl/rule-patterns.ts';
import { admittedLineEndings, type LineGrammar } from '../line-endings.ts';

const layout = (...members: string[]): AnyRule =>
	({
		type: CHOICE,
		members: members.map((name) => ({
			type: ALIAS,
			content: { type: SYMBOL, name },
			named: true,
			value: name.slice(1)
		}))
	}) as AnyRule;
const pattern = (value: string): AnyRule => ({ type: PATTERN, value }) as AnyRule;
const text = (value: string): AnyRule => ({ type: STRING, value }) as AnyRule;
const extras = (...patterns: string[]): RuleListEntry[] =>
	patterns.map((value) => ({ type: PATTERN, value }) as RuleListEntry);

function grammar(rules: Record<string, AnyRule>, extrasRun: RuleListEntry[], word: string | null = null): LineGrammar {
	return {
		name: 'demo',
		rules: { _layout: layout('_space', '_newline'), _space: text(' '), _newline: text('\n'), ...rules },
		extras: extrasRun,
		word
	};
}

describe('admittedLineEndings', () => {
	it('admits every arm the extras lex when no token runs to the end of a line', () => {
		expect(admittedLineEndings(grammar({ identifier: pattern('[a-z]+') }, extras('\\s')), null).arms).toEqual([
			'\n',
			'\r\n',
			'\r'
		]);
	});

	it('drops an arm a token that runs to the end of a line passes through', () => {
		const endings = admittedLineEndings(
			grammar({ comment: pattern('//.*'), identifier: pattern('[a-z]+') }, extras('\\s')),
			null
		);
		expect(endings.arms).toEqual(['\n', '\r\n']);
		expect(endings.breaks.chars.has(0x0d)).toBe(true);
	});

	it('keeps an arm a run passes through when the run crosses every line', () => {
		expect(admittedLineEndings(grammar({ text: pattern('[\\s\\S]*') }, extras('\\s')), null).arms).toEqual([
			'\n',
			'\r\n',
			'\r'
		]);
	});

	it('drops an arm the extras do not lex', () => {
		expect(admittedLineEndings(grammar({ identifier: pattern('[a-z]+') }, extras('\\r?\\n', ' ')), null).arms).toEqual([
			'\n',
			'\r\n'
		]);
	});

	it("drops an arm the grammar's parser does not read as a line break between two words", () => {
		const parser = (source: string): string =>
			source.includes('\r') && !source.includes('\r\n') ? '(ERROR)' : '(lines)';
		const endings = admittedLineEndings(
			grammar({ identifier: pattern('[a-z]+') }, extras('\\s'), 'identifier'),
			parser
		);
		expect(endings.arms).toEqual(['\n', '\r\n']);
	});

	it('reads two words of the shortest text the word token accepts', () => {
		const seen: string[] = [];
		admittedLineEndings(
			grammar({ identifier: pattern('[a-z]+') }, extras('\\s'), 'identifier'),
			(source) => (seen.push(source), '(x)')
		);
		expect(seen).toContain('a\r\na');
	});

	it('has no arms and breaks lines at a line feed when the grammar lists no newline member', () => {
		const endings = admittedLineEndings(
			{ name: 'demo', rules: { comment: pattern('#.*') }, extras: extras('\\s'), word: null },
			null
		);
		expect(endings.arms).toEqual([]);
		expect(endings.breaks.arms).toEqual(['\n']);
	});

	it('names a pattern the automaton cannot read', () => {
		expect(() => admittedLineEndings(grammar({ word: pattern('\\bword') }, extras('\\s')), null)).toThrow(
			/demo's pattern "\\\\bword"/
		);
	});
});
