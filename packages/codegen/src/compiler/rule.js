/**
 * compiler/rule.ts — Shared IR
 *
 * One type throughout the pipeline. Defined once, never extended.
 * Rule type presence varies by phase:
 *   - After Evaluate: symbol, alias, token, repeat1 present
 *   - After Link: symbol, alias, token gone; clause, group, indent/dedent/newline added.
 *     `repeat1` is preserved so downstream field/child derivation can stamp the
 *     `nonEmpty` flag on the resulting slot for emitter tuple-type rendering.
 *   - After Optimize: variant added; structural grouping may be restructured
 *
 * @generated — do not add derived metadata (required, multiple, contentTypes, etc.)
 *              Those are derived from tree context at Assemble time.
 */
/**
 * Normalize a closed literal set to the canonical rule shape.
 *
 * @remarks
 * Multi-member sets remain `EnumRule`. A single literal collapses to that
 * `StringRule` so downstream phases classify it as the corresponding
 * keyword/token instead of carrying a degenerate enum shape.
 */
export function normalizeEnumMembers(members, source) {
    if (members.length === 1)
        return members[0];
    return {
        type: 'enum',
        members,
        source
    };
}
// ---------------------------------------------------------------------------
// Per-variant type guards
//
// Prefer these over inline `r.type === 'seq'` checks in `.filter()`,
// `.find()`, `.some()`, `.every()`, and standalone predicates — they
// narrow the rule type through the callback (no `as SeqRule` casts
// downstream). Inside a `switch (rule.type)` stay with literal case
// arms so TS exhaustiveness checking catches missing variants when
// new Rule types are added.
// ---------------------------------------------------------------------------
export const isSeq = (r) => r.type === 'seq';
export const isChoice = (r) => r.type === 'choice';
export const isOptional = (r) => r.type === 'optional';
export const isRepeat = (r) => r.type === 'repeat';
export const isRepeat1 = (r) => r.type === 'repeat1';
export const isField = (r) => r.type === 'field';
export const isVariant = (r) => r.type === 'variant';
export const isClause = (r) => r.type === 'clause';
export const isEnum = (r) => r.type === 'enum';
export const isSupertype = (r) => r.type === 'supertype';
export const isGroup = (r) => r.type === 'group';
export const isTerminal = (r) => r.type === 'terminal';
export const isPolymorph = (r) => r.type === 'polymorph';
export const isString = (r) => r.type === 'string';
export const isPattern = (r) => r.type === 'pattern';
export const isIndent = (r) => r.type === 'indent';
export const isDedent = (r) => r.type === 'dedent';
export const isNewline = (r) => r.type === 'newline';
export const isSymbol = (r) => r.type === 'symbol';
export const isAlias = (r) => r.type === 'alias';
export const isToken = (r) => r.type === 'token';
export const isLinkSymbol = (r) => r.type === 'symbol' && r.source === 'link';
export const literalTextOf = (r) => r.type === 'string' ? r.value : isLinkSymbol(r) ? r.literal : undefined;
// ---------------------------------------------------------------------------
// Tree walkers — pure Rule-tree projections, no AssembledNode concepts
// ---------------------------------------------------------------------------
/**
 * Collect the set of field names referenced anywhere in a rule tree.
 * Returns names only — cheap one-pass walker with no AssembledField
 * allocation. Pre-assembly phases (classifier, link's polymorph-
 * promotion heuristics) that only need field-set equality call this
 * instead of constructing full AssembledField objects just to extract
 * names.
 */
export function collectFieldNames(rule) {
    const names = new Set();
    walkFieldNames(rule, names);
    return names;
}
function walkFieldNames(rule, out) {
    switch (rule.type) {
        case 'field':
            out.add(rule.name);
            walkFieldNames(rule.content, out);
            return;
        case 'seq':
        case 'choice':
            for (const m of rule.members)
                walkFieldNames(m, out);
            return;
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
            walkFieldNames(rule.content, out);
            return;
        default:
            return;
    }
}
//# sourceMappingURL=rule.js.map