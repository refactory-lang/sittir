/**
 * dsl/role.ts — structural-whitespace role primitive for override files.
 *
 * Sittir-specific DSL addition. Indent-sensitive grammars declare the
 * mapping from their external token names to the three canonical
 * structural roles (`indent`, `dedent`, `newline`) by defining rules
 * whose body is the role node directly:
 *
 *     _indent: ($) => role('indent'),
 *     _dedent: ($) => role('dedent'),
 *     _newline: ($) => role('newline'),
 *
 * Link's symbol resolution picks up these role-annotated rules by
 * structural shape (the body IS the role node) — no name matching,
 * so a grammar can use any naming convention it likes.
 *
 * Import explicitly:
 *
 *     import { role } from '@sittir/codegen/dsl'
 */

import type { Rule } from '../compiler/rule.ts'

export function role(name: 'indent' | 'dedent' | 'newline'): Rule {
    if (name === 'indent') return { type: 'indent' } as Rule
    if (name === 'dedent') return { type: 'dedent' } as Rule
    if (name === 'newline') return { type: 'newline' } as Rule
    throw new Error(`role(): unknown role '${name}'`)
}
