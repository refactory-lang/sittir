/**
 * compiler/template-walker.ts — turn a Rule subtree into a template
 * string plus any clause sub-templates.
 *
 * Consumed by both:
 * - `compiler/node-map.ts` — `AssembledBranch.renderTemplate()` and
 *   sibling helpers call {@link renderRuleTemplate} to produce the
 *   `{ template, clauses, joinByField }` triple stored on the node model.
 * - `emitters/templates.ts` — the YAML emitter reads the same triple
 *   when serialising per-rule entries into `templates.yaml`.
 *
 * The walker only consumes the Rule model — it has no coupling to
 * AssembledNode. That keeps the template surface pure-rule-driven:
 * change how a rule is classified, the template stays; change how
 * a rule is shaped, the template follows.
 *
 * Notable hooks callers rely on:
 * - {@link WalkResult.clauses} — sub-templates keyed by
 *   `<fieldName>_clause`; render drops the whole clause when the
 *   referenced field is absent (e.g. python `return_type_clause:
 *   -> $RETURN_TYPE`).
 * - {@link WalkResult.joinByField} — per-field separator captured
 *   from `field('x', repeat(y, separator=','))` so a rule with
 *   multiple multi-valued fields can use different separators
 *   (rust tuple_expression joins `attributes` by `\n` and `rest`
 *   by `,`).
 * - {@link findRepeatSeparator} / {@link findRepeatFlag} — cheap
 *   predicates the templates emitter uses to attach rule-level
 *   `joinBy` / `joinByTrailing` / `joinByLeading` metadata.
 */

import type {
    Rule, ChoiceRule,
} from './rule.ts'
import { isSyntheticFieldWrapper } from './node-map.ts'

/**
 * Extract anonymous-string literals flanking the main content of a field
 * rule. The override pattern `field('first', seq(_expression, ','))`
 * from rust tuple_expression embeds a trailing comma inside the field;
 * without lifting it, the walker's slot emission `$FIRST` loses the
 * comma entirely. By extracting `leading: '', trailing: ','` here, the
 * walker can emit `$FIRST,` and preserve the override author's intent.
 *
 * Only single anonymous strings at the start/end of a `seq` are lifted;
 * complex flanking content stays inside the field's value at runtime.
 */
function extractFlankingLiterals(content: Rule): { leading: string; trailing: string } {
    if (content.type !== 'seq' || content.members.length < 2) {
        return { leading: '', trailing: '' }
    }
    let leading = ''
    let trailing = ''
    const first = content.members[0]
    const last = content.members[content.members.length - 1]
    // A leading literal is only valid if there's at least one non-literal
    // member after it; same logic for trailing. We don't lift a literal
    // out of a single-member seq.
    if (first?.type === 'string' && content.members.length >= 2) {
        leading = first.value
    }
    if (last?.type === 'string' && content.members.length >= 2 && last !== first) {
        trailing = last.value
    }
    return { leading, trailing }
}

/**
 * If a field's content is (or transitively wraps) a `repeat` rule, return
 * its separator. Defaults to `\n` for repeats that have no explicit
 * separator — `field('items', repeat(symbol))` patterns in tree-sitter
 * grammars are almost always statement-like lists where each element
 * lives on its own line (struct attributes, try.except_clauses, etc.).
 *
 * Returns `null` when the content does not wrap a repeat at all.
 */
function wrappedRepeatSeparator(content: Rule): string | null {
    switch (content.type) {
        case 'repeat':
        case 'repeat1':
            return content.separator ?? '\n'
        case 'optional':
        case 'group':
        case 'variant':
        case 'clause':
            return wrappedRepeatSeparator(content.content)
        default:
            return null
    }
}
// ---------------------------------------------------------------------------
// Template walker — shared by AssembledBranch/Container/Group.renderTemplate
// ---------------------------------------------------------------------------
//
// Walks a Rule subtree producing a template string + any clause sub-
// templates. A ClauseRule becomes a `$NAME_CLAUSE` placeholder plus an
// entry in the `clauses` map — the renderer drops the whole clause at
// runtime when the referenced field is absent, handling constructs like
// python's `return_type_clause: -> $RETURN_TYPE`.

interface WalkResult {
    template: string
    clauses: Record<string, string>
    /**
     * Per-field-name separator captured from `field('x', repeat(y, separator=','))`
     * patterns. The template emitter merges these into the rule entry as
     * `joinByField: { x: ',' }` so the renderer can pick the right join
     * for each `$$$X` slot when a single rule has multiple multi-valued
     * fields with different separators (e.g. rust's tuple_expression has
     * `attributes` joined by newline and `rest` joined by comma).
     */
    joinByField: Record<string, string>
}

export function renderRuleTemplate(
    rule: Rule,
    inRepeat = false,
    rules?: Record<string, Rule>,
    wordMatcher?: RegExp,
): WalkResult {
    const clauses: Record<string, string> = {}
    const joinByField: Record<string, string> = {}
    // Pre-compute field names that appear in any `repeat` subtree so
    // the walker can emit `$$$NAME` even for the *first* occurrence of a
    // repeated field — the commaSep1 pattern `seq(field(X), repeat(seq(',',
    // field(X))))` has X at non-repeat position first, then at repeat
    // position, but both should render as the same multi-valued slot.
    const repeatedFields = new Set<string>()
    collectRepeatedFields(rule, false, repeatedFields, rules, new Set())
    const parts = walkRuleForTemplate(rule, new Set(), inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher)
    return { template: parts.join(''), clauses, joinByField }
}

