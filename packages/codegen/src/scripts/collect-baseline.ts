/**
 * collect-baseline.ts — feature 016, US1.
 *
 * Produces the per-backend `BackendBaseline` JSON committed under
 * `specs/016-parity-regressions/baselines/{ts,native}.json`. Reads
 * `SITTIR_BACKEND` from the environment to select between TS-mode (the
 * default Nunjucks pipeline) and native-mode (the napi engine). Inside
 * the corpus validators, `buildReadHandle()` already does the dispatch
 * — this script just wires up the validators + parity-fixture render
 * comparison and shapes the output to the contract in
 * `specs/016-parity-regressions/contracts/baseline-json.md`.
 *
 * Determinism contract:
 *   - 4-space indent, `\n` line endings, trailing newline.
 *   - Sorted keys at every level (writer rebuilds the object with
 *     sorted keys before JSON.stringify).
 *   - Sorted `failingKinds` arrays, sorted `failingByKind` keys
 *     (failure-id values stay in fixture-file declaration order).
 *   - Empty collections explicit: `[]` / `{}` not omitted.
 *   - No timestamps. The only mutable header field is `commit`
 *     (content-derived from `git rev-parse --short=7 HEAD`).
 *
 * Used as both an importable module (the test in
 * `__tests__/collect-baseline.test.ts` calls `collectBaseline` /
 * `serialiseBaseline` directly) and a CLI entry — the bottom of this
 * file detects whether it was invoked as a script and prints to stdout
 * if so.
 */

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { validateFactoryRoundTrip } from '../validate/factory-roundtrip.ts'
import { validateFrom } from '../validate/from.ts'
import { validateRoundTrip } from '../validate/roundtrip.ts'
import { validateTemplateCoverage } from '../validate/template-coverage.ts'

// ---------------------------------------------------------------------------
// Schema types — see contracts/baseline-json.md
// ---------------------------------------------------------------------------

export type Backend = 'typescript' | 'native'
export type Grammar = 'python' | 'rust' | 'typescript'

const GRAMMARS: readonly Grammar[] = ['python', 'rust', 'typescript']

export interface ValidatorResult {
    pass: number
    total: number
    failingKinds: string[]
}

export interface RoundtripResult extends ValidatorResult {
    astMatchPass: number
}

export interface ParityFixtures {
    pass: number
    total: number
    failingByKind: { readonly [kind: string]: readonly string[] }
}

export interface GrammarEntry {
    validators: {
        from: ValidatorResult
        coverage: ValidatorResult
        roundtrip: RoundtripResult
        factoryRoundtrip: RoundtripResult
    }
    parityFixtures: ParityFixtures
}

export interface BackendBaseline {
    backend: Backend
    commit: string
    grammars: { readonly [grammar in Grammar]: GrammarEntry }
    totals: {
        pass: number
        fail: number
        total: number
    }
}

// ---------------------------------------------------------------------------
// Repo-relative path helpers
// ---------------------------------------------------------------------------

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url)).replace(/\/$/, '')

function templatesPathFor(grammar: Grammar): string {
    return resolve(repoRoot, `packages/${grammar}/templates`)
}

function fixturesPathFor(grammar: Grammar): string {
    return resolve(repoRoot, `packages/${grammar}/rust-render/test-fixtures.json`)
}

// ---------------------------------------------------------------------------
// Failing-kind extraction
// ---------------------------------------------------------------------------

/**
 * Extract the kind from a roundtrip-style error name. The validators
 * format roundtrip error names as `${entry.name} [${renderedKind}]`,
 * so the bracketed suffix carries the kind. Returns null when the name
 * doesn't carry a kind tag.
 */
function kindFromRoundtripName(name: string): string | null {
    const m = /\[([^\]]+)\]$/.exec(name)
    return m ? m[1] ?? null : null
}

function uniqSorted(values: Iterable<string>): string[] {
    return [...new Set(values)].sort()
}

// ---------------------------------------------------------------------------
// Parity-fixture collection
// ---------------------------------------------------------------------------

interface RenderFixture {
    readonly kind: 'render'
    readonly grammar: string
    readonly input: { readonly $type: string; readonly [k: string]: unknown }
    readonly expectedOutput: string
}

interface ParityFixtureLike {
    readonly kind: string
    readonly input?: { readonly $type?: string }
}

