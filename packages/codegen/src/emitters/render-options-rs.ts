import type { SeamOrigin } from '../types/rule.ts';
import type { KindEntryLike } from '../compiler/generated-metadata.ts';
import { findEntryForKindName } from '../compiler/generated-metadata.ts';
import { DelimiterFlags } from '../compiler/model/node-map.ts';
import { publicKindName, type SitePreference, type SpacingSide } from '../compiler/model/site-preferences.ts';
import { admitsDepth } from '../compiler/model/render-rules.ts';
import { DEDENT_TEXT, INDENT_TEXT, depthBreakOf, parseSeamLabel } from '../dsl/primitives/spacing.ts';
import { pathOf } from '../compiler/model/site-addresses.ts';
import { comparePreferencePaths, formatPreferencePath, type PreferenceSegment } from '../dsl/primitives/preference-path.ts';
import { toScreamingSnakeCase } from './kind-id-rust.ts';
import { rustStringLiteral } from './render-body.ts';
import { nestedKey, type AddressBranchEntry, type AddressLeafEntry, type AddressTables } from './options.ts';

export type SeamStrength = 0 | 1 | 2;

export const SEAM_DECLARED: SeamStrength = 2;

export function seamStrength(origin: SeamOrigin | undefined): SeamStrength {
	switch (origin) {
		case 'preference':
		case 'literal-default':
		case 'word-default':
			return SEAM_DECLARED;
		case 'cascade':
			return 1;
		case 'fallback':
		case undefined:
			return 0;
		default: {
			const unreachable: never = origin;
			return unreachable;
		}
	}
}

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
	readonly strength: SeamStrength;
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
			if (defaultEntry?.literalText === undefined) throw new Error(`options.rs: ${at} separator default '${site.defaultArm}' has no token text`);
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
				strength: SEAM_DECLARED,
				role: 'separator',
				defaultText: defaultEntry.literalText
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
			strength: isFlank ? SEAM_DECLARED : seamStrength(site.origin),
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
	const refs = leaf.canonical.map((segments) => {
		const site = siteIndex.get(formatPreferencePath(segments))?.[0];
		if (site === undefined) throw new Error(`options.rs: address '${leaf.path}' names '${formatPreferencePath(segments)}', which is no site`);
		return site;
	});
	if (new Set(refs.map((r) => r.site)).size > 1) throw new Error(`options.rs: address '${leaf.path}' mixes spacing and delimiter sites`);
	return refs;
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

function siteConstOf(ref: SitePath, plan: RenderOptionsPlan): string {
	return ref.site === 'spacing' ? plan.spacingSites[ref.index]!.constName : plan.delimiterSites[ref.index]!.constName;
}

function emitAddressLevel(
	prefix: readonly PreferenceSegment[],
	keys: readonly string[],
	indent: string,
	plan: RenderOptionsPlan,
	childIndex: ChildIndex,
	siteIndex: SiteIndex
): string[] {
	const direct = childIndex.get(formatPreferencePath(prefix)) ?? [];
	return keys.flatMap((key) => {
		const child = direct.find((c) => c.key === key);
		if (child === undefined) throw new Error(`options.rs: address '${key}' beneath '${formatPreferencePath(prefix)}' is neither a site nor a path`);
		if (child.branch !== undefined) {
			const segments = child.branch.segments;
			return [
				`${indent}::sittir_core::options::AddressNode::Branch { key: ${q(key)}, path: ${q(formatPreferencePath(segments))}, children: &[`,
				...emitAddressLevel(segments, child.branch.children, `${indent}    `, plan, childIndex, siteIndex),
				`${indent}] },`
			];
		}
		const refs = siteRefsOf(child.leaf!, siteIndex);
		const variant = refs[0]!.site === 'spacing' ? 'Spacing' : 'Delimiter';
		const sites = refs.map((ref) => `::sittir_core::options::SiteRef { site: ${siteConstOf(ref, plan)}, path: ${q(ref.path)} }`).join(', ');
		return [`${indent}::sittir_core::options::AddressNode::${variant} { key: ${q(key)}, sites: &[${sites}] },`];
	});
}

function emitAddressTrie(plan: RenderOptionsPlan, addresses: AddressTables, siteIndex: SiteIndex, kindEntries: readonly KindEntryLike[]): string[] {
	const childIndex = childIndexOf(addresses, kindEntries);
	return [
		'pub static ADDRESSES: &[::sittir_core::options::AddressNode] = &[',
		...emitAddressLevel([], addresses.roots, '    ', plan, childIndex, siteIndex),
		'];',
		''
	];
}

