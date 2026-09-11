import type { NodeMap } from '../compiler/types.ts';
import { admitsDepth, type RenderRules } from '../compiler/model/render-rules.ts';
import { findEntryForKindName, type KindEntryLike } from '../compiler/generated-metadata.ts';
import { supertypeMembersByPublicName, type SupertypeMembers } from '../compiler/model/supertype-members.ts';
import {
	collectSitePreferences,
	publicKindName,
	type PreferenceArm,
	type SitePreference
} from '../compiler/model/site-preferences.ts';
import type { KindEnumEntry } from './kind-discriminant.ts';
import { SPACING_ARMS, WHITESPACE_ARMS } from '../dsl/primitives/spacing.ts';
import { addressSegments, addressSites, matchAddress } from '../compiler/model/site-addresses.ts';
import { parsePreferencePath, type PreferenceSegment } from '../dsl/primitives/preference-path.ts';
import { readOptionsBlock, type OptionsConfig, type OptionsDeclarations } from '../dsl/wire/options-block.ts';

export { publicKindName } from '../compiler/model/site-preferences.ts';

export type ArmTypeResolver = (arm: PreferenceArm) => string;

export function kindIdArmType(kindEntries: readonly KindEnumEntry[]): ArmTypeResolver {
	return (arm) => {
		if (arm.kind === undefined) return arm.value;
		const entry = findEntryForKindName(kindEntries, arm.kind);
		if (entry === undefined) throw new Error(`options: arm '${arm.value}' names kind '${arm.kind}', which has no kind id`);
		return `TSKindId.${entry.member}`;
	};
}

function unionOf(parts: Iterable<string>): string {
	return [...new Set([...parts].flatMap((p) => p.split(' | ')))].join(' | ');
}

export interface AddressBranchEntry {
	readonly path: string;
	readonly keys: readonly string[];
}

export interface AddressLeafEntry {
	readonly path: string;
	readonly type: string;
}

export interface AddressTables {
	readonly roots: readonly string[];
	readonly branches: readonly AddressBranchEntry[];
	readonly leaves: readonly AddressLeafEntry[];
	readonly depth: number;
}

export const EMPTY_ADDRESSES: AddressTables = { roots: [], branches: [], leaves: [], depth: 0 };

function nestedKey(segment: PreferenceSegment): string {
	switch (segment.kind) {
		case 'literal':
			return segment.text;
		case 'index':
			return String(segment.value);
		case 'wildcard':
			return '_';
		default:
			return segment.name;
	}
}

export function deriveAddressTables(
	sites: readonly SitePreference[],
	kindEntries: readonly KindEntryLike[],
	armType: ArmTypeResolver,
	membersOf: SupertypeMembers,
	declared?: OptionsDeclarations
): AddressTables {
	const branches = new Map<string, Set<string>>();
	const leaves = new Map<string, string>();
	const roots = new Set<string>();
	let depth = 0;
	for (const site of addressSites(sites, kindEntries)) {
		const keys = site.path.map(nestedKey);
		depth = Math.max(depth, keys.length);
		roots.add(keys[0]!);
		for (let i = 0; i < keys.length - 1; i++) {
			const path = keys.slice(0, i + 1).join('/');
			const children = branches.get(path) ?? new Set<string>();
			children.add(keys[i + 1]!);
			branches.set(path, children);
		}
		const type = site.arms.map(armType).join(' | ');
		const path = keys.join('/');
		const prior = leaves.get(path);
		if (prior !== undefined && prior !== type) throw new Error(`options: address '${path}' resolves to two types`);
		leaves.set(path, type);
	}
	if (declared !== undefined) {
		const addressed = addressSites(sites, kindEntries);
		const reached = new Map<string, SitePreference[]>();
		for (const binding of declared.bindings) {
			const hits = matchAddress(addressSegments(binding.address), addressed, membersOf);
			reached.set(binding.label, [...(reached.get(binding.label) ?? []), ...(hits as unknown as SitePreference[])]);
		}
		for (const declaration of declared.declarations) {
			if (matchAddress(addressSegments(declaration.path), addressed, membersOf).length > 0) continue;
			const bound = reached.get(declaration.path) ?? [];
			if (bound.length === 0) continue;
			const keys = parsePreferencePath(declaration.path).map(nestedKey);
			depth = Math.max(depth, keys.length);
			roots.add(keys[0]!);
			for (let i = 0; i < keys.length - 1; i++) {
				const at = keys.slice(0, i + 1).join('/');
				const children = branches.get(at) ?? new Set<string>();
				children.add(keys[i + 1]!);
				branches.set(at, children);
			}
			leaves.set(keys.join('/'), unionOf(bound.map((site) => site.arms.map(armType).join(' | '))));
		}
	}

	for (const path of leaves.keys()) {
		if (branches.has(path)) throw new Error(`options: address '${path}' is both a site and a path`);
	}
	const byPath = <T extends { readonly path: string }>(a: T, b: T): number => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
	return {
		roots: [...roots].sort(),
		branches: [...branches].map(([path, keys]) => ({ path, keys: [...keys].sort() })).sort(byPath),
		leaves: [...leaves].map(([path, type]) => ({ path, type })).sort(byPath),
		depth
	};
}

