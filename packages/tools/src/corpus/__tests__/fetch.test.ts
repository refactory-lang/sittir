import { describe, expect, it } from 'vitest';
import { gzipSync } from 'node:zlib';
import { upstreamPackage } from '@sittir/codegen/grammars';
import { archiveCommit, candidateRefs, githubRepoOf } from '../fetch.ts';

const SHA = '0123456789abcdef0123456789abcdef01234567';

function paxGlobalHeaderTarball(records: string): Buffer {
	const header = Buffer.alloc(512);
	header.write('pax_global_header', 0, 'ascii');
	header.write(Buffer.byteLength(records).toString(8).padStart(11, '0'), 124, 'ascii');
	header.write('g', 156, 'ascii');
	const body = Buffer.alloc(Math.ceil(Buffer.byteLength(records) / 512) * 512);
	body.write(records, 0, 'utf8');
	return gzipSync(Buffer.concat([header, body, Buffer.alloc(1024)]));
}

describe('githubRepoOf', () => {
	it('reads owner and repo from a git+https url, dropping .git', () => {
		expect(githubRepoOf({ url: 'git+https://github.com/tree-sitter/tree-sitter-rust.git' })).toEqual({
			owner: 'tree-sitter',
			repo: 'tree-sitter-rust'
		});
	});

	it('reads the github: shorthand', () => {
		expect(githubRepoOf('github:tree-sitter-grammars/tree-sitter-query')).toEqual({
			owner: 'tree-sitter-grammars',
			repo: 'tree-sitter-query'
		});
	});

	it('throws for a repository not on GitHub', () => {
		expect(() => githubRepoOf('https://gitlab.com/a/b')).toThrow(/not on GitHub/);
	});

	it('throws when the package names no repository', () => {
		expect(() => githubRepoOf(undefined)).toThrow(/no repository/);
	});
});

describe('candidateRefs', () => {
	it('tries the v-prefixed tag then the bare version for an npm dependency', () => {
		const repo = { owner: 'tree-sitter', repo: 'tree-sitter-rust' };
		expect(candidateRefs('rust', upstreamPackage('rust'), '0.24.0', repo)).toEqual(['v0.24.0', '0.24.0']);
	});

	it('pins a git dependency to the commit pnpm-lock resolved', () => {
		const repo = { owner: 'tree-sitter-grammars', repo: 'tree-sitter-query' };
		const refs = candidateRefs('scm', upstreamPackage('scm'), '0.0.0', repo);
		expect(refs).toHaveLength(1);
		expect(refs[0]).toMatch(/^[0-9a-f]{40}$/);
	});
});

describe('archiveCommit', () => {
	it('reads the commit from the pax global header comment', () => {
		expect(archiveCommit(paxGlobalHeaderTarball(`52 comment=${SHA}\n`))).toBe(SHA);
	});

	it('throws when the first entry is not a global header', () => {
		const tarball = gzipSync(Buffer.alloc(1536));
		expect(() => archiveCommit(tarball)).toThrow(/no global header/);
	});

	it('throws when the global header names no commit', () => {
		expect(() => archiveCommit(paxGlobalHeaderTarball('16 path=a/b/c.x\n'))).toThrow(/names no commit/);
	});
});
