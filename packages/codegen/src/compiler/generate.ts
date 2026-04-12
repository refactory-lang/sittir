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
import { emitTypes } from '../emitters/types.ts'
import { emitTemplatesYaml } from '../emitters/rules.ts'
import { emitFactories } from '../emitters/factories.ts'
import { emitWrap } from '../emitters/wrap.ts'
import { emitFrom } from '../emitters/from.ts'
import { emitClientUtils } from '../emitters/client-utils.ts'
import { emitConsts } from '../emitters/consts.ts'
import { emitIrNamespace } from '../emitters/ir-namespace.ts'
import { emitTests } from '../emitters/test-new.ts'
import { emitTypeTests } from '../emitters/type-test.ts'
import { emitConfig } from '../emitters/config.ts'
import { emitIndex } from '../emitters/index-file.ts'

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

    // Adapter: NodeMap → HydratedNodeModel[] for existing emitters
    const allModels = toHydratedModels(nodeMap)
    const nodes = cfg.nodes && cfg.nodes.length > 0
        ? allModels.filter(n => cfg.nodes!.includes(n.kind))
        : allModels

    // Phase 5: Emit (via existing emitters + adapter)
    return {
        grammar: emitGrammar({ grammar: cfg.grammar }),
        types: emitTypes({ grammar: cfg.grammar, nodes: nodes as any }),
        templatesYaml: emitTemplatesYaml({ grammar: cfg.grammar, nodes: nodes as any, grammarSha: '' }),
        factories: emitFactories({ grammar: cfg.grammar, nodes: nodes as any }),
        wrap: emitWrap({ grammar: cfg.grammar, nodes: nodes as any }),
        utils: emitClientUtils({ nodes: nodes as any }),
        from: emitFrom({ grammar: cfg.grammar, nodes: nodes as any }),
        irNamespace: emitIrNamespace({ grammar: cfg.grammar, nodes: nodes as any }),
        consts: emitConsts({ grammar: cfg.grammar, nodes: nodes as any }),
        index: emitIndex({ grammar: cfg.grammar, nodes: nodes as any }),
        tests: emitTests({ grammar: cfg.grammar, nodes: nodes as any }),
        typeTests: emitTypeTests({ nodes: nodes as any }),
        config: emitConfig({ grammar: cfg.grammar }),
        nodeModel: JSON.stringify({ name: nodeMap.name, nodeCount: nodeMap.nodes.size }, null, 2),
        nodeMap,
    }
}
