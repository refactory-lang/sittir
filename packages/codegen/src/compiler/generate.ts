/**
 * compiler/generate.ts — pipeline entry point.
 *
 * Pipeline: evaluate → link → optimize → assemble → emitters.
 */

import { existsSync } from 'node:fs'
import { evaluate } from './evaluate.ts'
import { link } from './link.ts'
import { optimize } from './optimize.ts'
import { assemble } from './assemble.ts'
import { resolveGrammarJsPath, resolveOverridesPath } from './resolve-grammar.ts'

import { emitGrammar } from '../emitters/grammar.ts'
import { emitTypes } from '../emitters/types.ts'
import { emitTemplates } from '../emitters/templates.ts'
import { emitFactories } from '../emitters/factories.ts'
import { emitWrap } from '../emitters/wrap.ts'
import { deriveOverridesConfig } from './derive-overrides-json.ts'
import { emitFrom } from '../emitters/from.ts'
import { emitClientUtils } from '../emitters/client-utils.ts'
import { emitIr } from '../emitters/ir.ts'
import { emitTests } from '../emitters/test.ts'
import { emitTypeTests } from '../emitters/type-test.ts'
import { emitConfig } from '../emitters/config.ts'
import { emitConsts } from '../emitters/consts.ts'
import { emitIndex } from '../emitters/index-file.ts'
import { emitSuggested } from '../emitters/suggested.ts'

import type { NodeMap } from './rule.ts'

export interface GeneratedFiles {
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

export interface GenerateConfig {
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
    /**
     * Emit runtime validation in leaf factories (regex check against
     * the grammar's declared pattern). Default `false` — enum
     * factories always validate, keywords have nothing to check, but
     * leaf patterns can diverge from JS RegExp syntax (Unicode
     * property escapes without the `u` flag, PCRE-only features) so
     * opt-in avoids surprising the non-strict call sites.
     */
    strict?: boolean
}

/**
 * Generate typed factory code using the new five-phase pipeline.
 *
 * evaluate(grammar.js) → link → optimize → assemble → adapter → emitters
 */
export async function generate(cfg: GenerateConfig): Promise<GeneratedFiles> {
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

    // Derive the runtime OverridesConfig from the post-Link rule tree.
    // Used by wrap to inline `_overrides` + `_routing` matching
    // what overrides.ts / grammar.js specify — the deprecation target
    // for the legacy `overrides.json` file.
    const overrideKinds = new Set(raw.overrideRuleNames ?? [])
    const derivedOverrides = deriveOverridesConfig(linked.rules, overrideKinds, raw.rules)

    // Phase 5: Emit — every emitter consumes NodeMap directly. The
    // ir-namespace keys are populated on each AssembledNode during
    // assemble() (see resolveIrKeys), so emitters read node.irKey
    // directly. No side-channel map plumbing, no NodeMap→Hydrated adapter.
    return {
        grammar: emitGrammar({ grammar: cfg.grammar }),
        types: emitTypes({ grammar: cfg.grammar, nodeMap }),
        templatesYaml: emitTemplates({ grammar: cfg.grammar, nodeMap }),
        factories: emitFactories({ grammar: cfg.grammar, nodeMap, strict: cfg.strict }),
        wrap: emitWrap({ grammar: cfg.grammar, nodeMap, derivedOverrides }),
        utils: emitClientUtils({ nodeMap }),
        from: emitFrom({ grammar: cfg.grammar, nodeMap }),
        irNamespace: emitIr({ grammar: cfg.grammar, nodeMap }),
        consts: emitConsts({ grammar: cfg.grammar, nodeMap }),
        index: emitIndex({ grammar: cfg.grammar, nodeMap }),
        tests: emitTests({ grammar: cfg.grammar, nodeMap }),
        typeTests: emitTypeTests({ nodeMap }),
        config: emitConfig({ grammar: cfg.grammar }),
        nodeModel: JSON.stringify({ name: nodeMap.name, nodeCount: nodeMap.nodes.size }, null, 2),
        suggested: emitSuggested({ grammar: cfg.grammar, nodeMap }),
        nodeMap,
    }
}
