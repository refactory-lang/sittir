const { resolve } = require('path');
const { readFileSync } = require('fs');
const TreeSitter = require('/Users/pmouli/GitHub.nosync/refactory-lang/sittir/node_modules/.pnpm/web-tree-sitter@0.25.10/node_modules/web-tree-sitter/tree-sitter.cjs');

async function main() {
  await TreeSitter.Parser.init();
  const parser = new TreeSitter.Parser();
  const wasmPath = resolve(__dirname, 'node_modules/.pnpm/tree-sitter-typescript@0.23.2/node_modules/tree-sitter-typescript/tree-sitter-typescript.wasm');
  const lang = await TreeSitter.Language.load(wasmPath);
  parser.setLanguage(lang);

  const file = process.argv[2];
  const source = file ? readFileSync(file, 'utf-8') : `export const FIELD_MAP: Record<string, ReadonlyArray<{
  name: string;
  required: boolean;
}>> = {
  'array': [
    { name: 'body', required: true, multiple: false },
  ],
};`;

  const tree = parser.parse(source);

  const FIELDS = ['declaration','name','value','source','type','body','kind','left','right','key','arguments','parameters','return_type','object','property','index','operator'];

  function printNode(node, indent) {
    indent = indent || 0;
    var prefix = '  '.repeat(indent);
    if (node.isNamed) {
      var text = node.childCount === 0 ? ' = ' + JSON.stringify(node.text) : '';
      console.log(prefix + node.type + text);
    } else {
      console.log(prefix + '"' + node.text + '"');
    }

    for (var i = 0; i < node.childCount; i++) {
      var child = node.child(i);
      for (var j = 0; j < FIELDS.length; j++) {
        var fc = node.childForFieldName(FIELDS[j]);
        if (fc && fc.id === child.id) {
          console.log('  '.repeat(indent + 1) + '@' + FIELDS[j] + ':');
        }
      }
      printNode(child, indent + 1);
    }
  }

  printNode(tree.rootNode);
}

main().catch(console.error);
