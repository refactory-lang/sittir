/**
 * @sittir/codegen — public surface
 *
 * The active generator is `generateV2` in `compiler/generate.ts`. The
 * legacy synchronous `generate()` that used to live here — along with
 * its v1 emitter chain (grammar-model, node-model, emitters/rules,
 * emitters/factories, emitters/types, emitters/wrap, emitters/from,
 * emitters/ir-namespace, emitters/test-new, emitters/type-test,
 * emitters/consts, emitters/client-utils, emitters/index-file) — has
 * been retired in favour of the five-phase pipeline.
 *
 * If you still have code importing `generate` from this module, use
 * `generateV2` from `@sittir/codegen/compiler/generate` instead.
 */

// Grammar metadata helpers — consumed by validators and the runtime
// routing maps. These live alongside the v2 pipeline (they read raw
// tree-sitter node-types.json) and aren't affected by the v1 retirement.
export {
    listBranchKinds,
    listLeafKinds,
    listKeywordTokens,
    listOperatorTokens,
    loadRawEntries,
    registerGrammarPath,
    collectRequiredTokens,
    listSupertypes,
    listLeafValues,
} from './grammar-reader.ts';

// Re-export the v2 generator at the package root for convenience.
export { generateV2 } from './compiler/generate.ts';
export type { GenerateConfigV2, GeneratedFilesV2 } from './compiler/generate.ts';
