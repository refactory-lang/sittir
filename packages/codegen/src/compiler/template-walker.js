/**
 * compiler/template-walker.ts — turn a Rule subtree into a template
 * string plus any clause sub-templates.
 *
 * Consumed by both:
 * - `compiler/node-map.ts` — `AssembledBranch.renderTemplate()` and
 *   sibling helpers call {@link renderRuleTemplate} to produce the
 *   `{ template, clauses, joinByField }` triple stored on the node model.
 * - `emitters/templates.ts` — the YAML emitter reads the same triple
 *   when serialising per-rule entries into `templates directory`.
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
import { isLinkSymbol, literalTextOf } from './rule.js';
import { isSyntheticFieldWrapper, unwrapStructuralPassthroughs } from './node-map.js';
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
function extractFlankingLiterals(content) {
    if (content.type !== 'seq' || content.members.length < 2) {
        return { leading: '', trailing: '' };
    }
    let leading = '';
    let trailing = '';
    const first = content.members[0];
    const last = content.members[content.members.length - 1];
    // A leading literal is only valid if there's at least one non-literal
    // member after it; same logic for trailing. We don't lift a literal
    // out of a single-member seq.
    const firstLiteral = first ? literalTextOf(first) : undefined;
    const lastLiteral = last ? literalTextOf(last) : undefined;
    if (firstLiteral !== undefined && content.members.length >= 2) {
        leading = firstLiteral;
    }
    if (lastLiteral !== undefined && content.members.length >= 2 && last !== first) {
        trailing = lastLiteral;
    }
    return { leading, trailing };
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
function wrappedRepeatSeparator(content) {
    switch (content.type) {
        case 'repeat':
        case 'repeat1':
            return content.separator ?? '\n';
        case 'optional':
        case 'group':
        case 'variant':
        case 'clause':
            return wrappedRepeatSeparator(content.content);
        default:
            return null;
    }
}
/**
 * True when a field's content would have tree-sitter emit MULTIPLE
 * children under the same field name at parse time. Tree-sitter's
 * field inheritance rule: a `FIELD(name, seq(A, B, C))` causes A, B,
 * AND C to all be emitted as children of the parent carrying
 * `field=name`.
 *
 * @remarks
 * Only fires for seqs (or choice branches containing seqs) with 2+
 * "structural" members — members that surface as children at runtime
 * (symbol, supertype, named alias, string literal, nested field, seq
 * of same). Pure wrappers (optional / variant / clause / group / token
 * / terminal) are unwrapped. Anonymous tokens (plain string literals
 * inside a seq) count toward the structural-member tally because
 * they also inherit the field name from tree-sitter's perspective —
 * the ambient_declaration `module.exports:` shape has `module`, `.`,
 * `property_identifier`, `:`, `object_type` all under
 * `field=declaration`.
 *
 * When the field carries a multi-sibling seq, the walker must emit
 * `$$$NAME` (multi-slot) instead of `$NAME` so the renderer joins
 * the array instead of picking item[0] and silently dropping the
 * rest.
 */