/**
 * Does a field's content produce multi-valued entries at parse time?
 * Looks for `repeat` / `repeat1` reachable without crossing another
 * `field` boundary (sub-fields define their own scope). Unwraps
 * transparent composition nodes — seq / choice / variant / group /
 * clause / optional / alias — so a `choice(semiForm, repeat(...))` is
 * detected. Hidden-symbol content is inlined at template time, so
 * follow them too.
 */
function containsRepeat(
    rule: Rule,
    rules: Record<string, Rule> | undefined,
    visiting: Set<string>,
): boolean {
    switch (rule.type) {
        case 'repeat':
        case 'repeat1':
            return true
        case 'seq':
        case 'choice':
            return rule.members.some(m => containsRepeat(m, rules, visiting))
        case 'optional':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'alias':
        case 'terminal':
            return containsRepeat((rule as { content: Rule }).content, rules, visiting)
        case 'symbol': {
            const name = (rule as { name: string }).name
            if (!name.startsWith('_') || !rules || visiting.has(name)) return false
            const target = rules[name]
            if (!target) return false
            visiting.add(name)
            const r = containsRepeat(target, rules, visiting)
            visiting.delete(name)
            return r
        }
        case 'polymorph':
            return rule.forms.some(f => containsRepeat(f.content, rules, visiting))
        default:
            return false
    }
}

function collectRepeatedFields(
    rule: Rule,
    inRepeat: boolean,
    out: Set<string>,
    rules: Record<string, Rule> | undefined,
    visiting: Set<string>,
): void {
    switch (rule.type) {
        case 'seq':
        case 'choice':
            for (const m of rule.members) collectRepeatedFields(m, inRepeat, out, rules, visiting)
            return
        case 'repeat':
        case 'repeat1':
            collectRepeatedFields(rule.content, true, out, rules, visiting)
            return
        case 'optional':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'alias':
        case 'terminal':
            collectRepeatedFields((rule as { content: Rule }).content, inRepeat, out, rules, visiting)
            return
        case 'field':
            // A field is repeated if it sits inside a repeat (its content
            // will be emitted multiple times at runtime) OR if its content
            // is itself a repeat — e.g. rust's `field('elements',
            // choice(semi, repeat(_expression, sep=',')))`. The latter
            // shape produces a multi-valued field whose values live under
            // the same fieldNameForChild across siblings; without the
            // `$$$` marker the template emits only the first occurrence.
            if (inRepeat || containsRepeat(rule.content, rules, new Set())) out.add(rule.name)
            collectRepeatedFields(rule.content, inRepeat, out, rules, visiting)
            return
        case 'symbol': {
            // Follow hidden symbols once — their content will be inlined
            // during template emission, so any repeated fields inside
            // must be counted at the caller site as well.
            const name = (rule as { name: string }).name
            if (!name.startsWith('_') || !rules || visiting.has(name)) return
            const target = rules[name]
            if (!target) return
            visiting.add(name)
            collectRepeatedFields(target, inRepeat, out, rules, visiting)
            visiting.delete(name)
            return
        }
        case 'polymorph':
            for (const form of rule.forms) {
                collectRepeatedFields(form.content, inRepeat, out, rules, visiting)
            }
            return
        default:
            return
    }
}

