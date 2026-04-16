/**
 * @sittir/codegen/dsl — sittir's DSL layer for override files.
 *
 * This is the stable import surface for `packages/<lang>/overrides.ts`.
 * Override files import from here:
 *
 *     import { transform, insert, replace, role, enrich, field, alias } from '@sittir/codegen/dsl'
 *
 * Two categories of exports:
 *
 * **Pure sittir extensions** (no tree-sitter equivalent):
 *   - `transform` / `insert` / `replace` — override-authoring primitives
 *     that patch positions in an existing rule tree.
 *   - `role` — structural-whitespace annotation with per-grammar
 *     accumulator.
 *   - `enrich` — mechanical enrichment passes applied before the
 *     override's own rule callbacks run.
 *
 * **Sittir shadows of baseline tree-sitter DSL** (add one-arg shorthand;
 * two-arg calls delegate to the runtime-injected native):
 *   - `field(name)` — one-arg placeholder for `transform()` patches.
 *     Two-arg form delegates to the runtime's native `field()`.
 *   - `alias($.name)` — one-arg shorthand for `alias($.name, $.name)`.
 *     Two-arg form delegates to the runtime's native `alias()`.
 *
 * The remaining baseline tree-sitter DSL functions (`grammar`, `seq`,
 * `choice`, `optional`, `repeat`, `repeat1`, `token`, `prec`, `blank`)
 * are NOT exported from here — they're injected as globals by
 * `compiler/evaluate.ts` (sittir runtime) or by `tree-sitter` CLI
 * (transpiled output), mirroring tree-sitter's own convention where
 * grammar.js files call `grammar(...)` without importing it.
 */

export { transform, insert, replace } from './transform.ts'
export { role } from './role.ts'
export { enrich } from './enrich.ts'
export { alias } from './alias.ts'
export { field } from './field.ts'

import { installGrammarWrapper } from './synthetic-rules.ts'
installGrammarWrapper()
