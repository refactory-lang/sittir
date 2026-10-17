import type { NodeMap } from '../compiler/types.ts';
import { assertNever } from '../polymorph-variant.ts';
import { isParserHiddenKind } from '../dsl/symbol-table.ts';
import type { AssembledNonterminal, AssembledNode } from '../compiler/model/node-map.ts';
import {
	AbstractAssembledCompound,
	AssembledAlias,
	AssembledList,
	AssembledSupertype,
	isFixedTextLeaf,
	isNodeRef,
	kindIdText,
	storageTargetOf
} from '../compiler/model/node-map.ts';
import { findKindEntry, type KindEnumEntry } from './kind-discriminant.ts';
import { DEDENT_TEXT, INDENT_TEXT } from '../dsl/primitives/spacing.ts';
import { kindConstants } from './kind-id-rust.ts';
import { fieldConstName } from './field-id-rust.ts';
import { queryRoutesOf } from './client-utils.ts';
import { canonicalSeparatedListField, fieldTypeComponents, isTextLeaf, slotDropKindIds, slotKindNames } from './shared.ts';
import { interiorOf } from './interior.ts';
import { rustStringLiteral } from './render-body.ts';
import { STRING, SYMBOL } from '../types/rule-types.ts'; // @rule-type-consts
import type { RenderRule } from '../types/rule.ts';
import { rustFieldIdent } from './node-common.ts';
import type { NodeSlotShape } from './render-module.ts';

const SCALAR_STORAGE: ReadonlySet<string> = new Set(['boolean', 'bitflag', 'kindEnum', 'mixedEnum']);

function isScalarStorage(slot: AssembledNonterminal): boolean {
	const info = slot.storageInfo;
	return info !== undefined && SCALAR_STORAGE.has(info.kind) && info.enumKindsById.size > 0;
}

export interface NodeLiteral {
	readonly kind: string;
	readonly text: string;
	readonly resolvedKindId?: number;
	readonly immediate?: boolean;
	readonly enumKind?: string;
}

export interface NodeProjection {
	readonly nodes: readonly AssembledNode[];
	readonly literals: readonly NodeLiteral[];
	readonly nodeKinds: ReadonlySet<string>;
	readonly wireIds: ReadonlyMap<string, readonly number[]>;
}

export function collectNodeProjection(nodeMap: NodeMap): NodeProjection {
	const nodes = collectNodeNodes(nodeMap);
	const nodeKinds = new Set(nodes.map((node) => node.kind));
	const { literals, wireIds } = collectNodeLiterals(nodes, nodeMap, nodeKinds);
	return { nodes, literals, nodeKinds, wireIds };
}

function collectNodeNodes(nodeMap: NodeMap): AssembledNode[] {
	const nodes: AssembledNode[] = [];
	const seenTypeNames = supertypeNodeTypeNames(nodeMap);
	for (const [, node] of nodeMap.nodes) {
		if (!isConcreteNodeNode(node)) continue;
		if (seenTypeNames.has(node.typeName)) continue;
		seenTypeNames.add(node.typeName);
		nodes.push(node);
	}
	return nodes;
}

function isConcreteNodeNode(node: AssembledNode): boolean {
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

function collectNodeLiterals(
	nodes: readonly AssembledNode[],
	nodeMap: NodeMap,
	nodeKinds: ReadonlySet<string>
): { literals: NodeLiteral[]; wireIds: Map<string, number[]> } {
	const literals: NodeLiteral[] = [];
	const wireIds = new Map<string, number[]>();
	const seen = new Set<string>();
	const add = (literal: NodeLiteral, skipIfNodeKind: boolean): void => {
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
			for (const { literal, fromKind } of fieldNodeLiterals(field, nodeMap)) add(literal, fromKind);
		}
	}
	return { literals, wireIds };
}

function fieldNodeLiterals(
	field: AssembledNonterminal,
	nodeMap: NodeMap
): Array<{ literal: NodeLiteral; fromKind: boolean }> {
	return fieldTypeComponents(field, nodeMap).flatMap(
		(component): Array<{ literal: NodeLiteral; fromKind: boolean }> => {
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
			const literal = terminalNodeLiteralForKind(component.rawKind, nodeMap);
			return literal === undefined ? [] : [{ literal, fromKind: true }];
		}
	);
}

function supertypeNodeTypeNames(nodeMap: NodeMap): Set<string> {
	const names = new Set<string>();
	for (const [, node] of nodeMap.nodes) {
		if (node instanceof AssembledSupertype) names.add(node.typeName);
	}
	return names;
}

function terminalNodeLiteralForKind(kind: string, nodeMap: NodeMap): NodeLiteral | undefined {
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
			if (name === undefined) throw new Error(`node read facts: kind id ${id} has no constant in kind_ids.rs`);
			return name;
		},
		field(name) {
			if (!fields.has(name)) throw new Error(`node read facts: '${name}' is not in parser.c's field table`);
			return `field::${fieldConstName(name)}`;
		}
	};
}

