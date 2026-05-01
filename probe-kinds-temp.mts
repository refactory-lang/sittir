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

const fn_item = nodeMap.nodes.get('function_item');
if (fn_item) {
  console.log('modelType:', fn_item.modelType);
  for (const f of fn_item.structuralFields) {
    console.log('field:', f.name, 'kinds:', JSON.stringify(f.projection.kinds));
  }
} else {
  console.log('function_item not found');
}

// Also check identifier
const ident = nodeMap.nodes.get('identifier');
console.log('\nidentifier node:', ident?.modelType, ident?.typeName);