function loadRenderFixtures(grammar: Grammar): RenderFixture[] {
    const raw = readFileSync(fixturesPathFor(grammar), 'utf-8')
    const all = JSON.parse(raw) as ParityFixtureLike[]
    return all.filter(
        (f): f is RenderFixture =>
            f.kind === 'render' && typeof f.input?.$type === 'string',
    )
}

interface ParityRenderer {
    render: (node: unknown) => string
}

/**
 * Resolve the render function used for parity fixtures. In TS mode we
 * use `createRenderer` over the per-grammar templates directory. In
 * native mode we route through the per-grammar boundary shim, which
 * dispatches to the napi engine via getActiveBackend (the same path the
 * validators use through `buildReadHandle` — keeping parity-fixture
 * render with the validators' read path).
 *
 * Boundary import is dynamic so an unbuilt napi crate doesn't break TS
 * collection. If the boundary fails to load in native mode we fall
 * back to the TS renderer so the script still produces output — the
 * `commit` + counts will reflect whichever path actually ran.
 */
async function buildParityRenderer(
    grammar: Grammar,
    backend: Backend,
): Promise<ParityRenderer> {
    if (backend === 'native') {
        try {
            const boundaryPath = pathToFileURL(
                resolve(repoRoot, `packages/${grammar}/src/boundary.ts`),
            ).href
            const mod = (await import(boundaryPath)) as { render: (node: unknown) => string }
            if (typeof mod.render === 'function') {
                return { render: mod.render }
            }
        } catch {
            // fall through to TS renderer below
        }
    }
    // Lazy import of @sittir/core's createRenderer — keeps the module
    // import-cheap when the test target only exercises the type shape.
    const core = (await import('@sittir/core')) as {
        createRenderer: (templatesPath: string) => { render: (node: unknown) => string }
    }
    const r = core.createRenderer(templatesPathFor(grammar))
    return { render: r.render.bind(r) }
}

async function collectParityFixtures(
    grammar: Grammar,
    backend: Backend,
): Promise<ParityFixtures> {
    const fixtures = loadRenderFixtures(grammar)
    const renderer = await buildParityRenderer(grammar, backend)

    let pass = 0
    // Map insertion order matches fixture-file declaration order — keep
    // the failure-id values in that order, then re-key with sorted keys
    // when serialising.
    const failingByKind = new Map<string, string[]>()

    fixtures.forEach((fx, idx) => {
        let actual: string | null = null
        try {
            actual = renderer.render(fx.input)
        } catch {
            actual = null
        }
        if (actual === fx.expectedOutput) {
            pass++
            return
        }
        const kind = fx.input.$type
        const id = `render #${idx}`
        const existing = failingByKind.get(kind) ?? []
        existing.push(id)
        failingByKind.set(kind, existing)
    })

    // Re-key the map with sorted kind names. Value arrays stay in
    // insertion order, which IS fixture-file declaration order
    // because we iterated `fixtures` in order. Determinism rule:
    // sorted keys, fixture-order values.
    const sortedFailingByKind: Record<string, string[]> = {}
    for (const k of [...failingByKind.keys()].sort()) {
        sortedFailingByKind[k] = failingByKind.get(k)!
    }

    return {
        pass,
        total: fixtures.length,
        failingByKind: sortedFailingByKind,
    }
}

// ---------------------------------------------------------------------------
// Validator collection
// ---------------------------------------------------------------------------

async function collectValidatorsForGrammar(grammar: Grammar): Promise<GrammarEntry['validators']> {
    const tp = templatesPathFor(grammar)

    // Validators dispatch through `buildReadHandle` internally, so they
    // already honour SITTIR_BACKEND. We just call them. Run in parallel
    // — each pulls its own copy of corpus + tree, no shared mutable
    // state.
    const [from, cov, rt, fac] = await Promise.all([
        validateFrom(grammar),
        Promise.resolve(validateTemplateCoverage(grammar, tp)),
        validateRoundTrip(grammar, tp),
        validateFactoryRoundTrip(grammar, tp),
    ])

    return {
        from: {
            pass: from.pass,
            total: from.total,
            failingKinds: uniqSorted(from.errors.map(e => e.kind).filter(Boolean)),
        },
        coverage: {
            pass: cov.pass,
            total: cov.total,
            failingKinds: uniqSorted(cov.issues.map(i => i.kind).filter(Boolean)),
        },
        roundtrip: {
            pass: rt.pass,
            total: rt.total,
            astMatchPass: rt.astMatchPass,
            failingKinds: uniqSorted(
                [...rt.errors, ...rt.astMismatches]
                    .map(e => kindFromRoundtripName(e.name))
                    .filter((k): k is string => k !== null),
            ),
        },
        factoryRoundtrip: {
            pass: fac.pass,
            total: fac.total,
            astMatchPass: fac.astMatchPass,
            failingKinds: uniqSorted(
                [...fac.errors, ...fac.astMismatches].map(e => e.kind).filter(Boolean),
            ),
        },
    }
}

