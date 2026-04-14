/**
 * @sittir/codegen — public surface
 *
 * The five-phase pipeline (evaluate → link → optimize → assemble → emit)
 * is exposed as `generateV2`. The legacy synchronous `generate()` and
 * its v1 emitter chain have been retired.
 */

export { generateV2 } from './compiler/generate.ts'
export type { GenerateConfigV2, GeneratedFilesV2 } from './compiler/generate.ts'
