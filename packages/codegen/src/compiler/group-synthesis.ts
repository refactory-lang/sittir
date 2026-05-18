/**
 * Group-lift synthesis — implements the `groups:` override block per
 * docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md.
 *
 * Pure module — no I/O, no side effects on inputs.
 */

import type { Rule } from './rule.ts';
import { replaceAtPath } from './rule.ts';

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Walk a path string ('1/1/0/1/3') into a rule tree, returning the
 * sub-rule at that path. Path segments index into:
 *   - seq.members[i]
 *   - choice.members[i]
 *   - wrapper.content (path '0' for optional/repeat/repeat1/field/token/
 *     alias/variant/clause/group)
 *
 * Throws if any segment fails to address. Mirrors path semantics used
 * by `polymorphs:` / `transforms:` in `overrides.ts`.
 */
export function resolveGroupPath(rule: Rule, path: string): Rule {
	const segments = path.split('/').filter((s) => s.length > 0);
	let cur: Rule = rule;
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i]!;
		const idx = parseInt(seg, 10);
		if (Number.isNaN(idx)) {
			throw new Error(`group path '${path}' has non-numeric segment '${seg}' at position ${i}`);
		}
		cur = stepInto(cur, idx, path);
	}
	return cur;
}

function stepInto(rule: Rule, idx: number, fullPath: string): Rule {
	switch (rule.type) {
		case 'seq':
		case 'choice': {
			const m = rule.members[idx];
			if (!m) {
				throw new Error(
					`group path '${fullPath}' does not resolve: index ${idx} out of range in ${rule.type} of ${rule.members.length} members`
				);
			}
			return m;
		}
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'field':
		case 'token':
		case 'alias':
		case 'variant':
		case 'clause':
		case 'group':
			if (idx !== 0) {
				throw new Error(
					`group path '${fullPath}' does not resolve: index ${idx} invalid for wrapper '${rule.type}' (only 0 is content)`
				);
			}
			return (rule as { content: Rule }).content;
		default:
			throw new Error(
				`group path '${fullPath}' does not resolve: cannot descend into rule of type '${rule.type}'`
			);
	}
}

export interface DeriveSynthesizedNameArgs {
	parentKind: string;
	path: string;
	discriminator: string;
	polymorphs: Record<string, Record<string, string> | undefined>;
}

/**
 * Compute the synthesized hidden kind name for a group lift.
 *
 * Rule: `_<parent>` + for each path-prefix that ALSO appears as a key
 * in polymorphs[parent], append `_<variantName>` + `_<discriminator>`.
 *
 * Polymorph prefixes are matched by string prefix of the slash-joined
 * path. polymorphs['1'] matches lift paths '1', '1/2', '1/2/3' etc.
 * polymorphs['1/2'] matches '1/2', '1/2/3' etc.
 */
export function deriveSynthesizedName(args: DeriveSynthesizedNameArgs): string {
	const { parentKind, path, discriminator, polymorphs } = args;
	const polymorphsForKind = polymorphs[parentKind] ?? {};
	const segments = path.split('/').filter((s) => s.length > 0);

	const contributions: string[] = [];
	for (let i = 1; i <= segments.length; i++) {
		const prefix = segments.slice(0, i).join('/');
		if (prefix in polymorphsForKind) {
			contributions.push(polymorphsForKind[prefix]!);
		}
	}

	// When parentKind already starts with '_' (hidden rule), use it as-is
	// as the base; otherwise prepend '_' to canonicalize.
	const base = parentKind.startsWith('_') ? parentKind : '_' + parentKind;
	return [base, ...contributions, discriminator].join('_');
}

export interface ValidateGroupsArgs {
	groups: Record<string, Record<string, string> | undefined>;
	polymorphs: Record<string, Record<string, string> | undefined>;
	rules: Record<string, Rule>;
	warn?: (msg: string) => void;
}

/**
 * Validate all groups config at config-load time. Throws on E1-E5,
 * warns on E6. See spec §"Error handling" for the full taxonomy.
 */
