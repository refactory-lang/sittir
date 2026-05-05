/**
 * Shared helpers for loading rule metadata from a templates directory.
 *
 * A templates path is a directory of per-rule `.jinja` files (feature 011).
 * Separator / flank metadata lives INLINE in the body via the
 * `| join("<sep>")` / `| joinWithTrailing(...)` filter forms — no sidecar.
 *
 * The legacy `templates.yaml` format was retired in 1d.xiv. This module
 * no longer carries the YAML fallback path; all four validators
 * (`roundtrip`, `factory-roundtrip`, `renderable`, `template-coverage`)
 * read `.jinja` files exclusively.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { TemplateRule } from '@sittir/types';

/**
 * Returns true when `err` is a Node.js-shaped filesystem error carrying
 * a specific error code (ENOENT, ENOTDIR, etc.). Use this to narrow a
 * `catch` to the filesystem-not-present case without swallowing
 * permission errors (EACCES) or resource limits (EMFILE).
 */
export function isNodeError(
	err: unknown,
	code?: string
): err is NodeJS.ErrnoException {
	if (!err || typeof err !== 'object') return false;
	const candidate = err as { code?: unknown };
	if (typeof candidate.code !== 'string') return false;
	return code === undefined || candidate.code === code;
}

/**
 * Derive the set of rule kinds the renderer can handle from a templates
 * directory. Every `<kind>.jinja` file in the directory is a rule kind.
 *
 * Missing path → empty set (caller decides whether that's fatal).
 */
export function deriveRuleKinds(templatesPath: string): Set<string> {
	const dirEntries = tryReadDirEntries(templatesPath);
	if (dirEntries === null) return new Set();
	return new Set(
		dirEntries
			.filter((f) => f.endsWith('.jinja'))
			.map((f) => f.slice(0, -'.jinja'.length))
	);
}

/**
 * Load the full rule map from a templates directory. Returns each kind's
 * `.jinja` body (with its `@generated` header stripped) as the rule's
 * `template` string. An optional `bodyReader` runs per-body (used by
 * template-coverage to reverse-translate Jinja back to the legacy
 * placeholder shape its field scanner understands).
 *
 * @param templatesPath Directory of `.jinja` files.
 * @param bodyReader Optional per-body transformation.
 */
export function loadRulesFromPath(
	templatesPath: string,
	bodyReader?: (kind: string, body: string) => TemplateRule
): Record<string, TemplateRule> {
	const dirEntries = tryReadDirEntries(templatesPath);
	if (dirEntries === null) return {};
	const rules: Record<string, TemplateRule> = {};
	for (const name of dirEntries) {
		if (!name.endsWith('.jinja')) continue;
		const kind = name.slice(0, -'.jinja'.length);
		const body = readFileSync(join(templatesPath, name), 'utf-8');
		const stripped = body.replace(/^\{#[^#]*#\}\s*/, '');
		rules[kind] = bodyReader ? bodyReader(kind, stripped) : stripped;
	}
	return rules;
}

/**
 * Probe the path with `statSync`; return its directory listing when it
 * is a directory, `null` when it doesn't exist or isn't a directory.
 * Other filesystem errors (EACCES, EMFILE) propagate.
 */
function tryReadDirEntries(path: string): string[] | null {
	let stat: ReturnType<typeof statSync>;
	try {
		stat = statSync(path);
	} catch (err) {
		if (isNodeError(err, 'ENOENT') || isNodeError(err, 'ENOTDIR')) return null;
		throw err;
	}
	if (!stat.isDirectory()) return null;
	return readdirSync(path);
}
