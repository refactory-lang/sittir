import type { KindEntryLike } from '../compiler/generated-metadata.ts';
import { findEntryForKindName } from '../compiler/generated-metadata.ts';
import { DelimiterFlags } from '../compiler/model/node-map.ts';
import { publicKindName, type SitePreference, type SpacingSide } from '../compiler/model/site-preferences.ts';
import { toScreamingSnakeCase } from './kind-id-rust.ts';

export interface SpacingSite {
	readonly kind: string;
	readonly slot: string;
	readonly label: string;
	readonly constName: string;
	readonly fieldIdent: string;
	readonly wireKey: string;
	readonly defaultId: number;
	readonly allowedIds: readonly number[];
	readonly side?: SpacingSide;
}

export interface DelimiterSite {
	readonly kind: string;
	readonly slot: string;
	readonly constName: string;
	readonly allowed: number;
}

export interface RenderOptionsPlan {
	readonly spacingSites: readonly SpacingSite[];
	readonly delimiterSites: readonly DelimiterSite[];
	readonly labels: readonly { readonly label: string; readonly allowedIds: readonly number[] }[];
	readonly supertypes: readonly { readonly name: string; readonly members: readonly string[] }[];
	readonly whitespaceText: readonly { readonly id: number; readonly text: string }[];
}

const DELIMITER_BITS: Readonly<Record<string, number>> = {
	'Delimiter.Leading': DelimiterFlags.leading,
	'Delimiter.Trailing': DelimiterFlags.trailing,
	'Delimiter.Both': DelimiterFlags.both
};

type IdEntry = KindEntryLike & { readonly id?: number };

function byTuple(a: readonly string[], b: readonly string[]): number {
	for (let i = 0; i < a.length; i++) {
		if (a[i]! < b[i]!) return -1;
		if (a[i]! > b[i]!) return 1;
	}
	return 0;
}

function idOf(kindEntries: readonly IdEntry[], kind: string, at: string): number {
	const entry = findEntryForKindName(kindEntries, kind);
	if (entry?.id === undefined) throw new Error(`options.rs: ${at} names kind '${kind}', which has no kind id`);
	return entry.id;
}

function screaming(s: string): string {
	return toScreamingSnakeCase(s, s);
}

export function planRenderOptions(
	sites: readonly SitePreference[],
	kindEntries: readonly IdEntry[],
	supertypeMembers: ReadonlyMap<string, readonly string[]>,
	whitespaceText: ReadonlyMap<string, string>
): RenderOptionsPlan {
	const spacing: SpacingSite[] = [];
	const delimiters: DelimiterSite[] = [];
	const labels = new Map<string, readonly number[]>();
	for (const site of sites) {
		const kind = publicKindName(site.kind);
		const at = `${kind}.${site.slot}`;
		if (site.source === 'delimiter') {
			const allowed = site.arms.reduce((acc, arm) => acc | (DELIMITER_BITS[arm.value] ?? 0), 0);
			delimiters.push({ kind, slot: site.slot, constName: `DELIM_${screaming(kind)}_${screaming(site.slot)}`, allowed });
			continue;
		}
		const allowedIds = site.arms.map((arm) => idOf(kindEntries, arm.kind ?? arm.value, at));
		const defaultArm = site.arms.find((arm) => arm.value === site.defaultArm);
		if (defaultArm === undefined) throw new Error(`options.rs: ${at} default '${site.defaultArm}' is not one of its arms`);
		const key = `${site.slot}_${site.label}`;
		spacing.push({
			kind,
			slot: site.slot,
			label: site.label,
			constName: `SITE_${screaming(kind)}_${screaming(key)}`,
			fieldIdent: key,
			wireKey: `_${key}`,
			defaultId: idOf(kindEntries, defaultArm.kind ?? defaultArm.value, at),
			allowedIds,
			...(site.side === undefined ? {} : { side: site.side })
		});
		labels.set(site.label, allowedIds);
	}
	spacing.sort((a, b) => byTuple([a.kind, a.slot, a.label], [b.kind, b.slot, b.label]));
	delimiters.sort((a, b) => byTuple([a.kind, a.slot], [b.kind, b.slot]));
	return {
		spacingSites: spacing,
		delimiterSites: delimiters,
		labels: [...labels].map(([label, allowedIds]) => ({ label, allowedIds })).sort((a, b) => byTuple([a.label], [b.label])),
		supertypes: [...supertypeMembers]
			.map(([name, members]) => ({ name: publicKindName(name), members: [...new Set(members.map(publicKindName))].sort() }))
			.sort((a, b) => byTuple([a.name], [b.name])),
		whitespaceText: [...whitespaceText]
			.map(([kind, text]) => ({ id: idOf(kindEntries, kind, 'visibleExternals'), text }))
			.sort((a, b) => a.id - b.id)
	};
}

