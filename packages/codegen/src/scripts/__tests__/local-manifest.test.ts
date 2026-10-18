import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	checkoutSource,
	manifestPath,
	recordNativeBuild,
	recordedGeneration,
	stagedInputPathspecs,
	sourceFingerprint,
	verifyManifestForGrammar,
	writeManifestForGrammar,
	type VerifyResult
} from '../generated-manifest.ts';
import { withIndexSnapshot } from '../index-snapshot.ts';
import { writeUpstreamRecord } from '../../transpile/compile-parser.ts';
import { ensureWasmToolchain, treeSitterToolchain, treeSitterToolchainIdentity } from '../../transpile/tree-sitter-cli.ts';

vi.mock('../../transpile/tree-sitter-cli.ts', async (importOriginal) => {
	const real = await importOriginal<typeof import('../../transpile/tree-sitter-cli.ts')>();
	return { ...real, ensureWasmToolchain: vi.fn(real.ensureWasmToolchain), treeSitterToolchainIdentity: vi.fn(real.treeSitterToolchainIdentity) };
});

const GRAMMAR = 'python';
const GRAMMAR_SOURCE = 'packages/python/grammar.sittir.ts';
const CODEGEN_SOURCE = 'packages/codegen/src/emit.ts';
const CODEGEN_TEST = 'packages/codegen/src/__tests__/emit.test.ts';
const GENERATED = 'packages/python/src/from-codegen.ts';
const UPSTREAM_RECORD = 'packages/python/.sittir/upstream.json';

let repo: string;
let toolchainCache: string;

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

const regenerate = (editDuringGeneration?: () => void): void => {
	const src = checkoutSource(repo);
	const sources = sourceFingerprint(GRAMMAR, src);
	write('packages/python/src/from-grammar.ts', `// ${read(GRAMMAR_SOURCE)}\n`);
	write('packages/python/src/from-codegen.ts', `// ${read(CODEGEN_SOURCE)}\n`);
	mkdirSync(join(repo, dirname(UPSTREAM_RECORD)), { recursive: true });
	writeUpstreamRecord(join(repo, dirname(UPSTREAM_RECORD)), { key: 'upstream', toolchain: treeSitterToolchain() });
	editDuringGeneration?.();
	writeManifestForGrammar(GRAMMAR, sources, src);
};

const NATIVE_TYPINGS = 'packages/python/native/index.d.ts';

const buildNative = (editDuringBuild?: () => void): void => {
	const src = checkoutSource(repo);
	const generation = recordedGeneration(GRAMMAR, src)!;
	write(NATIVE_TYPINGS, `// typings for ${read(GENERATED)}`);
	editDuringBuild?.();
	recordNativeBuild(GRAMMAR, generation, src);
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

const installToolchain = (dir: string, version: string): void => {
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, '.version'), version);
};

const toolchainVersion = (name: string): string => join(toolchainCache, 'tree-sitter', name, '.version');

const toolchainExecutable = (dir: string, name: string, versionLine: string): void => {
	mkdirSync(join(dir, 'bin'), { recursive: true });
	writeFileSync(join(dir, 'bin', name), `#!/bin/sh\necho '${versionLine}'\n`);
	chmodSync(join(dir, 'bin', name), 0o755);
};

beforeEach(() => {
	toolchainCache = mkdtempSync(join(tmpdir(), 'sittir-toolchain-'));
	vi.stubEnv('XDG_CACHE_HOME', toolchainCache);
	vi.stubEnv('TREE_SITTER_WASI_SDK_PATH', undefined);
	vi.stubEnv('TREE_SITTER_BINARYEN_PATH', undefined);
	installToolchain(join(toolchainCache, 'tree-sitter', 'wasi-sdk'), '34.0');
	installToolchain(join(toolchainCache, 'tree-sitter', 'binaryen'), '132');
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
	rmSync(toolchainCache, { recursive: true, force: true });
	vi.unstubAllEnvs();
});