function walkRuleForTemplate(
    rule: Rule,
    seen: Set<string>,
    inRepeat: boolean,
    clauses: Record<string, string>,
    rules?: Record<string, Rule>,
    repeatedFields?: ReadonlySet<string>,
    joinByField?: Record<string, string>,
    wordMatcher?: RegExp,
): string[] {
    switch (rule.type) {
        case 'seq': {
            // Sibling-repeated-field detection. When `inferFields` has
            // wrapped two (or more) symbol references in the same seq
            // with the SAME field name (rust or_pattern: two _pattern
            // refs both tagged `field('pattern', ...)`), `seen.add`
            // would dedup the second slot and drop it. Instead, detect
            // the duplication, augment `repeatedFields` so the field
            // emits as `$$$NAME`, and capture the literal between the
            // first and second occurrence as the joinBy separator.
            const unwrapField = (r: Rule): string | null => {
                if (r.type === 'field') return r.name
                if (r.type === 'optional' || r.type === 'variant' || r.type === 'clause' || r.type === 'group') return unwrapField(r.content)
                return null
            }
            const unwrapChildTarget = (r: Rule): string | null => {
                if (r.type === 'symbol') return r.name
                if (r.type === 'supertype') return r.name
                if (r.type === 'optional' || r.type === 'variant' || r.type === 'clause' || r.type === 'group') return unwrapChildTarget(r.content)
                return null
            }
            // Recognize the "element + separator" sub-patterns used by
            // rust-style trailing-comma lists:
            //   seq(field('X'), SEP)                    — one element w/ trailing sep
            //   repeat(seq(field('X'), SEP))            — zero-or-more same
            //   repeat1(seq(field('X'), SEP))           — one-or-more same
            // Returns the field name and the literal separator string when
            // the member matches. The SEP string gets hoisted as `joinByField[X]`
            // via the existing sibling-multi logic, and the inner literal is
            // suppressed from the template so render emits via joinByTrailing
            // without duplication.
            const elementWithSep = (r: Rule): { name: string; sep: string } | null => {
                let inner = r
                if (inner.type === 'repeat' || inner.type === 'repeat1') inner = inner.content
                if (inner.type !== 'seq' || inner.members.length !== 2) return null
                const fname = unwrapField(inner.members[0]!)
                const sepMember = inner.members[1]!
                if (!fname || sepMember.type !== 'string') return null
                return { name: fname, sep: sepMember.value }
            }
            const fieldCounts = new Map<string, number>()
            const fieldSeps = new Map<string, string>()
            const childTargetCounts = new Map<string, number>()
            for (const m of rule.members) {
                const fn = unwrapField(m)
                if (fn) {
                    fieldCounts.set(fn, (fieldCounts.get(fn) ?? 0) + 1)
                    continue
                }
                const elemSep = elementWithSep(m)
                if (elemSep) {
                    fieldCounts.set(elemSep.name, (fieldCounts.get(elemSep.name) ?? 0) + 1)
                    if (!fieldSeps.has(elemSep.name)) fieldSeps.set(elemSep.name, elemSep.sep)
                    continue
                }
                const tgt = unwrapChildTarget(m)
                if (tgt) childTargetCounts.set(tgt, (childTargetCounts.get(tgt) ?? 0) + 1)
            }
            // Sibling-duplicate symbol references with the SAME target
            // (e.g. rust or_pattern: two `_pattern` refs separated by
            // `|`) share the single `children` slot. Capture the literal
            // between them as the children-slot joinBy so the renderer
            // uses it instead of emitting a trailing separator.
            const hasChildDup = [...childTargetCounts.values()].some(c => c > 1)
            if (hasChildDup && joinByField && !('children' in joinByField)) {
                let seenFirst = false
                for (const m of rule.members) {
                    const tgt = unwrapChildTarget(m)
                    if (tgt && (childTargetCounts.get(tgt) ?? 0) > 1) {
                        if (!seenFirst) { seenFirst = true; continue }
                        break
                    }
                    if (seenFirst && m.type === 'string') { joinByField['children'] = m.value; break }
                }
            }
            let augmentedRepeatedFields = repeatedFields
            for (const [fname, cnt] of fieldCounts) {
                if (cnt <= 1) continue
                if (!augmentedRepeatedFields) augmentedRepeatedFields = new Set<string>()
                const set = augmentedRepeatedFields as Set<string>
                if (!set.has(fname)) set.add(fname)
                if (joinByField && !(fname in joinByField)) {
                    // Prefer the separator captured from an
                    // `elementWithSep` sub-pattern (e.g. the `,` inside
                    // `seq(field('X'), ',')`). Falls back to finding the
                    // first non-field string between occurrences.
                    const capturedSep = fieldSeps.get(fname)
                    if (capturedSep != null) {
                        joinByField[fname] = capturedSep
                    } else {
                        let seenFirst = false
                        for (const m of rule.members) {
                            const mField = unwrapField(m)
                            const isThisField = mField === fname
                            if (isThisField && !seenFirst) { seenFirst = true; continue }
                            if (seenFirst && m.type === 'string') { joinByField[fname] = m.value; break }
                            if (isThisField && seenFirst) break
                        }
                    }
                }
            }
            // Skip separator strings that match a sibling-multi field's
            // captured joinBy — those belong INSIDE the `$$$NAME` slot
            // rendering, not as standalone template text.
            const skipSeps = new Set<string>()
            if (joinByField) {
                for (const [fname, cnt] of fieldCounts) {
                    if (cnt > 1 && joinByField[fname]) skipSeps.add(joinByField[fname])
                }
                if (hasChildDup && joinByField['children']) skipSeps.add(joinByField['children'])
            }
            // For members matching the `seq(field('X'), SEP)` sub-pattern
            // where X was counted as sibling-multi above, substitute the
            // sub-seq with just the field. The SEP is now captured as
            // joinByField[X] so render emits it via $$$X's join-logic;
            // walking the full sub-seq would re-emit the SEP as a literal.
            const substituteMember = (m: Rule): Rule => {
                const es = elementWithSep(m)
                if (!es) return m
                const cnt = fieldCounts.get(es.name) ?? 0
                if (cnt <= 1) return m
                // Peel repeat wrapper if present, then extract the field.
                let inner = m
                if (inner.type === 'repeat' || inner.type === 'repeat1') inner = inner.content
                if (inner.type === 'seq' && inner.members.length === 2) return inner.members[0]!
                return m
            }
            const out: string[] = []
            for (const m of rule.members) {
                if (m.type === 'string' && skipSeps.has(m.value)) continue
                const substituted = substituteMember(m)
                const parts = walkRuleForTemplate(substituted, seen, inRepeat, clauses, rules, augmentedRepeatedFields, joinByField, wordMatcher)
                // Drop a leading literal from `parts` that duplicates the
                // trailing literal already in `out`. This collapses cases
                // like rust line_comment where an outer `'//'` token is
                // followed by a choice whose primary branch emits another
                // `'//'` (from a pattern lookahead disambiguator), producing
                // `////` in the template. Only applied to non-placeholder
                // literals — `$NAME`/`$$$CHILDREN` slots are distinct.
                while (parts.length > 0 && out.length > 0) {
                    const head = parts[0]!
                    const tail = out[out.length - 1]!
                    if (!head.startsWith('$') && head === tail) {
                        parts.shift()
                        continue
                    }
                    break
                }
                if (out.length > 0 && parts.length > 0) {
                    // When the adjacent placeholder is a clause whose body is
                    // a bare non-word-punctuation literal (e.g. `bang_clause: "!"`
                    // emitted by the optional-punct walker), use the underlying
                    // literal for spacing rather than the placeholder's own
                    // identifier characters. Prevents `$BANG_CLAUSE $TRAIT` from
                    // inserting a spurious space between `!` and the trait name
                    // in `impl !Foo for Bar`.
                    const effectiveLastChar = (s: string): string => {
                        const m = s.match(/^\$([A-Z_][A-Z0-9_]*)_CLAUSE$/)
                        if (m) {
                            const body = clauses[`${m[1]!.toLowerCase()}_clause`]
                            if (body && /^[^\w\s]+$/.test(body)) return body.slice(-1)
                        }
                        return s.slice(-1)
                    }
                    const effectiveFirstChar = (s: string): string => {
                        const m = s.match(/^\$([A-Z_][A-Z0-9_]*)_CLAUSE$/)
                        if (m) {
                            const body = clauses[`${m[1]!.toLowerCase()}_clause`]
                            if (body && /^[^\w\s]+$/.test(body)) return body.charAt(0)
                        }
                        return s.charAt(0)
                    }
                    const lastChar = effectiveLastChar(out[out.length - 1]!)
                    const firstChar = effectiveFirstChar(parts[0]!)
                    if (needsSpace(lastChar, firstChar, wordMatcher)) out.push(' ')
                }
                out.push(...parts)
            }
            return out
        }

        case 'choice': {
            // For choice in a template, start with the first non-empty
            // member's parts. Then walk remaining members with the SHARED
            // `seen` set to surface any NEW field/symbol placeholders that
            // only appear in other branches (e.g. function_item's
            // return_type, attribute's arguments variant). Only placeholder
            // tokens (`$...`) from subsequent branches are appended —
            // literals from alternative branches would otherwise leak into
            // the template unconditionally (`////`, `=value` etc.).
            const out: string[] = []
            let primaryTaken = false
            for (const m of rule.members) {
                const parts = walkRuleForTemplate(m, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher)
                if (parts.length === 0) continue
                if (!primaryTaken) {
                    out.push(...parts)
                    primaryTaken = true
                    continue
                }
                for (const p of parts) {
                    if (p.startsWith('$')) out.push(p)
                }
            }
            return out
        }

        case 'optional': {
            // Optional of a single keyword-shape literal (`async`,
            // `move`, `pub`, `static`, `unsafe`, …) — emit a clause
            // whose body is a `$KW` placeholder. The renderer's
            // children-by-kind-name fallback fires only when
            // readNode captured an anonymous child with that text,
            // so the token round-trips: absent on parse → absent on
            // render, present on parse → present on render.
            //
            // Non-word punctuation (`,`, `;`, `::`, …) is a bigger
            // problem — the existing seq walker already emits those
            // literals unconditionally via other paths, so intercepting
            // them here double-emits or eats children out from under
            // sibling slots. Left for a follow-up that reworks the
            // seq/optional interaction.
            //
            // The word matcher is the grammar's own `word` rule.
            // Grammars without a word rule fall back to `/^\w+$/`.
            const kwString = extractSingleKeywordString(rule.content)
            if (kwString !== null) {
                const matches = wordMatcher
                    ? wordMatcher.test(kwString)
                    : /^\w+$/.test(kwString)
                if (matches) {
                    const clauseKey = `${kwString}_clause`
                    if (!(clauseKey in clauses)) {
                        clauses[clauseKey] = `$${kwString.toUpperCase()}`
                    }
                    return [`$${kwString.toUpperCase()}_CLAUSE`]
                }
                // Non-word punctuation that carries semantic meaning in a
                // specific grammar position (e.g. rust `impl_item` trait
                // negation `!`, `?` modifiers). Emit a bare-literal clause
                // — renderClause's no-placeholder branch fires the clause
                // only when readNode captured the anon token. The clause
                // body is the literal itself so the renderer emits the
                // exact text; the slot name derives from tokenToName so
                // it's a legal template identifier.
                //
                // Gated to a safe allowlist — list-separator punctuation
                // (`,`, `;`, `:`) is handled by the seq walker's
                // joinByTrailing / skipSeps logic and would double-emit
                // if intercepted here. Trailing-separator `optional(',')`
                // inside list-shaped seqs is filtered earlier at the seq
                // level, so this path only fires for standalone optionals
                // that don't collide with separator detection.
                const CLAUSE_PUNCT_NAMES: Record<string, string> = {
                    '!': 'bang',
                    '?': 'question',
                }
                const punctName = CLAUSE_PUNCT_NAMES[kwString]
                if (punctName) {
                    const clauseKey = `${punctName}_clause`
                    if (!(clauseKey in clauses)) {
                        clauses[clauseKey] = kwString
                    }
                    return [`$${punctName.toUpperCase()}_CLAUSE`]
                }
            }
            // `optional(',')` and friends — pure punctuation in an optional
            // wrapper is context-dependent and including it unconditionally
            // produces invalid output (python: `match X,:`). Skip the
            // whole optional when its content has no field/symbol ref.
            if (containsOnlyPunctuation(rule.content)) return []
            // Lift `optional(...)` contents that match one of these
            // shapes into per-field clauses. The flanking literals move
            // into the clause body so they render only when the field
            // is populated:
            //   * `optional(choice(seq(literal, field), field, ...))`
            //     rust `attribute` — `=value` vs bare `#[name]`.
            //   * `optional(seq(literal, field))` — e.g. javascript
            //     `_initializer` inlined into `variable_declarator`:
            //     `seq('=', field('value', ...))`. Without lifting, the
            //     `=` renders unconditionally and `var x: T;` becomes
            //     `var x: T=;`.
            //   * `optional(field)` — handled by the walker's default
            //     recursion already (field branch emits `$NAME`).
            const toLift: Rule = rule.content.type === 'choice'
                ? rule.content
                : { type: 'choice', members: [rule.content] } as Rule
            const lifted = liftChoiceBranchesToClauses(toLift as ChoiceRule, clauses, seen)
            if (lifted !== null) {
                // Mark the lifted fields as seen so sibling members
                // inside the enclosing seq don't re-emit the same slot
                // via the default walker path.
                for (const p of lifted) {
                    const m = p.match(/^\$([A-Za-z_][\w]*)_CLAUSE$/)
                    if (m) seen.add(m[1]!.toLowerCase())
                }
                return lifted
            }
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher)
        }

        case 'repeat':
        case 'repeat1': {
            // Propagate the repeat's separator as a per-slot joinBy when
            // the content is a field. commaSep1 lifts `seq(X, repeat(seq(',',
            // X)))` → `repeat1(X, separator=',')`. The field inside gets
            // emitted as a multi-value slot via `inRepeat=true`, but
            // without a per-slot joinBy capture it renders joined by the
            // default `' '`.
            if (rule.separator && joinByField) {
                // Inline unwrap — the seq-case helper is scoped there.
                const peel = (r: Rule): string | null => {
                    if (r.type === 'field') return r.name
                    if (r.type === 'optional' || r.type === 'variant' || r.type === 'clause' || r.type === 'group') return peel(r.content)
                    return null
                }
                const fname = peel(rule.content)
                if (fname && !(fname in joinByField)) joinByField[fname] = rule.separator
            }
            return walkRuleForTemplate(rule.content, seen, true, clauses, rules, repeatedFields, joinByField, wordMatcher)
        }

        case 'field': {
            if (seen.has(rule.name)) return []
            // Synthetic outer-field wrapper detection. Autogen overrides
            // sometimes wrap a complex seq (containing inner fields, a
            // choice with variants, literal tokens) in an outer
            // `field('name', seq(...))`. Tree-sitter doesn't produce a
            // single node value for such wrappers at parse time — the
            // inner fields are the real runtime data. When we detect this
            // shape, walk INTO the content and let the inner fields /
            // literals surface as their own template slots. Skipping the
            // outer slot avoids emitting a `$NAME` placeholder that the
            // renderer can't resolve to anything meaningful.
            if (isSyntheticFieldWrapper(rule.content)) {
                // Don't add rule.name to `seen` — we're not emitting
                // that slot, so inner fields may legitimately reuse the
                // same name (rare but possible).
                return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher)
            }
            seen.add(rule.name)
            const varName = rule.name.toUpperCase()
            // A field is multi-valued in three situations:
            //   1. it's nested inside a repeat (`inRepeat`)
            //   2. another occurrence of the same field name appears inside a
            //      repeat — the commaSep1 pattern `field(X) ... repeat(field(X))`
            //      where the first slot is non-repeat (caught by repeatedFields)
            //   3. its OWN content is a repeat — the override pattern
            //      `field('rest', repeat(expr, separator=','))` where the field
            //      sits at non-repeat position but wraps a repeat directly
            const wrappedSep = wrappedRepeatSeparator(rule.content)
            const multi = inRepeat
                || (repeatedFields?.has(rule.name) ?? false)
                || wrappedSep !== null
            // Capture per-slot joinBy when the wrapped repeat carries a
            // separator. A single rule with multiple multi-valued fields
            // can then have distinct separators (rust tuple_expression's
            // attributes joins with `\n`, rest with `,`).
            if (joinByField && wrappedSep) joinByField[rule.name] = wrappedSep
            const slot = multi ? `$$$${varName}` : `$${varName}`
            // Extract anonymous-string literals flanking the field's main
            // content. The override pattern `field('first', seq(_expression,
            // ','))` from rust's tuple_expression bundles the trailing comma
            // INSIDE the field; without this extraction the comma is lost
            // and the rendered output joins `$FIRST $$$REST` with no
            // separator. By emitting `$FIRST,` instead, the comma stays.
            // Optional wrapping flanks: `field('label', optional(seq(label,
            // ':')))` from rust's loop_expression. The trailing `:` must
            // only render when the label slot is populated — otherwise an
            // unlabelled `loop { }` becomes `: loop { }`. Lifting into a
            // clause makes the whole group conditional.
            if (rule.content.type === 'optional') {
                const inner = rule.content.content
                const optFlank = extractFlankingLiterals(inner)
                if (optFlank.leading || optFlank.trailing) {
                    const clauseTmpl = optFlank.leading + slot + optFlank.trailing
                    clauses[`${rule.name}_clause`] = clauseTmpl
                    const placeholder = `$${varName}_CLAUSE`
                    return rule.blockBearer
                        ? ['\n  ', placeholder, '\n']
                        : [placeholder]
                }
            }
            const flank = extractFlankingLiterals(rule.content)
            // Block-bearer fields render as an indented block (python
            // `class X:\n  body`). Link annotates the field when its
            // content resolves to a subtree containing an `indent` node.
            // Trailing newline restores the outer column so whatever
            // follows the block (e.g. `else_clause`) lands flush-left.
            const wrapped: string[] = []
            if (flank.leading) wrapped.push(flank.leading)
            wrapped.push(slot)
            if (flank.trailing) wrapped.push(flank.trailing)

            // Override-wrapper fields (generated via `field('x')` one-arg
            // placeholder) wrap the original member. If that original is a
            // choice whose branches have their own inner fields, tree-sitter
            // at parse time assigns the MOST SPECIFIC field (inner wins).
            // Python's `import_from_statement` is the canonical case:
            // `field('wildcard_import', choice(wildcard_import, _import_list,
            // ...))` where `_import_list` expands to a commaSep1 of
            // `field('name', ...)`. At runtime `from a import b` surfaces
            // `name: b` (inner); `from a import b, c` surfaces `name: b`
            // AND `wildcard_import: [',', 'c']` (the trailing comma-list
            // attaches to the outer wrapper, the leading name to the inner
            // field); `from a import *` surfaces only `wildcard_import: *`.
            // Both slots must appear in the template so EITHER parse shape
            // renders correctly. Inner placeholders come FIRST so the
            // rendered order matches source order (inner-field position is
            // always before the outer wrapper's trailing content). The
            // render engine's resolveSlot returns `''` for absent slots,
            // so the inactive one silently disappears at render time.
            if (rule.source === 'override' && rule.content.type === 'choice') {
                const innerSeen = new Set(seen)
                const innerParts = walkRuleForTemplate(
                    rule.content, innerSeen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher,
                )
                const innerPlaceholders: string[] = []
                for (const p of innerParts) {
                    if (p.startsWith('$') && !wrapped.includes(p)) {
                        innerPlaceholders.push(p)
                        // Also mark the inner field name as seen on the
                        // outer scope so a sibling seq member doesn't emit
                        // the placeholder a second time.
                        const innerName = p.replace(/^\$+/, '').toLowerCase()
                        seen.add(innerName)
                    }
                }
                // Prepend inner placeholders — they surface the leading
                // portion of the source (e.g. the first `name` before any
                // wildcard_import separator list).
                if (innerPlaceholders.length > 0) {
                    wrapped.splice(0, 0, ...innerPlaceholders)
                }
            }

            return rule.blockBearer ? ['\n  ', ...wrapped, '\n'] : wrapped
        }

        case 'symbol': {
            // Hidden helper rules (e.g. python's `_import_list`) are
            // inlined by tree-sitter at parse time — their fields get
            // promoted onto the parent node. To render correctly we
            // mirror that by walking into the referenced rule's body
            // right here, so the hidden helper's fields appear as real
            // slots in the caller's template. Guards against recursion
            // via the rule-name seen-set key.
            const symName = (rule as { name: string }).name
            if (symName.startsWith('_') && rules) {
                const target = rules[symName]
                if (target && !seen.has(`@${symName}`)) {
                    seen.add(`@${symName}`)
                    const parts = walkRuleForTemplate(target, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher)
                    if (parts.length > 0) return parts
                }
            }
            // Visible symbols (and hidden ones we can't expand) render
            // as unconsumed named children.
            if (seen.has('children')) return []
            seen.add('children')
            return ['$$$CHILDREN']
        }

        case 'string':
            if (inRepeat) return [] // joinBy handles separators
            return [rule.value]

        case 'pattern': {
            // Extract a representative literal from the regex — delimiter
            // tokens like `[bc]?"` (rust string_literal prefix) need their
            // literal tail in the template so round-trip reparse works.
            const lit = representativeLiteral(rule.value)
            return lit ? [lit] : []
        }

        case 'enum':
            return rule.members.length > 0 ? [rule.members[0]!.value] : []

        case 'variant':
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher)

        case 'clause': {
            // Emit a separate sub-template and reference it from the main
            // template as `$NAME_CLAUSE`. Fresh seen set for clause body
            // so fields don't collide with main-template tracking.
            if (seen.has(rule.name)) return []
            seen.add(rule.name)
            const clauseSeen = new Set<string>()
            const clauseParts = walkRuleForTemplate(rule.content, clauseSeen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher)
            const clauseTemplate = clauseParts.join('')
            // Clause key mirrors the emitted var (`$NAME_CLAUSE` →
            // `name_clause`) so the renderer's clauseKey lookup matches.
            if (clauseTemplate) clauses[`${rule.name}_clause`] = clauseTemplate
            return [`$${rule.name.toUpperCase()}_CLAUSE`]
        }

        case 'group':
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher)

        case 'supertype':
            if (seen.has('children')) return []
            seen.add('children')
            return ['$$$CHILDREN']

        case 'indent':
            return ['\n  ']
        case 'dedent':
            return ['\n']
        case 'newline':
            return ['\n']

        case 'terminal':
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher)

        case 'polymorph':
            // Polymorphs are dispatched by AssembledPolymorph.renderTemplate
            // which walks each form separately. Reaching this case means a
            // PolymorphRule appears nested inside another rule's body, which
            // the classifier is supposed to prevent — treat as a bug rather
            // than silently emitting nothing.
            throw new Error(
                `walkRuleForTemplate: nested PolymorphRule should have been promoted by Link. ` +
                `forms=${rule.forms.map(f => f.name).join(',')}`,
            )

        default:
            return []
    }
}

