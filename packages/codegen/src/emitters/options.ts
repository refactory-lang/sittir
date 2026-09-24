import type { NodeMap } from '../compiler/types.ts';
import { snakeToCamel } from '../compiler/model/node-map.ts';
import { admitsDepth, type RenderRules } from '../compiler/model/render-rules.ts';
import { findEntryForKindName, findEntryForLiteralText, type KindEntryLike } from '../compiler/generated-metadata.ts';
import { supertypeMembersByPublicName, type SupertypeMembers } from '../compiler/model/supertype-members.ts';
import {
	collectSitePreferences,
	publicKindName,
	type PreferenceArm,
	type SitePreference
} from '../compiler/model/site-preferences.ts';
import type { KindEnumEntry } from './kind-discriminant.ts';
import { spacingArmsOf, whitespaceArmsOf } from '../compiler/model/whitespace-arms.ts';
import { addressSegments, addressSites, matchAddress, type AddressedSite } from '../compiler/model/site-addresses.ts';
import { formatPreferencePath, parsePreferencePath, type PreferenceSegment } from '../dsl/primitives/preference-path.ts';
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
	readonly segments: readonly PreferenceSegment[];
	readonly children: readonly string[];
}

export interface AddressLeafEntry {
	readonly path: string;
	readonly type: string;
	readonly canonical: readonly (readonly PreferenceSegment[])[];
	readonly segments: readonly PreferenceSegment[];
}

export interface AddressTables {
	readonly roots: readonly string[];
	readonly branches: readonly AddressBranchEntry[];
	readonly leaves: readonly AddressLeafEntry[];
	readonly depth: number;
}

export const EMPTY_ADDRESSES: AddressTables = { roots: [], branches: [], leaves: [], depth: 0 };

export function nestedKey(segment: PreferenceSegment, kindEntries: readonly KindEntryLike[]): string {
	switch (segment.kind) {
		case 'literal': {
			const entry = findEntryForLiteralText(kindEntries, segment.text);
			if (entry === undefined) throw new Error(`options: literal ${JSON.stringify(segment.text)} has no kind name`);
			return entry.kind;
		}
		case 'index':
			return String(segment.value);
		case 'wildcard':
			return '_';
		default:
			return segment.name;
	}
}

export function optionKey(segment: PreferenceSegment, kindEntries: readonly KindEntryLike[]): string {
	return snakeToCamel(nestedKey(segment, kindEntries));
}

export interface DirectChild {
	readonly name: string;
	readonly key: string;
	readonly branch?: AddressBranchEntry;
	readonly leaf?: AddressLeafEntry;
}

export type ChildIndex = ReadonlyMap<string, readonly DirectChild[]>;

export function childIndexOf(addresses: AddressTables, kindEntries: readonly KindEntryLike[]): ChildIndex {
	const index = new Map<string, DirectChild[]>();
	const add = (segments: readonly PreferenceSegment[], entry: { branch?: AddressBranchEntry; leaf?: AddressLeafEntry }): void => {
		const last = segments[segments.length - 1]!;
		const parent = formatPreferencePath(segments.slice(0, -1));
		const bucket = index.get(parent) ?? [];
		bucket.push({ name: nestedKey(last, kindEntries), key: optionKey(last, kindEntries), ...entry });
		index.set(parent, bucket);
	};
	for (const b of addresses.branches) add(b.segments, { branch: b });
	for (const l of addresses.leaves) add(l.segments, { leaf: l });
	for (const bucket of index.values()) bucket.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
	return index;
}

export interface ArmAliases {
	readonly spacingType: string;
	readonly whitespaceType: string;
}

export function armAliasesOf(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[], sites: readonly SitePreference[] | undefined): ArmAliases {
	const armType = kindIdArmType(kindEntries);
	const typeOf = (arms: readonly string[]): string => arms.map((arm) => armType({ value: arm, kind: arm })).join(' | ');
	const spacingType = typeOf(spacingArmsOf(nodeMap));
	const depth = sites?.some((s) => admitsDepth({ arms: s.arms.map((arm) => arm.value) })) ?? false;
	return { spacingType, whitespaceType: depth ? typeOf(whitespaceArmsOf(nodeMap)) : spacingType };
}