describe('the wasm toolchain the parsers are built with', () => {
	it('changes the source when a toolchain is replaced by another version', () => {
		writeFileSync(toolchainVersion('binaryen'), '133');
		expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
	});

	it('reads a missing toolchain version as a changed source, never as fresh, and does not throw', () => {
		rmSync(toolchainVersion('wasi-sdk'));
		expect(verify).not.toThrow();
		expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
	});

	it('is installed when missing before a generation fingerprints its sources', () => {
		vi.mocked(ensureWasmToolchain).mockClear();
		vi.mocked(treeSitterToolchainIdentity).mockClear();
		sourceFingerprint(GRAMMAR, checkoutSource(repo));
		expect(ensureWasmToolchain).toHaveBeenCalledOnce();
		expect(vi.mocked(ensureWasmToolchain).mock.invocationCallOrder[0]!).toBeLessThan(vi.mocked(treeSitterToolchainIdentity).mock.invocationCallOrder[0]!);
	});

	it('is only read when a generation is verified', () => {
		vi.mocked(ensureWasmToolchain).mockClear();
		verify();
		expect(ensureWasmToolchain).not.toHaveBeenCalled();
	});

	it('is the one TREE_SITTER_WASI_SDK_PATH names when it is set', () => {
		const own = join(toolchainCache, 'own-sdk');
		toolchainExecutable(own, 'clang', 'clang version 19.1.5-wasi-sdk');
		vi.stubEnv('TREE_SITTER_WASI_SDK_PATH', own);
		expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
		regenerate();
		expect(verify().ok).toBe(true);
	});
});