function fieldContentIsMultiSibling(content) {
    // Unwrap structural passthroughs that don't themselves contribute
    // sibling positions.
    const core = unwrapStructuralPassthroughs(content);
    if (core.type === 'choice') {
        return core.members.some((m) => fieldContentIsMultiSibling(m));
    }
    if (core.type !== 'seq')
        return false;
    // Count NAMED structural members — anything tree-sitter would emit
    // as a content child. String literals and pattern terminals are
    // flanking punctuation (`label + ':'`), not independent sibling
    // values — they belong inside the field as `extractFlankingLiterals`
    // handles separately. Only count members that produce a
    // distinct child reference at runtime.
    let count = 0;
    for (const m of core.members) {
        let unwrapped = m;
        while (unwrapped.type === 'optional' ||
            unwrapped.type === 'variant' ||
            unwrapped.type === 'clause' ||
            unwrapped.type === 'group' ||
            unwrapped.type === 'token' ||
            unwrapped.type === 'terminal') {
            unwrapped = unwrapped.content;
        }
        switch (unwrapped.type) {
            case 'symbol':
                if (isLinkSymbol(unwrapped))
                    break;
                count++;
                if (count >= 2)
                    return true;
                break;
            case 'supertype':
            case 'alias':
            case 'field':
            case 'repeat':
            case 'repeat1':
                count++;
                if (count >= 2)
                    return true;
                break;
            default:
                break;
        }
    }
    return false;
}
export function renderRuleTemplate(rule, inRepeat = false, rules, wordMatcher, optionalFields) {
    const clauses = {};
    const joinByField = {};
    // Pre-compute field names that appear in any `repeat` subtree so
    // the walker can emit `$$$NAME` even for the *first* occurrence of a
    // repeated field — the commaSep1 pattern `seq(field(X), repeat(seq(',',
    // field(X))))` has X at non-repeat position first, then at repeat
    // position, but both should render as the same multi-valued slot.
    const repeatedFields = new Set();
    collectRepeatedFields(rule, false, repeatedFields, rules, new Set());
    const parts = walkRuleForTemplate(rule, new Set(), inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher, optionalFields);
    const template = parts.join('');
    const slots = deriveWalkSlots(template);
    return {
        template,
        clauses,
        joinByField,
        usesChildren: template.includes('$$$CHILDREN'),
        slots
    };
}
export function deriveWalkSlots(template) {
    const guarded = new Set();
    for (const match of template.matchAll(/\{%\s*if\s+([a-z0-9_]+)\s*\|\s*(?:isPresent|is_present)\s*%\}/g)) {
        const name = match[1];
        if (name)
            guarded.add(name);
    }
    const byName = new Map();
    for (const match of template.matchAll(/(\$\$\$|\$)([A-Z][A-Z0-9_]*)/g)) {
        const sigil = match[1];
        const raw = match[2];
        if (!sigil || !raw)
            continue;
        const name = raw.toLowerCase();
        if (name === 'children' || name === 'text')
            continue;
        const nextView = sigil === '$$$' ? 'list' : 'scalar';
        const prev = byName.get(name);
        const view = prev == null || prev.view === nextView ? nextView : 'field';
        byName.set(name, {
            name,
            view,
            guarded: guarded.has(name)
        });
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
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
function containsRepeat(rule, rules, visiting) {
    switch (rule.type) {
        case 'repeat':
        case 'repeat1':
            return true;
        case 'seq':
        case 'choice':
            return rule.members.some((m) => containsRepeat(m, rules, visiting));
        case 'optional':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'alias':
        case 'terminal':
            return containsRepeat(rule.content, rules, visiting);
        case 'symbol': {
            const name = rule.name;
            if (!name.startsWith('_') || !rules || visiting.has(name))
                return false;
            const target = rules[name];
            if (!target)
                return false;
            visiting.add(name);
            const r = containsRepeat(target, rules, visiting);
            visiting.delete(name);
            return r;
        }
        case 'polymorph':
            return rule.forms.some((f) => containsRepeat(f.content, rules, visiting));
        default:
            return false;
    }
}
function collectRepeatedFields(rule, inRepeat, out, rules, visiting) {
    switch (rule.type) {
        case 'seq':
        case 'choice':
            for (const m of rule.members)
                collectRepeatedFields(m, inRepeat, out, rules, visiting);
            return;
        case 'repeat':
        case 'repeat1':
            collectRepeatedFields(rule.content, true, out, rules, visiting);
            return;
        case 'optional':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'alias':
        case 'terminal':
            collectRepeatedFields(rule.content, inRepeat, out, rules, visiting);
            return;
        case 'field':
            // A field is repeated if it sits inside a repeat (its content
            // will be emitted multiple times at runtime) OR if its content
            // is itself a repeat — e.g. rust's `field('elements',
            // choice(semi, repeat(_expression, sep=',')))`. The latter
            // shape produces a multi-valued field whose values live under
            // the same fieldNameForChild across siblings; without the
            // `$$$` marker the template emits only the first occurrence.
            if (inRepeat || containsRepeat(rule.content, rules, new Set()))
                out.add(rule.name);
            collectRepeatedFields(rule.content, inRepeat, out, rules, visiting);
            return;
        case 'symbol': {
            // Follow hidden symbols once — their content will be inlined
            // during template emission, so any repeated fields inside
            // must be counted at the caller site as well.
            const name = rule.name;
            if (!name.startsWith('_') || !rules || visiting.has(name))
                return;
            const target = rules[name];
            if (!target)
                return;
            visiting.add(name);
            collectRepeatedFields(target, inRepeat, out, rules, visiting);
            visiting.delete(name);
            return;
        }
        case 'polymorph':
            for (const form of rule.forms) {
                collectRepeatedFields(form.content, inRepeat, out, rules, visiting);
            }
            return;
        default:
            return;
    }
}
function walkRuleForTemplate(rule, seen, inRepeat, _clauses, rules, repeatedFields, joinByField, wordMatcher, _optionalFields) {
    const clauses = _clauses;
    const optionalFields = _optionalFields;
    const emitChildren = () => optionalFields?.has('children')
        ? emitJinjaConditional('children', '$$$CHILDREN')
        : '$$$CHILDREN';
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
            const unwrapField = (r) => {
                if (r.type === 'field')
                    return r.name;
                if (r.type === 'optional' || r.type === 'variant' || r.type === 'clause' || r.type === 'group')
                    return unwrapField(r.content);
                return null;
            };
            const unwrapChildTarget = (r) => {
                if (r.type === 'symbol')
                    return r.source === 'link' ? null : r.name;
                if (r.type === 'supertype')
                    return r.name;
                if (r.type === 'optional' || r.type === 'variant' || r.type === 'clause' || r.type === 'group')
                    return unwrapChildTarget(r.content);
                return null;
            };
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
            const elementWithSep = (r) => {
                let inner = r;
                if (inner.type === 'repeat' || inner.type === 'repeat1')
                    inner = inner.content;
                if (inner.type !== 'seq' || inner.members.length !== 2)
                    return null;
                const fname = unwrapField(inner.members[0]);
                const sepMember = inner.members[1];
                const sep = literalTextOf(sepMember);
                if (!fname || sep === undefined)
                    return null;
                return { name: fname, sep };
            };
            const fieldCounts = new Map();
            const fieldSeps = new Map();
            const childTargetCounts = new Map();
            for (const m of rule.members) {
                const fn = unwrapField(m);
                if (fn) {
                    fieldCounts.set(fn, (fieldCounts.get(fn) ?? 0) + 1);
                    continue;
                }
                const elemSep = elementWithSep(m);
                if (elemSep) {
                    fieldCounts.set(elemSep.name, (fieldCounts.get(elemSep.name) ?? 0) + 1);
                    if (!fieldSeps.has(elemSep.name))
                        fieldSeps.set(elemSep.name, elemSep.sep);
                    continue;
                }
                const tgt = unwrapChildTarget(m);
                if (tgt)
                    childTargetCounts.set(tgt, (childTargetCounts.get(tgt) ?? 0) + 1);
            }
            // Sibling-duplicate symbol references with the SAME target
            // (e.g. rust or_pattern: two `_pattern` refs separated by
            // `|`) share the single `children` slot. Capture the literal
            // between them as the children-slot joinBy so the renderer
            // uses it instead of emitting a trailing separator.
            const hasChildDup = [...childTargetCounts.values()].some((c) => c > 1);
            if (hasChildDup && joinByField && !('children' in joinByField)) {
                let seenFirst = false;
                for (const m of rule.members) {
                    const tgt = unwrapChildTarget(m);
                    if (tgt && (childTargetCounts.get(tgt) ?? 0) > 1) {
                        if (!seenFirst) {
                            seenFirst = true;
                            continue;
                        }
                        break;
                    }
                    const literal = literalTextOf(m);
                    if (seenFirst && literal !== undefined) {
                        joinByField['children'] = literal;
                        break;
                    }
                }
            }
            // String-template detection. When the seq is
            // wrapped in matching string-quote delimiters (`` ` ``, `"`,
            // `'`) and the body is a separator-less repeat over visible
            // children (e.g. `seq("`", repeat(choice(string_fragment,
            // template_type)), "`")`), the children represent
            // concatenated text fragments — joining with the default
            // `' '` separator inserts a stray space between adjacent
            // substitutions (`${B}${C}` → `${B} ${C}`). Pin the children
            // join to `""` so the template re-renders byte-exactly.
            // Restricted to genuine string-quote delimiters so block-
            // shaped seq's (`{`, `}`, `[`, `]`, `(`, `)`) keep the
            // statement-separating space.
            if (joinByField && !('children' in joinByField) && rule.members.length >= 3) {
                const first = rule.members[0];
                const last = rule.members[rule.members.length - 1];
                const firstLiteral = literalTextOf(first);
                const lastLiteral = literalTextOf(last);
                if (firstLiteral !== undefined &&
                    lastLiteral !== undefined &&
                    firstLiteral === lastLiteral &&
                    /^[`"']$/.test(firstLiteral)) {
                    joinByField['children'] = '';
                }
            }
            let augmentedRepeatedFields = repeatedFields;
            for (const [fname, cnt] of fieldCounts) {
                if (cnt <= 1)
                    continue;
                if (!augmentedRepeatedFields)
                    augmentedRepeatedFields = new Set();
                const set = augmentedRepeatedFields;
                if (!set.has(fname))
                    set.add(fname);
                if (joinByField && !(fname in joinByField)) {
                    // Prefer the separator captured from an
                    // `elementWithSep` sub-pattern (e.g. the `,` inside
                    // `seq(field('X'), ',')`). Falls back to finding the
                    // first non-field string between occurrences.
                    const capturedSep = fieldSeps.get(fname);
                    if (capturedSep != null) {
                        joinByField[fname] = capturedSep;
                    }
                    else {
                        let seenFirst = false;
                        for (const m of rule.members) {
                            const mField = unwrapField(m);
                            const isThisField = mField === fname;
                            if (isThisField && !seenFirst) {
                                seenFirst = true;
                                continue;
                            }
                            const literal = literalTextOf(m);
                            if (seenFirst && literal !== undefined) {
                                joinByField[fname] = literal;
                                break;
                            }
                            if (isThisField && seenFirst)
                                break;
                        }
                    }
                }
            }
            // Skip separator strings that match a sibling-multi field's
            // captured joinBy — those belong INSIDE the `$$$NAME` slot
            // rendering, not as standalone template text.
            const skipSeps = new Set();
            if (joinByField) {
                for (const [fname, cnt] of fieldCounts) {
                    if (cnt > 1 && joinByField[fname])
                        skipSeps.add(joinByField[fname]);
                }
                if (hasChildDup && joinByField['children'])
                    skipSeps.add(joinByField['children']);
            }
            // For members matching the `seq(field('X'), SEP)` sub-pattern
            // where X was counted as sibling-multi above, substitute the
            // sub-seq with just the field. The SEP is now captured as
            // joinByField[X] so render emits it via $$$X's join-logic;
            // walking the full sub-seq would re-emit the SEP as a literal.
            const substituteMember = (m) => {
                const es = elementWithSep(m);
                if (!es)
                    return m;
                const cnt = fieldCounts.get(es.name) ?? 0;
                if (cnt <= 1)
                    return m;
                // Peel repeat wrapper if present, then extract the field.
                let inner = m;
                if (inner.type === 'repeat' || inner.type === 'repeat1')
                    inner = inner.content;
                if (inner.type === 'seq' && inner.members.length === 2)
                    return inner.members[0];
                return m;
            };
            const out = [];
            for (const m of rule.members) {
                const literal = literalTextOf(m);
                if (literal !== undefined && skipSeps.has(literal))
                    continue;
                const substituted = substituteMember(m);
                const parts = walkRuleForTemplate(substituted, seen, inRepeat, clauses, rules, augmentedRepeatedFields, joinByField, wordMatcher, optionalFields);
                // Drop a leading literal from `parts` that duplicates the
                // trailing literal already in `out`. This collapses cases
                // like rust line_comment where an outer `'//'` token is
                // followed by a choice whose primary branch emits another
                // `'//'` (from a pattern lookahead disambiguator), producing
                // `////` in the template. Only applied to non-placeholder
                // literals — `$NAME`/`$$$CHILDREN` slots are distinct.
                while (parts.length > 0 && out.length > 0) {
                    const head = parts[0];
                    const tail = out[out.length - 1];
                    if (!head.startsWith('$') && head === tail) {
                        parts.shift();
                        continue;
                    }
                    break;
                }
                if (out.length > 0 && parts.length > 0) {
                    // When the adjacent placeholder is a clause whose body is
                    // a bare non-word-punctuation literal, use the underlying
                    // literal for spacing rather than the placeholder's own
                    // identifier characters.
                    //
                    // The walker now emits
                    // Jinja-inline conditionals (`{% if x | isPresent %}…{% endif %}`)
                    // directly for synthesized optional emissions, so a
                    // part can begin/end with `{%`. For spacing decisions
                    // we look INTO the conditional body's edge text — the
                    // body governs the rendered output when the conditional
                    // fires, and `needsSpace` operates on rendered chars.
                    const lastChar = effectiveSpacingChar(out[out.length - 1], 'last');
                    const firstChar = effectiveSpacingCharForRule(substituted, parts[0], 'first', rules);
                    if (needsSpace(lastChar, firstChar, wordMatcher)) {
                        // For Jinja-inline optional fragments, route the
                        // leading separator INSIDE the conditional body so
                        // the separator disappears alongside an absent
                        // value. Required emissions and anonymous tokens
                        // keep the unconditional push.
                        const moved = absorbLeadingSeparatorIntoJinjaConditional(parts, ' ');
                        if (!moved) {
                            // Conversely, when the tail
                            // of out is a Jinja conditional, route the
                            // separator INSIDE that conditional's body
                            // (so it vanishes alongside an absent optional)
                            // — but ONLY when the part before the
                            // conditional doesn't itself need a separator
                            // against the upcoming required content.
                            // Otherwise dropping the unconditional space
                            // yields collisions like `letx` (rust
                            // let_declaration: `let` + optional mutable +
                            // required pattern). Safe absorption case:
                            // member_expression `.` + optional optional_chain
                            // + required property, since `.` and identifier
                            // already concatenate cleanly.
                            const tailIsConditional = out.length > 0 && JINJA_CONDITIONAL_FULL.test(out[out.length - 1]);
                            let absorbed = false;
                            if (tailIsConditional && out.length >= 2) {
                                const beforeLast = effectiveSpacingChar(out[out.length - 2], 'last');
                                if (!needsSpace(beforeLast, firstChar, wordMatcher)) {
                                    absorbed = absorbTrailingSeparatorIntoJinjaConditional(out, ' ');
                                }
                            }
                            if (!absorbed)
                                out.push(' ');
                        }
                    }
                }
                out.push(...parts);
            }
            absorbHeadLeadingSeparatorIntoConditionals(out);
            return out;
        }
        case 'choice': {
            // Walk every non-empty branch with a FRESH seen so each
            // branch's parts are independent of declaration order.
            //
            // Homogeneity rule: branches may differ in their
            // $-placeholders (those are just "slot that may or may
            // not be populated by this arm") but must agree on their
            // LITERALS — any non-placeholder text. When literals
            // diverge, the walker can't compose a single template:
            // which arm's literals are authoritative? Authors must
            // declare intent via `variant()` adoption so each arm
            // becomes its own kind with its own template.
            //
            // Homogeneous examples (merge all $-placeholders into
            // primary):
            //   - choice(sym1, sym2, sym3) → each branch emits
            //     $$$CHILDREN; single template.
            //   - choice(field('async', …), field('const', …)) →
            //     both emit field placeholders only; combine into
            //     `$ASYNC$CONST` so either arm renders correctly
            //     (absent field → empty string).
            //
            // Heterogeneous examples (throw — author must variant()):
            //   - choice(seq(expr, ';'), expr) → branch 0 has
            //     literal ';', branch 1 doesn't. Single template
            //     can't both include and exclude ';'.
            //   - choice(seq('"', …, '"'), seq("'", …, "'")) →
            //     different delimiters.
            //   - choice(seq('if', cond), seq('while', body)) →
            //     different keywords AND different fields.
            const branchResults = [];
            for (let i = 0; i < rule.members.length; i++) {
                const branchSeen = new Set(seen);
                const parts = walkRuleForTemplate(rule.members[i], branchSeen, inRepeat, {}, rules, repeatedFields, {}, wordMatcher, optionalFields);
                if (parts.length === 0)
                    continue;
                branchResults.push({ parts, index: i });
            }
            if (branchResults.length === 0)
                return [];
            // Compute each branch's "literal signature" — parts with
            // $-placeholders removed, concatenated and whitespace-
            // normalised. Branches with identical signatures can be
            // merged (different $ coverage is fine).
            const literalSig = (parts) => parts
                .filter((p) => !p.startsWith('$'))
                .join('')
                .replace(/\s+/g, ' ')
                .trim();
            const firstSig = literalSig(branchResults[0].parts);
            const allSameLiterals = branchResults.every((b) => literalSig(b.parts) === firstSig);
            if (!allSameLiterals) {
                // Heterogeneous literals: walker can't produce a single
                // lossless template. Ideal fix is `variant('name')`
                // adoption on each arm in overrides.ts (each becomes
                // its own kind with its own template). Until then,
                // fall back to the old first-non-empty-branch heuristic
                // and surface a diagnostic via SITTIR_DEBUG so authors
                // can see which kinds need adoption.
                if (process.env.SITTIR_DEBUG === '1') {
                    const branchSummaries = branchResults
                        .map((b) => `  [${b.index}] ${JSON.stringify(b.parts.join(''))}`)
                        .join('\n');
                    console.error(`[sittir] walker: heterogeneous choice branches — picking first, ` +
                        `dropping literals from others. Consider \`variant('name')\` ` +
                        `adoption per arm. Branches:\n${branchSummaries}`);
                }
                // Fall through to the primary-branch pick below.
            }
            // Homogeneous literals. Replay the first non-empty branch
            // against the OUTER seen (consumption / clauses / joinByField
            // reach the caller). Append $-placeholders from other
            // branches that the primary didn't already produce.
            const primaryIdx = branchResults[0].index;
            const out = [
                ...walkRuleForTemplate(rule.members[primaryIdx], seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher, optionalFields)
            ];
            // Placeholders coming from non-primary
            // branches in a heterogeneous-literal choice are conditional
            // on those branches firing at parse time. Wrap each `$NAME`
            // placeholder in a Jinja `{% if name | isPresent %}…{% endif %}`
            // so it emits only when the field is actually populated.
            // Without the wrap, the placeholder renders empty but the
            // surrounding spaces remain (member_expression's
            // `{{ object }}.{{ optional_chain }} {{ property }}` →
            // `super. decorate` when optional_chain is absent).
            const placeholderField = (p) => {
                const m = p.match(/^\$([A-Z][A-Z0-9_]*)$/);
                return m ? m[1].toLowerCase() : null;
            };
            for (let k = 1; k < branchResults.length; k++) {
                const parts = walkRuleForTemplate(rule.members[branchResults[k].index], seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher, optionalFields);
                for (const p of parts) {
                    if (!p.startsWith('$') || out.includes(p))
                        continue;
                    const fname = placeholderField(p);
                    if (fname && !['newline', 'indent', 'dedent', 'text'].includes(fname)) {
                        out.push(emitJinjaConditional(fname, p));
                    }
                    else {
                        out.push(p);
                    }
                }
            }
            return out;
        }
        case 'optional': {
            // Emit Jinja inline directly for every synthesized optional
            // case. No `clauses` map writes,
            // no `$NAME_CLAUSE` placeholder indirection — the walker
            // produces the final `{% if X | isPresent %}body{% endif %}`
            // wrapper here so downstream `inlineJinjaClauses` only
            // touches real grammar-clause emissions.
            //
            // Optional of a single keyword-shape literal (`async`,
            // `move`, `pub`, `static`, `unsafe`, …): the renderer's
            // children-by-kind-name fallback fires when readNode
            // captured an anonymous child with that text, so the
            // keyword name (lowercased) is the conditional predicate.
            //
            // The word matcher is the grammar's own `word` rule.
            // Grammars without a word rule fall back to `/^\w+$/`.
            const kwString = extractSingleKeywordString(rule.content);
            if (kwString !== null) {
                const matches = wordMatcher ? wordMatcher.test(kwString) : /^\w+$/.test(kwString);
                if (matches) {
                    return [emitJinjaConditional(kwString, `$${kwString.toUpperCase()}`)];
                }
                // Non-word punctuation in a standalone optional (e.g.
                // rust `impl_item` trait negation `!`, `?` modifiers).
                // The renderer can't predicate a Jinja conditional on
                // the literal text — `node.$fields` IS keyed by the
                // literal text, but Jinja identifiers can't include
                // `!`/`?`/etc. Emit nothing here so the existing
                // `$$$CHILDREN` slot (or the parent's text-shape
                // fallback) round-trips the token. Matches the prior
                // synthesized-`<punctName>_clause` runtime behaviour
                // where the conditional always evaluated false because
                // the predicate name was unbound. Standalone optional-
                // punct round-trip is a known gap (see specs/016
                // walker plan).
                return [];
            }
            // `optional(',')` and friends — pure punctuation in an optional
            // wrapper is context-dependent and including it unconditionally
            // produces invalid output (python: `match X,:`). Skip the
            // whole optional when its content has no field/symbol ref.
            if (containsOnlyPunctuation(rule.content))
                return [];
            // Lift `optional(...)` contents that match one of these
            // shapes into per-field Jinja conditionals. The flanking
            // literals move INSIDE the conditional body so they render
            // only when the field is populated:
            //   * `optional(choice(seq(literal, field), field, ...))`
            //     rust `attribute` — `=value` vs bare `#[name]`.
            //   * `optional(seq(literal, field))` — e.g. javascript
            //     `_initializer` inlined into `variable_declarator`:
            //     `seq('=', field('value', ...))`.
            //   * `optional(field)` — emit `{% if name | isPresent %}$NAME{% endif %}`.
            const toLift = rule.content.type === 'choice' ? rule.content : { type: 'choice', members: [rule.content] };
            const lifted = liftChoiceBranchesToInlineJinja(toLift, seen);
            if (lifted !== null) {
                // Mark the lifted fields as seen so sibling members
                // inside the enclosing seq don't re-emit the same slot
                // via the default walker path.
                for (const fname of lifted.fieldsConsumed)
                    seen.add(fname);
                return lifted.parts;
            }
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher, optionalFields);
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
                const peel = (r) => {
                    if (r.type === 'field')
                        return r.name;
                    if (r.type === 'optional' || r.type === 'variant' || r.type === 'clause' || r.type === 'group')
                        return peel(r.content);
                    return null;
                };
                const fname = peel(rule.content);
                if (fname && !(fname in joinByField))
                    joinByField[fname] = rule.separator;
            }
            return walkRuleForTemplate(rule.content, seen, true, clauses, rules, repeatedFields, joinByField, wordMatcher, optionalFields);
        }
        case 'field': {
            if (seen.has(rule.name))
                return [];
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
                return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher, optionalFields);
            }
            seen.add(rule.name);
            const varName = rule.name.toUpperCase();
            // A field is multi-valued in four situations:
            //   1. it's nested inside a repeat (`inRepeat`)
            //   2. another occurrence of the same field name appears inside a
            //      repeat — the commaSep1 pattern `field(X) ... repeat(field(X))`
            //      where the first slot is non-repeat (caught by repeatedFields)
            //   3. its OWN content is a repeat — the override pattern
            //      `field('rest', repeat(expr, separator=','))` where the field
            //      sits at non-repeat position but wraps a repeat directly
            //   4. its content is a seq with multiple structural members (or
            //      choice containing such a seq). Tree-sitter inherits the
            //      field name to every child in the seq, producing one array
            //      of children under the same field name at parse time.
            //      Example: typescript `ambient_declaration` has
            //      `field('declaration', choice(symbol, seq('global', sym),
            //      seq('module', property_identifier, ':', type)))` — the
            //      third branch emits 4 children all under field=declaration.
            const wrappedSep = wrappedRepeatSeparator(rule.content);
            const multi = inRepeat ||
                (repeatedFields?.has(rule.name) ?? false) ||
                wrappedSep !== null ||
                fieldContentIsMultiSibling(rule.content);
            // Capture per-slot joinBy when the wrapped repeat carries a
            // separator. A single rule with multiple multi-valued fields
            // can then have distinct separators (rust tuple_expression's
            // attributes joins with `\n`, rest with `,`).
            if (joinByField && wrappedSep)
                joinByField[rule.name] = wrappedSep;
            const slot = multi ? `$$$${varName}` : `$${varName}`;
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
                const inner = rule.content.content;
                const optFlank = extractFlankingLiterals(inner);
                if (optFlank.leading || optFlank.trailing) {
                    // Emit Jinja inline directly — no synthesized
                    // `<field>_clause` companion. The
                    // flanking literals belong INSIDE the conditional so
                    // they only render when the field is populated.
                    const body = `${optFlank.leading}${slot}${optFlank.trailing}`;
                    const conditional = emitJinjaConditional(rule.name, body);
                    return rule.blockBearer ? ['\n  ', conditional, '\n'] : [conditional];
                }
            }
            const flank = extractFlankingLiterals(rule.content);
            // Block-bearer fields render as an indented block (python
            // `class X:\n  body`). Link annotates the field when its
            // content resolves to a subtree containing an `indent` node.
            // Trailing newline restores the outer column so whatever
            // follows the block (e.g. `else_clause`) lands flush-left.
            const wrapped = [];
            if (flank.leading)
                wrapped.push(flank.leading);
            wrapped.push(slot);
            if (flank.trailing)
                wrapped.push(flank.trailing);
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
                const innerSeen = new Set(seen);
                const innerParts = walkRuleForTemplate(rule.content, innerSeen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher, optionalFields);
                const innerPlaceholders = [];
                for (const p of innerParts) {
                    if (p.startsWith('$') && !wrapped.includes(p)) {
                        innerPlaceholders.push(p);
                        // Also mark the inner field name as seen on the
                        // outer scope so a sibling seq member doesn't emit
                        // the placeholder a second time.
                        const innerName = p.replace(/^\$+/, '').toLowerCase();
                        seen.add(innerName);
                    }
                }
                // Prepend inner placeholders — they surface the leading
                // portion of the source (e.g. the first `name` before any
                // wildcard_import separator list).
                if (innerPlaceholders.length > 0) {
                    wrapped.splice(0, 0, ...innerPlaceholders);
                }
            }
            if (optionalFields?.has(rule.name)) {
                const body = rule.blockBearer
                    ? `\n  ${wrapped.join('')}\n`
                    : wrapped.join('');
                return [emitJinjaConditional(rule.name, body)];
            }
            return rule.blockBearer ? ['\n  ', ...wrapped, '\n'] : wrapped;
        }
        case 'symbol': {
            if (isLinkSymbol(rule)) {
                return rule.literal !== undefined ? [rule.literal] : [];
            }
            // Hidden helper rules (e.g. python's `_import_list`) are
            // inlined by tree-sitter at parse time — their fields get
            // promoted onto the parent node. To render correctly we
            // mirror that by walking into the referenced rule's body
            // right here, so the hidden helper's fields appear as real
            // slots in the caller's template. Guards against recursion
            // via the rule-name seen-set key.
            const symName = rule.name;
            if (symName.startsWith('_') && rules) {
                const target = rules[symName];
                if (target && !seen.has(`@${symName}`)) {
                    seen.add(`@${symName}`);
                    const parts = walkRuleForTemplate(target, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher, optionalFields);
                    if (parts.length > 0)
                        return parts;
                }
            }
            // Visible symbols (and hidden ones we can't expand) render
            // as unconsumed named children.
            if (seen.has('children'))
                return [];
            seen.add('children');
            return [emitChildren()];
        }
        case 'string':
            if (inRepeat)
                return []; // joinBy handles separators
            return [rule.value];
        case 'pattern': {
            // Extract a representative literal from the regex — delimiter
            // tokens like `[bc]?"` (rust string_literal prefix) need their
            // literal tail in the template so round-trip reparse works.
            const lit = representativeLiteral(rule.value);
            return lit ? [lit] : [];
        }
        case 'enum':
            return rule.members.length > 0 ? [rule.members[0].value] : [];
        case 'variant':
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher, optionalFields);
        case 'clause': {
            // Emit Jinja-inline directly using
            // the clause's name as the conditional predicate and its
            // content's walked output as the body. The `clause(name, ...)`
            // node was minted by Link's `detectClause` from a flanking-
            // literal-around-a-field pattern, so `name` IS the field
            // name to gate on — no synthesized companion variable, no
            // intermediate `clauses` map entry, output goes straight
            // into the template body.
            if (seen.has(rule.name))
                return [];
            seen.add(rule.name);
            // Fresh seen set for the body walk so the inner field is
            // free to emit (the outer `seen.add(rule.name)` above is
            // tracking the clause name, not the inner field's slot
            // emission state). Pass `undefined` for optionalFields so
            // fields walked inside this conditional don't get re-
            // promoted into their own per-field conditionals — the
            // enclosing conditional already provides the gate, and
            // the inner field shares its name with the clause in the
            // canonical `clause('alternative', seq('else', field(
            // 'alternative', ...)))` shape, which would collide.
            const bodySeen = new Set();
            const bodyParts = walkRuleForTemplate(rule.content, bodySeen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher, undefined);
            const body = bodyParts.join('');
            if (!body)
                return [];
            return [emitJinjaConditional(rule.name, body)];
        }
        case 'group':
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher, optionalFields);
        case 'supertype':
            if (seen.has('children'))
                return [];
            seen.add('children');
            return [emitChildren()];
        case 'alias':
            // Named aliases (`alias($._hidden, $.visible)`) create a
            // visible parse-tree kind at parse time — surface them as
            // named children like symbol/supertype so variant()-adopted
            // inner choices (e.g. `visibility_modifier`'s
            // `pub_self/pub_super/pub_crate/pub_in_path`) render via
            // `$$$CHILDREN`. Unnamed aliases (`alias($.x, 'display')`)
            // just relabel existing content — walk into it.
            if (rule.named) {
                if (seen.has('children'))
                    return [];
                seen.add('children');
                return [emitChildren()];
            }
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher, optionalFields);
        case 'indent':
            return ['\n  '];
        case 'dedent':
            return ['\n'];
        case 'newline':
            return ['\n'];
        case 'terminal':
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField, wordMatcher, optionalFields);
        case 'polymorph':
            // Polymorphs are dispatched by AssembledPolymorph.renderTemplate
            // which walks each form separately. Reaching this case means a
            // PolymorphRule appears nested inside another rule's body, which
            // the classifier is supposed to prevent — treat as a bug rather
            // than silently emitting nothing.
            throw new Error(`walkRuleForTemplate: nested PolymorphRule should have been promoted by Link. ` +
                `forms=${rule.forms.map((f) => f.name).join(',')}`);
        default:
            return [];
    }
}
/**
 * Peel wrappers off a rule and return its string value if the inner
 * content is a single literal. Used by the template walker's optional
 * case to detect `optional('async')`-style keyword annotations.
 */
