/**
 * compiler/generate.ts — New pipeline entry point
 *
 * Replaces the old generate() in index.ts.
 * Pipeline: evaluate → link → optimize → assemble → emitters
 */

import { existsSync } from 'node:fs'
import { evaluate } from './evaluate.ts'
import { link } from './link.ts'
import { optimize } from './optimize.ts'
import { assemble } from './assemble.ts'
import { resolveGrammarJsPath, resolveOverridesPath } from './resolve-grammar.ts'

import { emitGrammar } from '../emitters/grammar.ts'
import { emitTypesFromNodeMap } from '../emitters/types-v2.ts'
import { emitTemplatesFromNodeMap } from '../emitters/templates-v2.ts'
import { emitFactoriesFromNodeMap } from '../emitters/factories-v2.ts'
import { emitWrapFromNodeMap } from '../emitters/wrap-v2.ts'
import { emitFromNodeMap } from '../emitters/from-v2.ts'
import { emitClientUtilsFromNodeMap } from '../emitters/client-utils-v2.ts'
import { emitIrFromNodeMap } from '../emitters/ir-v2.ts'
import { emitTestsFromNodeMap } from '../emitters/test-v2.ts'
import { emitTypeTestsFromNodeMap } from '../emitters/type-test-v2.ts'
import { emitConfig } from '../emitters/config.ts'

// v2 emitters — consume NodeMap directly
import { emitConstsFromNodeMap } from '../emitters/consts-v2.ts'
import { emitIndexFromNodeMap } from '../emitters/index-file-v2.ts'
import { emitSuggestedFromNodeMap } from '../emitters/suggested-v2.ts'

import type { NodeMap } from './rule.ts'

export interface GeneratedFilesV2 {
    grammar: string
    types: string
    templatesYaml: string
    factories: string
    wrap: string
    utils: string
    from: string
    irNamespace: string
    consts: string
    index: string
    tests: string
    typeTests: string
    config: string
    nodeModel: string
    /** overrides.suggested.ts — human-readable derivation log (T042f). */
    suggested: string
    /** The intermediate NodeMap — available for inspection */
    nodeMap: NodeMap
}

export interface GenerateConfigV2 {
    grammar: string
    nodes?: string[]
    outputDir: string
    /**
     * Which derived source tags are accepted into the rule tree.
     * Defaults to all derived sources (permissive). `grammar` and
     * `override` are always-on and can't be filtered out — this
     * controls which DERIVATIONS Link's inference / promotion passes
     * mutate the rule tree with.
     *
     * Entries EXCLUDED from this filter still appear in the
     * `derivations` log (and therefore in `overrides.suggested.ts`)
     * so you can review what Link inferred and either adopt it into
     * overrides.ts or leave it in the log.
     *
     * @example
     * // Strict base pipeline — no inference / promotion:
     * { include: { rules: [], fields: [] } }
     *
     * // Accept promotion, review inference:
     * { include: { rules: ['promoted'], fields: [] } }
     *
     * // Default (permissive): everything applied.
     * { include: undefined }
     */
    include?: import('./rule.ts').IncludeFilter
}

/**
 * Generate typed factory code using the new five-phase pipeline.
 *
 * evaluate(grammar.js) → link → optimize → assemble → adapter → emitters
 */
export async function generateV2(cfg: GenerateConfigV2): Promise<GeneratedFilesV2> {
    // Resolve grammar.js path
    const grammarJsPath = resolveGrammarJsPath(cfg.grammar)

    // Use overrides.ts if it exists (grammar extension), else base grammar.js
    const overridesPath = resolveOverridesPath(cfg.grammar)
    const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath

    // Phase 1: Evaluate
    const raw = await evaluate(entryPath)

    // Phase 2: Link — pass the include filter so derivation passes
    // know whether to mutate the rule tree or only log to the sidecar.
    const linked = link(raw, cfg.include)

    // Phase 3: Optimize
    const optimized = optimize(linked)

    // Phase 4: Assemble
    const nodeMap = assemble(optimized)

    // Phase 5: Emit — every emitter consumes NodeMap directly. The
    // ir-namespace keys are populated on each AssembledNode during
    // assemble() (see resolveIrKeys), so emitters read node.irKey
    // directly. No side-channel map plumbing, no NodeMap→Hydrated adapter.
    return {
        grammar: emitGrammar({ grammar: cfg.grammar }),
        types: emitTypesFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        templatesYaml: emitTemplatesFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        factories: emitFactoriesFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        wrap: emitWrapFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        utils: emitClientUtilsFromNodeMap({ nodeMap }),
        from: emitFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        irNamespace: emitIrFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        consts: emitConstsFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        index: emitIndexFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        tests: emitTestsFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        typeTests: emitTypeTestsFromNodeMap({ nodeMap }),
        config: emitConfig({ grammar: cfg.grammar }),
        nodeModel: JSON.stringify({ name: nodeMap.name, nodeCount: nodeMap.nodes.size }, null, 2),
        suggested: emitSuggestedFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        nodeMap,
    }
}
