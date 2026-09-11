import type { KindEntryLike } from '../compiler/generated-metadata.ts';
import { findEntryForKindName } from '../compiler/generated-metadata.ts';
import { DelimiterFlags } from '../compiler/model/node-map.ts';
import { publicKindName, type SitePreference, type SpacingSide } from '../compiler/model/site-preferences.ts';
import { admitsDepth } from '../compiler/model/render-rules.ts';
import { DEDENT_TEXT, INDENT_TEXT, isDepthText } from '../dsl/primitives/spacing.ts';
import { pathOf } from '../compiler/model/site-addresses.ts';
import { comparePreferencePaths, formatPreferencePath, type PreferenceSegment } from '../dsl/primitives/preference-path.ts';
import { toPascal } from './kind-discriminant.ts';
import { toScreamingSnakeCase } from './kind-id-rust.ts';
import { rustStringLiteral } from './render-body.ts';
import { rustFieldIdent, rustTypeIdent } from './transport-common.ts';
import { nestedKey, type AddressBranchEntry, type AddressLeafEntry, type AddressTables } from './options.ts';

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
	readonly segments: readonly PreferenceSegment[];
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
	whitespaceText: ReadonlyMap<string, string>
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
	const idOfText = (text: string): number => {
		const kind = [...whitespaceText].find(([, t]) => t === text)?.[0];
		return kind === undefined ? 0 : idOf(kindEntries, kind, 'visibleExternals');
	};
	return {
		spacingSites: spacing,
		sitePaths: [
			...spacing.map((site, index) => ({ path: paths.get(site)!, site: 'spacing' as const, index })),
			...delimiters.map((site, index) => ({ path: delimiterPaths.get(site)!, site: 'delimiter' as const, index }))
		]
			.sort((a, b) => comparePreferencePaths(a.path, b.path))
			.map(({ path, site, index }) => ({ path: formatPreferencePath(path), segments: path, site, index })),
		delimiterSites: delimiters,
		depthSites: [...depthSites].map(([kind, sites]) => ({ kind, sites })).sort((a, b) => byTuple([a.kind], [b.kind])),
		indentId: idOfText(INDENT_TEXT),
		dedentId: idOfText(DEDENT_TEXT),
		whitespaceText: [...whitespaceText]
			.map(([kind, text]) => ({ id: idOf(kindEntries, kind, 'visibleExternals'), text }))
			.sort((a, b) => a.id - b.id)
	};
}

const q = (s: string): string => JSON.stringify(s);

function structNameOf(segments: readonly PreferenceSegment[], kindEntries: readonly KindEntryLike[]): string {
	return `${segments.map((segment) => rustTypeIdent(toPascal(nestedKey(segment, kindEntries)))).join('')}Options`;
}

function segmentEq(a: PreferenceSegment, b: PreferenceSegment): boolean {
	if (a.kind !== b.kind) return false;
	switch (a.kind) {
		case 'literal':
			return a.text === (b as typeof a).text;
		case 'index':
			return a.value === (b as typeof a).value;
		case 'wildcard':
			return true;
		default:
			return a.name === (b as { name: string }).name;
	}
}

function segmentsEq(a: readonly PreferenceSegment[], b: readonly PreferenceSegment[]): boolean {
	return a.length === b.length && a.every((s, i) => segmentEq(s, b[i]!));
}

type SiteIndex = ReadonlyMap<string, readonly SitePath[]>;

function siteIndexOf(plan: RenderOptionsPlan): SiteIndex {
	const index = new Map<string, SitePath[]>();
	for (const p of plan.sitePaths) {
		const key = formatPreferencePath(p.segments);
		const bucket = index.get(key);
		if (bucket === undefined) index.set(key, [p]);
		else bucket.push(p);
	}
	return index;
}

function siteRefsOf(leaf: AddressLeafEntry, siteIndex: SiteIndex): SitePath[] {
	return leaf.canonical.map((segments) => {
		const bucket = siteIndex.get(formatPreferencePath(segments)) ?? [];
		const site = bucket.find((p) => segmentsEq(p.segments, segments));
		if (site === undefined) throw new Error(`options.rs: address '${leaf.path}' names '${formatPreferencePath(segments)}', which is no site`);
		return site;
	});
}

