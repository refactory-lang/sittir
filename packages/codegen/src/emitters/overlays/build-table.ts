import type { NodeMap } from '../../compiler/types.ts';
import { flattenedVariantParents, type IrMember } from '../../compiler/model/ir-surface.ts';
import { irModulePath, emitIrModule, irNamespaceOf } from '../ir.ts';
import {
	ANY_TABLE_TYPE,
	BUILDER_SURFACES,
	GENERATED_HEADER,
	IR_TYPE,
	localRef,
	moduleRef,
	ROUTES_TYPE,
	TABLE_ACCESS,
	TABLE_PARAM,
	TABLE_TYPE,
	usedImports,
	withMembers,
	type BuilderSurface,
	type Ref
} from './module.ts';
import { refinedEntries, type RefinedEntry } from './refines.ts';
import { declOf, emitPolymorphsOverlay, ERASED_HELPERS, REFERENCE, sittirTypesImport, tableKeyOf, tableRefOf, type Decl, type PolymorphWires, type WiringChunk } from './polymorphs.ts';

interface BuilderTablesConfig {
	readonly nodeMap: NodeMap;
	readonly wires: PolymorphWires;
	readonly chunks: readonly WiringChunk[];
	readonly refined: ReadonlyMap<string, RefinedEntry>;
}

export interface BuilderTables {
	readonly files: Readonly<Record<string, string>>;
	readonly entryRows: ReadonlyMap<string, string>;
}

export function builderTables(nodeMap: NodeMap, wires: PolymorphWires): BuilderTables {
	const refined = refinedEntries(nodeMap);
	const { chunks, entryRows } = emitPolymorphsOverlay({ nodeMap, wires, refined });
	return { files: emitBuilderTables({ nodeMap, wires, chunks, refined }), entryRows };
}

function tokens(lines: readonly string[]): Set<string> {
	const out = new Set<string>();
	for (const line of lines) for (const [token] of line.matchAll(REFERENCE)) out.add(token);
	return out;
}

function reached(
	byToken: ReadonlyMap<string, WiringChunk>,
	roots: readonly string[],
	linesOf: (chunk: WiringChunk) => readonly string[]
): Set<WiringChunk> {
	const kept = new Set<WiringChunk>();
	let frontier = roots;
	while (frontier.length > 0) {
		const found = [...tokens(frontier)].map((token) => byToken.get(token)).filter((chunk) => chunk !== undefined && !kept.has(chunk)) as WiringChunk[];
		for (const chunk of found) kept.add(chunk);
		frontier = found.flatMap(linesOf);
	}
	return kept;
}

