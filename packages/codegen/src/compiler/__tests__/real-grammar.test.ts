import { describe, it, expect } from 'vitest';
import { evaluate } from '../evaluate.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from '../resolve-grammar.ts';
import { loadGeneratedIdTables } from '../generated-metadata.ts';
import { ruleListParts } from '../../dsl/rule-patterns.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';

const pythonGrammar = resolveGrammarJsPath('python');
const rustGrammar = resolveGrammarJsPath('rust');
const tsGrammar = resolveGrammarJsPath('typescript');

describe('Evaluate — real tree-sitter grammars', () => {
	it('evaluates Python grammar.js', async () => {
		const raw = await evaluate(pythonGrammar, NO_FILE_TYPES);
		expect(raw.name).toBe('python');
		expect(Object.keys(raw.rules).length).toBeGreaterThan(50);
		expect(raw.references.length).toBeGreaterThan(0);
	});

	it('captures Python supertypes', async () => {
		const raw = await evaluate(pythonGrammar, NO_FILE_TYPES);
		expect(raw.supertypes).toContain('_simple_statement');
		expect(raw.supertypes).toContain('_compound_statement');
		expect(raw.supertypes.length).toBeGreaterThan(0);
	});

	it('captures Python externals', async () => {
		const raw = await evaluate(pythonGrammar, NO_FILE_TYPES);
		expect(raw.externals.length).toBeGreaterThan(0);
	});

	it.each([
		['python', (): string => resolveOverridesPath('python'), [']', ')', '}']],
		['typescript', (): string => resolveOverridesPath('typescript'), ['||']]
	])('%s keeps literal-text externals but mints no rule for them', async (_name, grammar, literals) => {
		const raw = await evaluate(grammar(), NO_FILE_TYPES);
		expect(literals.every((t) => ruleListParts(raw.externals).literals.includes(t))).toBe(true);
		const linked = link(raw, { generatedIdTables: await loadGeneratedIdTables(_name) });
		expect(literals.filter((t) => linked.rules[t] !== undefined)).toEqual([]);
	});

	it.each([
		['python', (): string => resolveOverridesPath('python')],
		['rust', (): string => resolveOverridesPath('rust')],
		['typescript', (): string => resolveOverridesPath('typescript')]
	])('%s mints no rule keyed by literal token text', async (_name, grammar) => {
		const raw = await evaluate(grammar(), NO_FILE_TYPES);
		const linked = link(raw, { generatedIdTables: await loadGeneratedIdTables(_name) });
		expect(Object.keys(linked.rules).filter((k) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(k))).toEqual([]);
	});

	it('has rules for key Python constructs', async () => {
		const raw = await evaluate(pythonGrammar, NO_FILE_TYPES);
		const ruleNames = Object.keys(raw.rules);
		expect(ruleNames).toContain('module');
		expect(ruleNames).toContain('function_definition');
		expect(ruleNames).toContain('class_definition');
		expect(ruleNames).toContain('if_statement');
	});
});

describe('Evaluate — Rust grammar.js', () => {
	it('evaluates Rust grammar', async () => {
		const raw = await evaluate(rustGrammar, NO_FILE_TYPES);
		expect(raw.name).toBe('rust');
		expect(Object.keys(raw.rules).length).toBeGreaterThan(100);
		expect(raw.references.length).toBeGreaterThan(0);
	});
});

describe('Evaluate — TypeScript grammar.js', () => {
	it('evaluates TypeScript grammar', async () => {
		const raw = await evaluate(tsGrammar, NO_FILE_TYPES);
		expect(raw.name).toBe('typescript');
		expect(Object.keys(raw.rules).length).toBeGreaterThan(100);
	});
});

describe('Full pipeline — evaluate → link → normalize → assemble', () => {
	it('processes Python through all 4 phases', async () => {
		const raw = await evaluate(pythonGrammar, NO_FILE_TYPES);
		const linked = link(raw);
		const normalized = normalizeGrammar(linked);
		const nodeMap = assemble(AssembleCtx.from(normalized));

		expect(nodeMap.name).toBe('python');
		expect(nodeMap.nodes.size).toBeGreaterThan(50);

		// Verify model type distribution
		const types = new Map<string, number>();
		for (const [, node] of nodeMap.nodes) {
			types.set(node.modelType, (types.get(node.modelType) ?? 0) + 1);
		}
		expect(types.get('branch')).toBeGreaterThan(10);
		expect(types.get('pattern')).toBeGreaterThan(0);
	});

	it('processes Rust through all 4 phases', async () => {
		const raw = await evaluate(rustGrammar, NO_FILE_TYPES);
		const linked = link(raw);
		const normalized = normalizeGrammar(linked);
		const nodeMap = assemble(AssembleCtx.from(normalized));

		expect(nodeMap.name).toBe('rust');
		expect(nodeMap.nodes.size).toBeGreaterThan(100);
	});
});
