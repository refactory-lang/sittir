/**
 * compiler/generate.ts — New pipeline entry point
 *
 * Replaces the old generate() in index.ts.
 * Pipeline: evaluate → link → optimize → assemble → adapter → emitters
 */

import { existsSync } from 'node:fs'
import { evaluate } from './evaluate.ts'
import { link } from './link.ts'
import { optimize } from './optimize.ts'
import { assemble } from './assemble.ts'
import { toHydratedModels } from './adapter.ts'
import { resolveGrammarJsPath, resolveOverridesPath } from './resolve-grammar.ts'

import { emitGrammar } from '../emitters/grammar.ts'
import { emitTypesFromNodeMap } from '../emitters/types-v2.ts'
import { emitTemplatesFromNodeMap } from '../emitters/templates-v2.ts'
import { emitFactoriesFromNodeMap } from '../emitters/factories-v2.ts'
import { emitWrap } from '../emitters/wrap.ts'
import { emitFromNodeMap } from '../emitters/from-v2.ts'
import { emitClientUtilsFromNodeMap } from '../emitters/client-utils-v2.ts'
import { emitIrFromNodeMap } from '../emitters/ir-v2.ts'
import { emitTestsFromNodeMap } from '../emitters/test-v2.ts'
import { buildIrKeyMap } from '../emitters/ir-keys.ts'
import { emitTypeTestsFromNodeMap } from '../emitters/type-test-v2.ts'
import { emitConfig } from '../emitters/config.ts'

// v2 emitters — consume NodeMap directly
import { emitConstsFromNodeMap } from '../emitters/consts-v2.ts'
import { emitIndexFromNodeMap } from '../emitters/index-file-v2.ts'

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
    /** The intermediate NodeMap — available for inspection */
    nodeMap: NodeMap
}

export interface GenerateConfigV2 {
    grammar: string
    nodes?: string[]
    outputDir: string
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

    // Phase 2: Link
    const linked = link(raw)

    // Phase 3: Optimize
    const optimized = optimize(linked)

    // Phase 4: Assemble
    const nodeMap = assemble(optimized)

    // Adapter: NodeMap → HydratedNodeModel[] for the wrap emitter.
    // wrap.ts is the only remaining adapter consumer — it will be rewritten
    // to derive from the override projection (not NodeMap) in a future pass.
    const allModels = toHydratedModels(nodeMap)
    const nodes = cfg.nodes && cfg.nodes.length > 0
        ? allModels.filter(n => cfg.nodes!.includes(n.kind))
        : allModels

    // Build the ir-namespace key map once; every emitter that needs to
    // resolve a kind to its ir.x accessor uses this same map so ir.ts
    // and the generated tests stay in sync.
    const irKeys = buildIrKeyMap(nodeMap)

    // Phase 5: Emit — all emitters consume NodeMap directly except wrap
    return {
        grammar: emitGrammar({ grammar: cfg.grammar }),
        types: emitTypesFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        templatesYaml: emitTemplatesFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        factories: emitFactoriesFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        wrap: emitWrap({ grammar: cfg.grammar, nodes: nodes as any }),
        utils: emitClientUtilsFromNodeMap({ nodeMap }),
        from: emitFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        irNamespace: emitIrFromNodeMap({ grammar: cfg.grammar, nodeMap, irKeys }),
        consts: emitConstsFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        index: emitIndexFromNodeMap({ grammar: cfg.grammar, nodeMap }),
        tests: emitTestsFromNodeMap({ grammar: cfg.grammar, nodeMap, irKeys }),
        typeTests: emitTypeTestsFromNodeMap({ nodeMap }),
        config: emitConfig({ grammar: cfg.grammar }),
        nodeModel: JSON.stringify({ name: nodeMap.name, nodeCount: nodeMap.nodes.size }, null, 2),
        nodeMap,
    }
}
