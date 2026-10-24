import type { NodeMap } from '../compiler/types.ts';
import { AssembledAlias, AssembledPattern, isBuilderTextLeaf, type AssembledKeyword, type AssembledNode, type AssembledPunctuation } from '../compiler/model/node-map.ts';
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

export function builtFromText(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): BuiltFromText[] {
	const kinds: BuiltFromText[] = [];
	const referenced = referencedKinds(nodeMap);
	for (const [kind, node] of nodeMap.nodes) {
		if (classifyFactoryEmission(kind, node, { nodeMap, kindEntries }) !== 'emit') continue;
		if (isBuilderTextLeaf(node)) {
			kinds.push({ form: 'fixed', kind, node });
		} else if (isAffixedLeaf(node)) {
			kinds.push({ form: 'affixed', kind, node });
		} else if (interiorOf(node) !== undefined) {
			kinds.push({ form: 'interior', kind, node, interior: interiorOf(node)! });
		} else if (node instanceof AssembledPattern) {
			const pattern = anchoredLeafRegex(kind, node.textPattern);
			const guard = leafReDeclaration(kind, node);
			if (pattern === undefined || guard === undefined) {
				if (!referenced.has(kind)) continue;
				throw new Error(`leaf registry: '${kind}' has a factory but no text pattern; an external scanner token authors its shape in renderAs`);
			}
			kinds.push({ form: 'stored', kind, node, pattern, guard });
		} else if (node instanceof AssembledAlias) {
			const leaf = aliasPatternLeaf(node, nodeMap);
			if (leaf === undefined) continue;
			const pattern = anchoredLeafRegex(leaf.kind, leaf.textPattern);
			const guard = leafReDeclaration(leaf.kind, leaf);
			if (pattern === undefined || guard === undefined) continue;
			kinds.push({ form: 'alias', kind, node, leaf, pattern, guard });
		}
	}
	return kinds;
}

export function storedTextKinds(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): Extract<BuiltFromText, { form: 'stored' }>[] {
	return builtFromText(nodeMap, kindEntries).filter((entry): entry is Extract<BuiltFromText, { form: 'stored' }> => entry.form === 'stored');
}
