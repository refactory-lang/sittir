import type { NodeMap } from '../compiler/types.ts';
import { assertNever } from '../polymorph-variant.ts';
import type { AssembledNonterminal, AssembledNode } from '../compiler/model/node-map.ts';
import {
	AbstractAssembledCompound,
	AssembledAlias,
	AssembledList,
	AssembledSupertype,
	isFixedTextLeaf,
	kindIdText,
	storageTargetOf
} from '../compiler/model/node-map.ts';
import { findKindEntry, findKindEntryForLiteral, type KindEnumEntry } from './kind-discriminant.ts';
import { isScalarStorage, kindConstants } from './kind-id-rust.ts';
import { fieldConstName } from './field-id-rust.ts';
import { queryRoutesOf } from './client-utils.ts';
import { canonicalSeparatedListField, fieldTypeComponents, isTextLeaf, slotDropTexts } from './shared.ts';
import { interiorOf } from './interior.ts';
import { rustStringLiteral, type Body } from './render-body.ts';
import { rustFieldIdent } from './transport-common.ts';
import type { TransportSlotShape } from './render-module.ts';

export interface TransportLiteral {
	readonly kind: string;
	readonly text: string;
	readonly resolvedKindId?: number;
	readonly immediate?: boolean;
	readonly enumKind?: string;
}

export interface TransportProjection {
	readonly nodes: readonly AssembledNode[];
	readonly literals: readonly TransportLiteral[];
	readonly nodeKinds: ReadonlySet<string>;
	readonly wireIds: ReadonlyMap<string, readonly number[]>;
}

export function collectTransportProjection(nodeMap: NodeMap): TransportProjection {
	const nodes = collectTransportNodes(nodeMap);
	const nodeKinds = new Set(nodes.map((node) => node.kind));
	const { literals, wireIds } = collectTransportLiterals(nodes, nodeMap, nodeKinds);
	return { nodes, literals, nodeKinds, wireIds };
}

function collectTransportNodes(nodeMap: NodeMap): AssembledNode[] {
	const nodes: AssembledNode[] = [];
	const seenTypeNames = supertypeTransportTypeNames(nodeMap);
	for (const [, node] of nodeMap.nodes) {
		if (!isConcreteTransportNode(node)) continue;
		if (seenTypeNames.has(node.typeName)) continue;
		seenTypeNames.add(node.typeName);
		nodes.push(node);
	}
	return nodes;
}

function isConcreteTransportNode(node: AssembledNode): boolean {
	switch (node.modelType) {
		case 'pattern':
		case 'keyword':
		case 'punctuation':
		case 'enum':
		case 'list':
		case 'branch':
		case 'envelope':
		case 'polymorph':
		case 'alias':
			return true;
		case 'supertype':
			return false;
		default:
			return assertNever(node);
	}
}

function collectTransportLiterals(
	nodes: readonly AssembledNode[],
	nodeMap: NodeMap,
	nodeKinds: ReadonlySet<string>
): { literals: TransportLiteral[]; wireIds: Map<string, number[]> } {
	const literals: TransportLiteral[] = [];
	const wireIds = new Map<string, number[]>();
	const seen = new Set<string>();
	const add = (literal: TransportLiteral, skipIfNodeKind: boolean): void => {
		if (literal.resolvedKindId !== undefined) {
			const ids = wireIds.get(literal.kind);
			if (ids === undefined) wireIds.set(literal.kind, [literal.resolvedKindId]);
			else if (!ids.includes(literal.resolvedKindId)) ids.push(literal.resolvedKindId);
		}
		if (skipIfNodeKind && nodeKinds.has(literal.kind)) return;
		const key = `${literal.kind}\0${literal.text}`;
		if (seen.has(key)) return;
		seen.add(key);
		literals.push(literal);
	};

	for (const node of nodes) {
		for (const field of node.slots) {
			for (const { literal, fromKind } of fieldTransportLiterals(field, nodeMap)) add(literal, fromKind);
		}
	}
	return { literals, wireIds };
}

function fieldTransportLiterals(
	field: AssembledNonterminal,
	nodeMap: NodeMap
): Array<{ literal: TransportLiteral; fromKind: boolean }> {
	return fieldTypeComponents(field, nodeMap).flatMap(
		(component): Array<{ literal: TransportLiteral; fromKind: boolean }> => {
			if (component.kind === 'literal') {
				return [
					{
						literal: {
							kind: component.rawKind ?? component.value,
							text: component.value,
							resolvedKindId: component.resolvedKindId,
							immediate: component.immediate
						},
						fromKind: false
					}
				];
			}
			const literal = terminalTransportLiteralForKind(component.rawKind, nodeMap);
			return literal === undefined ? [] : [{ literal, fromKind: true }];
		}
	);
}