/**
 * Peel wrappers off a rule and return its string value if the inner
 * content is a single literal. Used by the template walker's optional
 * case to detect `optional('async')`-style keyword annotations.
 */
function extractSingleKeywordString(rule: Rule): string | null {
    switch (rule.type) {
        case 'string':
            return rule.value
        case 'token':
        case 'terminal':
        case 'group':
        case 'variant':
        case 'clause':
            return extractSingleKeywordString((rule as { content: Rule }).content)
        default:
            return null
    }
}

/**
 * Lift each branch of `optional(choice(...))` into a clause keyed by
 * its field name, so flanking literals render only when the field is
 * present. Canonical case: rust `attribute = seq(_path, optional(
 * choice(seq('=', field('value')), field('arguments'))))` — default
 * walker emits `=$VALUE$ARGUMENTS`, which produces `#[name=]` for a
 * bare attribute. With the lift, each branch becomes its own clause
 * (`value_clause: "=$VALUE"`, `arguments_clause: "$ARGUMENTS"`) and
 * the template reads `$$$CHILDREN$VALUE_CLAUSE$ARGUMENTS_CLAUSE` —
 * each flank renders iff the slot is populated.
 *
 * Returns null if any branch doesn't match the single-field shape
 * (string/pattern/symbol literals, punctuation-only branches, or
 * branches with multiple named fields). Falls back to default walk.
 */
