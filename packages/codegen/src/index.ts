/**
 * @sittir/codegen — public surface.
 *
 * The five-phase pipeline (evaluate → link → optimize → assemble → emit)
 * is exposed as `generate`.
 */

export { generate } from './compiler/generate.ts'
export type { GenerateConfig, GeneratedFiles } from './compiler/generate.ts'
