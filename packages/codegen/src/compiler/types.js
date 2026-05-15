/**
 * compiler/types.ts — compiler pipeline output contracts.
 *
 * Each pipeline phase produces a typed container; this file collects
 * them.
 *
 * - Evaluate  produces {@link RawGrammar}.
 * - Link      produces {@link LinkedGrammar} plus a {@link DerivationLog}.
 * - Optimize  produces {@link OptimizedGrammar}.
 * - Assemble  produces {@link NodeMap}.
 *
 * Diagnostic / suggester-input types live here too ({@link DerivationLog}
 * and its entry types, {@link SuggestedOverride}, {@link IncludeFilter})
 * because they flow between Link and the suggester emitter, not through
 * the rule tree itself.
 *
 * The Rule model (Rule union + type guards + SymbolRef) stays in
 * `./rule.ts`. The AssembledNode hierarchy currently stays in `rule.ts`
 * too; splitting it into `./node-map.ts` is a later step.
 */
/**
 * Where a kind/field exists across the pipeline. Per KindID runtime
 * migration design (2026-04-30): describes ontology / existence, kept
 * separate from `KindUseFlag` which describes operations.
 */
export const KindPresenceFlag = {
    None: 0,
    /** Rule appears in `grammar.js` (codegen rule catalog). */
    TSGrammar: 1 << 0,
    /** Kind appears in `node-types.json`. */
    TSNodeTypes: 1 << 1,
    /** Kind has a parser symbol — IDs come from `parser.c` internal metadata. */
    TSInternals: 1 << 2
};
/**
 * What sittir can do with a kind. Behavior-based; complements
 * `KindPresenceFlag`'s file-based / existence-based view.
 */
export const KindUseFlag = {
    None: 0,
    /** Sittir can ingest/hydrate the kind from parsed runtime nodes. */
    Readable: 1 << 0,
    /** Sittir can produce/build it from factories or `.from()`. */
    Buildable: 1 << 1,
    /** Sittir can render/dispatch it. */
    Renderable: 1 << 2
};
export function computePolymorphFormKinds(nodes) {
    const result = new Set();
    for (const [, node] of nodes) {
        if (node.modelType !== 'polymorph')
            continue;
        // All polymorph form kinds need to be skipped from direct kind
        // iteration — both promoted (synthesized `${parent}_${variant}`)
        // and override (disambiguated `${parent}__form_${variant}`).
        // The variant child kinds for source='override' polymorphs are
        // distinct from form kinds (after disambiguation) and remain
        // in nodes Map for normal branch emission.
        for (const form of node.forms)
            result.add(form.kind);
    }
    return result;
}
//# sourceMappingURL=types.js.map