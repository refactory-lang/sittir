import type { KindEntryLike } from '../compiler/generated-metadata.ts';
import { findEntryForKindName } from '../compiler/generated-metadata.ts';
import { DelimiterFlags } from '../compiler/model/node-map.ts';
import { publicKindName, type SitePreference, type SpacingSide } from '../compiler/model/site-preferences.ts';
import { admitsDepth, type WhitespaceText } from '../compiler/model/render-rules.ts';
import { pathOf } from '../compiler/model/site-addresses.ts';
import { comparePreferencePaths, formatPreferencePath, type PreferenceSegment } from '../dsl/primitives/preference-path.ts';
import { toScreamingSnakeCase } from './kind-id-rust.ts';
import { SEAM_MARK, rustStringLiteral } from './render-body.ts';

export interface SpacingSite {
	readonly kind: string;
	readonly slot: string;
	readonly address: string;
	readonly label: string;
	readonly constName: string;
	readonly fieldIdent: string;
	readonly wireKey: string;
	readonly defaultId: number;
	readonly allowedIds: readonly number[];
	readonly side?: SpacingSide;
	readonly role?: 'separator';
	readonly defaultText?: string;
	readonly seat?: { readonly kind: string; readonly field: string };
	readonly path?: readonly PreferenceSegment[];
}

export interface DelimiterSite {
	readonly kind: string;
	readonly slot: string;
	readonly constName: string;
	readonly allowed: number;
	readonly defaultBits: number;
}

export interface DepthSites {
	readonly kind: string;
	readonly sites: readonly number[];
}

export interface SitePath {
	readonly path: string;
	readonly site: 'spacing' | 'delimiter';
	readonly index: number;
}

