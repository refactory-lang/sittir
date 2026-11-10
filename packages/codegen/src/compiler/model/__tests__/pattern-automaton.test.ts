import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allGrammars, grammarPackage, sittirDirOf } from '../../../grammars.ts';
import { compileGrammar } from '../../compile.ts';
import { loadGeneratedIdTables } from '../../generated-metadata.ts';
import { anchoredLeafRegex } from '../leaf-pattern.ts';
import { admitsInside, armsThrough, CharSet, dfaAccepts, endsWithLineBreak, includesNonEmpty, leadingChars, lineBreaksOf, opensLineEnd, patternDfa, requiresNonSpace, shortestAccepted, type PatternDfa } from '../pattern-automaton.ts';
import { lineTerminated, lineTerminatedKinds, triviaKinds } from '../trivia.ts';

type NodeMap = Awaited<ReturnType<typeof compileGrammar>>['nodeMap'];

const nodeMaps = new Map<string, Promise<NodeMap>>();

function nodeMapOf(grammar: string): Promise<NodeMap> {
	let pending = nodeMaps.get(grammar);
	if (pending === undefined) {
		pending = loadGeneratedIdTables(grammar).then(
			async (generatedIdTables) => (await compileGrammar({ package: grammarPackage(grammar), generatedIdTables })).nodeMap
		);
		nodeMaps.set(grammar, pending);
	}
	return pending;
}

function patternsIn(root: unknown, found: Set<string>): void {
	const seen = new Set<object>();
	const visit = (rule: unknown): void => {
		if (rule === null || typeof rule !== 'object' || seen.has(rule)) return;
		seen.add(rule);
		const node = rule as Record<string, unknown>;
		if (node.type === 'PATTERN' && typeof node.value === 'string') found.add(node.value);
		for (const value of Object.values(node)) (Array.isArray(value) ? value : [value]).forEach(visit);
	};
	visit(root);
}

async function grammarPatterns(grammar: string): Promise<Set<string>> {
	const found = new Set<string>();
	patternsIn(JSON.parse(readFileSync(join(sittirDirOf(grammarPackage(grammar)), 'src', 'grammar.json'), 'utf8')).rules, found);
	for (const node of (await nodeMapOf(grammar)).nodes.values()) patternsIn(node.diagnosticRule, found);
	return found;
}

function sampler(seed: number): (n: number) => number {
	let state = seed;
	return (n) => {
		state = (state * 1103515245 + 12345) % 2147483648;
		return state % n;
	};
}

function acceptedWalks(dfa: PatternDfa, pick: (n: number) => number, count: number): string[] {
	const walks: string[] = [];
	for (let i = 0; i < count; i++) {
		let at = 0;
		let text = '';
		for (let step = 0; step < 12 && !(dfa.states[at]!.accepting && pick(3) === 0); step++) {
			const edges = dfa.states[at]!.edges;
			if (edges.length === 0) break;
			const edge = edges[pick(edges.length)]!;
			const [lo, hi] = edge.set.ranges[pick(edge.set.ranges.length)]!;
			const cp = lo + pick(Math.min(hi - lo + 1, 200));
			text += String.fromCodePoint(cp >= 0xd800 && cp <= 0xdfff ? 0x41 : cp);
			at = edge.to;
		}
		if (dfa.states[at]!.accepting) walks.push(text);
	}
	return walks;
}

