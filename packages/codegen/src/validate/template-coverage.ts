/**
 * validate-template-coverage — every tree-sitter field declared on a kind
 * must be referenced somewhere in that kind's render template.
 *
 * Closes the gap between `validate-renderable` (which only checks that a
 * rule *exists*) and `validate-roundtrip` (which catches missing fields
 * indirectly, and only when the corpus happens to exercise the
 * field-bearing variant). This validator is a pure structural check:
 *
 *   For every kind K with declared fields [f1, f2, ...]:
 *     For every field fi:
 *       template(K) must contain `$FI` OR `$$$FI` OR
 *       must contain `$FI_CLAUSE` and rule(K) must define `fi_clause`
 *
 * Supertype kinds are skipped (no direct render path). Pure-leaf kinds
 * are skipped (no template). Kinds without a declared field set are
 * skipped. Variant-bearing rules are checked per-variant — a field
 * declared on the kind must appear in *every* variant template (or be
 * absorbed by that variant's clause keys).
 *
 * Literal-leak heuristic: a template containing doubled punctuation
 * runs like `////`, `&&&&`, `||||`, `;;;;` is almost always a walker
 * concat bug (the walker emitted two literal copies of a separator
 * because it recursed into both sides of a choice). These are flagged
 * as warnings — they don't block, but they surface the defect near
 * its source.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRawEntries } from './node-types-loader.ts';
import type { RawNodeEntry, RawFieldEntry } from './node-types-loader.ts';
import { loadRulesFromPath as loadRulesFromTemplatesPath } from './templates-path.ts';

/**
 * Load the rules map from either a legacy YAML file or a directory of
 * per-rule `.jinja` files (feature 011). For the Jinja layout each
 * file's body becomes the `template` string; clauses, variants, and
 * joinBy metadata aren't available at this level (they're baked into
 * the file body). So the coverage checker's detailed structural
 * assertions fall back gracefully when the Jinja layout is in use.
 */
/**
 * Convert a Jinja template body back to the legacy rule-object shape
 * the template-coverage checker expects. Preserves clause bodies as
 * sibling entries alongside the main `template` string so the
 * checker's `$FI_CLAUSE` + `fi_clause: body` references resolve.
 *
 * This is a read-only adapter — Jinja is authoritative on disk; we
 * never round-trip through this path for emission.
 */
function jinjaBodyToLegacyRule(body: string): TemplateRule {
	const clauses: Record<string, string> = {};
	// Extract `{% if <stem> %}<body>{% endif %}` blocks; capture the
	// body (with `{{ name }}` → `$NAME` applied) as a `<stem>_clause`
	// entry; replace the block with `$<STEM>_CLAUSE` in the main
	// template string.
	// Accept `{% if stem %}` and the filter-sugared variant
	// `{% if stem | isPresent %}` (cross-renderer emission, spec 013).
	// Also tolerate `{%- -%}` whitespace-trim markers on both sides.
	const withClauseRefs = body.replace(
		/\{%-?\s*if\s+([a-z_][a-z0-9_]*)(?:\s*\|\s*isPresent)?\s*-?%\}([\s\S]*?)\{%-?\s*endif\s*-?%\}/g,
		(_m, stem: string, clauseBody: string) => {
			clauses[`${stem}_clause`] = jinjaInterpolationsToLegacy(clauseBody);
			return `$${stem.toUpperCase()}_CLAUSE`;
		}
	);
	const template = jinjaInterpolationsToLegacy(withClauseRefs);
	if (Object.keys(clauses).length === 0) return template;
	return { template, ...clauses } as TemplateRule;
}

/**
 * Replace Jinja `{{ name }}` and `{{ name | <join-variant>("<sep>") }}`
 * interpolations with the legacy `$NAME` / `$$$NAME` placeholders the
 * coverage checker's regex-based field scanner understands. Any of the
 * sittir-registered join-variant filters (`join`, `joinWithTrailing`,
 * `joinWithLeading`, `joinWithFlanks`) signals a multi-valued slot
 * (maps to `$$$`); the bare form is single-valued (`$`). See
 * `packages/core/src/templates/nunjucks-env.ts:registerSittirFilters`
 * for the filter inventory the walker picks from.
 */