function extractSingleKeywordString(rule) {
    switch (rule.type) {
        case 'string':
            return rule.value;
        case 'symbol':
            return isLinkSymbol(rule) ? rule.literal ?? null : null;
        case 'token':
        case 'terminal':
        case 'group':
        case 'variant':
        case 'clause':
            return extractSingleKeywordString(rule.content);
        default:
            return null;
    }
}
/**
 * Lift each branch of `optional(choice(...))` into an inline Jinja
 * conditional keyed by the branch's field name, so flanking literals
 * render only when the field is present.
 *
 * Canonical case: rust `attribute = seq(_path, optional(choice(
 * seq('=', field('value')), field('arguments'))))`. With the lift,
 * each branch becomes its own conditional:
 *   `{% if value | isPresent %}=$VALUE{% endif %}{% if arguments | isPresent %}$ARGUMENTS{% endif %}`.
 *
 * Returns null if any branch doesn't match the single-field shape
 * (string/pattern/symbol literals, punctuation-only branches, or
 * branches with multiple named fields). Falls back to default walk.
 *
 * Replaces the older `liftChoiceBranchesToClauses`
 * — emits Jinja inline so no synthesized `<field>_clause` companion
 * variable enters the template. The body's `$NAME` placeholder gets
 * translated to `{{ name }}` by the downstream `translateToJinja`
 * pass.
 */
