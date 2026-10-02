import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	checkoutSource,
	manifestPath,
	verifyManifestForGrammar,
	writeManifestForGrammar,
	type VerifyResult
} from '../generated-manifest.ts';
import { withIndexSnapshot } from '../index-snapshot.ts';

const GRAMMAR = 'python';
const GRAMMAR_SOURCE = 'packages/python/grammar.sittir.ts';
const CODEGEN_SOURCE = 'packages/codegen/src/emit.ts';
const CODEGEN_TEST = 'packages/codegen/src/__tests__/emit.test.ts';
const GENERATED = 'packages/python/src/from-codegen.ts';

let repo: string;

const git = (...args: string[]): string =>
	execFileSync(
		'git',
		['-c', 'user.name=test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args],
		{ cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
	);

const write = (rel: string, content: string): void => {
	mkdirSync(dirname(join(repo, rel)), { recursive: true });
	writeFileSync(join(repo, rel), content);
};

const read = (rel: string): string => readFileSync(join(repo, rel), 'utf8');

const regenerate = (): void => {
	write('packages/python/src/from-grammar.ts', `// ${read(GRAMMAR_SOURCE)}\n`);
	write('packages/python/src/from-codegen.ts', `// ${read(CODEGEN_SOURCE)}\n`);
	writeManifestForGrammar(GRAMMAR, checkoutSource(repo));
};

const dropStamp = (): void => rmSync(join(repo, 'node_modules'), { recursive: true, force: true });

const commitAll = (message: string): void => {
	git('add', '-A');
	git('commit', '-q', '-m', message);
};

const verify = (): VerifyResult => verifyManifestForGrammar(GRAMMAR, checkoutSource(repo));

const verifyStaged = (): Promise<VerifyResult> =>
	withIndexSnapshot(repo, ['packages'], ({ root, visible }) =>
		verifyManifestForGrammar(GRAMMAR, { root, visible, checkout: repo })
	);

const mergeMasterUncommitted = (): void => {
	try {
		git('merge', '--no-commit', '--no-ff', '-X', 'theirs', 'master');
	} catch (error) {
		if (git('rev-parse', '-q', '--verify', 'MERGE_HEAD').trim().length === 0) throw error;
	}
};

beforeEach(() => {
	repo = mkdtempSync(join(tmpdir(), 'sittir-stamp-'));
	git('init', '-q', '-b', 'master');
	write('.gitignore', 'node_modules\n');
	write(GRAMMAR_SOURCE, 'grammar one');
	write('packages/python/package.json', '{}\n');
	write(CODEGEN_SOURCE, 'codegen one');
	write(CODEGEN_TEST, 'test one');
	regenerate();
	commitAll('base');
});

afterEach(() => {
	rmSync(repo, { recursive: true, force: true });
});

describe('the record of a generation', () => {
	it('is written outside everything git tracks or would track', () => {
		write(CODEGEN_SOURCE, 'codegen two');
		regenerate();
		expect(existsSync(manifestPath(GRAMMAR, checkoutSource(repo)))).toBe(true);
		expect(git('status', '--porcelain').split('\n').filter((line) => line.length > 0).sort()).toEqual([
			` M ${CODEGEN_SOURCE}`,
			` M ${GENERATED}`
		]);
	});

	it('keeps a bounded number of known-good pairs, dropping the oldest', () => {
		for (let round = 0; round < 10; round++) {
			write(CODEGEN_SOURCE, `codegen round ${round}`);
			regenerate();
		}
		const { known } = JSON.parse(readFileSync(manifestPath(GRAMMAR, checkoutSource(repo)), 'utf8')) as { known: unknown[] };
		expect(known).toHaveLength(8);
		write(CODEGEN_SOURCE, 'codegen round 9');
		expect(verify().ok).toBe(true);
	});

	it('is not shared between two worktrees of one repository', () => {
		const other = `${repo}-other`;
		git('worktree', 'add', '-q', other, '-b', 'other');
		try {
			writeFileSync(join(other, GENERATED), 'a hand edit');
			expect(verifyManifestForGrammar(GRAMMAR, checkoutSource(other))).toMatchObject({ ok: false, differs: [GENERATED], modified: [] });
			write(GENERATED, 'a hand edit');
			expect(verify()).toMatchObject({ ok: false, differs: [], modified: [GENERATED] });
		} finally {
			rmSync(other, { recursive: true, force: true });
		}
	});
});

describe('a hand edit to a generated file', () => {
	it('is named as modified when a generation is on record', () => {
		write(GENERATED, 'a hand edit');
		expect(verify()).toMatchObject({ ok: false, sourceChanged: false, modified: [GENERATED], differs: [] });
	});

	it('fails as a difference from HEAD when none is', () => {
		dropStamp();
		write(GENERATED, 'a hand edit');
		expect(verify()).toMatchObject({ ok: false, modified: [], differs: [GENERATED] });
	});

	it('is named as modified on a fresh clone once the clone has verified clean', () => {
		dropStamp();
		expect(verify().ok).toBe(true);
		write(GENERATED, 'a hand edit');
		expect(verify()).toMatchObject({ ok: false, modified: [GENERATED], differs: [] });
	});
});

describe('whether the source is the one the generated output came from', () => {
	it('holds for an uncommitted tree that was just regenerated', () => {
		write(CODEGEN_SOURCE, 'codegen two');
		regenerate();
		expect(verify()).toMatchObject({ ok: true, sourceChanged: false });
	});

	it('fails when a source input is edited after the regeneration', () => {
		write(CODEGEN_SOURCE, 'codegen two');
		expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
	});

	it('holds on a fresh clone, which has no stamp', () => {
		dropStamp();
		expect(verify()).toMatchObject({ ok: true, sourceChanged: false });
	});

	it('fails with no stamp once a source input differs from HEAD', () => {
		dropStamp();
		write(GRAMMAR_SOURCE, 'grammar two');
		expect(verify()).toMatchObject({ ok: false, differs: [GRAMMAR_SOURCE] });
	});

	it('holds when only a codegen test file is edited', () => {
		dropStamp();
		write(CODEGEN_TEST, 'test two');
		expect(verify()).toMatchObject({ ok: true, sourceChanged: false });
	});

	it('holds after switching to a branch whose source differs but whose output is the same', () => {
		git('checkout', '-q', '-b', 'refactor');
		write(CODEGEN_TEST, 'unrelated');
		write('packages/codegen/src/helper.ts', 'a refactor that changes no output');
		regenerate();
		commitAll('refactor');
		git('checkout', '-q', 'master');
		expect(verify()).toMatchObject({ ok: true, sourceChanged: false });
	});

	it('holds mid-merge when the branch touched no source and the merged side changed it', () => {
		git('checkout', '-q', '-b', 'topic');
		write('notes.md', 'unrelated');
		commitAll('topic');
		git('checkout', '-q', 'master');
		write(CODEGEN_SOURCE, 'codegen two');
		regenerate();
		commitAll('master changes codegen');
		git('checkout', '-q', 'topic');
		mergeMasterUncommitted();
		dropStamp();
		expect(verify()).toMatchObject({ ok: true, sourceChanged: false });
	});

	it('fails mid-merge when both sides changed the source, until regenerated', () => {
		git('checkout', '-q', '-b', 'topic');
		write(GRAMMAR_SOURCE, 'grammar two');
		regenerate();
		commitAll('topic changes the grammar');
		git('checkout', '-q', 'master');
		write(CODEGEN_SOURCE, 'codegen two');
		regenerate();
		commitAll('master changes codegen');
		git('checkout', '-q', 'topic');
		mergeMasterUncommitted();
		dropStamp();
		expect(verify().ok).toBe(false);
		regenerate();
		expect(verify()).toMatchObject({ ok: true, sourceChanged: false });
	});

	it('fails mid-merge when the source is one parent\'s and the output is the other\'s', () => {
		git('checkout', '-q', '-b', 'topic');
		write('notes.md', 'unrelated');
		commitAll('topic');
		git('checkout', '-q', 'master');
		write(CODEGEN_SOURCE, 'codegen two');
		regenerate();
		commitAll('master changes codegen');
		git('checkout', '-q', 'topic');
		mergeMasterUncommitted();
		dropStamp();
		git('checkout', 'HEAD', '--', CODEGEN_SOURCE);
		expect(verify()).toMatchObject({ ok: false, differs: [GENERATED] });
	});
});

describe('the staged tree', () => {
	it('is not vouched for by a source edit that is left unstaged', async () => {
		write(CODEGEN_SOURCE, 'codegen two');
		regenerate();
		git('add', 'packages/python');
		expect(await verifyStaged()).toMatchObject({ ok: false, sourceChanged: true });
	});

	it('holds when the source edit is staged with its output', async () => {
		write(CODEGEN_SOURCE, 'codegen two');
		regenerate();
		git('add', '-A');
		expect(await verifyStaged()).toMatchObject({ ok: true, sourceChanged: false });
	});
});
