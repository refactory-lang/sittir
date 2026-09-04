import type { NodeMap } from '../types.ts';
import type { KindEntryLike } from '../generated-metadata.ts';
import type { PreferenceDeclaration } from '../../dsl/primitives/preference.ts';
import { SPACING_ARMS } from '../../dsl/primitives/spacing.ts';
import {
	AbstractAssembledCompound,
	AssembledList,
	AssembledNonterminal,
	type AssembledNode,
	type NodeOrTerminal
} from './node-map.ts';
import { collectSitePreferences, publicKindName, type SpacingSide } from './site-preferences.ts';
import { opaqueFacts } from '../opaque-facts.ts';

export interface RenderSpacingFacts {
	readonly renderSpacing: SpacingSide;
	readonly label: string;
	readonly site?: { readonly kind: string; readonly slot: string };
}

export interface RenderSpacing {
	readonly slotsByKind: ReadonlyMap<string, readonly AssembledNonterminal[]>;
}

export interface RenderSpacingConfig {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEntryLike[];
	readonly spacingPreferences?: Readonly<Record<string, PreferenceDeclaration>>;
}

export function renderSpacingFactsOf(slot: AssembledNonterminal): RenderSpacingFacts | undefined {
	const facts = slot.metadata as unknown as Partial<RenderSpacingFacts>;
	return facts.renderSpacing === undefined || facts.label === undefined
		? undefined
		: { renderSpacing: facts.renderSpacing, label: facts.label, site: facts.site };
}

export function renderSpacingSlotsOf(
	spacing: RenderSpacing | undefined,
	node: AssembledNode
): readonly AssembledNonterminal[] {
	return spacing?.slotsByKind.get(node.kind) ?? [];
}

function whitespaceNode(nodeMap: NodeMap, arm: string): AssembledNode {
	const node = nodeMap.nodes.get(arm) ?? nodeMap.nodes.get(`_${arm}`);
	if (node === undefined) {
		throw new Error(`render spacing: the grammar registers no '${arm}' kind; declare it as a visible external`);
	}
	return node;
}

function listNodeOf(v: NodeOrTerminal, nodeMap: NodeMap): AssembledList | undefined {
	if (v.node instanceof AssembledList) return v.node;
	const ref = v.node as { name?: string; kind?: string } | undefined;
	const name = v.parseKind?.name ?? v.resolvedKind ?? ref?.kind ?? ref?.name;
	if (name === undefined) return undefined;
	const node = nodeMap.nodes.get(name) ?? nodeMap.nodes.get(`_${name}`);
	return node instanceof AssembledList ? node : undefined;
}

export function injectRenderSpacing(config: RenderSpacingConfig): RenderSpacing {
	const { nodeMap } = config;
	const slotsByKind = new Map<string, AssembledNonterminal[]>();
	const seen = new Set<string>();
	const add = (target: AssembledNode, slot: AssembledNonterminal): void => {
		const key = `${target.kind} ${slot.name}`;
		if (seen.has(key)) return;
		seen.add(key);
		const list = slotsByKind.get(target.kind) ?? [];
		list.push(slot);
		slotsByKind.set(target.kind, list);
	};
	const sites = collectSitePreferences(config).filter((site) => site.source === 'spacing' && site.side !== undefined);
	for (const site of sites) {
		const owner = nodeMap.nodes.get(site.kind);
		if (!(owner instanceof AbstractAssembledCompound)) continue;
		const ownerSlot = owner.slots.find((s) => s.name === site.slot);
		if (ownerSlot === undefined) continue;
		const side = site.side!;
		const values: NodeOrTerminal[] = SPACING_ARMS.map((arm) => ({
			node: whitespaceNode(nodeMap, arm),
			multiplicity: 'optional' as const,
			preferenceLabel: site.label,
			...(arm === site.defaultArm ? { default: true as const } : {})
		}));
		const list = ownerSlot.values.length === 1 ? listNodeOf(ownerSlot.values[0]!, nodeMap) : undefined;
		const target = list ?? owner;
		const fieldName =
			list !== undefined ? (side === 'before' ? 'space_before' : 'space_after') : `${site.slot}_${site.label}`;
		const facts: RenderSpacingFacts = {
			renderSpacing: side,
			label: site.label,
			...(list !== undefined ? {} : { site: { kind: publicKindName(site.kind), slot: site.slot } })
		};
		add(
			target,
			new AssembledNonterminal({
				values,
				fieldName,
				hasTrailingDelimiter: false,
				hasLeadingDelimiter: false,
				sourceRuleIds: [],
				metadata: opaqueFacts({ ...facts })
			})
		);
	}
	return { slotsByKind };
}
