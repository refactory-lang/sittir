import { resolveRoutes, valueTokensOf, type GrammarInput, type ReadEntry } from '../../../bindings/routes.ts';
import { byCodepoint, compositionOf, declaredFlags } from '../../../bindings/vocabulary.ts';
import type { NodeMap } from '../../../compiler/types.ts';
import { findKindEntry, fixedTextKinds, kindDiscriminantExpr, type KindEnumEntry } from '../../kind-discriminant.ts';
import type { QueryPlan } from '@sittir/types';
import { PORTABLE_BUILD_FILE, PORTABLE_MAP_FILE, grammarNodeTypeName, moduleSpecifier } from '../../../grammars.ts';
import { valueParseKindsOf } from '../../../compiler/model/node-map.ts';
import { isSlotBearingCompound } from '../../shared.ts';
import { membershipKindsOf } from '../../membership.ts';
import { emitPortableBuild, type PickDiagnostic } from './build.ts';
import { flagPlansOf, slotFlagsOf } from './flags.ts';
import { emitPortableNodeModel } from './node-model.ts';
import { familyCoverageOf } from './covered.ts';
import type { Body } from '../../render-body.ts';
import { portableFactOf, presenceKeywordOf, readTestOf, slotSubjectOf } from './read-tests.ts';
import { emitPortableSurface } from './surface.ts';
import { emitPortableTyped, type PortableTypedOutput } from './typed.ts';
import { grammarMapName, scalarInputsOf, VOCABULARY_MODULE, type ScalarInput } from './grammar-map.ts';
import type { ExactSet } from './exact.ts';
import type { PortableBuildTable } from '@sittir/types';
import type { PortableEmitInput, PortableEmitSlot } from './emit-input.ts';

export interface PortableOutputs {
	readonly nodeModel: string;
	readonly surface: string;
	readonly build: string;
	readonly emit: PortableEmitInput<PortableBuildTable>;
	readonly typed: PortableTypedOutput;
	readonly pickDiagnostics: readonly PickDiagnostic[];
}

export function emitPortable(input: GrammarInput, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[], bodies: ReadonlyMap<string, Body>): PortableOutputs {
	const routes = resolveRoutes(input);
	const typeOf = (kind: string) => findKindEntry(kindEntries, kind)?.id;
	const readTest = (entry: ReadEntry) => readTestOf(entry, input.model, slotSubjectOf(nodeMap), presenceKeywordOf(nodeMap), typeOf);
	const kindIdOf = (kind: string) => kindDiscriminantExpr(kind, nodeMap, kindEntries);
	const factOf = (entry: ReadEntry) =>
		portableFactOf(entry, readTest(entry), input.model, slotSubjectOf(nodeMap), (container, slot) => routes.containers.get(container)?.slots?.find((candidate) => candidate.slot.name === slot)?.name);
	const typesOf = (kind: string): readonly number[] => [...new Set(membershipKindsOf([kind], nodeMap).flatMap((member) => typeOf(member) ?? []))];
	const flags = new Map<string, ReadonlyMap<string, QueryPlan | null>>();
	const plansByKind = new Map<string, ReadonlyMap<string, QueryPlan | null>>();
	const flagTypes: (readonly [string, readonly string[]])[] = [];
	for (const kind of [...new Set([...routes.slots.keys(), ...routes.readEntries.keys()])].sort()) {
		if (typeOf(kind) === undefined) continue;
		const plans = flagPlansOf({
			kind,
			slots: routes.slots.get(kind) ?? [],
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
	const build = emitPortableBuild({ routes, model: input.model, nodeMap, kindEntries, flagPlans: plansByKind, features: [...input.vocabulary.featuresOf(compositionOf(input.grammar))].sort(byCodepoint), factOf, readTest, flagsOf: (path) => declaredFlags(input.vocabulary, path), valueScalarOf: (path) => (input.vocabulary.kinds.has(path) ? input.vocabulary.slots(path).get('$value')?.scalar : undefined), bodies });
	const coverage = familyCoverageOf({ routes, nodeMap, table: build.table, readTest });
	const typed = emitPortableTyped({ routes, input, nodeMap, kindEntries, readTest, table: build.table, presetCarried: build.presetCarried, covered: new Set(coverage.map(({ entry }) => entry)), totalIntegerReads: build.totalIntegerReads, freeTextClosedBy: build.freeTextClosedBy, flags: new Map([...plansByKind].map(([kind, plans]) => [kind, [...plans.keys()]])) });
	return {
		build: build.source,
		emit: {
			grammar: input.grammar,
			map: grammarMapName(input.grammar),
			node: grammarNodeTypeName(nodeMap.name),
			imports: { vocabulary: VOCABULARY_MODULE, builders: moduleSpecifier(PORTABLE_BUILD_FILE, 'ir-strict.ts'), map: moduleSpecifier(PORTABLE_BUILD_FILE, PORTABLE_MAP_FILE), utils: '@sittir/common/portable/utils', nodes: '@sittir/common/utils', types: moduleSpecifier(PORTABLE_BUILD_FILE, 'types.ts') },
			table: build.table,
			slots: emitSlotsOf(typed.slots, scalarInputsOf(build.table), (path, slot) => input.vocabulary.slots(path).get(slot)?.optional === true),
			viewed: typed.reads.viewed,
			textPaths: typed.reads.textPaths,
			textInputs: typed.textInputs,
			textValues: typed.textValues,
			holes: build.holes,
			decided: Object.fromEntries(typed.decided.map(([path, slotKinds]) => [path, Object.fromEntries(slotKinds)]))
		},
		typed,
		pickDiagnostics: [
			...build.diagnostics,
			...routes.unplaced.map(
				(claim): PickDiagnostic => ({ code: 'portable-claim-unplaced', path: claim.vocab, kinds: [claim.kind ?? (claim.token === undefined ? '(_)' : `"${claim.token}"`)] })
			)
		],
		nodeModel: emitPortableNodeModel(routes, readTest, coverage),
		surface: emitPortableSurface({
			nodeType: grammarNodeTypeName(nodeMap.name),
			routes,
			readTest,
			factOf,
			kindIdOf,
			fixedText: fixedTextKinds(nodeMap, kindEntries).map(([kind, text]) => [kindIdOf(kind), text] as const),
			literals: [...valueTokensOf(routes, new Map(fixedTextKinds(nodeMap, kindEntries)))].sort().map(kindIdOf),
			flags: [...flags],
			flagTypes,
			slotFlags: [...slotFlags].map(([id, { slots }]) => [id, slots] as const),
			slotFlagTypes
		})
	};
}

function emitSlotsOf(
	exact: ReadonlyMap<string, ReadonlyMap<string, ExactSet>>,
	scalars: ReadonlyMap<string, readonly ScalarInput[]>,
	optional: (path: string, slot: string) => boolean
): PortableEmitInput<PortableBuildTable>['slots'] {
	return Object.fromEntries(
		[...exact].map(([path, slots]) => [
			path,
			Object.fromEntries([...slots].map(([slot, set]): [string, PortableEmitSlot] => [
				slot,
				{
					paths: set.kinds,
					texts: set.texts,
					unmapped: set.unmapped,
					string: set.scalars.includes('string'),
					numbers: [...new Set(set.kinds.flatMap((at) => scalars.get(at) ?? []))].sort(),
					optional: optional(path, slot)
				}
			]))
		])
	);
}
