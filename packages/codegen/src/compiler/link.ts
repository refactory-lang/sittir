/**
 * compiler/link.ts — Phase 2: Link
 *
 * Resolves what nodes ARE.
 * After Link: no symbol, alias, token. `repeat1` is preserved — see rule.ts header.
 * Terminals (string, pattern) and structural whitespace (indent, dedent, newline) survive.
 * All field nodes enriched with provenance. Clauses detected.
 *
 * Link does NOT restructure the tree — shape identical before and after.
 * Link does NOT process overrides — already applied by Evaluate.
 */

import type {
    Rule, RawGrammar, LinkedGrammar,
    SymbolRef, ExternalRole, IncludeFilter, DerivationLog,
    InferredFieldEntry, PromotedRuleEntry, RepeatedShapeEntry,
    FieldRule, SupertypeRule, EnumRule, ClauseRule, GroupRule,
    SeqRule, ChoiceRule, VariantRule, PolymorphRule,
} from './rule.ts'
import { deriveFields, hasAnyField, hasAnyChild, isField, isSeq, isChoice, isString, isVariant } from './rule.ts'
import { isHiddenKind } from './evaluate.ts'
import type { PolymorphVariant } from '../dsl/synthetic-rules.ts'

// ---------------------------------------------------------------------------
// link() — main entry point
// ---------------------------------------------------------------------------