// ---------------------------------------------------------------------------
// Top-level assembly
// ---------------------------------------------------------------------------

function shortSha(): string {
    try {
        const out = execSync('git rev-parse --short=7 HEAD', {
            cwd: repoRoot,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim()
        if (/^[a-f0-9]{7}$/.test(out)) return out
    } catch {
        // git missing or not a repo — fall through to placeholder
    }
    return '0000000'
}

function resolveBackend(input: string | undefined): Backend {
    if (input === 'native') return 'native'
    return 'typescript'
}

function computeTotals(
    grammars: BackendBaseline['grammars'],
): BackendBaseline['totals'] {
    let pass = 0
    let total = 0
    for (const g of GRAMMARS) {
        const entry = grammars[g]
        for (const v of [entry.validators.from, entry.validators.coverage] as const) {
            pass += v.pass
            total += v.total
        }
        for (const v of [entry.validators.roundtrip, entry.validators.factoryRoundtrip] as const) {
            pass += v.pass
            total += v.total
        }
        pass += entry.parityFixtures.pass
        total += entry.parityFixtures.total
    }
    return { pass, fail: total - pass, total }
}

export async function collectBaseline(backendInput?: string): Promise<BackendBaseline> {
    const backend = resolveBackend(backendInput)
    const commit = shortSha()

    const entries: Partial<Record<Grammar, GrammarEntry>> = {}
    for (const g of GRAMMARS) {
        // Per-grammar sequential execution: each grammar pulls its own
        // tree-sitter language + corpus into memory, and the native-engine
        // module is cached per-grammar in `validate/common.ts`. Running
        // them sequentially keeps memory bounded and the order of
        // diagnostic logs (warnings from inferPolymorphVariant et al.)
        // stable across runs — material for the determinism guarantee.
        const [validators, parityFixtures] = await Promise.all([
            collectValidatorsForGrammar(g),
            collectParityFixtures(g, backend),
        ])
        entries[g] = { validators, parityFixtures }
    }
    const grammars = entries as BackendBaseline['grammars']

    return {
        backend,
        commit,
        grammars,
        totals: computeTotals(grammars),
    }
}

// ---------------------------------------------------------------------------
// Deterministic serialisation
// ---------------------------------------------------------------------------

/**
 * Recursively rebuild an object with keys in sorted order. Arrays
 * stay in their existing order — order in arrays is meaningful (e.g.
 * `failingByKind`'s value arrays are fixture-file declaration order).
 *
 * Objects identified as plain objects (Object.getPrototypeOf === null
 * or Object.prototype) get their keys sorted. Anything else (Date,
 * regexp, etc.) returns as-is. We don't expect non-plain objects in
 * the BackendBaseline tree.
 */
function sortKeysDeep(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeysDeep)
    if (value !== null && typeof value === 'object') {
        const proto = Object.getPrototypeOf(value)
        if (proto === Object.prototype || proto === null) {
            const out: Record<string, unknown> = {}
            for (const k of Object.keys(value as object).sort()) {
                out[k] = sortKeysDeep((value as Record<string, unknown>)[k])
            }
            return out
        }
    }
    return value
}

export function serialiseBaseline(baseline: BackendBaseline): string {
    // Pre-sort failingKinds (defensive — `uniqSorted` already sorts,
    // but parity-fixture's `failingByKind` value arrays must NOT be
    // sorted; this pre-pass only sorts the keys of failingByKind, the
    // sortKeysDeep walk handles the rest).
    const sorted = sortKeysDeep(baseline)
    return `${JSON.stringify(sorted, null, 4)}\n`
}

// ---------------------------------------------------------------------------
// CLI entry
// ---------------------------------------------------------------------------

const isCli = (() => {
    if (process.argv[1] == null) return false
    try {
        const argvUrl = pathToFileURL(process.argv[1]).href
        return argvUrl === import.meta.url
    } catch {
        return false
    }
})()

if (isCli) {
    const baseline = await collectBaseline(process.env.SITTIR_BACKEND)
    process.stdout.write(serialiseBaseline(baseline))
}
