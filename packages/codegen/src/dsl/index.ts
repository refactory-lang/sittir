/**
 * @sittir/codegen/dsl — sittir-specific DSL additions for override files.
 *
 * This is the stable import surface for `packages/<lang>/overrides.ts`.
 * Override files import from here:
 *
 *     import { transform, insert, replace, role, enrich } from '@sittir/codegen/dsl'
 *
 * The baseline tree-sitter DSL functions (`grammar`, `seq`, `choice`,
 * `optional`, `repeat`, `repeat1`, `field`, `token`, `prec`, `alias`,
 * `blank`) are NOT exported from here — they are injected as globals
 * by `compiler/evaluate.ts` before each override file is dynamically
 * imported, mirroring tree-sitter's own convention where grammar.js
 * files call `grammar(...)` without importing it.
 */

export { transform, insert, replace } from './transform.ts'
export { role } from './role.ts'
export { enrich } from './enrich.ts'