function liftChoiceBranchesToClauses(
    choice: ChoiceRule,
    clauses: Record<string, string>,
    seen?: Set<string>,
): string[] | null {
    const placeholders: string[] = []
    // Each branch: unwrap variant/clause/group/terminal layers, then
    // try to match one of:
    //   - field(name, ...) directly                       → `$NAME`
    //   - seq(literal*, field, literal*)                  → `<lit>$NAME<lit>`
    for (const member of choice.members) {
        const stripped = stripWrappers(member)
        const extracted = extractClauseBranch(stripped)
        if (extracted === null) return null
        const { fieldName, leading, trailing } = extracted
        // Don't re-lift a field that's already emitted earlier in the
        // rule (e.g. rust `tuple_expression`'s trailing
        // `optional(field('elements', ...))` after the same field
        // appeared inside a repeat earlier — the multi-valued slot
        // already captures those values; a clause would double-count).
        if (seen?.has(fieldName)) return null
        const clauseKey = `${fieldName}_clause`
        const placeholder = `$${fieldName.toUpperCase()}_CLAUSE`
        if (!(clauseKey in clauses)) {
            clauses[clauseKey] = `${leading}$${fieldName.toUpperCase()}${trailing}`
        }
        placeholders.push(placeholder)
    }
    return placeholders
}

