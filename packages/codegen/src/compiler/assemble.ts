/**
 * compiler/assemble.ts — Phase 4: Assemble
 *
 * First time nodes appear. All metadata (required, multiple, contentTypes,
 * detectToken, modelType) derived from the rule tree — not carried on Rule nodes.
 */

import type {
    Rule, OptimizedGrammar, NodeMap,
    AssembledNode, AssembledField, AssembledChild,
    KindProjection, SignaturePool, ProjectionContext,
    FieldRule,
} from './rule.ts'
import {
    AssembledBranch, AssembledContainer, AssembledPolymorph,
    AssembledLeaf, AssembledKeyword, AssembledToken, AssembledEnum,
    AssembledSupertype, AssembledGroup,
    hasAnyField, hasAnyChild,
} from './rule.ts'
import { tokenToName } from './optimize.ts'
import { simplifyRule, compileWordMatcher } from './simplify.ts'

// ---------------------------------------------------------------------------
// assemble() — main entry point
// ---------------------------------------------------------------------------

export function assemble(optimized: OptimizedGrammar): NodeMap {
    const nodes = new Map<string, AssembledNode>()

    for (const [kind, rule] of Object.entries(optimized.rules)) {
        const modelType = classifyNode(kind, rule)
        const { typeName, factoryName, irKey } = nameNode(kind)
        // The `simplifiedRules` map is guaranteed to carry an entry
        // for every kind in `rules` — `optimize()` populates it via
        // `simplifyRules(rules)` at the end of its pass.
        const simplifiedRule = optimized.simplifiedRules[kind]!

        switch (modelType) {
            case 'branch': {
                nodes.set(kind, new AssembledBranch({
                    kind, typeName, factoryName, irKey, rule,
                    simplifiedRule,
                }))
                break
            }
            case 'container': {
                nodes.set(kind, new AssembledContainer({
                    kind, typeName, factoryName, irKey, rule,
                    simplifiedRule,
                }))
                break
            }
            case 'polymorph': {
                // PolymorphRule is Link/Optimize's output — normally
                // already has forms in declaration order. Under T065
                // the classifier may tag a raw `choice` as polymorph
                // when promotion was held back (strict debug mode) —
                // in that case we synthesize forms from the choice
                // members here so Assemble still produces a
                // functional AssembledPolymorph. Synthetic forms get
                // numerical names (`'0'`, `'1'`, …) rather than any
                // variant label that might have been attached by
                // `tagVariants`, so the form kinds stay collision-
                // free and obviously-generated.
                const polyForms: import('./rule.ts').PolymorphRule['forms'] =
                    rule.type === 'polymorph'
                        ? rule.forms
                        : rule.type === 'choice'
                            ? rule.members.map((m, i) => ({
                                name: `form${i}`,
                                content: m.type === 'variant' ? m.content : m,
                            }))
                            : (() => { throw new Error(
                                `assemble: kind '${kind}' classified as polymorph but rule.type=${rule.type}. ` +
                                `promotePolymorph in Optimize should have wrapped it.`,
                            ) })()
                const nameCounts = new Map<string, number>()
                const forms: AssembledGroup[] = polyForms.map((form) => {
                    // Disambiguate duplicate form names (two `expression` variants
                    // over different shapes — e.g. python's expression_statement).
                    const seen = nameCounts.get(form.name) ?? 0
                    nameCounts.set(form.name, seen + 1)
                    const disambiguated = seen === 0 ? form.name : `${form.name}${seen + 1}`
                    const formKind = `${kind}_${disambiguated}`
                    const formNames = nameNode(formKind)
                    // Form content is a sub-rule synthesised by
                    // Optimize's polymorph promotion — it isn't a
                    // top-level kind in `optimized.rules`, so it has
                    // no pre-computed simplified view. Compute on
                    // the fly; forms are few per polymorph.
                    return new AssembledGroup({
                        kind: formKind,
                        typeName: formNames.typeName,
                        factoryName: formNames.factoryName,
                        irKey: formNames.irKey,
                        rule: form.content,
                        simplifiedRule: simplifyRule(form.content),
                        name: disambiguated,
                        parentKind: kind,
                    })
                })
                for (const form of forms) nodes.set(form.kind, form)
                nodes.set(kind, new AssembledPolymorph({
                    kind, typeName, factoryName, irKey, forms,
                }))
                break
            }
            case 'leaf': {
                nodes.set(kind, new AssembledLeaf({
                    kind, typeName, factoryName, irKey,
                    pattern: rule.type === 'pattern' ? rule.value : undefined,
                }))
                break
            }
            case 'keyword': {
                nodes.set(kind, new AssembledKeyword({
                    kind, typeName, factoryName, irKey,
                    text: rule.type === 'string' ? rule.value : '',
                }))
                break
            }
            case 'token': {
                // Hidden — no factoryName
                nodes.set(kind, new AssembledToken({ kind, typeName }))
                break
            }
            case 'enum': {
                nodes.set(kind, new AssembledEnum({
                    kind, typeName, factoryName, irKey,
                    values: rule.type === 'enum' ? rule.values : [],
                }))
                break
            }
            case 'supertype': {
                // Extract subtypes: from SupertypeRule directly, or from choice members
                let subtypes: string[]
                if (rule.type === 'supertype') {
                    subtypes = rule.subtypes
                } else if (rule.type === 'choice') {
                    subtypes = rule.members
                        .map(m => m.type === 'variant' ? m.content : m)
                        .filter((m): m is import('./rule.ts').SymbolRule => m.type === 'symbol')
                        .map(m => m.name)
                } else {
                    subtypes = []
                }
                // Resolve hidden subtypes (`_foo`) to the concrete kinds
                // tree-sitter actually surfaces at runtime. Hidden rules
                // defined as `alias(x, y)` are looked up in the
                // pre-Link alias map (Link collapses the alias wrapper);
                // hidden rules defined as `choice(a, b, ...)` expand to
                // their branches via the post-Link rule tree. Unresolved
                // hidden symbols drop through as-is.
                subtypes = resolveHiddenSubtypes(
                    subtypes, optimized.rules, optimized.aliasedHiddenKinds ?? new Map(),
                )
                nodes.set(kind, new AssembledSupertype({ kind, typeName, subtypes }))
                break
            }
            case 'group': {
                // Unwrap GroupRule to its inner content (the seq-with-fields).
                // When the rule is already a GroupRule the pre-computed
                // `simplifiedRule` applies to the outer group; we want
                // the inner content's simplified view to match what
                // we're passing as `rule`. For the wrapper case
                // simplify the unwrapped content directly.
                const groupRule = rule.type === 'group' ? rule.content : rule
                const groupSimplified = rule.type === 'group'
                    ? simplifyRule(groupRule)
                    : simplifiedRule
                nodes.set(kind, new AssembledGroup({
                    kind, typeName, rule: groupRule,
                    simplifiedRule: groupSimplified,
                }))
                break
            }
        }
    }

    // Part A: Collect anonymous tokens/keywords from the rule tree.
    // Tree-sitter promotes string literals to named node-types entries.
    // The grammar's own `word` rule determines keyword-shape: any string
    // whose text matches the word pattern lexes as a word at parse time
    // and becomes an `AssembledKeyword`; non-word strings are
    // `AssembledToken` (punctuation/operators).
    const wordMatcher = compileWordMatcher(optimized.word, optimized.rules)
    collectAnonymousNodes(optimized.rules, nodes, wordMatcher)

    // Part B: Resolve typeName/factoryName collisions between hidden
    // and visible kinds. `nameNode` drops the leading `_` (so users
    // see `TypeIdentifier`, not `HiddenTypeIdentifier`) — this pass
    // then re-adds a `Hidden` prefix only to hidden kinds that actually
    // collide with a visible sibling. Warn on every rename so
    // suggested.ts / logging can surface the list.
    resolveCollidingNames(nodes)

    // Part C: Resolve ir-namespace keys after the NodeMap is complete so
    // collision detection sees every node at once. Emitters read
    // `node.irKey` rather than re-running shortening rules.
    resolveIrKeys(nodes)

    return {
        name: optimized.name,
        nodes,
        signatures: computeSignatures(nodes),
        projections: buildProjections(nodes),
        derivations: optimized.derivations,
        rules: optimized.rules,
        word: optimized.word,
    }
}

