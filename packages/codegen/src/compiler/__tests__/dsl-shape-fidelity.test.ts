import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateDsl } from '../evaluate.ts';
import { resolveGrammarJsPath } from '../resolve-grammar.ts';
import { rulesEqual } from '../../dsl/rule-patterns.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';

describe('the DSL builds the rule shapes tree-sitter builds', () => {
	it.each(['python', 'rust', 'typescript', 'scm', 'regex'])('%s matches its shipped grammar.json', async (grammar) => {
		const entry = resolveGrammarJsPath(grammar);
		const shipped = JSON.parse(readFileSync(join(dirname(entry), 'src', 'grammar.json'), 'utf8')) as {
			rules: Record<string, RuntimeRule>;
		};
		const evaluated = await evaluateDsl(entry);
		expect(Object.keys(evaluated.rules).sort()).toEqual(Object.keys(shipped.rules).sort());
		const divergent = Object.keys(shipped.rules).filter(
			(name) => !rulesEqual(evaluated.rules[name] as RuntimeRule, shipped.rules[name]!)
		);
		expect(divergent).toEqual([]);
	}, 60_000);
});