export function armAliasName(arms: ArmAliases | undefined): (type: string) => string {
	return (type) => (type === arms?.spacingType ? 'SpacingArm' : type === arms?.whitespaceType ? 'WhitespaceArm' : type);
}

export interface HintRoot {
	readonly name: string;
	readonly key: string;
	readonly hint: string;
	readonly label: boolean;
}

export interface HintEmitter {
	readonly roots: readonly HintRoot[];
}

export function hintEmitterOf(addresses: AddressTables, kindEntries: readonly KindEntryLike[], arms: ArmAliases | undefined, kinds: ReadonlySet<string>): HintEmitter {
	const alias = armAliasName(arms);
	const childIndex = childIndexOf(addresses, kindEntries);
	const bodyOf = (prefix: readonly PreferenceSegment[]): string => {
		const members = (childIndex.get(formatPreferencePath(prefix)) ?? []).map((child) =>
			child.branch !== undefined
				? `readonly ${child.key}?: ${bodyOf(child.branch.segments)}`
				: `readonly ${child.key}?: ${alias(child.leaf!.type)}`
		);
		return `{ ${members.join('; ')} }`;
	};
	const roots = (childIndex.get(formatPreferencePath([])) ?? []).map((child) => {
		if (child.branch === undefined) throw new Error(`options: address '${child.leaf!.path}' is a site at the root, which has no hint home`);
		return { name: child.name, key: child.key, hint: bodyOf(child.branch.segments), label: !kinds.has(child.name) };
	});
	return { roots };
}

export function deriveAddressTables(
	sites: readonly SitePreference[],
	kindEntries: readonly KindEntryLike[],
	armType: ArmTypeResolver,
	membersOf: SupertypeMembers,
	declared?: OptionsDeclarations
): AddressTables {
	const branches = new Map<string, Set<string>>();
	const branchSegments = new Map<string, readonly PreferenceSegment[]>();
	const leaves = new Map<string, { type: string; canonical: (readonly PreferenceSegment[])[]; segments: readonly PreferenceSegment[] }>();
	const roots = new Set<string>();
	let depth = 0;
	const assertSameSegments = (path: string, segments: readonly PreferenceSegment[]): void => {
		const prior = branchSegments.get(path) ?? leaves.get(path)?.segments;
		if (prior !== undefined && formatPreferencePath(prior) !== formatPreferencePath(segments)) {
			throw new Error(`options: address '${path}' names two segments`);
		}
	};
	for (const site of addressSites(sites, kindEntries)) {
		const keys = site.path.map((segment) => nestedKey(segment, kindEntries));
		depth = Math.max(depth, keys.length);
		roots.add(keys[0]!);
		for (let i = 0; i < keys.length - 1; i++) {
			const path = keys.slice(0, i + 1).join('/');
			assertSameSegments(path, site.path.slice(0, i + 1));
			branchSegments.set(path, site.path.slice(0, i + 1));
			const children = branches.get(path) ?? new Set<string>();
			children.add(keys[i + 1]!);
			branches.set(path, children);
		}
		const type = site.arms.map(armType).join(' | ');
		const path = keys.join('/');
		const prior = leaves.get(path);
		if (prior !== undefined && prior.type !== type) throw new Error(`options: address '${path}' resolves to two types`);
		assertSameSegments(path, site.path);
		leaves.set(path, { type, canonical: [site.path], segments: site.path });
	}
	if (declared !== undefined) {
		const addressed = addressSites(sites, kindEntries);
		const reached = new Map<string, AddressedSite<SitePreference>[]>();
		for (const binding of declared.bindings) {
			const hits = matchAddress(addressSegments(binding.address), addressed, membersOf);
			reached.set(binding.label, [...(reached.get(binding.label) ?? []), ...hits]);
		}
		for (const declaration of declared.declarations) {
			if (matchAddress(addressSegments(declaration.path), addressed, membersOf).length > 0) continue;
			const bound = reached.get(declaration.path) ?? [];
			if (bound.length === 0) continue;
			const declaredSegments = parsePreferencePath(declaration.path);
			const keys = declaredSegments.map((segment) => nestedKey(segment, kindEntries));
			depth = Math.max(depth, keys.length);
			roots.add(keys[0]!);
			for (let i = 0; i < keys.length - 1; i++) {
				const at = keys.slice(0, i + 1).join('/');
				assertSameSegments(at, declaredSegments.slice(0, i + 1));
				branchSegments.set(at, declaredSegments.slice(0, i + 1));
				const children = branches.get(at) ?? new Set<string>();
				children.add(keys[i + 1]!);
				branches.set(at, children);
			}
			assertSameSegments(keys.join('/'), declaredSegments);
			leaves.set(keys.join('/'), {
				type: unionOf(bound.map((site) => site.arms.map(armType).join(' | '))),
				canonical: bound.map((site) => site.path),
				segments: declaredSegments
			});
		}
	}

	for (const path of leaves.keys()) {
		if (branches.has(path)) throw new Error(`options: address '${path}' is both a site and a path`);
	}
	const byPath = <T extends { readonly path: string }>(a: T, b: T): number => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
	return {
		roots: [...roots].sort(),
		branches: [...branches].map(([path, children]) => ({ path, segments: branchSegments.get(path)!, children: [...children].sort() })).sort(byPath),
		leaves: [...leaves].map(([path, { type, canonical, segments }]) => ({ path, type, canonical, segments })).sort(byPath),
		depth
	};
}