// ---------------------------------------------------------------------------
// resolveIrKeys — dedupe-aware short-name pass over the whole NodeMap
// ---------------------------------------------------------------------------

/**
 * The ir namespace (`import { ir } from './ir.js'`) exposes each kind
 * under a short ergonomic key. Collisions on the short form fall back
 * to the full factoryName; JS reserved words get a `_` suffix. This
 * pass claims keys in nodeMap iteration order.
 */
/**
 * Find typeName collisions between hidden (`_`-prefixed) kinds and
 * their visible siblings, and disambiguate by re-prefixing the hidden
 * kind with `Hidden`. Non-colliding hidden kinds keep their clean
 * names. Emits a warning for every rename so the run log surfaces
 * which grammar rules are sharing names.
 */
/**
 * Resolve hidden rule names (`_foo`) referenced as subtypes to the
 * concrete kinds that actually appear in the parse tree. Tree-sitter
 * inlines hidden rules at parse time — a `_type_identifier` defined as
 * `alias($.identifier, $.type_identifier)` shows up as `type_identifier`
 * at runtime, never as `_type_identifier`. Supertype expansion maps
 * built from raw rule-tree names would miss those kinds and the
 * runtime routing map would fail to promote them.
 *
 * Handled shapes:
 * - `alias(x, y)` → `y` (the alias label)
 * - `symbol(target)` → recurse on target (follow chains)
 * - `choice(a, b, …)` → flatten each branch
 * - everything else → keep the hidden name as-is (best-effort)
 *
 * Non-hidden names pass through unchanged.
 */
