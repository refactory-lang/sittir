/**
 * compiler/optimize.ts — Phase 3: Optimize
 *
 * Restructures seq/choice/optional/repeat for SIMPLIFICATION (fan-out,
 * factoring, prefix/suffix extraction, wrapper collapsing, dedupe,
 * single-use hidden-rule inlining). Does NOT change named content.
 * Non-lossy.
 *
 * Variant tagging and polymorph promotion live in Link (Phase 2) — those
 * are classification, not simplification. Pipeline order is fixed in
 * `optimize()` below: collapse → fan-out → factor → dedupe → inline →
 * re-collapse.
 */

import type {
    Rule, LinkedGrammar, OptimizedGrammar, PolymorphRule,
} from './rule.ts'
import type { PolymorphVariant } from '../dsl/synthetic-rules.ts'
import { promotePolymorph, findVariantChoice } from './link.ts'
import { simplifyRules, compileWordMatcher } from './simplify.ts'

// ---------------------------------------------------------------------------
// optimize() — currently a passthrough
// ---------------------------------------------------------------------------

export function optimize(linked: LinkedGrammar): OptimizedGrammar {
    // Optimize is a pipeline of non-lossy normalizations. Each pass
    // receives the full rule map, rewrites in place, and hands off.
    // Order matters: collapse wrappers first (smallest trees →
    // cleaner downstream), then fan-out (expose nested choices),
    // then factor (pull common prefixes/suffixes), then dedupe
    // adjacent duplicates, then inline single-use hidden helpers.
    let rules: Record<string, Rule> = {}
    for (const [name, rule] of Object.entries(linked.rules)) {
        rules[name] = collapseWrappers(rule)           // T062
    }
    // Apply override-sourced polymorphs BEFORE fan-out so findVariantChoice
    // sees the original seq(prefix, choice(variants)) structure.
    const overridePolymorphs = new Set<string>()
    if (linked.polymorphVariants?.length) {
        applyOverridePolymorphs(rules, linked.polymorphVariants, overridePolymorphs)
    }
    for (const name of Object.keys(rules)) {
        rules[name] = fanOutSeqChoices(rules[name]!)    // T060
    }
    // Re-run polymorph promotion now that fan-out has lifted every
    // inner choice to the top level of its enclosing rule. Skip rules
    // already classified by override.
    for (const name of Object.keys(rules)) {
        if (overridePolymorphs.has(name)) continue
        rules[name] = promotePolymorph(rules[name]!)
    }
    for (const name of Object.keys(rules)) {
        rules[name] = factorChoiceBranches(rules[name]!)// T061
    }
    for (const name of Object.keys(rules)) {
        rules[name] = dedupeSeqMembers(rules[name]!)    // T064
    }
    // T063: inline single-use hidden rules so a helper like
    // `_call_signature` that's referenced from only one parent
    // rule collapses into that parent's tree. Runs after the
    // structural rewrites above so referenced content is already
    // in its normal form. The pass returns a new rule map; deleted
    // hidden kinds no longer appear.
    rules = inlineSingleUseHidden(rules)
    // Re-collapse after the structural rewrites — fan-out / factor
    // / inlining can produce single-element seqs or choices that
    // should flatten.
    for (const name of Object.keys(rules)) {
        rules[name] = collapseWrappers(rules[name]!)
    }
    // Final pass: compute the derivation-only view for every rule.
    // Downstream (`assemble` → AssembledBranch/Container/Group) reads
    // from `simplifiedRules` instead of re-running `simplifyRule` in
    // every constructor. Template emission still reads raw `rules`.
    // Pass the grammar's own word-rule pattern so keyword-shape
    // detection uses tree-sitter's lexical convention rather than
    // `/^\w+$/`.
    const wordMatcher = compileWordMatcher(linked.word, rules)
    const simplifiedRules = simplifyRules(rules, wordMatcher)
    return {
        name: linked.name,
        rules,
        simplifiedRules,
        supertypes: linked.supertypes,
        word: linked.word,
        derivations: linked.derivations,
        aliasedHiddenKinds: linked.aliasedHiddenKinds,
        polymorphVariants: linked.polymorphVariants,
    }
}