function stripWrappers(rule: Rule): Rule {
    switch (rule.type) {
        case 'variant':
        case 'clause':
        case 'group':
        case 'terminal':
        case 'token':
            return stripWrappers(rule.content)
        default:
            return rule
    }
}

function extractClauseBranch(
    rule: Rule,
): { fieldName: string; leading: string; trailing: string } | null {
    if (rule.type === 'field') {
        return { fieldName: rule.name, leading: '', trailing: '' }
    }
    if (rule.type !== 'seq') return null
    // Walk the seq collecting at most one field plus flanking literals.
    let leading = ''
    let trailing = ''
    let fieldName: string | null = null
    for (const m of rule.members) {
        const stripped = stripWrappers(m)
        if (stripped.type === 'field') {
            if (fieldName !== null) return null // multi-field branch — too complex
            fieldName = stripped.name
            continue
        }
        if (stripped.type === 'string') {
            if (fieldName === null) leading += stripped.value
            else trailing += stripped.value
            continue
        }
        return null // other shapes bail out
    }
    if (fieldName === null) return null
    return { fieldName, leading, trailing }
}

/**
 * True if `rule` contains only string/pattern/whitespace terminals —
 * no fields, no symbols, no enum/supertype refs. Drives the
 * `optional(...)` skip heuristic in the template walker.
 */