function resolveHiddenSubtypes(
    names: readonly string[],
    rules: Record<string, Rule>,
    aliasedHiddenKinds: ReadonlyMap<string, string>,
): string[] {
    const out: string[] = []
    const seen = new Set<string>()
    const visit = (name: string): void => {
        if (seen.has(name)) return
        seen.add(name)
        if (!name.startsWith('_')) { out.push(name); return }
        // Aliased hidden rule (`_foo: $ => alias($.bar, $.baz)`) — the
        // parse tree surfaces `baz`, recorded by Link before the alias
        // was collapsed.
        const aliasTarget = aliasedHiddenKinds.get(name)
        if (aliasTarget) {
            if (!seen.has(aliasTarget)) { seen.add(aliasTarget); out.push(aliasTarget) }
            return
        }
        const rule = rules[name]
        if (!rule) { out.push(name); return }
        const resolved = resolveHiddenRuleContent(rule, rules, new Set([name]))
        if (resolved.length === 0) {
            out.push(name)
            return
        }
        for (const r of resolved) {
            // Recurse in case a hidden rule resolves to another hidden rule.
            if (r.startsWith('_')) { visit(r); continue }
            if (!seen.has(r)) { seen.add(r); out.push(r) }
        }
    }
    for (const n of names) visit(n)
    return out
}

function resolveHiddenRuleContent(
    rule: Rule,
    rules: Record<string, Rule>,
    seen: Set<string>,
): string[] {
    switch (rule.type) {
        case 'alias':
            return [rule.value]
        case 'symbol': {
            if (!rule.name.startsWith('_')) return [rule.name]
            if (seen.has(rule.name)) return []
            seen.add(rule.name)
            const target = rules[rule.name]
            return target ? resolveHiddenRuleContent(target, rules, seen) : [rule.name]
        }
        case 'supertype':
            return rule.subtypes.flatMap(s => {
                if (seen.has(s)) return []
                seen.add(s)
                if (!s.startsWith('_')) return [s]
                const target = rules[s]
                return target ? resolveHiddenRuleContent(target, rules, seen) : [s]
            })
        case 'choice':
            return rule.members.flatMap(m => resolveHiddenRuleContent(m, rules, seen))
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'terminal':
            return resolveHiddenRuleContent((rule as { content: Rule }).content, rules, seen)
        default:
            return []
    }
}

