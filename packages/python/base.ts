// Typed wrapper over tree-sitter's untyped `grammar.js`: the upstream grammar cast to
// `PythonGrammarShape`, the `as const` emit of its grammar.json (see grammar-shapes/emit-grammar-shape.ts).
// Runtime is the real grammar.js; this only adds types. Node's type stripping loads this
// file, so it stays erasable (a cast and type-only imports).
// @ts-expect-error — tree-sitter's grammar.js has no declaration file (TS7016).
import raw from '../../node_modules/.pnpm/tree-sitter-python@0.25.0/node_modules/tree-sitter-python/grammar.js';
import type { PythonGrammarShape } from '../codegen/src/grammar-shapes/grammar-shape.python.ts';

const base = raw as PythonGrammarShape;
export default base;
