import { resolveRoutes, type GrammarInput, type ReadEntry } from '../../../bindings/routes.ts';
import type { NodeMap } from '../../../compiler/types.ts';
import { findKindEntry, fixedTextKinds, kindDiscriminantExpr, type KindEnumEntry } from '../../kind-discriminant.ts';
import type { QueryPlan } from '@sittir/types';
import { grammarNodeTypeName } from '../../../grammars.ts';
import { valueParseKindsOf } from '../../../compiler/model/node-map.ts';
import { isSlotBearingCompound } from '../../shared.ts';
import { membershipKindsOf } from '../../membership.ts';
import { flagPlansOf, slotFlagsOf } from './flags.ts';
import { emitPortableNodeModel } from './node-model.ts';
import { presenceKeywordOf, readTestOf, slotSubjectOf } from './read-tests.ts';
import { emitPortableSurface } from './surface.ts';

export interface PortableOutputs {
	readonly nodeModel: string;
	readonly surface: string;
}

export function emitPortable(input: GrammarInput, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[]): PortableOutputs {
	const routes = resolveRoutes(input);
	const typeOf = (kind: string) => findKindEntry(kindEntries, kind)?.id;
	const readTest = (entry: ReadEntry) => readTestOf(entry, input.model, slotSubjectOf(nodeMap), presenceKeywordOf(nodeMap), typeOf);
	const kindIdOf = (kind: string) => kindDiscriminantExpr(kind, nodeMap, kindEntries);
	const typesOf = (kind: string): readonly number[] => [...new Set(membershipKindsOf([kind], nodeMap).flatMap((member) => typeOf(member) ?? []))];
	const flags = new Map<string, ReadonlyMap<string, QueryPlan | null>>();
	const plansByKind = new Map<string, ReadonlyMap<string, QueryPlan | null>>();
	const flagTypes: (readonly [string, readonly string[]])[] = [];
	for (const kind of [...new Set([...routes.members.keys(), ...routes.readEntries.keys()])].sort()) {
		if (typeOf(kind) === undefined) continue;
		const plans = flagPlansOf({
			kind,
			members: routes.members.get(kind) ?? [],
			claimFlags: (routes.readEntries.get(kind) ?? []).flatMap((entry) =>
				entry.claim.flag === undefined ? [] : [{ flag: entry.claim.flag, test: readTest(entry), placed: entry.claim.within.length > 0 }]
			),
			subjectOf: slotSubjectOf(nodeMap),
			presenceOf: presenceKeywordOf(nodeMap),
			typesOf
		});
		if (plans.size === 0) continue;
		const id = kindIdOf(kind);
		const claimed = flags.get(id);
		if (claimed !== undefined && JSON.stringify([...claimed]) !== JSON.stringify([...plans])) throw new Error(`portable: kind id ${id} ('${kind}') has two flag tables`);
		flags.set(id, plans);
		plansByKind.set(kind, plans);
		const node = nodeMap.nodes.get(kind);
		const declared = [...plans].flatMap(([flag, plan]) => (plan === null ? [] : [flag]));
		if (node !== undefined && isSlotBearingCompound(node) && declared.length > 0) flagTypes.push([node.typeName, declared]);
	}
	const slotFlags = slotFlagsOf({
		nodes: nodeMap.nodes.values(),
		kindsOf: (slot) => membershipKindsOf(valueParseKindsOf(slot), nodeMap),
		plans: plansByKind,
		typeOf,
		typesOf
	});
	const slotFlagTypes = [...slotFlags.values()].flatMap(({ node, slots }) => {
		const readable = [...slots].flatMap(([accessor, held]) => {
			const names = [...held].flatMap(([flag, value]) => ('kind' in value ? [] : [flag]));
			return names.length === 0 ? [] : [[accessor, names] as const];
		});
		return isSlotBearingCompound(node) && readable.length > 0 ? [[node.typeName, readable] as const] : [];
	});
	return {
		nodeModel: emitPortableNodeModel(routes, readTest),
		surface: emitPortableSurface({
			nodeType: grammarNodeTypeName(nodeMap.name),
			routes,
			readTest,
			kindIdOf,
			fixedText: fixedTextKinds(nodeMap, kindEntries).map(([kind, text]) => [kindIdOf(kind), text] as const),
			flags: [...flags],
			flagTypes,
			slotFlags: [...slotFlags].map(([id, { slots }]) => [id, slots] as const),
			slotFlagTypes
		})
	};
}