function resolveCollidingNames(nodes: Map<string, AssembledNode>): void {
    // Group nodes by typeName. Preferred winner: the non-hidden kind.
    const byType = new Map<string, AssembledNode[]>()
    for (const node of nodes.values()) {
        const bucket = byType.get(node.typeName) ?? []
        bucket.push(node)
        byType.set(node.typeName, bucket)
    }
    for (const [typeName, group] of byType) {
        if (group.length < 2) continue
        const visible = group.filter(n => !n.kind.startsWith('_'))
        const hidden = group.filter(n => n.kind.startsWith('_'))
        if (visible.length >= 1 && hidden.length >= 1) {
            // Only rename when a visible sibling actually gets an
            // exported TypeScript declaration. Token nodes (`modelType
            // === 'token'`) are anonymous structural delimiters that
            // only appear as exported type aliases if they're referenced
            // in a field/child union — many aren't. If ALL visible
            // siblings are tokens, there's no actual TypeScript collision
            // and we leave the hidden kind's name unchanged.
            const hasNonTokenVisible = visible.some(n => n.modelType !== 'token')
            if (!hasNonTokenVisible) continue
            // Visible wins. Rename each hidden with `_` prefix to
            // preserve the tree-sitter convention that hidden/internal
            // kinds start with an underscore.
            for (const h of hidden) {
                const newType = `_${typeName}`
                console.warn(
                    `[assemble] typeName collision: kind '${h.kind}' renamed ` +
                    `'${typeName}' → '${newType}' (visible sibling(s): ${visible.map(v => `'${v.kind}'`).join(', ')})`,
                )
                h.typeName = newType
                if (h.factoryName !== undefined) {
                    // _TypeName → _typeName (camelCase with leading _)
                    h.factoryName = `_${typeName.charAt(0).toLowerCase()}${typeName.slice(1)}`
                }
            }
        } else if (visible.length >= 2) {
            // Two visible kinds collapsed to the same typeName (e.g.
            // python's `true` keyword + `True` named node). Keep the
            // first (sorted by kind) and append a numeric disambiguator
            // to the rest. Warn so the situation is visible.
            const sorted = [...visible].sort((a, b) => a.kind.localeCompare(b.kind))
            for (let i = 1; i < sorted.length; i++) {
                const n = sorted[i]!
                const newType = `${typeName}${i + 1}`
                console.warn(
                    `[assemble] typeName collision between visible kinds: '${n.kind}' renamed ` +
                    `'${typeName}' → '${newType}' (siblings: ${sorted.slice(0, i).map(s => `'${s.kind}'`).join(', ')})`,
                )
                n.typeName = newType
                if (n.factoryName !== undefined) {
                    n.factoryName = newType.charAt(0).toLowerCase() + newType.slice(1)
                }
            }
        } else if (hidden.length >= 2) {
            // Two hidden kinds both normalized to the same name. Give
            // every one after the first a numeric suffix.
            for (let i = 1; i < hidden.length; i++) {
                const h = hidden[i]!
                const newType = `${typeName}${i + 1}`
                console.warn(
                    `[assemble] typeName collision among hidden kinds: '${h.kind}' renamed '${typeName}' → '${newType}'`,
                )
                h.typeName = newType
                if (h.factoryName !== undefined) {
                    h.factoryName = newType.charAt(0).toLowerCase() + newType.slice(1)
                }
            }
        }
    }
}

function resolveIrKeys(nodes: Map<string, AssembledNode>): void {
    // Two-phase claim:
    // Phase 1 — "short form is the full name". Any node whose short
    //   irKey equals its own factoryName gets first dibs (it has nothing
    //   to fall back to that wouldn't also collide). Examples: `expression`,
    //   `as_pattern` (→ `asPattern`), `module` (→ `module`). This forces
    //   suffix-stripped collisions (e.g. `expression_statement` → `expression`)
    //   to lose to the genuinely-short kind.
    // Phase 2 — "short form is a strip of the full name". These have a
    //   distinct factoryName fallback (e.g. `expression_statement` →
    //   `expressionStatement`).
    // Within each phase, hidden (`_`-prefixed) kinds sort after non-hidden
    // so visible kinds claim the short key and hidden ones get `hiddenX`.
    const claimed = new Set<string>()
    // Supertypes don't get factories but they DO occupy a name in the
    // ir namespace (as a type alias). Pre-claim their short form so that
    // a factoryless supertype like python `expression` still blocks
    // `expression_statement` from collapsing its irKey onto `expression`.
    for (const node of nodes.values()) {
        if (node.modelType !== 'supertype') continue
        claimed.add(shortenIrKey(node.kind))
    }
    const phase1: AssembledNode[] = []
    const phase2: AssembledNode[] = []
    for (const node of nodes.values()) {
        if (!node.factoryName) continue
        if (node.modelType === 'group') continue
        const short = shortenIrKey(node.kind)
        if (short === node.factoryName) phase1.push(node)
        else phase2.push(node)
    }
    const hiddenSort = (a: AssembledNode, b: AssembledNode) => {
        const aHidden = a.kind.startsWith('_') ? 1 : 0
        const bHidden = b.kind.startsWith('_') ? 1 : 0
        return aHidden - bHidden
    }
    phase1.sort(hiddenSort)
    phase2.sort(hiddenSort)

    const assign = (node: AssembledNode) => {
        const short = shortenIrKey(node.kind)
        if (!claimed.has(short)) {
            claimed.add(short)
            node.irKey = short
            return
        }
        // Collision — fall back to the full factory name. For hidden
        // kinds this is `hiddenX`, distinct from the visible short form.
        let full = node.factoryName!
        // Extremely rare: even the full name collides (two kinds normalise
        // to the same factoryName). Suffix with `_N` to guarantee uniqueness.
        let candidate = full
        let n = 2
        while (claimed.has(candidate)) {
            candidate = `${full}${n++}`
        }
        claimed.add(candidate)
        node.irKey = candidate
    }
    for (const node of phase1) assign(node)
    for (const node of phase2) assign(node)
}

