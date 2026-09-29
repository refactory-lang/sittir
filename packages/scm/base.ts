// Typed wrapper over tree-sitter's untyped `grammar.js`: the upstream grammar cast to
// `ScmGrammarShape`, the `as const` emit of its grammar.json (see grammar-shapes/emit-grammar-shape.ts).
// Runtime is the real grammar.js; this only adds types. Node's type stripping loads this
// file, so it stays erasable (a cast and type-only imports).
// @ts-expect-error — tree-sitter's grammar.js has no declaration file (TS7016).
import raw from 'tree-sitter-scm/grammar.js';
import type { ScmGrammarShape } from '../codegen/src/grammar-shapes/grammar-shape.scm.ts';

const base = raw as ScmGrammarShape;
export default base;