export interface ReadFactsCtx {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEnumEntry[];
	readonly names: ReadNames;
	readonly listOwners: ReadonlySet<string>;
	readonly envelopeIds: ReadonlySet<number>;
	readonly folds: ReadonlyMap<number, readonly number[]>;
	readonly grammar: string;
}

function oneOrList(paths: readonly string[]): string {
	return paths.length === 1 ? paths[0]! : `[${paths.join(', ')}]`;
}

function tokenGroup(id: number, ctx: ReadFactsCtx): string {
	return [id, ...foldedTokens(id, ctx)].map((each) => ctx.names.kind(each)).join(' | ');
}

const RENDER_MARKERS: ReadonlySet<string> = new Set([INDENT_TEXT, DEDENT_TEXT]);

export function layoutTokenIds(node: AbstractAssembledCompound, ctx: ReadFactsCtx, slots: readonly AssembledNonterminal[]): number[] {
	const slotFields = new Set(slots.map((slot) => slot.fieldName));
	const slotKinds = new Set(slots.flatMap(slotKindNames));
	const ids: number[] = [];
	const add = (id: number): void => {
		if (!ids.includes(id)) ids.push(id);
	};
	const layoutString = (rule: { readonly value: string; readonly resolvedKindId?: number }): number => {
		const stamped = rule.resolvedKindId;
		if (stamped === undefined) throw new Error(`node.rs: '${node.kind}' layout token ${JSON.stringify(rule.value)} has no stamped kind id`);
		return stamped;
	};
	const externals = new Set((ctx.nodeMap.externals ?? []).flatMap((entry) => (entry.type === SYMBOL ? [entry.name] : [])));
	const walk = (rule: RenderRule): void => {
		const field = (rule as { fieldName?: string }).fieldName;
		if (field !== undefined && slotFields.has(field)) return;
		switch (rule.type) {
			case STRING:
				if (RENDER_MARKERS.has(rule.value)) return;
				add(layoutString(rule));
				return;
			case SYMBOL: {
				if (rule.nonterminal !== false) return;
				const referenced = ctx.nodeMap.nodes.get(rule.name);
				const fixedLeaf = referenced !== undefined && isFixedTextLeaf(referenced);
				const fixed = field === undefined ? rule.literal !== undefined || externals.has(rule.name) || (fixedLeaf && !slotKinds.has(rule.name)) : fixedLeaf;
				if (fixed) {
					const id = rule.kindId;
					if (id === undefined) throw new Error(`node.rs: '${node.kind}' layout symbol '${rule.name}' has no stamped kind id`);
					add(id);
				}
				return;
			}
			default: {
				const inner = rule as { members?: readonly RenderRule[]; content?: RenderRule };
				for (const member of inner.members ?? []) walk(member);
				if (inner.content !== undefined) walk(inner.content);
			}
		}
	};
	if (!node.lexedInterior) walk(node.renderRule);
	return ids;
}

export function listItemSlot(node: AssembledNode): AssembledNonterminal | undefined {
	if (!(node instanceof AssembledList)) return undefined;
	const flagged = flankArgs(node) !== undefined || node.separatorRule !== undefined;
	return flagged ? canonicalSeparatedListField(node) : undefined;
}

export function nodeArgs(
	node: AssembledNode,
	ownId: number | undefined,
	ctx: ReadFactsCtx,
	slots: readonly AssembledNonterminal[]
): string {
	if (node instanceof AssembledAlias) {
		const wraps = node.slots.some((slot) => slotKindNames(slot).some((name) => ctx.nodeMap.nodes.get(name) instanceof AssembledSupertype));
		return `kind = ${ctx.names.kind(node.aliasTypeId)}, display, content = content${wraps ? ', wraps_hidden' : ''}`;
	}
	if (ownId === undefined) throw new Error(`node read facts: ${node.kind} has no parser symbol, so no reader can claim it`);
	const folded = foldedTokens(ownId, ctx);
	const kind = `kind = ${ctx.names.kind(ownId)}${folded.length === 0 ? '' : `, folded = [${folded.map((id) => ctx.names.kind(id)).join(', ')}]`}`;
	if (isTextLeaf(node)) {
		const fixed = kindIdText(node);
		return fixed === undefined ? `${kind}, text` : `${kind}, text = ${rustStringLiteral(fixed)}`;
	}
	const interior = interiorOf(node);
	if (interior !== undefined) return `${kind}, interior = ${rustStringLiteral(interior.regex)}`;
	const args = [kind];
	if (ctx.listOwners.has(node.kind)) args.push('min_depth = 2');
	const layout = node instanceof AbstractAssembledCompound ? layoutTokenIds(node, ctx, slots) : [];
	if (layout.length > 0) args.push(`layout = [${layout.map((id) => tokenGroup(id, ctx)).join(', ')}]`);
	const item = listItemSlot(node);
	if (item !== undefined) args.push(`item = ${rustFieldIdent(item.storageName)}`);
	return args.join(', ');
}