interface SmokeLeaf {
	readonly keys: readonly string[];
	readonly refs: readonly SitePath[];
}

function smokeLeavesOf(addresses: AddressTables, siteIndex: SiteIndex, kindEntries: readonly KindEntryLike[]): SmokeLeaf[] {
	return addresses.leaves.map((leaf) => ({ keys: leaf.segments.map((segment) => nestedKey(segment, kindEntries)), refs: siteRefsOf(leaf, siteIndex) }));
}

function jsonAt(keys: readonly string[], value: unknown): string {
	return JSON.stringify(keys.reduceRight<unknown>((inner, key) => ({ [key]: inner }), value));
}

function admittedEverywhere(leaf: SmokeLeaf, plan: RenderOptionsPlan): number | undefined {
	if (leaf.refs[0]!.site !== 'spacing') return undefined;
	const sites = leaf.refs.map((ref) => plan.spacingSites[ref.index]!);
	return sites[0]!.allowedIds.find((id) => sites.every((s) => s.allowedIds.includes(id)) && sites.some((s) => s.defaultId !== id));
}

function resolveTests(plan: RenderOptionsPlan, addresses: AddressTables, siteIndex: SiteIndex, kindEntries: readonly KindEntryLike[]): string[] {
	const leaves = smokeLeavesOf(addresses, siteIndex, kindEntries);
	const L: string[] = [
		'#[cfg(test)]',
		'mod resolve_tests {',
		'    use super::*;',
		'',
		'    fn resolve(json: &str) -> Result<ResolvedOptions, String> {',
		'        let ::serde_json::Value::Object(obj) = ::serde_json::from_str(json).unwrap() else { unreachable!() };',
		'        Options::read(&obj)?.resolve(&defaults())',
		'    }',
		'',
		'    #[test]',
		'    fn no_options_leaves_the_defaults() {',
		'        assert_eq!(resolve("{}"), Ok(defaults()));',
		'    }',
		'',
		'    #[test]',
		'    fn an_unknown_key_is_refused() {',
		'        assert_eq!(resolve(r#"{"no_such_address":1}"#), Err("options: unknown key no_such_address".to_string()));',
		'    }'
	];
	const branch = addresses.branches[0];
	if (branch !== undefined) {
		const keys = branch.segments.map((segment) => nestedKey(segment, kindEntries));
		L.push(
			'',
			'    #[test]',
			'    fn an_unknown_key_beneath_a_branch_names_the_branch() {',
			`        assert_eq!(resolve(${rustStringLiteral(jsonAt(keys, { no_such_address: 1 }))}), Err(${rustStringLiteral(`options: ${formatPreferencePath(branch.segments)}/no_such_address names no site`)}.to_string()));`,
			'    }'
		);
	}
	const differing = leaves.find((leaf) => admittedEverywhere(leaf, plan) !== undefined);
	if (differing !== undefined) {
		const value = admittedEverywhere(differing, plan)!;
		const consts = differing.refs.map((ref) => siteConstOf(ref, plan));
		L.push(
			'',
			'    #[test]',
			'    fn a_differing_admitted_value_changes_only_its_own_sites() {',
			`        let table = resolve(${rustStringLiteral(jsonAt(differing.keys, value))}).unwrap();`,
			'        let expected = defaults();',
			`        let named = [${consts.join(', ')}];`,
			'        for i in 0..table.spacing.len() {',
			`            assert_eq!(table.spacing[i], if named.contains(&i) { ${value} } else { expected.spacing[i] });`,
			'        }',
			'        assert_eq!(table.delimiter, expected.delimiter);',
			'        assert_eq!(table.indent, expected.indent);',
			'    }'
		);
	}
	const refused = leaves.find((leaf) => leaf.refs[0]!.site === 'spacing');
	if (refused !== undefined) {
		const site = plan.spacingSites[refused.refs[0]!.index]!;
		L.push(
			'',
			'    #[test]',
			'    fn a_value_the_site_does_not_admit_is_refused_with_its_path() {',
			`        assert_eq!(resolve(${rustStringLiteral(jsonAt(refused.keys, 65535))}), Err(${rustStringLiteral(`options: ${refused.refs[0]!.path} does not admit kind id 65535 (allowed: [${site.allowedIds.join(', ')}])`)}.to_string()));`,
			'    }'
		);
	}
	const unbalanced = plan.indentId === 0 ? undefined : unbalancedLeafOf(leaves, plan);
	if (unbalanced !== undefined) {
		L.push(
			'',
			'    #[test]',
			'    fn an_unbalanced_indent_is_refused() {',
			`        assert_eq!(resolve(${rustStringLiteral(jsonAt(unbalanced.leaf.keys, plan.indentId))}), Err(${rustStringLiteral(`options: ${unbalanced.kind} opens an indent it never dedents`)}.to_string()));`,
			'    }'
		);
	}
	L.push('}');
	return L;
}

