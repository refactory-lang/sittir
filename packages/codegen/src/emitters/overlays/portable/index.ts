import { resolveRoutes, type GrammarInput, type ReadEntry } from '../../../bindings/routes.ts';
import type { NodeMap } from '../../../compiler/types.ts';
import { findKindEntry, fixedTextKinds, kindDiscriminantExpr, type KindEnumEntry } from '../../kind-discriminant.ts';
import type { QueryPlan } from '@sittir/types';
import { expandToConcreteParseKinds } from '../../shared.ts';
import { flagPlansOf } from './flags.ts';
import { emitPortableNodeModel } from './node-model.ts';
import { presenceKeywordOf, readTestOf, slotSubjectOf } from './read-tests.ts';
import { emitPortableSurface } from './surface.ts';

export interface PortableOutputs {
	readonly nodeModel: string;
	readonly surface: string;
}

export function emitPortable(input: GrammarInput, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): PortableOutputs {
	const routes = resolveRoutes(input);
	const typeOf = (kind: string) => (kindEntries === undefined ? undefined : findKindEntry(kindEntries, kind)?.id);
	const readTest = (entry: ReadEntry) => readTestOf(entry, input.model, slotSubjectOf(nodeMap), presenceKeywordOf(nodeMap), typeOf);
	const kindIdOf = (kind: string) => kindDiscriminantExpr(kind, nodeMap, kindEntries);
	const typesOf = (kind: string): readonly number[] => [...new Set(expandToConcreteParseKinds([kind], nodeMap).flatMap((member) => typeOf(member) ?? []))];
	const flags = new Map<string, ReadonlyMap<string, QueryPlan | null>>();
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
	}
	return {
		nodeModel: emitPortableNodeModel(routes, readTest),
		surface: emitPortableSurface({
			routes,
			readTest,
			kindIdOf,
			fixedText: fixedTextKinds(nodeMap, kindEntries).map(([kind, text]) => [kindIdOf(kind), text] as const),
			flags: [...flags]
		})
	};
}
