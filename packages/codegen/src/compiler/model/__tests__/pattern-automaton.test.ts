import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allGrammars, grammarPackage, sittirDirOf } from '../../../grammars.ts';
import { compileGrammar } from '../../compile.ts';
import { loadGeneratedIdTables } from '../../generated-metadata.ts';
import { anchoredLeafRegex } from '../leaf-pattern.ts';
import { dfaAccepts, opensLineEnd, patternDfa, type PatternDfa } from '../pattern-automaton.ts';
import { lineTerminated, triviaKinds } from '../trivia.ts';

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

	it('opens a line end only for a run that absorbs every character but a line terminator and never crosses a line', () => {
		expect(opensLineEnd('.*')).toBe(true);
		expect(opensLineEnd('[^\\r\\n\\u2028\\u2029]*')).toBe(true);
		expect(opensLineEnd('#!(?<content>.*)')).toBe(true);
		expect(opensLineEnd('.*\\n?')).toBe(true);
		expect(opensLineEnd('[^"\\\\\\r\\n]+')).toBe(false);
		expect(opensLineEnd('a.*b')).toBe(false);
		expect(opensLineEnd('[\\s\\S]*')).toBe(false);
		expect(opensLineEnd('[^]*')).toBe(false);
		expect(dfaAccepts(patternDfa('[^]')!, '\n')).toBe(true);
		expect(dfaAccepts(patternDfa('a[]')!, 'a]')).toBe(false);
	});

	it('refuses syntax outside the tree-sitter dialect', () => {
		expect(patternDfa('a(?=b)')).toBeUndefined();
		expect(patternDfa('(a)\\1')).toBeUndefined();
		expect(opensLineEnd('\\bword')).toBeUndefined();
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
});