function shortenIrKey(kind: string): string {
    const stripped = kind
        .replace(/_item$/, '')
        .replace(/_expression$/, '')
        .replace(/_statement$/, '')
        .replace(/_declaration$/, '')
        .replace(/_definition$/, '')
    const parts = stripped.split('_').filter(Boolean)
    if (parts.length === 0) return nameNode(kind).factoryName
    const camel = parts
        .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join('')
    // Reserved-word names fall back to the factory name, which already
    // carries the `_` suffix from nameNode.
    if (IR_KEY_RESERVED.has(camel)) return nameNode(kind).factoryName
    return camel
}

const IR_KEY_RESERVED = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'function', 'if', 'import', 'in',
    'instanceof', 'let', 'new', 'null', 'return', 'static', 'super',
    'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
    'while', 'with', 'yield', 'async', 'await',
])

// ---------------------------------------------------------------------------
// collectAnonymousNodes — extract string literals from rules as token/keyword entries
// ---------------------------------------------------------------------------

function collectAnonymousNodes(
    rules: Record<string, Rule>,
    nodes: Map<string, AssembledNode>,
    wordMatcher: RegExp | undefined,
): void {
    const seen = new Set<string>()

    for (const rule of Object.values(rules)) {
        walkForStrings(rule, seen)
    }

    for (const value of seen) {
        if (nodes.has(value)) continue // Already classified as a named rule
        if (value === '' || /^\s+$/.test(value)) continue // Skip whitespace/empty

        // Keyword-shape is "lexes as a word under the grammar's `word`
        // rule". When the grammar declares no `word` (or we can't
        // extract its pattern), fall back to `/^\w+$/`.
        const isWordShape = wordMatcher ? wordMatcher.test(value) : /^\w+$/.test(value)
        const { typeName } = nameNode(value)

        if (isWordShape) {
            // Keyword token (e.g., "if", "class", "pub")
            // Anonymous keywords from grammar — no factory (hidden)
            nodes.set(value, new AssembledKeyword({
                kind: value, typeName, text: value,
            }))
        } else {
            // Operator/punctuation token (e.g., "+", "->", "{")
            nodes.set(value, new AssembledToken({ kind: value, typeName }))
        }
    }
}

function walkForStrings(rule: Rule, out: Set<string>): void {
    switch (rule.type) {
        case 'string':
            out.add(rule.value)
            break
        case 'enum':
            // Enum values are the `text` content of the parent kind,
            // not distinct node kinds. The parser produces a single
            // node (e.g. `primitive_type` with text `"usize"`), never
            // a `usize` node. Do NOT descend.
            break
        case 'seq':
            for (const m of rule.members) walkForStrings(m, out)
            break
        case 'choice':
            for (const m of rule.members) walkForStrings(m, out)
            break
        case 'optional':
            walkForStrings(rule.content, out)
            break
        case 'repeat':
            walkForStrings(rule.content, out)
            break
        case 'field':
            walkForStrings(rule.content, out)
            break
        case 'variant':
            walkForStrings(rule.content, out)
            break
        case 'clause':
            walkForStrings(rule.content, out)
            break
        case 'group':
            walkForStrings(rule.content, out)
            break
    }
}

// ---------------------------------------------------------------------------
// classifyNode — structural simplification + visibility
// ---------------------------------------------------------------------------

type ModelType = AssembledNode['modelType']

