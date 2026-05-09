import { parseArgs } from 'node:util';
import { validateReadRenderParse } from '../validate/read-render-parse.ts';

async function main(argv: string[]): Promise<number> {
const { values, positionals } = parseArgs({
args: argv,
options: {
grammar: { type: 'string', short: 'g' },
target: { type: 'string', short: 't' },
},
allowPositionals: true,
});

// Support legacy positional usage: probe-parity <grammar> <target>
const grammar = (values.grammar as string | undefined) ?? positionals[0] ?? 'rust';
const target = (values.target as string | undefined) ?? positionals[1] ?? 'visibility_modifier';

const covered = new Set<string>();
const r = await validateReadRenderParse(grammar, `./packages/${grammar}/templates`, {
backend: 'native',
onFixture: (fx) => {
if (fx.kind === 'roundtrip') covered.add(fx.pattern);
}
});

console.log(`[${grammar}] read-render-parse kinds covered: ${covered.size}`);
console.log(`  target '${target}' covered: ${covered.has(target)}`);
const variantChildren = [...covered].filter((k) => k.startsWith(`_${target}_`));
console.log(`  variant children covered:`, variantChildren);
console.log(
`  all errors involving '${target}':`,
r.errors
.filter((e) => e.name.includes(target))
.slice(0, 5)
.map((e) => e.name)
);
console.log(
`  all astMismatches involving '${target}':`,
r.astMismatches
.filter((e) => e.name.includes(target))
.slice(0, 5)
.map((e) => e.name)
);
console.log(`  pass=${r.pass}/${r.total} astMatchPass=${r.astMatchPass} skip=${r.skip}`);
console.log();
console.log(`Sample of covered kinds:`, [...covered].slice(0, 20).sort());
return 0;
}

/** Run the probe-parity CLI with the given argv (excluding node/script path). */
export async function run(argv: string[]): Promise<number> {
return main(argv);
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
run(process.argv.slice(2)).then(process.exit).catch((e) => {
process.stderr.write(`probe-parity: ${(e as Error).stack ?? e}\n`);
process.exit(1);
});
}