// ---------------------------------------------------------------------------
// Override polymorph classification — variant() metadata → PolymorphRule
// ---------------------------------------------------------------------------

function applyOverridePolymorphs(
    rules: Record<string, Rule>,
    variants: PolymorphVariant[],
    classified: Set<string>,
): void {
    const parentToChildren = new Map<string, string[]>()
    for (const pv of variants) {
        const existing = parentToChildren.get(pv.parent) ?? []
        existing.push(pv.child)
        parentToChildren.set(pv.parent, existing)
    }

    for (const [parentKind, children] of parentToChildren) {
        const rule = rules[parentKind]
        if (!rule || rule.type === 'polymorph') continue

        const found = findVariantChoice(rule)
        if (!found) continue

        const forms = children.map(child => {
            const fullName = `${parentKind}_${child}`
            const variantMember = found.choice.members.find(m => {
                if (m.type === 'variant') {
                    const sym = m.content
                    return sym.type === 'symbol' && sym.name === fullName
                }
                return m.type === 'symbol' && m.name === fullName
            })

            const content = variantMember?.type === 'variant' ? variantMember.content : variantMember ?? { type: 'symbol', name: fullName } as Rule
            const fused = found.prefix.length > 0 || found.suffix.length > 0
                ? { type: 'seq' as const, members: [...found.prefix, content, ...found.suffix] } as Rule
                : content

            return { name: child, content: fused }
        })

        rules[parentKind] = {
            type: 'polymorph',
            forms,
            source: 'override',
        } satisfies PolymorphRule

        classified.add(parentKind)
    }
}

// ---------------------------------------------------------------------------
// T060 — fanOutSeqChoices
// ---------------------------------------------------------------------------

/**
 * Distribute a `seq` over an inner `choice` so downstream passes see
 * top-level choices:
 *
 *   seq(a, choice(b, c), d) → choice(seq(a, b, d), seq(a, c, d))
 *
 * Only applies when the seq contains EXACTLY ONE choice member —
 * distributing over multiple choices multiplies branches
 * combinatorially and rarely produces useful shapes. Recurses
 * through `optional`, `repeat`, `field`, `variant`, `clause`,
 * `group`, `token` wrappers. Non-lossy.
 */
export function fanOutSeqChoices(rule: Rule): Rule {
    switch (rule.type) {
        case 'seq': {
            const members = rule.members.map(fanOutSeqChoices)
            const choiceIdx = members.findIndex(m => m.type === 'choice')
            if (choiceIdx < 0) return { ...rule, members }
            // Only fan out when there's exactly one inner choice.
            if (members.filter(m => m.type === 'choice').length > 1) {
                return { ...rule, members }
            }
            const choice = members[choiceIdx] as import('./rule.ts').ChoiceRule
            const before = members.slice(0, choiceIdx)
            const after = members.slice(choiceIdx + 1)
            const branches: Rule[] = choice.members.map(branch => {
                const inner = branch.type === 'variant' ? branch.content : branch
                const seqMembers = [...before, inner, ...after]
                if (seqMembers.length === 1) return seqMembers[0]!
                // Preserve variant labels by re-wrapping.
                const flat: Rule = { type: 'seq', members: seqMembers }
                return branch.type === 'variant'
                    ? { type: 'variant', name: branch.name, content: flat }
                    : flat
            })
            return { type: 'choice', members: branches }
        }
        case 'choice': {
            const members = rule.members.map(fanOutSeqChoices)
            return { ...rule, members }
        }
        case 'optional':
        case 'repeat':
        case 'token':
        case 'field':
        case 'variant':
        case 'clause':
        case 'group':
            return { ...rule, content: fanOutSeqChoices(rule.content) }
        case 'polymorph':
            return mapPolymorphForms(rule, fanOutSeqChoices)
        default:
            return rule
    }
}

// ---------------------------------------------------------------------------
// T061 — factorChoiceBranches
// ---------------------------------------------------------------------------

