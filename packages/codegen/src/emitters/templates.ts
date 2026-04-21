/**
 * Emits templates.yaml — thin dispatch over AssembledNode.renderTemplate().
 *
 * Every structural node (branch / container / group / polymorph) owns
 * its own template emission as a class method on AssembledNode. This
 * file is just: iterate NodeMap, call `node.renderTemplate()`, serialize
 * the collected map of rule entries as YAML. All walker logic lives in
 * compiler/rule.ts next to the class hierarchy that consumes it.
 */

import type { NodeMap } from '../compiler/types.ts'
import { AssembledGroup } from '../compiler/node-map.ts'
import { compileWordMatcher } from '../compiler/common.ts'

export interface EmitTemplatesConfig {
    grammar: string
    nodeMap: NodeMap
    grammarSha?: string
}

export function emitTemplates(config: EmitTemplatesConfig): string {
    const { grammar, nodeMap, grammarSha } = config

    // Compile the grammar's word-rule pattern once. The template walker
    // uses it for adjacency spacing and keyword-shape detection so the
    // generated `$PREV $NEXT` vs `$PREV$NEXT` choice is driven by
    // tree-sitter's own lexical convention, not a hardcoded `/\w/`.
    const wordMatcher = compileWordMatcher(nodeMap.word, nodeMap.rules ?? {})

    const rules: Record<string, unknown> = {}
    for (const [kind, node] of nodeMap.nodes) {
        // Hidden kinds (`_`-prefixed) usually don't appear in tree-sitter
        // CSTs at runtime — the parser reports the alias target, and
        // readNode-sourced NodeData carries that target as $type.
        //
        // Exception: factories for alias sources (python `matchBlock` →
        // $type='_match_block') stamp $type with the hidden source kind
        // under ADR-0006 drillAs. Render then needs a template keyed by
        // the source kind because the source's shape can differ from the
        // target's (e.g. `_match_block` polymorph has a typed `alternative`
        // field while `block` is plain `$$$CHILDREN`). Emit templates for
        // hidden polymorphs so render resolves them directly; the
        // target→source `_fieldAliasMap` handles factory dispatch
        // upstream. Keep the skip for terminals/tokens/groups where no
        // factory surfaces the hidden name.
        if (kind.startsWith('_') && node.modelType !== 'polymorph') continue
        // Polymorph forms are `AssembledGroup` nodes registered at the top
        // level so factories/types emitters can produce code for them, but
        // their templates are already surfaced inside the parent polymorph's
        // `variants:` map. Emitting them as top-level entries too is
        // duplicate noise — skip them here.
        if (node instanceof AssembledGroup && node.parentKind) continue
        const entry = node.renderTemplate(nodeMap.rules, wordMatcher, nodeMap.externals)
        if (entry === undefined) continue
        // Shorthand: collapse `{ template: "..." }` to a bare string when
        // that's the only key. Runtime's `resolveTemplate` already accepts
        // the string arm, and the emitter is the only producer of these
        // files — so every regen re-normalizes to the canonical shape.
        // Keeps the object form for entries that carry `joinBy`, clauses,
        // or `variants:` so their structure stays visible in diffs.
        if (
            entry !== null && typeof entry === 'object' && !Array.isArray(entry)
            && Object.keys(entry).length === 1
            && typeof (entry as { template?: unknown }).template === 'string'
        ) {
            rules[kind] = (entry as { template: string }).template
        } else {
            rules[kind] = entry
        }
    }

    // Newline-terminating content inference.
    //
    // Grammars like python separate block-level statements via implicit
    // indent/newline/dedent external tokens. The tokens never appear as
    // literal strings in the rule body, so the walker can't capture
    // `\n` as a sibling-multi separator. Result: a repeated clause
    // field (e.g. `if_statement.alternative` = elif_clause | else_clause)
    // defaults to joinBy ` ` and renders `elif c:\n  d else:\n  f` —
    // the final `:` of the first clause and the `else` of the next
    // collapse onto one line at reparse.
    //
    // The author's intent is encoded in the clause templates: each ends
    // in `\n`. We detect this: a kind's raw template that ends with `\n`
    // is a "block-terminating" clause. When every content kind of a
    // multi-valued slot is block-terminating AND no explicit joinBy is
    // set, install joinBy = `\n` so the clauses separate correctly.
    //
    // Limits intentionally: per-field slots (joinByField) are the narrow
    // target — rule-level joinBy only fires when `$$$CHILDREN` with
    // block-terminating child content and the rule has no joinBy set.
    const terminatingKinds = new Set<string>()
    for (const [kind, entry] of Object.entries(rules)) {
        const tmpl = typeof entry === 'string'
            ? entry
            : (entry as { template?: string; variants?: Record<string, string> }).template
        const variants = typeof entry === 'object' && entry !== null
            ? (entry as { variants?: Record<string, string> }).variants
            : undefined
        // A kind is block-terminating if its PRIMARY template ends with
        // `\n`, or (for polymorphs) every variant template does. The
        // walker's raw output preserves that trailing newline; render
        // strips it at the outer layer.
        //
        // `$NEWLINE` (role placeholder for external newline tokens — used
        // in grammars like python whose termination is implicit) counts
        // as equivalent: at render time it resolves to `\n`. Templates
        // like `decorator: "@$EXPRESSION $NEWLINE"` are clause-level
        // for joinBy-inference purposes even though the raw string
        // doesn't end with the character.
        const endsWithNewline = (s: string): boolean =>
            s.endsWith('\n') || /\$NEWLINE\s*$/.test(s)
        if (typeof tmpl === 'string' && endsWithNewline(tmpl)) {
            terminatingKinds.add(kind)
        } else if (variants && Object.values(variants).every(v => typeof v === 'string' && endsWithNewline(v))) {
            terminatingKinds.add(kind)
        }
    }
    const fieldIsBlockTerminating = (fieldName: string, parentNode: { modelType?: string; fields?: readonly { name: string; contentTypes: readonly string[] }[] }): boolean => {
        const field = parentNode.fields?.find(f => f.name === fieldName)
        if (!field || field.contentTypes.length === 0) return false
        return field.contentTypes.every(t => terminatingKinds.has(t))
    }
    const childIsBlockTerminating = (parentNode: { children?: readonly { contentTypes: readonly string[] }[] }): boolean => {
        const all = parentNode.children?.flatMap(c => c.contentTypes) ?? []
        if (all.length === 0) return false
        return all.every(t => terminatingKinds.has(t))
    }
    for (const [kind, node] of nodeMap.nodes) {
        const raw = rules[kind]
        if (raw === undefined) continue
        // Collapsed bare-string entries (the common case when a rule has
        // only a `template` key) need promotion back to object form before
        // we can attach joinBy. We swap `rules[kind]` below only if we
        // actually add metadata.
        const e: Record<string, unknown> = typeof raw === 'string' ? { template: raw } : raw as Record<string, unknown>
        const n = node as unknown as { modelType?: string; fields?: readonly { name: string; contentTypes: readonly string[] }[]; children?: readonly { contentTypes: readonly string[] }[] }
        let mutated = false
        if (typeof e.template === 'string') {
            // Rule-level: `$$$CHILDREN` without joinBy, and all child
            // content is block-terminating → joinBy = '\n'.
            if (!('joinBy' in e) && e.template.includes('$$$CHILDREN') && childIsBlockTerminating(n)) {
                e.joinBy = '\n'
                mutated = true
            }
            // Per-field: scan `$$$FIELD` placeholders in template for
            // block-terminating fields, add to joinByField.
            const byField = (e.joinByField as Record<string, string> | undefined) ?? {}
            const placeholderRe = /\$\$\$([A-Z_][A-Z0-9_]*)/g
            let m: RegExpExecArray | null
            while ((m = placeholderRe.exec(e.template)) !== null) {
                const field = m[1]!.toLowerCase()
                if (field === 'children') continue  // already handled above
                if (byField[field] !== undefined) continue  // walker set it
                if (fieldIsBlockTerminating(field, n)) {
                    byField[field] = '\n'
                    mutated = true
                }
            }
            if (Object.keys(byField).length > 0) e.joinByField = byField
            // Spacing fix-up: a block-terminating placeholder followed
            // by a space in the template produces `decorator\n class`
            // output — the walker inserted ` ` between two `$X`
            // placeholders without knowing the first resolves to a
            // string ending in `\n`. Replace with literal `\n` so
            // boundaries between block-level constructs round-trip
            // correctly.
            //
            // Shallow render note: when readNode feeds render, child
            // entries surface as leaves (their $text is the source span).
            // So a decorator child renders as `@a.b` — not
            // `@a.b\n`. The newline that separated decorator and class
            // in the source lives in decorated_definition's span, and
            // the template must put it back. Hence: insert `\n`
            // (stronger than just stripping the space).
            const replaceTrailingSpace = (tmpl: string): string => {
                const isBlockTerminatingSlot = (name: string): boolean => {
                    if (name === 'children') return childIsBlockTerminating(n)
                    // `$X_CLAUSE` refers to a nested clause entry; skip
                    // — clause bodies aren't block-level in practice.
                    if (name.endsWith('_clause')) return false
                    return fieldIsBlockTerminating(name, n)
                }
                return tmpl.replace(/(\$\$?\$?[A-Z_][A-Z0-9_]*) /g, (full, ph: string) => {
                    const m2 = ph.match(/^\$\$?\$?([A-Z_][A-Z0-9_]*)$/)
                    if (!m2) return full
                    const name = m2[1]!.toLowerCase()
                    return isBlockTerminatingSlot(name) ? `${ph}\n` : full
                })
            }
            const replaced = replaceTrailingSpace(e.template)
            if (replaced !== e.template) {
                e.template = replaced
                mutated = true
            }
        }
        if (mutated) rules[kind] = e
    }

    const output = {
        grammar,
        grammarSha: grammarSha ?? '',
        rules,
    }
    return `# Auto-generated by @sittir/codegen — do not edit\n${yamlStringify(output)}`
}

