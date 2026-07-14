import { loadParser } from './packages/codegen/src/compiler/parser.ts';
import { readNode } from './packages/common/src/engine.ts';

const parser = await loadParser('rust');
const tree = parser.parse('fn foo(x: u32) -> bool {}');

function findByType(node: any, type: string): any[] {
  const results: any[] = [];
  if (node.type === type) results.push(node);
  for (let i = 0; i < node.childCount; i++) {
    results.push(...findByType(node.child(i), type));
  }
  return results;
}

const ptNodes = findByType(tree.rootNode, 'primitive_type');
console.log('count:', ptNodes.length);
for (const n of ptNodes) {
  console.log('raw type:', n.type, 'typeId:', n.typeId);
  const data = readNode(n);
  console.log('readNode $type:', (data as any).$type, 'json:', JSON.stringify(data));
}