function containsOnlyPunctuation(rule: Rule): boolean {
    switch (rule.type) {
        case 'string':
        case 'pattern':
        case 'indent':
        case 'dedent':
        case 'newline':
            return true
        case 'field':
        case 'symbol':
        case 'supertype':
        case 'enum':
            return false
        case 'seq':
        case 'choice':
            return rule.members.every(containsOnlyPunctuation)
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
            return containsOnlyPunctuation(rule.content)
        default:
            return false
    }
}

/**
 * Extract a representative literal from a regex pattern. Strips
 * character classes, quantifiers, escapes, and alternations; returns
 * whatever literal characters remain. Best-effort — grammar authors
 * with unusual tokens can add an override to supply a template.
 *
 *   `[bc]?"`   → `"`    (rust string_literal prefix+quote)
 *   `r"#*"`    → `r"`   (raw string marker — quantifier drops)
 *   `/\\d+/`    → ``     (pure regex content, no literal tail)
 *   `0[xX]`    → `0`    (literal head, class tail)
 */
function representativeLiteral(regex: string): string {
    let s = regex
    s = s.replace(/\\(.)/g, (_, c) => (/[dwWsSbBnrtfv0]/.test(c) ? '' : c))
    s = s.replace(/\[[^\]]*\][*+?]?/g, '')
    s = s.replace(/\([^)]*\)[*+?]?/g, '')
    s = s.replace(/\{\d+(,\d*)?\}/g, '')
    s = s.replace(/[.*+?|^$]/g, '')
    return s
}