describe('the toolchain a committed tree names', () => {
	it('refuses a fresh clone whose toolchain moved since the committed generation, naming both', () => {
		dropStamp();
		writeFileSync(toolchainVersion('binaryen'), '133');
		const result = verify();
		expect(result.ok).toBe(false);
		expect(result.toolchainMoved).toEqual({ committed: expect.arrayContaining(['binaryen 132']), current: expect.arrayContaining(['binaryen 133']) });
	});

	it('records nothing when it refuses', () => {
		dropStamp();
		writeFileSync(toolchainVersion('binaryen'), '133');
		verify();
		expect(existsSync(manifestPath(GRAMMAR, checkoutSource(repo)))).toBe(false);
	});

	it('refuses with a generation on record too', () => {
		writeFileSync(toolchainVersion('binaryen'), '133');
		expect(verify().ok).toBe(false);
	});

	it('refuses a staged tree whose toolchain moved', async () => {
		dropStamp();
		writeFileSync(toolchainVersion('binaryen'), '133');
		expect((await verifyStaged()).toolchainMoved).toBeDefined();
	});

	it('refuses a committed tree that names no toolchain', () => {
		rmSync(join(repo, UPSTREAM_RECORD));
		commitAll('drop the upstream record');
		dropStamp();
		expect(verify()).toMatchObject({ ok: false, toolchainMoved: { committed: [], current: treeSitterToolchain() } });
	});

	it('passes a fresh clone with no toolchain installed, which cannot have built anything', () => {
		dropStamp();
		rmSync(join(toolchainCache, 'tree-sitter'), { recursive: true, force: true });
		expect(verify()).toMatchObject({ ok: true, toolchainMoved: undefined });
	});

	it('passes a fresh clone on the toolchain the committed tree names', () => {
		dropStamp();
		expect(verify()).toMatchObject({ ok: true, toolchainMoved: undefined });
	});
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

describe('bindings.scm as a source', () => {
	it('changes the source of a grammar when its bindings.scm is deleted', async () => {
		write('packages/python/bindings.scm', '(module) @file');
		write(GRAMMAR_SOURCE, 'grammar two');
		regenerate();
		commitAll('bound');
		rmSync(join(repo, 'packages/python/bindings.scm'));
		expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
		git('add', '-A');
		expect(await verifyStaged()).toMatchObject({ ok: false, sourceChanged: true });
	});
});

describe('the shared runtime generation executes as a source', () => {
	beforeEach(() => {
		write(
			'packages/common/package.json',
			JSON.stringify({
				name: '@sittir/common',
				exports: {
					'.': { types: './dist/index.d.ts', import: './dist/index.js' },
					'./error-kind': { types: './src/error-kind.ts', import: './src/error-kind.ts' }
				}
			})
		);
		write('packages/common/src/index.ts', "export { hostTemplateFor } from './reparse.ts';\nexport type { Shape } from './shape.ts';\n");
		write('packages/common/src/reparse.ts', "import { join } from './text.ts';\nexport const hostTemplateFor = () => join('a');\n");
		write('packages/common/src/text.ts', 'export const join = (s: string) => s;\n');
		write('packages/common/src/shape.ts', 'export interface Shape {}\n');
		write('packages/common/src/error-kind.ts', 'export const ERROR_KIND_ID = 65535;\n');
		write('packages/common/src/engine.ts', 'export const unrelated = 1;\n');
		write(
			CODEGEN_SOURCE,
			"import { hostTemplateFor } from '@sittir/common';\nimport type { Shape } from '@sittir/common';\nimport { ERROR_KIND_ID } from '@sittir/common/error-kind';\nconst emitted = \"import { unrelated } from './engine.ts';\";\n"
		);
		regenerate();
		commitAll('common in use');
	});

	for (const rel of ['packages/common/src/reparse.ts', 'packages/common/src/text.ts', 'packages/common/src/index.ts', 'packages/common/src/error-kind.ts']) {
		it(`changes the source when ${rel}, which generation runs, changes`, async () => {
			write(rel, `${read(rel)}// edited\n`);
			expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
			git('add', '-A');
			expect(await verifyStaged()).toMatchObject({ ok: false, sourceChanged: true });
		});
	}

	for (const rel of ['packages/common/src/engine.ts', 'packages/common/src/shape.ts']) {
		it(`leaves the source alone when ${rel}, which generation does not run, changes`, async () => {
			write(rel, `${read(rel)}// edited\n`);
			expect(verify().ok).toBe(true);
			git('add', '-A');
			expect((await verifyStaged()).ok).toBe(true);
		});
	}
});

describe('the upstream grammar as a source', () => {
	const UPSTREAM = 'packages/python/node_modules/tree-sitter-python';
	const NESTED = 'packages/python/node_modules/tree-sitter-javascript';

	beforeEach(() => {
		write('packages/python/base.ts', "export { default } from 'tree-sitter-python/grammar.js';\n");
		write(`${UPSTREAM}/package.json`, JSON.stringify({ name: 'tree-sitter-python', version: '0.25.0', dependencies: { 'tree-sitter-javascript': '^0.25.0', 'node-addon-api': '^8' } }));
		write(`${UPSTREAM}/grammar.js`, 'module.exports = grammar({ name: "python" });\n');
		write(`${UPSTREAM}/src/scanner.c`, 'int scan;\n');
		write(`${UPSTREAM}/src/parser.c`, 'int parse;\n');
		write(`${NESTED}/package.json`, JSON.stringify({ name: 'tree-sitter-javascript', version: '0.25.0' }));
		write(`${NESTED}/grammar.js`, 'module.exports = grammar({ name: "javascript" });\n');
		regenerate();
		commitAll('upstream installed');
	});

	for (const [what, rel, edit] of [
		['a new upstream version', `${UPSTREAM}/package.json`, JSON.stringify({ name: 'tree-sitter-python', version: '0.25.1' })],
		["the upstream's grammar", `${UPSTREAM}/grammar.js`, 'module.exports = grammar({ name: "python", extras: [] });\n'],
		["the upstream's scanner", `${UPSTREAM}/src/scanner.c`, 'int scan2;\n'],
		["a grammar the upstream builds on", `${NESTED}/grammar.js`, 'module.exports = grammar({ name: "javascript", word: null });\n'],
		['the base entry', 'packages/python/base.ts', "export { default } from 'tree-sitter-python/grammar.js';\nexport const extra = 1;\n"]
	] as const) {
		it(`changes the source when ${what} changes, with nothing tracked changed`, () => {
			write(rel, edit);
			expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
		});
	}

	it("leaves the source alone when only the upstream's generated parser changes", () => {
		write(`${UPSTREAM}/src/parser.c`, 'int parse2;\n');
		expect(verify().ok).toBe(true);
	});

	it('changes the source when only the lockfile changes, with the generation on record', () => {
		write('pnpm-lock.yaml', "lockfileVersion: '9.0'\n");
		regenerate();
		commitAll('lockfile');
		write('pnpm-lock.yaml', "lockfileVersion: '9.0'\n# a dependency moved\n");
		expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
	});

	it('does not trust the committed tree once the lockfile differs from it', () => {
		dropStamp();
		write('pnpm-lock.yaml', 'lockfileVersion: 9\n');
		expect(verify()).toMatchObject({ ok: false, differs: ['pnpm-lock.yaml'] });
	});
});

describe('the vocabulary as a source', () => {
	const VOCABULARY = 'packages/types/src/vocabulary/declaration.ts';

	it('changes the source of a grammar with bindings when a vocabulary file is edited', () => {
		write('packages/python/bindings.scm', '(module) @file');
		write(VOCABULARY, 'vocabulary one');
		regenerate();
		commitAll('bound');
		write(VOCABULARY, 'vocabulary two');
		expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
	});

	it('leaves the source of a grammar without bindings alone', () => {
		write(VOCABULARY, 'vocabulary two');
		expect(verify().ok).toBe(true);
	});

	it('changes the source of a grammar with bindings when a vocabulary file is deleted', async () => {
		write('packages/python/bindings.scm', '(module) @file');
		write(VOCABULARY, 'vocabulary one');
		write('packages/types/src/vocabulary/statement.ts', 'statement one');
		regenerate();
		commitAll('bound');
		rmSync(join(repo, 'packages/types/src/vocabulary/statement.ts'));
		expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
		git('add', '-A');
		expect(await verifyStaged()).toMatchObject({ ok: false, sourceChanged: true });
	});
});

describe('whether the source is the one the generated output came from', () => {
	it('records a generated file first written during the generation, so deleting it fails', () => {
		write(GRAMMAR_SOURCE, 'grammar two');
		regenerate(() => write('packages/python/src/emitted-late.ts', 'late\n'));
		rmSync(join(repo, 'packages/python/src/emitted-late.ts'));
		expect(verify()).toMatchObject({ ok: false, missing: ['packages/python/src/emitted-late.ts'] });
	});

	it('holds after a native build that rewrites only its own typings', () => {
		buildNative();
		expect(verify().ok).toBe(true);
	});

	it('refuses to record a native build when a generated file changed since the generation', () => {
		expect(() => buildNative(() => write(GENERATED, 'hand edit\n'))).toThrow(`${GENERATED} changed since the generation`);
		expect(verify()).toMatchObject({ ok: false, modified: [GENERATED] });
	});

	it('records a native build against the source the generation read', () => {
		buildNative(() => write(GRAMMAR_SOURCE, 'grammar edited mid-build'));
		expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
	});

	it('fails when a source input is edited while the generation runs', () => {
		regenerate(() => write(GRAMMAR_SOURCE, 'grammar edited mid-run'));
		expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
	});

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

	it('fails with no stamp when a source input is renamed into a path that is not one', () => {
		dropStamp();
		git('mv', CODEGEN_SOURCE, 'packages/codegen/src/__tests__/emit-moved.ts');
		expect(verify()).toMatchObject({ ok: false, differs: [CODEGEN_SOURCE] });
	});

	it('fails when the grammar\'s bindings.scm is edited after the regeneration', () => {
		write('packages/python/bindings.scm', '(identifier) @identifier');
		regenerate();
		write('packages/python/bindings.scm', '(identifier) @identifier.local');
		expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
	});

	it('fails when the reader pin moves under a grammar that ships a bindings.scm', () => {
		write('packages/python/bindings.scm', '(identifier) @identifier');
		write('bootstrap.json', '{ "sha": "one" }');
		regenerate();
		write('bootstrap.json', '{ "sha": "two" }');
		expect(verify()).toMatchObject({ ok: false, sourceChanged: true });
	});

	it('holds for the staged snapshot of a just-regenerated grammar that ships a bindings.scm', async () => {
		write('packages/python/bindings.scm', '(identifier) @identifier');
		write('bootstrap.json', '{ "sha": "one" }');
		regenerate();
		git('add', '-A');
		const staged = await withIndexSnapshot(repo, stagedInputPathspecs(), ({ root, visible }) =>
			verifyManifestForGrammar(GRAMMAR, { root, visible, checkout: repo })
		);
		expect(staged).toMatchObject({ ok: true, sourceChanged: false });
	});

	it('holds when the reader pin moves under a grammar with no bindings.scm', () => {
		write('bootstrap.json', '{ "sha": "one" }');
		regenerate();
		write('bootstrap.json', '{ "sha": "two" }');
		expect(verify()).toMatchObject({ ok: true, sourceChanged: false });
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

	it('is not vouched for when a staged rename takes a source input out of the inputs', async () => {
		dropStamp();
		git('mv', CODEGEN_SOURCE, 'packages/codegen/src/__tests__/emit-moved.ts');
		expect(await verifyStaged()).toMatchObject({ ok: false, differs: [CODEGEN_SOURCE] });
	});

	it('holds when the source edit is staged with its output', async () => {
		write(CODEGEN_SOURCE, 'codegen two');
		regenerate();
		git('add', '-A');
		expect(await verifyStaged()).toMatchObject({ ok: true, sourceChanged: false });
	});
});
