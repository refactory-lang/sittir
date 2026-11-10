import { describe, expect, it } from 'vitest';
import { evaluateGrammar, invoke } from '../codegen-surface.ts';
import { languageAt, loadLanguageForGrammar, treeParser, upstreamWasmPath, type TSNode } from '../validate/common.ts';
import type { MisreadWitness, RuleCause } from '../../../codegen/src/dsl/primitives/rule-cause.ts';

interface WitnessCase {
	readonly grammar: string;
	readonly rule: string;
	readonly text: string;
	readonly kind: string;
	readonly cause: RuleCause;
	readonly read?: string;
}

const cases: WitnessCase[] = [];
for (const grammar of await invoke('grammars', 'allGrammars')) {
	const { ruleCauses = {} } = await evaluateGrammar(grammar);
	for (const [rule, declaration] of Object.entries(ruleCauses)) {
		if (declaration.kind !== 'reauthored') continue;
		for (const { cause, witnesses = [] } of declaration.causes)
			for (const witness of witnesses) {
				const { text, kind } = witness;
				const { read } = witness as Partial<MisreadWitness>;
				cases.push({ grammar, rule, text, kind, cause, ...(read === undefined ? {} : { read }) });
			}
	}
}

const SENTINELS: Readonly<Record<string, readonly [string, string]>> = {
	typescript: ['let sittirBefore = 0;\n', 'let sittirAfter = 0;\n'],
	python: ['sittir_before = 0\n', 'sittir_after = 0\n'],
	rust: ['fn sittir_before() {}\n', 'fn sittir_after() {}\n']
};

function nodesOf(root: TSNode): TSNode[] {
	const nodes: TSNode[] = [];
	const pending = [root];
	for (let node = pending.pop(); node !== undefined; node = pending.pop()) {
		nodes.push(node);
		for (const child of node.children) if (child !== null) pending.push(child);
	}
	return nodes;
}

async function upstreamParse(grammar: string, text: string): Promise<{ kinds: Set<string>; hasError: boolean }> {
	const wasm = upstreamWasmPath(grammar);
	if (wasm === undefined) throw new Error(`no upstream parser for ${grammar}`);
	using parser = treeParser(await languageAt(wasm));
	using tree = parser.parse(text);
	return { kinds: new Set(nodesOf(tree.root).map((node) => node.type)), hasError: tree.root.hasError };
}

async function sittirRejection(grammar: string, text: string): Promise<{ hasError: boolean; confined: boolean }> {
	const sentinels = SENTINELS[grammar];
	if (sentinels === undefined) throw new Error(`no sentinel statements for ${grammar}: add a valid statement pair to SENTINELS`);
	const language = await loadLanguageForGrammar(grammar);
	if (!language.isOverride) throw new Error(`${grammar} has no .sittir/parser.wasm to judge its authored rules`);
	const [before, after] = sentinels;
	const witness = text.endsWith('\n') ? text : `${text}\n`;
	using parser = treeParser(language);
	using tree = parser.parse(before + witness + after);
	const [start, end] = [before.length, before.length + witness.length];
	const root = tree.root;
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
		nodesOf(root)
			.filter((node) => node.isError || node.isMissing)
			.every((node) => node.startIndex >= start && node.endIndex <= end);
	return { hasError: root.hasError, confined };
}

describe('reauthoring grammar witnesses', () => {
	it('is declared by at least one grammar, so the cases below check something', () => {
		expect(cases.map(({ grammar, rule }) => `${grammar}:${rule}`)).toContain('python:tuple');
	});

	it.each(cases)('$grammar $rule: upstream accepts or rejects $text as its cause says ($kind)', async ({ grammar, rule, text, kind, cause, read }) => {
		const { kinds, hasError } = await upstreamParse(grammar, text);
		if (cause === 'rejects-valid-syntax') {
			expect(hasError).toBe(true);
			return;
		}
		if (cause === 'misreads-valid-syntax') {
			expect({ hasError, read: kinds.has(read!), kind: kinds.has(kind) }).toEqual({ hasError: false, read: true, kind: false });
			return;
		}
		expect(hasError).toBe(false);
		expect(kinds.has(kind)).toBe(true);
		if (cause === 'accepts-other-kind') expect(kinds.has(rule)).toBe(false);
		if (cause === 'accepts-invalid-syntax') expect(await sittirRejection(grammar, text)).toEqual({ hasError: true, confined: true });
	});
});
