import { describe, it, expect } from 'vitest';
import { emitJinjaTemplates, writeJinjaTemplates } from '../emitters/templates.ts';
import { AssembledBranch } from '../compiler/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { SeqRule } from '../compiler/rule.ts';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// T060 — single-file-diff guarantee: editing one rule's metadata
// produces exactly one modified `.jinja` file on regeneration; all
// other rules' files are byte-unchanged.
//
// T061a (adjacent) — new-grammar smoke: register a synthetic grammar
// via the emitter; assert it emits `.jinja` files (never YAML) under
// its templates/ directory and the emitter doesn't crash.

function makeNodeMap(nodes: Map<string, any>): NodeMap {
	return {
		grammar: 'test',
		grammarSha: 'test-sha',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

function ruleA(): SeqRule {
	return {
		type: 'seq',
		members: [
			{
				type: 'field',
				name: 'name',
				content: { type: 'symbol', name: '_ident' }
			}
		]
	};
}

function ruleB(): SeqRule {
	return {
		type: 'seq',
		members: [
			{
				type: 'field',
				name: 'value',
				content: { type: 'symbol', name: '_ident' }
			}
		]
	};
}

describe('T060: single-file diff on one-rule metadata change', () => {
	it("regenerating after editing one rule only touches that rule's .jinja", () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-single-diff-'));
		try {
			// Initial emit: two rules, a and b.
			const nodesV1 = new Map<string, any>([
				['rule_a', new AssembledBranch('rule_a', ruleA(), ruleA())],
				['rule_b', new AssembledBranch('rule_b', ruleB(), ruleB())]
			]);
			writeJinjaTemplates(emitJinjaTemplates({ grammar: 'test', nodeMap: makeNodeMap(nodesV1) }), dir);
			const v1A = readFileSync(join(dir, 'rule_a.jinja'), 'utf-8');
			const v1B = readFileSync(join(dir, 'rule_b.jinja'), 'utf-8');

			// Change rule_a's shape; rule_b unchanged.
			const ruleAPrime: SeqRule = {
				type: 'seq',
				members: [
					{ type: 'string', value: 'changed' },
					{
						type: 'field',
						name: 'name',
						content: { type: 'symbol', name: '_ident' }
					}
				]
			};
			const nodesV2 = new Map<string, any>([
				['rule_a', new AssembledBranch('rule_a', ruleAPrime, ruleAPrime)],
				['rule_b', new AssembledBranch('rule_b', ruleB(), ruleB())]
			]);
			writeJinjaTemplates(emitJinjaTemplates({ grammar: 'test', nodeMap: makeNodeMap(nodesV2) }), dir);
			const v2A = readFileSync(join(dir, 'rule_a.jinja'), 'utf-8');
			const v2B = readFileSync(join(dir, 'rule_b.jinja'), 'utf-8');

			// rule_a changed, rule_b byte-identical.
			expect(v2A).not.toBe(v1A);
			expect(v2B).toBe(v1B);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('T061a: synthetic new grammar emits .jinja files, not YAML', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-new-grammar-'));
		try {
			// Simulate a brand-new grammar with a handful of rules.
			// The emitter must produce .jinja files and nothing else.
			const nodes = new Map<string, any>([
				['greeting', new AssembledBranch('greeting', ruleA(), ruleA())],
				['farewell', new AssembledBranch('farewell', ruleB(), ruleB())]
			]);
			writeJinjaTemplates(
				emitJinjaTemplates({
					grammar: 'synthetic',
					nodeMap: makeNodeMap(nodes)
				}),
				dir
			);
			const files = readdirSync(dir);
			// All emitted files end in .jinja — separator metadata now
			// lives inline in each body via `| joinby("<sep>")`, so no
			// sidecar is written.
			expect(files.every((f) => f.endsWith('.jinja'))).toBe(true);
			expect(files.some((f) => f.endsWith('.yaml'))).toBe(false);
			expect(files).not.toContain('_meta.json');
			// Each body has the @generated header.
			for (const f of files) {
				expect(readFileSync(join(dir, f), 'utf-8')).toMatch(/^\{#-?\s*@generated/);
			}
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