/**
 * Pull common prefixes / suffixes out of a choice of seqs:
 *
 *   choice(seq(a, b, x), seq(a, b, y), seq(a, b, z))
 *      → seq(a, b, choice(x, y, z))
 *
 * Uses `findCommonPrefix` / `findCommonSuffix` (structural equality
 * via `rulesEqual`). Only applies at the top level of a `choice`;
 * recurses through wrappers for nested choices. Non-lossy.
 */
export function factorChoiceBranches(rule: Rule): Rule {
    switch (rule.type) {
        case 'choice': {
            const members = rule.members.map(factorChoiceBranches)
            // Can only factor when every branch (unwrapping variants)
            // is a seq. A single non-seq branch means no common
            // prefix/suffix is extractable.
            const unwrapped = members.map(m => m.type === 'variant' ? m.content : m)
            if (unwrapped.length < 2) return { ...rule, members }
            if (!unwrapped.every(b => b.type === 'seq')) return { ...rule, members }
            const seqs = unwrapped.map(b => (b as import('./rule.ts').SeqRule).members)
            const prefixLen = findCommonPrefix(seqs)
            const suffixLen = findCommonSuffix(seqs, prefixLen)
            if (prefixLen === 0 && suffixLen === 0) return { ...rule, members }
            // Build the factored choice and wrap with the shared prefix/suffix.
            const prefix = seqs[0]!.slice(0, prefixLen)
            const suffix = prefixLen < seqs[0]!.length
                ? seqs[0]!.slice(seqs[0]!.length - suffixLen)
                : []
            // Separate empty-body branches (which represent "this path is
            // optional") from non-empty ones. `choice(seq(a,b,c), seq(a,c))`
            // factors prefix=[a], suffix=[c], bodies=[[b], []]; the empty
            // body means "no b" → wrap the inner in `optional`.
            let hasEmpty = false
            const nonEmpty: Rule[] = []
            for (const m of members) {
                const inner = m.type === 'variant' ? m.content : m
                const s = (inner as import('./rule.ts').SeqRule).members
                const body = s.slice(prefixLen, s.length - suffixLen)
                if (body.length === 0) { hasEmpty = true; continue }
                const bodyRule: Rule = body.length === 1
                    ? body[0]!
                    : { type: 'seq', members: body }
                nonEmpty.push(m.type === 'variant'
                    ? { type: 'variant', name: m.name, content: bodyRule }
                    : bodyRule)
            }
            if (nonEmpty.length === 0) {
                // Every branch was empty → prefix/suffix already cover it.
                return outerFromParts(prefix, suffix)
            }
            const core: Rule = nonEmpty.length === 1
                ? nonEmpty[0]!
                : { type: 'choice', members: nonEmpty }
            const inner: Rule = hasEmpty ? { type: 'optional', content: core } : core
            const outerMembers: Rule[] = [...prefix, inner, ...suffix]
            return outerMembers.length === 1
                ? outerMembers[0]!
                : { type: 'seq', members: outerMembers }
        }
        case 'seq': {
            const members = rule.members.map(factorChoiceBranches)
            return { ...rule, members }
        }
        case 'optional':
        case 'repeat':
        case 'token':
        case 'field':
        case 'variant':
        case 'clause':
        case 'group':
            return { ...rule, content: factorChoiceBranches(rule.content) }
        case 'polymorph':
            return mapPolymorphForms(rule, factorChoiceBranches)
        default:
            return rule
    }
}

// ---------------------------------------------------------------------------
// T064 — dedupeSeqMembers
// ---------------------------------------------------------------------------

/**
 * Collapse adjacent duplicates inside a `seq`:
 *
 *   seq(x, x, y) → seq(x, y)
 *
 * Uses `rulesEqual` for structural equality. Only collapses
 * adjacent duplicates; non-adjacent duplicates are almost always
 * intentional repetition in the grammar.
 */
