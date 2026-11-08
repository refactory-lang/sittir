import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

export function run(command: string, args: readonly string[], cwd: string): string {
	const child = spawnSync(command, args, { cwd, encoding: 'utf-8', shell: process.platform === 'win32' });
	if (child.status !== 0) {
		throw new Error(`${command} ${args.join(' ')} failed in ${cwd}:\n${child.stdout}${child.stderr}`);
	}
	return child.stdout;
}

export function packageBin(name: string, bin: string): string {
	const manifest = createRequire(import.meta.url).resolve(`${name}/package.json`);
	const bins = (JSON.parse(readFileSync(manifest, 'utf-8')) as { bin: Readonly<Record<string, string>> }).bin;
	const path = bins[bin];
	if (path === undefined) throw new Error(`${name} has no bin named ${bin}`);
	return join(dirname(manifest), path);
}
