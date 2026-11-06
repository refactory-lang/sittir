import type { NodeMap } from '../compiler/types.ts';
import { emitShapeFailure, guardOwner } from '../compiler/diagnostics/emit-diagnostics.ts';
import { AssembledAlias, AssembledPattern, isBuilderTextLeaf, isDelimiterToken, type AssembledKeyword, type AssembledNode, type AssembledPunctuation } from '../compiler/model/node-map.ts';
import { anchoredLeafRegex } from '../compiler/model/leaf-pattern.ts';
import { aliasPatternLeaf, classifyFactoryEmission, isAffixedLeaf, referencedKinds } from './shared.ts';
import { interiorOf, type NodeInterior } from './interior.ts';
import { leafReDeclaration } from './factories.ts';
import type { KindEnumEntry } from './kind-discriminant.ts';

type LeafGuard = NonNullable<ReturnType<typeof leafReDeclaration>>;
type AliasLeaf = NonNullable<ReturnType<typeof aliasPatternLeaf>>;

export type BuiltFromText =
	| { readonly form: 'fixed'; readonly kind: string; readonly node: AssembledKeyword | AssembledPunctuation }
	| { readonly form: 'affixed'; readonly kind: string; readonly node: AssembledNode }
	| { readonly form: 'interior'; readonly kind: string; readonly node: AssembledNode; readonly interior: NodeInterior }
	| { readonly form: 'stored'; readonly kind: string; readonly node: AssembledPattern; readonly pattern: RegExp; readonly guard: LeafGuard }
	| { readonly form: 'alias'; readonly kind: string; readonly node: AssembledAlias; readonly leaf: AliasLeaf; readonly pattern: RegExp; readonly guard: LeafGuard };

interface TextlessLeaf {
	readonly form: 'textless';
	readonly kind: string;
}

export interface BuiltFromTextCtx {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEnumEntry[];
	readonly referenced: ReadonlySet<string>;
}

function builtFromTextOf(kind: string, node: AssembledNode, ctx: BuiltFromTextCtx): BuiltFromText | TextlessLeaf | undefined {
	const { nodeMap, kindEntries, referenced } = ctx;
	if (classifyFactoryEmission(kind, node, { nodeMap, kindEntries }) !== 'emit' || isDelimiterToken(node)) return undefined;
	if (isBuilderTextLeaf(node)) return { form: 'fixed', kind, node };
	if (isAffixedLeaf(node)) return { form: 'affixed', kind, node };
	const interior = interiorOf(node);
	if (interior !== undefined) return { form: 'interior', kind, node, interior };
	if (node instanceof AssembledPattern) {
		const pattern = anchoredLeafRegex(kind, node.textPattern);
		const guard = leafReDeclaration(kind, node);
		if (pattern === undefined || guard === undefined) return referenced.has(kind) ? { form: 'textless', kind } : undefined;
		return { form: 'stored', kind, node, pattern, guard };
	}
	if (node instanceof AssembledAlias) {
		const leaf = aliasPatternLeaf(node, nodeMap);
		if (leaf === undefined) return undefined;
		const pattern = anchoredLeafRegex(leaf.kind, leaf.textPattern);
		const guard = leafReDeclaration(leaf.kind, leaf);
		if (pattern === undefined || guard === undefined) return undefined;
		return { form: 'alias', kind, node, leaf, pattern, guard };
	}
	return undefined;
}

function classifiedLeaves(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): (BuiltFromText | TextlessLeaf)[] {
	const ctx = { nodeMap, kindEntries, referenced: referencedKinds(nodeMap) };
	return [...nodeMap.nodes].flatMap(([kind, node]) => builtFromTextOf(kind, node, ctx) ?? []);
}

export function textlessLeafKinds(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): string[] {
	return classifiedLeaves(nodeMap, kindEntries).flatMap((entry) => (entry.form === 'textless' ? [entry.kind] : []));
}

export function builtFromText(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): BuiltFromText[] {
	return classifiedLeaves(nodeMap, kindEntries).flatMap((entry) =>
		guardOwner([], () => {
			if (entry.form === 'textless') {
				throw emitShapeFailure({
					code: 'leaf-without-text-pattern',
					ownerKind: entry.kind,
					message: `leaf registry: '${entry.kind}' has a factory but no text pattern`,
					proposal: `an external scanner token authors its shape in renderAs: renderAs: (_$) => ({ ${entry.kind}: <pattern or string> })`
				});
			}
			return [entry];
		})
	);
}

export function storedTextKinds(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): Extract<BuiltFromText, { form: 'stored' }>[] {
	return builtFromText(nodeMap, kindEntries).filter((entry): entry is Extract<BuiltFromText, { form: 'stored' }> => entry.form === 'stored');
}
