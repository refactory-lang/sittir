import { describe, expect, it } from 'vitest';
import { evaluateGrammar, invoke } from '../codegen-surface.ts';
import { loadWebTreeSitter, upstreamWasmPath } from '../validate/common.ts';

interface WitnessCase {
	readonly grammar: string;
	readonly rule: string;
	readonly text: string;
	readonly kind: string;
}

const cases: WitnessCase[] = [];
for (const grammar of await invoke('grammars', 'allGrammars')) {
	const { ruleCauses = {} } = await evaluateGrammar(grammar);
	for (const [rule, declaration] of Object.entries(ruleCauses)) {
		if (declaration.kind !== 'reauthored' || declaration.witness === undefined) continue;
		cases.push({ grammar, rule, text: declaration.witness.text, kind: declaration.witness.kind });
	}
}

async function upstreamKindsOf(grammar: string, text: string): Promise<{ kinds: Set<string>; hasError: boolean }> {
	const wasm = upstreamWasmPath(grammar);
	if (wasm === undefined) throw new Error(`no upstream parser for ${grammar}`);
	const { Parser, Language } = await loadWebTreeSitter();
	const parser = new Parser();
	parser.setLanguage(await Language.load(wasm));
	const tree = parser.parse(text);
	if (!tree) throw new Error(`upstream ${grammar} parser returned no tree for ${JSON.stringify(text)}`);
	const kinds = new Set<string>();
	const pending = [tree.rootNode];
	for (let node = pending.pop(); node !== undefined; node = pending.pop()) {
		kinds.add(node.type);
		for (const child of node.children) if (child !== null) pending.push(child);
	}
	return { kinds, hasError: tree.rootNode.hasError };
}

describe('a rule reauthored because upstream accepts a form that is always another kind', () => {
	it('is declared by at least one grammar, so the cases below check something', () => {
		expect(cases.map(({ grammar, rule }) => `${grammar}:${rule}`)).toContain('python:tuple');
	});

	it.each(cases)('$grammar $rule: upstream parses $text as $kind and never as $rule', async ({ grammar, rule, text, kind }) => {
		const { kinds, hasError } = await upstreamKindsOf(grammar, text);
		expect(hasError).toBe(false);
		expect(kinds.has(kind)).toBe(true);
		expect(kinds.has(rule)).toBe(false);
	});
});
