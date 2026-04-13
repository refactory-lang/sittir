/**
 * compiler/link.ts — Phase 2: Link
 *
 * Resolves what nodes ARE.
 * After Link: no symbol, alias, token, repeat1.
 * Terminals (string, pattern) and structural whitespace (indent, dedent, newline) survive.
 * All field nodes enriched with provenance. Clauses detected.
 *
 * Link does NOT restructure the tree — shape identical before and after.
 * Link does NOT process overrides — already applied by Evaluate.
 */

import type {
    Rule, RawGrammar, LinkedGrammar,
    SymbolRef, ExternalRole,
    FieldRule, SupertypeRule, EnumRule, ClauseRule, GroupRule,
    SeqRule,
} from './rule.ts'

// ---------------------------------------------------------------------------
// link() — main entry point
// ---------------------------------------------------------------------------

export function link(raw: RawGrammar): LinkedGrammar {
    const supertypes = new Set(raw.supertypes)
    const externalRoles = new Map<string, ExternalRole>()
    const references = [...raw.references]

    // Resolve all rules
    const rules: Record<string, Rule> = {}
    for (const [name, rule] of Object.entries(raw.rules)) {
        rules[name] = resolveRule(rule, name, raw.rules, supertypes, externalRoles)
    }

    // Create synthetic rules for external tokens that have no grammar rule
    // These are declared in grammar.externals but have no rule body
    // Per design doc: externals are grammar-level declarations — Link creates leaf rules for them
    for (const ext of raw.externals) {
        if (!rules[ext]) {
            rules[ext] = { type: 'pattern', value: '' } as Rule
        }
    }

    // Create synthetic rules for named aliases
    // alias($.x, $.y) creates a node with kind 'y' that mirrors 'x's structure
    // Walk all rules to find alias references and create entries for alias targets
    collectAliasTargets(raw.rules, rules)

    // Classify hidden rules that weren't already resolved
    for (const [name, rule] of Object.entries(rules)) {
        if (name.startsWith('_')) {
            rules[name] = classifyHiddenRule(name, rule, supertypes, references)
        }
    }

    // Promote pure-terminal rules (no fields, no symbol references) to
    // TerminalRule. This eliminates content-inspection classification
    // downstream — Assemble just dispatches on rule.type.
    for (const [name, rule] of Object.entries(rules)) {
        if (isTerminalShape(rule)) {
            rules[name] = { type: 'terminal', content: rule } as Rule
        }
    }

    return {
        name: raw.name,
        rules,
        supertypes,
        externalRoles,
        word: raw.word,
        references,
    }
}

/**
 * A rule is terminal-shaped when its subtree has no fields and no symbol
 * references — hidden or visible. Tree-sitter exposes such a kind as a
 * pure text node at parse time.
 *
 * Skips rules that already have a classification wrapper (enum, supertype,
 * group, terminal) — those are terminal in the "structural" sense but
 * Link has already tagged them and we don't want to double-wrap.
 */
function isTerminalShape(rule: Rule): boolean {
    switch (rule.type) {
        case 'enum':
        case 'supertype':
        case 'group':
        case 'terminal':
        case 'polymorph':
            return false // already has a structural classification

        case 'field':
            return false // a field means it's a branch

        case 'symbol':
        case 'supertype' as never:
            return false // a symbol means it carries children

        case 'string':
        case 'pattern':
        case 'indent':
        case 'dedent':
        case 'newline':
            // Bare terminals don't need wrapping — they're already leaf-shaped
            // at the point Assemble inspects them. We only wrap composed
            // terminal structures.
            return false

        case 'seq':
            return rule.members.every(isTerminalShape_allowBareTerm)
        case 'choice':
            return rule.members.every(isTerminalShape_allowBareTerm)
        case 'optional':
        case 'repeat':
        case 'repeat1':
            return isTerminalShape_allowBareTerm(rule.content)
        case 'variant':
        case 'clause':
            return isTerminalShape_allowBareTerm(rule.content)
        case 'alias':
        case 'token':
            // Should be resolved by Link, but handle defensively
            return isTerminalShape_allowBareTerm(rule.content)
    }
    return false
}

/**
 * Like isTerminalShape but bare terminals (string/pattern/whitespace) count
 * as terminal. Used to recurse into composed structures.
 */
