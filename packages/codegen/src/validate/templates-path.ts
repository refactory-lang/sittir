/**
 * Shared helpers for loading rule metadata from a templates path.
 *
 * A templates path is either:
 *  - A directory of per-rule `.jinja` files (feature 011 target layout).
 *    Separator / flank metadata lives INLINE in the body via the
 *    `| join("<sep>")` / `| joinWithTrailing(...)` filter forms — no
 *    sidecar.
 *  - A legacy `templates.yaml` file, retained for rollback / test
 *    fixtures.
 *
 * Four validators (`roundtrip`, `factory-roundtrip`, `renderable`,
 * `template-coverage`) used to duplicate their own versions of the
 * load-and-fallback logic — each with its own slightly-different bare
 * `catch {}` swallowing EACCES / EMFILE / permission errors. This
 * module consolidates the pattern so error handling lives in one place
 * and a future layout change (e.g. dropping the YAML fallback) touches
 * one file instead of four.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import type { RulesConfig, TemplateRule } from '@sittir/types'

/**
 * Returns true when `err` is a Node.js-shaped filesystem error carrying
 * a specific error code (ENOENT, ENOTDIR, etc.). Use this to narrow a
 * `catch` to the filesystem-not-present case without swallowing
 * permission errors (EACCES) or resource limits (EMFILE).
 */
export function isNodeError(err: unknown, code?: string): err is NodeJS.ErrnoException {
    if (!err || typeof err !== 'object') return false
    const candidate = err as { code?: unknown }
    if (typeof candidate.code !== 'string') return false
    return code === undefined || candidate.code === code
}

/**
 * Derive the set of rule kinds the renderer can handle from a templates
 * path. Directory layout: every `<kind>.jinja` under the dir (post-011).
 * YAML file layout: every top-level key under `rules:` (legacy).
 *
 * Missing path → empty set (caller decides whether that's fatal).
 * Malformed YAML → propagated (can't silently treat a broken file as
 * empty).
 */
export function deriveRuleKinds(templatesPath: string): Set<string> {
    const dirEntries = tryReadDirEntries(templatesPath)
    if (dirEntries !== null) {
        return new Set(
            dirEntries
                .filter((f) => f.endsWith('.jinja'))
                .map((f) => f.slice(0, -'.jinja'.length)),
        )
    }
    const content = tryReadFile(templatesPath)
    if (content === null) return new Set()
    const config = parseYaml(content) as RulesConfig
    return new Set(Object.keys(config.rules ?? {}))
}

/**
 * Load the full rule map from a templates path. The Jinja layout
 * returns each kind's `.jinja` body (with its `@generated` header
 * stripped) as the rule's `template` string — separator and flank
 * metadata live inline in the body. An optional `bodyReader` runs per-
 * body (used by template-coverage to reverse-translate Jinja back to
 * the legacy placeholder shape its field scanner understands).
 *
 * The YAML layout parses the file directly and returns its `rules` map.
 *
 * @param templatesPath Directory or legacy YAML file.
 * @param bodyReader Optional per-body transformation.
 */
export function loadRulesFromPath(
    templatesPath: string,
    bodyReader?: (kind: string, body: string) => TemplateRule,
): Record<string, TemplateRule> {
    const dirEntries = tryReadDirEntries(templatesPath)
    if (dirEntries !== null) {
        const rules: Record<string, TemplateRule> = {}
        for (const name of dirEntries) {
            if (!name.endsWith('.jinja')) continue
            const kind = name.slice(0, -'.jinja'.length)
            const body = readFileSync(join(templatesPath, name), 'utf-8')
            const stripped = body.replace(/^\{#[^#]*#\}\s*/, '')
            rules[kind] = bodyReader ? bodyReader(kind, stripped) : stripped
        }
        return rules
    }
    const content = tryReadFile(templatesPath)
    if (content === null) return {}
    const config = parseYaml(content) as RulesConfig
    return (config as { rules?: Record<string, TemplateRule> }).rules ?? {}
}

/**
 * Probe the path with `statSync`; return its directory listing when it
 * is a directory, `null` when it doesn't exist or isn't a directory.
 * Other filesystem errors (EACCES, EMFILE) propagate.
 */
function tryReadDirEntries(path: string): string[] | null {
    let stat: ReturnType<typeof statSync>
    try {
        stat = statSync(path)
    } catch (err) {
        if (isNodeError(err, 'ENOENT') || isNodeError(err, 'ENOTDIR')) return null
        throw err
    }
    if (!stat.isDirectory()) return null
    return readdirSync(path)
}

/**
 * Read a file, returning its contents or `null` when missing. Non-
 * missing read errors (EACCES, EMFILE, EIO) propagate.
 */
function tryReadFile(path: string): string | null {
    try {
        return readFileSync(path, 'utf-8')
    } catch (err) {
        if (isNodeError(err, 'ENOENT') || isNodeError(err, 'EISDIR')) return null
        throw err
    }
}