export function validateGroupsConfig(args: ValidateGroupsArgs): void {
	const { groups, polymorphs, rules, warn } = args;
	const emitWarn = warn ?? ((msg: string) => console.warn(`[groups] ${msg}`));

	for (const [kind, lifts] of Object.entries(groups)) {
		if (!lifts) continue;
		const root = rules[kind];
		if (!root) {
			throw new Error(`groups['${kind}']: kind not in rule map`);
		}
		const polysForKind = polymorphs[kind] ?? {};
		const liftPaths = Object.keys(lifts);

		for (const path of liftPaths) {
			const discriminator = lifts[path]!;

			let target: Rule;
			try {
				target = resolveGroupPath(root, path);
			} catch (e) {
				throw new Error(`groups['${kind}']['${path}']: ${(e as Error).message}`);
			}

			if (discriminator.length === 0) {
				throw new Error(`groups['${kind}']['${path}']: discriminator must be a non-empty identifier`);
			}
			if (!IDENTIFIER_RE.test(discriminator)) {
				throw new Error(
					`groups['${kind}']['${path}']: discriminator '${discriminator}' is not a valid identifier`
				);
			}

			for (const polyPath of Object.keys(polysForKind)) {
				if (polyPath === path) {
					throw new Error(
						`groups['${kind}']['${path}'] and polymorphs['${kind}']['${polyPath}'] target the same position; pick one`
					);
				}
				if (isAncestorPath(path, polyPath)) {
					const synName = deriveSynthesizedName({ parentKind: kind, path, discriminator, polymorphs });
					throw new Error(
						`groups['${kind}']['${path}'] would lift content containing polymorphs['${kind}']['${polyPath}']; ` +
						`rewrite the inner polymorph relative to the lifted kind (${synName}) or remove the overlapping entry`
					);
				}
			}

			for (const otherPath of liftPaths) {
				if (otherPath === path) continue;
				if (isAncestorPath(path, otherPath)) {
					throw new Error(
						`groups['${kind}']['${path}'] contains another group lift at '${otherPath}'; nested group lifts are not supported`
					);
				}
			}

			const synthName = deriveSynthesizedName({ parentKind: kind, path, discriminator, polymorphs });
			if (synthName in rules) {
				throw new Error(
					`groups['${kind}']['${path}'] would synthesize ${synthName}, but a rule with that name already exists; pick a different discriminator`
				);
			}

			if (!hasStructuralMember(target)) {
				emitWarn(
					`groups['${kind}']['${path}']: lifted body has no structural members (purely literal/punctuation content)`
				);
			}
		}
	}
}

function isAncestorPath(ancestor: string, descendant: string): boolean {
	if (ancestor === descendant) return false;
	const a = ancestor.split('/');
	const d = descendant.split('/');
	if (a.length >= d.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== d[i]) return false;
	}
	return true;
}

function hasStructuralMember(rule: Rule): boolean {
	switch (rule.type) {
		case 'field':
		case 'symbol':
		case 'supertype':
			return true;
		case 'seq':
		case 'choice':
			return rule.members.some(hasStructuralMember);
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'token':
		case 'alias':
		case 'variant':
		case 'clause':
		case 'group':
			return hasStructuralMember((rule as { content: Rule }).content);
		default:
			return false;
	}
}

export interface ApplyGroupOverridesArgs {
	rules: Record<string, Rule>;
	groups: Record<string, Record<string, string> | undefined>;
	polymorphs: Record<string, Record<string, string> | undefined>;
	warn?: (msg: string) => void;
}

export interface ApplyGroupOverridesResult {
	rules: Record<string, Rule>;
	synthesizedKinds: readonly string[];
}

/**
 * Apply all `groups:` lifts. Pure transform — input rules are not
 * mutated; a new rules map is returned with lifted bodies registered
 * under their synthesized kind names and parent bodies rewritten to
 * reference them.
 *
 * Wrapper handling: when the lift target is wrapped (`optional` /
 * `repeat` / `repeat1`), only the wrapper's content is moved into the
 * synthesized kind. The wrapper stays at the parent's lift position
 * with the synthesized symbol ref inside. This preserves cardinality
 * semantics at the parent.
 */
export function applyGroupOverrides(args: ApplyGroupOverridesArgs): ApplyGroupOverridesResult {
	validateGroupsConfig(args);

	const newRules: Record<string, Rule> = { ...args.rules };
	const synthesizedKinds: string[] = [];

	for (const [kind, lifts] of Object.entries(args.groups)) {
		if (!lifts || Object.keys(lifts).length === 0) continue;
		const sortedPaths = Object.keys(lifts).sort((a, b) => b.length - a.length); // deep first
		let parentBody = clone(newRules[kind]!);

		for (const path of sortedPaths) {
			const discriminator = lifts[path]!;
			const synName = deriveSynthesizedName({
				parentKind: kind, path, discriminator, polymorphs: args.polymorphs
			});
			const target = resolveGroupPath(parentBody, path);
			const { liftedBody, replacement } = liftRule(target, synName, discriminator);

			parentBody = replaceAtPath(parentBody, path, replacement);
			newRules[synName] = liftedBody;
			synthesizedKinds.push(synName);
		}

		newRules[kind] = parentBody;
	}

	return { rules: newRules, synthesizedKinds };
}

