import { existsSync } from 'node:fs';
import { evaluate } from './packages/codegen/src/compiler/evaluate.ts';
import { link } from './packages/codegen/src/compiler/link.ts';
import { optimize } from './packages/codegen/src/compiler/optimize.ts';
import { assemble } from './packages/codegen/src/compiler/assemble.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from './packages/codegen/src/compiler/resolve-grammar.ts';

const grammar = 'rust';
const grammarJsPath = resolveGrammarJsPath(grammar);
const overridesPath = resolveOverridesPath(grammar);
const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;

const raw = await evaluate(entryPath);
const linked = link(raw);
const optimized = optimize(linked);
const nodeMap = assemble(optimized);

const constItem = nodeMap.nodes.get('const_item');
if (constItem) {
  for (const f of constItem.structuralFields) {
    console.log('field:', f.name, 'kinds:', JSON.stringify(f.projection.kinds));
  }
}

const expr = nodeMap.nodes.get('_expression');
console.log('\n_expression:', expr?.modelType, expr?.typeName);