function jinjaInterpolationsToLegacy(body: string): string {
	return body.replace(
		/\{\{\s*([a-z_][a-z0-9_]*)(?:\s*\|\s*(join|joinWithTrailing|joinWithLeading|joinWithFlanks)\([^)]*\)|\s*\|\s*value)?\s*\}\}/g,
		(_m, name: string, joinFilter: string | undefined) => {
			// Multi-valued slot: one of the join-variant filters ⇒ `$$$`.
			// Single-valued slot: bare `{{ name }}` OR the `| value`
			// unwrap (which just coerces Option<String> → String) ⇒ `$`.
			const prefix = joinFilter ? '$$$' : '$';
			return `${prefix}${name.toUpperCase()}`;
		}
	);
}

function loadRulesFromPath(
	templatesPath: string
): Record<string, TemplateRule> {
	return loadRulesFromTemplatesPath(templatesPath, (_kind, body) =>
		jinjaBodyToLegacyRule(body)
	);
}
import type { TemplateRule, TemplateRuleObject } from '@sittir/types';

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

export interface TemplateCoverageResult {
	grammar: string;
	total: number;
	/** Kinds where every declared field is reachable in the template. */
	pass: number;
	/** Kinds with at least one unreferenced field. */
	fail: number;
	issues: CoverageIssue[];
}

