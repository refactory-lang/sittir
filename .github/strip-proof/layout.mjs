// node layout.mjs --static <grammar...> --repack <grammar...>   (from the repository root)
//
// Holds the release layout to the complete set, derived the way napi derives
// it: its own `parseTriple` over a crate's napi targets names each platform
// package (`<packageName>-<platformArchABI>`) and the binary it holds.
//
// --static, after `napi create-npm-dirs` in each crate: the crate's napi
//   targets are exactly the release workflow's build matrix, and the platform
//   packages written are exactly those the targets name. Needs no binaries.
// --repack, after `napi artifacts` too: every target's platform package holds
//   exactly one `.node`, its own; `npm publish --dry-run` of the package
//   succeeds and lists that `.node` exactly once; and the platform packages
//   are exactly the optional dependencies `napi pre-publish` gives the main
//   package.
// Prints each package's file list; exits 1 on any difference.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTriple } from '@napi-rs/cli';

const args = process.argv.slice(2);
const listOf = (flag) => {
	const at = args.indexOf(flag);
	if (at < 0) return [];
	const end = args.findIndex((arg, index) => index > at && arg.startsWith('--'));
	return args.slice(at + 1, end < 0 ? undefined : end);
};
const staticGrammars = listOf('--static');
const repackGrammars = listOf('--repack');
if (!staticGrammars.length && !repackGrammars.length) throw new Error('usage: layout.mjs --static <grammar...> --repack <grammar...>');

const releaseTargets = [...readFileSync('.github/workflows/release.yml', 'utf8').matchAll(/^\s+- target: (\S+)\s*$/gm)].map((m) => m[1]);
const problems = [];

function crateOf(grammar) {
	const crate = join('rust/crates', `sittir-${grammar}`);
	const { binaryName, packageName, targets } = JSON.parse(readFileSync(join(crate, 'package.json'), 'utf8')).napi;
	const platforms = targets.map((triple) => parseTriple(triple).platformArchABI);
	const npmDir = join(crate, 'npm');
	const present = existsSync(npmDir) ? readdirSync(npmDir).filter((dir) => existsSync(join(npmDir, dir, 'package.json'))) : [];
	return { binaryName, packageName, targets, platforms, npmDir, present };
}

const sameSet = (a, b) => a.length === b.length && a.every((item) => b.includes(item));

console.log(`## Release matrix: ${releaseTargets.join(', ')}\n`);
for (const grammar of staticGrammars) {
	const { packageName, targets, platforms, npmDir, present } = crateOf(grammar);
	if (!sameSet(targets, releaseTargets)) problems.push(`${grammar}: napi targets [${targets.join(', ')}] are not the release matrix`);
	if (!sameSet(present, platforms)) problems.push(`${grammar}: platform packages [${present.join(', ')}], targets name [${platforms.join(', ')}]`);
	for (const platform of present) {
		const name = JSON.parse(readFileSync(join(npmDir, platform, 'package.json'), 'utf8')).name;
		if (name !== `${packageName}-${platform}`) problems.push(`${grammar}/${platform}: package ${name}, not ${packageName}-${platform}`);
	}
	console.log(`- ${grammar}: ${targets.length} targets; platform packages ${present.sort().join(', ')}`);
}
console.log('');

for (const grammar of repackGrammars) {
	const { binaryName, packageName, platforms, npmDir, present } = crateOf(grammar);
	console.log(`## ${grammar} repacked: ${present.length} platform packages for ${platforms.length} targets\n`);
	for (const dir of present.filter((dir) => !platforms.includes(dir))) problems.push(`${grammar}: a platform package for no target, ${dir}`);
	const names = new Set();
	for (const platform of platforms) {
		const pkgDir = join(npmDir, platform);
		if (!existsSync(join(pkgDir, 'package.json'))) {
			problems.push(`${grammar}/${platform}: no platform package`);
			continue;
		}
		names.add(JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).name);
		const binary = `${binaryName}.${platform}.node`;
		const binaries = readdirSync(pkgDir).filter((file) => file.endsWith('.node'));
		if (binaries.length !== 1 || binaries[0] !== binary) problems.push(`${grammar}/${platform}: holds [${binaries.join(', ')}], not exactly ${binary}`);
		let published;
		try {
			published = JSON.parse(execFileSync('npm', ['publish', '--dry-run', '--json'], { cwd: pkgDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
		} catch (error) {
			problems.push(`${grammar}/${platform}: npm publish --dry-run failed: ${String(error.stderr ?? error.message).trim().split('\n').slice(-3).join(' ')}`);
			continue;
		}
		const files = (published.files ?? published[Object.keys(published)[0]]?.files ?? []).map((file) => file.path);
		const listed = files.filter((file) => file.endsWith('.node'));
		if (listed.length !== 1 || listed[0] !== binary) problems.push(`${grammar}/${platform}: npm publish lists [${listed.join(', ')}], not ${binary} once`);
		console.log(`- ${packageName}-${platform}: ${files.join(', ')}`);
	}
	const missing = platforms.map((platform) => `${packageName}-${platform}`).filter((name) => !names.has(name));
	if (missing.length) problems.push(`${grammar}: optional dependencies with no package: ${missing.join(', ')}`);
	console.log('');
}

console.log(problems.length ? `**${problems.length} layout problem(s):**\n${problems.map((problem) => `- ${problem}`).join('\n')}` : 'The layout is the complete set: every crate targets the release matrix, and every repacked target has exactly its one binary, published once.');
process.exitCode = problems.length ? 1 : 0;