function supertypeTransportTypeNames(nodeMap: NodeMap): Set<string> {
	const names = new Set<string>();
	for (const [, node] of nodeMap.nodes) {
		if (node instanceof AssembledSupertype) names.add(node.typeName);
	}
	return names;
}

function terminalTransportLiteralForKind(kind: string, nodeMap: NodeMap): TransportLiteral | undefined {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined) return undefined;
	const target = storageTargetOf(node, nodeMap);
	if (!isFixedTextLeaf(target)) return undefined;
	return { kind, text: target.text, resolvedKindId: target.resolvedKindId };
}

export interface ReadNames {
	kind(id: number): string;
	field(name: string): string;
}

export function readNames(kindEntries: readonly KindEnumEntry[], fieldIds: readonly { readonly name: string }[]): ReadNames {
	const kinds = new Map<number, string>();
	for (const { name, id } of kindConstants(kindEntries)) if (!kinds.has(id)) kinds.set(id, `kind::${name}`);
	const fields = new Set(fieldIds.map((field) => field.name));
	return {
		kind(id) {
			const name = kinds.get(id);
			if (name === undefined) throw new Error(`transport read facts: kind id ${id} has no constant in kind_ids.rs`);
			return name;
		},
		field(name) {
			if (!fields.has(name)) throw new Error(`transport read facts: '${name}' is not in parser.c's field table`);
			return `field::${fieldConstName(name)}`;
		}
	};
}

export interface ReadFactsCtx {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEnumEntry[];
	readonly names: ReadNames;
	readonly listOwners: ReadonlySet<string>;
}

function oneOrList(paths: readonly string[]): string {
	return paths.length === 1 ? paths[0]! : `[${paths.join(', ')}]`;
}

function literalIds(texts: readonly string[], ctx: ReadFactsCtx, what: string): number[] {
	return texts.map((text) => {
		const id = findKindEntryForLiteral(ctx.kindEntries, text)?.id;
		if (id === undefined) throw new Error(`transport read facts: ${what} ${JSON.stringify(text)} has no parser symbol`);
		return id;
	});
}

export function layoutTokenIds(body: Body, ctx: ReadFactsCtx): number[] {
	const ids: number[] = [];
	const walk = (nodes: Body): void => {
		for (const node of nodes) {
			if (node.kind === 'text') {
				const id = findKindEntryForLiteral(ctx.kindEntries, node.text)?.id;
				if (id !== undefined && !ids.includes(id)) ids.push(id);
			} else if (node.kind === 'if') {
				for (const arm of node.arms) walk(arm.body);
				if (node.fallback !== undefined) walk(node.fallback);
			}
		}
	};
	walk(body);
	return ids;
}

export function listItemSlot(node: AssembledNode): AssembledNonterminal | undefined {
	if (!(node instanceof AssembledList)) return undefined;
	const flagged = flankArgs(node) !== undefined || node.separatorRule !== undefined;
	return flagged ? canonicalSeparatedListField(node) : undefined;
}

export function transportArgs(node: AssembledNode, ownId: number | undefined, body: Body | undefined, ctx: ReadFactsCtx): string {
	if (node instanceof AssembledAlias) return `kind = ${ctx.names.kind(node.aliasTypeId)}, display, envelope, content = content`;
	if (ownId === undefined) throw new Error(`transport read facts: ${node.kind} has no parser symbol, so no reader can claim it`);
	const kind = `kind = ${ctx.names.kind(ownId)}`;
	if (isTextLeaf(node)) {
		const fixed = kindIdText(node);
		return fixed === undefined ? `${kind}, text` : `${kind}, text = ${rustStringLiteral(fixed)}`;
	}
	const interior = interiorOf(node);
	if (interior !== undefined) return `${kind}, interior = ${rustStringLiteral(interior.regex)}`;
	const args = [kind];
	if (ctx.listOwners.has(node.kind)) args.push('min_depth = 2');
	const layout = body === undefined ? [] : layoutTokenIds(body, ctx);
	if (layout.length > 0) args.push(`layout = [${layout.map((id) => ctx.names.kind(id)).join(', ')}]`);
	if (node instanceof AbstractAssembledCompound) {
		for (const gap of node.innerGaps) args.push(`gap(${gap.precedingTokens}) = ${gap.key}`);
	}
	const item = listItemSlot(node);
	if (item !== undefined) args.push(`list, item = ${rustFieldIdent(item.storageName)}`);
	return args.join(', ');
}