const q = (s: string): string => JSON.stringify(s);

export function renderOptionsRs(plan: RenderOptionsPlan): string {
	const L: string[] = [];
	L.push('// @generated — render options: site table and resolver. Do not hand-edit.', '');
	L.push('use ::sittir_core::options::ResolvedOptions;', '');
	L.push(`pub const SPACING_SITE_COUNT: usize = ${plan.spacingSites.length};`);
	L.push(`pub const DELIMITER_SITE_COUNT: usize = ${plan.delimiterSites.length};`, '');
	plan.spacingSites.forEach((s, i) => L.push(`pub const ${s.constName}: usize = ${i};`));
	plan.delimiterSites.forEach((s, i) => L.push(`pub const ${s.constName}: usize = ${i};`));
	L.push('');
	L.push('/// (kind, `<slot>_<label>` key, label, default kind id, allowed kind ids), in site order.');
	L.push('pub static SPACING_SITES: &[(&str, &str, &str, u16, &[u16])] = &[');
	for (const s of plan.spacingSites) {
		L.push(`    (${q(s.kind)}, ${q(s.fieldIdent)}, ${q(s.label)}, ${s.defaultId}, &[${s.allowedIds.join(', ')}]),`);
	}
	L.push('];', '');
	L.push('/// (kind, `<slot>_delimiter` key, allowed bitflag union), in site order.');
	L.push('pub static DELIMITER_SITES: &[(&str, &str, u8)] = &[');
	for (const s of plan.delimiterSites) L.push(`    (${q(s.kind)}, ${q(`${s.slot}_delimiter`)}, ${s.allowed}),`);
	L.push('];', '');
	L.push('pub static LABELS: &[(&str, &[u16])] = &[');
	for (const l of plan.labels) L.push(`    (${q(l.label)}, &[${l.allowedIds.join(', ')}]),`);
	L.push('];', '');
	L.push('pub static SUPERTYPE_MEMBERS: &[(&str, &[&str])] = &[');
	for (const s of plan.supertypes) L.push(`    (${q(s.name)}, &[${s.members.map(q).join(', ')}]),`);
	L.push('];', '');
	L.push("pub fn spacing_text(kind: u16) -> &'static str {");
	L.push('    match kind {');
	for (const w of plan.whitespaceText) L.push(`        ${w.id} => ${q(w.text)},`);
	L.push('        _ => "",');
	L.push('    }');
	L.push('}', '');
	L.push('pub fn defaults() -> ResolvedOptions {');
	L.push('    ResolvedOptions {');
	L.push('        spacing: SPACING_SITES.iter().map(|s| s.3).collect(),');
	L.push('        delimiter: vec![0; DELIMITER_SITE_COUNT],');
	L.push('    }');
	L.push('}', '');
	L.push(...RESOLVER_BODY);
	return L.join('\n') + '\n';
}