export interface OptionsModuleInputs {
	readonly arms?: ArmAliases;
	readonly hints?: HintEmitter;
}

export function renderOptionsModule(inputs: OptionsModuleInputs = {}): string {
	const labels = (inputs.hints?.roots ?? []).filter((root) => root.label);
	const labelText = labels.map((l) => l.hint).join(' ');
	const imports = [...(/\bDelimiter\./.test(labelText) ? ['Delimiter'] : []), ...(/\bTSKindId\./.test(labelText) ? ['TSKindId'] : [])];
	const L: string[] = ['// Auto-generated by @sittir/codegen — do not edit', ''];
	L.push("import type { DerivedOptions } from '@sittir/types';");
	const armImports = inputs.arms === undefined ? [] : ['SpacingArm', 'WhitespaceArm'];
	if (imports.length + armImports.length > 0) L.push(`import type { ${[...imports, ...armImports].join(', ')} } from './types.js';`);
	L.push("import type * as T from './types.js';", '');
	if (inputs.arms === undefined) {
		L.push('export type SpacingArm = never;', '');
		L.push('export type WhitespaceArm = never;', '');
	} else {
		L.push('export type { SpacingArm, WhitespaceArm };', '');
	}
	L.push('/// The virtual kinds the grammar declares beside its node kinds, by the sites bound to them.');
	L.push('export interface LabelOptions {');
	for (const l of labels) L.push(`\treadonly ${l.key}?: ${l.hint};`);
	L.push('}', '');
	L.push('export type Options = DerivedOptions<T.OptionsHintMap> & LabelOptions;', '');
	return L.join('\n');
}

export function addressTablesFor(
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[],
	sites: readonly SitePreference[],
	optionsBlock?: OptionsConfig
): AddressTables {
	const declared =
		optionsBlock === undefined ? undefined : readOptionsBlock(optionsBlock, new Set([...nodeMap.nodes.keys()].map(publicKindName)));
	return deriveAddressTables(sites, kindEntries, kindIdArmType(kindEntries), supertypeMembersByPublicName(nodeMap), declared);
}

export interface EmitOptionsConfig {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEnumEntry[];
	readonly renderRules: RenderRules;
	readonly options?: OptionsConfig;
	readonly sites?: readonly SitePreference[];
	readonly addresses?: AddressTables;
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
	const arms = armAliasesOf(config.nodeMap, config.kindEntries, sites);
	const addresses = config.addresses ?? addressTablesFor(config.nodeMap, config.kindEntries, sites, config.options);
	return renderOptionsModule({ arms, hints: hintEmitterOf(addresses, config.kindEntries, arms, publicKindNames(config.nodeMap)) });
}

export function publicKindNames(nodeMap: NodeMap): ReadonlySet<string> {
	return new Set([...nodeMap.nodes.keys()].map(publicKindName));
}
