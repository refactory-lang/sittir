import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkGate, gateBlobs, parseGateException, printGateManifest, readGateManifest, recordGateManifest } from '../index.ts';

const roots: string[] = [];

function repo(files: Readonly<Record<string, string>>): string {
	const root = mkdtempSync(join(tmpdir(), 'output-gate-'));
	roots.push(root);
	const git = (...args: string[]): void => {
		execFileSync('git', ['-c', 'user.email=gate@example.invalid', '-c', 'user.name=gate', '-c', 'commit.gpgsign=false', ...args], { cwd: root });
	};
	git('init', '-q');
	for (const [path, text] of Object.entries(files)) write(root, path, text);
	git('add', '-A');
	git('commit', '-q', '-m', 'outputs');
	return root;
}

function write(root: string, path: string, text: string): void {
	mkdirSync(dirname(join(root, path)), { recursive: true });
	writeFileSync(join(root, path), text);
}

const grammarJson = (value: Record<string, unknown>): string => `${JSON.stringify(value, null, 2)}\n`;

const OUTPUTS = {
	'gen/a.txt': 'a\n',
	'gen/src/grammar.json': grammarJson({ name: 'g', rules: { a: { type: 'BLANK' } }, splitFrom: {}, leadFrom: { _a: 'a' } })
};

afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('the output gate', () => {
	it('checks a recorded manifest clean against the same revision and against an unchanged worktree', () => {
		const root = repo(OUTPUTS);
		const manifest = recordGateManifest(['gen'], 'HEAD', root);
		expect([...manifest.entries.keys()]).toEqual(['gen/a.txt', 'gen/src/grammar.json']);
		expect(checkGate(manifest, gateBlobs(['gen'], 'HEAD', root), 'HEAD', [], root)).toEqual([]);
		expect(checkGate(manifest, gateBlobs(['gen'], 'worktree', root), 'worktree', [], root)).toEqual([]);
	});

	it('names a file one byte changed, a file gone, and a file added', () => {
		const root = repo(OUTPUTS);
		const manifest = recordGateManifest(['gen'], 'HEAD', root);
		write(root, 'gen/a.txt', 'b\n');
		rmSync(join(root, 'gen/src/grammar.json'));
		write(root, 'gen/new.txt', 'new\n');
		expect(checkGate(manifest, gateBlobs(['gen'], 'worktree', root), 'worktree', [], root)).toEqual([
			{ path: 'gen/a.txt', change: 'changed' },
			{ path: 'gen/new.txt', change: 'added' },
			{ path: 'gen/src/grammar.json', change: 'missing' }
		]);
	});

	it('ignores a difference only in the dropped keys, and still reports one in rules', () => {
		const root = repo(OUTPUTS);
		const manifest = recordGateManifest(['gen'], 'HEAD', root);
		const except = [parseGateException('gen/src/grammar.json:splitFrom,leadFrom')];
		write(root, 'gen/src/grammar.json', grammarJson({ name: 'g', rules: { a: { type: 'BLANK' } } }));
		expect(checkGate(manifest, gateBlobs(['gen'], 'worktree', root), 'worktree', except, root)).toEqual([]);
		write(root, 'gen/src/grammar.json', grammarJson({ name: 'g', rules: { a: { type: 'STRING', value: 'a' } } }));
		expect(checkGate(manifest, gateBlobs(['gen'], 'worktree', root), 'worktree', except, root)).toEqual([
			{ path: 'gen/src/grammar.json', change: 'changed' }
		]);
	});

	it('lets a whole-file exception differ or go missing, and reports a file with dropped keys missing', () => {
		const root = repo(OUTPUTS);
		const manifest = recordGateManifest(['gen'], 'HEAD', root);
		write(root, 'gen/a.txt', 'rewritten\n');
		expect(checkGate(manifest, gateBlobs(['gen'], 'worktree', root), 'worktree', [parseGateException('gen/a.txt')], root)).toEqual([]);
		rmSync(join(root, 'gen/a.txt'));
		rmSync(join(root, 'gen/src/grammar.json'));
		const except = [parseGateException('gen/a.txt'), parseGateException('gen/src/grammar.json:splitFrom')];
		expect(checkGate(manifest, gateBlobs(['gen'], 'worktree', root), 'worktree', except, root)).toEqual([
			{ path: 'gen/src/grammar.json', change: 'missing' }
		]);
	});

	it('reports an added file that only a key exception names', () => {
		const root = repo(OUTPUTS);
		const manifest = recordGateManifest(['gen'], 'HEAD', root);
		write(root, 'gen/src/new.json', grammarJson({ rules: { anything: { type: 'BLANK' } }, splitFrom: {} }));
		const except = [parseGateException('gen/src/new.json:splitFrom')];
		expect(checkGate(manifest, gateBlobs(['gen'], 'worktree', root), 'worktree', except, root)).toEqual([
			{ path: 'gen/src/new.json', change: 'added' }
		]);
	});

	it('reports a change of layout alone in a file with dropped keys', () => {
		const root = repo(OUTPUTS);
		const manifest = recordGateManifest(['gen'], 'HEAD', root);
		const except = [parseGateException('gen/src/grammar.json:splitFrom,leadFrom')];
		const value = { name: 'g', rules: { a: { type: 'BLANK' } } };
		for (const text of [`${JSON.stringify(value, null, 4)}\n`, JSON.stringify(value, null, 2)]) {
			write(root, 'gen/src/grammar.json', text);
			expect(checkGate(manifest, gateBlobs(['gen'], 'worktree', root), 'worktree', except, root)).toEqual([
				{ path: 'gen/src/grammar.json', change: 'changed' }
			]);
		}
	});

	it('hashes the bytes on disk, so a change of line endings alone shows', () => {
		const root = repo({ ...OUTPUTS, '.gitattributes': '* text=auto eol=lf\n' });
		const manifest = recordGateManifest(['gen'], 'HEAD', root);
		write(root, 'gen/a.txt', 'a\r\n');
		expect(checkGate(manifest, gateBlobs(['gen'], 'worktree', root), 'worktree', [], root)).toEqual([
			{ path: 'gen/a.txt', change: 'changed' }
		]);
	});

	it("sees a file that only a local or global exclude hides, and not one the repository's .gitignore ignores", () => {
		const root = repo({ ...OUTPUTS, '.gitignore': 'gen/ignored.txt\n' });
		const manifest = recordGateManifest(['gen'], 'HEAD', root);
		write(root, '.git/info/exclude', 'gen/local.txt\n');
		write(root, 'excludes', 'gen/global.txt\n');
		execFileSync('git', ['config', 'core.excludesFile', join(root, 'excludes')], { cwd: root });
		for (const name of ['ignored', 'local', 'global']) write(root, `gen/${name}.txt`, `${name}\n`);
		expect(checkGate(manifest, gateBlobs(['gen'], 'worktree', root), 'worktree', [], root)).toEqual([
			{ path: 'gen/global.txt', change: 'added' },
			{ path: 'gen/local.txt', change: 'added' }
		]);
	});

	it('reads back the manifest it prints', () => {
		const root = repo(OUTPUTS);
		const manifest = recordGateManifest(['gen'], 'HEAD', root);
		write(root, 'manifest.txt', printGateManifest(manifest, 'outputs'));
		expect(readFileSync(join(root, 'manifest.txt'), 'utf8').split('\n')[0]).toBe('# outputs');
		expect(readGateManifest(join(root, 'manifest.txt')).entries).toEqual(manifest.entries);
	});

	it('parses an exception with and without dropped keys', () => {
		expect(parseGateException('packages/rust/grammar.bindings.ts')).toEqual({ path: 'packages/rust/grammar.bindings.ts' });
		expect(parseGateException('a/grammar.json:splitFrom,leadFrom')).toEqual({ path: 'a/grammar.json', dropJsonKeys: ['splitFrom', 'leadFrom'] });
	});
});