describe('pattern automaton', () => {
	for (const grammar of allGrammars()) {
		it(`${grammar}: every grammar and node-map pattern has a DFA that agrees with the JavaScript engine`, async () => {
			const pick = sampler(7);
			for (const pattern of await grammarPatterns(grammar)) {
				const dfa = patternDfa(pattern);
				expect(dfa, pattern).toBeDefined();
				const engine = anchoredLeafRegex('probe', pattern) ?? /^$/u;
				const alphabet = [...new Set([...pattern, 'a', '0', '1', ' ', '\n', '"', '\\', '_', 'x', '.', 'é'])];
				const samples = new Set(['', 'a', '0', 'abc', '123', ' ', '\n', 'a\nb', ...acceptedWalks(dfa!, pick, 100)]);
				for (let i = 0; i < 200; i++) {
					samples.add(Array.from({ length: pick(7) }, () => alphabet[pick(alphabet.length)]).join(''));
				}
				for (const text of samples) expect(dfaAccepts(dfa!, text), `${pattern} on ${JSON.stringify(text)}`).toBe(engine.test(text));
			}
		}, 120_000);
	}

	const SEPARATORS = CharSet.chars('\u2028\u2029');
	const every = lineBreaksOf(['\n', '\r\n', '\r'], SEPARATORS);
	const kept = lineBreaksOf(['\n', '\r\n'], SEPARATORS);

	it('opens a line end for a run that absorbs the rest of a line and ends at every arm', () => {
		expect(opensLineEnd('.*', kept)).toBe(true);
		expect(opensLineEnd('[^\\r\\n\\u2028\\u2029]*', every)).toBe(true);
		expect(opensLineEnd('#!(?<content>.*)', kept)).toBe(true);
		expect(opensLineEnd('.*\\n?', kept)).toBe(true);
		expect(opensLineEnd(';[^\\n\\r ]*(?: [^\\n\\r ]*)*', kept)).toBe(true);
		expect(opensLineEnd('[^"\\\\\\r\\n]+', kept)).toBe(false);
		expect(opensLineEnd('a.*b', kept)).toBe(false);
		expect(opensLineEnd('[\\s\\S]*', kept)).toBe(false);
		expect(opensLineEnd('[^]*', kept)).toBe(false);
		expect(dfaAccepts(patternDfa('[^]')!, '\n')).toBe(true);
		expect(dfaAccepts(patternDfa('a[]')!, 'a]')).toBe(false);
	});

	it('reads the rest of a line as every character a render can write on it', () => {
		const ascii = lineBreaksOf(['\n', '\r\n'], CharSet.chars('\v\f'));
		expect(opensLineEnd('[^\\s]+', ascii)).toBe(false);
		expect(opensLineEnd('[^\\n\\r\\v\\f]*', ascii)).toBe(true);
		expect(opensLineEnd('[^\\n\\r\\t]*', ascii)).toBe(false);
	});

	it("passes an arm through a run whose characters take it, as tree-sitter's dot takes a carriage return", () => {
		expect(armsThrough(patternDfa('.*')!, every)).toEqual(['\r']);
		expect(armsThrough(patternDfa('#!(?<content>.*)')!, every)).toEqual(['\r']);
		expect(armsThrough(patternDfa('.*\\n?')!, every)).toEqual(['\r']);
		expect(armsThrough(patternDfa('[^\\r\\n\\u2028\\u2029]*')!, every)).toEqual([]);
		expect(armsThrough(patternDfa('[\\s\\S]*')!, every)).toEqual(['\n', '\r\n', '\r']);
		expect(opensLineEnd('.*', every)).toBe(false);
	});

	it("reads a pattern's digit, space and word classes as tree-sitter lexes them", () => {
		expect(dfaAccepts(patternDfa('\\s')!, '\u00a0')).toBe(false);
		expect(dfaAccepts(patternDfa('[^\\s]')!, '\u00a0')).toBe(true);
		expect(dfaAccepts(patternDfa('\\w')!, 'é')).toBe(false);
		expect(dfaAccepts(patternDfa('[\\s\\S]')!, '\u{1F600}')).toBe(true);
	});

	it('refuses syntax outside the tree-sitter dialect', () => {
		expect(patternDfa('a(?=b)')).toBeUndefined();
		expect(patternDfa('(a)\\1')).toBeUndefined();
		expect(opensLineEnd('\\bword', kept)).toBeUndefined();
	});

	it('marks the kinds whose token absorbs the rest of the line, and no string fragment', async () => {
		const expected: Record<string, { trivia: string[]; other: string[] }> = {
			rust: {
				trivia: ['line_comment'],
				other: ['doc_comment', 'line_comment_doc_inner', 'line_comment_doc_outer', 'line_comment_extra_slashes', 'line_comment_regular']
			},
			typescript: { trivia: ['comment_line'], other: ['hash_bang_line'] },
			python: { trivia: ['comment'], other: [] },
			regex: { trivia: [], other: [] },
			scm: { trivia: ['comment'], other: [] }
		};
		for (const [grammar, { trivia, other }] of Object.entries(expected)) {
			const nodeMap = await nodeMapOf(grammar);
			const terminated = [...nodeMap.nodes.keys()].filter((kind) => lineTerminated(nodeMap, kind) === true).sort();
			const triviaSet = triviaKinds(nodeMap);
			expect(terminated.filter((kind) => triviaSet.has(kind)), grammar).toEqual(trivia);
			expect(terminated.filter((kind) => !triviaSet.has(kind)), grammar).toEqual(other);
		}
	}, 120_000);

	it('flags only the outermost kind of each line-ending chain, trivia or not', async () => {
		const expected: Record<string, string[]> = {
			rust: ['line_comment'],
			typescript: ['comment_line', 'hash_bang_line'],
			python: ['comment'],
			regex: [],
			scm: ['comment']
		};
		for (const [grammar, kinds] of Object.entries(expected)) {
			expect([...lineTerminatedKinds(await nodeMapOf(grammar))].sort(), grammar).toEqual(kinds);
		}
	}, 120_000);
});