function liftRule(target: Rule, synName: string, _discriminator: string): { liftedBody: Rule; replacement: Rule } {
	const synSym = { type: 'symbol' as const, name: synName, source: 'group-lift' as const };
	// (_discriminator kept for future use; the current implementation does not use it.
	// The discriminator participates only in the synthesized kind name component.)

	switch (target.type) {
		case 'optional':
			return {
				liftedBody: target.content,
				replacement: { type: 'optional', content: synSym } as Rule
			};
		case 'repeat':
			return {
				liftedBody: target.content,
				replacement: { type: 'repeat', content: synSym, separator: target.separator, trailing: target.trailing, leading: target.leading } as Rule
			};
		case 'repeat1':
			return {
				liftedBody: target.content,
				replacement: { type: 'repeat1', content: synSym, separator: target.separator, trailing: target.trailing, leading: target.leading } as Rule
			};
		default:
			return { liftedBody: target, replacement: synSym };
	}
}

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

// ---------------------------------------------------------------------------
// stampStaticExternalAltDefs — inline string() alt-def bodies into rule trees
// ---------------------------------------------------------------------------

/**
 * Stamp static externalAltDef entries into rule bodies.
 *
 * For each externalAltDef entry with a `string(lit)` body, walk the
 * rule map and replace every occurrence of:
 *   - `SYMBOL(x)` (bare)
 *   - `FIELD(name, SYMBOL(x))` (field-wrapped)
 *   - `FIELD(name, ALIAS(SYMBOL(x)))` (alias-wrapped — any depth)
 * with `STRING(lit)` at the same position. Pure transform — input rule
 * map not mutated.
 *
 * Symbol resolution is transitive: when `x` itself is not in `altDefs`
 * but `rules[x]` is a `StringRule` whose value matches an alt-def literal,
 * the stamp fires. This handles post-evaluate renaming — evaluate's
 * `synthesizeFieldEnumRules` replaces `field(n, SYMBOL(altDef))` with
 * `field(n, SYMBOL(_parentKind_fieldName))` where the new hidden rule
 * has the same `string` body as the original alt-def entry.
 *
 * After this pass, downstream phases (slot derivation, template walker,
 * factory emitter, from emitter) see bare string literals at those
 * positions and treat them as inline mandatory literals in seq context —
 * the same as how `seq('mod', $.name)` renders `mod {{ name }}` with
 * `mod` stamped inline.
 */
export function stampStaticExternalAltDefs(
	rules: Record<string, Rule>,
	altDefs: Record<string, Rule>
): Record<string, Rule> {
	// Build the stamp lookup: altDef-key → literal value, for entries that
	// are single string() bodies.
	const altStamps: Record<string, string> = {};
	// Blank-bodied altDef entries: zero-width-equivalent. References get
	// replaced with `{ type: 'choice', members: [] }` (the blank sentinel),
	// which the choice() collapse in `rewriteRuleForStamp` lowers to
	// `optional(other)` when paired with another member. Use case:
	// tree-sitter externals that fire invisibly at runtime (e.g. ASI's
	// `_automatic_semicolon`). The slot-model look-through in node-map.ts
	// propagates this optionality up to any SYMBOL ref pointing at the
	// now-optional-bodied wrapper rule (`_semicolon`).
	const blankStamps = new Set<string>();
	for (const [sym, body] of Object.entries(altDefs)) {
		if (body.type === 'string') altStamps[sym] = body.value;
		else if (isBlankRule(body)) blankStamps.add(sym);
	}
	if (Object.keys(altStamps).length === 0 && blankStamps.size === 0) return rules;

	// Build symToLit: symbol-name → literal to stamp.
	// Includes:
	//   1. The original altDef key names (exact match).
	//   2. Names whose string body matches an altDef value AND whose name
	//      ends with the altDef key (handling evaluate's synthesized renames:
	//      `synthesizeFieldEnumRules` creates `_<parent>_<fieldName>` where
	//      `<fieldName>` corresponds to the field that referenced the altDef
	//      symbol — the altDef key itself ends with `_<fieldName>`).
	// This is deliberately conservative: we do NOT match all string rules
	// by value alone, to avoid stamping unrelated `_kw_*` helpers that
	// happen to share a character with an altDef literal (e.g. `_kw_negative`
	// has body `'!'` which clashes with the `_inner_*_doc_comment_marker`
	// alt-def values).
	const symToLit: Record<string, string> = { ...altStamps };
	for (const [sym, body] of Object.entries(rules)) {
		if (sym in symToLit) continue; // Already included via exact match.
		if (body.type !== 'string') continue;
		// Check whether any altDef key is a suffix of this symbol name.
		for (const [altKey, lit] of Object.entries(altStamps)) {
			if (sym.endsWith(altKey) && body.value === lit) {
				symToLit[sym] = lit;
				break;
			}
		}
	}
	if (Object.keys(symToLit).length === 0 && blankStamps.size === 0) return rules;

	const out: Record<string, Rule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		// Blank-stamped entries are removed from the rules map: their
		// references have been replaced inline with the blank sentinel
		// (which `rewriteRuleForStamp` collapses to `optional(...)` in
		// containing choices). Keeping the entry would cause assemble to
		// classify an empty `choice` body as an empty AssembledEnum and
		// throw.
		if (blankStamps.has(name)) continue;
		out[name] = rewriteRuleForStamp(rule, symToLit, blankStamps);
	}
	return out;
}

