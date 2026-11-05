const WT = '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/scratchpad/wt-role-arms';
const { compileBindings } = await import(`${WT}/packages/tools/src/inventory/index.ts`);
const grammars = process.argv.slice(2);
for (const r of await compileBindings(grammars)) console.log(`${r.grammar}: ${r.error === null ? `compiles, ${r.patterns} patterns` : `ERROR\n  ${r.error}`}`);