export function takesUntagged(slot: AssembledNonterminal, ctx: ReadFactsCtx): boolean {
	const routes = queryRoutesOf(slot, ctx.nodeMap);
	return routes.fields.length === 0 || routes.kinds.length > 0;
}

export function presenceKeywordId(
	shape: Extract<TransportSlotShape, { readonly tag: 'presence' }>,
	owner: AssembledNode,
	slot: AssembledNonterminal,
	ctx: ReadFactsCtx
): number {
	const keyword = shape.kind === undefined ? findKindEntryForLiteral(ctx.kindEntries, shape.text) : findKindEntry(ctx.kindEntries, shape.kind.kind);
	if (keyword === undefined) throw new Error(`transport read facts: ${owner.kind}.${slot.name}'s keyword has no parser symbol`);
	return keyword.id;
}

export function slotArgs(slot: AssembledNonterminal, owner: AssembledNode, shape: TransportSlotShape, ctx: ReadFactsCtx): string {
	const args: string[] = [];
	const routes = queryRoutesOf(slot, ctx.nodeMap);
	if (routes.fields.length > 0) {
		args.push(`field = ${oneOrList(routes.fields.map((name) => ctx.names.field(name)))}`);
		if (routes.kinds.length > 0) args.push('untagged');
	}
	if (shape.tag === 'presence') args.push(`presence = ${ctx.names.kind(presenceKeywordId(shape, owner, slot, ctx))}`);
	const separators = literalIds(slotDropTexts(slot, owner, false), ctx, `${owner.kind}.${slot.name}'s separator`);
	if (separators.length > 0) args.push(`separator = ${oneOrList(separators.map((id) => ctx.names.kind(id)))}`);
	if (shape.tag === 'text' && isScalarStorage(slot)) args.push('scalar');
	return args.join(', ');
}

export function captureArgs(slot: AssembledNonterminal): string {
	return `capture = ${rustStringLiteral(slot.name)}`;
}

export function flankArgs(list: AssembledList): string | undefined {
	const args: string[] = [];
	if (list.leadingDelimiter === 'optional') args.push(`leading = ${list.trailingDelimiter === 'mandatory' ? 1 : 0}`);
	if (list.trailingDelimiter === 'optional') args.push(`trailing = ${list.leadingDelimiter === 'mandatory' ? 1 : 0}`);
	return args.length === 0 ? undefined : args.join(', ');
}

export function separatorKindArgs(list: AssembledList, ctx: ReadFactsCtx): string | undefined {
	if (list.separatorRule === undefined) return undefined;
	const candidates = list.separatorCandidateKindNames.flatMap((name) => {
		const entry = findKindEntry(ctx.kindEntries, name);
		return entry === undefined ? [] : [ctx.names.kind(entry.id)];
	});
	const declared = list.resolvedSeparatorArm === undefined ? undefined : findKindEntry(ctx.kindEntries, list.resolvedSeparatorArm);
	return `candidates = [${candidates.join(', ')}]${declared === undefined ? '' : `, default = ${ctx.names.kind(declared.id)}`}`;
}

export function enumKindArgs(ownId: number, ctx: ReadFactsCtx): string {
	return `kind = ${ctx.names.kind(ownId)}, spelled`;
}

export function variantKindArgs(ids: readonly number[], display: boolean, ctx: ReadFactsCtx): string {
	return [...ids.map((id) => ctx.names.kind(id)), ...(display ? ['display'] : [])].join(', ');
}

export function assertOneUntaggedSlot(
	kind: string,
	slots: readonly { readonly name: string; readonly ids: readonly number[] }[],
	kindEntries: readonly KindEnumEntry[]
): void {
	for (let i = 0; i < slots.length; i++) {
		for (let j = i + 1; j < slots.length; j++) {
			const shared = slots[i]!.ids.find((id) => slots[j]!.ids.includes(id));
			if (shared === undefined) continue;
			const name = kindEntries.find((entry) => entry.id === shared)?.kind ?? '?';
			throw new Error(
				`transport read facts: ${kind} has two slots, '${slots[i]!.name}' and '${slots[j]!.name}', that take an untagged ${name} (kind ${shared}); the reader could not choose between them`
			);
		}
	}
}