/**
 * Check if all variant members of a choice have the same field names.
 * If so, it's a branch with operator variation (e.g., binary_operator with prec variants),
 * not a polymorph with structurally distinct forms.
 */
function allVariantsHaveSameFieldSet(rule: Rule): boolean {
    if (rule.type !== 'choice') return false

    const fieldSets: Set<string>[] = []
    for (const member of rule.members) {
        const content = member.type === 'variant' ? member.content : member
        const fields = extractFieldNames(content)
        fieldSets.push(fields)
    }

    if (fieldSets.length < 2) return false

    const first = fieldSets[0]!
    // Must have at least one field — empty field sets mean children-based, not field-based
    if (first.size === 0) return false

    return fieldSets.every(s =>
        s.size === first.size && [...s].every(f => first.has(f))
    )
}

function extractFieldNames(rule: Rule): Set<string> {
    const names = new Set<string>()
    walkForFieldNames(rule, names)
    return names
}

function walkForFieldNames(rule: Rule, out: Set<string>): void {
    switch (rule.type) {
        case 'field':
            out.add(rule.name)
            break
        case 'seq':
            for (const m of rule.members) walkForFieldNames(m, out)
            break
        case 'choice':
            for (const m of rule.members) walkForFieldNames(m, out)
            break
        case 'optional':
            walkForFieldNames(rule.content, out)
            break
        case 'repeat':
            walkForFieldNames(rule.content, out)
            break
        case 'variant':
            walkForFieldNames(rule.content, out)
            break
        case 'clause':
            walkForFieldNames(rule.content, out)
            break
    }
}

/**
 * Classify a rule into a model type by pure rule.type dispatch.
 *
 * By the time rules reach Assemble, Link and Optimize have already
 * pre-classified the interesting cases via dedicated rule types:
 *
 *   EnumRule       — Link: choice-of-strings
 *   SupertypeRule  — Link: hidden choice-of-symbols (grammar or promoted)
 *   GroupRule      — Link: hidden seq with fields
 *   TerminalRule   — Link: subtree with no fields and no symbol refs
 *   PolymorphRule  — Optimize: choice-of-variants with heterogeneous fields
 *
 * Assemble just dispatches on rule.type. The only structural inspection
 * left is distinguishing branch (has fields) from container (has children
 * only) for ordinary seq rules — that's a one-level check.
 */
export function classifyNode(kind: string, rule: Rule): ModelType {
    switch (rule.type) {
        case 'enum':      return 'enum'
        case 'supertype': return 'supertype'
        case 'group':     return 'group'
        case 'terminal':  return 'leaf'
        case 'polymorph': return 'polymorph'
        case 'pattern':   return 'leaf'
        case 'string':    return /^\w+$/.test(rule.value) ? 'keyword' : 'token'
    }

    // T065 — polymorph shape fallback. Fires when `IncludeFilter.rules`
    // held back `promoted`, leaving a raw `choice` whose variants
    // carry heterogeneous field sets. Link's `promotePolymorph`
    // would normally wrap this in a `PolymorphRule`; under strict
    // debug mode we detect the shape here so the node still gets
    // treated as a polymorph instead of collapsing into a flat
    // branch with union-ed fields.
    if (rule.type === 'choice' && hasAnyField(rule) && !allVariantsHaveSameFieldSet(rule)) {
        return 'polymorph'
    }

    // seq/choice/optional/repeat/field/... — distinguish branch from container.
    // Only need existence checks, not full extraction. The class getters
    // (AssembledBranch.fields, AssembledContainer.children) do the full walk
    // later, once.
    if (hasAnyField(rule)) return 'branch'
    if (hasAnyChild(rule)) return 'container'

    // T065 — terminal fallback. All-text subtree → leaf; pure
    // choice-of-strings → enum. Anything still unclassifiable after
    // this is a real error and falls through to the throw.
    if (isAllTextShape(rule)) return 'leaf'
    if (rule.type === 'choice' && rule.members.every(m => m.type === 'string')) return 'enum'
    throw new Error(
        `classifyNode: '${kind}' has no fields, no children, and no rule-type ` +
        `classification. Link should have wrapped it as TerminalRule. rule.type=${rule.type}`,
    )
}

/**
 * Shape-inspection helper for the classifier fallback. A rule is
 * "all text" when every leaf is a string or pattern and there are
 * no symbol references. Walked recursively through seq/choice/
 * optional/repeat/token/variant/clause/group wrappers.
 */
