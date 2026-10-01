import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PIPELINE_MODULES, run } from '../src/validate/propose-14.ts';

const MODULE = PIPELINE_MODULES[0]!;
const CONFORMING = 'export function liftRule(rule: Rule, ctx: LinkCtx): Rule { return rule; }\n';
const NON_CONFORMING =
	'export function walkRules(rule: Rule, rules: Map<string, Rule>, seen: Set<string>) {}\n' +
	'export function useRules(rule: Rule, ctx: LinkCtx): Rule { walkRules(rule, new Map(), new Set()); return rule; }\n';
const BASELINE = 'packages/codegen/.principle14-baseline.json';

let repo: string;
const git = (...args: string[]): string => execFileSync('git', args, { cwd: repo, encoding: 'utf8' });
const write = (rel: string, text: string): void => {
	mkdirSync(dirname(join(repo, rel)), { recursive: true });
	writeFileSync(join(repo, rel), text);
};

beforeEach(() => {
	vi.spyOn(console, 'log').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
	repo = mkdtempSync(join(tmpdir(), 'p14-staged-'));
	git('init', '-q');
	git('config', 'user.email', 'test@example.com');
	git('config', 'user.name', 'test');
	write(BASELINE, JSON.stringify({ modules: { [MODULE]: 0 } }));
	write(`packages/codegen/src/${MODULE}`, CONFORMING);
	git('add', '-A');
	git('commit', '-q', '-m', 'base');
});

afterEach(() => {
	vi.restoreAllMocks();
	rmSync(repo, { recursive: true, force: true });
});

describe('propose-14 --staged evaluates the commit snapshot', () => {
	it('does not reject a commit because of unrelated unstaged work', async () => {
		write(`packages/codegen/src/${MODULE}`, NON_CONFORMING);
		expect(await run({ root: repo })).toBe(1);
		expect(await run({ root: repo, staged: true })).toBe(0);
	});

	it('rejects a staged regression even when the working tree was fixed afterwards', async () => {
		write(`packages/codegen/src/${MODULE}`, NON_CONFORMING);
		git('add', '-A');
		write(`packages/codegen/src/${MODULE}`, CONFORMING);
		expect(await run({ root: repo })).toBe(0);
		expect(await run({ root: repo, staged: true })).toBe(1);
	});
});