function liftChoiceBranchesToInlineJinja(choice, seen) {
    const parts = [];
    const fieldsConsumed = [];
    for (const member of choice.members) {
        const stripped = stripWrappers(member);
        const extracted = extractClauseBranch(stripped);
        if (extracted === null)
            return null;
        const { fieldName, leading, trailing } = extracted;
        // Don't re-lift a field that's already emitted earlier in the
        // rule (e.g. rust `tuple_expression`'s trailing
        // `optional(field('elements', ...))` after the same field
        // appeared inside a repeat earlier — the multi-valued slot
        // already captures those values; a conditional would
        // double-count).
        if (seen?.has(fieldName))
            return null;
        const body = `${leading}$${fieldName.toUpperCase()}${trailing}`;
        parts.push(emitJinjaConditional(fieldName, body));
        fieldsConsumed.push(fieldName);
    }
    return { parts, fieldsConsumed };
}
function stripWrappers(rule) {
    switch (rule.type) {
        case 'variant':
        case 'clause':
        case 'group':
        case 'terminal':
        case 'token':
            return stripWrappers(rule.content);
        default:
            return rule;
    }
}
function extractClauseBranch(rule) {
    if (rule.type === 'field') {
        return { fieldName: rule.name, leading: '', trailing: '' };
    }
    if (rule.type !== 'seq')
        return null;
    // Walk the seq collecting at most one field plus flanking literals.
    let leading = '';
    let trailing = '';
    let fieldName = null;
    for (const m of rule.members) {
        const stripped = stripWrappers(m);
        if (stripped.type === 'field') {
            if (fieldName !== null)
                return null; // multi-field branch — too complex
            fieldName = stripped.name;
            continue;
        }
        const literal = literalTextOf(stripped);
        if (literal !== undefined) {
            if (fieldName === null)
                leading += literal;
            else
                trailing += literal;
            continue;
        }
        return null; // other shapes bail out
    }
    if (fieldName === null)
        return null;
    return { fieldName, leading, trailing };
}
/**
 * True if `rule` contains only string/pattern/whitespace terminals —
 * no fields, no symbols, no enum/supertype refs. Drives the
 * `optional(...)` skip heuristic in the template walker.
 */
