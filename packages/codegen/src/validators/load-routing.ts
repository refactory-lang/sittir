/**
 * load-routing — import the generated `_routing` map from a grammar's
 * wrap.ts. Validators use this instead of rebuilding routing from
 * overrides.json so the exact same map that flows into the runtime
 * (via codegen's deriveOverridesConfig → wrap) is what's tested.
 */

import type { RoutingMap } from '@sittir/core'

const WRAP_MODULE_PATHS: Record<string, string> = {
    rust: '../../../rust/src/wrap.ts',
    typescript: '../../../typescript/src/wrap.ts',
    python: '../../../python/src/wrap.ts',
}

export async function loadRouting(grammar: string): Promise<RoutingMap> {
    const rel = WRAP_MODULE_PATHS[grammar]
    if (!rel) throw new Error(`loadRouting: no wrap.ts path for grammar '${grammar}'`)
    const mod = await import(new URL(rel, import.meta.url).pathname)
    if (!mod._routing) throw new Error(`loadRouting: wrap.ts for '${grammar}' does not export _routing`)
    return mod._routing as RoutingMap
}