export function link(raw: RawGrammar, include?: IncludeFilter): LinkedGrammar {
    const supertypes = new Set(raw.supertypes)
    // Seed from raw.externalRoles — populated by `evaluate.ts`'s
    // grammarFn from `role()` calls inside the override file's
    // externals/rules callbacks. Falls back to the legacy
    // structural-detection path in `resolveRule` for grammars that
    // still declare `_indent: ($) => role('indent')` style dummy rules.
    const externalRoles = new Map<string, ExternalRole>(raw.externalRoles ?? [])
    const references = [...raw.references]

    // Resolve include defaults: undefined means "include everything".
    // Explicit empty arrays mean "include nothing of this category".
    const includeRules = new Set(include?.rules ?? (['promoted'] as const))
    const includeFields = new Set(include?.fields ?? (['inferred', 'inlined'] as const))
    const applyPromotedRules = includeRules.has('promoted')

    // Derivation log — populated unconditionally; each entry records
    // whether the mutation was also applied.
    const derivations: DerivationLog = {
        inferredFields: [],
        promotedRules: [],
        repeatedShapes: [],
    }

    // Resolve all rules
    const rules: Record<string, Rule> = {}
    for (const [name, rule] of Object.entries(raw.rules)) {
        rules[name] = resolveRule(rule, name, raw.rules, supertypes, externalRoles)
    }

    // Role-annotated rules (`_indent: ($) => role('indent')`) have done
    // their job: every `$._indent` reference in the rule tree was
    // inlined to an `indent` node by `resolveRule`. Strip the top-level
    // entries so Assemble doesn't try to classify them as real kinds.
    for (const name of Object.keys(rules)) {
        const r = rules[name]!
        if (r.type === 'indent' || r.type === 'dedent' || r.type === 'newline') {
            delete rules[name]
        }
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

    // Build the hidden-rule → alias-target map BEFORE `resolveRule` has
    // fully collapsed every alias. We walk the raw grammar (pre-link)
    // looking for hidden rules whose body IS an alias at the top level
    // — e.g. `_type_identifier: $ => alias($.identifier, $.type_identifier)`.
    // These are the collapses that strip the rename; downstream passes
    // (assemble) use this map to rewrite supertype subtype lists.
    const aliasedHiddenKinds = collectAliasedHiddenKinds(raw.rules)

    // Classify hidden rules that weren't already resolved. Log every
    // `promoted` classification (enum / supertype) so the suggested.ts
    // emitter can surface it. Hold back the mutation if `include.rules`
    // excludes `promoted`. A kind is "hidden" when its name starts
    // with `_` OR appears in the grammar's `inline:` array — the
    // latter catches grammars that don't follow the convention.
    for (const [name, rule] of Object.entries(rules)) {
        // Classify hidden kinds (underscore-prefixed / inlined) AND
        // rules the grammar explicitly declares in its `supertypes:`
        // list. Tree-sitter's supertype feature marks visible rules
        // whose CST node never appears — the subtypes surface directly.
        // Without this, a visible supertype like ts `primary_type` falls
        // through to the polymorph promoter and gets a bogus 20-form
        // variants map when it should be a single SupertypeRule.
        if (isHiddenKind(name, raw.inline) || supertypes.has(name)) {
            const classified = classifyHiddenRule(name, rule, supertypes, references)
            if (classified !== rule
                && (classified.type === 'enum' || classified.type === 'supertype')
                && (classified.source === 'promoted' || classified.source === 'grammar')) {
                derivations.promotedRules.push({
                    kind: name,
                    classification: classified.type,
                    applied: applyPromotedRules,
                })
                if (applyPromotedRules) rules[name] = classified
            } else {
                rules[name] = classified
            }
        }
    }

    // Promote pure-terminal rules (no fields, no symbol references) to
    // TerminalRule. Always logged; applied only when `include.rules`
    // permits `promoted`.
    for (const [name, rule] of Object.entries(rules)) {
        if (isTerminalShape(rule)) {
            derivations.promotedRules.push({
                kind: name,
                classification: 'terminal',
                applied: applyPromotedRules,
            })
            if (applyPromotedRules) {
                rules[name] = { type: 'terminal', content: rule, source: 'promoted' } as Rule
            }
        }
    }

    // Field name inference — analysis only (suggestion surface).
    // Previously this phase mutated rules by wrapping bare symbol refs
    // as field(X, $.Y) wrappers. Spec 007 moved field coverage to the
    // override-compiled parser: transform() patches in overrides.ts +
    // enrich() mechanical passes now carry all field labels natively.
    // The analysis is preserved for suggested-overrides.ts output.
    const inferredFieldNames = inferFieldNames(references)
    for (const [name, rule] of Object.entries(rules)) {
        applyInferredFields(
            rule, name, inferredFieldNames, false, derivations.inferredFields, false,
        )
    }

    // Keyword-prefix promotion moved to dsl/enrich.ts (spec 006).
    // Previously this phase wrapped `optional(keywordString)` seq
    // members in `field(keyword, ...)` to surface prefixes like
    // python's `optional('async')` as first-class factory parameters.
    // The same transformation now runs as enrich's
    // `optionalKeywordPrefixPass` at pre-Evaluate time — override
    // files that wrap their base in `enrich(base)` get it automatically,
    // and the Link phase no longer mutates rules for this purpose.

    // Tag visible choices with `variant` wrappers — names every branch
    // and dedupes structurally identical ones. Hidden choices already
    // resolved into supertype/enum/inline by `classifyHiddenRule`.
    for (const [name, rule] of Object.entries(rules)) {
        rules[name] = tagVariants(rule, name, raw.inline)
    }

    // Polymorph detection — suggestion-only (spec 007).
    // Previously mutated rules by wrapping heterogeneous-field choices
    // in PolymorphRule. Now kept as analysis for suggested-overrides.ts.
    // Nested-alias conversion will be a follow-up spec.
    for (const [name, rule] of Object.entries(rules)) {
        const result = promotePolymorph(rule)
        if (result !== rule) {
            derivations.promotedRules.push({
                kind: name,
                classification: 'polymorph',
                applied: false,
            })
        }
    }

    // Override-source polymorph classification — variant() metadata.
    // Per feedback (memory: feedback_polymorph_in_link): classification
    // belongs in Link, not Optimize. variant() in transform patches
    // produces PolymorphVariant entries during evaluate; here we wrap
    // the parent rule as a PolymorphRule with `source: 'override'`.
    if (raw.polymorphVariants?.length) {
        applyOverridePolymorphs(rules, raw.polymorphVariants, derivations)
    }

    // Hoist `indent` markers into their sibling/target repeats as
    // `separator: '\n  '`. The python suite/block pair illustrates:
    //     _suite = choice(_simple_statements, seq(indent, block))
    //     block  = seq(repeat(_statement), dedent)
    // The `indent` lives in _suite but the `repeat` lives in block.
    // At template-emit time we need the repeat to carry a joinBy so
    // consecutive statements render as `\n  stmt1\n  stmt2`. Runs
    // before block-bearer annotation so the separator is visible to
    // downstream template emission.
    hoistIndentIntoRepeat(rules)

    // Annotate field wrappers whose content transitively reaches an
    // `indent` Rule node — these render as indented blocks. The
    // template walker prepends `\n  ` to the field slot so python's
    // `class X:$BODY` renders as `class X:\n  $BODY`. Runs after all
    // structural rewrites so symbol refs are stable.
    annotateBlockBearerFields(rules)

    // Repeated-shape detection: collect every field's content-type
    // set and find sets that appear in ≥2 distinct parent rules. Each
    // such set is a hint that the grammar author could declare a
    // shared supertype (or group) to collapse the repetition. Emits
    // an entry per unique set to `derivations.repeatedShapes`; the
    // suggested.ts emitter surfaces it as a review candidate.
    collectRepeatedShapes(rules, derivations.repeatedShapes)

    return {
        name: raw.name,
        rules,
        supertypes,
        externalRoles,
        externals: raw.externals,
        word: raw.word,
        references,
        derivations,
        aliasedHiddenKinds,
        polymorphVariants: raw.polymorphVariants,
    }
}

/**
 * Walk the raw (pre-Link) rule tree and return a map of
 * `hiddenRuleName → aliasTargetName` for every rule whose body is a
 * top-level named alias. Tree-sitter's `alias($.x, $.y)` emits a
 * parse-tree node typed `y` for every match of `x`; without this map
 * Link's alias-collapse would leave downstream passes thinking the
 * hidden rule still produces the original kind.
 */
function collectAliasedHiddenKinds(rawRules: Record<string, Rule>): Map<string, string> {
    const out = new Map<string, string>()
    for (const [name, rule] of Object.entries(rawRules)) {
        if (!name.startsWith('_')) continue
        const target = extractTopLevelAliasTarget(rule)
        if (target) out.set(name, target)
    }
    return out
}

function extractTopLevelAliasTarget(rule: Rule): string | undefined {
    if (rule.type === 'alias' && rule.named) return rule.value
    if (rule.type === 'group' || rule.type === 'variant' ||
        rule.type === 'clause' || rule.type === 'token' || rule.type === 'terminal') {
        return extractTopLevelAliasTarget((rule as { content: Rule }).content)
    }
    return undefined
}

// ---------------------------------------------------------------------------
// tagVariants — wrap visible choice members in `variant` rules
// ---------------------------------------------------------------------------
//
// Walks the rule tree. Visible choices (under a non-hidden parent rule)
// get their members wrapped in `variant` nodes via `wrapVariants`,
// which dedupes structurally identical members and assigns each a
// `nameVariant`-derived name. Hidden choices are recursed-into without
// wrapping (they were already resolved by classifyHiddenRule).
//
// This is a TAGGING pass — it adds wrapper nodes but does not restructure
// or simplify anything. Optimize is the simplification phase
// (fan-out, factoring, prefix/suffix extraction).
// ---------------------------------------------------------------------------

function tagVariants(rule: Rule, name: string, inline?: readonly string[]): Rule {
    switch (rule.type) {
        case 'seq':
            return { type: 'seq', members: rule.members.map(m => tagVariants(m, name, inline)) }

        case 'choice': {
            // Wrap visible choice members in variants. Hidden is the
            // authoritative `isHiddenKind` check — convention + the
            // `inline:` list.
            if (!isHiddenKind(name, inline)) {
                return wrapVariants(rule)
            }
            return { type: 'choice', members: rule.members.map(m => tagVariants(m, name, inline)) }
        }

        case 'optional':
            return { type: 'optional', content: tagVariants(rule.content, name, inline) }

        case 'repeat':
            return { ...rule, content: tagVariants(rule.content, name, inline) }

        case 'field':
            return { ...rule, content: tagVariants(rule.content, name, inline) }

        case 'clause':
            return { ...rule, content: tagVariants(rule.content, name, inline) }

        case 'group':
            return { ...rule, content: tagVariants(rule.content, name, inline) }

        default:
            return rule
    }
}

// ---------------------------------------------------------------------------
// wrapVariants / nameVariant / deduplicateVariants
// ---------------------------------------------------------------------------
//
// Wrap every member of a choice in a `variant` rule, deriving each
// member's name from a distinguishing detect token / symbol / index.
// Structurally identical members are deduplicated (non-lossy: tree-sitter
// would parse them the same way).

export function wrapVariants(choice: Rule): Rule {
    if (choice.type !== 'choice') return choice

    const members = choice.members.map((member, i) => {
        const variantName = nameVariant(member, i, choice.members)
        return {
            type: 'variant' as const,
            name: variantName,
            content: member,
        } satisfies VariantRule
    })

    return { type: 'choice', members: deduplicateVariants(members) }
}

export function deduplicateVariants(variants: Rule[]): Rule[] {
    const seen: Rule[] = []
    const result: Rule[] = []

    for (const v of variants) {
        const content = v.type === 'variant' ? v.content : v
        const isDuplicate = seen.some(s => rulesEqualForVariant(s, content))
        if (!isDuplicate) {
            seen.push(content)
            result.push(v)
        }
    }

    return result
}

export function nameVariant(variant: Rule, index: number, _all: Rule[]): string {
    // Find a distinguishing string literal in this branch.
    const detectToken = findDetectToken(variant)
    if (detectToken) return tokenToName(detectToken)

    // Find a distinguishing symbol name.
    const detectSymbol = findDetectSymbol(variant)
    if (detectSymbol) return detectSymbol

    return `form_${index}`
}

function findDetectToken(rule: Rule): string | null {
    if (rule.type === 'string') return rule.value
    if (rule.type === 'seq' && rule.members.length > 0) {
        for (const m of rule.members) {
            if (m.type === 'string') return m.value
        }
    }
    return null
}

function findDetectSymbol(rule: Rule): string | null {
    if (rule.type === 'symbol') return rule.name
    if (rule.type === 'field') return rule.name
    if (rule.type === 'seq') {
        for (const m of rule.members) {
            const sym = findDetectSymbol(m)
            if (sym) return sym
        }
    }
    return null
}

// Structural equality used by deduplicateVariants — must NOT recurse
// into details we don't care about for "are these two variants the
// same shape". We compare member-by-member, normalising variant
// wrappers to their content.
function rulesEqualForVariant(a: Rule, b: Rule): boolean {
    if (a.type !== b.type) return false
    // `a.type === b.type` narrows `a` via the switch below, but TS can't
    // propagate that narrowing to `b`. One cast-to-`typeof a` per case
    // gives us discriminated access to `b`'s fields without a raw `any`.
    switch (a.type) {
        case 'string':
        case 'pattern': {
            const bn = b as typeof a
            return a.value === bn.value
        }
        case 'symbol': {
            const bn = b as typeof a
            return a.name === bn.name
        }
        case 'seq':
        case 'choice': {
            const bn = b as typeof a
            return a.members.length === bn.members.length
                && a.members.every((m, i) => rulesEqualForVariant(m, bn.members[i]!))
        }
        case 'optional':
        case 'repeat':
        case 'repeat1': {
            const bn = b as typeof a
            return rulesEqualForVariant(a.content, bn.content)
        }
        case 'field': {
            const bn = b as typeof a
            return a.name === bn.name
                && rulesEqualForVariant(a.content, bn.content)
        }
        case 'variant': {
            const bn = b as typeof a
            return rulesEqualForVariant(a.content, bn.content)
        }
        default:
            return false
    }
}

// ---------------------------------------------------------------------------
// promotePolymorph — wrap heterogeneous-field choices in PolymorphRule
// ---------------------------------------------------------------------------
//
// Walks the top level of a rule looking for a choice-of-variants. Promotes
// to PolymorphRule only when:
//
//   - Every variant has at least one field or symbol reference (a pure
//     terminal variant means the kind is a branch with anonymous text
//     content — polymorph forms have no way to render raw text).
//   - Field sets across variants are heterogeneous (otherwise it's a
//     plain branch where all variants share the same shape).
//
// "Top level" means: the outermost choice reachable through anonymous
// delimiter seq wrappers (e.g. `seq('(', choice, ')')`).

export function promotePolymorph(rule: Rule): Rule {
    const found = findVariantChoice(rule)
    if (!found) return rule
    const { choice, prefix, suffix } = found

    // Every variant must be structurally non-empty.
    const contents = choice.members.map(m => m.type === 'variant' ? m.content : m)
    const anyTerminalVariant = contents.some(c => !hasAnyField(c) && !hasAnyChild(c))
    if (anyTerminalVariant) return rule

    // Compare field SETS across variants. Polymorph only applies when the
    // sets differ — homogeneous variants stay as a regular branch.
    const fieldSets = contents.map(c => new Set(deriveFields(c).map(f => f.name)))
    const allSame = fieldSets.every(s => setsEqual(s, fieldSets[0]!))
    if (allSame) return rule

    // Fuse non-variant prefix/suffix members (e.g. an outer `field('left')`
    // that sits before a `seq(field('left'), choice(...))`) into each form's
    // content so every form renders a complete shape. Without this, python's
    // `assignment` polymorph drops $LEFT from all three variants.
    const fuse = (inner: Rule): Rule => {
        if (prefix.length === 0 && suffix.length === 0) return inner
        const members = [...prefix, inner, ...suffix]
        return { type: 'seq', members }
    }
    const forms: PolymorphRule['forms'] = choice.members.map((m, i) => ({
        name: m.type === 'variant' ? m.name : `form_${i}`,
        content: fuse(m.type === 'variant' ? m.content : m),
    }))
    return { type: 'polymorph', forms, source: 'promoted' }
}

export interface VariantChoiceLocation {
    choice: ChoiceRule
    /** Members of the outer seq that appear before the choice. */
    prefix: Rule[]
    /** Members of the outer seq that appear after the choice. */
    suffix: Rule[]
}

// ---------------------------------------------------------------------------
// applyOverridePolymorphs — variant() metadata → PolymorphRule(source:'override')
// ---------------------------------------------------------------------------
//
// variant() in transform patches registers (parent, child) entries during
// evaluate. Here we look up the parent rule, find the choice with
// alias-symbol members matching `${parentKind}_${child}`, and wrap as
// PolymorphRule with `source: 'override'`.
//
// Form names use the SHORT child suffix from variant() — not the
// tagVariants-derived names — so generated factories/types align with
// what the user wrote. Mutates `rules` in place; logs to derivations.

export function applyOverridePolymorphs(
    rules: Record<string, Rule>,
    variants: PolymorphVariant[],
    derivations: DerivationLog,
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

        // Collision detection (T032 follow-up; user feedback 2026-04-16):
        // The variant() naming convention produces visible kinds named
        // `${parentKind}_${child}` (the alias target tree-sitter creates).
        // Emit each variant child as a derivation so the suggested.ts
        // emitter can surface them — this gives users visibility into
        // what tree-sitter's parse tree carries vs what sittir's typed
        // surface presents. Without this, readNode would have to infer
        // polymorph-internal shape from grammar-specific knowledge.
        for (const child of children) {
            const variantChildKind = `${parentKind}_${child}`
            // Inform downstream that this kind exists in the parse tree
            // as the variant child for the polymorph parent.
            derivations.promotedRules.push({
                kind: variantChildKind,
                classification: 'polymorph',
                applied: true,
            })
        }

        const forms = children.map(child => {
            const fullName = `${parentKind}_${child}`
            const variantMember = found.choice.members.find(m => {
                if (m.type === 'variant') {
                    const sym = m.content
                    return sym.type === 'symbol' && sym.name === fullName
                }
                return m.type === 'symbol' && m.name === fullName
            })

            const content = variantMember?.type === 'variant'
                ? variantMember.content
                : variantMember ?? ({ type: 'symbol', name: fullName } as Rule)
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

        derivations.promotedRules.push({
            kind: parentKind,
            classification: 'polymorph',
            applied: true,
        })
    }
}

export function findVariantChoice(rule: Rule): VariantChoiceLocation | null {
    if (isChoice(rule) && rule.members.some(isVariant)) {
        return { choice: rule, prefix: [], suffix: [] }
    }
    // A seq containing exactly one variant-choice. The other members
    // (anonymous delimiters, field wrappers, symbol refs) travel along
    // with each form so the polymorph faithfully renders the whole rule.
    if (rule.type === 'seq') {
        const choiceIdx = rule.members.findIndex(m =>
            m.type === 'choice' && m.members.some(mm => mm.type === 'variant'),
        )
        if (choiceIdx === -1) return null
        // More than one variant-choice in the seq is ambiguous — bail.
        const more = rule.members.findIndex(
            (m, i) => i !== choiceIdx && m.type === 'choice' && m.members.some(mm => mm.type === 'variant'),
        )
        if (more !== -1) return null
        return {
            choice: rule.members[choiceIdx] as ChoiceRule,
            prefix: rule.members.slice(0, choiceIdx),
            suffix: rule.members.slice(choiceIdx + 1),
        }
    }
    return null
}

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false
    for (const x of a) if (!b.has(x)) return false
    return true
}

// ---------------------------------------------------------------------------
// tokenToName — map punctuation to readable names
// ---------------------------------------------------------------------------
//
// Used by both nameVariant (above) and Assemble's nameNode for kinds
// that are operators / punctuation. Single source of truth for "what
// do we call this token in TypeScript identifier space".

const TOKEN_NAMES: Record<string, string> = {
    ';': 'semi',
    '{': 'brace',
    '}': 'close_brace',
    '(': 'paren',
    ')': 'close_paren',
    '[': 'bracket',
    ']': 'close_bracket',
    ',': 'comma',
    ':': 'colon',
    '.': 'dot',
    '::': 'path',
    '->': 'arrow',
    '=>': 'fat_arrow',
    '=': 'eq',
    '!': 'bang',
    '?': 'question',
    '<': 'lt',
    '>': 'gt',
    '+': 'plus',
    '-': 'minus',
    '*': 'star',
    '/': 'slash',
    '%': 'percent',
    '&': 'amp',
    '|': 'pipe',
    '^': 'caret',
    '~': 'tilde',
    '#': 'hash',
    '@': 'at',
    // Multi-char tokens
    '==': 'eqeq',
    '!=': 'neq',
    '<=': 'le',
    '>=': 'ge',
    '&&': 'andand',
    '||': 'oror',
    '<<': 'shl',
    '>>': 'shr',
    '**': 'starstar',
    '...': 'ellipsis',
    '..': 'dotdot',
    '..=': 'dotdoteq',
    '+=': 'pluseq',
    '-=': 'minuseq',
    '*=': 'stareq',
    '/=': 'slasheq',
    '%=': 'percenteq',
    '&=': 'ampeq',
    '|=': 'pipeeq',
    '^=': 'careteq',
    '<<=': 'shleq',
    '>>=': 'shreq',
    '**=': 'starstareq',
    '//': 'slashslash',
    '//=': 'slashslasheq',
    '++': 'plusplus',
    '--': 'minusminus',
    ':=': 'coloneq',
    '<>': 'ltgt',
    '@=': 'ateq',
    '0b': 'tok_0b',
    '0B': 'tok_0B',
    '0o': 'tok_0o',
    '0O': 'tok_0O',
    '0x': 'tok_0x',
    '0X': 'tok_0X',
}

/** Char-by-char fallback for arbitrary punctuation (e.g. "\\n", "~@"). */
function charFallback(token: string): string {
    const CHAR_NAMES: Record<string, string> = {
        '!': 'bang', '"': 'dq', '#': 'hash', '$': 'dollar', '%': 'pct',
        '&': 'amp', "'": 'sq', '(': 'lp', ')': 'rp', '*': 'star',
        '+': 'plus', ',': 'comma', '-': 'minus', '.': 'dot', '/': 'slash',
        ':': 'colon', ';': 'semi', '<': 'lt', '=': 'eq', '>': 'gt',
        '?': 'q', '@': 'at', '[': 'lb', '\\': 'bs', ']': 'rb',
        '^': 'caret', '`': 'bt', '{': 'lbr', '|': 'pipe', '}': 'rbr',
        '~': 'tilde', ' ': 'sp', '\t': 'tab', '\n': 'nl', '\r': 'cr',
    }
    return 'tok_' + [...token].map(c => CHAR_NAMES[c] ?? (/[\w]/.test(c) ? c : 'x')).join('_')
}

export function tokenToName(token: string): string {
    if (TOKEN_NAMES[token]) return TOKEN_NAMES[token]
    if (/^[\w_]+$/.test(token)) return token
    return charFallback(token)
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
            // Preserve repeat1 through Link — downstream derivation
            // reads the `repeat1` type to stamp `nonEmpty: true` on
            // the resulting AssembledField / AssembledChild so the
            // emitter can render non-empty tuple types for those
            // slots. (Earlier builds collapsed repeat1 → repeat here
            // unconditionally, which erased the non-empty signal.)
            return {
                ...rule,
                content: resolveRule(rule.content, currentName, allRules, supertypes, externalRoles),
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
            if (rule.named && rule.value && !rule.value.startsWith('_')) {
                return { type: 'symbol', name: rule.value } as unknown as Rule
            }
            return resolveRule(rule.content, currentName, allRules, supertypes, externalRoles)

        case 'symbol': {
            // Pre-bound role lookup: when the override declared the
            // role inline via `role($._indent, 'indent')` in externals,
            // raw.externalRoles seeded the map with the binding before
            // resolveRule ran. Inline a role node so template emitters
            // render real newlines/indents.
            const preBound = externalRoles.get(rule.name)
            if (preBound) {
                return { type: preBound.role } as Rule
            }
            // Legacy structural detection: when a grammar declares a
            // dummy rule like `_foo: ($) => role('indent')`, the rule
            // body is a direct `indent`/`dedent`/`newline` node.
            // Inline it and record the binding for downstream consumers.
            const target = allRules[rule.name]
            if (target && (target.type === 'indent' || target.type === 'dedent' || target.type === 'newline')) {
                externalRoles.set(rule.name, { role: target.type })
                return target
            }
            // Visible symbols stay as symbols (they're named children)
            // Hidden symbols: check for inline/supertype/enum/group
            return rule
        }

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
        if (rule.members.every((m): m is import('./rule.ts').StringRule => m.type === 'string')) {
            return {
                type: 'enum',
                values: rule.members.map(m => m.value),
                source: 'promoted',
            } satisfies EnumRule
        }

        // A choice member is "supertype-compatible" when it's either:
        //   - a bare `symbol` ($.foo) — contributes `foo` as a subtype
        //   - a named `alias(..., $.foo)` — contributes `foo`
        //   - an `enum` / `string` — surfaces as text content under
        //     the supertype umbrella, contributes no subtype name
        //     but doesn't disqualify the choice (the enum is the
        //     post-Link residue of an `alias(choice(strings),
        //     $.foo)` whose alias wrapper got stripped — `foo` is
        //     usually already in the subtype list as a bare symbol).
        // Mixed structural members (seq with multiple parts, field,
        // nested choice/optional/repeat) DO disqualify — those
        // describe parse-time structure, not abstract dispatch.
        const supertypeCompatible = (m: Rule): boolean =>
            m.type === 'symbol'
            || (m.type === 'alias' && m.named)
            || m.type === 'enum'
            || m.type === 'string'
        const allCompatible = rule.members.every(supertypeCompatible)
        if (allCompatible || supertypes.has(name)) {
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
    if (isSeq(rule)) {
        const hasFields = rule.members.some(isField)
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

/**
 * Extract concrete kind names from a choice for supertype subtypes.
 * Handles bare `symbol` members directly and `alias(_, $.foo)`
 * members by emitting the alias's target name (the synthetic kind
 * tree-sitter produces for aliased nodes). `seq` members are walked
 * for the rare hybrid case where a supertype branch wraps a single
 * symbol in a seq.
 */
function collectSubtypeNames(rule: Rule): string[] {
    const names: string[] = []
    if (rule.type === 'choice') {
        for (const m of rule.members) {
            if (m.type === 'symbol') {
                names.push(m.name)
            } else if (m.type === 'alias' && m.named) {
                names.push(m.value)
            } else if (m.type === 'seq') {
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
            m.type === 'symbol' && m.name === ref.to
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
// hoistIndentIntoRepeat — push `indent` siblings into repeat.separator
// ---------------------------------------------------------------------------
//
// Rewrites `seq(..., indent, X, ...)` where X is a `repeat` (directly, via
// symbol ref, or through a wrapping seq in the referenced rule) so that
// the repeat carries `separator: '\n  '`. This is the rule-level encoding
// of "each element of this block appears on its own indented line". The
// template emitter's existing joinBy path then renders multi-statement
// blocks as `stmt1\n  stmt2\n  stmt3` without any template-side hacks.

// Raw newline separator. The renderer re-indents substituted values
// based on the placeholder's column in the surrounding template, so
// joinBy carries no whitespace — nested blocks compound indent levels
// automatically without baking depth into the rule tree.
const BLOCK_SEPARATOR = '\n'

function hoistIndentIntoRepeat(rules: Record<string, Rule>): void {
    for (const [, rule] of Object.entries(rules)) {
        walkForIndentHoist(rule, rules)
    }
}

function walkForIndentHoist(rule: Rule, rules: Record<string, Rule>): void {
    switch (rule.type) {
        case 'seq': {
            // Find every `indent` member; for each, promote the nearest
            // following repeat-bearing member by setting its separator.
            for (let i = 0; i < rule.members.length; i++) {
                if (rule.members[i]!.type !== 'indent') continue
                for (let j = i + 1; j < rule.members.length; j++) {
                    if (assignRepeatSeparator(rule.members[j]!, rules, new Set())) break
                    if (rule.members[j]!.type === 'dedent') break
                }
            }
            for (const m of rule.members) walkForIndentHoist(m, rules)
            return
        }
        case 'choice':
            for (const m of rule.members) walkForIndentHoist(m, rules)
            return
        case 'field':
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'alias':
        case 'terminal':
            walkForIndentHoist(rule.content, rules)
            return
        default:
            return
    }
}

/**
 * Try to set `separator: '\n'` on the repeat reachable from `rule`.
 * Returns true if a repeat was found and updated. Follows symbol refs
 * (into the referenced rule) and descends through structural wrappers
 * (seq/optional/group/field). `visited` guards against recursive hidden
 * chains so a left-recursive helper doesn't stack-overflow. Idempotent.
 */
function assignRepeatSeparator(
    rule: Rule,
    rules: Record<string, Rule>,
    visited: Set<string>,
): boolean {
    if (rule.type === 'repeat' || rule.type === 'repeat1') {
        if (!rule.separator) (rule as { separator?: string }).separator = BLOCK_SEPARATOR
        return true
    }
    if (rule.type === 'symbol') {
        if (visited.has(rule.name)) return false
        const target = rules[rule.name]
        if (!target) return false
        visited.add(rule.name)
        const found = assignRepeatSeparator(target, rules, visited)
        visited.delete(rule.name)
        return found
    }
    if (rule.type === 'seq') {
        for (const m of rule.members) {
            if (assignRepeatSeparator(m, rules, visited)) return true
        }
        return false
    }
    if (rule.type === 'optional' || rule.type === 'group' || rule.type === 'field') {
        return assignRepeatSeparator(rule.content, rules, visited)
    }
    return false
}

// ---------------------------------------------------------------------------
// annotateBlockBearerFields — mark fields whose content reaches `indent`
// ---------------------------------------------------------------------------
//
// Python-style `class X:\n  body` requires a newline + indent before the
// block's rendered content. The template walker emits `\n  $BODY` for a
// field whose content resolves (via symbol deref) to a subtree containing
// an `indent` Rule node. This pass computes the set of "block-bearer"
// kinds by reachability and tags every matching field with `blockBearer: true`.

function annotateBlockBearerFields(rules: Record<string, Rule>): void {
    // Bearer = hidden rule whose content directly contains an `indent`
    // node OR transitively references another bearer via symbols that
    // only pass through hidden rules. Visible intermediate rules break
    // the chain — e.g. `else_clause` transitively reaches indent through
    // its body, but it's visible, so consumers of `else_clause` are
    // NOT block-bearers themselves (the else_clause renders flush-left).
    const bearers = new Set<string>()
    for (const [name, rule] of Object.entries(rules)) {
        if (name.startsWith('_') && containsIndent(rule)) bearers.add(name)
    }
    let changed = true
    while (changed) {
        changed = false
        for (const [name, rule] of Object.entries(rules)) {
            if (!name.startsWith('_')) continue
            if (bearers.has(name)) continue
            if (referencesBearer(rule, bearers)) {
                bearers.add(name)
                changed = true
            }
        }
    }

    // Mutate fields whose content reaches a bearer through hidden-only
    // intermediates. `markBlockBearerFields` recurses so nested visible
    // rules get their own fields inspected independently.
    for (const [, rule] of Object.entries(rules)) {
        markBlockBearerFields(rule, bearers)
    }
}

function containsIndent(rule: Rule): boolean {
    switch (rule.type) {
        case 'indent': return true
        case 'seq':
        case 'choice':
            return rule.members.some(containsIndent)
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'field':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'alias':
        case 'terminal':
            return containsIndent(rule.content)
        default:
            return false
    }
}

function referencesBearer(rule: Rule, bearers: ReadonlySet<string>): boolean {
    switch (rule.type) {
        case 'symbol': return bearers.has(rule.name)
        case 'seq':
        case 'choice':
            return rule.members.some(m => referencesBearer(m, bearers))
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'field':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'alias':
        case 'terminal':
            return referencesBearer(rule.content, bearers)
        default:
            return false
    }
}

function markBlockBearerFields(rule: Rule, bearers: ReadonlySet<string>): void {
    switch (rule.type) {
        case 'field':
            if (referencesBearer(rule.content, bearers)) {
                (rule as { blockBearer?: boolean }).blockBearer = true
            }
            markBlockBearerFields(rule.content, bearers)
            return
        case 'seq':
        case 'choice':
            for (const m of rule.members) markBlockBearerFields(m, bearers)
            return
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'alias':
        case 'terminal':
            markBlockBearerFields(rule.content, bearers)
            return
        default:
            return
    }
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
    if (isSeq(content)) {
        const hasString = content.members.some(isString)
        const hasField = content.members.some(isField)
        if (hasString && hasField) {
            // Name the clause from the first field
            const firstField = content.members.find(isField)
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

// ---------------------------------------------------------------------------
// Field name inference
// ---------------------------------------------------------------------------
//
// Walks the reference graph to find "this symbol is consistently named
// 'X' in N parents, but parent Y uses it bare" cases. When found, rewrite
// parent Y's rule tree to wrap the bare reference in `field('X', $.Y)`
// with source: 'inferred'. Downstream emitters treat inferred fields as
// real fields (they appear in interfaces, factories, etc.), and the
// suggested.ts emitter surfaces them as override candidates for the
// grammar curator to accept / reject.
//
// Inference rules:
//   - Symbol has ≥5 named references across parents
//   - ≥80% of the named references agree on the same field name
//   - Confidence = 'high' (≥95%), 'medium' (≥85%), 'low' (≥80%)
//   - Only the highest-confidence inference is emitted per target symbol
// ---------------------------------------------------------------------------

interface InferredName {
    readonly name: string
    readonly confidence: 'high' | 'medium' | 'low'
    readonly agreement: number
    readonly sampleSize: number
}

function inferFieldNames(references: SymbolRef[]): Map<string, InferredName> {
    // Group references by `to` (the symbol being referenced).
    const refsByTo = new Map<string, SymbolRef[]>()
    for (const ref of references) {
        const list = refsByTo.get(ref.to) ?? []
        list.push(ref)
        refsByTo.set(ref.to, list)
    }

    const inferred = new Map<string, InferredName>()
    for (const [to, refs] of refsByTo) {
        const namedRefs = refs.filter(r => r.fieldName !== undefined)
        if (namedRefs.length < 5) continue

        const nameCounts = new Map<string, number>()
        for (const r of namedRefs) {
            nameCounts.set(r.fieldName!, (nameCounts.get(r.fieldName!) ?? 0) + 1)
        }
        let bestName = ''
        let bestCount = 0
        for (const [name, count] of nameCounts) {
            if (count > bestCount) {
                bestName = name
                bestCount = count
            }
        }
        const agreement = bestCount / namedRefs.length
        if (agreement < 0.8) continue
        const confidence: InferredName['confidence'] =
            agreement >= 0.95 ? 'high' :
            agreement >= 0.85 ? 'medium' : 'low'
        inferred.set(to, { name: bestName, confidence, agreement, sampleSize: namedRefs.length })
    }
    return inferred
}

/**
 * Walk a rule tree and, for every bare symbol reference whose target
 * has an inferred name:
 *
 *   1. Append a DerivationLog entry recording the finding.
 *   2. If `apply` is true, wrap the bare ref in `field('name', $.Y)`
 *      with source: 'inferred'. Otherwise leave the rule tree alone.
 *
 * Stops descending into existing `field()` / `alias` boundaries — those
 * already own their field name. The returned `applied` flag reflects
 * whether the walker actually mutated anything (always false when
 * `apply` is false, true only when at least one wrap happened).
 */
function applyInferredFields(
    rule: Rule,
    ruleName: string,
    inferred: Map<string, InferredName>,
    apply: boolean,
    log: InferredFieldEntry[],
    _apply: boolean,
    _insideField = false,
): { rule: Rule; applied: boolean } {
    switch (rule.type) {
        case 'symbol': {
            if (_insideField) return { rule, applied: false }
            const inf = inferred.get(rule.name)
            if (!inf) return { rule, applied: false }
            // Log unconditionally.
            log.push({
                kind: ruleName,
                fieldName: inf.name,
                targetSymbol: rule.name,
                confidence: inf.confidence,
                agreement: inf.agreement,
                sampleSize: inf.sampleSize,
                applied: apply,
            })
            if (!apply) return { rule, applied: false }
            return {
                rule: {
                    type: 'field',
                    name: inf.name,
                    content: rule,
                    source: 'inferred',
                } satisfies FieldRule,
                applied: true,
            }
        }

        case 'field':
        case 'alias':
            return { rule, applied: false }

        case 'seq': {
            // Skip inference for any symbol that appears more than once
            // as a direct sibling in this seq — wrapping them in `field`
            // would collide on the same inferred name, losing all but
            // the first. These patterns (e.g. rust or_pattern's two
            // `_pattern` refs separated by `|`) are tree-sitter's "multi
            // children" shape and belong in the `$$$CHILDREN` slot, not
            // as fields.
            const symCounts = new Map<string, number>()
            const unwrapSym = (r: Rule): string | null => {
                if (r.type === 'symbol') return r.name
                if (r.type === 'optional' || r.type === 'variant' || r.type === 'clause' || r.type === 'group') return unwrapSym(r.content)
                return null
            }
            for (const m of rule.members) {
                const sn = unwrapSym(m)
                if (sn) symCounts.set(sn, (symCounts.get(sn) ?? 0) + 1)
            }
            const siblingDups = new Set<string>()
            for (const [sn, cnt] of symCounts) if (cnt > 1) siblingDups.add(sn)
            const members: Rule[] = []
            let any = false
            for (const m of rule.members) {
                const sn = unwrapSym(m)
                if (sn && siblingDups.has(sn)) { members.push(m); continue }
                const r = applyInferredFields(m, ruleName, inferred, apply, log, _apply, _insideField)
                members.push(r.rule)
                any = any || r.applied
            }
            return { rule: any ? { type: 'seq', members } : rule, applied: any }
        }

        case 'choice': {
            const members: Rule[] = []
            let any = false
            for (const m of rule.members) {
                const r = applyInferredFields(m, ruleName, inferred, apply, log, _apply, _insideField)
                members.push(r.rule)
                any = any || r.applied
            }
            return { rule: any ? { type: 'choice', members } : rule, applied: any }
        }

        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group': {
            const r = applyInferredFields(rule.content, ruleName, inferred, apply, log, _apply, _insideField)
            return {
                rule: r.applied ? { ...rule, content: r.rule } as Rule : rule,
                applied: r.applied,
            }
        }

        default:
            return { rule, applied: false }
    }
}

// ---------------------------------------------------------------------------
// collectRepeatedShapes — suggestion pass for shared supertypes/groups
// ---------------------------------------------------------------------------

/**
 * Walk every rule's field content-type unions and flag kind sets
 * that appear in ≥2 distinct parent rules. Each unique set becomes
 * a `RepeatedShapeEntry` that the suggested.ts emitter surfaces as
 * a review candidate — the grammar author can then declare a shared
 * supertype (choice of the kinds) or a group and replace the
 * repeated union with a single reference.
 *
 * Non-mutating: purely additive to `derivations.repeatedShapes`.
 * Doesn't reshape `rules`, so downstream classification is
 * unaffected regardless of include filter.
 *
 * Heuristics:
 *   - Kind sets smaller than 2 are skipped (single-type fields
 *     don't benefit from a supertype).
 *   - Sets that already match an existing supertype's subtypes are
 *     skipped — no value in suggesting what's already declared.
 *   - Shape is tagged `supertype` when every kind in the set is a
 *     named visible rule (candidates for a choice-of-symbols),
 *     `group` otherwise.
 */
function collectRepeatedShapes(
    rules: Record<string, Rule>,
    out: RepeatedShapeEntry[],
): void {
    // Build the set of already-declared supertype signatures so we
    // don't duplicate-suggest what the grammar author already wrote.
    const existingSupertypeKeys = new Set<string>()
    for (const rule of Object.values(rules)) {
        if (rule.type === 'supertype') {
            existingSupertypeKeys.add([...rule.subtypes].sort().join('\n'))
        }
    }

    // Parent map: sorted kind key → set of parent rule names that
    // host a field with exactly this content-type set.
    const parentsByKey = new Map<string, Set<string>>()
    for (const [parentName, rule] of Object.entries(rules)) {
        collectFieldKindSets(rule, (kinds) => {
            if (kinds.length < 2) return
            const key = [...kinds].sort().join('\n')
            let bucket = parentsByKey.get(key)
            if (!bucket) {
                bucket = new Set<string>()
                parentsByKey.set(key, bucket)
            }
            bucket.add(parentName)
        })
    }

    for (const [key, parents] of parentsByKey) {
        if (parents.size < 2) continue
        if (existingSupertypeKeys.has(key)) continue
        const kinds = key.split('\n')
        // Suggest a `supertype` when every kind looks like a named
        // rule kind (letters/underscores/digits, not operator
        // punctuation). Otherwise fall back to `group`.
        const shape: 'supertype' | 'group' = kinds.every(k => /^[\w]+$/.test(k))
            ? 'supertype'
            : 'group'
        out.push({
            suggestedName: suggestSharedName(kinds),
            kinds,
            parents: [...parents].sort(),
            shape,
        })
    }
}

/**
 * Walk a rule tree and invoke `yield_` for every `field` node's
 * content-type set. Strips supertype references to their subtypes
 * before yielding, matching the way the from emitter classifies
 * resolver kind lists.
 */
function collectFieldKindSets(rule: Rule, yield_: (kinds: readonly string[]) => void): void {
    switch (rule.type) {
        case 'field': {
            const kinds = directContentKinds(rule.content)
            if (kinds.length > 0) yield_(kinds)
            // Walk into the content too — nested fields get yielded
            // on their own.
            collectFieldKindSets(rule.content, yield_)
            return
        }
        case 'seq':
        case 'choice':
            for (const m of rule.members) collectFieldKindSets(m, yield_)
            return
        case 'optional':
        case 'repeat':
        case 'token':
        case 'variant':
        case 'clause':
        case 'group':
            collectFieldKindSets(rule.content, yield_)
            return
    }
}

/**
 * Extract the immediate concrete kind set a rule expression
 * resolves to. Unwraps seq/choice/optional/repeat/variant but
 * stops at field/symbol boundaries.
 */
function directContentKinds(rule: Rule): string[] {
    switch (rule.type) {
        case 'symbol': return [rule.name]
        case 'supertype': return [...rule.subtypes]
        case 'choice': return rule.members.flatMap(directContentKinds)
        case 'optional':
        case 'repeat':
        case 'token':
        case 'variant':
        case 'clause':
        case 'group':
            return directContentKinds(rule.content)
        default:
            return []
    }
}

/** Suggest a readable shared name from the kind set. */
function suggestSharedName(kinds: readonly string[]): string {
    // Longest common suffix works surprisingly well for grammars —
    // `binary_expression` / `call_expression` / `field_expression`
    // all share `_expression`. Fall back to the kinds count when
    // nothing common sticks out.
    const words = kinds.map(k => k.split('_').filter(Boolean))
    if (words.length === 0) return '_shared'
    const first = words[0]!
    let suffix: string[] = []
    for (let i = 1; i <= first.length; i++) {
        const tail = first.slice(first.length - i)
        if (words.every(w => w.length >= i && w.slice(w.length - i).join('_') === tail.join('_'))) {
            suffix = tail
        } else break
    }
    if (suffix.length > 0) return '_' + suffix.join('_')
    return `_shared_${kinds.length}`
}