export interface RenderOptionsPlan {
	readonly spacingSites: readonly SpacingSite[];
	readonly sitePaths: readonly SitePath[];
	readonly delimiterSites: readonly DelimiterSite[];
	readonly depthSites: readonly DepthSites[];
	readonly indentId: number;
	readonly dedentId: number;
	readonly whitespaceText: readonly { readonly id: number; readonly text: WhitespaceText }[];
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
	whitespaceText: ReadonlyMap<string, WhitespaceText>
): RenderOptionsPlan {
	const spacing: SpacingSite[] = [];
	const delimiters: DelimiterSite[] = [];
	const delimiterPaths = new Map<DelimiterSite, readonly PreferenceSegment[]>();
	const depthCapable: SpacingSite[] = [];
	for (const site of sites) {
		const kind = publicKindName(site.kind);
		const at = `${kind}.${site.slot}`;
		if (site.source === 'delimiter') {
			const allowed = site.arms.reduce((acc, arm) => acc | (DELIMITER_BITS[arm.value] ?? 0), 0);
			const row: DelimiterSite = { kind, slot: site.slot, constName: `DELIM_${screaming(kind)}_${screaming(site.slot)}`, allowed, defaultBits: DELIMITER_BITS[site.defaultArm] ?? 0 };
			delimiters.push(row);
			delimiterPaths.set(row, pathOf(site, kindEntries));
			continue;
		}
		if (site.source === 'separator') {
			const defaultEntry = findEntryForKindName(kindEntries, site.defaultArm);
			if (defaultEntry?.symbolName === undefined) throw new Error(`options.rs: ${at} separator default '${site.defaultArm}' has no token text`);
			spacing.push({
				kind,
				slot: site.slot,
				address: site.address,
				label: site.label,
				constName: `SITE_${screaming(kind)}_${screaming(site.address)}`,
				fieldIdent: 'separator_kind',
				wireKey: '_separator',
				defaultId: idOf(kindEntries, site.defaultArm, at),
				allowedIds: site.arms.map((arm) => idOf(kindEntries, arm.kind ?? arm.value, at)),
				role: 'separator',
				defaultText: defaultEntry.symbolName
			});
			continue;
		}
		const allowedIds = site.arms.map((arm) => idOf(kindEntries, arm.kind ?? arm.value, at));
		const defaultArm = site.arms.find((arm) => arm.value === site.defaultArm);
		if (defaultArm === undefined) throw new Error(`options.rs: ${at} default '${site.defaultArm}' is not one of its arms`);
		const isFlank = site.side === 'start' || site.side === 'end';
		const field = isFlank ? `${site.slot}_${site.side}` : site.address;
		spacing.push({
			kind,
			slot: site.slot,
			address: site.address,
			label: site.label,
			constName: `SITE_${screaming(kind)}_${screaming(field)}`,
			fieldIdent: field,
			wireKey: `_${field}`,
			defaultId: idOf(kindEntries, defaultArm.kind ?? defaultArm.value, at),
			allowedIds,
			...(site.side === undefined ? {} : { side: site.side }),
			...(site.seat === undefined ? {} : { seat: site.seat }),
			...(site.path === undefined ? {} : { path: site.path })
		});
		if (admitsDepth({ arms: site.arms.map((arm) => arm.value) })) depthCapable.push(spacing[spacing.length - 1]!);
	}
	const paths = new Map(spacing.map((site) => [site, pathOf(site, kindEntries)]));
	spacing.sort((a, b) => comparePreferencePaths(paths.get(a)!, paths.get(b)!));
	delimiters.sort((a, b) => byTuple([a.kind, a.slot], [b.kind, b.slot]));
	const depthSites = new Map<string, number[]>();
	for (const s of depthCapable) depthSites.set(s.kind, [...(depthSites.get(s.kind) ?? []), spacing.indexOf(s)]);
	const idOfText = (constant: string): number => whitespaceText.size === 0 ? 0 : ([...whitespaceText].find(([, t]) => 'constant' in t && t.constant === constant)?.[0] ?? undefined) === undefined ? 0 : idOf(kindEntries, [...whitespaceText].find(([, t]) => 'constant' in t && t.constant === constant)![0], 'visibleExternals');
	return {
		spacingSites: spacing,
		sitePaths: [
			...spacing.map((site, index) => ({ path: paths.get(site)!, site: 'spacing' as const, index })),
			...delimiters.map((site, index) => ({ path: delimiterPaths.get(site)!, site: 'delimiter' as const, index }))
		]
			.sort((a, b) => comparePreferencePaths(a.path, b.path))
			.map(({ path, site, index }) => ({ path: formatPreferencePath(path), site, index })),
		delimiterSites: delimiters,
		depthSites: [...depthSites].map(([kind, sites]) => ({ kind, sites })).sort((a, b) => byTuple([a.kind], [b.kind])),
		indentId: idOfText('INDENT_NEWLINE'),
		dedentId: idOfText('DEDENT_NEWLINE'),
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
	L.push('/// (kind, address, label, default kind id, allowed kind ids), in canonical path order.');
	L.push('pub static SPACING_SITES: &[(&str, &str, &str, u16, &[u16])] = &[');
	for (const s of plan.spacingSites) {
		L.push(`    (${q(s.kind)}, ${q(s.address)}, ${q(s.label)}, ${s.defaultId}, &[${s.allowedIds.join(', ')}]),`);
	}
	L.push('];', '');
	L.push('/// A site the path table refers to: an index into `SPACING_SITES` or into `DELIMITER_SITES`.');
	L.push('#[derive(Clone, Copy)]', 'pub enum SiteRef {', '    Spacing(usize),', '    Delimiter(usize),', '}', '');
	L.push("/// Every site by its canonical address, spacing and delimiter sites together, in");
	L.push('/// sorted path order, so every descendant of a prefix is a contiguous range.');
	L.push('pub static SITE_PATHS: &[(&str, SiteRef)] = &[');
	for (const p of plan.sitePaths) L.push(`    (${q(p.path)}, SiteRef::${p.site === 'spacing' ? 'Spacing' : 'Delimiter'}(${p.index})),`);
	L.push('];', '');
	L.push('/// (kind, `<slot>_delimiter` key, allowed bitflag union, default bitflag), in site order.');
	L.push('pub static DELIMITER_SITES: &[(&str, &str, u8, u8)] = &[');
	for (const s of plan.delimiterSites) L.push(`    (${q(s.kind)}, ${q(`${s.slot}_delimiter`)}, ${s.allowed}, ${s.defaultBits}),`);
	L.push('];', '');
	L.push(`pub const INDENT_KIND: u16 = ${plan.indentId};`);
	L.push(`pub const DEDENT_KIND: u16 = ${plan.dedentId};`, '');
	L.push('/// (kind, its indent-capable sites in rule order): an indent opened at one site is dedented at a later one of the same kind.');
	L.push('pub static DEPTH_SITES: &[(&str, &[usize])] = &[');
	for (const d of plan.depthSites) L.push(`    (${q(d.kind)}, &[${d.sites.join(', ')}]),`);
	L.push('];', '');
	L.push("pub fn spacing_text(kind: u16) -> &'static str {");
	L.push('    match kind {');
	for (const w of plan.whitespaceText) {
		L.push(`        ${w.id} => ${'text' in w.text ? rustStringLiteral(SEAM_MARK + w.text.text) : `::sittir_core::spacing::${w.text.constant}`},`);
	}
	L.push('        _ => "",');
	L.push('    }');
	L.push('}', '');
	L.push('pub fn defaults() -> ResolvedOptions {');
	L.push('    ResolvedOptions {');
	L.push('        spacing: SPACING_SITES.iter().map(|s| s.3).collect(),');
	L.push('        delimiter: DELIMITER_SITES.iter().map(|s| s.3).collect(),');
	L.push('        ..ResolvedOptions::default()');
	L.push('    }');
	L.push('}', '');
	L.push(...RESOLVER_BODY);
	return L.join('\n') + '\n';
}

const RESOLVER_BODY: readonly string[] = [
	'fn spacing_id(allowed: &[u16], value: &::serde_json::Value, key: &str) -> Result<u16, String> {',
	'    let id = value.as_u64().and_then(|v| u16::try_from(v).ok()).ok_or_else(|| format!("options: {key} must be a kind id"))?;',
	'    if !allowed.contains(&id) {',
	'        return Err(format!("options: {key} does not admit kind id {id} (allowed: {allowed:?})"));',
	'    }',
	'    Ok(id)',
	'}',
	'',
	'fn set_spacing(table: &mut ResolvedOptions, index: usize, allowed: &[u16], value: &::serde_json::Value, key: &str) -> Result<(), String> {',
	'    table.spacing[index] = spacing_id(allowed, value, key)?;',
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
	'fn set_site(table: &mut ResolvedOptions, site: SiteRef, value: &::serde_json::Value, key: &str) -> Result<(), String> {',
	'    match site {',
	'        SiteRef::Spacing(i) => set_spacing(table, i, SPACING_SITES[i].4, value, key),',
	'        SiteRef::Delimiter(i) => set_delimiter(table, i, DELIMITER_SITES[i].2, value, key),',
	'    }',
	'}',
	'',
	'/// The sites an address names: itself and everything beneath it. Sites are',
	'/// in canonical path order, so that set is always a contiguous range.',
	'pub fn site_range(prefix: &str) -> (usize, usize) {',
	'    range_within(0, SITE_PATHS.len(), prefix)',
	'}',
	'',
	'fn range_within(start: usize, end: usize, prefix: &str) -> (usize, usize) {',
	'    let mut first = start;',
	'    while first < end && !path_under(SITE_PATHS[first].0, prefix) {',
	'        first += 1;',
	'    }',
	'    let mut last = first;',
	'    while last < end && path_under(SITE_PATHS[last].0, prefix) {',
	'        last += 1;',
	'    }',
	'    (first, last)',
	'}',
	'',
	'fn path_under(path: &str, prefix: &str) -> bool {',
	'    path == prefix || (path.starts_with(prefix) && path.as_bytes().get(prefix.len()) == Some(&b"/"[0]))',
	'}',
	'',
	'/// One nested key as a path segment. The nested object and the path are the',
	'/// same address in two layouts, so a key is matched against every spelling a',
	"/// segment has: a bare name, a quoted literal, or a field.",
	'fn segment_under(start: usize, end: usize, prefix: &str, key: &str) -> Option<(String, usize, usize)> {',
	'    for candidate in [key.to_string(), format!("\\"{key}\\""), format!("{key}:")] {',
	'        let next = format!("{prefix}/{candidate}");',
	'        let (s, e) = range_within(start, end, &next);',
	'        if e > s {',
	'            return Some((next, s, e));',
	'        }',
	'    }',
	'    None',
	'}',
	'',
	'/// Every assignment a nested object makes. A key that names no site is an',
	'/// error naming the full address it was written at.',
	"fn collect_nested<'a>(",
	"    out: &mut Vec<(usize, usize, String, &'a ::serde_json::Value)>,",
	'    start: usize,',
	'    end: usize,',
	'    prefix: &str,',
	"    entries: &'a ::serde_json::Map<String, ::serde_json::Value>,",
	') -> Result<(), String> {',
	'    for (key, value) in entries {',
	'        let Some((path, s, e)) = segment_under(start, end, prefix, key) else {',
	'            return Err(format!("options: {prefix}/{key} names no site"));',
	'        };',
	'        match value.as_object() {',
	'            Some(nested) => collect_nested(out, s, e, &path, nested)?,',
	'            None => out.push((s, e, path, value)),',
	'        }',
	'    }',
	'    Ok(())',
	'}',
	'',
	'/// A kind-keyed nested object applied by address: every leaf sets the site',
	'/// it names and everything beneath it. Nothing is written until every leaf',
	'/// has resolved, so an error leaves the table as it was.',
	'fn apply_nested(table: &mut ResolvedOptions, key: &str, value: &::serde_json::Value) -> Result<(), String> {',
	'    let root = format!("({key})");',
	'    let (start, end) = site_range(&root);',
	'    if end == start {',
	'        return Err(format!("options: unknown key {key}"));',
	'    }',
	'    let entries = value',
	'        .as_object()',
	'        .ok_or_else(|| format!("options: {key} must be an object of addresses"))?;',
	'    let mut assignments = Vec::new();',
	'    collect_nested(&mut assignments, start, end, &root, entries)?;',
	'    for (s, e, path, value) in assignments {',
	'        for i in s..e {',
	'            set_site(table, SITE_PATHS[i].1, value, &path)?;',
	'        }',
	'    }',
	'    Ok(())',
	'}',
	'',
	'/// Resolve a JSON options object over `base`: `indent` and one address',
	'/// object per root kind. Unknown keys, addresses naming no site and values',
	'/// a site does not admit are errors naming the key.',
	'pub fn resolve(json: &str, base: &ResolvedOptions) -> Result<ResolvedOptions, String> {',
	'    let value: ::serde_json::Value = ::serde_json::from_str(json).map_err(|e| format!("options: not a JSON object: {e}"))?;',
	'    let object = value.as_object().ok_or_else(|| "options: not a JSON object".to_string())?;',
	'    let mut table = base.clone();',
	'    for (key, value) in object {',
	'        if key == "indent" {',
	'            table.indent = value.as_str().ok_or_else(|| "options: indent must be a string".to_string())?.to_string();',
	'            continue;',
	'        }',
	'        apply_nested(&mut table, key, value)?;',
	'    }',
	'    for (kind, sites) in DEPTH_SITES {',
	'        let mut depth = 0usize;',
	'        for site in sites.iter() {',
	'            let value = table.spacing[*site];',
	'            if INDENT_KIND != 0 && value == INDENT_KIND {',
	'                depth += 1;',
	'            } else if DEDENT_KIND != 0 && value == DEDENT_KIND {',
	'                if depth == 0 {',
	'                    return Err(format!("options: {kind} dedents an indent it never opened"));',
	'                }',
	'                depth -= 1;',
	'            }',
	'        }',
	'        if depth != 0 {',
	'            return Err(format!("options: {kind} opens an indent it never dedents"));',
	'        }',
	'    }',
	'    Ok(table)',
	'}',
	'',
	'#[cfg(test)]',
	'mod site_address_tests {',
	'    use super::*;',
	'',
	'    fn kind_of(path: &str) -> &str {',
	"        match path.find('/') {",
	'            Some(i) => &path[..i],',
	'            None => path,',
	'        }',
	'    }',
	'',
	'    #[test]',
	'    fn the_path_table_names_every_site_once() {',
	'        assert_eq!(SITE_PATHS.len(), SPACING_SITES.len() + DELIMITER_SITES.len());',
	'        let mut spacing = vec![false; SPACING_SITES.len()];',
	'        let mut delimiter = vec![false; DELIMITER_SITES.len()];',
	'        for (_, site) in SITE_PATHS.iter() {',
	'            let seen = match *site {',
	'                SiteRef::Spacing(i) => &mut spacing[i],',
	'                SiteRef::Delimiter(i) => &mut delimiter[i],',
	'            };',
	'            assert!(!*seen, "a site is named twice");',
	'            *seen = true;',
	'        }',
	'        assert!(spacing.iter().chain(delimiter.iter()).all(|seen| *seen));',
	'    }',
	'',
	'    #[test]',
	'    fn a_prefix_names_a_contiguous_range() {',
	'        if SITE_PATHS.is_empty() {',
	'            return;',
	'        }',
	'        let prefix = kind_of(SITE_PATHS[0].0);',
	'        let (start, end) = site_range(prefix);',
	'        assert!(end > start);',
	'        for i in start..end {',
	'            assert!(path_under(SITE_PATHS[i].0, prefix));',
	'        }',
	'        for (i, (path, _)) in SITE_PATHS.iter().enumerate() {',
	'            if path_under(path, prefix) {',
	'                assert!(i >= start && i < end, "site {i} {path} outside the range");',
	'            }',
	'        }',
	'    }',
	'',
	'    #[test]',
	'    fn every_kind_occupies_one_run() {',
	'        let mut runs: Vec<&str> = Vec::new();',
	'        for (path, _) in SITE_PATHS.iter() {',
	'            let kind = kind_of(path);',
	'            if runs.last() != Some(&kind) {',
	'                assert!(!runs.contains(&kind), "kind {kind} appears in more than one run");',
	'                runs.push(kind);',
	'            }',
	'        }',
	'    }',
	'',
	'    #[test]',
	'    fn an_address_naming_no_site_is_an_empty_range() {',
	'        let (start, end) = site_range("(no_such_kind_exists_here)");',
	'        assert_eq!(start, end);',
	'    }',
	'}'
];