function emitBuilderTables(config: BuilderTablesConfig): Record<string, string> {
	const { nodeMap, wires, refined } = config;
	const emitted = new Set(config.chunks.map((chunk) => chunk.name));
	const refinedOnly: WiringChunk[] = [...refined]
		.filter(([key]) => !emitted.has(key))
		.map(([key, { node, members }]) => ({
			name: key,
			decls: [declOf(key, withMembers(tableRefOf(node), false, members))],
			combinators: [],
			seated: { loose: [], strict: [] }
		}));
	const chunks = [...refinedOnly, ...config.chunks];
	const locals = new Set(chunks.map((chunk) => chunk.name));
	const flattenedKinds = new Set(flattenedVariantParents(nodeMap).map((parent) => parent.node.kind));
	const refOf = (member: IrMember): Ref => {
		if (flattenedKinds.has(member.node.kind)) return localRef(member.factory);
		if (member.factory === member.node.rawFactoryName) return moduleRef('F', member.factory);
		return locals.has(member.factory) ? localRef(member.factory) : tableRefOf(member.node);
	};
	const namespace = irNamespaceOf(nodeMap, refOf);
	const wired = reached(new Map(chunks.map((chunk) => [chunk.name, chunk])), [namespace.value], (chunk) => chunk.decls.map((decl) => decl.value));
	const seatedRoots = [...wired].flatMap((chunk) => BUILDER_SURFACES.flatMap((surface) => chunk.seated[surface]));
	const seats = reached(new Map(chunks.map((chunk) => [`${chunk.name}$seated`, chunk])), seatedRoots, (chunk) => chunk.seated.strict);
	const tabled = chunks.filter((chunk) => wired.has(chunk) || seats.has(chunk));
	const decls: Decl[] = chunks.filter((chunk) => wired.has(chunk)).flatMap((chunk) => chunk.decls);
	const generic = `<${TABLE_TYPE} extends ${ANY_TABLE_TYPE}>`;
	const declarations = [
		`export type ${ANY_TABLE_TYPE} = ${BUILDER_SURFACES.map((surface) => `typeof ${tableTypeOf(surface)}`).join(' | ')};`,
		'',
		`export interface ${ROUTES_TYPE}${generic} {`,
		...decls.map((decl) => `\treadonly ${decl.name}: ${decl.type};`),
		'}',
		'',
		`export interface ${IR_TYPE}${generic} ${namespace.type}`,
		'',
		`export function buildTable${generic}(${TABLE_PARAM}: ${TABLE_TYPE}): ${IR_TYPE}<${TABLE_TYPE}> {`,
		`\tconst ${TABLE_ACCESS} = <K extends keyof ${TABLE_TYPE}>(key: K): ${TABLE_TYPE}[K] => ${TABLE_PARAM}[key];`,
		...decls.map((decl) => `\tconst ${decl.name}: ${localRef(decl.name).type} = ${decl.value};`),
		`\treturn ${namespace.value};`,
		'}'
	];
	const buildTable = [
		GENERATED_HEADER,
		...usedImports(
			[
				"import * as F from './raw.js';",
				"import * as K from './combinators.js';",
				"import { delegate } from '@sittir/common/utils';",
				...sittirTypesImport(declarations),
				"import { TSKindId } from '../types.js';",
				"import type * as T from '../types.js';"
			],
			declarations
		),
		...BUILDER_SURFACES.map((surface) => `import type * as ${tableTypeOf(surface)} from './${surface}.js';`),
		'',
		...declarations,
		''
	].join('\n');

	const combinatorLines = tabled.flatMap((chunk) => (chunk.combinators.length === 0 ? [] : [...chunk.combinators, '']));
	const combinatorBody = combinatorLines.length === 0 ? [] : [...ERASED_HELPERS, ...combinatorLines];
	const combinators = [
		GENERATED_HEADER,
		...usedImports(
			[
				...sittirTypesImport(combinatorBody),
				"import { isGroupConfig } from '@sittir/common/utils';",
				"import { TSKindId } from '../types.js';",
				"import type * as T from '../types.js';"
			],
			combinatorBody
		),
		'',
		...combinatorBody
	].join('\n');

	const keyed = [...nodeMap.nodes.values()].filter((node) => node.rawFactoryName !== undefined && wires.coerceEmitted(node));
	const tableOf = (surface: BuilderSurface): string => {
		const seated = tabled.flatMap((chunk) => (chunk.seated[surface].length === 0 ? [] : [...chunk.seated[surface], '']));
		const builders =
			surface === 'loose'
				? `export { ${keyed.map((node) => `${node.fromFunctionName} as ${tableKeyOf(node)}`).join(', ')} } from './coerce.js';`
				: `export { ${keyed.map((node) => tableKeyOf(node)).join(', ')} } from './raw.js';`;
		return [
			GENERATED_HEADER,
			...usedImports(
				[
					"import * as F from './raw.js';",
					"import * as C from './coerce.js';",
					"import * as K from './combinators.js';",
					"import { withEmptyForm } from '@sittir/common/utils';",
					...sittirTypesImport(seated),
					"import type * as T from '../types.js';"
				],
				seated
			),
			'',
			builders,
			'',
			...seated
		].join('\n');
	};

	return {
		'factories/combinators.ts': combinators,
		'factories/build-table.ts': buildTable,
		...Object.fromEntries(BUILDER_SURFACES.flatMap((surface) => [
			[`factories/${surface}.ts`, tableOf(surface)],
			[irModulePath(surface), emitIrModule(surface)]
		]))
	};
}

function tableTypeOf(surface: BuilderSurface): string {
	return surface === 'loose' ? 'LooseTable' : 'StrictTable';
}