// ---------------------------------------------------------------------------
// Minimal YAML stringifier for the template structure.
// ---------------------------------------------------------------------------

function yamlStringify(obj: unknown, indent = 0): string {
    const pad = '  '.repeat(indent)
    if (obj === null || obj === undefined) return 'null'
    if (typeof obj === 'string') {
        // Quote strings with YAML-reserved leading characters or any
        // character that breaks plain-scalar parsing. Single-char
        // punctuation values (joinBy separators like `;`, `,`, `|`) are
        // always quoted — they read as flow-indicator tokens in some
        // scalar contexts.
        const reservedLead = /^[`@!*&|>%'"#?\s,\-]|^---$|^\.\.\.$/
        if (
            reservedLead.test(obj) ||
            /[:#{}\[\]\n`]/.test(obj) ||
            obj === '' || obj === '?' || obj === '-' ||
            (obj.length === 1 && /[;,|]/.test(obj))
        ) {
            return JSON.stringify(obj)
        }
        return obj
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj)
    if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]'
        return '\n' + obj.map(item => `${pad}- ${yamlStringify(item, indent + 1).trimStart()}`).join('\n')
    }
    if (typeof obj === 'object') {
        const entries = Object.entries(obj as Record<string, unknown>).filter(([, v]) => v !== undefined)
        if (entries.length === 0) return '{}'
        return entries.map(([k, v]) => {
            const key = /[:#{}\[\]\s]/.test(k) ? JSON.stringify(k) : k
            const val = yamlStringify(v, indent + 1)
            if (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v as object).length > 0) {
                return `${pad}${key}:\n${val}`
            }
            if (Array.isArray(v) && v.length > 0) {
                return `${pad}${key}:${val}`
            }
            return `${pad}${key}: ${val}`
        }).join('\n')
    }
    return JSON.stringify(obj)
}
