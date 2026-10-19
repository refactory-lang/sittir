import { describe, expect, it } from 'vitest';
import { evaluateGrammar, invoke } from '../codegen-surface.ts';
import { loadLanguageForGrammar, loadWebTreeSitter, upstreamWasmPath } from '../validate/common.ts';
import type { RuleCause } from '../../../codegen/src/dsl/primitives/rule-cause.ts';

interface WitnessCase {
	readonly grammar: string;
	readonly rule: string;
	readonly text: string;
	readonly kind: string;
	readonly cause: RuleCause;
}

const cases: WitnessCase[] = [];
for (const grammar of await invoke('grammars', 'allGrammars')) {
	const { ruleCauses = {} } = await evaluateGrammar(grammar);
	for (const [rule, declaration] of Object.entries(ruleCauses)) {
		if (declaration.kind !== 'reauthored') continue;
		for (const { cause, witnesses = [] } of declaration.causes) for (const { text, kind } of witnesses) cases.push({ grammar, rule, text, kind, cause });
	}
}

type Language = Awaited<ReturnType<typeof loadLanguageForGrammar>>['lang'];
type Tree = NonNullable<ReturnType<InstanceType<Awaited<ReturnType<typeof loadWebTreeSitter>>['Parser']>['parse']>>;

const SENTINELS: Readonly<Record<string, readonly [string, string]>> = {
	typescript: ['let sittirBefore = 0;\n', 'let sittirAfter = 0;\n'],
	python: ['sittir_before = 0\n', 'sittir_after = 0\n'],
	rust: ['fn sittir_before() {}\n', 'fn sittir_after() {}\n']
};

async function parse(lang: Language, source: string): Promise<Tree> {
	const { Parser } = await loadWebTreeSitter();
	const parser = new Parser();
	parser.setLanguage(lang);
	const tree = parser.parse(source);
	if (!tree) throw new Error(`parser returned no tree for ${JSON.stringify(source)}`);
	return tree;
}

function nodesOf(tree: Tree): Tree['rootNode'][] {
	const nodes: Tree['rootNode'][] = [];
	const pending = [tree.rootNode];
	for (let node = pending.pop(); node !== undefined; node = pending.pop()) {
		nodes.push(node);
		for (const child of node.children) if (child !== null) pending.push(child);
	}
	return nodes;
}

async function upstreamParse(grammar: string, text: string): Promise<{ kinds: Set<string>; hasError: boolean }> {
	const wasm = upstreamWasmPath(grammar);
	if (wasm === undefined) throw new Error(`no upstream parser for ${grammar}`);
	const { Language } = await loadWebTreeSitter();
	const tree = await parse(await Language.load(wasm), text);
	return { kinds: new Set(nodesOf(tree).map((node) => node.type)), hasError: tree.rootNode.hasError };
}

async function sittirRejection(grammar: string, text: string): Promise<{ hasError: boolean; confined: boolean }> {
	const sentinels = SENTINELS[grammar];
	if (sentinels === undefined) throw new Error(`no sentinel statements for ${grammar}: add a valid statement pair to SENTINELS`);
	const { lang, isOverride } = await loadLanguageForGrammar(grammar);
	if (!isOverride) throw new Error(`${grammar} has no .sittir/parser.wasm to judge its authored rules`);
	const [before, after] = sentinels;
	const witness = text.endsWith('\n') ? text : `${text}\n`;
	const tree = await parse(lang, before + witness + after);
	const [start, end] = [before.length, before.length + witness.length];
	const root = tree.rootNode;
	const first = root.child(0);
	const last = root.child(root.childCount - 1);
	const confined =
		!root.isError &&
		first !== null &&
		!first.hasError &&
		first.endIndex <= start &&
		last !== null &&
		!last.hasError &&
		last.startIndex >= end &&
		nodesOf(tree)
			.filter((node) => node.isError || node.isMissing)
			.every((node) => node.startIndex >= start && node.endIndex <= end);
	return { hasError: root.hasError, confined };
}

describe('reauthoring grammar witnesses', () => {
	it('is declared by at least one grammar, so the cases below check something', () => {
		expect(cases.map(({ grammar, rule }) => `${grammar}:${rule}`)).toContain('python:tuple');
	});

	it.each(cases)('$grammar $rule: upstream accepts or rejects $text as its cause says ($kind)', async ({ grammar, rule, text, kind, cause }) => {
		const { kinds, hasError } = await upstreamParse(grammar, text);
		if (cause === 'rejects-valid-syntax') {
			expect(hasError).toBe(true);
			return;
		}
		expect(hasError).toBe(false);
		expect(kinds.has(kind)).toBe(true);
		if (cause === 'accepts-other-kind') expect(kinds.has(rule)).toBe(false);
		if (cause === 'accepts-invalid-syntax') expect(await sittirRejection(grammar, text)).toEqual({ hasError: true, confined: true });
	});
});
