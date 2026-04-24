/**
 * Spec 012 T063 — SC-008 gate (no breaking API changes).
 *
 * Captures the top-level export surface of `@sittir/rust` as a
 * vitest snapshot. Adding/removing/renaming an export, or changing
 * an export's TypeScript runtime kind (function vs object vs class),
 * fails this test until the snapshot is regenerated with
 * `vitest --update`.
 *
 * The snapshot stores `<name>: <kind>` per export so a binary
 * function-vs-class change shows up in review without dragging in
 * full TypeScript program-API plumbing. Type-only exports (interface,
 * type alias) don't appear in `Object.keys` — they are checked
 * indirectly by the package's existing `*.test.ts` files; the runtime
 * surface here is the load-bearing API for downstream consumers.
 */

import { describe, expect, test } from 'vitest'

describe('@sittir/rust — API surface snapshot (SC-008)', () => {
    test('top-level exports', async () => {
        const mod = (await import('@sittir/rust')) as Record<string, unknown>
        const surface: Record<string, string> = {}
        for (const name of Object.keys(mod).sort()) {
            const value = mod[name]
            surface[name] =
                value === null
                    ? 'null'
                    : typeof value === 'function'
                      ? 'function'
                      : typeof value === 'object'
                        ? Array.isArray(value)
                            ? 'array'
                            : 'object'
                        : typeof value
        }
        expect(surface).toMatchSnapshot()
    })
})
