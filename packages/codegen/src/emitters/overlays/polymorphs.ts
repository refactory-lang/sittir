import type { NodeMap } from '../../compiler/types.ts';
import type { GeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { isRequired, FACTORY_NAME_RESERVED, type AssembledNode } from '../../compiler/model/node-map.ts';
import { classifyFactoryEmission, classifyFactoryShape, resolveDirectFactorySlot, resolveFieldStorageInfo } from '../shared.ts';
import { kindEnumConfigValue } from '../factories.ts';
import { collectCatalogKinds, collectKindEntries, type KindEnumEntry } from '../kind-discriminant.ts';
import { armConfigKeys, subFactoriesOf, type SubFactory } from './sub-factories.ts';
import { emitOverlayModule, overlayImportPath, type Attachment, type AttachedProp } from './module.ts';

function childExpr(sub: SubFactory): string {
	if (sub.arm.via !== 'kind') throw new Error('childExpr requires a kind arm');
	const { child, path } = sub.arm;
	return path.length === 0 ? `F.${child.rawFactoryName}` : `${child.rawFactoryName}.${path.join('.')}`;
}

function safeBinding(key: string): string {
	return FACTORY_NAME_RESERVED.has(key) ? `${key}_` : key;
}

function renamedList(keys: readonly string[]): string {
	return keys.map((key) => (safeBinding(key) === key ? key : `${key}: ${safeBinding(key)}`)).join(', ');
}

function parentConfigTypeExpr(parent: AssembledNode, sub: SubFactory): string {
	const base = `Parameters<typeof F.${parent.rawFactoryName}>[0]`;
	const optional = !isRequired(sub.slot) && !sub.residual.some((f) => isRequired(f));
	return optional ? `NonNullable<${base}>` : base;
}

export function subFactoryProp(
	parent: AssembledNode,
	sub: SubFactory,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	isEmitted: (kind: string) => boolean = () => true
): AttachedProp {
	const p = `F.${parent.rawFactoryName}`;
	const k = sub.slot.configKey;

	if (sub.arm.via === 'literal') {
		const isKindEnum = resolveFieldStorageInfo(sub.slot, nodeMap).kind === 'kindEnum';
		const val = kindEnumConfigValue(sub.arm.literal, isKindEnum ? kindEntries : undefined);
		if (sub.residual.length === 0) {
			const positional = resolveDirectFactorySlot(parent, nodeMap) !== undefined;
			const valueExpr = positional ? `() => ${p}(${val})` : `() => ${p}({ ${k}: ${val} })`;
			return { key: sub.name, valueExpr, typeExpr: `() => ReturnType<typeof ${p}>` };
		}
		const cfg = parentConfigTypeExpr(parent, sub);
		const valueExpr = `(config: Omit<${cfg}, '${k}'>) => ${p}({ ...config, ${k}: ${val} })`;
		const typeExpr = `(config: Omit<${cfg}, '${k}'>) => ReturnType<typeof ${p}>`;
		return { key: sub.name, valueExpr, typeExpr };
	}

	const c = childExpr(sub);
	if (sub.residual.length === 0) {
		const positional = resolveDirectFactorySlot(parent, nodeMap) !== undefined;
		const valueExpr = positional
			? `(...args: Parameters<typeof ${c}>) => ${p}(${c}(...args))`
			: `(...args: Parameters<typeof ${c}>) => ${p}({ ${k}: ${c}(...args) })`;
		return { key: sub.name, valueExpr, typeExpr: `(...args: Parameters<typeof ${c}>) => ReturnType<typeof ${p}>` };
	}

	const cfg = parentConfigTypeExpr(parent, sub);
	const childShape = classifyFactoryShape(sub.arm.child, nodeMap);
	if (childShape === 'config') {
		const keys = armConfigKeys(sub, nodeMap, { isEmitted });
		const bindings = renamedList(keys);
		const destructure = keys.length === 0 ? '...rest' : `${bindings}, ...rest`;
		const reconstruct = keys.length === 0 ? '{}' : `{ ${bindings} }`;
		const paramType = `Omit<${cfg}, '${k}'> & Parameters<typeof ${c}>[0]`;
		const valueExpr = `(config: ${paramType}) => { const { ${destructure} } = config; return ${p}({ ...rest, ${k}: ${c}(${reconstruct}) }); }`;
		return { key: sub.name, valueExpr, typeExpr: `(config: ${paramType}) => ReturnType<typeof ${p}>` };
	}
	if (childShape === 'spread' || childShape === 'elements' || sub.arm.child.parameterless) {
		const b = safeBinding(k);
		const binding = b === k ? k : `${k}: ${b}`;
		const paramType = `Omit<${cfg}, '${k}'> & { ${k}: Parameters<typeof ${c}> }`;
		const valueExpr = `(config: ${paramType}) => { const { ${binding}, ...rest } = config; return ${p}({ ...rest, ${k}: ${c}(...${b}) }); }`;
		return { key: sub.name, valueExpr, typeExpr: `(config: ${paramType}) => ReturnType<typeof ${p}>` };
	}
	const b = safeBinding(k);
	const binding = b === k ? k : `${k}: ${b}`;
	const paramType = `Omit<${cfg}, '${k}'> & { ${k}: Parameters<typeof ${c}>[0] }`;
	const valueExpr = `(config: ${paramType}) => { const { ${binding}, ...rest } = config; return ${p}({ ...rest, ${k}: ${c}(${b}) }); }`;
	return { key: sub.name, valueExpr, typeExpr: `(config: ${paramType}) => ReturnType<typeof ${p}>` };
}

export function polymorphAttachments(nodeMap: NodeMap, generatedIdTables?: GeneratedIdTables): Attachment[] {
	const kindEntries = generatedIdTables
		? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
		: undefined;
	const isEmitted = (kind: string): boolean => {
		const node = nodeMap.nodes.get(kind);
		return node !== undefined && classifyFactoryEmission(kind, node, { nodeMap, kindEntries }) === 'emit';
	};

	const out: Attachment[] = [];
	const emitted = new Set<string>();
	const visiting = new Set<string>();

	function visit(node: AssembledNode): void {
		if (emitted.has(node.kind) || visiting.has(node.kind)) return;
		const set = subFactoriesOf(node, nodeMap, { isEmitted });
		if (set.entries.length === 0 && set.diagnostics.length === 0) {
			emitted.add(node.kind);
			return;
		}
		visiting.add(node.kind);
		for (const sub of set.entries) {
			if (sub.arm.via === 'kind' && sub.arm.path.length > 0) visit(sub.arm.child);
		}
		visiting.delete(node.kind);
		for (const d of set.diagnostics) {
			console.warn(`[codegen] ${node.kind}: sub-factory ${d.name} skipped (${d.reason}): ${d.claimants.join(', ')}`);
		}
		if (set.entries.length > 0) {
			out.push({
				builder: node.rawFactoryName!,
				props: set.entries.map((sub) => subFactoryProp(node, sub, nodeMap, kindEntries, isEmitted))
			});
		}
		emitted.add(node.kind);
	}

	for (const node of nodeMap.nodes.values()) visit(node);
	return out;
}

export function emitPolymorphsOverlay(config: { nodeMap: NodeMap; generatedIdTables?: GeneratedIdTables }): string {
	const attachments = polymorphAttachments(config.nodeMap, config.generatedIdTables);
	const preamble = config.generatedIdTables ? ["import { TSKindId } from '../../types.js';"] : undefined;
	return emitOverlayModule({ importPath: overlayImportPath(1), attachments, preamble });
}