describe('endsWithLineBreak and requiresNonSpace', () => {
	const dfa = (pattern: string) => patternDfa(pattern)!;

	it('finds a pattern whose every text ends at a line break', () => {
		const breaks = CharSet.chars('\r\n');
		expect(endsWithLineBreak(dfa('\\\\(?:\\r)?\\n'), breaks)).toBe(true);
		expect(endsWithLineBreak(dfa('#.*'), breaks)).toBe(false);
		expect(endsWithLineBreak(dfa('\\n'), breaks)).toBe(true);
		expect(endsWithLineBreak(dfa('a\\nb'), breaks)).toBe(false);
		expect(endsWithLineBreak(dfa('(?:x\\n)+'), breaks)).toBe(true);
		expect(endsWithLineBreak(dfa('(?:x\\n)+x?'), breaks)).toBe(false);
		expect(endsWithLineBreak(dfa('[\\r?][\\n\\u2028\\u2029]'), breaks)).toBe(false);
	});

	it('tells a pattern that needs a visible character from one that can be all space', () => {
		expect(requiresNonSpace(dfa('\\\\(?:\\r)?\\n'))).toBe(true);
		expect(requiresNonSpace(dfa('\\n'))).toBe(false);
		expect(requiresNonSpace(dfa('[ \\t]*'))).toBe(false);
	});
});

describe('admitsInside', () => {
	const dfa = (pattern: string): PatternDfa => patternDfa(pattern)!;
	it('is true when some accepted text holds the literal with more text after it', () => {
		expect(admitsInside(dfa('[^]*'), '*/')).toBe(true);
		expect(admitsInside(dfa('[\\s\\S]*'), '"#')).toBe(true);
		expect(admitsInside(dfa('a[b]*c'), 'bb')).toBe(true);
	});
	it('is false when no accepted text can hold it', () => {
		expect(admitsInside(dfa('[^"\\\\]+'), '"')).toBe(false);
		expect(admitsInside(dfa('[^`\\\\$]+'), '${')).toBe(false);
		expect(admitsInside(dfa('a[b]*c'), 'cb')).toBe(false);
	});
	it('does not count the literal as the end of the text', () => {
		expect(admitsInside(dfa('.*\\n?'), '\n')).toBe(false);
		expect(admitsInside(dfa('ab'), 'b')).toBe(false);
		expect(admitsInside(dfa('abc'), 'b')).toBe(true);
	});
});

describe('leadingChars and shortestAccepted', () => {
	const dfa = (pattern: string) => patternDfa(pattern)!;

	it('reads the characters a pattern can start with, not the ones it only contains', () => {
		const lead = (pattern: string) => [...'"\'`\\a#*rbcx'].filter((char) => leadingChars(dfa(pattern)).has(char.codePointAt(0)!)).join('');
		expect(lead('\\\\*["\'`]+')).toBe('"\'`\\');
		expect(lead('"#*')).toBe('"');
		expect(lead('[bc]?r#*"')).toBe('rbc');
		expect(lead('x[\\s\\S]*')).toBe('x');
	});

	it('finds the shortest text a pattern accepts', () => {
		expect(shortestAccepted(dfa('[a-zA-Z]*["\'`]+'))).toBe('"');
		expect(shortestAccepted(dfa('[bc]?r#*"'))).toBe('r"');
		expect(shortestAccepted(dfa('"#*'))).toBe('"');
		expect(shortestAccepted(dfa('[^]*'))).toBe('');
	});
});

describe('includesNonEmpty', () => {
	const dfa = (pattern: string) => patternDfa(pattern)!;

	it('holds when every non-empty text the inner pattern accepts, the outer one accepts', () => {
		expect(includesNonEmpty(dfa('(?:\\\\[\\s\\S])*'), dfa('[\\s\\S]+'))).toBe(true);
		expect(includesNonEmpty(dfa('ab|ac'), dfa('a[bc]'))).toBe(true);
		expect(includesNonEmpty(dfa('a*'), dfa('a+'))).toBe(true);
	});

	it('fails on a text the outer pattern refuses, however far in it is', () => {
		expect(includesNonEmpty(dfa('(?:\\\\[\\s\\S])*'), dfa('\\\\[nt]'))).toBe(false);
		expect(includesNonEmpty(dfa('a[bc]'), dfa('ab'))).toBe(false);
		expect(includesNonEmpty(dfa('ab*c'), dfa('ab{0,3}c'))).toBe(false);
	});
});
