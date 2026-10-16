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
		for (const { text, kind } of declaration.witnesses ?? []) cases.push({ grammar, rule, text, kind, cause: declaration.cause });
	}
}

interface ParsedWitness {
	readonly kinds: Set<string>;
	readonly hasError: boolean;
	readonly errorStatements: Set<number>;
	readonly rootIsError: boolean;
}

async function parseWith(lang: Awaited<ReturnType<typeof loadLanguageForGrammar>>['lang'], text: string): Promise<ParsedWitness> {
	const { Parser } = await loadWebTreeSitter();
	const parser = new Parser();
	parser.setLanguage(lang);
	const tree = parser.parse(text);
	if (!tree) throw new Error(`parser returned no tree for ${JSON.stringify(text)}`);
	const kinds = new Set<string>();
	const errorStatements = new Set<number>();
	const pending = tree.rootNode.children.flatMap((child, index) => (child === null ? [] : [{ node: child, statement: index }]));
	for (let entry = pending.pop(); entry !== undefined; entry = pending.pop()) {
		const { node, statement } = entry;
		kinds.add(node.type);
		if (node.isError || node.isMissing) errorStatements.add(statement);
		for (const child of node.children) if (child !== null) pending.push({ node: child, statement });
	}
	return { kinds, hasError: tree.rootNode.hasError, errorStatements, rootIsError: tree.rootNode.isError };
}

async function upstreamParse(grammar: string, text: string): Promise<ParsedWitness> {
	const wasm = upstreamWasmPath(grammar);
	if (wasm === undefined) throw new Error(`no upstream parser for ${grammar}`);
	const { Language } = await loadWebTreeSitter();
	return parseWith(await Language.load(wasm), text);
}

async function sittirParse(grammar: string, text: string): Promise<ParsedWitness> {
	const { lang, isOverride } = await loadLanguageForGrammar(grammar);
	if (!isOverride) throw new Error(`${grammar} has no .sittir/parser.wasm to judge its authored rules`);
	return parseWith(lang, text);
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
		if (cause === 'accepts-invalid-syntax') {
			const sittir = await sittirParse(grammar, text);
			expect(sittir.hasError).toBe(true);
			expect(sittir.rootIsError).toBe(false);
			expect(sittir.errorStatements.size).toBe(1);
		}
	});
});
