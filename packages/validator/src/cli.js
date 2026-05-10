/**
 * Single canonical CLI entry point for @sittir/validator.
 *
 * Subcommands:
 *   counts [grammar...]         — per-grammar raw pass/total counts for all four validators
 *   probe-factory [grammar...]  — factory-render-parse error bucketing (top-8 buckets)
 *   history [n]                 — print the last N validation history entries (default 10)
 *
 * Usage:
 *   npx tsx packages/validator/src/cli.ts counts
 *   npx tsx packages/validator/src/cli.ts counts rust typescript
 *   npx tsx packages/validator/src/cli.ts probe-factory
 *   npx tsx packages/validator/src/cli.ts history
 *   npx tsx packages/validator/src/cli.ts history 20
 */
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { runFrom, runRt, runCoverage, runFactory, defaultTemplatesPath } from './run.js';
import { readHistory } from './history.js';
const ALL_GRAMMARS = ['rust', 'typescript', 'python'];
/** Parse grammar args; unknown names are silently dropped. Defaults to all three grammars. */
function resolveGrammars(args) {
    const valid = args.filter((a) => ALL_GRAMMARS.includes(a));
    return valid.length ? valid : ALL_GRAMMARS;
}
/** Run all four validators for one grammar and return a formatted counts string. */
async function grammarCounts(grammar) {
    const tp = defaultTemplatesPath(grammar);
    const [from, rt, cov, fac] = await Promise.all([
        runFrom(grammar, 'native'),
        runRt(grammar, tp, 'native'),
        Promise.resolve(runCoverage(grammar, tp)),
        runFactory(grammar, tp, 'native'),
    ]);
    return [
        `${grammar}:`,
        `  fromPass=${from.pass}    fromTotal=${from.total}`,
        `  covPass=${cov.pass}    covTotal=${cov.total}`,
        `  rtPass=${rt.pass}    rtTotal=${rt.total}    rtAstMatchPass=${rt.astMatchPass}`,
        `  factoryPass=${fac.pass}    factoryTotal=${fac.total}    factoryAstMatchPass=${fac.astMatchPass}`,
    ].join('\n');
}
/** Print top-8 error buckets from factory-render-parse for one grammar. */
async function grammarProbeFactory(grammar) {
    const tp = defaultTemplatesPath(grammar);
    const r = await runFactory(grammar, tp, 'native');
    console.log(`\n=== ${grammar} === total=${r.total} pass=${r.pass} fail=${r.fail} skip=${r.skip} astMatch=${r.astMatchPass}`);
    const buckets = new Map();
    for (const err of r.errors) {
        const key = (err.message.split(':')[0] ?? '').slice(0, 60);
        if (!buckets.has(key))
            buckets.set(key, []);
        buckets.get(key).push({ kind: err.kind, msg: err.message.slice(0, 140) });
    }
    for (const [key, items] of [...buckets.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 8)) {
        const byKind = new Map();
        for (const it of items)
            byKind.set(it.kind, (byKind.get(it.kind) ?? 0) + 1);
        console.log(`  [${items.length}] ${key}`);
        for (const [k, n] of [...byKind.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8))
            console.log(`     ${k}: ${n}`);
        console.log(`     sample: ${items[0]?.msg}`);
    }
}
/** Exported entry: counts subcommand — prints raw pass/total for all four validators. */
export async function runCountsCli(args) {
    const grammars = resolveGrammars(args);
    for (const g of grammars) {
        try {
            console.log(await grammarCounts(g));
        }
        catch (e) {
            console.log(`${g}: ERROR ${e.message}`);
        }
    }
}
/** Exported entry: probe-factory subcommand — error-bucket diagnostics for factory-render-parse. */
export async function runProbeFactoryCli(args) {
    const grammars = resolveGrammars(args);
    for (const g of grammars) {
        try {
            await grammarProbeFactory(g);
        }
        catch (e) {
            console.log(`${g}: ERROR ${e.message}`);
        }
    }
}
/** Exported entry: history subcommand — prints last N validation runs. */
export function runHistoryCli(args) {
    const n = parseInt(args.find((a) => /^\d+$/.test(a)) ?? '10', 10);
    const runs = readHistory().slice(-n);
    if (runs.length === 0) {
        console.log('No validation history found.');
        return;
    }
    console.log(`Last ${runs.length} validation run(s):\n`);
    for (const r of runs) {
        console.log(`${r.ts}  ${r.grammar}/${r.backend}` +
            `  from=${r.fromPass}/${r.fromTotal}` +
            `  cov=${r.covPass}/${r.covTotal}` +
            `  rt=${r.rtPass}/${r.rtTotal}` +
            `  fac=${r.factoryPass}/${r.factoryTotal}`);
    }
}
// Main dispatch — only executed when this file is the direct entrypoint.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const program = new Command()
        .name('sittir-validator')
        .description('Validation utilities for sittir grammar packages')
        .addHelpCommand(true);
    program
        .command('counts')
        .description('Per-grammar raw pass/total counts for all four validators')
        .argument('[grammars...]', 'Grammars to validate (rust, typescript, python); defaults to all')
        .action(async (grammars) => runCountsCli(grammars));
    program
        .command('probe-factory')
        .description('Factory-render-parse error bucketing (top-8 buckets)')
        .argument('[grammars...]', 'Grammars to validate (rust, typescript, python); defaults to all')
        .action(async (grammars) => runProbeFactoryCli(grammars));
    program
        .command('history')
        .description('Print last N validation history entries')
        .argument('[n]', 'Number of entries to show', '10')
        .action((n) => runHistoryCli([n]));
    await program.parseAsync(process.argv);
}
//# sourceMappingURL=cli.js.map