/**
 * Walk a rule tree looking for the first repeat-with-separator. Used by
 * structural nodes to propagate tree-sitter's `sepBy` / `repSeq`
 * separator hints onto their joinBy slot so `$$$CHILDREN` renders
 * with the right glue.
 */
export function findRepeatSeparator(rule: Rule): string | undefined {
    switch (rule.type) {
        case 'repeat':
        case 'repeat1':
            if (rule.separator) return rule.separator
            return findRepeatSeparator(rule.content)
        case 'seq':
        case 'choice':
            for (const m of rule.members) {
                const sep = findRepeatSeparator(m)
                if (sep) return sep
            }
            return undefined
        case 'optional':
        case 'variant':
        case 'clause':
        case 'group':
        case 'field':
            return findRepeatSeparator(rule.content)
        default:
            return undefined
    }
}

/**
 * Does `rule` contain a repeat/repeat1 that declares the given flag?
 *
 * `trailing: true` marks `sepBy` shapes where the final separator is
 * optional (e.g. rust's `{ a, b, }`). `leading: true` marks the
 * mirror shape `sep, x, (sep x)*` (rust's or_pattern `| a | b`, if
 * written as a single repeat). Evaluate's `liftCommaSep` captures
 * both from their canonical seq patterns. Render reads each flag via
 * the `joinByTrailing` / `joinByLeading` template hints to know
 * whether to probe for a flanking anon-separator token when emitting
 * `$$$CHILDREN`.
 *
 * Walks the same transparent-wrapper set as `findRepeatSeparator`
 * (seq / choice / optional / variant / clause / group / field).
 */
export function findRepeatFlag(rule: Rule, flag: 'trailing' | 'leading'): boolean {
    switch (rule.type) {
        case 'repeat':
        case 'repeat1':
            if (rule[flag]) return true
            return findRepeatFlag(rule.content, flag)
        case 'seq':
        case 'choice':
            return rule.members.some(m => findRepeatFlag(m, flag))
        case 'optional':
        case 'variant':
        case 'clause':
        case 'group':
        case 'field':
            return findRepeatFlag(rule.content, flag)
        default:
            return false
    }
}

const TEMPLATE_WORD = /\w/

/**
 * Should we insert a space separator between two adjacent template
 * fragments? The decision uses the boundary chars — the last char of
 * `prev` and the first char of `next` — and asks "would these two
 * characters form a valid two-char slice of a word under the
 * grammar's `word` rule?" If yes, the adjacent tokens would merge
 * into one lexeme at parse time and we need a space.
 *
 * Placeholders (`$FOO`, `$$$CHILDREN`) count as word-like on the
 * `$`-starting side — they WILL render to user content at runtime
 * and the common case is word content. We substitute a representative
 * word character (`a`) for the placeholder when probing the word
 * pattern, so `\p{XID_Continue}`-style regexes work.
 *
 * Falls back to a generic `/\w/` heuristic when no word matcher is
 * available (grammar has no `word` rule, or the rule isn't a direct
 * pattern).
 */
function needsSpace(prev: string, next: string, wordMatcher?: RegExp): boolean {
    if (!prev || !next) return false
    const lastChar = prev[prev.length - 1]!
    const firstChar = next[0] === '$' ? 'a' : next[0]!
    if (wordMatcher) {
        return wordMatcher.test(lastChar + firstChar)
    }
    const prevIsWordLike = TEMPLATE_WORD.test(prev)
    const nextIsWordLike = TEMPLATE_WORD.test(next) || next === '$'
    return prevIsWordLike && nextIsWordLike
}
