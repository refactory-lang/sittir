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
import type { TemplateRule } from '@sittir/types';
/**
 * Returns true when `err` is a Node.js-shaped filesystem error carrying
 * a specific error code (ENOENT, ENOTDIR, etc.). Use this to narrow a
 * `catch` to the filesystem-not-present case without swallowing
 * permission errors (EACCES) or resource limits (EMFILE).
 */
export declare function isNodeError(err: unknown, code?: string): err is NodeJS.ErrnoException;
/**
 * Derive the set of rule kinds the renderer can handle from a templates
 * directory. Every `<kind>.jinja` file in the directory is a rule kind.
 *
 * Missing path → empty set (caller decides whether that's fatal).
 */
export declare function deriveRuleKinds(templatesPath: string): Set<string>;
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
export declare function loadRulesFromPath(templatesPath: string, bodyReader?: (kind: string, body: string) => TemplateRule): Record<string, TemplateRule>;
//# sourceMappingURL=templates-path.d.ts.map