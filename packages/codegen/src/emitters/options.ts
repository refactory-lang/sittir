import type { NodeMap } from '../compiler/types.ts';
import type { RenderRules } from '../compiler/model/render-rules.ts';
import { findEntryForKindName } from '../compiler/generated-metadata.ts';
import { buildSupertypeMembersMap } from '../compiler/model/supertype-members.ts';
import {
	collectSitePreferences,
	publicKindName,
	type PreferenceArm,
	type SitePreference
} from '../compiler/model/site-preferences.ts';
import type { KindEnumEntry } from './kind-discriminant.ts';

export { publicKindName } from '../compiler/model/site-preferences.ts';

export interface OptionEntry {
	readonly key: string;
	readonly type: string;
}

export interface OptionGroup {
	readonly key: string;
	readonly entries: readonly OptionEntry[];
}

export interface OptionsShape {
	readonly topLevel: readonly OptionEntry[];
	readonly kinds: readonly OptionGroup[];
	readonly supertypes: readonly OptionGroup[];
}

export const EMPTY_OPTIONS: OptionsShape = { topLevel: [], kinds: [], supertypes: [] };

export type ArmTypeResolver = (arm: PreferenceArm) => string;

export function kindIdArmType(kindEntries: readonly KindEnumEntry[]): ArmTypeResolver {
	return (arm) => {
		if (arm.kind === undefined) return arm.value;
		const entry = findEntryForKindName(kindEntries, arm.kind);
		if (entry === undefined) throw new Error(`options: arm '${arm.value}' names kind '${arm.kind}', which has no kind id`);
		return `TSKindId.${entry.member}`;
	};
}

function byKey<T extends { readonly key: string }>(a: T, b: T): number {
	return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
}

function unionOf(parts: Iterable<string>): string {
	return [...new Set([...parts].flatMap((p) => p.split(' | ')))].join(' | ');
}

export function deriveOptionsShape(
	sites: readonly SitePreference[],
	supertypeMembers: ReadonlyMap<string, readonly string[]>,
	armType: ArmTypeResolver
): OptionsShape {
	const topLevel = new Map<string, { type: string; defaultArm: string; site: string }>();
	const kinds = new Map<string, Map<string, string>>();
	const flanks = new Map<string, Map<string, string>>();
	for (const site of sites) {
		const type = site.arms.map(armType).join(' | ');
		const at = `${publicKindName(site.kind)}.${site.slot}`;
		if (site.side === 'start' || site.side === 'end') {
			const existing = topLevel.get(site.label);
			if (existing === undefined) topLevel.set(site.label, { type, defaultArm: site.defaultArm, site: at });
			else if (existing.type !== type) {
				throw new Error(`options: preference '${site.label}' differs between ${existing.site} and ${at} (${existing.type} vs ${type})`);
			}
			if (site.address !== site.label) topLevel.set(site.address, { type, defaultArm: site.defaultArm, site: at });
			const own = flanks.get(publicKindName(site.kind)) ?? new Map<string, string>();
			own.set(site.side, type);
			flanks.set(publicKindName(site.kind), own);
			continue;
		}
		if (site.source !== 'delimiter') {
			const existing = topLevel.get(site.label);
			if (existing === undefined) {
				topLevel.set(site.label, { type, defaultArm: site.defaultArm, site: at });
			} else if (existing.type !== type) {
				throw new Error(
					`options: preference '${site.label}' differs between ${existing.site} and ${at} (${existing.type} vs ${type})`
				);
			}
		}
		const kindKey = publicKindName(site.kind);
		const key = site.address;
		const entries = kinds.get(kindKey) ?? new Map<string, string>();
		if (entries.has(key)) throw new Error(`options: ${kindKey} declares '${key}' twice`);
		entries.set(key, type);
		kinds.set(kindKey, entries);
	}

	const supertypes = new Map<string, Map<string, Set<string>>>();
	for (const [supertype, members] of supertypeMembers) {
		const acc = new Map<string, Set<string>>();
		for (const member of new Set(members.map(publicKindName))) {
			const entries = kinds.get(member);
			if (entries === undefined) continue;
			for (const [key, type] of entries) {
				const set = acc.get(key) ?? new Set<string>();
				set.add(type);
				acc.set(key, set);
			}
		}
		if (acc.size > 0) supertypes.set(publicKindName(supertype), acc);
		for (const side of ['start', 'end'] as const) {
			const types = new Set<string>();
			for (const member of new Set(members.map(publicKindName))) {
				const t = flanks.get(member)?.get(side);
				if (t !== undefined) types.add(t);
			}
			if (types.size > 0) topLevel.set(`${publicKindName(supertype)}_${side}`, { type: unionOf(types), defaultArm: '', site: 'members' });
		}
	}

	const seen = new Map<string, string>();
	const claim = (key: string, owner: string): void => {
		const prior = seen.get(key);
		if (prior !== undefined) throw new Error(`options: top-level key '${key}' is both ${prior} and ${owner}`);
		seen.set(key, owner);
	};
	claim('indent', 'the indentation unit');
	for (const label of topLevel.keys()) claim(label, 'a preference label');
	for (const kind of kinds.keys()) claim(kind, 'a kind');
	for (const supertype of supertypes.keys()) claim(supertype, 'a supertype');

	const groups = (source: ReadonlyMap<string, ReadonlyMap<string, string | Set<string>>>): OptionGroup[] =>
		[...source]
			.map(([key, entries]) => ({
				key,
				entries: [...entries]
					.map(([k, t]) => ({ key: k, type: typeof t === 'string' ? t : unionOf(t) }))
					.sort(byKey)
			}))
			.sort(byKey);

	return {
		topLevel: [...topLevel].map(([key, { type }]) => ({ key, type })).sort(byKey),
		kinds: groups(kinds),
		supertypes: groups(supertypes)
	};
}

