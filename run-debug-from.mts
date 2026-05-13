// Temporarily patch from.ts to debug await_expression
import { validateFrom } from './packages/codegen/src/validate/from.ts';
import { awaitExpressionFrom } from './packages/rust/src/from.ts';
import { awaitExpression } from './packages/rust/src/factories.ts';
import { readTreeNode } from './packages/rust/src/wrap.ts';
import { buildReadHandle } from './packages/codegen/src/validate/common.ts';
import Parser from 'web-tree-sitter';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

await Parser.init();
const wasmPath = resolve('./packages/rust/.sittir/parser.wasm');
const lang = await Parser.Language.load(wasmPath);
const parser = new Parser();
parser.setLanguage(lang);

const src = `async fn foo(x: i32) -> i32 { x.await }`;
const tree = parser.parse(src)!;

// Find await_expression
function findKind(node: Parser.SyntaxNode, kind: string): Parser.SyntaxNode | null {
  if (node.type === kind) return node;
  for (const child of node.children) {
    const r = findKind(child, kind);
    if (r) return r;
  }
  return null;
}

const node1 = findKind(tree.rootNode, 'await_expression');
if (!node1) { console.log('NOT FOUND'); process.exit(1); }

const kindIdFromName = lang.idForNodeType.bind(lang);
const kindNameFromId = (id: number) => lang.nodeTypeForId(id) ?? String(id);

const handle = buildReadHandle('rust', tree, src, 'native', kindIdFromName);
console.log('handle.read:', !!handle.read);

// Find native coords
function findNativeNodeId(handle: any, targetKind: string, kindNameFromId: (id: number) => string): any {
  const root = handle.read!(handle.nodeHandle, 0);
  function search(nh: number, ci: number, depth: number): any {
    const d = handle.read!(nh, ci);
    if (!d) return null;
    const name = typeof d.$type === 'number' ? kindNameFromId(d.$type) : d.$type;
    if (name === targetKind) return { handle: nh, childIndex: ci };
    // recurse into children
    if (d.$children) {
      for (const c of d.$children) {
        if (c && typeof c === 'object' && '$nodeHandle' in c && '$childIndex' in c) {
          const r = search((c as any).$nodeHandle, (c as any).$childIndex, depth+1);
          if (r) return r;
        }
      }
    }
    return null;
  }
  if (!handle.nodeHandle) return null;
  return search(handle.nodeHandle, 0, 0);
}

// Use readTreeNode directly on node1
const adapted = { 
  id: node1.id, type: node1.type, startIndex: node1.startIndex, endIndex: node1.endIndex,
  startPosition: node1.startPosition, endPosition: node1.endPosition,
  childCount: node1.childCount, namedChildCount: node1.namedChildCount,
  hasError: node1.hasError, children: node1.children, parent: node1.parent,
  text: node1.text, isNamed: node1.isNamed
};

// Just use WASM path to inspect the wrapped node
const prev = handle.rootNode;
(handle as any).rootNode = adapted;
let readData: any;
try {
  readData = readTreeNode ? (readTreeNode as any)(handle) : null;
} finally {
  (handle as any).rootNode = prev;
}

console.log('readData.$children:', JSON.stringify(readData?.$children?.map((c: any) => ({ $type: c?.$type, $named: c?.$named, hasNodeHandle: c?.$nodeHandle != null })), null, 2));

const fromResult = awaitExpressionFrom(readData) as any;
console.log('\nfromResult.$children:', JSON.stringify(fromResult.$children?.map((c: any) => ({ type: typeof c, $type: c?.$type, $named: c?.$named })), null, 2));

const factoryResult = awaitExpression(readData.$children?.filter((c: any) => typeof c !== 'number' && c?.$named !== false)?.[0] as any) as any;
console.log('\nfactoryResult.$children:', JSON.stringify(factoryResult.$children?.map((c: any) => ({ type: typeof c, $type: c?.$type, $named: c?.$named })), null, 2));
