import { validateReadRenderParse } from '../packages/codegen/src/validate/read-render-parse.ts';
import { defaultTemplatesPath } from '../packages/validator/src/run.ts';

const grammar = (process.argv[2] ?? 'rust') as 'rust' | 'typescript' | 'python';
const backend = (process.argv[3] ?? 'native') as 'native' | 'typescript';

const result = await validateReadRenderParse(grammar, defaultTemplatesPath(grammar), { backend });
console.error(`pass=${result.pass}/${result.total} fail=${result.fail}`);
for (const e of result.errors) {
  console.log(`[${e.name}] ${e.message}`);
}
