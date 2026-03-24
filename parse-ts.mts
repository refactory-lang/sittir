import { createRequire } from 'node:module';
import { resolve } from 'path';

const require = createRequire(import.meta.url);
const ParserModule = await import('web-tree-sitter');

// web-tree-sitter exports a function that needs to be called
const Parser = ParserModule.Parser;

const parser = new Parser();
const wasmPath = resolve('node_modules/.pnpm/tree-sitter-typescript@0.23.2/node_modules/tree-sitter-typescript/typescript/tree-sitter-typescript.wasm');
const lang = await Parser.Language.load(wasmPath);
parser.setLanguage(lang);

const source = `export const NODE_KINDS = [
  'array',
  'function_item',
] as const;

export type NodeKind = (typeof NODE_KINDS)[number];`;

const tree = parser.parse(source)?.rootNode.

const FIELDS = ['declaration','name','value','source','type','body','kind','left','right','key','arguments','parameters','return_type','object','property','index','operator','condition','consequence','alternative','constraint','type_arguments','type_parameters'];

function printNode(node, indent = 0) {
  const prefix = '  '.repeat(indent);
  if (node.isNamed) {
    const text = node.childCount === 0 ? ` = ${JSON.stringify(node.text)}` : '';
    console.log(`${prefix}${node.type}${text}`);
  } else {
    console.log(`${prefix}"${node.text}"`);
  }

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    for (const fname of FIELDS) {
      const fc = node.childForFieldName(fname);
      if (fc && fc.id === child.id) {
        console.log(`${'  '.repeat(indent + 1)}@${fname}:`);
      }
    }
    printNode(child, indent + 1);
  }
}

printNode(tree.rootNode);