function containsOnlyPunctuation(rule) {
    switch (rule.type) {
        case 'string':
        case 'pattern':
        case 'indent':
        case 'dedent':
        case 'newline':
            return true;
        case 'symbol':
            return isLinkSymbol(rule);
        case 'field':
        case 'supertype':
        case 'enum':
            return false;
        case 'seq':
        case 'choice':
            return rule.members.every(containsOnlyPunctuation);
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
            return containsOnlyPunctuation(rule.content);
        default:
            return false;
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
function representativeLiteral(regex) {
    let s = regex;
    s = s.replace(/\\(.)/g, (_, c) => (/[dwWsSbBnrtfv0]/.test(c) ? '' : c));
    s = s.replace(/\[[^\]]*\][*+?]?/g, '');
    s = s.replace(/\([^)]*\)[*+?]?/g, '');
    s = s.replace(/\{\d+(,\d*)?\}/g, '');
    s = s.replace(/[.*+?|^$]/g, '');
    return s;
}
/**
 * Walk a rule tree looking for the first repeat-with-separator. Used by
 * structural nodes to propagate tree-sitter's `sepBy` / `repSeq`
 * separator hints onto their joinBy slot so `$$$CHILDREN` renders
 * with the right glue.
 */
export function findRepeatSeparator(rule) {
    switch (rule.type) {
        case 'repeat':
        case 'repeat1':
            if (rule.separator)
                return rule.separator;
            return findRepeatSeparator(rule.content);
        case 'seq':
        case 'choice':
            for (const m of rule.members) {
                const sep = findRepeatSeparator(m);
                if (sep)
                    return sep;
            }
            return undefined;
        case 'optional':
        case 'variant':
        case 'clause':
        case 'group':
        case 'field':
            return findRepeatSeparator(rule.content);
        default:
            return undefined;
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
export function findRepeatFlag(rule, flag) {
    switch (rule.type) {
        case 'repeat':
        case 'repeat1':
            if (rule[flag])
                return true;
            return findRepeatFlag(rule.content, flag);
        case 'seq':
        case 'choice':
            return rule.members.some((m) => findRepeatFlag(m, flag));
        case 'optional':
        case 'variant':
        case 'clause':
        case 'group':
        case 'field':
            return findRepeatFlag(rule.content, flag);
        default:
            return false;
    }
}
/**
 * Collect the names of named fields whose content contains a `repeat` /
 * `repeat1` with the given flag (`trailing` or `leading`). Returns a
 * `Set<string>` of field names — empty when no such field is found.
 *
 * Used by the template emitter to build a per-field trailing-separator
 * set so `filterForFlanks` can restrict `joinWithTrailing` to the
 * specific fields whose repeats carry the flag, rather than applying it
 * globally whenever the whole rule has any trailing repeat.
 */
export function findFieldsWithRepeatFlag(rule, flag) {
    const out = new Set();
    collectFieldsWithRepeatFlag(rule, flag, out);
    return out;
}
function collectFieldsWithRepeatFlag(rule, flag, acc) {
    switch (rule.type) {
        case 'field':
            if (findRepeatFlag(rule.content, flag))
                acc.add(rule.name);
            return;
        case 'seq':
        case 'choice':
            for (const m of rule.members)
                collectFieldsWithRepeatFlag(m, flag, acc);
            return;
        case 'repeat':
        case 'repeat1':
        case 'optional':
        case 'variant':
        case 'clause':
        case 'group':
            collectFieldsWithRepeatFlag(rule.content, flag, acc);
            return;
        default:
            return;
    }
}
/**
 * For a Jinja-inline optional emission whose
 * head fragment opens with `{% if X | isPresent %}`, route the leading
 * `separator` INSIDE the conditional body so it disappears alongside
 * an absent value.
 *
 * Detection is purely textual on the part fragment — the walker now
 * emits Jinja inline directly for every synthesized optional case
 * (clause-rule, optional-keyword, optional-with-flanking-field, field-
 * with-optional-flanking-content), so a single regex covers them all.
 *
 * Returns `true` when the absorption succeeded (caller skips the
 * unconditional `out.push(separator)`); `false` when the head fragment
 * isn't a Jinja-inline conditional.
 */
function absorbLeadingSeparatorIntoJinjaConditional(parts, separator) {
    if (parts.length === 0)
        return false;
    const head = parts[0];
    const m = head.match(/^(\{%-? if [^%]+-?%\})/);
    if (!m)
        return false;
    parts[0] = `${m[1]}${separator}${head.slice(m[1].length)}`;
    return true;
}
/**
 * Inverse of {@link absorbLeadingSeparatorIntoJinjaConditional}: when the
 * out-array's tail is a complete Jinja conditional, route the trailing
 * `separator` INSIDE that conditional's body (just before the `{% endif %}`
 * tag) so the separator emits only when the conditional fires. Used by
 * the seq case so an optional placeholder followed by a required one
 * ({{X}} {{Y}}) doesn't leave a stray space when X is absent.
 *
 * Returns `true` when the absorption succeeded (caller skips the
 * unconditional `out.push(separator)`); `false` when the tail isn't a
 * Jinja-inline conditional.
 */
function absorbTrailingSeparatorIntoJinjaConditional(out, separator) {
    if (out.length === 0)
        return false;
    const tail = out[out.length - 1];
    const m = tail.match(/^(\{%-? if [^%]+-?%\})(.*)(\{%-? endif -?%\})$/);
    if (!m)
        return false;
    out[out.length - 1] = `${m[1]}${m[2]}${separator}${m[3]}`;
    return true;
}
const JINJA_CONDITIONAL_FULL = /^(\{%-? if [^%]+-?%\})(.*)(\{%-? endif -?%\})$/;
const JINJA_IF_HEAD = /^\{%-? if [^%]+-?%\}/;
/**
 * Leading-space-at-template-head fix.
 *
 * When a seq's emission starts with a run of consecutive Jinja
 * conditionals followed by an unconditional separator and required
 * content, ALL the conditionals being absent leaves the separator
 * stranded at offset 0 (the canonical ` fn ...` symptom). Fixed by:
 *
 *   1. Stripping any leading-edge separator step 3 placed inside each
 *      conditional in the head run (those leading-edge separators are
 *      only correct between two conditionals where one of them is
 *      preceded by required content).
 *   2. Adding the unconditional separator as a TRAILING-edge separator
 *      inside each conditional (so it disappears alongside an absent
 *      conditional, and chains correctly when consecutive conditionals
 *      fire).
 *   3. Removing the now-redundant unconditional separator that sat
 *      between the run and the required content.
 *
 * Trailing-on-each works for every combination of present/absent in
 * the run — see template-walker-frozen freeze tests for proofs across
 * single-conditional (`type_item`, `while_expression`) and multi-
 * conditional (`function_item`, `closure_expression`, `trait_item`)
 * heads.
 */
function absorbHeadLeadingSeparatorIntoConditionals(out) {
    let runEnd = 0;
    while (runEnd < out.length && JINJA_IF_HEAD.test(out[runEnd]))
        runEnd++;
    if (runEnd === 0)
        return;
    if (runEnd >= out.length)
        return;
    const sepIdx = runEnd;
    const sep = out[sepIdx];
    if (sep !== ' ')
        return;
    if (sepIdx + 1 >= out.length)
        return;
    const tail = out[sepIdx + 1];
    if (tail.length === 0)
        return;
    if (JINJA_IF_HEAD.test(tail))
        return;
    for (let i = 0; i < runEnd; i++) {
        const cond = out[i];
        const m = cond.match(JINJA_CONDITIONAL_FULL);
        if (!m)
            continue;
        const ifTag = m[1];
        let body = m[2];
        const endTag = m[3];
        if (body.startsWith(sep))
            body = body.slice(sep.length);
        if (!body.endsWith(sep))
            body = `${body}${sep}`;
        out[i] = `${ifTag}${body}${endTag}`;
    }
    out.splice(sepIdx, 1);
}
/**
 * Compute the effective edge character of a template fragment for
 * `needsSpace` — operate on the RENDERED text the fragment will
 * produce, ignoring Jinja control syntax.
 *
 *   - For a Jinja-inline conditional `{% if X | isPresent %}<body>{% endif %}`,
 *     return the matching edge char of `<body>`. The conditional
 *     itself emits no characters; the body governs spacing when the
 *     conditional fires.
 *   - For a placeholder reference `$NAME` / `$NAME_CLAUSE` /
 *     `$$$NAME`, treat the placeholder as identifier-like (a real
 *     value will substitute at render time).
 *   - For literal text, take the literal edge char.
 */
function effectiveSpacingChar(s, edge) {
    // Jinja-inline conditional — peel the wrapper and inspect the body.
    // For spacing purposes:
    //  * If the body is pure non-word punctuation (`:`, `=`, `!`, etc.),
    //    use that punct as the edge char so adjacent literal punctuation
    //    won't double up.
    //  * Otherwise (body contains placeholders or a mix), treat the
    //    fragment as word-like-on-this-side. The conditional WILL emit a
    //    placeholder that typically resolves to word content at render
    //    time, so the boundary should behave as if the prev/next was
    //    identifier-like — matching the legacy synthesized-clause path
    //    where `$NAME_CLAUSE` was always word-like.
    const cond = s.match(/^(\{%-? if [^%]+-?%\})(.*)(\{%-? endif -?%\})$/);
    if (cond) {
        const body = cond[2];
        if (body.length > 0) {
            if (/^[^\w\s$]+$/.test(body))
                return effectiveSpacingChar(body, edge);
            return 'a';
        }
    }
    return edge === 'first' ? (s[0] ?? '') : (s[s.length - 1] ?? '');
}
function effectiveSpacingCharForRule(rule, fallback, edge, rules, seen = new Set()) {
    const resolved = resolveRuleEdgeChar(rule, edge, rules, seen);
    if (resolved && edge === 'first') {
        return NO_LEADING_SEPARATOR_PUNCT.has(resolved)
            ? resolved
            : effectiveSpacingChar(fallback, edge);
    }
    return resolved ?? effectiveSpacingChar(fallback, edge);
}
const NO_LEADING_SEPARATOR_PUNCT = new Set([
    ':',
    '?',
    '.',
    ',',
    ';',
    ')',
    ']',
    '>',
    '(',
    '['
]);
function resolveRuleEdgeChar(rule, edge, rules, seen = new Set()) {
    switch (rule.type) {
        case 'field':
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
        case 'terminal':
        case 'alias':
        case 'token':
            return resolveRuleEdgeChar(rule.content, edge, rules, seen);
        case 'string':
            return edge === 'first' ? rule.value[0] : rule.value[rule.value.length - 1];
        case 'pattern': {
            const lit = representativeLiteral(rule.value);
            return lit ? (edge === 'first' ? lit[0] : lit[lit.length - 1]) : undefined;
        }
        case 'enum': {
            const chars = new Set(rule.members
                .map((member) => resolveRuleEdgeChar(member, edge, rules, seen))
                .filter((value) => value != null));
            return chars.size === 1 ? [...chars][0] : undefined;
        }
        case 'seq': {
            const members = edge === 'first' ? rule.members : [...rule.members].reverse();
            for (const member of members) {
                const char = resolveRuleEdgeChar(member, edge, rules, seen);
                if (char)
                    return char;
            }
            return undefined;
        }
        case 'choice': {
            const chars = new Set(rule.members
                .map((member) => resolveRuleEdgeChar(member, edge, rules, seen))
                .filter((value) => value != null));
            return chars.size === 1 ? [...chars][0] : undefined;
        }
        case 'symbol': {
            if (rule.source === 'link') {
                const literal = rule.literal;
                if (!literal)
                    return undefined;
                return edge === 'first' ? literal[0] : literal[literal.length - 1];
            }
            if (!rules)
                return undefined;
            if (seen.has(rule.name))
                return undefined;
            const target = rules[rule.name];
            if (!target)
                return undefined;
            seen.add(rule.name);
            return resolveRuleEdgeChar(target, edge, rules, seen);
        }
        case 'supertype':
        case 'polymorph':
        case 'indent':
        case 'dedent':
        case 'newline':
            return undefined;
        default:
            return undefined;
    }
}
/**
 * Emit the canonical Jinja inline conditional `{% if NAME | isPresent %}body{% endif %}`.
 * Used by clause-rule walking and any other walker site that produces a
 * gated emission tied to a field/keyword/clause name.
 */
function emitJinjaConditional(name, body) {
    return `{% if ${name} | isPresent %}${body}{% endif %}`;
}
const TEMPLATE_WORD = /\w/;
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
function needsSpace(prev, next, wordMatcher) {
    if (!prev || !next)
        return false;
    const lastChar = prev[prev.length - 1];
    const firstChar = next[0] === '$' ? 'a' : next[0];
    if (wordMatcher) {
        return wordMatcher.test(lastChar + firstChar);
    }
    const prevIsWordLike = TEMPLATE_WORD.test(prev);
    const nextIsWordLike = TEMPLATE_WORD.test(next) || next === '$';
    return prevIsWordLike && nextIsWordLike;
}
//# sourceMappingURL=template-walker.js.map