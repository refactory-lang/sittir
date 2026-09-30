// The upstream tree-sitter grammar. tsconfig `paths` types this specifier as the grammar's
// generated shape (grammar-shapes/upstream/), so `raw` needs no cast; Node loads the real grammar.js.
// Node's type stripping loads this file, so it stays erasable.
import raw from 'tree-sitter-scm/grammar.js';
export default raw;
