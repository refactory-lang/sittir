import { execFileSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	renameSync,
	rmSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { REPO_ROOT, grammarPackageDir, upstreamPackage } from '@sittir/codegen/grammars';
import { corpusSourcePath, upstreamCorpusDir } from './layout.ts';

export interface FetchCorpusOptions {
	readonly grammar: string;
	readonly update?: boolean;
}

export interface CorpusSource {
	readonly repository: string;
	readonly version: string;
	readonly ref: string;
	readonly commit: string;
	readonly files: readonly string[];
}

interface GithubRepo {
	readonly owner: string;
	readonly repo: string;
}

const GITHUB_REPO = /github\.com[/:]([^/]+)\/([^/#]+?)(?:\.git)?(?:[/#].*)?$/;

export function githubRepoOf(repository: unknown): GithubRepo {
	const url = typeof repository === 'string' ? repository : (repository as { url?: unknown } | undefined)?.url;
	if (typeof url !== 'string') throw new Error('corpus: the upstream package.json has no repository');
	const shorthand = url.match(/^github:([^/]+)\/([^/#]+)/);
	const match = shorthand ?? url.match(GITHUB_REPO);
	if (!match) throw new Error(`corpus: upstream repository '${url}' is not on GitHub`);
	return { owner: match[1]!, repo: match[2]! };
}

function installedUpstream(grammar: string): { dependency: string; version: string; repo: GithubRepo } {
	const dependency = upstreamPackage(grammar);
	const manifest = join(grammarPackageDir(grammar), 'node_modules', dependency, 'package.json');
	if (!existsSync(manifest))
		throw new Error(`corpus: ${dependency} is not installed for '${grammar}'; run pnpm install`);
	const pkg = JSON.parse(readFileSync(manifest, 'utf8')) as { version: string; repository?: unknown };
	return { dependency, version: pkg.version, repo: githubRepoOf(pkg.repository) };
}

export function candidateRefs(grammar: string, dependency: string, version: string, repo: GithubRepo): string[] {
	const pkg = JSON.parse(readFileSync(join(grammarPackageDir(grammar), 'package.json'), 'utf8')) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const spec = pkg.devDependencies?.[dependency] ?? pkg.dependencies?.[dependency] ?? '';
	const fragment = spec.match(/#(.+)$/)?.[1];
	if (fragment === undefined) return [`v${version}`, version];
	const lock = readFileSync(join(REPO_ROOT, 'pnpm-lock.yaml'), 'utf8');
	const locked = lock.match(new RegExp(`codeload\\.github\\.com/${repo.owner}/${repo.repo}/tar\\.gz/([0-9a-f]{40})`));
	return locked ? [locked[1]!] : [fragment];
}

export function archiveCommit(tarball: Buffer): string {
	const tar = gunzipSync(tarball);
	if (String.fromCharCode(tar[156]!) !== 'g')
		throw new Error('corpus: the archive has no global header naming its commit');
	const size = Number.parseInt(tar.subarray(124, 136).toString('ascii').split('\0')[0]!.trim(), 8);
	const records = tar.subarray(512, 512 + size).toString('utf8');
	const commit = records.match(/\d+ comment=([0-9a-f]{40})\n/)?.[1];
	if (commit === undefined) throw new Error('corpus: the archive header names no commit');
	return commit;
}

async function download(repo: GithubRepo, refs: readonly string[]): Promise<{ ref: string; tarball: Buffer }> {
	for (const ref of refs) {
		const url = `https://codeload.github.com/${repo.owner}/${repo.repo}/tar.gz/${ref}`;
		const response = await fetch(url);
		if (response.ok) return { ref, tarball: Buffer.from(await response.arrayBuffer()) };
		if (response.status !== 404) throw new Error(`corpus: ${url} answered ${response.status} ${response.statusText}`);
	}
	throw new Error(`corpus: ${repo.owner}/${repo.repo} has none of the refs ${refs.join(', ')}`);
}

function corpusFilesOf(tarball: Buffer): Map<string, string> {
	const scratch = mkdtempSync(join(tmpdir(), 'sittir-corpus-'));
	try {
		const archive = join(scratch, 'upstream.tar.gz');
		writeFileSync(archive, tarball);
		execFileSync('tar', ['-xzf', archive, '-C', scratch]);
		const [root] = readdirSync(scratch, { withFileTypes: true }).filter((e) => e.isDirectory());
		if (root === undefined) throw new Error('corpus: the archive is empty');
		const corpusDir = join(scratch, root.name, 'test', 'corpus');
		if (!existsSync(corpusDir)) return new Map();
		const files = new Map<string, string>();
		for (const rel of readdirSync(corpusDir, { recursive: true, encoding: 'utf8' }).sort()) {
			if (!rel.endsWith('.txt')) continue;
			files.set(rel.split(/[\\/]/).join('-'), readFileSync(join(corpusDir, rel), 'utf8'));
		}
		return files;
	} finally {
		rmSync(scratch, { recursive: true, force: true });
	}
}

export async function fetchUpstreamCorpus(opts: FetchCorpusOptions): Promise<CorpusSource> {
	const { dependency, version, repo } = installedUpstream(opts.grammar);
	const sourcePath = corpusSourcePath(opts.grammar);
	if (existsSync(sourcePath) && opts.update !== true) {
		const recorded = JSON.parse(readFileSync(sourcePath, 'utf8')) as CorpusSource;
		if (recorded.version !== version) {
			throw new Error(
				`corpus: '${opts.grammar}' corpus is pinned to ${dependency}@${recorded.version} but ${version} is installed; pass --update to refetch`
			);
		}
	}
	const { ref, tarball } = await download(repo, candidateRefs(opts.grammar, dependency, version, repo));
	const files = corpusFilesOf(tarball);
	if (files.size === 0) throw new Error(`corpus: ${repo.owner}/${repo.repo}@${ref} has no test/corpus/*.txt`);
	const source: CorpusSource = {
		repository: `https://github.com/${repo.owner}/${repo.repo}`,
		version,
		ref,
		commit: archiveCommit(tarball),
		files: [...files.keys()]
	};
	const dir = upstreamCorpusDir(opts.grammar);
	const staging = `${dir}.incoming`;
	rmSync(staging, { recursive: true, force: true });
	mkdirSync(staging, { recursive: true });
	for (const [name, contents] of files) writeFileSync(join(staging, name), contents);
	writeFileSync(join(staging, basename(sourcePath)), JSON.stringify(source, null, '\t') + '\n');
	rmSync(dir, { recursive: true, force: true });
	renameSync(staging, dir);
	return source;
}
