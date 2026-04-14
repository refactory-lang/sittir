/**
 * validators/rule-lookup.ts — shared rule-kind inventory (C12).
 *
 * `validate-renderable` needs to answer "which kinds have a rule emit
 * path?" The old code parsed the generated YAML and walked its `rules:`
 * map — a lossy view: variant subtypes, supertypes, and leaves that
 * render through `node.text` aren't in the YAML at all, and the YAML
 * itself is the thing under test so round-tripping through it is
 * circular. This module builds the inventory from a NodeMap — the
 * authoritative output of Assemble.
 */

import type { NodeMap, AssembledNode } from '../compiler/rule.ts'

/**
 * Classification of how a kind reaches a rendered output string.
 *
 *   `template` — the kind has an entry in `templates.yaml` that
 *     render() substitutes into. Branches, containers, groups,
 *     polymorphs.
 *   `text`     — the kind is a pure leaf (string/pattern/keyword/
 *     enum), so `render(node)` just returns `node.text`.
 *   `dispatch` — the kind is a supertype; render dispatches to the
 *     concrete subtype's rule. Never addressed directly.
 *   `none`     — the kind is a hidden token or an unreachable
 *     rule that render() can't produce.
 */
export type RenderKindPath = 'template' | 'text' | 'dispatch' | 'none'

export interface RuleLookup {
    /** All kinds known to the NodeMap, keyed by string. */
    readonly kinds: ReadonlySet<string>
    /** Kinds that reach a render path: template | text | dispatch. */
    readonly renderable: ReadonlySet<string>
    /** Kinds with a template.yaml rule entry (templates only). */
    readonly templated: ReadonlySet<string>
    /** Classification per kind. */
    readonly path: ReadonlyMap<string, RenderKindPath>
}

/**
 * Build a rule inventory from a NodeMap. Cheap — no YAML parsing,
 * no file I/O.
 */
export function buildRuleLookup(nodeMap: NodeMap): RuleLookup {
    const kinds = new Set<string>()
    const renderable = new Set<string>()
    const templated = new Set<string>()
    const path = new Map<string, RenderKindPath>()

    for (const [kind, node] of nodeMap.nodes) {
        kinds.add(kind)
        const p = classify(node)
        path.set(kind, p)
        if (p !== 'none') renderable.add(kind)
        if (p === 'template') templated.add(kind)
    }

    return { kinds, renderable, templated, path }
}

function classify(node: AssembledNode): RenderKindPath {
    switch (node.modelType) {
        case 'branch':
        case 'container':
        case 'group':
        case 'polymorph':
            return 'template'
        case 'leaf':
        case 'keyword':
        case 'enum':
            return 'text'
        case 'supertype':
            return 'dispatch'
        case 'token':
            return 'none'
        default:
            return 'none'
    }
}
