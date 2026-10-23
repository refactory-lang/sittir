// Builds the five grammar addons of one source tree in one shape, timing a
// clean build, and lays out each grammar's package as a release would ship
// it. Writes <out>/<variant>/build.json.
//
//   node variants.mjs --variant <name> --src <tree> --target-dir <dir> --out <dir>
//
// Variants:
// - today-release: static addons, the release profile (fat LTO, one unit);
// - today-gate: static addons, the gate profile (no LTO, 16 units);
// - dylib-release: -C prefer-dynamic, the release profile with LTO off
//   (rustc refuses LTO with prefer-dynamic), one unit;
// - dylib-gate: -C prefer-dynamic, the gate profile.
// A clean build, crates fetched beforehand (`cargo fetch --locked`): the
// target directory is emptied first, sccache is off, nothing is downloaded;
// the build is timed by bash's `time -p` (wall, user and system seconds).
// Every packaged image is stripped (`strip -x`, keeping the exported
// symbols the loader binds) and re-signed ad hoc on macOS, and its bytes
// broken down by kind (sections.mjs).
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { host, libFile, packageAddon } from './layout.mjs';
import { sections } from './sections.mjs';

const GRAMMARS = ['rust', 'typescript', 'python', 'scm', 'regex'];
const VARIANTS = {
	'today-release': { profile: 'release', dir: 'release', env: {} },
	'today-gate': { profile: 'gate', dir: 'gate', env: {} },
	'dylib-release': { profile: 'release', dir: 'release', env: { RUSTFLAGS: '-C prefer-dynamic', CARGO_PROFILE_RELEASE_LTO: 'off' }, engine: true },
	'dylib-gate': { profile: 'gate', dir: 'gate', env: { RUSTFLAGS: '-C prefer-dynamic' }, engine: true }
};

const { values } = parseArgs({ options: { variant: { type: 'string' }, src: { type: 'string' }, 'target-dir': { type: 'string' }, out: { type: 'string' } } });
const variant = VARIANTS[values.variant];
if (!variant || !values.src || !values['target-dir'] || !values.out) throw new Error(`usage: variants.mjs --variant <${Object.keys(VARIANTS).join('|')}> --src <tree> --target-dir <dir> --out <dir>`);
const targetDir = resolve(values['target-dir']);
const out = resolve(values.out, values.variant);

rmSync(targetDir, { recursive: true, force: true });
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const packages = [...(variant.engine ? ['sittir-engine'] : []), ...GRAMMARS.map((g) => `sittir-${g}`)];
const cargoArgs = ['build', '--frozen', '--profile', variant.profile, '--target', host, ...packages.flatMap((p) => ['-p', p])];
const build = spawnSync('bash', ['-c', 'time -p cargo "$@"', 'cargo', ...cargoArgs], {
	cwd: resolve(values.src),
	encoding: 'utf8',
	env: { ...process.env, ...variant.env, CARGO_TARGET_DIR: targetDir, RUSTC_WRAPPER: '', CARGO_BUILD_RUSTC_WRAPPER: '' }
});
if (build.status !== 0) throw new Error(`build failed:\n${build.stderr.slice(-4000)}`);
const time = Object.fromEntries([...build.stderr.matchAll(/^(real|user|sys) ([\d.]+)$/gm)].map((m) => [m[1], Number(m[2])]));

const built = join(targetDir, host, variant.dir);
const strip = (file) => {
	execFileSync('strip', ['-x', file], { stdio: 'ignore' });
	if (process.platform === 'darwin') execFileSync('codesign', ['--force', '--sign', '-', file], { stdio: 'ignore' });
};
const images = {};
for (const grammar of GRAMMARS) {
	const dir = join(out, grammar);
	if (variant.engine) {
		packageAddon(out, grammar, `sittir-${grammar}`, libFile(built, `sittir_${grammar}`), libFile(built, 'sittir_engine'));
	} else {
		mkdirSync(dir, { recursive: true });
		execFileSync('cp', [libFile(built, `sittir_${grammar}`), join(dir, `sittir-${grammar}.node`)]);
	}
	images[grammar] = {};
	for (const file of readdirSync(dir)) {
		strip(join(dir, file));
		images[grammar][file] = sections(join(dir, file));
	}
}
const result = { variant: values.variant, host, packages, time, images };
writeFileSync(join(out, 'build.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