export function dedupeSeqMembers(rule: Rule): Rule {
    switch (rule.type) {
        case 'seq': {
            const members = rule.members.map(dedupeSeqMembers)
            const deduped: Rule[] = []
            for (const m of members) {
                const prev = deduped[deduped.length - 1]
                if (prev && rulesEqual(prev, m)) continue
                deduped.push(m)
            }
            return { ...rule, members: deduped }
        }
        case 'choice':
            return { ...rule, members: rule.members.map(dedupeSeqMembers) }
        case 'optional':
        case 'repeat':
        case 'token':
        case 'field':
        case 'variant':
        case 'clause':
        case 'group':
            return { ...rule, content: dedupeSeqMembers(rule.content) }
        case 'polymorph':
            return mapPolymorphForms(rule, dedupeSeqMembers)
        default:
            return rule
    }
}

// ---------------------------------------------------------------------------
// T063 — inlineSingleUseHidden
// ---------------------------------------------------------------------------

/**
 * Inline hidden (`_`-prefixed) rules that are referenced from exactly
 * one parent. The parent's symbol ref is replaced with the hidden
 * rule's content; the hidden entry is deleted from the map.
 *
 * Iterates to a fixed point: inlining can expose new single-use
 * refs when nested helpers reference each other. Rules classified
 * as `supertype`, `polymorph`, `enum`, `terminal`, or `group` are
 * skipped — those already carry explicit structural meaning that
 * downstream classification relies on. Only raw `seq` / `choice` /
 * `optional` / `repeat` helpers get inlined.
 *
 * Architecture claim (per discussion): if the rule graph has no
 * unresolved references, inlining is observationally a no-op —
 * field / child derivations walk the resulting tree directly and
 * produce the same downstream shape whether the helper exists as
 * its own entry or as an expansion in its parent.
 */
export function inlineSingleUseHidden(rules: Record<string, Rule>): Record<string, Rule> {
    // Work on a shallow copy — we mutate entries and delete keys.
    const work: Record<string, Rule> = { ...rules }

    // One pass is usually enough; iterate a few times to catch
    // cascading opportunities (parent inlined → new single-use
    // child exposed).
    for (let pass = 0; pass < 4; pass++) {
        const refCounts = countReferences(work)
        let changed = false
        for (const [name, rule] of Object.entries(work)) {
            // Only hidden helpers are candidates.
            if (!name.startsWith('_')) continue
            // Don't inline structurally meaningful rule types —
            // they carry explicit classification that downstream
            // relies on.
            if (rule.type === 'supertype' || rule.type === 'polymorph' ||
                rule.type === 'enum' || rule.type === 'terminal' ||
                rule.type === 'group') continue
            const uses = refCounts.get(name) ?? 0
            if (uses !== 1) continue
            // Find the parent that references `name` and splice
            // the hidden rule's body in place of the symbol ref.
            for (const [parentName, parentRule] of Object.entries(work)) {
                if (parentName === name) continue
                const replaced = replaceSymbolRef(parentRule, name, rule)
                if (replaced !== parentRule) {
                    work[parentName] = replaced
                    delete work[name]
                    changed = true
                    break
                }
            }
        }
        if (!changed) break
    }

    return work
}

/**
 * Count outgoing references per kind across the rule map. Walks
 * symbol refs (via `walkSymbols`) and also includes names carried
 * in `SupertypeRule.subtypes` — those aren't wrapped in a symbol
 * node but downstream classification needs the entry to survive.
 */
function countReferences(rules: Record<string, Rule>): Map<string, number> {
    const counts = new Map<string, number>()
    for (const rule of Object.values(rules)) {
        walkSymbols(rule, (name) => {
            counts.set(name, (counts.get(name) ?? 0) + 1)
        })
    }
    return counts
}

function walkSymbols(rule: Rule, visit: (name: string) => void): void {
    switch (rule.type) {
        case 'symbol':
            visit(rule.name)
            return
        case 'seq':
        case 'choice':
            for (const m of rule.members) walkSymbols(m, visit)
            return
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'token':
        case 'field':
        case 'variant':
        case 'clause':
        case 'group':
        case 'terminal':
            walkSymbols(rule.content, visit)
            return
        case 'polymorph':
            for (const form of rule.forms) walkSymbols(form.content, visit)
            return
        case 'supertype':
            for (const sub of rule.subtypes) visit(sub)
            return
    }
}