function isTerminalShape_allowBareTerm(rule: Rule): boolean {
    switch (rule.type) {
        case 'string':
        case 'pattern':
        case 'indent':
        case 'dedent':
        case 'newline':
            return true
        case 'enum':
            return true // enum is a set of string literals → still terminal
        case 'field':
            return false
        case 'symbol':
            return false
        case 'supertype':
            return false
        case 'group':
        case 'terminal':
            return false
        case 'seq':
        case 'choice':
            return rule.members.every(isTerminalShape_allowBareTerm)
        case 'optional':
        case 'repeat':
        case 'repeat1':
            return isTerminalShape_allowBareTerm(rule.content)
        case 'variant':
        case 'clause':
            return isTerminalShape_allowBareTerm(rule.content)
        case 'alias':
        case 'token':
            return isTerminalShape_allowBareTerm(rule.content)
        case 'polymorph':
            return false
    }
    return false
}

// ---------------------------------------------------------------------------
// resolveRule — recursive resolution of all reference types
// ---------------------------------------------------------------------------

function resolveRule(
    rule: Rule,
    currentName: string,
    allRules: Record<string, Rule>,
    supertypes: Set<string>,
    externalRoles: Map<string, ExternalRole>,
): Rule {
    switch (rule.type) {
        case 'seq':
            return {
                type: 'seq',
                members: rule.members.map(m =>
                    resolveRule(m, currentName, allRules, supertypes, externalRoles)
                ),
            }

        case 'choice':
            return {
                type: 'choice',
                members: rule.members.map(m =>
                    resolveRule(m, currentName, allRules, supertypes, externalRoles)
                ),
            }

        case 'optional': {
            const content = resolveRule(rule.content, currentName, allRules, supertypes, externalRoles)
            // Clause detection: optional(seq(STRING, FIELD, ...))
            return detectClause(content, currentName)
        }

        case 'repeat':
            return {
                ...rule,
                content: resolveRule(rule.content, currentName, allRules, supertypes, externalRoles),
            }

        case 'repeat1':
            // Normalize repeat1 → repeat
            return {
                type: 'repeat',
                content: resolveRule(rule.content, currentName, allRules, supertypes, externalRoles),
                separator: rule.separator,
            }

        case 'field':
            return {
                ...rule,
                content: resolveRule(rule.content, currentName, allRules, supertypes, externalRoles),
            }

        case 'token':
            // Flatten: extract content
            return resolveRule(rule.content, currentName, allRules, supertypes, externalRoles)

        case 'alias':
            // Resolve: treat as its content for now
            return resolveRule(rule.content, currentName, allRules, supertypes, externalRoles)

        case 'symbol':
            // Externals with canonical structural-whitespace names are
            // converted to their dedicated rule types so the template
            // emitter renders real newlines/indents. Grammar-side naming
            // convention: `_indent`, `_dedent`, `_newline`.
            if (rule.name === '_indent') {
                externalRoles.set('_indent', { role: 'indent' })
                return { type: 'indent' } as Rule
            }
            if (rule.name === '_dedent') {
                externalRoles.set('_dedent', { role: 'dedent' })
                return { type: 'dedent' } as Rule
            }
            if (rule.name === '_newline') {
                externalRoles.set('_newline', { role: 'newline' })
                return { type: 'newline' } as Rule
            }
            // Visible symbols stay as symbols (they're named children)
            // Hidden symbols: check for inline/supertype/enum/group
            return rule

        // These pass through unchanged
        case 'string':
        case 'pattern':
        case 'enum':
        case 'supertype':
        case 'group':
        case 'clause':
        case 'variant':
        case 'indent':
        case 'dedent':
        case 'newline':
            return rule

        default:
            return rule
    }
}

// ---------------------------------------------------------------------------
// classifyHiddenRule — determine what a hidden rule IS
// ---------------------------------------------------------------------------

function classifyHiddenRule(
    name: string,
    rule: Rule,
    supertypes: Set<string>,
    references: SymbolRef[],
): Rule {
    // Already classified (e.g., enum from Evaluate)
    if (rule.type === 'enum' || rule.type === 'supertype' || rule.type === 'group') {
        return rule
    }

    // Choice → classify per spec taxonomy:
    //   all strings         → enum
    //   all symbols         → supertype (or grammar-declared supertype)
    //   mixed/structural    → leave as-is, Assemble classifies by shape
    //
    // The old rule was "any hidden choice → supertype, subtypes best-effort",
    // which produced zero-subtype supertypes for hidden choices of
    // structural members (_match_block, _line_doc_comment_marker,
    // _jsx_string, …). Those are real alternatives with fields/seqs,
    // not abstract kind unions.
    if (rule.type === 'choice') {
        const allStrings = rule.members.every(m => m.type === 'string')
        if (allStrings) {
            return {
                type: 'enum',
                values: rule.members.map(m => (m as any).value),
                source: 'promoted',
            } satisfies EnumRule
        }

        const allSymbols = rule.members.every(m => m.type === 'symbol')
        if (allSymbols || supertypes.has(name)) {
            const subtypes = collectSubtypeNames(rule)
            // Only promote if we actually resolved subtype names. An empty
            // subtypes list means the choice members aren't symbols and we
            // can't project a union — fall through to leave-as-is.
            if (subtypes.length > 0) {
                return {
                    type: 'supertype',
                    name,
                    subtypes,
                    source: supertypes.has(name) ? 'grammar' : 'promoted',
                } satisfies SupertypeRule
            }
        }

        // Mixed/structural hidden choice — survive as-is. Assemble sees it
        // as a polymorph/branch/container depending on its members.
        return rule
    }

    // Seq with fields → group (fields promoted to parent)
    if (rule.type === 'seq') {
        const hasFields = rule.members.some(m => m.type === 'field')
        if (hasFields) {
            return {
                type: 'group',
                name,
                content: rule,
            } satisfies GroupRule
        }
    }

    // Other hidden rules survive as-is — Assemble classifies by structure
    return rule
}

