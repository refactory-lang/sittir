// Typed wrapper over tree-sitter's untyped `grammar.js`.
//
// tree-sitter ships no `.d.ts`, and an ambient `declare module` can't type a
// resolvable `.js` import. So we import it here (one suppressed boundary) and
// re-export it as `RustGrammarShape` — the `as const` emit of this very grammar.
// `typeof base` then carries the recursive rule shapes, which flow through
// `enrich(base)` → `wire(config, …)` inference (no `WireConfig` annotation
// needed in overrides.ts). Runtime is the real grammar.js; this only adds types.
// @ts-expect-error — tree-sitter's grammar.js has no declaration file (TS7016).
import raw from '../../node_modules/.pnpm/tree-sitter-rust@0.24.0_tree-sitter@0.22.4/node_modules/tree-sitter-rust/grammar.js';
import type { RustGrammarShape } from '../codegen/src/grammar-shapes/grammar-shape.rust.ts';

const base = raw as RustGrammarShape;
export default base;
