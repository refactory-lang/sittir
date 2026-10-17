import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from './_temp-grammar.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { runTreeSitterCliCapturing } from '../../transpile/tree-sitter-cli.ts';
import { isNonterminalRuleType } from '../../dsl/rule-patterns.ts';
import { isLiteralOnlyRule, isTerminalRootRule } from '../../dsl/rule-transforms.ts';
import type { NodeMap } from '../types.ts';

const evaluated = (rules: string) => evaluateTempGrammar({ extras: '', rules }, '', { bindings: '' });

const compiled = async (rules: string): Promise<NodeMap> => assemble(AssembleCtx.from(normalizeGrammar(link(await evaluated(rules)))));

describe('eof() through the compiler', () => {
	it('gives seq($.x, eof()) the same node keys, node class and value count as seq($.x)', async () => {
		const withEof = await compiled("source: ($) => repeat($.r), r: ($) => seq($.x, eof()), x: () => 'a'");
		const without = await compiled("source: ($) => repeat($.r), r: ($) => seq($.x), x: () => 'a'");
		expect([...withEof.nodes.keys()]).toEqual([...without.nodes.keys()]);
		expect(withEof.nodes.get('r')?.constructor).toBe(without.nodes.get('r')?.constructor);
		const members = (map: NodeMap) => ((map.nodes.get('r') as unknown as { simplifiedRule: { members?: unknown[] } }).simplifiedRule.members ?? []).length;
		expect(members(withEof)).toBe(members(without));
	}, 60_000);

	it('assembles a rule whose body is eof() exactly as a rule whose body is blank()', async () => {
		const withEof = await compiled("source: ($) => repeat($.root), e: ($) => eof(), root: ($) => seq($.e, 'x')");
		const withBlank = await compiled("source: ($) => repeat($.root), e: ($) => blank(), root: ($) => seq($.e, 'x')");
		expect([...withEof.nodes.keys()]).toEqual([...withBlank.nodes.keys()]);
		expect(withEof.nodes.get('root')?.constructor).toBe(withBlank.nodes.get('root')?.constructor);
	}, 60_000);

	it('gives a rule whose body is eof() none of the rule-level predicates a terminal or nonterminal has', async () => {
		const raw = await evaluated('source: ($) => repeat($.e), e: ($) => eof()');
		const rule = raw.rules.e as never;
		expect(isTerminalRootRule(rule)).toBe(false);
		expect(isLiteralOnlyRule(rule)).toBe(false);
		expect(isNonterminalRuleType(rule)).toBe(false);
	}, 60_000);
});

describe('eof() in the grammar.json the CLI writes', () => {
	it('writes EOF as the last member of a production ending in eof()', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-eof-json-'));
		try {
			writeFileSync(join(dir, 'grammar.js'), "module.exports = grammar({ name: 'demo', rules: { source: ($) => seq('a', eof()) } });\n");
			const run = runTreeSitterCliCapturing(['generate'], dir);
			if (run.status !== 0) throw new Error(`tree-sitter generate failed: ${run.stderr}`);
			const json = JSON.parse(readFileSync(join(dir, 'src/grammar.json'), 'utf8')) as { rules: { source: { members: unknown[] } } };
			expect(json.rules.source.members.at(-1)).toMatchObject({ type: 'EOF' });
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}, 60_000);
});