interface DirectChild {
	readonly key: string;
	readonly branch?: AddressBranchEntry;
	readonly leaf?: AddressLeafEntry;
}

type ChildIndex = ReadonlyMap<string, readonly DirectChild[]>;

function childIndexOf(addresses: AddressTables, kindEntries: readonly KindEntryLike[]): ChildIndex {
	const index = new Map<string, DirectChild[]>();
	const add = (parent: readonly PreferenceSegment[], child: DirectChild): void => {
		const key = formatPreferencePath(parent);
		const bucket = index.get(key);
		if (bucket === undefined) index.set(key, [child]);
		else bucket.push(child);
	};
	for (const b of addresses.branches) add(b.segments.slice(0, -1), { key: nestedKey(b.segments[b.segments.length - 1]!, kindEntries), branch: b });
	for (const l of addresses.leaves) add(l.segments.slice(0, -1), { key: nestedKey(l.segments[l.segments.length - 1]!, kindEntries), leaf: l });
	return index;
}

function directChildrenOf(prefix: readonly PreferenceSegment[], childIndex: ChildIndex): readonly DirectChild[] {
	return childIndex.get(formatPreferencePath(prefix)) ?? [];
}

interface AddressField {
	readonly key: string;
	readonly ident: string;
	readonly type: string;
}

function fieldsOf(
	prefix: readonly PreferenceSegment[],
	children: readonly string[],
	childIndex: ChildIndex,
	siteIndex: SiteIndex,
	kindEntries: readonly KindEntryLike[]
): AddressField[] {
	const direct = directChildrenOf(prefix, childIndex);
	return children.map((key) => {
		const child = direct.find((c) => c.key === key);
		if (child === undefined) throw new Error(`options.rs: address '${key}' beneath '${formatPreferencePath(prefix)}' is neither a site nor a path`);
		const ident = rustFieldIdent(key);
		if (child.branch !== undefined) return { key, ident, type: `Option<${structNameOf(child.branch.segments, kindEntries)}>` };
		const refs = siteRefsOf(child.leaf!, siteIndex);
		const isDelimiter = refs.length > 0 && refs.every((r) => r.site === 'delimiter');
		return { key, ident, type: isDelimiter ? 'Option<u8>' : 'Option<u16>' };
	});
}

