// Where cargo puts a built library on this host, and how a package lays out
// an addon with its own engine and std copies (package.mjs).
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export const host = /^host: (.+)$/m.exec(execFileSync('rustc', ['-vV'], { encoding: 'utf8' }))[1];

/** The file cargo builds for the dylib or cdylib `crate` (underscored) on this host. */
export function libFile(builtDir, crate) {
	if (process.platform === 'win32') return join(builtDir, `${crate}.dll`);
	return join(builtDir, `lib${crate}.${process.platform === 'darwin' ? 'dylib' : 'so'}`);
}

/** Lay out `<out>/<dir>` with `<node>.node` from the built cdylib, the engine and std; returns the `.node` path. */
export function packageAddon(out, dir, node, cdylib, engine) {
	execFileSync(process.execPath, [join(here, 'package.mjs'), '--out', join(out, dir), '--node', `${node}=${cdylib}`, '--engine', engine], { stdio: 'ignore' });
	return join(out, dir, `${node}.node`);
}

/** Run one of the probe scripts in a fresh process and parse its JSON report. */
export function report(script, args, nodeFlags = []) {
	const run = spawnSync(process.execPath, [...nodeFlags, join(here, script), ...args], { encoding: 'utf8' });
	if (run.status !== 0) return { exit: run.status, stderr: run.stderr.slice(-3000) };
	return JSON.parse(run.stdout);
}
