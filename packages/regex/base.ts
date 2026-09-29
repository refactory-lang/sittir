// Typed wrapper over tree-sitter's untyped `grammar.js`: the upstream grammar cast to
// `RegexGrammarShape`, the `as const` emit of its grammar.json (see grammar-shapes/emit-grammar-shape.ts).
// Runtime is the real grammar.js; this only adds types. Node's type stripping loads this
// file, so it stays erasable (a cast and type-only imports).
// @ts-expect-error — tree-sitter's grammar.js has no declaration file (TS7016).
import raw from 'tree-sitter-regex/grammar.js';
import type { RegexGrammarShape } from '../codegen/src/grammar-shapes/grammar-shape.regex.ts';

const base = raw as RegexGrammarShape;
export default base;
