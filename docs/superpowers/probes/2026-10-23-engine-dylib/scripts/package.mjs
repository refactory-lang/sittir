// Lays out one grammar package's native directory the way the amended shape
// ships it: the addon's `.node`, plus its own copy of the engine library and
// of the Rust std library beside it.
//
//   node package.mjs --out <dir> --node <name>=<built cdylib> --engine <built engine dylib>
//
// macOS: rustc records libstd by its absolute sysroot path (Homebrew) or as
// @rpath (rustup). Every reference and the copy's own id are rewritten to
// `@rpath/<file>`, which each image's LC_RPATH @loader_path resolves to its
// own directory, and the edited images are re-signed ad hoc (arm64 refuses
// unsigned code). Linux and Windows need no edits: the link already wrote
// RUNPATH $ORIGIN, and Windows searches the addon's own folder first.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
	options: { out: { type: 'string' }, node: { type: 'string', multiple: true }, engine: { type: 'string' } }
});
if (!values.out || !values.node || !values.engine) throw new Error('usage: package.mjs --out <dir> --node <name>=<cdylib> --engine <dylib>');

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** The Rust std shared library of the toolchain that built the binaries. */
function rustStd() {
	const sysroot = run('rustc', ['--print', 'sysroot']).trim();
	const host = /^host: (.+)$/m.exec(run('rustc', ['-vV']))[1];
	const dirs = [join(sysroot, 'lib', 'rustlib', host, 'lib'), join(sysroot, 'bin')];
	const pattern = process.platform === 'win32' ? /^std-[0-9a-f]+\.dll$/ : /^libstd-[0-9a-f]+\.(dylib|so)$/;
	for (const dir of dirs) {
		if (!existsSync(dir)) continue;
		const found = readdirSync(dir).filter((file) => pattern.test(file));
		if (found.length === 1) return join(dir, found[0]);
		if (found.length > 1) throw new Error(`more than one std library in ${dir}: ${found.join(', ')}`);
	}
	throw new Error(`no std shared library under ${dirs.join(' or ')}`);
}

mkdirSync(values.out, { recursive: true });
const std = rustStd();
const placed = [];
for (const spec of values.node) {
	const [name, built] = spec.split('=');
	const to = join(values.out, `${name}.node`);
	copyFileSync(built, to);
	placed.push(to);
}
for (const lib of [values.engine, std]) {
	const to = join(values.out, basename(lib));
	copyFileSync(lib, to);
	placed.push(to);
}

if (process.platform === 'darwin') {
	const stdFile = basename(std);
	for (const image of placed) {
		const references = run('otool', ['-L', image]).split('\n').slice(1).map((line) => line.trim().split(' ')[0]);
		const stdReference = references.find((reference) => basename(reference) === stdFile);
		if (stdReference && stdReference !== `@rpath/${stdFile}`) run('install_name_tool', ['-change', stdReference, `@rpath/${stdFile}`, image]);
		if (basename(image) === stdFile) run('install_name_tool', ['-id', `@rpath/${stdFile}`, image]);
		const rpaths = run('otool', ['-l', image]).match(/path @loader_path /g);
		if (!rpaths) run('install_name_tool', ['-add_rpath', '@loader_path', image]);
		run('codesign', ['--force', '--sign', '-', image]);
	}
}
console.log(placed.join('\n'));