function emitOptionsStructs(plan: RenderOptionsPlan, addresses: AddressTables, siteIndex: SiteIndex, kindEntries: readonly KindEntryLike[]): string[] {
	const L: string[] = [];
	const childIndex = childIndexOf(addresses, kindEntries);
	const structsOf = [
		{ segments: [] as readonly PreferenceSegment[], name: 'Options', children: [...addresses.roots] },
		...addresses.branches.map((b) => ({ segments: b.segments, name: structNameOf(b.segments, kindEntries), children: b.children }))
	];
	for (const s of structsOf) {
		const fields = fieldsOf(s.segments, s.children, childIndex, siteIndex, kindEntries);
		const isRoot = s.segments.length === 0;
		L.push('#[derive(Debug, Clone, Default)]');
		L.push(`pub struct ${s.name} {`);
		if (isRoot) L.push('    pub indent: Option<String>,');
		for (const f of fields) L.push(`    pub ${f.ident}: ${f.type},`);
		L.push('}', '');
		const allowed = isRoot ? ['indent', ...fields.map((f) => f.key)] : fields.map((f) => f.key);
		const at = isRoot ? '' : formatPreferencePath(s.segments);
		L.push('#[cfg(feature = "napi-bindings")]');
		L.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${s.name} {`);
		L.push('    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {');
		L.push('        let obj = unsafe { ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)? };');
		L.push(`        ::sittir_core::options::reject_unknown_keys(&obj, &[${allowed.map(q).join(', ')}], ${q(at)})?;`);
		L.push('        Ok(Self {');
		if (isRoot) L.push('            indent: obj.get("indent")?,');
		for (const f of fields) L.push(`            ${f.ident}: obj.get(${q(f.key)})?,`);
		L.push('        })');
		L.push('    }');
		L.push('}', '');
		L.push('#[cfg(feature = "napi-bindings")]');
		L.push(`impl ::napi::bindgen_prelude::ToNapiValue for ${s.name} {`);
		L.push('    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {');
		L.push('        let mut obj = ::napi::bindgen_prelude::Object::new(&::napi::Env::from_raw(env))?;');
		if (isRoot) L.push('        obj.set("indent", val.indent)?;');
		for (const f of fields) L.push(`        obj.set(${q(f.key)}, val.${f.ident})?;`);
		L.push('        Ok(::napi::bindgen_prelude::JsValue::raw(&obj))');
		L.push('    }');
		L.push('}', '');
	}
	return L;
}

function chainOf(segments: readonly PreferenceSegment[], kindEntries: readonly KindEntryLike[]): string {
	const idents = segments.map((segment) => rustFieldIdent(nestedKey(segment, kindEntries)));
	if (idents.length === 1) return `options.${idents[0]}`;
	const last = idents[idents.length - 1]!;
	const middle = idents.slice(1, -1);
	let expr = `options.${idents[0]}.as_ref()`;
	for (const m of middle) expr += `.and_then(|o| o.${m}.as_ref())`;
	expr += `.and_then(|o| o.${last})`;
	return expr;
}

function literalOf(segments: readonly PreferenceSegment[], value: number, kindEntries: readonly KindEntryLike[]): string {
	const idents = segments.map((segment) => rustFieldIdent(nestedKey(segment, kindEntries)));
	let inner = `Some(${value})`;
	for (let i = idents.length - 1; i >= 1; i--) {
		const structName = structNameOf(segments.slice(0, i), kindEntries);
		inner = `Some(${structName} { ${idents[i]}: ${inner}, ..::std::default::Default::default() })`;
	}
	return `Options { ${idents[0]}: ${inner}, ..::std::default::Default::default() }`;
}

function resolverBody(addresses: AddressTables, plan: RenderOptionsPlan, siteIndex: SiteIndex, kindEntries: readonly KindEntryLike[]): string[] {
	const L: string[] = [];
	for (const leaf of addresses.leaves) {
		const refs = siteRefsOf(leaf, siteIndex);
		L.push(`    if let Some(v) = ${chainOf(leaf.segments, kindEntries)} {`);
		for (const ref of refs) {
			if (ref.site === 'spacing') {
				const site = plan.spacingSites[ref.index]!;
				L.push(`        set_spacing(&mut table, ${site.constName}, SPACING_SITES[${site.constName}].4, v, ${q(ref.path)})?;`);
			} else {
				const site = plan.delimiterSites[ref.index]!;
				L.push(`        set_delimiter(&mut table, ${site.constName}, DELIMITER_SITES[${site.constName}].2, v, ${q(ref.path)})?;`);
			}
		}
		L.push('    }');
	}
	return L;
}

function differingArmOf(ref: SitePath, plan: RenderOptionsPlan): number | undefined {
	if (ref.site === 'spacing') {
		const site = plan.spacingSites[ref.index]!;
		return site.allowedIds.find((id) => id !== site.defaultId);
	}
	const site = plan.delimiterSites[ref.index]!;
	return site.allowed !== site.defaultBits ? site.allowed : undefined;
}

function resolveTests(plan: RenderOptionsPlan, kindEntries: readonly KindEntryLike[]): string[] {
	const L: string[] = [
		'#[cfg(test)]',
		'mod resolve_tests {',
		'    use super::*;',
		'',
		'    #[test]',
		'    fn no_options_leaves_the_defaults() {',
		'        assert_eq!(resolve(&Options::default(), &defaults()).unwrap(), defaults());',
		'    }'
	];
	const differing = plan.sitePaths.find((site) => differingArmOf(site, plan) !== undefined);
	if (differing !== undefined) {
		const value = differingArmOf(differing, plan)!;
		const table = differing.site === 'spacing' ? 'spacing' : 'delimiter';
		const constName = differing.site === 'spacing' ? plan.spacingSites[differing.index]!.constName : plan.delimiterSites[differing.index]!.constName;
		L.push(
			'',
			'    #[test]',
			'    fn a_differing_admitted_value_changes_only_its_own_site() {',
			`        let options = ${literalOf(differing.segments, value, kindEntries)};`,
			'        let table = resolve(&options, &defaults()).unwrap();',
			'        let expected = defaults();',
			`        assert_eq!(table.${table}[${constName}], ${value});`,
			'        for i in 0..table.spacing.len() {',
			table === 'spacing'
				? `            if i != ${constName} { assert_eq!(table.spacing[i], expected.spacing[i]); }`
				: '            assert_eq!(table.spacing[i], expected.spacing[i]);',
			'        }',
			'        for i in 0..table.delimiter.len() {',
			table === 'delimiter'
				? `            if i != ${constName} { assert_eq!(table.delimiter[i], expected.delimiter[i]); }`
				: '            assert_eq!(table.delimiter[i], expected.delimiter[i]);',
			'        }',
			'        assert_eq!(table.indent, expected.indent);',
			'    }'
		);
	}
	L.push('}');
	return L;
}

export function renderOptionsRs(plan: RenderOptionsPlan, addresses: AddressTables, kindEntries: readonly KindEntryLike[]): string {
	const L: string[] = [];
	const siteIndex = siteIndexOf(plan);
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
		L.push(`        ${w.id} => ${rustStringLiteral(isDepthText(w.text) ? '\n' : w.text)},`);
	}
	L.push('        _ => "",');
	L.push('    }');
	L.push('}', '');
	L.push(
		'pub const WHITESPACE: ::sittir_core::render::WhitespaceTable = ::sittir_core::render::WhitespaceTable { text_of: spacing_text, indent: INDENT_KIND, dedent: DEDENT_KIND };',
		''
	);
	L.push('pub fn defaults() -> ResolvedOptions {');
	L.push('    ResolvedOptions {');
	L.push('        spacing: SPACING_SITES.iter().map(|s| s.3).collect(),');
	L.push('        delimiter: DELIMITER_SITES.iter().map(|s| s.3).collect(),');
	L.push('        ..ResolvedOptions::default()');
	L.push('    }');
	L.push('}', '');
	L.push(...emitOptionsStructs(plan, addresses, siteIndex, kindEntries));
	L.push(...RESOLVER_HELPERS);
	L.push('/// Resolve an options object over `base`: `indent` and every address that');
	L.push('/// names a site. A value a site does not admit is an error naming the address.');
	L.push('pub fn resolve(options: &Options, base: &ResolvedOptions) -> Result<ResolvedOptions, String> {');
	L.push('    let mut table = base.clone();');
	L.push('    if let Some(indent) = options.indent.as_ref() {');
	L.push('        table.indent = indent.clone();');
	L.push('    }');
	L.push(...resolverBody(addresses, plan, siteIndex, kindEntries));
	L.push('    for (kind, sites) in DEPTH_SITES {');
	L.push('        let mut depth = 0usize;');
	L.push('        for site in sites.iter() {');
	L.push('            let value = table.spacing[*site];');
	L.push('            if INDENT_KIND != 0 && value == INDENT_KIND {');
	L.push('                depth += 1;');
	L.push('            } else if DEDENT_KIND != 0 && value == DEDENT_KIND {');
	L.push('                if depth == 0 {');
	L.push('                    return Err(format!("options: {kind} dedents an indent it never opened"));');
	L.push('                }');
	L.push('                depth -= 1;');
	L.push('            }');
	L.push('        }');
	L.push('        if depth != 0 {');
	L.push('            return Err(format!("options: {kind} opens an indent it never dedents"));');
	L.push('        }');
	L.push('    }');
	L.push('    Ok(table)');
	L.push('}', '');
	L.push(...resolveTests(plan, kindEntries));
	return L.join('\n') + '\n';
}

const RESOLVER_HELPERS: readonly string[] = [
	'fn spacing_id(allowed: &[u16], id: u16, key: &str) -> Result<u16, String> {',
	'    if !allowed.contains(&id) {',
	'        return Err(format!("options: {key} does not admit kind id {id} (allowed: {allowed:?})"));',
	'    }',
	'    Ok(id)',
	'}',
	'',
	'fn set_spacing(table: &mut ResolvedOptions, index: usize, allowed: &[u16], value: u16, key: &str) -> Result<(), String> {',
	'    table.spacing[index] = spacing_id(allowed, value, key)?;',
	'    Ok(())',
	'}',
	'',
	'fn set_delimiter(table: &mut ResolvedOptions, index: usize, allowed: u8, value: u8, key: &str) -> Result<(), String> {',
	'    if value & !allowed != 0 {',
	'        return Err(format!("options: {key} does not admit delimiter {value} (allowed bits: {allowed})"));',
	'    }',
	'    table.delimiter[index] = value;',
	'    Ok(())',
	'}',
	''
];
