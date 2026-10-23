// Real grammar addons on the host: build sittir-engine and two grammars
// under -C prefer-dynamic, lay out each grammar's package with its own
// engine and std copies, run grammars.mjs, and report link facts. Prints one
// JSON report and writes it to <out>/report.json.
//
//   RUSTFLAGS="-C prefer-dynamic" node grammars-ci.mjs --out <dir> [--target-dir <dir>] [--grammars python,regex] [--profile gate]
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { host, libFile, packageAddon, report } from './layout.mjs';
import { linkFacts } from './symbols.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const { values } = parseArgs({
	options: { out: { type: 'string' }, 'target-dir': { type: 'string' }, grammars: { type: 'string' }, profile: { type: 'string' } }
});
const out = resolve(values.out ?? 'grammars-out');
const targetDir = resolve(values['target-dir'] ?? process.env.CARGO_TARGET_DIR ?? join(repo, 'target'));
const profile = values.profile ?? 'gate';
const grammars = (values.grammars ?? 'python,regex').split(',');
const built = join(targetDir, host, profile);

execFileSync('cargo', ['build', '--profile', profile, '--target', host, '-p', 'sittir-engine', ...grammars.flatMap((g) => ['-p', `sittir-${g}`])], {
	cwd: repo,
	stdio: 'inherit',
	env: { ...process.env, CARGO_TARGET_DIR: targetDir }
});

mkdirSync(out, { recursive: true });
const engine = libFile(built, 'sittir_engine');
const addons = grammars.map((g) => [g, packageAddon(out, `pkg-${g}`, `sittir-${g}`, libFile(built, `sittir_${g}`), engine)]);
const result = {
	host,
	check: report('grammars.mjs', addons.map(([g, node]) => `${g}=${node}`), ['--expose-gc']),
	links: {
		engine: linkFacts(join(out, `pkg-${grammars[0]}`, basename(engine))),
		...Object.fromEntries(addons.map(([g, node]) => [g, linkFacts(node)]))
	}
};
writeFileSync(join(out, 'report.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
