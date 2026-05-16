/**
 * Group-lift synthesis — implements the `groups:` override block per
 * docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md.
 *
 * Pure module — no I/O, no side effects on inputs.
 */

import type { Rule } from './rule.ts';

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

	return '_' + [parentKind, ...contributions, discriminator].join('_');
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
