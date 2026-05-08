import { readNode } from './packages/core/src/index.ts';
import { loadLanguageForGrammar } from './packages/codegen/src/validate/common.ts';

const grammar = 'typescript';
const lang = loadLanguageForGrammar(grammar);
const parser = lang.parser;
const source = `var x = 1;`;
const tree1 = parser.parse(source);

// Find variable_declaration node
function findNodeByType(node, type) {
  if (node.type === type) return node;
  for (let i = 0; i < node.childCount; i++) {
    const result = findNodeByType(node.child(i), type);
    if (result) return result;
  }
  return null;
}

const node = findNodeByType(tree1.rootNode, 'variable_declaration');
console.log('Found node:', node?.type);
if (node) {
  console.log('Node text:', node.text);
  console.log('Node children:');
  for (let i = 0; i < node.childCount; i++) {
    const c = node.child(i);
    console.log(`  [${i}] ${c.type} named=${c.isNamed} text="${c.text}"`);
  }
  const readData = readNode(lang.read, node);
  console.log('ReadNode result:', JSON.stringify(readData, null, 2));
}