const RESOLVER_BODY: readonly string[] = [
	'fn set_spacing(table: &mut ResolvedOptions, index: usize, allowed: &[u16], value: &::serde_json::Value, key: &str) -> Result<(), String> {',
	'    let id = value.as_u64().and_then(|v| u16::try_from(v).ok()).ok_or_else(|| format!("options: {key} must be a kind id"))?;',
	'    if !allowed.contains(&id) {',
	'        return Err(format!("options: {key} does not admit kind id {id} (allowed: {allowed:?})"));',
	'    }',
	'    table.spacing[index] = id;',
	'    Ok(())',
	'}',
	'',
	'fn set_delimiter(table: &mut ResolvedOptions, index: usize, allowed: u8, value: &::serde_json::Value, key: &str) -> Result<(), String> {',
	'    let bits = value.as_u64().and_then(|v| u8::try_from(v).ok()).ok_or_else(|| format!("options: {key} must be a Delimiter member"))?;',
	'    if bits & !allowed != 0 {',
	'        return Err(format!("options: {key} does not admit delimiter {bits} (allowed bits: {allowed})"));',
	'    }',
	'    table.delimiter[index] = bits;',
	'    Ok(())',
	'}',
	'',
	"/// Apply one kind's entries to its sites. `owner` is the key the entries",
	'/// came under: the kind itself, or a supertype whose members include it —',
	'/// a key no site of a member owns is skipped there, and an error under',
	'/// the kind itself.',
	'fn apply_kind(table: &mut ResolvedOptions, kind: &str, entries: &::serde_json::Map<String, ::serde_json::Value>, owner: &str) -> Result<(), String> {',
	'    for (key, value) in entries {',
	'        if let Some(i) = SPACING_SITES.iter().position(|s| s.0 == kind && s.1 == key) {',
	'            set_spacing(table, i, SPACING_SITES[i].4, value, &format!("{owner}.{key}"))?;',
	'            continue;',
	'        }',
	'        if let Some(i) = DELIMITER_SITES.iter().position(|s| s.0 == kind && s.1 == key) {',
	'            set_delimiter(table, i, DELIMITER_SITES[i].2, value, &format!("{owner}.{key}"))?;',
	'            continue;',
	'        }',
	'        if owner == kind {',
	'            return Err(format!("options: unknown key {owner}.{key}"));',
	'        }',
	'    }',
	'    Ok(())',
	'}',
	'',
	'/// Resolve a JSON options object over `base`: the label\'s top-level value',
	'/// first, then supertype × slot, then kind × slot, so the more specific',
	'/// tier overwrites. Unknown keys and values a site does not admit are',
	'/// errors naming the key.',
	'pub fn resolve(json: &str, base: &ResolvedOptions) -> Result<ResolvedOptions, String> {',
	'    let value: ::serde_json::Value = ::serde_json::from_str(json).map_err(|e| format!("options: not a JSON object: {e}"))?;',
	'    let object = value.as_object().ok_or_else(|| "options: not a JSON object".to_string())?;',
	'    let mut table = base.clone();',
	'    let mut kinds: Vec<(&String, &::serde_json::Map<String, ::serde_json::Value>)> = Vec::new();',
	'    let mut supertypes: Vec<(&str, &[&str], &::serde_json::Map<String, ::serde_json::Value>)> = Vec::new();',
	'    for (key, value) in object {',
	'        if key == "indent" {',
	'            continue;',
	'        }',
	'        if let Some((_, allowed)) = LABELS.iter().find(|(label, _)| label == key) {',
	'            for (i, site) in SPACING_SITES.iter().enumerate() {',
	'                if site.2 == key {',
	'                    set_spacing(&mut table, i, allowed, value, key)?;',
	'                }',
	'            }',
	'            continue;',
	'        }',
	'        let entries = value.as_object().ok_or_else(|| format!("options: {key} must be an object of <slot>_<label> entries"))?;',
	'        if let Some((name, members)) = SUPERTYPE_MEMBERS.iter().find(|(name, _)| name == key) {',
	'            supertypes.push((name, members, entries));',
	'            continue;',
	'        }',
	'        if SPACING_SITES.iter().any(|s| s.0 == key) || DELIMITER_SITES.iter().any(|s| s.0 == key) {',
	'            kinds.push((key, entries));',
	'            continue;',
	'        }',
	'        return Err(format!("options: unknown key {key}"));',
	'    }',
	'    for (name, members, entries) in supertypes {',
	'        for member in members.iter() {',
	'            apply_kind(&mut table, member, entries, name)?;',
	'        }',
	'    }',
	'    for (kind, entries) in kinds {',
	'        apply_kind(&mut table, kind, entries, kind)?;',
	'    }',
	'    Ok(table)',
	'}'
];