/**
 * Replace every symbol ref to `targetName` inside `rule` with the
 * content of `targetRule`. Returns the same reference when nothing
 * changed so callers can do identity comparison.
 */
function replaceSymbolRef(rule: Rule, targetName: string, targetRule: Rule): Rule {
    switch (rule.type) {
        case 'symbol':
            if (rule.name === targetName) {
                // Unwrap the replacement down to its content if the
                // target carries structural wrappers that would
                // otherwise stack: `field` and `variant` still
                // embed content, but a top-level `seq` body should
                // splice in as-is.
                return targetRule
            }
            return rule
        case 'seq': {
            let changed = false
            const members = rule.members.map(m => {
                const r = replaceSymbolRef(m, targetName, targetRule)
                if (r !== m) changed = true
                return r
            })
            return changed ? { ...rule, members } : rule
        }
        case 'choice': {
            let changed = false
            const members = rule.members.map(m => {
                const r = replaceSymbolRef(m, targetName, targetRule)
                if (r !== m) changed = true
                return r
            })
            return changed ? { ...rule, members } : rule
        }
        case 'optional':
        case 'repeat':
        case 'token':
        case 'field':
        case 'variant':
        case 'clause':
        case 'group': {
            const inner = replaceSymbolRef(rule.content, targetName, targetRule)
            return inner === rule.content ? rule : { ...rule, content: inner }
        }
        case 'polymorph': {
            let changed = false
            const forms = rule.forms.map(f => {
                const rewritten = replaceSymbolRef(f.content, targetName, targetRule)
                if (rewritten === f.content) return f
                changed = true
                return { ...f, content: rewritten }
            })
            return changed ? { ...rule, forms } : rule
        }
        default:
            return rule
    }
}

/**
 * Recursive wrapper-collapse pass. Traverses the rule tree
 * bottom-up and rewrites degenerate wrappers into their simpler
 * equivalents. Non-lossy — every collapse preserves the set of
 * strings the rule matches.
 */
export function collapseWrappers(rule: Rule): Rule {
    switch (rule.type) {
        case 'optional': {
            const inner = collapseWrappers(rule.content)
            // optional(optional(x)) → optional(x)
            if (inner.type === 'optional') return inner
            // optional(repeat(x)) → repeat(x) — repeat already matches zero
            if (inner.type === 'repeat') return inner
            return { ...rule, content: inner }
        }
        case 'repeat': {
            const inner = collapseWrappers(rule.content)
            // repeat(repeat(x)) → repeat(x)
            if (inner.type === 'repeat' && !rule.separator && !inner.separator) return inner
            // repeat(optional(x)) → repeat(x) — the outer repeat already
            // handles zero occurrences.
            if (inner.type === 'optional') return { ...rule, content: inner.content }
            return { ...rule, content: inner }
        }
        case 'seq': {
            const members = rule.members.map(collapseWrappers)
            if (members.length === 1) return members[0]!
            return { ...rule, members }
        }
        case 'choice': {
            const members = rule.members.map(collapseWrappers)
            if (members.length === 1) return members[0]!
            return { ...rule, members }
        }
        case 'field':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
            return { ...rule, content: collapseWrappers(rule.content) }
        case 'polymorph':
            return mapPolymorphForms(rule, collapseWrappers)
        default:
            return rule
    }
}

function outerFromParts(prefix: Rule[], suffix: Rule[]): Rule {
    const members = [...prefix, ...suffix]
    if (members.length === 0) {
        // Unreachable: factorChoiceBranches early-returns on
        // prefixLen===0 && suffixLen===0, so an all-empty factoring
        // never calls this.
        throw new Error('outerFromParts: no prefix or suffix to wrap')
    }
    if (members.length === 1) return members[0]!
    return { type: 'seq', members }
}

// Keep in sync when adding new Optimize passes — polymorph forms must
// receive the same rewrite as top-level rules.
function mapPolymorphForms(
    rule: import('./rule.ts').PolymorphRule,
    rewrite: (r: Rule) => Rule,
): Rule {
    return {
        ...rule,
        forms: rule.forms.map(f => ({ ...f, content: rewrite(f.content) })),
    }
}

