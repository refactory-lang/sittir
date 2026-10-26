import type { NodeMap } from '../compiler/types.ts';
import { irPlanOf, type IrMember } from '../compiler/model/ir-surface.ts';
import { GENERATED_HEADER, IR_TYPE, irModuleOf, withMembers, type BuilderSurface, type Member, type Ref } from './overlays/module.ts';

const SURFACE_NOTE: Readonly<Record<BuilderSurface, string>> = {
	loose: "// The default engine's builder table: an entry takes loose input and coerces it.",
	strict: "// The strict engine's builder table: an entry takes built nodes, never text to coerce."
};

export function irNamespaceOf(nodeMap: NodeMap, refOf: (member: IrMember) => Ref): Ref {
	const plan = irPlanOf(nodeMap);
	const entry = (member: IrMember): Member => ({ key: member.key, ref: refOf(member) });
	return withMembers(undefined, false, [
		...plan.bundles.map(entry),
		...plan.variantParents.map((parent) => entry({ key: parent.key, node: parent.node, factory: parent.key })),
		...plan.keywords.map(entry),
		...plan.ownText.map(entry),
		...plan.patterns.map(entry),
		...plan.groups.map((group) => ({ key: group.key, ref: withMembers(undefined, false, group.members.map(entry)) }))
	]);
}

export function emitIrModule(surface: BuilderSurface): string {
	return [
		GENERATED_HEADER,
		'//',
		'// `ir.*` — flat namespace: every grammar kind exposed as `ir.<camelCaseKind>`.',
		'// `ir.<supertype>.*` — grouped namespaces: each member re-keyed by its',
		'//   supertype-stripped short name (e.g. `ir.expression.binary` === `ir.binaryExpression`).',
		'//',
		SURFACE_NOTE[surface],
		'',
		`import { buildTable, type ${IR_TYPE} } from './factories/build-table.js';`,
		`import * as table from './factories/${surface}.js';`,
		'',
		`export const ir: ${IR_TYPE}<typeof table> = buildTable(table);`,
		''
	].join('\n');
}

export function irModulePath(surface: BuilderSurface): string {
	return `${irModuleOf(surface)}.ts`;
}
