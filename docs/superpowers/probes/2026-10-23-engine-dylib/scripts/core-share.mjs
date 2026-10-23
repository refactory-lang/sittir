// What shape B would share on top of shape A: sittir-core without its napi
// bindings, built as a dylib against sittir-engine. Under A every addon
// carries this code; under B the process would hold it once. A dylib keeps
// all of a crate's non-generic code (it exports it), so its code bounds what
// B can share; generic code is instantiated per grammar under either shape.
// Its bytes are broken down by kind (sections.mjs).
// Writes <out>/core-share.json.
//
//   RUSTFLAGS="-C prefer-dynamic" node core-share.mjs --src <probe tree> --target-dir <dir> --out <dir>
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { host, libFile } from './layout.mjs';
import { sections } from './sections.mjs';

const { values } = parseArgs({ options: { src: { type: 'string' }, 'target-dir': { type: 'string' }, out: { type: 'string' } } });
const targetDir = resolve(values['target-dir']);
const out = resolve(values.out);
mkdirSync(out, { recursive: true });

execFileSync('cargo', ['rustc', '--frozen', '-p', 'sittir-core', '--profile', 'release', '--target', host, '--crate-type', 'dylib'], {
	cwd: resolve(values.src),
	stdio: 'inherit',
	env: { ...process.env, CARGO_TARGET_DIR: targetDir, CARGO_PROFILE_RELEASE_LTO: 'off', RUSTC_WRAPPER: '' }
});
const built = libFile(join(targetDir, host, 'release'), 'sittir_core');
const copy = join(out, built.split(/[\\/]/).pop());
copyFileSync(built, copy);
execFileSync('strip', ['-x', copy]);
if (process.platform === 'darwin') execFileSync('codesign', ['--force', '--sign', '-', copy]);

const result = { host, name: copy.split(/[\\/]/).pop(), bytes: sections(copy) };
writeFileSync(join(out, 'core-share.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
