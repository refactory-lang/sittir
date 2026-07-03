import { describe, expect, it } from 'vitest';
import {
	classifySource,
	compareWithBaseline,
	countByModule,
	markDead,
	PIPELINE_MODULES,
} from '../src/validate/propose-14.ts';

describe('propose-14 signature classification', () => {
	it('classifies (target, ctx: *Ctx) as conforming', () => {
		const recs = classifySource(
			'compiler/simplify.ts',
			'export function collapseSeq(rule: Rule, ctx: SimplifyCtx): Rule { return rule; }',
		);
		expect(recs).toHaveLength(1);
		expect(recs[0].name).toBe('collapseSeq');
		expect(recs[0].bucket).toBe('conforming');
	});

	it('classifies an optional-union ctx (SimplifyCtx | undefined) as conforming', () => {
		const recs = classifySource(
			'compiler/simplify.ts',
			'function fix(rule: Rule, ctx: SimplifyCtx | undefined, rules: Readonly<Record<string, Rule>>) {}',
		);
		expect(recs[0].bucket).toBe('conforming');
	});

	it('classifies (target, ctx, recursion-local) as conforming per CW6', () => {
		const recs = classifySource(
			'compiler/normalize.ts',
			'function liftRule(rule: Rule, ctx: NormalizeCtx, inField: boolean): Rule { return rule; }',
		);
		expect(recs[0].bucket).toBe('conforming');
	});

	it('classifies a single-param fn as getter-candidate', () => {
		const recs = classifySource(
			'compiler/model/node-map.ts',
			'export function storageKindOf(slot: AssembledSlot): string { return slot.kind; }',
		);
		expect(recs[0].bucket).toBe('getter-candidate');
	});

	it('classifies a zero-param fn as zero-param (outside the ratchet)', () => {
		const recs = classifySource('compiler/evaluate.ts', 'function freshScope() { return {}; }');
		expect(recs[0].bucket).toBe('zero-param');
	});

	it('classifies loose multi-param signatures as non-conforming', () => {
		const recs = classifySource(
			'compiler/link.ts',
			'export function walkRules(rule: Rule, rules: Map<string, Rule>, seen: Set<string>) {}',
		);
		expect(recs[0].bucket).toBe('non-conforming');
		expect(recs[0].params.map((p) => p.name)).toEqual(['rule', 'rules', 'seen']);
	});

	it('the FIRST param is always the target, even when it looks ctx-shaped — (ctx, target) is non-conforming', () => {
		const recs = classifySource(
			'compiler/link.ts',
			'function resolveRef(ctx: LinkCtx, rule: Rule) {}',
		);
		expect(recs[0].bucket).toBe('non-conforming');
	});

	it('classifies ctx in a LATER position as conforming — extra optional args may precede it', () => {
		// Mirrors assemble()'s real shape: optimized, generatedIdTables?, assembleCtx?.
		const recs = classifySource(
			'compiler/assemble.ts',
			'export function assemble(normalized: NormalizedGrammar, generatedIdTables: GeneratedIdTables, ctx: AssembleCtx) { return ctx; }',
		);
		expect(recs[0].bucket).toBe('conforming');
	});

	it('classifies a param literally named `ctx` as conforming even when its type does not end in Ctx', () => {
		// Mirrors link()'s own signature after the LinkCtx -> LinkOptions rename:
		// the public options bag is intentionally NOT *Ctx-suffixed, but the
		// param is still named `ctx` per convention.
		const recs = classifySource(
			'compiler/link.ts',
			'export function link(raw: RawGrammar, ctx: LinkOptions): LinkedGrammar { return raw; }',
		);
		expect(recs[0].bucket).toBe('conforming');
	});

	it('records class methods as Class.method and accessors as getter-candidate', () => {
		const recs = classifySource(
			'compiler/model/node-map.ts',
			`export class NodeMap {
				get size(): number { return 0; }
				lookup(kind: string, table: Map<string, number>, depth: number): number { return 0; }
			}`,
		);
		const byName = Object.fromEntries(recs.map((r) => [r.name, r.bucket]));
		expect(byName['NodeMap.size']).toBe('getter-candidate');
		expect(byName['NodeMap.lookup']).toBe('non-conforming');
	});

	it('captures exported arrow-const functions', () => {
		const recs = classifySource(
			'compiler/assemble.ts',
			'export const nameSlot = (slot: AssembledSlot, ctx: AssembleCtx) => slot.name;',
		);
		expect(recs[0].name).toBe('nameSlot');
		expect(recs[0].bucket).toBe('conforming');
	});
});

