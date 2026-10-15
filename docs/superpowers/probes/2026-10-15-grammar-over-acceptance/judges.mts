// The language compilers as judges: tsc 7, CPython's compile() and rustc. Each takes sources and
// returns, per source, its error lines or 'accepted'. Shared by the census and the builder-contexts
// probe, so both read verdicts the same way.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const scratch = mkdtempSync(join(tmpdir(), 'over-acceptance-'));

function tscVerdicts(sources: string[]): string[] {
	// One program per witness: tsc skips the checker's grammar errors (TS1054 and its kin)
	// for the whole program once any file has a syntax error.
	writeFileSync(join(scratch, 'm.ts'), 'export type A = { x: 1 };\nexport type B<T = unknown> = T;\nexport default 0;\n');
	return sources.map((s, i) => {
		const f = join(scratch, `w${i}.ts`);
		writeFileSync(f, s);
		const r = spawnSync(join(ROOT, 'node_modules/.bin/tsc'), ['--ignoreConfig', '--noEmit', '--pretty', 'false', '--strict', '--target', 'esnext', '--module', 'esnext', '--moduleResolution', 'bundler', '--experimentalDecorators', '--skipLibCheck', f], { encoding: 'utf8' });
		const errors = `${r.stdout}${r.stderr}`
			.split('\n')
			.map((line) => /w\d+\.ts\(\d+,\d+\): error (TS\d+): (.*)$/.exec(line))
			.filter((m): m is RegExpExecArray => m !== null)
			.map((m) => `${m[1]} ${m[2]}`);
		return errors.join(' | ') || 'accepted';
	});
}

function pythonVerdicts(sources: string[]): string[] {
	const out = execFileSync('python3', ['-I', '-c', 'import json,sys\nr=[]\nfor s in json.load(sys.stdin):\n  try:\n    compile(s,"<w>","exec"); r.append("accepted")\n  except SyntaxError as e:\n    r.append(f"SyntaxError: {e.msg}")\nprint(json.dumps(r))'], { input: JSON.stringify(sources), encoding: 'utf8' });
	return JSON.parse(out) as string[];
}

function rustVerdicts(sources: string[]): string[] {
	return sources.map((s, i) => {
		const f = join(scratch, `w${i}.rs`);
		writeFileSync(f, s);
		const r = spawnSync('rustc', ['--edition', '2024', '--crate-type', 'lib', '--emit=metadata', '-o', join(scratch, `w${i}.rmeta`), f], { encoding: 'utf8' });
		const errors = r.stderr.split('\n').filter((l) => l.startsWith('error')).filter((l) => !l.startsWith('error: aborting'));
		return errors.join(' | ') || 'accepted';
	});
}

export const judges: Record<string, (s: string[]) => string[]> = { typescript: tscVerdicts, python: pythonVerdicts, rust: rustVerdicts };

export function removeScratch(): void {
	rmSync(scratch, { recursive: true, force: true });
}
