import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateDsl } from '../evaluate.ts';
import { resolveGrammarJsPath } from '../resolve-grammar.ts';
import { rulesEqual } from '../../dsl/rule-patterns.ts';
import { runTreeSitterCliCapturing } from '../../transpile/tree-sitter-cli.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';

describe('the DSL builds the rule shapes tree-sitter builds', () => {
	it.each(['python', 'rust', 'typescript', 'scm', 'regex'])('%s matches the grammar.json tree-sitter generates from its entry', async (grammar) => {
		const entry = resolveGrammarJsPath(grammar);
		const out = mkdtempSync(join(tmpdir(), 'dsl-shape-'));
		let shipped: { rules: Record<string, RuntimeRule> };
		try {
			const run = runTreeSitterCliCapturing(['generate', '--no-parser', '-o', out, entry], dirname(entry));
			if (run.status !== 0) throw new Error(`tree-sitter generate failed for ${grammar}: ${run.stderr}`);
			shipped = JSON.parse(readFileSync(join(out, 'grammar.json'), 'utf8')) as { rules: Record<string, RuntimeRule> };
		} finally {
			rmSync(out, { recursive: true, force: true });
		}
		const evaluated = await evaluateDsl(entry);
		expect(Object.keys(evaluated.rules).sort()).toEqual(Object.keys(shipped.rules).sort());
		const divergent = Object.keys(shipped.rules).filter(
			(name) => !rulesEqual(evaluated.rules[name] as RuntimeRule, shipped.rules[name]!)
		);
		expect(divergent).toEqual([]);
	}, 60_000);
});