export interface CoverageIssue {
	kind: string;
	/** 'missing-field' (field declared, not referenced) or 'literal-leak' (doubled separator). */
	type: 'missing-field' | 'literal-leak';
	/** Human-readable description. */
	message: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function validateTemplateCoverage(
	grammar: string,
	templatesPath: string
): TemplateCoverageResult {
	const entries = loadRawEntries(grammar);
	const rules = loadRulesFromPath(templatesPath);
	// Tree-sitter's `node-types.json` flattens nested-field-paths to the
	// top level: `field('outer', wrapper(seq(literals?, field('inner',
	// X))))` declares BOTH `outer` (whose runtime value is the
	// structural literal flanking `X`) AND `inner` as top-level fields
	// of the parent kind. simplify's hoist drops the OUTER `field`
	// wrapper so the inner field surfaces directly in the rule passed
	// to the template-walker (see `hoistInnerFieldsForTemplate` in
	// `compiler/simplify.ts`); the inner field then gets its placeholder
	// and renders correctly. The outer field stays in `node-types.json`
	// (tree-sitter still produces it at parse time), but its content is
	// now emitted via the template's structural-literal text — there is
	// no `$OUTER` placeholder to require. Skip those during coverage
	// checking. When `grammar.json` is absent (older fixtures),
	// `hoistedOuterByKind` is empty and the checker behaves as it did
	// before.
	const grammarJson = loadGrammarJson(grammar);
	const hoistedOuterByKind = grammarJson
		? computeHoistedOuterFields(grammarJson)
		: new Map<string, Set<string>>();

	const issues: CoverageIssue[] = [];
	let total = 0;
	let pass = 0;

	for (const entry of entries) {
		if (!entry.named) continue;
		// Supertypes have no direct rule — skipped by render dispatch.
		if (entry.subtypes && entry.subtypes.length > 0) continue;
		// Pure leaves take the text fast-path; no template to check.
		const hasFields = entry.fields && Object.keys(entry.fields).length > 0;
		const hasChildren = entry.children !== undefined;
		if (!hasFields && !hasChildren) continue;

		// Canonical-hidden architecture (Option Y): tree-sitter
		// node-types.json reports the visible alias-target name (`x`),
		// but the codegen-canonical template lives at `_x.jinja` for
		// hidden alias-source kinds. Fall back to the underscore form
		// when the visible name has no direct rule — `wrapNode` and
		// `render.ts` perform the same remap on the runtime side.
		const rule = rules[entry.type] ?? rules[`_${entry.type}`];
		if (rule === undefined) continue; // validate-renderable catches this.

		total++;
		const kindIssues = checkRule(
			entry,
			rule,
			hoistedOuterByKind.get(entry.type) ?? new Set()
		);
		if (kindIssues.length === 0) {
			pass++;
		} else {
			issues.push(...kindIssues);
		}
	}

	return { grammar, total, pass, fail: total - pass, issues };
}

// ---------------------------------------------------------------------------
// Per-kind check
// ---------------------------------------------------------------------------

/**
 * Compute the union of all placeholder names across every variant template
 * and every clause template body for a rule.
 *
 * @remarks
 * The coverage requirement is that the union of placeholders across every
 * variant covers every declared field — not that each variant individually
 * references every field. Clause bodies are part of the union because a field
 * can be referenced inside a clause expansion rather than in the top-level
 * template string.
 *
 * @param variants - The collected named template strings for the rule.
 * @param clauseTemplates - The clause key → template body map for the rule.
 * @returns A set of lowercased placeholder names found across all templates.
 */
function computeUnionPlaceholders(
	variants: NamedTemplate[],
	clauseTemplates: Record<string, string>
): Set<string> {
	const unionPlaceholders = new Set<string>();
	for (const { template } of variants) {
		for (const p of extractPlaceholders(template)) unionPlaceholders.add(p);
	}
	for (const body of Object.values(clauseTemplates)) {
		for (const p of extractPlaceholders(body)) unionPlaceholders.add(p);
	}
	return unionPlaceholders;
}

/**
 * Check each variant template for suspicious literal runs that indicate a
 * walker concat bug.
 *
 * @remarks
 * Runs of 4+ identical punctuation chars (e.g. `////`, `&&&&`) come from the
 * walker recursing into both sides of a choice and concatenating. Each variant
 * is checked independently, scoped to that template string rather than the
 * union, so the issue is reported with its variant label.
 *
 * @param entry - The raw node entry (for `kind` in the issue message).
 * @param variants - The named template variants to inspect.
 * @returns An array of `literal-leak` CoverageIssues, one per offending variant.
 */
function checkVariantsForLiteralLeaks(
	entry: RawNodeEntry,
	variants: NamedTemplate[]
): CoverageIssue[] {
	const issues: CoverageIssue[] = [];
	for (const { label, template } of variants) {
		const leak = /([/&|;+\-*=<>!?~^%])\1{3,}/.exec(template);
		if (leak) {
			const label_ = label ? ` (variant '${label}')` : '';
			issues.push({
				kind: entry.type,
				type: 'literal-leak',
				message: `template contains suspicious literal run ${JSON.stringify(leak[0])}${label_} — likely walker concat bug: ${JSON.stringify(template)}`
			});
		}
	}
	return issues;
}

function checkRule(
	entry: RawNodeEntry,
	rule: TemplateRule,
	hoistedOuterFields: Set<string>
): CoverageIssue[] {
	const fields = entry.fields ?? {};
	const fieldNames = Object.keys(fields);
	const issues: CoverageIssue[] = [];

	const variants = collectTemplates(rule);
	if (variants.length === 0) return issues; // no inspectable template (shouldn't happen)

	// $TEXT fallback kinds (e.g. rust's `raw_string_literal` post
	// externals-plumbing, python's f-strings via external-boundaries)
	// render as the node's native source span verbatim — field slots
	// are by design unused because the template doesn't reference
	// them. Skip field-coverage enforcement for these.
	if (variants.length === 1) {
		const body = variants[0]!.template.trim();
		if (body === '{{ text }}' || body === '$TEXT') return issues;
	}

	const ruleObj = isObjectRule(rule) ? rule : undefined;
	const clauseKeys = ruleObj ? collectClauseKeys(ruleObj) : new Set<string>();
	const clauseTemplates = ruleObj ? collectClauseTemplates(ruleObj) : {};

	const unionPlaceholders = computeUnionPlaceholders(variants, clauseTemplates);

	for (const fname of fieldNames) {
		if (
			isFieldReferenced(fname, unionPlaceholders, clauseKeys, clauseTemplates)
		)
			continue;
		// Hoisted-outer flatten artifact: `fname` is declared on the
		// kind in `node-types.json` but our simplify hoist drops the
		// `field('fname', ...)` wrapper from the rule passed to the
		// template-walker. The wrapper's structural-literal content is
		// preserved verbatim in the template (`extends`, `,`, …) and
		// the inner field that triggered the hoist gets its own
		// placeholder — `fname` is transitively covered by the
		// surrounding template text. See `hoistInnerFieldsForTemplate`
		// in `compiler/simplify.ts`.
		if (hoistedOuterFields.has(fname)) continue;
		// Show all variant bodies so the caller can see which one(s) to patch.
		const bodies =
			variants.length === 1
				? JSON.stringify(variants[0]!.template)
				: variants
						.map((v) => `${v.label}=${JSON.stringify(v.template)}`)
						.join(' | ');
		issues.push({
			kind: entry.type,
			type: 'missing-field',
			message: `field '${fname}' declared but not referenced in any template: ${bodies}`
		});
	}

	issues.push(...checkVariantsForLiteralLeaks(entry, variants));

	return issues;
}

// ---------------------------------------------------------------------------
// Template/rule shape helpers
// ---------------------------------------------------------------------------

function isObjectRule(rule: TemplateRule): rule is TemplateRuleObject {
	return rule !== null && typeof rule === 'object' && !Array.isArray(rule);
}

interface NamedTemplate {
	/** Variant label (empty string for plain `template:`). */
	label: string;
	template: string;
}

/**
 * Pull every renderable template string out of a rule: simple string,
 * string[], `template:` on an object, or each entry under `variants:`.
 * Clause keys are excluded here (they're aggregated separately so we can
 * follow them from placeholder references).
 */
function collectTemplates(rule: TemplateRule): NamedTemplate[] {
	if (typeof rule === 'string') return [{ label: '', template: rule }];
	const out: NamedTemplate[] = [];
	const obj = rule as TemplateRuleObject;
	if (typeof obj.template === 'string')
		out.push({ label: '', template: obj.template });
	if (obj.variants && typeof obj.variants === 'object') {
		for (const [name, tmpl] of Object.entries(obj.variants)) {
			if (typeof tmpl === 'string') out.push({ label: name, template: tmpl });
		}
	}
	return out;
}

function collectClauseKeys(obj: TemplateRuleObject): Set<string> {
	const keys = new Set<string>();
	for (const k of Object.keys(obj)) {
		if (
			k === 'template' ||
			k === 'variants' ||
			k === 'joinBy' ||
			k === 'joinByField' ||
			k === 'detect'
		)
			continue;
		const v = (obj as Record<string, unknown>)[k];
		if (typeof v === 'string') keys.add(k);
	}
	return keys;
}

function collectClauseTemplates(
	obj: TemplateRuleObject
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const k of Object.keys(obj)) {
		if (
			k === 'template' ||
			k === 'variants' ||
			k === 'joinBy' ||
			k === 'joinByField' ||
			k === 'detect'
		)
			continue;
		const v = (obj as Record<string, unknown>)[k];
		if (typeof v === 'string') out[k] = v;
	}
	return out;
}

