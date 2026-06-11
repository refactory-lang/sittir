// Generate an agent skill for the `sittir` CLI using @to-skills/cli.
//
// Runs against TypeScript source via tsx (root tsconfig `paths` resolve all
// @sittir/* deps to source), so no package build is required.
//
//   node_modules/.bin/tsx scripts/gen-cli-skill.mts
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { extractCliSkill, writeCliSkill } from '@to-skills/cli';
import { buildProgram } from '../packages/cli/src/cli.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const program = buildProgram();

const skill = await extractCliSkill({
  program,
  metadata: {
    name: 'sittir-cli',
    description: 'Unified sittir command-line surface — codegen, validation, and tooling commands',
    keywords: ['sittir', 'cli', 'codegen', 'validate', 'tools', 'commander'],
    repository: 'https://github.com/refactory-lang/sittir'
  }
});

writeCliSkill(skill, { outDir: resolve(repoRoot, 'skills') });

const issues = skill.audit && 'issues' in skill.audit ? skill.audit.issues : [];
console.log(`Generated skills/sittir-cli/ — ${issues.length} audit finding(s).`);
for (const i of issues) {
  console.log(`  [${i.severity ?? '?'}] ${i.code ?? ''} ${i.message ?? ''}`.trimEnd());
}