function propertyName(key: string): string {
	return /^[A-Za-z_$][\w$]*$/.test(key) ? key : `'${key.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

const literal = (key: string): string => `'${key.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const union = (keys: readonly string[]): string => (keys.length === 0 ? 'never' : keys.map(literal).join(' | '));

export interface OptionsModuleInputs {
	readonly spacingType?: string;
	readonly whitespaceType?: string;
	readonly addresses?: AddressTables;
}

export function renderOptionsModule(inputs: OptionsModuleInputs = {}): string {
	const spacingType = inputs.spacingType ?? 'never';
	const whitespaceType = inputs.whitespaceType ?? spacingType;
	const addresses = inputs.addresses ?? EMPTY_ADDRESSES;
	const allTypes = [spacingType, whitespaceType, ...addresses.leaves.map((leaf) => leaf.type)].join(' ');
	const imports = [...(/\bDelimiter\./.test(allTypes) ? ['Delimiter'] : []), ...(/\bTSKindId\./.test(allTypes) ? ['TSKindId'] : [])];
	const alias = (type: string): string => (type === spacingType ? 'Spacing' : type === whitespaceType ? 'Whitespace' : type);
	const L: string[] = ['// Auto-generated by @sittir/codegen — do not edit', ''];
	if (imports.length > 0) L.push(`import type { ${imports.join(', ')} } from './types.js';`, '');
	L.push(`export type Spacing = ${spacingType};`, '');
	L.push(`export type Whitespace = ${whitespaceType};`, '');
	L.push(...addressLines(addresses, alias));
	L.push('export type Options = AddressedOptions & { readonly indent?: string };', '');
	return L.join('\n');
}

function addressLines(addresses: AddressTables, alias: (type: string) => string): string[] {
	const L: string[] = [];
	L.push('/// The kinds an address can start at.');
	L.push(`export type AddressRoot = ${union(addresses.roots)};`, '');
	L.push('/// Every address that has something beneath it, and what that is.');
	L.push('export interface AddressBranch {');
	for (const branch of addresses.branches) L.push(`\treadonly ${propertyName(branch.path)}: ${union(branch.keys)};`);
	L.push('}', '');
	L.push('/// Every address that names a site, and what that site admits.');
	L.push('export interface AddressLeaf {');
	for (const leaf of addresses.leaves) L.push(`\treadonly ${propertyName(leaf.path)}: ${alias(leaf.type)};`);
	L.push('}', '');
	L.push('type AddressLeafOf<P extends string> = P extends keyof AddressLeaf ? AddressLeaf[P] : never;');
	const levels = Math.max(addresses.depth - 1, 0);
	for (let level = levels; level >= 1; level--) {
		const below = level === levels ? 'AddressLeafOf' : `AddressNode${level + 1}`;
		L.push(
			`type AddressNode${level}<P extends string> = P extends keyof AddressBranch`,
			`\t? { readonly [K in AddressBranch[P]]?: ${below}<\`\${P}/\${K}\`> }`,
			'\t: AddressLeafOf<P>;'
		);
	}
	L.push('');
	L.push('/// Every site by its address, nested as the path is written.');
	L.push(
		levels === 0
			? 'export type AddressedOptions = unknown;'
			: 'export type AddressedOptions = { readonly [K in AddressRoot]?: AddressNode1<K> };'
	);
	L.push('');
	return L;
}

export interface EmitOptionsConfig {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEnumEntry[];
	readonly renderRules: RenderRules;
	readonly options?: OptionsConfig;
	readonly sites?: readonly SitePreference[];
}

export function emitOptions(config: EmitOptionsConfig): string {
	const sites =
		config.sites ??
		collectSitePreferences({
			nodeMap: config.nodeMap,
			kindEntries: config.kindEntries,
			renderRules: config.renderRules,
			options: config.options
		});
	const supertypeMembers = supertypeMembersByPublicName(config.nodeMap);
	const armType = kindIdArmType(config.kindEntries);
	const typeOf = (arms: readonly string[]): string => arms.map((arm) => armType({ value: arm, kind: arm })).join(' | ');
	const spacingType = typeOf(SPACING_ARMS);
	const whitespaceType = sites.some((s) => admitsDepth({ arms: s.arms.map((arm) => arm.value) })) ? typeOf(WHITESPACE_ARMS) : undefined;
	const declared =
		config.options === undefined
			? undefined
			: readOptionsBlock(config.options, new Set([...config.nodeMap.nodes.keys()].map(publicKindName)));
	const addresses = deriveAddressTables(sites, config.kindEntries, armType, supertypeMembers, declared);
	return renderOptionsModule({ spacingType, whitespaceType, addresses });
}
