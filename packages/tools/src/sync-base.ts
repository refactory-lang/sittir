import { execFileSync } from 'node:child_process';
import { load, type CodegenSurface } from './codegen-surface.ts';

type GrammarName = Parameters<CodegenSurface['generatedManifest']['generatedRootsFor']>[0];

export interface SyncBaseOptions {
	readonly base: string;
	readonly cwd: string;
}

export interface SyncBaseTarget {
	readonly roots: Readonly<Record<string, readonly string[]>>;
	verify(grammar: string): boolean;
	regenerate(grammar: string): void;
}

const inRoot = (path: string, root: string): boolean => path === root || path.startsWith(`${root}/`);

export function grammarOfGeneratedPath(path: string, roots: SyncBaseTarget['roots']): string | undefined {
	return Object.keys(roots).find((grammar) => (roots[grammar] ?? []).some((root) => inRoot(path, root)));
}

export function syncBase(opts: SyncBaseOptions, target: SyncBaseTarget, out: (line: string) => void = console.log): number {
	const { cwd } = opts;
	const git = (args: string[], tolerate = false): string => {
		try {
			return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
		} catch (error) {
			if (tolerate) return (error as { stdout?: string }).stdout ?? '';
			throw error;
		}
	};
	const lines = (text: string): string[] => text.split('\n').filter((line) => line.length > 0);

	if (git(['status', '--porcelain']).trim().length > 0) {
		out('sync-base: the working tree has uncommitted changes; commit or stash them first');
		return 1;
	}

	const remote = opts.base.includes('/') ? opts.base.split('/')[0] : undefined;
	if (remote !== undefined && lines(git(['remote'])).includes(remote)) git(['fetch', remote]);

	const mergeHeadExists = (): boolean => git(['rev-parse', '-q', '--verify', 'MERGE_HEAD'], true).trim().length > 0;
	try {
		git(['merge', '--no-commit', '--no-ff', opts.base]);
	} catch (error) {
		if (!mergeHeadExists()) throw error;
	}
	if (!mergeHeadExists()) {
		out(`sync-base: already up to date with ${opts.base}`);
		return 0;
	}

	const conflicted = lines(git(['diff', '--name-only', '--diff-filter=U']));
	const generated = conflicted.filter((path) => grammarOfGeneratedPath(path, target.roots) !== undefined);
	const other = conflicted.filter((path) => !generated.includes(path));
	if (other.length > 0) {
		out('sync-base: conflicts outside the generated roots; resolve them by hand (the merge is left in progress):');
		for (const path of other) out(`  ${path}`);
		return 1;
	}

	const affected = new Set<string>();
	for (const path of generated) {
		affected.add(grammarOfGeneratedPath(path, target.roots)!);
		const baseHasIt = lines(git(['ls-files', '-u', '--', path])).some((entry) => /^\d+ [0-9a-f]+ 3\t/.test(entry));
		if (baseHasIt) {
			git(['checkout', '--theirs', '--', path]);
			git(['add', '--', path]);
		} else {
			git(['rm', '-q', '-f', '--', path]);
		}
	}
	for (const grammar of Object.keys(target.roots)) {
		if (!affected.has(grammar) && !target.verify(grammar)) {
			out(`sync-base: ${grammar}'s generated files are stale after the merge`);
			affected.add(grammar);
		}
	}
	for (const grammar of [...affected].sort()) {
		out(`sync-base: regenerating ${grammar}`);
		target.regenerate(grammar);
	}

	const allRoots = Object.values(target.roots).flat();
	const changed = [...lines(git(['diff', '--name-only'])), ...lines(git(['ls-files', '--others', '--exclude-standard']))];
	const outside = changed.filter((path) => !allRoots.some((root) => inRoot(path, root)));
	if (outside.length > 0) {
		out('sync-base: regeneration changed files outside the generated roots; review before committing (nothing was committed):');
		for (const path of outside) out(`  ${path}`);
		out(git(['diff', '--', ...outside], true));
		return 1;
	}

	const affectedRoots = [...affected].flatMap((grammar) => target.roots[grammar] ?? []);
	if (affectedRoots.length > 0) git(['add', '-A', '--', ...affectedRoots]);
	git(['commit', '--no-edit']);
	out(`sync-base: merged ${opts.base}${affected.size > 0 ? `, regenerated ${[...affected].sort().join(', ')}` : ''}`);
	return 0;
}

export async function repoSyncTarget(): Promise<{ target: SyncBaseTarget; cwd: string }> {
	const [manifest, grammars] = await Promise.all([load('generatedManifest'), load('grammars')]);
	const cwd = manifest.REPO_ROOT;
	const roots = Object.fromEntries(grammars.stableGrammars().map((grammar) => [grammar, manifest.generatedRootsFor(grammar)]));
	return {
		cwd,
		target: {
			roots,
			verify: (grammar) => manifest.verifyManifestForGrammar(grammar as GrammarName).ok,
			regenerate(grammar) {
				execFileSync(
					'pnpm',
					['exec', 'tsx', 'packages/cli/src/cli.ts', 'gen', '--grammar', grammar, '--all', '--output', `packages/${grammar}/src`],
					{ cwd, stdio: 'inherit' }
				);
			}
		}
	};
}

export async function run(opts: { base?: string }): Promise<number> {
	const { target, cwd } = await repoSyncTarget();
	return syncBase({ base: opts.base ?? 'origin/master', cwd }, target);
}
