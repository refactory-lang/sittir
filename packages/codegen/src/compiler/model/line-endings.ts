import { ALIAS, CHOICE, PATTERN, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule } from '../../types/rule.ts';
import type { NodeMap } from '../types.ts';
import { SyntacticRuleWalker, isLexedBoundary } from '../../dsl/rule-walker.ts';
import { nodelessExtrasRun, nodelessExtrasSource, type RuleListEntry } from '../../dsl/rule-patterns.ts';
import { LAYOUT_SUPERTYPE } from '../../dsl/primitives/spacing.ts';
import {
	INDENT_MEMBERS,
	NEWLINE_ARMS,
	NEWLINE_MEMBER,
	admitsWhitespaceMember,
	canonicalText
} from '../../dsl/whitespace.ts';
import type { TreeShape } from '../../dsl/symbol-table.ts';
import { ruleToRegexSource } from '../../util/word-matcher.ts';
import {
	CharSet,
	absorbsRestOfLine,
	armsThrough,
	edgeChars,
	lineBreaksOf,
	patternDfa,
	shortestAccepted,
	type LineBreaks,
	type PatternDfa
} from './pattern-automaton.ts';

export interface LineGrammar {
	readonly name: string;
	readonly rules: Readonly<Record<string, AnyRule>>;
	readonly extras?: readonly RuleListEntry[];
	readonly word?: string | null;
}

export interface LineEndings {
	readonly arms: readonly string[];
	readonly breaks: LineBreaks;
	readonly whitespace: CharSet;
}

const syntactic = new SyntacticRuleWalker<AnyRule>();
const PREFERRED = canonicalText(NEWLINE_MEMBER);

export function lineEndingsOf(nodeMap: NodeMap): LineEndings {
	if (nodeMap.lineEndings === undefined) throw new Error(`line endings: the ${nodeMap.name} node map carries none`);
	return nodeMap.lineEndings;
}

export function admittedLineEndings(grammar: LineGrammar, parser: TreeShape | null): LineEndings {
	const layout = layoutMembersOf(grammar);
	const whitespace = extrasChars(grammar);
	const unwritten = whitespace.minus(
		CharSet.chars(
			INDENT_MEMBERS.filter((member) => layout.has(member))
				.map(canonicalText)
				.join('')
		)
	);
	const run = nodelessExtrasRun(grammar.extras ?? [], grammar.rules);
	const declared = lineBreaksOf(
		layout.has(NEWLINE_MEMBER) ? NEWLINE_ARMS.filter((arm) => admitsWhitespaceMember(run, NEWLINE_MEMBER, arm)) : [],
		unwritten
	);
	const swallowed = new Set(lexedPatternsOf(grammar).flatMap((pattern) => armsSwallowedBy(grammar, pattern, declared)));
	const sample = parser === null ? undefined : wordSample(grammar);
	const arms = declared.arms.filter(
		(arm) =>
			!swallowed.has(arm) &&
			(sample === undefined || parser!(sample + arm + sample) === parser!(sample + PREFERRED + sample))
	);
	return { arms, breaks: lineBreaksOf(arms.length > 0 ? arms : [PREFERRED], unwritten), whitespace };
}

function layoutMembersOf(grammar: LineGrammar): ReadonlySet<string> {
	const layout = grammar.rules[LAYOUT_SUPERTYPE];
	if (layout === undefined || layout.type !== CHOICE) return new Set();
	return new Set(
		layout.members.flatMap((member) => {
			const named = member.type === ALIAS ? member.content : member;
			return named.type === SYMBOL ? [named.name] : [];
		})
	);
}

function extrasChars(grammar: LineGrammar): CharSet {
	const source = nodelessExtrasSource(grammar.extras ?? [], grammar.rules);
	if (source === undefined) return CharSet.EMPTY;
	return edgeChars(readable(grammar, source, 'extras'));
}

function lexedPatternsOf(grammar: LineGrammar): string[] {
	return [
		...new Set(
			Object.values(grammar.rules).flatMap((rule) =>
				syntactic.fold(rule, [] as string[], (found, inner) =>
					inner.type === PATTERN || isLexedBoundary(inner) ? [...found, lexedSource(grammar, inner)] : found
				)
			)
		)
	];
}

function lexedSource(grammar: LineGrammar, token: AnyRule): string {
	const source = ruleToRegexSource(token);
	if (source === null) {
		throw new Error(`line endings: ${grammar.name} has a token the lexer reads from rules that are not lexical: ${JSON.stringify(token)}`);
	}
	return source;
}

function armsSwallowedBy(grammar: LineGrammar, pattern: string, declared: LineBreaks): readonly string[] {
	const dfa = readable(grammar, pattern, 'pattern');
	if (!absorbsRestOfLine(dfa, declared.rest)) return [];
	const through = armsThrough(dfa, declared);
	return through.includes(PREFERRED) ? [] : through;
}

function wordSample(grammar: LineGrammar): string | undefined {
	const rule = grammar.word ? grammar.rules[grammar.word] : undefined;
	const source = rule === undefined ? null : ruleToRegexSource(rule);
	if (source === null) return undefined;
	return shortestAccepted(readable(grammar, source, 'word'));
}

function readable(grammar: LineGrammar, pattern: string, role: string): PatternDfa {
	const dfa = patternDfa(pattern);
	if (dfa === undefined) {
		throw new Error(
			`line endings: ${grammar.name}'s ${role} ${JSON.stringify(pattern)} uses regex syntax the pattern automaton does not read`
		);
	}
	return dfa;
}