function unbalancedLeafOf(leaves: readonly SmokeLeaf[], plan: RenderOptionsPlan): { leaf: SmokeLeaf; kind: string } | undefined {
	for (const leaf of leaves) {
		if (leaf.refs.length !== 1 || leaf.refs[0]!.site !== 'spacing') continue;
		const index = leaf.refs[0]!.index;
		const depth = plan.depthSites.find((d) => d.sites.includes(index));
		if (depth === undefined || !plan.spacingSites[index]!.allowedIds.includes(plan.indentId)) continue;
		const others = depth.sites.filter((s) => s !== index).map((s) => plan.spacingSites[s]!.defaultId);
		if (others.every((id) => id !== plan.indentId && id !== plan.dedentId)) return { leaf, kind: depth.kind };
	}
	return undefined;
}

interface EdgeSlotRow {
	readonly site: number;
	readonly defaultId: number;
	readonly strength: SeamStrength;
}

interface EdgeSiteRow {
	readonly kind: number;
	readonly before?: EdgeSlotRow;
	readonly after?: EdgeSlotRow;
}

export interface SeatTable {
	readonly name: string;
	readonly rows: readonly { readonly kindId: number; readonly site: string }[];
}

export function seatTableName(kind: string, slot: string): string {
	return `SEATS_${screaming(kind)}_${screaming(slot)}`;
}

export function seatEdgeSide(seat: SpacingSite): 'before' | 'after' {
	const edge = seat.seat === undefined ? undefined : parseSeamLabel(seat.seat.field);
	if (edge === undefined || edge.token !== seat.seat!.kind) {
		throw new Error(`seated site '${seat.address}' writes '${seat.seat?.field}', which is not the seated kind's edge`);
	}
	return edge.side;
}

export function seatTablesOf(plan: RenderOptionsPlan, kindEntries: readonly IdEntry[]): SeatTable[] {
	const bySlot = new Map<string, { name: string; rows: Map<number, string> }>();
	for (const site of plan.spacingSites) {
		if (site.seat === undefined) continue;
		if (seatEdgeSide(site) !== 'after') {
			throw new Error(`seated site '${site.address}' fills the element's before edge; a sibling gap is the element's after edge`);
		}
		const id = edgeKindId(kindEntries, site.seat.kind);
		if (id === undefined) throw new Error(`seated site '${site.address}' seats '${site.seat.kind}', which has no kind id`);
		const name = seatTableName(site.kind, site.slot);
		const table = bySlot.get(name) ?? { name, rows: new Map<number, string>() };
		if (table.rows.has(id)) throw new Error(`${name} seats kind id ${id} twice (at '${site.address}')`);
		table.rows.set(id, site.constName);
		bySlot.set(name, table);
	}
	return [...bySlot.values()].map(({ name, rows }) => ({
		name,
		rows: [...rows.entries()].sort(([a], [b]) => a - b).map(([kindId, site]) => ({ kindId, site }))
	}));
}

export function carriesPerNodeValue(site: SpacingSite): boolean {
	return site.role === 'separator' || site.side === 'before' || site.side === 'after' || site.side === 'gap';
}

export function isKindEdge(site: SpacingSite): boolean {
	return parseSeamLabel(site.address)?.token === site.kind;
}

export function edgeKindId(kindEntries: readonly IdEntry[], kind: string): number | undefined {
	return findEntryForKindName(kindEntries, kind)?.id;
}

export function edgeSitesOf(plan: RenderOptionsPlan, kindEntries: readonly IdEntry[]): EdgeSiteRow[] {
	const byKind = new Map<number, { before?: EdgeSlotRow; after?: EdgeSlotRow }>();
	const ambiguous = new Set<number>();
	plan.spacingSites.forEach((row, site) => {
		if (!isKindEdge(row)) return;
		const seam = parseSeamLabel(row.address)!;
		const id = edgeKindId(kindEntries, row.kind);
		if (id === undefined) return;
		const edges = byKind.get(id) ?? {};
		if (edges[seam.side] !== undefined) ambiguous.add(id);
		byKind.set(id, { ...edges, [seam.side]: { site, defaultId: row.defaultId, strength: row.strength } });
	});
	return [...byKind.entries()]
		.filter(([id]) => !ambiguous.has(id))
		.sort(([a], [b]) => a - b)
		.map(([kind, edges]) => ({ kind, ...edges }));
}