export function takesUntagged(slot: AssembledNonterminal, ctx: ReadFactsCtx): boolean {
	const routes = queryRoutesOf(slot, ctx.nodeMap);
	return routes.fields.length === 0 || routes.kinds.length > 0;
}

export interface PresenceKeyword {
	readonly id: number;
	readonly envelope: boolean;
}

export function presenceKeyword(
	shape: Extract<NodeSlotShape, { readonly tag: 'presence' }>,
	owner: AssembledNode,
	slot: AssembledNonterminal,
	ctx: ReadFactsCtx
): PresenceKeyword {
	const value = shape.kind === undefined ? slot.values.find((each) => 'value' in each && each.value === shape.text) : slot.values[0];
	if (value?.parseKindId !== undefined && presenceIsAliased(value, ctx)) return { id: value.parseKindId, envelope: true };
	if (value !== undefined && shape.kind === undefined && value.parseKindId !== undefined) return { id: value.parseKindId, envelope: false };
	const marker = shape.kind === undefined ? undefined : ctx.nodeMap.nodes.get(shape.kind.kind);
	if (marker !== undefined && isFixedTextLeaf(marker) && marker.resolvedKindId !== undefined && isParserHiddenKind(marker.kind, ctx.kindEntries)) {
		return { id: marker.resolvedKindId, envelope: false };
	}
	const keyword = shape.kind === undefined ? undefined : findKindEntry(ctx.kindEntries, shape.kind.kind);
	if (keyword === undefined) throw new Error(`node read facts: ${owner.kind}.${slot.name}'s keyword has no stamped parser symbol`);
	return { id: keyword.id, envelope: false };
}

function presenceIsAliased(value: AssembledNonterminal['values'][number], ctx: ReadFactsCtx): boolean {
	if (isNodeRef(value)) return value.parseKind !== undefined && value.parseKind.name !== ctx.kindEntries.find((entry) => entry.id === value.storageKindId)?.kind;
	const shown = ctx.kindEntries.find((entry) => entry.id === value.parseKindId);
	return shown?.anon !== true || shown.literalText !== value.value;
}

export function slotArgs(slot: AssembledNonterminal, owner: AssembledNode, shape: NodeSlotShape, ctx: ReadFactsCtx): string {
	const args: string[] = [];
	const routes = queryRoutesOf(slot, ctx.nodeMap);
	if (routes.fields.length > 0) {
		args.push(`field = ${oneOrList(routes.fields.map((name) => ctx.names.field(name)))}`);
		if (routes.kinds.length > 0) args.push('untagged');
	}
	if (shape.tag === 'presence') {
		const keyword = presenceKeyword(shape, owner, slot, ctx);
		args.push(`presence = ${keyword.envelope ? `display(${ctx.names.kind(keyword.id)})` : tokenGroup(keyword.id, ctx)}`);
	}
	const separators = slotDropKindIds(slot, owner, false);
	if (owner instanceof AssembledList && slot === listItemSlot(owner)) {
		for (const id of separatorCandidateIds(owner, ctx)) if (!separators.includes(id)) separators.push(id);
	}
	if (separators.length > 0) args.push(`separator = ${oneOrList(separators.map((id) => tokenGroup(id, ctx)))}`);
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

function separatorCandidateIds(list: AssembledList, ctx: ReadFactsCtx): number[] {
	return list.separatorCandidateKindNames.flatMap((name) => {
		const entry = findKindEntry(ctx.kindEntries, name);
		return entry === undefined ? [] : [entry.id];
	});
}

export function separatorKindArgs(list: AssembledList, ctx: ReadFactsCtx): string | undefined {
	if (list.separatorRule === undefined) return undefined;
	const candidates = separatorCandidateIds(list, ctx).map((id) => tokenGroup(id, ctx));
	return `candidates = [${candidates.join(', ')}]`;
}

export function enumKindArgs(ownId: number, ctx: ReadFactsCtx): string {
	return `kind = ${ctx.names.kind(ownId)}, spelled`;
}

function foldedTokens(id: number, ctx: ReadFactsCtx): number[] {
	return (ctx.folds.get(id) ?? []).filter((raw) => ctx.kindEntries.find((entry) => entry.id === raw)?.literalText !== undefined);
}

export function variantKindArgs(ids: readonly number[], display: boolean, ctx: ReadFactsCtx): string {
	const shown = display ? [] : ids.filter((id) => ctx.envelopeIds.has(id));
	const plain = ids.filter((id) => !shown.includes(id));
	return [
		...plain.map((id) => ctx.names.kind(id)),
		...shown.map((id) => `display(${ctx.names.kind(id)})`),
		...plain.flatMap((id) => foldedTokens(id, ctx)).map((id) => `folded(${ctx.names.kind(id)})`),
		...(display ? ['display'] : [])
	].join(', ');
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
				`node read facts: ${kind} has two slots, '${slots[i]!.name}' and '${slots[j]!.name}', that take an untagged ${name} (kind ${shared}); the reader could not choose between them`
			);
		}
	}
}