function propertyName(key: string): string {
	return /^[A-Za-z_$][\w$]*$/.test(key) ? key : `'${key.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function renderOptionsModule(shape: OptionsShape): string {
	const allTypes = [
		...shape.topLevel.map((e) => e.type),
		...shape.kinds.flatMap((g) => g.entries.map((e) => e.type)),
		...shape.supertypes.flatMap((g) => g.entries.map((e) => e.type))
	].join(' ');
	const imports = [...(/\bDelimiter\./.test(allTypes) ? ['Delimiter'] : []), ...(/\bTSKindId\./.test(allTypes) ? ['TSKindId'] : [])];
	const lines: string[] = ['// Auto-generated by @sittir/codegen — do not edit', ''];
	if (imports.length > 0) lines.push(`import type { ${imports.join(', ')} } from './types.js';`, '');
	lines.push('export interface Options {');
	for (const e of shape.topLevel) lines.push(`\treadonly ${propertyName(e.key)}?: ${e.type};`);
	for (const group of [...shape.kinds, ...shape.supertypes]) {
		lines.push(`\treadonly ${propertyName(group.key)}?: {`);
		for (const e of group.entries) lines.push(`\t\treadonly ${propertyName(e.key)}?: ${e.type};`);
		lines.push('\t};');
	}
	lines.push('\treadonly indent?: string;');
	lines.push('}', '');
	return lines.join('\n');
}

export interface EmitOptionsConfig {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEnumEntry[];
	readonly renderRules: RenderRules;
}

export function emitOptions(config: EmitOptionsConfig): string {
	const sites = collectSitePreferences({
		nodeMap: config.nodeMap,
		kindEntries: config.kindEntries,
		renderRules: config.renderRules
	});
	const shape = deriveOptionsShape(sites, buildSupertypeMembersMap(config.nodeMap), kindIdArmType(config.kindEntries));
	return renderOptionsModule(shape);
}