function edgeSlotText(slot: EdgeSlotRow | undefined): string {
	return slot === undefined
		? '::sittir_core::options::EdgeSlot::NONE'
		: `::sittir_core::options::EdgeSlot { site: ${slot.site}, default_arm: ${slot.defaultId}, strength: ${slot.strength} }`;
}

export function renderOptionsRs(plan: RenderOptionsPlan, addresses: AddressTables, kindEntries: readonly IdEntry[]): string {
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
	L.push('pub static SPACING_SITES: &[(&str, &str, &str, u16, &[u16], u8)] = &[');
	for (const s of plan.spacingSites) {
		L.push(`    (${q(s.kind)}, ${q(s.address)}, ${q(s.label)}, ${s.defaultId}, &[${s.allowedIds.join(', ')}], ${s.strength}),`);
	}
	L.push('];', '');
	L.push('/// (kind id, before site, after site) of every kind that owns edge seams, sorted by kind id, so a coordinate meets the seams a rendered node writes.');
	L.push('pub static EDGE_SITES: &[::sittir_core::options::EdgeSite] = &[');
	for (const e of edgeSitesOf(plan, kindEntries)) {
		L.push(`    ::sittir_core::options::EdgeSite { kind: ${e.kind}, before: ${edgeSlotText(e.before)}, after: ${edgeSlotText(e.after)} },`);
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
		L.push(`        ${w.id} => ${rustStringLiteral(depthBreakOf(w.text))},`);
	}
	L.push('        _ => "",');
	L.push('    }');
	L.push('}', '');
	L.push("pub fn allowed(site: usize) -> &'static [u16] {", '    SPACING_SITES[site].4', '}', '');
	L.push(
		'pub const WHITESPACE: ::sittir_core::render::WhitespaceTable = ::sittir_core::render::WhitespaceTable { text_of: spacing_text, indent: INDENT_KIND, dedent: DEDENT_KIND };',
		''
	);
	L.push('/// Per spacing site, in vector order: the arm its table holds by default and the strength that default carries.');
	L.push('pub static SITE_SPECS: &[::sittir_core::options::SiteSpec] = &[');
	for (const s of plan.spacingSites) L.push(`    ::sittir_core::options::SiteSpec { default_arm: ${s.defaultId}, strength: ${s.strength} },`);
	L.push('];', '');
	for (const table of seatTablesOf(plan, kindEntries)) {
		L.push(`pub static ${table.name}: &[(u16, usize)] = &[`);
		for (const row of table.rows) L.push(`    (${row.kindId}, ${row.site}),`);
		L.push('];', '');
	}
	L.push('pub fn defaults() -> ResolvedOptions {');
	L.push('    ResolvedOptions {');
	L.push('        spacing: SPACING_SITES.iter().map(|s| s.3).collect(),');
	L.push('        delimiter: DELIMITER_SITES.iter().map(|s| s.3).collect(),');
	L.push('        edges: EDGE_SITES,');
	L.push('        sites: SITE_SPECS,');
	L.push('        ..ResolvedOptions::default()');
	L.push('    }');
	L.push('}', '');
	L.push('pub fn delimiter_allowed(site: usize) -> u8 {', '    DELIMITER_SITES[site].2', '}', '');
	L.push(...emitAddressTrie(plan, addresses, siteIndex, kindEntries));
	L.push('#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]');
	L.push('pub struct Sites;', '');
	L.push('impl ::sittir_core::options::OptionSites for Sites {');
	L.push('    const TABLES: ::sittir_core::options::OptionTables = ::sittir_core::options::OptionTables {');
	L.push('        addresses: ADDRESSES,');
	L.push('        allowed,');
	L.push('        delimiter_allowed,');
	L.push('        depth_sites: DEPTH_SITES,');
	L.push('        indent: INDENT_KIND,');
	L.push('        dedent: DEDENT_KIND,');
	L.push('    };');
	L.push('}', '');
	L.push('pub type Options = ::sittir_core::options::Options<Sites>;', '');
	L.push(...resolveTests(plan, addresses, siteIndex, kindEntries));
	return L.join('\n') + '\n';
}
