// Typed wrapper over tree-sitter's untyped `grammar.js`: the upstream grammar cast to
// `TypescriptGrammarShape`, the `as const` emit of its grammar.json (see grammar-shapes/emit-grammar-shape.ts).
// Runtime is the real grammar.js; this only adds types. Node's type stripping loads this
// file, so it stays erasable (a cast and type-only imports).
// @ts-expect-error — tree-sitter's grammar.js has no declaration file (TS7016).
import raw from '../../node_modules/.pnpm/tree-sitter-typescript@0.23.2/node_modules/tree-sitter-typescript/typescript/grammar.js';
import type { TypescriptGrammarShape } from '../codegen/src/grammar-shapes/grammar-shape.typescript.ts';

const base = raw as TypescriptGrammarShape;
export default base;
