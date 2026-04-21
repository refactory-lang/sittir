/**
 * dsl/synthetic-rules.ts — accumulator for transform-generated hidden rules.
 *
 * When transform sees an `alias('variant_name')` placeholder, it:
 *   1. Captures the original content at the patch target
 *   2. Registers a hidden rule `_variant_name` with that content here
 *   3. Returns `alias($._variant_name, $.variant_name)` as the replacement
 *
 * All registration now routes through the wire context. No module-level
 * accumulator state remains — functions that previously used module state
 * have been deleted (ADR-0009 phase 3).
 */

import { type RuntimeRule } from './runtime-shapes.ts'
import {
    wireRegisterSyntheticRule,
    wireRegisterPolymorphVariant,
    wireRegisterConflict,
    wireGetCurrentRuleKind,
} from './wire.ts'

export function getCurrentRuleKind(): string | null {
    return wireGetCurrentRuleKind()
}

export function registerSyntheticRule(name: string, content: RuntimeRule): void {
    if (!wireRegisterSyntheticRule(name, content)) {
        throw new Error(
            `registerSyntheticRule('${name}'): called outside a wire() context. ` +
            `Wrap your grammar() opts in wire({...}) so synthetic rules route through it.`,
        )
    }
}

export function registerPolymorphVariant(parentKind: string, childSuffix: string): void {
    if (!wireRegisterPolymorphVariant(parentKind, childSuffix)) {
        throw new Error(
            `registerPolymorphVariant('${parentKind}'/'${childSuffix}'): called outside a wire() context. ` +
            `variant()/alias() must be resolved inside a rule callback that runs under wire().`,
        )
    }
}

/**
 * Register a tree-sitter conflict group. Each call adds one entry to
 * the grammar's `conflicts: [[...]]` list. Used by auto-hoist to tell
 * tree-sitter that a newly-synthesized rule may structurally overlap
 * with an auto-generated internal helper (e.g. shared `_repeat1`
 * factorings) — without this, the parser-generator's static analysis
 * refuses to resolve the conflict and fails grammar compilation.
 */
export function registerConflict(names: readonly string[]): void {
    if (names.length === 0) return
    if (!wireRegisterConflict(names)) {
        throw new Error(
            `registerConflict(${JSON.stringify(names)}): called outside a wire() context.`,
        )
    }
}