describe('propose-14 dead flagging', () => {
	const moduleSource = [
		'export function aliveHelper(rule: Rule, rules: Map<string, Rule>) { return rule; }',
		'export function testOnlyHelper(rule: Rule) { return rule; }',
		'export function orphanHelper(rule: Rule) { return rule; }',
		'function privateUsed(rule: Rule) { return rule; }',
		'export function caller(rule: Rule) { return privateUsed(rule); }',
		'function privateOrphan(rule: Rule) { return rule; }',
	].join('\n');

	const corpus = new Map<string, string>([
		['packages/codegen/src/compiler/link.ts', moduleSource],
		['packages/codegen/src/compiler/evaluate.ts', 'import { aliveHelper } from "./link.ts"; aliveHelper(r, rules);'],
		['packages/codegen/src/compiler/__tests__/link.test.ts', 'import { testOnlyHelper } from "../link.ts"; testOnlyHelper(r);'],
	]);

	it('flags exported fns with zero non-test external refs and no in-file use as dead', () => {
		const recs = markDead(classifySource('compiler/link.ts', moduleSource), corpus);
		const buckets = Object.fromEntries(recs.map((r) => [r.name, r.bucket]));
		expect(buckets['orphanHelper']).toBe('dead');
		expect(buckets['testOnlyHelper']).toBe('dead'); // kept alive only by its own tests
		expect(buckets['aliveHelper']).toBe('non-conforming'); // referenced from evaluate.ts — keeps signature bucket
		expect(buckets['privateUsed']).toBe('getter-candidate'); // used in-file
		expect(buckets['privateOrphan']).toBe('dead');
	});
});

describe('propose-14 ratchet comparison', () => {
	const counts = {
		'compiler/link.ts': { total: 10, conforming: 1, getterCandidate: 3, zeroParam: 0, nonConforming: 6, dead: 0 },
		'compiler/simplify.ts': { total: 5, conforming: 2, getterCandidate: 2, zeroParam: 0, nonConforming: 1, dead: 0 },
	};

	it('passes when counts equal the baseline', () => {
		const r = compareWithBaseline(counts, { modules: { 'compiler/link.ts': 6, 'compiler/simplify.ts': 1 } });
		expect(r.ok).toBe(true);
		expect(r.regressions).toEqual([]);
	});

	it('passes when counts dropped below the baseline (ratchet goes down)', () => {
		const r = compareWithBaseline(counts, { modules: { 'compiler/link.ts': 8, 'compiler/simplify.ts': 1 } });
		expect(r.ok).toBe(true);
	});

	it('fails when any module EXCEEDS its baseline', () => {
		const r = compareWithBaseline(counts, { modules: { 'compiler/link.ts': 5, 'compiler/simplify.ts': 1 } });
		expect(r.ok).toBe(false);
		expect(r.regressions).toEqual([{ module: 'compiler/link.ts', current: 6, baseline: 5 }]);
	});

	it('treats a module missing from the baseline as baseline 0 (new modules start clean)', () => {
		const r = compareWithBaseline(counts, { modules: { 'compiler/link.ts': 6 } });
		expect(r.ok).toBe(false);
		expect(r.regressions).toEqual([{ module: 'compiler/simplify.ts', current: 1, baseline: 0 }]);
	});
});

describe('propose-14 module aggregation + self-test', () => {
	it('aggregates per-module counts with exclusive buckets', () => {
		const recs = [
			...classifySource('compiler/link.ts', 'export function a(r: Rule, ctx: LinkCtx) {}'),
			...classifySource('compiler/link.ts', 'export function b(r: Rule, rules: Map<string, Rule>) {}'),
		];
		const counts = countByModule(recs);
		expect(counts['compiler/link.ts']).toEqual({
			total: 2,
			conforming: 1,
			getterCandidate: 0,
			zeroParam: 0,
			nonConforming: 1,
			dead: 0,
		});
	});

	it('self-test: classifies the real pipeline modules and finds known debt', () => {
		expect(PIPELINE_MODULES).toContain('compiler/evaluate.ts');
		// evaluate.ts at the R0 baseline has dozens of non-conforming fns (task-#8: 36).
		// The self-test only asserts the classifier finds SOME — exact counts live in the baseline.
		const { readFileSync } = require('node:fs') as typeof import('node:fs');
		const src = readFileSync(new URL('../../codegen/src/compiler/evaluate.ts', import.meta.url), 'utf8');
		const recs = classifySource('compiler/evaluate.ts', src);
		const counts = countByModule(recs);
		expect(counts['compiler/evaluate.ts'].total).toBeGreaterThan(30);
		expect(counts['compiler/evaluate.ts'].nonConforming).toBeGreaterThan(10);
	});
});

describe('propose-14 --json honors the ratchet gate (Codex P2)', () => {
	it('returns the failure code on regression even in json mode', async () => {
		const { mkdtempSync, writeFileSync: wf } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const { run } = await import('../src/validate/propose-14.ts');
		// doctored baseline: every module 0 → current counts MUST regress
		const dir = mkdtempSync(join(tmpdir(), 'p14-'));
		const baseline = join(dir, 'baseline.json');
		wf(baseline, JSON.stringify({ modules: {} }), 'utf8');
		const root = new URL('../../..', import.meta.url).pathname; // repo root
		const code = await run({ json: true, baseline, root });
		expect(code).toBe(1); // json changes the FORMAT, never the gate
	});
});