// ---------------------------------------------------------------------------
// rulesEqual — structural equality
// ---------------------------------------------------------------------------

export function rulesEqual(a: Rule, b: Rule): boolean {
    if (a.type !== b.type) return false

    switch (a.type) {
        case 'string':
            return a.value === (b as typeof a).value
        case 'pattern':
            return a.value === (b as typeof a).value
        case 'symbol':
            return a.name === (b as typeof a).name
        case 'seq':
            return a.members.length === (b as typeof a).members.length &&
                a.members.every((m, i) => rulesEqual(m, (b as typeof a).members[i]!))
        case 'choice':
            return a.members.length === (b as typeof a).members.length &&
                a.members.every((m, i) => rulesEqual(m, (b as typeof a).members[i]!))
        case 'optional':
            return rulesEqual(a.content, (b as typeof a).content)
        case 'repeat':
            return rulesEqual(a.content, (b as typeof a).content) &&
                a.separator === (b as typeof a).separator
        case 'field':
            return a.name === (b as typeof a).name &&
                rulesEqual(a.content, (b as typeof a).content)
        case 'variant':
            return a.name === (b as typeof a).name &&
                rulesEqual(a.content, (b as typeof a).content)
        case 'enum':
            return JSON.stringify(a.values) === JSON.stringify((b as typeof a).values)
        case 'supertype':
            return a.name === (b as typeof a).name
        case 'indent':
        case 'dedent':
        case 'newline':
            return true
        default:
            return JSON.stringify(a) === JSON.stringify(b)
    }
}

// ---------------------------------------------------------------------------
// factorSeqChoice — extract common prefix/suffix from choice branches
// ---------------------------------------------------------------------------

export function factorSeqChoice(branches: Rule[]): Rule[] {
    // Check if all branches are seqs
    const seqs = branches.map(b => b.type === 'seq' ? b.members : [b])

    const prefixLen = findCommonPrefix(seqs)
    if (prefixLen === 0) return branches

    const suffixLen = findCommonSuffix(seqs, prefixLen)

    // Extract factored branches (the parts that differ)
    return branches.map((b): Rule => {
        if (b.type === 'seq') {
            const members = b.members.slice(prefixLen, b.members.length - suffixLen)
            return members.length === 1 ? members[0]! : { type: 'seq' as const, members }
        }
        return b
    })
}

function findCommonPrefix(seqs: Rule[][]): number {
    if (seqs.length === 0) return 0
    const first = seqs[0]!
    let len = 0
    for (let i = 0; i < first.length; i++) {
        if (seqs.every(s => i < s.length && rulesEqual(s[i]!, first[i]!))) {
            len++
        } else break
    }
    return len
}

function findCommonSuffix(seqs: Rule[][], prefixLen: number): number {
    if (seqs.length === 0) return 0
    const first = seqs[0]!
    let len = 0
    for (let i = 0; i < first.length - prefixLen; i++) {
        const fi = first.length - 1 - i
        if (seqs.every(s => {
            const si = s.length - 1 - i
            return si >= prefixLen && rulesEqual(s[si]!, first[fi]!)
        })) {
            len++
        } else break
    }
    return len
}

// wrapVariants / deduplicateVariants / nameVariant / tokenToName all
// moved to compiler/link.ts — they're classification, not simplification.
// Re-export from there if test files or callers still need them.
export { wrapVariants, deduplicateVariants, nameVariant, tokenToName } from './link.ts'

// ---------------------------------------------------------------------------
// fanOutChoices — expand nested choices (for use by callers)
// ---------------------------------------------------------------------------

export function fanOutChoices(rule: Rule): Rule[] {
    if (rule.type === 'choice') {
        return rule.members.flatMap(m => fanOutChoices(m))
    }
    return [rule]
}

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

const WORD_CHAR = /\w/

export function needsSpace(prev: string, next: string): boolean {
    if (prev.length === 0 || next.length === 0) return false
    const lastChar = prev[prev.length - 1]!
    const firstChar = next[0]!
    return WORD_CHAR.test(lastChar) && WORD_CHAR.test(firstChar)
}