function isAllTextShape(rule: Rule): boolean {
    switch (rule.type) {
        case 'string':
        case 'pattern':
            return true
        case 'symbol':
        case 'field':
            return false
        case 'seq':
        case 'choice':
            return rule.members.length > 0 && rule.members.every(isAllTextShape)
        case 'optional':
        case 'repeat':
        case 'token':
        case 'variant':
        case 'clause':
        case 'group':
            return isAllTextShape(rule.content)
        default:
            return false
    }
}

// ---------------------------------------------------------------------------
// simplifyRule lives in compiler/simplify.ts and now runs as a
// dedicated pipeline stage at the end of `optimize()`. Re-exported
// here so the existing assemble.test.ts import site keeps working.
// ---------------------------------------------------------------------------

export { simplifyRule }

// ---------------------------------------------------------------------------
// extractFields — walk rule tree, collect fields with derived metadata
// ---------------------------------------------------------------------------

// extractForms — deleted. PolymorphRule.forms is built by Optimize's
// promotePolymorph pass; assemble builds AssembledGroup instances from
// those forms directly (see the 'polymorph' case of the switch above).

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------

// Reserved or restricted identifiers that cannot be top-level function names
// in strict-mode TypeScript (or would shadow globals in problematic ways).
const FACTORY_NAME_RESERVED = new Set([
    'arguments', 'eval', 'yield', 'await', 'async', 'function', 'class',
    'import', 'export', 'default', 'return', 'throw', 'new', 'delete',
    'typeof', 'instanceof', 'in', 'of', 'let', 'const', 'var', 'null',
    'true', 'false', 'undefined', 'NaN', 'Infinity', 'static', 'public',
    'private', 'protected', 'interface', 'package', 'implements',
])

export function nameNode(kind: string): { typeName: string; factoryName: string; irKey: string } {
    // Tokens/keywords can contain non-identifier chars (!=, #, %, ->, ==, etc.).
    // Route through tokenToName first so typeName is always a valid identifier.
    const normalized = /^[\w_]+$/.test(kind) ? kind : tokenToName(kind)
    // Strip leading underscore (hidden-rule marker) and collapse internal
    // double underscores into `_U_` so they survive PascalCase flattening.
    //   `_type_identifier`  → `TypeIdentifier`  (same as visible sibling)
    //   `type_identifier`   → `TypeIdentifier`
    //   `literal_type__x`   → `LiteralTypeUX`
    // Collisions between hidden/visible kinds are resolved post-hoc by
    // `resolveCollidingNames()` in assemble() — at which point the whole
    // NodeMap is visible and we can apply a disambiguator only where
    // actually needed.
    const marked = normalized.replace(/^_+/, '').replace(/__+/g, '_U_')
    let typeName = marked
        .split('_')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('') || 'Anonymous'
    // TypeScript identifiers cannot start with a digit
    if (/^\d/.test(typeName)) typeName = `Tok_${typeName}`
    let factoryName = typeName.charAt(0).toLowerCase() + typeName.slice(1)
    // Avoid names that are illegal as top-level function declarations
    // (e.g. `arguments`, `eval`) or that shadow language keywords.
    if (FACTORY_NAME_RESERVED.has(factoryName)) factoryName = `${factoryName}_`
    const irKey = factoryName
    return { typeName, factoryName, irKey }
}

// Reserved words that cannot be used as parameter/method names in TypeScript.
const TS_RESERVED_WORDS = new Set([
    'arguments', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof',
    'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try',
    'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'implements',
    'interface', 'package', 'private', 'protected', 'public',
])

export function nameField(fieldName: string): { propertyName: string; paramName: string } {
    let propertyName = fieldName.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    // Avoid TS reserved keywords for param names by suffixing with '_'
    let paramName = propertyName
    if (TS_RESERVED_WORDS.has(paramName)) paramName = `${paramName}_`
    return { propertyName, paramName }
}

// ---------------------------------------------------------------------------
// Signatures & Projections (stubs — full implementation in refinement)
// ---------------------------------------------------------------------------

function computeSignatures(nodes: Map<string, AssembledNode>): SignaturePool {
    return { signatures: new Map() }
}

function buildProjections(nodes: Map<string, AssembledNode>): ProjectionContext {
    return { projections: new Map() }
}