// ---------------------------------------------------------------------------
// Placeholder extraction
// ---------------------------------------------------------------------------

/**
 * Extract every `$NAME` / `$$$NAME` placeholder from a template string.
 * Returns the lowercased names — matches how render.ts normalises lookup.
 */
function extractPlaceholders(template: string): Set<string> {
	const names = new Set<string>();
	// Match `$NAME` or `$$$NAME`. Name runs of [A-Z_][A-Z0-9_]*.
	const re = /\$+([A-Z_][A-Z0-9_]*)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(template)) !== null) {
		names.add(m[1]!.toLowerCase());
	}
	return names;
}

/**
 * Check whether a field is referenced via the `$FIELD_CLAUSE` placeholder
 * pattern, where both the placeholder and its clause key are present.
 *
 * @remarks
 * A clause reference is accepted even if the clause body just uses `$FIELD` —
 * render.ts will emit nothing when the field is absent, but the field is still
 * reachable in principle.
 *
 * @param fieldName - The snake_case field name to check.
 * @param placeholders - The union set of placeholder names from the template.
 * @param clauseKeys - The set of clause key names defined on the rule object.
 * @returns True if the field is referenced via a `_clause` placeholder + key pair.
 */
function isReferencedViaClausePlaceholder(
	fieldName: string,
	placeholders: Set<string>,
	clauseKeys: Set<string>
): boolean {
	const clauseKey = `${fieldName}_clause`;
	return placeholders.has(clauseKey) && clauseKeys.has(clauseKey);
}