/** Extract concrete kind names from a choice for supertype subtypes */
function collectSubtypeNames(rule: Rule): string[] {
    const names: string[] = []
    if (rule.type === 'choice') {
        for (const m of rule.members) {
            if (m.type === 'symbol') names.push(m.name)
            else if (m.type === 'seq') {
                // Mixed content — extract symbol references
                for (const s of m.members) {
                    if (s.type === 'symbol') names.push(s.name)
                }
            }
        }
    }
    return names
}

// ---------------------------------------------------------------------------
// detectClause — optional(seq(STRING, FIELD, ...)) → clause
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// enrichPositions — walk SEQ members to assign position to SymbolRefs
// ---------------------------------------------------------------------------

export function enrichPositions(rules: Record<string, Rule>, refs: SymbolRef[]): void {
    for (const ref of refs) {
        const rule = rules[ref.from]
        if (!rule || rule.type !== 'seq') continue
        const idx = rule.members.findIndex(m =>
            m.type === 'symbol' && (m as any).name === ref.to
        )
        if (idx >= 0) ref.position = idx
    }
}

// ---------------------------------------------------------------------------
// computeParentSets — group refs by target symbol
// ---------------------------------------------------------------------------

export function computeParentSets(refs: SymbolRef[]): Map<string, SymbolRef[]> {
    const parents = new Map<string, SymbolRef[]>()
    for (const ref of refs) {
        const existing = parents.get(ref.to)
        if (existing) {
            existing.push(ref)
        } else {
            parents.set(ref.to, [ref])
        }
    }
    return parents
}

// ---------------------------------------------------------------------------
// detectClause — optional(seq(STRING, FIELD, ...)) → clause
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// collectAliasTargets — find named aliases and create rules for their targets
// ---------------------------------------------------------------------------

function collectAliasTargets(rawRules: Record<string, Rule>, resolvedRules: Record<string, Rule>): void {
    for (const rule of Object.values(rawRules)) {
        walkForAliases(rule, rawRules, resolvedRules)
    }
}

function walkForAliases(rule: Rule, rawRules: Record<string, Rule>, resolvedRules: Record<string, Rule>): void {
    switch (rule.type) {
        case 'alias':
            if (rule.named && rule.value && !resolvedRules[rule.value]) {
                // Named alias: alias($.x, $.y) — create a rule for 'y' based on 'x's content
                const sourceRule = rule.content.type === 'symbol' ? rawRules[rule.content.name] : rule.content
                if (sourceRule) {
                    resolvedRules[rule.value] = sourceRule
                }
            }
            break
        case 'seq':
            for (const m of rule.members) walkForAliases(m, rawRules, resolvedRules)
            break
        case 'choice':
            for (const m of rule.members) walkForAliases(m, rawRules, resolvedRules)
            break
        case 'optional':
            walkForAliases(rule.content, rawRules, resolvedRules)
            break
        case 'repeat':
            walkForAliases(rule.content, rawRules, resolvedRules)
            break
        case 'field':
            walkForAliases(rule.content, rawRules, resolvedRules)
            break
        case 'token':
            walkForAliases(rule.content, rawRules, resolvedRules)
            break
    }
}

// ---------------------------------------------------------------------------
// detectClause — optional(seq(STRING, FIELD, ...)) → clause
// ---------------------------------------------------------------------------

function detectClause(content: Rule, currentName: string): Rule {
    if (content.type === 'seq') {
        const hasString = content.members.some(m => m.type === 'string')
        const hasField = content.members.some(m => m.type === 'field')
        if (hasString && hasField) {
            // Name the clause from the first field
            const firstField = content.members.find(m => m.type === 'field') as FieldRule | undefined
            const clauseName = firstField?.name ?? currentName
            return {
                type: 'clause',
                name: clauseName,
                content,
            } satisfies ClauseRule
        }
    }
    return { type: 'optional', content }
}