/**
 * `blank()` produces `{ type: 'choice', members: [] }` (see evaluate.ts).
 * Same shape detection used by choice()'s optional-collapse pass.
 */
function isBlankRule(rule: Rule): boolean {
	return (
		(rule.type === 'choice' && rule.members.length === 0) ||
		(rule.type === 'seq' && rule.members.length === 0)
	);
}

function rewriteRuleForStamp(
	rule: Rule,
	symToLit: Record<string, string>,
	blankStamps: ReadonlySet<string>
): Rule {
	switch (rule.type) {
		case 'symbol': {
			const lit = symToLit[rule.name];
			if (lit !== undefined) return { type: 'string', value: lit };
			if (blankStamps.has(rule.name)) return { type: 'choice', members: [] };
			return rule;
		}

		case 'field': {
			const inner = unwrapAliasForCheck(rule.content);
			if (inner.type === 'symbol') {
				const lit = symToLit[inner.name];
				if (lit !== undefined) {
					// Drop the field wrapper; stamp the literal inline.
					return { type: 'string', value: lit };
				}
				// Blank-stamped: the field references a zero-width-equivalent
				// external. Replace the whole field with blank so the parent
				// seq/choice collapse handles cardinality.
				if (blankStamps.has(inner.name)) return { type: 'choice', members: [] };
			}
			return { ...rule, content: rewriteRuleForStamp(rule.content, symToLit, blankStamps) };
		}

		case 'alias':
			return { ...rule, content: rewriteRuleForStamp(rule.content, symToLit, blankStamps) };

		case 'token':
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'clause':
		case 'group':
			return { ...rule, content: rewriteRuleForStamp(rule.content, symToLit, blankStamps) } as Rule;

		case 'seq':
			return { ...rule, members: rule.members.map((m) => rewriteRuleForStamp(m, symToLit, blankStamps)) };

		case 'choice': {
			// Recursively stamp members, then re-apply the blank-collapse that
			// evaluate.ts's choice() applies at DSL time. `choice(X, blank)` →
			// `optional(X)`. Re-applied here because stamping may have
			// synthesized new blank members the DSL-time pass didn't see.
			const members = rule.members.map((m) => rewriteRuleForStamp(m, symToLit, blankStamps));
			const nonBlank = members.filter((m) => !isBlankRule(m));
			const hadBlank = nonBlank.length < members.length;
			if (!hadBlank) return { ...rule, members };
			if (nonBlank.length === 0) return { type: 'choice', members: [] };
			if (nonBlank.length === 1) return { type: 'optional', content: nonBlank[0]! };
			return { type: 'optional', content: { type: 'choice', members: nonBlank } };
		}

		default:
			return rule;
	}
}

/**
 * Unwrap alias (and token) wrappers to find the inner rule for stamp
 * candidate checking. Does NOT recurse into field/optional/etc — only
 * strips alias/token transparency layers.
 */
function unwrapAliasForCheck(rule: Rule): Rule {
	if (rule.type === 'alias' || rule.type === 'token') return unwrapAliasForCheck(rule.content);
	return rule;
}