/**
 * Check whether a field is referenced inside any clause body template,
 * even without a matching `_clause`-named placeholder in the top-level template.
 *
 * @remarks
 * A `value_clause: =$VALUE` on a kind with a `value` field counts as a
 * reference even without a `$VALUE_CLAUSE` placeholder in the main template.
 * Walk every clause template body and check for the field name as a placeholder.
 *
 * @param fieldName - The snake_case field name to check.
 * @param clauseTemplates - Map of clause key → clause body template string.
 * @returns True if any clause body template references the field.
 */
function isReferencedInClauseBody(
	fieldName: string,
	clauseTemplates: Record<string, string>
): boolean {
	for (const body of Object.values(clauseTemplates)) {
		if (extractPlaceholders(body).has(fieldName)) return true;
	}
	return false;
}

function isFieldReferenced(
	fieldName: string,
	placeholders: Set<string>,
	clauseKeys: Set<string>,
	clauseTemplates: Record<string, string>
): boolean {
	// 1. Direct reference: `$FIELD` or `$$$FIELD`.
	if (placeholders.has(fieldName)) return true;

	// 2. Clause placeholder reference.
	if (isReferencedViaClausePlaceholder(fieldName, placeholders, clauseKeys))
		return true;

	// 3. Clause body reference.
	if (isReferencedInClauseBody(fieldName, clauseTemplates)) return true;

	return false;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatTemplateCoverageReport(
	result: TemplateCoverageResult
): string {
	const lines: string[] = [];
	const icon = result.fail === 0 ? 'v' : 'x';
	lines.push(
		`  ${icon} ${result.pass}/${result.total} kinds have full template coverage` +
			` (${result.fail} failing, ${result.issues.length} issues)`
	);
	const shown = result.issues.slice(0, 20);
	for (const i of shown) {
		lines.push(
			`    ${i.type === 'literal-leak' ? '!' : 'x'} ${i.kind}: ${i.message}`
		);
	}
	if (result.issues.length > shown.length) {
		lines.push(`    ... and ${result.issues.length - shown.length} more`);
	}
	return lines.join('\n');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _FieldUse = RawFieldEntry; // keep import alive for docs

// ---------------------------------------------------------------------------
// Hoisted-outer-field detection — the validator's complement to
// simplify's `hoistInnerFieldsForTemplate` pass.
// ---------------------------------------------------------------------------

/**
 * Compute, for each visible rule kind in `grammar`, the set of OUTER
 * `field` names whose `field('outer', ...)` wrapper our simplify hoist
 * drops from the rule passed to the template-walker. Those outer fields
 * are still declared in `node-types.json` (tree-sitter produces them at
 * parse time), but their content surfaces in the template via the
 * structural-literal text + the inner field's placeholder — there is no
 * `$OUTER` placeholder to require.
 *
 * Mirrors the predicate inside `compiler/simplify.ts`'s
 * `hoistInnerFieldOutOfFieldWrapper`. Walks the source `grammar.json`
 * (the SAME structural source the simplify pipeline reads via Evaluate)
 * so the two derivations stay in lock-step.
 *
 * @remarks
 * The hoist condition (mirrored here):
 *   1. Field's content is NOT a direct field (`field('outer', field('inner'…))`
 *      is handled by the existing single-content-wrapper hoist).
 *   2. Field's content carries an inner `field()` reachable through
 *      structural wrappers (`optional`/`repeat*`/`choice`/seq/aliases of
 *      hidden helpers) without crossing into another field's content,
 *      a visible symbol, supertype, named alias, or terminal.
 *   3. Field's content has NO named-symbol / supertype sibling of the
 *      inner field (those would lose their outer-field label).
 */
function computeHoistedOuterFields(
	grammar: GrammarJson
): Map<string, Set<string>> {
	const rules = grammar.rules;
	const out = new Map<string, Set<string>>();
	for (const kind of Object.keys(rules)) {
		if (kind.startsWith('_')) continue;
		const fields = new Set<string>();
		collectHoistedOuterFields(rules[kind], rules, fields, new Set());
		out.set(kind, fields);
	}
	return out;
}

/**
 * Walk a rule node, recording every FIELD whose simplify-hoist
 * condition fires. Hidden `_*` symbols are inlined (their bodies are
 * spliced into the parent at parse time, so any field hoist they
 * trigger applies to the parent kind). Visible symbols and named
 * aliases stop the walk — those are distinct parse-tree nodes with
 * their own field namespace.
 */
function collectHoistedOuterFields(
	node: unknown,
	rules: Record<string, unknown>,
	out: Set<string>,
	visited: Set<string>
): void {
	if (!node || typeof node !== 'object') return;
	if (isField(node)) {
		if (fieldHoistsViaSimplify(node.content, rules)) out.add(node.name);
		// Recurse into the FIELD's content too — a field deeper inside
		// can also hoist relative to ITS parent (which here is `node`,
		// not the visible kind we started from). We still emit only
		// top-level field names on the visible kind, so the recursion
		// is for transitive coverage of hidden-helper inlining.
		collectHoistedOuterFields(node.content, rules, out, visited);
		return;
	}
	if (isAlias(node)) {
		if (node.named) return;
		collectHoistedOuterFields(node.content, rules, out, visited);
		return;
	}
	if (isSymbol(node)) {
		if (!node.name.startsWith('_')) return;
		if (visited.has(node.name)) return;
		const target = rules[node.name];
		if (target === undefined) return;
		const next = new Set(visited);
		next.add(node.name);
		collectHoistedOuterFields(target, rules, out, next);
		return;
	}
	const n = node as { content?: unknown; members?: unknown[] };
	if (n.content !== undefined)
		collectHoistedOuterFields(n.content, rules, out, visited);
	if (Array.isArray(n.members))
		for (const m of n.members)
			collectHoistedOuterFields(m, rules, out, visited);
}

/**
 * Mirror of `hoistInnerFieldOutOfFieldWrapper`'s predicate, but
 * operating on tree-sitter's grammar.json node shape (UPPERCASE
 * discriminants) instead of the internal `Rule` union. Returns true
 * when the outer field would be dropped by the simplify hoist.
 */
function fieldHoistsViaSimplify(
	content: unknown,
	rules: Record<string, unknown>
): boolean {
	if (!content || typeof content !== 'object') return false;
	if (isField(content)) return false; // direct field-of-field, different hoist path
	if (!hasInnerFieldAtExposableDepthGrammar(content, rules, new Set()))
		return false;
	if (hasNamedSiblingOfInnerFieldGrammar(content)) return false;
	return true;
}

/**
 * Mirror of `hasInnerFieldAtExposableDepth` for grammar.json shapes.
 * Recurses through structural wrappers (OPTIONAL / REPEAT / REPEAT1 /
 * CHOICE / SEQ / PREC* / TOKEN / IMMEDIATE_TOKEN) AND through hidden
 * `_*` symbol references (tree-sitter inlines them at parse time so
 * any inner field they carry surfaces on the enclosing kind).
 */
function hasInnerFieldAtExposableDepthGrammar(
	node: unknown,
	rules: Record<string, unknown>,
	visited: Set<string>
): boolean {
	if (!node || typeof node !== 'object') return false;
	if (isField(node)) return true;
	if (isSymbol(node)) {
		if (!node.name.startsWith('_')) return false;
		if (visited.has(node.name)) return false;
		const target = rules[node.name];
		if (target === undefined) return false;
		const next = new Set(visited);
		next.add(node.name);
		return hasInnerFieldAtExposableDepthGrammar(target, rules, next);
	}
	if (isAlias(node)) {
		if (node.named) return false;
		return hasInnerFieldAtExposableDepthGrammar(node.content, rules, visited);
	}
	const n = node as { type?: string; content?: unknown; members?: unknown[] };
	// Stop at terminal-bearing or schema-isolating wrappers — STRING /
	// PATTERN / BLANK / ALIAS{named:true} (handled above).
	if (n.type === 'STRING' || n.type === 'PATTERN' || n.type === 'BLANK')
		return false;
	if (
		n.content !== undefined &&
		hasInnerFieldAtExposableDepthGrammar(n.content, rules, visited)
	)
		return true;
	if (Array.isArray(n.members)) {
		for (const m of n.members) {
			if (hasInnerFieldAtExposableDepthGrammar(m, rules, visited)) return true;
		}
	}
	return false;
}

/**
 * Mirror of `hasNamedSiblingOfInnerField` for grammar.json shapes.
 * Walks SEQ members looking for a position that mixes a FIELD with
 * a NAMED reference (visible SYMBOL or named ALIAS) at the SEQ level
 * — that's the case where the outer field would lose a sibling's
 * runtime label if dropped.
 */
function hasNamedSiblingOfInnerFieldGrammar(node: unknown): boolean {
	if (!node || typeof node !== 'object') return false;
	const n = node as { type?: string; members?: unknown[]; content?: unknown };
	if (n.type === 'SEQ' && Array.isArray(n.members)) {
		const hasField = n.members.some((m) => isField(m));
		if (hasField) {
			for (const m of n.members) {
				if (isField(m)) continue;
				if (isNamedReferenceGrammar(m)) return true;
			}
		}
		return n.members.some(hasNamedSiblingOfInnerFieldGrammar);
	}
	if (n.type === 'CHOICE' && Array.isArray(n.members)) {
		return n.members.some(hasNamedSiblingOfInnerFieldGrammar);
	}
	if (n.content !== undefined) {
		return hasNamedSiblingOfInnerFieldGrammar(n.content);
	}
	return false;
}

/**
 * Is `node` a reference tree-sitter would attach a field label to at
 * parse time? Visible SYMBOLs and named ALIASes qualify. Hidden `_*`
 * symbols don't — they inline transparently. Strings / patterns /
 * other anonymous tokens don't — they don't carry a parse-tree node.
 * Walks through structural passthroughs so wrapped references
 * (OPTIONAL{SYMBOL}, REPEAT{SYMBOL}, …) are still detected.
 */
function isNamedReferenceGrammar(node: unknown): boolean {
	if (!node || typeof node !== 'object') return false;
	if (isSymbol(node)) return !node.name.startsWith('_');
	if (isAlias(node)) return node.named === true;
	const n = node as { type?: string; content?: unknown };
	if (
		n.type === 'OPTIONAL' ||
		n.type === 'REPEAT' ||
		n.type === 'REPEAT1' ||
		n.type === 'TOKEN' ||
		n.type === 'IMMEDIATE_TOKEN' ||
		n.type === 'PREC' ||
		n.type === 'PREC_LEFT' ||
		n.type === 'PREC_RIGHT' ||
		n.type === 'PREC_DYNAMIC'
	) {
		return n.content !== undefined && isNamedReferenceGrammar(n.content);
	}
	return false;
}

// ---------------------------------------------------------------------------
// grammar.json loader (was in `validate/grammar-fields.ts`; inlined here
// after the cluster D workaround retired on the simplify-hoist landing).
// ---------------------------------------------------------------------------

const packagesDir = fileURLToPath(new URL('../../../', import.meta.url));

interface GrammarJson {
	rules: Record<string, unknown>;
}

interface FieldNode {
	type: 'FIELD';
	name: string;
	content: unknown;
}
interface SymbolNode {
	type: 'SYMBOL';
	name: string;
}
interface AliasNode {
	type: 'ALIAS';
	value: string;
	named?: boolean;
	content: unknown;
}

function isField(n: unknown): n is FieldNode {
	return (
		!!n && typeof n === 'object' && (n as { type?: unknown }).type === 'FIELD'
	);
}
function isSymbol(n: unknown): n is SymbolNode {
	return (
		!!n && typeof n === 'object' && (n as { type?: unknown }).type === 'SYMBOL'
	);
}
function isAlias(n: unknown): n is AliasNode {
	return (
		!!n && typeof n === 'object' && (n as { type?: unknown }).type === 'ALIAS'
	);
}

/**
 * Load a grammar's `grammar.json` from `packages/<grammar>/.sittir/src/`.
 * Returns null when the file isn't present (older test fixtures, fresh
 * checkouts where codegen hasn't run) — caller should treat the absence
 * as "no transitive-coverage data; fall back to strict checking".
 */
function loadGrammarJson(grammar: string): GrammarJson | null {
	const path = join(packagesDir, grammar, '.sittir', 'src', 'grammar.json');
	if (!existsSync(path)) return null;
	return JSON.parse(readFileSync(path, 'utf8')) as GrammarJson;
}
