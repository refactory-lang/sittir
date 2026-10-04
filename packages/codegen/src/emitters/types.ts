import { collectPolymorphWires, seatedRowsOf, type PolymorphWires } from './overlays/polymorphs.ts';
import { findOwnKindEntry, modelKindOfEntry } from '../dsl/symbol-table.ts';
import { ERROR_KIND_ID, ERROR_KIND_NAME } from '@sittir/common/error-kind';
import type { SlotBearingCompound } from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { isWordOrBuilderTextLeaf, isBuilderlessPunctuationLeaf } from '../compiler/model/node-map.ts';
import { isFixedTextLeaf, isKindIdStored, kindIdText } from '../compiler/model/node-map.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import { assertNever } from '../polymorph-variant.ts';
import { bareInteriorText, numberInputType, numericLeafInputTypes, numericLeafShape, numericSlotShape, widenNumericSlots } from './interior.ts';
import {
	collectKindEntries,
	collectCatalogKinds,
	kindDiscriminantExpr,
	kindIdMemberName,
	findKindEntry,
	findKindEntryForLiteral,
	type KindEnumEntry
} from './kind-discriminant.ts';
import { kindTypeName } from '../compiler/model/casing.ts';
import { grammarTypePrefix } from '../grammars.ts';
import { grammarTypeMapName } from './engine.ts';
import { buildTriviaNodeType, resolveTriviaTypeNames } from './client-utils.ts';
export {
	collectKindEntries,
	collectCatalogKinds,
	kindDiscriminantExpr,
	kindIdMemberName,
	type KindEnumEntry
} from './kind-discriminant.ts';

function hasKindId(kind: string, kindEntries: readonly KindEnumEntry[] | undefined): boolean {
	return kindEntries !== undefined && findOwnKindEntry(kindEntries, kind) !== undefined;
}

function stampedDiscriminant(
	kind: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	if (!kindEntries || findKindEntry(kindEntries, kind) === undefined) return JSON.stringify(kind);
	return kindDiscriminantExpr(kind, nodeMap, kindEntries);
}

function kindIdOrNever(kind: string, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): string {
	return hasKindId(kind, kindEntries) ? kindDiscriminantExpr(kind, nodeMap, kindEntries) : 'never';
}

function kindDiscriminantOrLiteral(
	kind: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	if (!kindEntries) return JSON.stringify(kind);
	const hasEntry = findOwnKindEntry(kindEntries, kind) !== undefined;
	if (!hasEntry) return JSON.stringify(kind);
	return kindDiscriminantExpr(kind, nodeMap, kindEntries);
}
import type {
	AssembledNode,
	AssembledNonterminal
} from '../compiler/model/node-map.ts';
import { AssembledAlias, AssembledList, AssembledEnum, fixedTextOfKind, snakeToCamel } from '../compiler/model/node-map.ts';
import {
	DELIMITER_IMPORT,
	isRequired,
	isMultiple,
	isNonEmpty,
	hasOptionalElements,
	slotKindNames,
	slotLiteralValues,
	referencedKinds,
	fieldTypeComponents,
	isValidIdent,
	isSlotBearingCompound,
	resolveFieldStorageInfo,
	emitsBuildArgsAlias,
	emitsPlainBuiltAlias,
	isWrapChildrenKind,
	stringConstructibleTexts,
	classifyFromEmission,
	fromBareInput,
	bareValueSlot,
	scalarLeafKinds,
	lexedContentSlot,
	canonicalSeparatedListField,
	enumMemberDiscriminant,
	pruneUnusedImports,
	importLocalName,
	isDeclaredSupertype
} from './shared.ts';
import {
	constructorTargetKind,
	builtTypeSurfaceOf,
	listViewHint,
	elementConfigsOf,
	listSlotHints,
	groupSeatHints,
	omitRegistered,
	spellingTypeOf,
	refineFormBuiltTypeSurfaceOf,
	separatedListSurface,
	type BuiltTypeSurface
} from './factories.ts';
import { resolveBitflagConstName } from './consts.ts';
import { refineFormTypeName, collectRefineKindInfos } from './refine-emit.ts';
import type { RefineKindInfo } from './refine-emit.ts';
import { armAliasesOf, hintEmitterOf, type AddressTables, type HintEmitter, type HintRoot } from './options.ts';
import type { SitePreference } from '../compiler/model/site-preferences.ts';
import { displayNameOf, displayedKinds, ownsItsDisplay } from '../compiler/model/display-name.ts';
import { emptyForms, innerGapsKeyed } from '../compiler/model/trivia.ts';

type StructuralNode = SlotBearingCompound;

export interface EmitTypesConfig {
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
	sites?: readonly SitePreference[];
	addresses?: AddressTables;
	triviaKinds?: readonly string[];
	wires?: PolymorphWires;
	entryRows?: ReadonlyMap<string, string>;
}

const missingKindTypes = new Map<string, string>();
const referencedBitflagConsts = new Set<string>();

export interface TypesModules {
	readonly types: string;
	readonly internal: string;
}

export function emitTypes(config: EmitTypesConfig): string {
	return emitTypesModules(config).types;
}

export function emitTypesModules(config: EmitTypesConfig): TypesModules {
	missingKindTypes.clear();
	referencedBitflagConsts.clear();
	const { grammar, nodeMap } = config;
	const { generatedIdTables } = config;
	const { structNodes, leafKinds, supertypes, keywordKinds, leafValueMap } = collectNodesByCategory(nodeMap);

	const grammarPrefix = grammarTypePrefix(grammar);

	const nodeKinds = structNodes.map((n) => n.kind);
	const allKinds = [...nodeKinds, ...leafKinds];
	const generatedTypes = new Set<string>();
	const kindEntries = generatedIdTables
		? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
		: undefined;

	const lines: string[] = [];
	lines.push('// Auto-generated by @sittir/codegen — do not edit');
	lines.push('');
	const sittirImportIndex = lines.length;
	lines.push('__SITTIR_TYPES_IMPORT__');
	lines.push('');

	const leafMapKey = (kind: string): string => `[${kindDiscriminantOrLiteral(kind, nodeMap, kindEntries)}]`;
	lines.push('export type LeafScalarMap = {');
	const scalars = scalarLeafKinds(nodeMap);
	const scalarEntries = new Map<string, string>();
	if (scalars.boolean !== undefined) {
		scalarEntries.set(scalars.boolean.trueKind, 'boolean');
		scalarEntries.set(scalars.boolean.falseKind, 'boolean');
	}
	for (const [kind, input] of numericLeafInputTypes(nodeMap)) scalarEntries.set(kind, input);
	for (const kind of leafKinds) {
		const node = nodeMap.nodes.get(kind);
		if (node?.modelType === 'enum' && node.values.every((v) => /^\d+$/.test(v))) scalarEntries.set(kind, 'number');
	}
	for (const [kind, scalar] of scalarEntries) lines.push(`  ${leafMapKey(kind)}: ${scalar};`);
	lines.push('};');
	lines.push('');

	lines.push('export type LeafStringMap = {');
	for (const kind of leafKinds) {
		const kw = keywordKinds.get(kind);
		if (kw) {
			lines.push(`  ${leafMapKey(kind)}: ${JSON.stringify(kw)};`);
			continue;
		}
		const values = leafValueMap.get(kind);
		if (values && values.length > 0) {
			lines.push(`  ${leafMapKey(kind)}: ${values.map((v) => JSON.stringify(v)).join(' | ')};`);
		}
	}
	lines.push('};');
	lines.push('');

	if (kindEntries) emitKindIdEnumAndLookups(lines, kindEntries, nodeMap);
	const arms = kindEntries === undefined || config.sites === undefined ? undefined : armAliasesOf(nodeMap, kindEntries, config.sites);
	if (arms !== undefined) {
		lines.push(`export type SpacingArm = ${arms.spacingType};`);
		lines.push(`export type WhitespaceArm = ${arms.whitespaceType};`);
		lines.push('');
	}
	const hints = kindEntries !== undefined && config.addresses !== undefined ? hintEmitterOf(config.addresses, kindEntries, arms, displayedKinds(nodeMap)) : undefined;

	if (supertypes.length > 0) {
		lines.push('// Scoped enums per supertype');
		const emittedKindEnums = new Set<string>();
		for (const st of supertypes) {
			const stNode = nodeMap.nodes.get(st.kind);
			const typeName = stNode?.typeName ?? kindTypeName(st.kind);
			const enumName = typeName + 'Kind';
			if (emittedKindEnums.has(enumName)) continue;
			emittedKindEnums.add(enumName);
			lines.push(`export enum ${enumName} {`);
			const seenSubMembers = new Set<string>();
			for (const sub of st.subtypes) {
				const subNode = nodeMap.nodes.get(sub);
				const member = subNode?.typeName ?? kindTypeName(sub);
				if (seenSubMembers.has(member)) continue;
				seenSubMembers.add(member);
				lines.push(`  ${member} = ${JSON.stringify(sub)},`);
			}
			lines.push('}');
			lines.push('');
		}
	}

	lines.push('// Node types — concrete interfaces');

	const lookupUnion: LookupUnion = makeInliningLookupUnion();

	for (const node of structNodes) {
		generatedTypes.add(node.typeName);

		emitInterface(
			lines,
			node,
			nodeMap,
			lookupUnion,
			stampedDiscriminant(node.kind, nodeMap, kindEntries),
			kindEntries
		);
	}
	lines.push('');

	emitLeafTerminalAliases(lines, leafKinds, nodeMap, generatedTypes, kindEntries);

	for (const [kind, name] of missingKindTypes) {
		if (generatedTypes.has(name)) continue;
		generatedTypes.add(name);
		const fallbackDiscriminant = kindDiscriminantOrLiteral(kind, nodeMap, kindEntries);
		lines.push(`export type ${name} = Terminal<${fallbackDiscriminant}, string>;`);
	}
	if (missingKindTypes.size > 0) lines.push('');

	const refineInfos = collectRefineKindInfos(nodeMap);

	const internalLines: string[] = [];
	const emittedSupertypes = emitSupertypeUnionDeclarations(lines, internalLines, supertypes, nodeMap, generatedTypes);
	emitSupertypeNamespaces(lines, internalLines, emittedSupertypes);

	collectAndEmitTokenTypeAliases(lines, nodeMap, generatedTypes, kindEntries);

	lines.push(`export type ${grammarPrefix}Node = NodeOfNamespaces<NamespaceMap>;`);
	lines.push('');

	emitOptionsHints(lines, internalLines, [...allKinds.map((kind) => ({ kind, typeName: nodeMap.nodes.get(kind)?.typeName })), ...emittedSupertypes], generatedTypes, hints, nodeMap);

	assertNoCamelCaseCollisions(nodeKinds);

	lines.push('// Per-kind namespace interfaces — one computed base per kind');
	const namespaceKinds = nodeKinds.filter(
		(kind) =>
			generatedTypes.has(nodeMap.nodes.get(kind)!.typeName) &&
			kindEntries !== undefined &&
			findKindEntry(kindEntries, kind) !== undefined
	);
	for (const kind of namespaceKinds) {
		const node = nodeMap.nodes.get(kind)!;
		emitNamespaceInterfaceLine(
			lines,
			node.typeName,
			emitsPlainBuiltAlias(kind, node, { nodeMap, kindEntries })
				? builtTypeSurfaceOf(node, nodeMap, kindEntries)
				: undefined,
			coercerRowArgs(kind, node, nodeMap, kindEntries),
			emptyForms(nodeMap).get(kind)?.typeName
		);
	}
	const keywordNamespaceKinds = leafKinds.filter((kind) => {
		const node = nodeMap.nodes.get(kind)!;
		return isFixedTextLeaf(node) && generatedTypes.has(node.typeName) && hasKindId(kind, kindEntries);
	});
	for (const kind of keywordNamespaceKinds) {
		const node = nodeMap.nodes.get(kind)!;
		lines.push(
			`export interface ${node.typeName}Ns extends KeywordNs<${kindDiscriminantExpr(kind, nodeMap, kindEntries)}, ${JSON.stringify(fixedTextOfKind(node))}, ${kindDiscriminantExpr(kind, nodeMap, kindEntries)}> {}`
		);
	}
	const leafNamespaceKinds = leafKinds.filter((kind) => {
		const node = nodeMap.nodes.get(kind)!;
		return (
			!isKindIdStored(node) &&
			generatedTypes.has(node.typeName) &&
			emitsBuildArgsAlias(kind, node, { nodeMap, kindEntries })
		);
	});
	for (const kind of leafNamespaceKinds) {
		const node = nodeMap.nodes.get(kind)!;
		lines.push(
			`export interface ${node.typeName}Ns extends LeafNs<${node.typeName}, ${leafConstructionTextType(node)}, ${node.typeName}.Bound, ${kindIdOrNever(kind, nodeMap, kindEntries)}> {}`
		);
	}
	lines.push('');

	const namespaceMapKinds = [
		...namespaceKinds,
		...keywordNamespaceKinds,
		...leafNamespaceKinds.filter((kind) => hasKindId(kind, kindEntries))
	];
	lines.push('export interface NamespaceMap {');
	for (const kind of namespaceMapKinds) {
		const node = nodeMap.nodes.get(kind)!;
		lines.push(`  [${kindDiscriminantOrLiteral(kind, nodeMap, kindEntries)}]: ${node.typeName}Ns;`);
	}
	lines.push('}');
	lines.push('');
	const surfaceKinds = [...namespaceKinds, ...leafNamespaceKinds.filter((kind) => hasKindId(kind, kindEntries))];
	for (const surfaceName of ['Bound', 'Parsed']) {
		lines.push(`export interface ${surfaceName}ByKindId {`);
		for (const kind of surfaceKinds) {
			const node = nodeMap.nodes.get(kind)!;
			lines.push(`  [${kindDiscriminantOrLiteral(kind, nodeMap, kindEntries)}]: ${node.typeName}.${surfaceName};`);
		}
		lines.push('}');
		lines.push('');
	}

	const fixedTextKindIds = new Set(
		[...nodeMap.nodes]
			.filter(([kind, node]) => kindIdText(node) !== undefined && hasKindId(kind, kindEntries))
			.map(([kind]) => kindDiscriminantExpr(kind, nodeMap, kindEntries))
	);
	lines.push(`export type FixedTextKindId = ${fixedTextKindIds.size > 0 ? [...fixedTextKindIds].join(' | ') : 'never'};`);
	lines.push('');

	lines.push('export interface IrKeyOf {');
	for (const kind of namespaceMapKinds) {
		const node = nodeMap.nodes.get(kind)!;
		if (node.irKey === undefined || !hasKindId(kind, kindEntries)) continue;
		lines.push(`  [${kindDiscriminantOrLiteral(kind, nodeMap, kindEntries)}]: ${JSON.stringify(node.irKey)};`);
	}
	lines.push('}');
	lines.push('');

	lines.push("export type ConfigFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Config'];");
	lines.push("export type BoundFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Bound'];");
	lines.push("export type LooseFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Loose'];");
	lines.push("export type LooseConfigFor<K extends keyof NamespaceMap> = NamespaceMap[K]['LooseConfig'];");
	lines.push("export type BuildArgsFor<K extends keyof NamespaceMap> = NamespaceMap[K]['BuildArgs'];");
	lines.push("export type LooseArgsFor<K extends keyof NamespaceMap> = NamespaceMap[K]['LooseArgs'];");
	lines.push('');

	lines.push('// Namespace sugar — merges with each data interface so consumers can write');
	lines.push('// <TypeName>.Config / .Bound / .Parsed / .Loose alongside using <TypeName> as a type.');
	const refineInfoByKind = new Map<string, RefineKindInfo>();
	for (const info of refineInfos ?? []) refineInfoByKind.set(info.kind, info);
	const wires = config.wires ?? collectPolymorphWires(nodeMap, generatedIdTables, { silent: true });
	for (const kind of namespaceKinds) {
		const node = nodeMap.nodes.get(kind)!;
		emitNamespaceSugarBlock(
			lines,
			kind,
			node,
			refineInfoByKind.get(kind),
			kindDiscriminantOrLiteral(kind, nodeMap, kindEntries),
			nodeMap,
			kindEntries,
			wires
		);
	}
	for (const kind of [...keywordNamespaceKinds, ...leafNamespaceKinds]) {
		const node = nodeMap.nodes.get(kind)!;
		const ns = `${node.typeName}Ns`;
		const surface = isKindIdStored(node) ? undefined : builtTypeSurfaceOf(node, nodeMap, kindEntries);
		lines.push(`export namespace ${node.typeName} {`);
		for (const member of ['Config', 'Bound', 'Parsed', 'Loose', 'LooseConfig', 'BuildArgs', 'LooseArgs']) {
			if (member === 'Bound' && surface !== undefined) emitNodeSurfaceInterfaces(lines, surface, '  ');
			else if (member === 'Parsed' && surface !== undefined) continue;
			else if (member === 'Parsed') lines.push(`  export type Parsed = ${ns}['Bound'];`);
			else lines.push(`  export type ${member} = ${ns}['${member}'];`);
		}
		lines.push(`  export type Kind = ${kindIdOrNever(kind, nodeMap, kindEntries)};`);
		lines.push('}');
	}
	lines.push('');

	const keyed = innerGapsKeyed(nodeMap);
	lines.push(...emitGrammarTypeMap(grammar, nodeMap, config.triviaKinds ?? [], keyed));
	for (const [kind, empty] of emptyForms(nodeMap)) {
		const node = nodeMap.nodes.get(kind)!;
		const gaps = keyed ? `, ${empty.gaps.map((gap) => JSON.stringify(gap)).join(' | ')}` : '';
		lines.push(
			...(groupSeatHints(node, nodeMap, kindEntries).length > 0
				? [
						`export type ${empty.typeName} = ${node.typeName}.Bound & {`,
						`  readonly $trivia: TriviaSetterOf<${empty.typeName}> & InnerTrivia<${empty.typeName}${gaps}>;`,
						'};'
					]
				: [
						`export interface ${empty.typeName} extends ${node.typeName}.Bound {`,
						`  readonly $trivia: TriviaSetterOf<this> & InnerTrivia<this${gaps}>;`,
						'}'
					])
		);
	}
	lines.push('');

	if (referencedBitflagConsts.size > 0) {
		const sortedNames = [...referencedBitflagConsts].sort();
		const importLine = `import { ${sortedNames.join(', ')} } from './consts.js';`;
		lines.splice(sittirImportIndex + 1, 0, importLine);
	}

	const body = lines.slice(sittirImportIndex + 1).join('\n');
	if (/\bF\$\./.test(body)) {
		lines.splice(sittirImportIndex + 1, 0, `import type * as F$ from './factories/raw.js';`);
	}
	if (/\bERROR_KIND_ID\b/.test(body)) {
		lines.splice(sittirImportIndex + 1, 0, `import type { ERROR_KIND_ID } from '@sittir/common/error-kind';`);
	}
	if (/\bT\.[A-Za-z_]/.test(body)) {
		lines.splice(sittirImportIndex + 1, 0, `import type * as T from './types.js';`);
	}
	const bodyText = lines.slice(sittirImportIndex + 1).join('\n');
	const internalNames = [...new Set(emittedSupertypes.filter((st) => st.internal).map((st) => st.typeName))].filter((name) =>
		new RegExp(`(?<![.\\w])${name}\\b(?!\\s*=\\s*\\d)`).test(bodyText)
	);
	if (internalNames.length > 0) {
		lines.splice(sittirImportIndex + 1, 0, `import type { ${internalNames.join(', ')} } from './types-internal.js';`);
	}
	lines[sittirImportIndex] = `import type { ${VOCABULARY_IMPORTS.join(', ')} } from '@sittir/types';`;
	lines.splice(sittirImportIndex + 1, 0, DELIMITER_IMPORT);

	if (config.entryRows !== undefined) {
		internalLines.push('export interface SubBuilderRowKind {');
		for (const [path, kind] of config.entryRows) {
			internalLines.push(`  ${JSON.stringify(path)}: ${kindDiscriminantOrLiteral(kind, nodeMap, kindEntries)};`);
		}
		internalLines.push('}', '');
	}

	const types = pruneUnusedImports(lines, ['Delimiter', ...VOCABULARY_IMPORTS.map(importLocalName)]).join('\n');
	const internalAliases = new Set(emittedSupertypes.filter((st) => st.internal).map((st) => st.typeName));
	return { types, internal: internalModule(internalLines, [...generatedTypes].filter((name) => !internalAliases.has(name))) };
}

function internalModule(internalLines: readonly string[], publicTypeNames: readonly string[]): string {
	const body = internalLines.join('\n');
	const used = [...publicTypeNames, 'TSKindId'].filter((name) => new RegExp(`(?<![.\\w])${name}\\b(?!\\s*=)`).test(body));
	return [
		'// Auto-generated by @sittir/codegen — do not edit',
		'',
		...(used.length > 0 ? [`import type { ${used.join(', ')} } from './types.js';`] : []),
		"export type * from './types.js';",
		'',
		body
	].join('\n');
}

const VOCABULARY_IMPORTS = [
	'ConfigOf',
	'LooseConfigOf',
	'WidenNumeric',
	'LooseValue',
	'NodeNs',
	'KeywordNs',
	'LeafNs',
	'Terminal',
	'NonEmptyArray',
	'BooleanKeyword as BaseBooleanKeyword',
	'Bitflag',
	'KindEnum',
	'NodeOfNamespaces',
	'OmitEach',
	'NoneOf',
	'WithoutGroup',
	'RenameKeys',
	'GrammarTypeMap',
	'NodeMethods',
	'TriviaSetter',
	'GrammarInnerTrivia',
	'GrammarInnerTriviaAt',
	'SlotHint',
	'ListViewHint',
	'ListSlotHint',
	'FlatHint',
	'FlatShapesOf',
	'BoundOf',
	'ParsedOf',
	'Admit',
	'ListOptions',
	'SupertypeSurface',
	'WithNode',
	'BoundWithNode',
	'QueryFacet'
];

function emitGrammarTypeMap(grammar: string, nodeMap: NodeMap, triviaKinds: readonly string[], keyed: boolean): string[] {
	const map = grammarTypeMapName(grammar);
	const trivia = `${map}['trivia']`;
	const empties = [...emptyForms(nodeMap)].map(
		([kind, empty]) => `{ readonly node: ${nodeMap.nodes.get(kind)!.typeName}; readonly empty: ${empty.typeName} }`
	);
	return [
		`export interface ${map} extends GrammarTypeMap {`,
		'  readonly namespaces: NamespaceMap;',
		`  readonly empty: ${empties.length > 0 ? empties.join(' | ') : 'never'};`,
		`  readonly trivia: ${buildTriviaNodeType(resolveTriviaTypeNames(triviaKinds, nodeMap))};`,
		'}',
		'',
		`export type NodeMethodsOf = NodeMethods<${trivia}>;`,
		`export type TriviaSetterOf<Self> = TriviaSetter<Self, ${trivia}>;`,
		keyed
			? `export type InnerTrivia<N, Gap extends string> = GrammarInnerTriviaAt<N, ${trivia}, Gap>;`
			: `export type InnerTrivia<N> = GrammarInnerTrivia<N, ${trivia}>;`,
		''
	];
}

interface NodeCategories {
	structNodes: StructuralNode[];
	leafKinds: string[];
	supertypes: { kind: string; subtypes: string[] }[];
	keywordKinds: Map<string, string>;
	leafValueMap: Map<string, string[]>;
}

function collectNodesByCategory(nodeMap: NodeMap): NodeCategories {
	const structNodes: StructuralNode[] = [];
	const leafKinds: string[] = [];
	const supertypes: { kind: string; subtypes: string[] }[] = [];
	const keywordKinds = new Map<string, string>();
	const leafValueMap = new Map<string, string[]>();

	for (const [kind, node] of nodeMap.nodes) {
		switch (node.modelType) {
			case 'envelope':
			case 'branch':
			case 'polymorph':
			case 'alias':
				structNodes.push(node);
				break;
			case 'supertype':
				supertypes.push({ kind, subtypes: [...node.subtypeNames] });
				break;
			case 'list':
				structNodes.push(node);
				break;
			case 'pattern':
				leafKinds.push(kind);
				break;
			case 'keyword':
			case 'punctuation':
				if (isWordOrBuilderTextLeaf(node)) {
					leafKinds.push(kind);
					keywordKinds.set(kind, node.text);
				}
				break;
			case 'enum':
				leafKinds.push(kind);
				leafValueMap.set(kind, node.values);
				break;
			default:
				assertNever(node);
		}
	}
	return { structNodes, leafKinds, supertypes, keywordKinds, leafValueMap };
}

export function collectAllKinds(nodeMap: NodeMap): readonly string[] {
	const { structNodes, leafKinds } = collectNodesByCategory(nodeMap);
	return [...structNodes.map((n) => n.kind), ...leafKinds];
}

function emitKindIdEnumAndLookups(lines: string[], entries: KindEnumEntry[], nodeMap: NodeMap): void {
	lines.push('export enum TSKindId {');
	for (const entry of entries) {
		lines.push(`  ${entry.member} = ${entry.id},`);
	}
	lines.push('}');
	lines.push('Object.freeze(TSKindId);');
	lines.push('');
	const errorEntry = entries.find((entry) => entry.id === ERROR_KIND_ID);
	if (errorEntry === undefined) throw new Error(`types.ts: TSKindId has no ${ERROR_KIND_NAME} member`);
	lines.push(`void (TSKindId.${errorEntry.member} satisfies typeof ERROR_KIND_ID);`);
	lines.push('');

	lines.push('export const KIND_NAMES: ReadonlyMap<number, string> = new Map([');
	for (const entry of entries) {
		const kind = modelKindOfEntry(entry, entries);
		lines.push(`  [${entry.id}, ${JSON.stringify(kind)}],`);
		if (entry.parseId !== undefined && entry.parseId !== entry.id) {
			lines.push(`  [${entry.parseId}, ${JSON.stringify(kind)}],`);
		}
	}
	lines.push(']);');
	lines.push('');

	lines.push(
		'/** Parser display label of each kind id — the spelling of an anonymous token the reader sends without text, and the label validator bridging matches. Never use for wrapNode dispatch. */'
	);
	lines.push('export const KIND_DISPLAY_NAMES: ReadonlyMap<number, string> = new Map([');
	for (const entry of entries) {
		const displayName = entry.symbolName ?? entry.kind;
		lines.push(`  [${entry.id}, ${JSON.stringify(displayName)}],`);
		if (entry.parseId !== undefined && entry.parseId !== entry.id) {
			lines.push(`  [${entry.parseId}, ${JSON.stringify(entry.parseName ?? displayName)}],`);
		}
	}
	lines.push(']);');
	lines.push('');

	lines.push(
		"/** Reverse of a separatedList kind's own separator-candidate resolution (factories.ts's emitSeparatedListFactory) — the exact string each candidate resolves to, keyed by its resolved id. NOT a general anonymous-token→text map: entry.symbolName (tree-sitter's raw parser production name) is unreliable for that — it can be shared across many distinct catalog kinds aliased to one token-producing rule (e.g. rust's primitive_type family), so it is deliberately not used here. Built by walking every separatedList's separatorRule with the SAME resolver (findKindEntry) the forward direction (factories.ts) already uses, guaranteeing round-trip correctness by construction. Absent for kinds that never appear as a separator candidate. */"
	);
	lines.push('export const KIND_LITERAL_TEXT: ReadonlyMap<number, string> = new Map([');
	const literalTextById = new Map<number, string>();
	for (const node of nodeMap.nodes.values()) {
		if (!(node instanceof AssembledList) || node.separatorRule === undefined) continue;
		for (const candidate of node.separatorCandidateKindNames) {
			const entry = findKindEntry(entries, candidate);
			if (entry === undefined) continue;
			literalTextById.set(entry.id, candidate);
			if (entry.parseId !== undefined && entry.parseId !== entry.id) {
				literalTextById.set(entry.parseId, candidate);
			}
		}
	}
	for (const [id, text] of literalTextById) {
		lines.push(`  [${id}, ${JSON.stringify(text)}],`);
	}
	lines.push(']);');
	lines.push('');

	lines.push('export function kindIdFromName(kindName: string): TSKindId {');
	lines.push('  switch (kindName) {');
	const seenCases = new Set<string>();
	for (const entry of entries) {
		const kind = modelKindOfEntry(entry, entries);
		if (seenCases.has(kind)) continue;
		seenCases.add(kind);
		lines.push(`    case ${JSON.stringify(kind)}: return TSKindId.${entry.member};`);
	}
	for (const entry of entries) {
		for (const parserTypeString of [entry.symbolName, entry.parseName]) {
			if (!parserTypeString) continue;
			if (seenCases.has(parserTypeString)) continue;
			seenCases.add(parserTypeString);
			lines.push(`    case ${JSON.stringify(parserTypeString)}: return TSKindId.${entry.member};`);
		}
	}
	lines.push('    default: throw new TypeError(`unknown kind name ${kindName}`);');
	lines.push('  }');
	lines.push('}');
	lines.push('');
}

function makeInliningLookupUnion(): LookupUnion {
	return () => undefined;
}

function emitLeafTerminalAliases(
	lines: string[],
	leafKinds: string[],
	nodeMap: NodeMap,
	generatedTypes: Set<string>,
	kindEntries?: readonly KindEnumEntry[]
): void {
	const referenced = referencedKinds(nodeMap);
	lines.push('// Leaf node types');
	for (const kind of leafKinds) {
		const node = nodeMap.nodes.get(kind)!;
		if (generatedTypes.has(node.typeName)) continue;
		if (!node.rawFactoryName && !referenced.has(kind)) continue;
		generatedTypes.add(node.typeName);

		if (node instanceof AssembledEnum) {
			lines.push(`export type ${node.typeName} = ${enumMemberDiscriminant(node, kindEntries)};`);
			continue;
		}
		if (isKindIdStored(node)) {
			lines.push(`export type ${node.typeName} = ${kindDiscriminantOrLiteral(kind, nodeMap, kindEntries)};`);
			continue;
		}

		const terminal = `Terminal<${kindDiscriminantOrLiteral(kind, nodeMap, kindEntries)}, ${leafTextType(node)}>`;
		lines.push(`export type ${node.typeName} = ${terminal};`);
	}
	lines.push('');
}

function leafTextType(node: AssembledNode): string {
	return node.modelType === 'enum' ? node.values.map((v) => JSON.stringify(v)).join(' | ') : 'string';
}

function leafConstructionTextType(node: AssembledNode): string {
	const shape = numericLeafShape(node.kind, node);
	return shape === undefined ? leafTextType(node) : `string | ${numberInputType(shape)}`;
}

interface EmittedSupertype {
	readonly kind: string;
	readonly typeName: string;
	readonly internal: boolean;
}

function supertypeTypeName(kind: string, nodeMap: NodeMap): string {
	return nodeMap.nodes.get(kind)?.typeName ?? kindTypeName(kind);
}

function emitOptionsHints(
	lines: string[],
	internalLines: string[],
	kinds: readonly { readonly kind: string; readonly typeName: string | undefined; readonly internal?: boolean }[],
	generatedTypes: ReadonlySet<string>,
	hints: HintEmitter | undefined,
	nodeMap: NodeMap
): void {
	const kindRoots = new Map((hints?.roots ?? []).filter((root) => !root.label).map((root) => [root.name, root]));
	const homes = new Map<string, { kind: string; typeName: string; root: HintRoot; internal: boolean }>();
	for (const { kind, typeName, internal } of kinds) {
		const root = kindRoots.get(displayNameOf(kind, nodeMap));
		if (root === undefined || typeName === undefined || !generatedTypes.has(typeName)) continue;
		const prior = homes.get(root.name);
		if (prior !== undefined && ownsItsDisplay(prior.kind, nodeMap) === ownsItsDisplay(kind, nodeMap)) {
			throw new Error(`types emitter: options root '${root.name}' names both '${prior.kind}' and '${kind}'`);
		}
		if (prior === undefined || ownsItsDisplay(kind, nodeMap)) homes.set(root.name, { kind, typeName, root, internal: internal === true });
	}
	const homeless = [...kindRoots.keys()].filter((name) => !homes.has(name));
	if (homeless.length > 0) throw new Error(`types emitter: options roots with no declared type to carry their hint: ${homeless.join(', ')}`);
	lines.push('export interface OptionsHintMap {');
	for (const { typeName, root } of homes.values()) lines.push(`  ${root.key}: ${typeName}.Hints;`);
	lines.push('}');
	lines.push('');
	for (const { typeName, root, internal } of homes.values()) {
		(internal ? internalLines : lines).push(
			`export namespace ${typeName} {`,
			'  export interface Hints {',
			`    readonly __optionsHint__?: ${root.hint};`,
			'  }',
			'}',
			''
		);
	}
}

function emitSupertypeNamespaces(lines: string[], internalLines: string[], emitted: readonly EmittedSupertype[]): void {
	for (const st of emitted) {
		const out = st.internal ? internalLines : lines;
		out.push(`export namespace ${st.typeName} {`);
		out.push(`  export type Kind = '${st.kind}';`);
		if (!st.internal) {
			out.push(`  export type Bound = SupertypeSurface<${st.typeName}, BoundByKindId>;`);
			out.push(`  export type Parsed = SupertypeSurface<${st.typeName}, ParsedByKindId>;`);
		}
		out.push('}');
		out.push('');
	}
}

function emitSupertypeUnionDeclarations(
	lines: string[],
	internalLines: string[],
	supertypes: { kind: string; subtypes: string[] }[],
	nodeMap: NodeMap,
	generatedTypes: Set<string>
): EmittedSupertype[] {
	const emitted: EmittedSupertype[] = [];
	if (supertypes.length === 0) return emitted;
	lines.push('// Supertype unions');
	const pending: { kind: string; subtypes: string[]; typeName: string }[] = [];
	for (const st of supertypes) {
		if (st.subtypes.length === 0) {
			throw new Error(
				`emitTypes: supertype '${st.kind}' has zero subtypes. ` +
					`Link's classifyHiddenRule promoted a non-symbol-choice as supertype — fix it there.`
			);
		}
		const typeName = supertypeTypeName(st.kind, nodeMap);
		if (generatedTypes.has(typeName)) continue;
		generatedTypes.add(typeName);
		pending.push({ ...st, typeName });
	}
	for (const st of pending) {
		const typeName = st.typeName;

		const resolvedSubs = st.subtypes.map((sub) => {
			const n = nodeMap.nodes.get(sub) ?? nodeMap.nodes.get(`_${sub}`);
			if (!n) {
				throw new Error(`types: supertype '${st.kind}' references subtype '${sub}' which is not in NodeMap.`);
			}
			return { sub, typeName: n.typeName, token: isBuilderlessPunctuationLeaf(n) };
		});
		const members = resolvedSubs.filter((r) => r.token || generatedTypes.has(r.typeName)).map((r) => r.typeName);
		if (members.length === 0) {
			throw new Error(
				`types: supertype '${st.kind}' has no resolvable member types after filtering. ` +
					`This means every subtype declares a typeName not declared as an interface. Fix upstream.`
			);
		}
		const internal = !isDeclaredSupertype(nodeMap.nodes.get(st.kind));
		const out = internal ? internalLines : lines;
		out.push(`export type ${typeName} =`);
		for (const m of members) out.push(`  | ${m}`);
		out.push(';');
		out.push('');
		emitted.push({ kind: st.kind, typeName, internal });
	}
	return emitted;
}

function collectAndEmitTokenTypeAliases(
	lines: string[],
	nodeMap: NodeMap,
	generatedTypes: Set<string>,
	kindEntries?: readonly KindEnumEntry[]
): void {
	const referenced = referencedKinds(nodeMap);
	const referencedTokenTypeNames = new Set<string>();
	for (const t of referenced) {
		const ref = nodeMap.nodes.get(t);
		if (ref !== undefined && isBuilderlessPunctuationLeaf(ref)) referencedTokenTypeNames.add(ref.typeName);
	}

	lines.push('// Token type aliases (only tokens referenced in field/child unions)');
	for (const [kind, node] of nodeMap.nodes) {
		if (!isBuilderlessPunctuationLeaf(node)) continue;
		if (!referencedTokenTypeNames.has(node.typeName)) continue;
		if (!/^[A-Za-z_$][\w$]*$/.test(node.typeName)) continue;
		if (generatedTypes.has(node.typeName)) continue;
		generatedTypes.add(node.typeName);
		lines.push(`export type ${node.typeName} = ${kindDiscriminantOrLiteral(kind, nodeMap, kindEntries)};`);
	}
	lines.push('');
}

function assertNoCamelCaseCollisions(nodeKinds: string[]): void {
	const camelNames = new Map<string, string>();
	for (const kind of nodeKinds) {
		const camel = snakeToCamel(kind);
		const prev = camelNames.get(camel);
		if (prev !== undefined && prev !== kind) {
			throw new Error(
				`types emitter: camelCase collision — kinds '${prev}' and '${kind}' both camelCase to '${camel}'. ` +
					`Rename one before proceeding.`
			);
		}
		camelNames.set(camel, kind);
	}
}

interface CoercerRowArgs {
	readonly bare: string | undefined;
	readonly kind: string;
}

function coercerRowArgs(
	kind: string,
	node: AssembledNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): CoercerRowArgs | undefined {
	if (classifyFromEmission(kind, node, { nodeMap, kindEntries }) !== 'emit') return undefined;
	const bare = (() => {
		switch (fromBareInput(node, nodeMap)) {
			case 'value':
				return JSON.stringify(bareValueSlot(node, nodeMap)!.storageName);
			case 'elements':
				return JSON.stringify(canonicalSeparatedListField(node as AssembledList).storageName);
			case null:
				return undefined;
		}
	})();
	return { bare, kind: kindIdOrNever(kind, nodeMap, kindEntries) };
}

function emitNamespaceInterfaceLine(
	lines: string[],
	typeName: string,
	surface: BuiltTypeSurface | undefined,
	coercer: CoercerRowArgs | undefined,
	emptyTypeName: string | undefined
): void {
	if (surface === undefined) {
		if (coercer !== undefined) {
			throw new Error(`types emitter: '${typeName}' has a coercer but no construction surface`);
		}
		lines.push(
			`export interface ${typeName}Ns extends NodeNs<${typeName}, LeafScalarMap, LeafStringMap, NamespaceMap> {}`
		);
		return;
	}
	lines.push(
		`export interface ${typeName}Ns extends NodeNs<`,
		`  ${typeName},`,
		'  LeafScalarMap,',
		'  LeafStringMap,',
		'  NamespaceMap,',
		`  ${typeName}.Bound,`,
		`  ${typeName}.BuildArgs,`,
		`  ${typeName}.LooseArgs,`,
		`  ${coercer?.bare ?? 'never'},`,
		`  ${coercer?.kind ?? 'never'},`,
		`  ${typeName}.Parsed,`,
		`  ${emptyTypeName ?? 'never'}`,
		'> {}'
	);
}

function emitNodeSurfaceInterfaces(lines: string[], surface: BuiltTypeSurface, indent: string, seated = false): void {
	const emit = (name: string, extendsList: string, withNode: boolean, self = 'this', exported = true): void => {
		lines.push(`${indent}${exported ? 'export ' : ''}interface ${name} extends ${extendsList} {`);
		if (withNode) lines.push(`${indent}  readonly $type: ${surface.mainType}['$type'];`);
		if (withNode)
			lines.push(
				`${indent}  readonly $with: ${name.startsWith('Bound') ? 'BoundWithNode' : 'WithNode'}<${self}, BoundByKindId${self === 'this' ? '' : `, ${name}`}>;`
			);
		if (withNode && name.startsWith('Parsed')) lines.push(`${indent}  readonly $query: () => QueryFacet<${self}, ParsedByKindId>;`);
		for (const member of surface.members) lines.push(`${indent}${member}`);
		lines.push(`${indent}}`);
	};
	if (surface.mainType === undefined) {
		emit('Bound', 'NodeMethodsOf', false);
		lines.push(`${indent}export interface Parsed extends Bound {}`);
		return;
	}
	for (const [name, of, byKindId] of [
		['Bound', 'BoundOf', 'BoundByKindId'],
		['Parsed', 'ParsedOf', 'ParsedByKindId']
	] as const) {
		if (!seated) {
			emit(name, `${of}<${surface.mainType}, ${byKindId}>, NodeMethodsOf`, true);
			continue;
		}
		emit(`${name}Surface`, `${of}<${surface.mainType}, ${byKindId}>, NodeMethodsOf`, true, name, false);
		lines.push(
			`${indent}export type ${name} = ${name}Surface & FlatShapesOf<${name}Surface, ${surface.mainType}, ${byKindId}>;`
		);
	}
}

type LookupUnion = (parts: readonly string[]) => string | undefined;

function aliasContentTypeExpr(node: AssembledNode, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): string | undefined {
	if (!(node instanceof AssembledAlias) || node.slots.length !== 1) return undefined;
	const content = node.slots[0]!;
	const storage = storageFieldTypeExpr(content, nodeMap, fieldTypeExpr(content, nodeMap), kindEntries);
	if (resolveFieldStorageInfo(content, nodeMap, kindEntries).kind !== 'kindEnum') return storage;
	return mixedEnumStorageTypeExpr(content, nodeMap, kindEntries) ?? storage;
}

function emitInterface(
	lines: string[],
	node: StructuralNode,
	nodeMap: NodeMap,
	lookupUnion?: LookupUnion,
	kindDiscriminant = JSON.stringify(node.kind),
	kindEntries?: readonly KindEnumEntry[]
): void {
	const slots = node.slots;
	lines.push(`export interface ${node.typeName} {`);
	lines.push(`  readonly $type: ${kindDiscriminant};`);

	if (slots.length > 0) {
		for (const f of slots) {
			const typeExpr = fieldTypeExpr(f, nodeMap, lookupUnion);
			const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
			const opt = isRequired(f) ? '' : '?';
			const storageType = storageFieldTypeExpr(f, nodeMap, typeExpr, kindEntries);
			if (isMultiple(f) && !storageInfo.collapsesMultiplicity) {
				const elemType = hasOptionalElements(f) ? `${storageType} | undefined` : storageType;
				emitFieldArrayDeclaration(lines, f.storageKey, opt, elemType, isNonEmpty(f));
			} else {
				lines.push(`  readonly ${f.storageKey}${opt}: ${storageType};`);
			}
		}
		emitFieldInputHints(lines, slots, node.kind, nodeMap, kindEntries, lookupUnion);
		emitSlotHints(lines, node, nodeMap, kindEntries);
		if (aliasContentTypeExpr(node, nodeMap, kindEntries) !== undefined) {
			lines.push(`  readonly __aliasContent__?: ${node.typeName}.Types;`);
		}
		for (const f of slots) {
			const typeExpr = fieldTypeExpr(f, nodeMap, lookupUnion);
			const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
			const propName = f.propertyName;
			const storageType = storageFieldTypeExpr(f, nodeMap, typeExpr, kindEntries);
			const opt = isRequired(f) ? '' : '?';
			if (isMultiple(f) && !storageInfo.collapsesMultiplicity) {
				const elemType = hasOptionalElements(f) ? `${storageType} | undefined` : storageType;
				const arrType = isNonEmpty(f) ? `NonEmptyArray<${elemType}>` : `readonly (${elemType})[]`;
				lines.push(`  ${propName}(): ${arrType};`);
			} else {
				lines.push(`  ${propName}(): ${storageType}${opt ? ' | undefined' : ''};`);
			}
		}
	}

	lines.push('}');
	lines.push('');
}

function emitSlotHints(
	lines: string[],
	node: StructuralNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): void {
	const setters = builtTypeSurfaceOf(node, nodeMap, kindEntries)?.setters ?? [];
	const view = listViewHint(node, nodeMap, kindEntries);
	const listSlots = listSlotHints(node, nodeMap, kindEntries);
	const groupSeats = groupSeatHints(node, nodeMap, kindEntries);
	if (setters.length === 0 && view === undefined) return;
	lines.push('  readonly __slotHints__?: {');
	const elementConfigs = new Map(elementConfigsOf(node, nodeMap).map((fact) => [fact.slot, fact.config]));
	for (const setter of setters) {
		const config = elementConfigs.get(setter.name);
		const flags =
			config !== undefined
				? `, ${setter.optional}, ${setter.rest}, ${config}`
				: setter.rest
					? `, ${setter.optional}, true`
					: setter.optional
						? ', true'
						: '';
		lines.push(`    readonly ${setter.name}: SlotHint<${setter.input}${flags}>;`);
	}
	if (view !== undefined) lines.push(`    readonly $listView: ListViewHint<${view.element}, ${view.options}>;`);
	if (groupSeats.length > 0) {
		const flat = groupSeats.map((seat) => {
			const keys = seat.keys.map((key) => `readonly ${JSON.stringify(key.name)}: ${JSON.stringify(key.field)}`).join('; ');
			return `FlatHint<${JSON.stringify(seat.slot)}, T.${seat.group}, { ${keys} }, ${seat.optional}, ${JSON.stringify(seat.stored)}>`;
		});
		lines.push(`    readonly $flat: ${flat.join(' | ')};`);
	}
	if (listSlots.length > 0) {
		lines.push('    readonly $listSlots: {');
		for (const hint of listSlots) lines.push(`      readonly ${hint.slot}: ListSlotHint<${hint.element}, ${hint.options}${hint.config === 'never' ? '' : `, ${hint.config}`}>;`);
		lines.push('    };');
	}
	lines.push('  };');
}

function emitFieldArrayDeclaration(
	lines: string[],
	name: string,
	opt: string,
	typeExpr: string,
	nonEmpty: boolean | undefined
): void {
	if (nonEmpty) {
		lines.push(`  readonly ${name}${opt}: NonEmptyArray<${typeExpr}>;`);
	} else {
		lines.push(`  readonly ${name}${opt}: readonly (${typeExpr})[];`);
	}
}

function _fieldTypeParts(field: AssembledNonterminal, nodeMap?: NodeMap): string[] {
	const litVals = slotLiteralValues(field);
	if (litVals.length > 0) return [];
	const kinds = slotKindNames(field);
	if (kinds.length === 0) return [];
	return kinds.map((t) => {
		const node = nodeMap?.nodes.get(t);
		if (!node) return JSON.stringify(t);
		const name = node.typeName;
		return /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(t);
	});
}

function fieldTypeExpr(field: AssembledNonterminal, nodeMap?: NodeMap, lookupUnion?: LookupUnion): string {
	const litVals = slotLiteralValues(field);
	const kinds = slotKindNames(field);

	if (kinds.length === 0 && litVals.length > 0) {
		return [...new Set(litVals.map((v) => JSON.stringify(v)))].join(' | ');
	}
	if (kinds.length === 0) return 'string';
	if (!nodeMap) return 'string';

	const components = fieldTypeComponents(field, nodeMap);
	const parts: string[] = [];
	for (const comp of components) {
		if (comp.kind === 'literal') {
			parts.push(JSON.stringify(comp.value));
		} else if (comp.kind === 'nodeKind') {
			parts.push(isValidIdent(comp.value) ? comp.value : JSON.stringify(comp.rawKind));
		} else {
			missingKindTypes.set(comp.rawKind, comp.value);
			parts.push(comp.value);
		}
	}
	const deduped = [...new Set(parts)];
	const alias = lookupUnion?.(deduped);
	if (alias) return alias;
	return deduped.join(' | ');
}

function stringUnion(values: readonly string[]): string {
	return values.length === 0 ? 'never' : values.map((value) => JSON.stringify(value)).join(' | ');
}

function enumStorageDiscriminantExpr(
	storageInfo: ReturnType<typeof resolveFieldStorageInfo>,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	if (!kindEntries) return 'number';
	const members = new Set<string>();
	for (const enumKind of storageInfo.enumKinds) {
		const entry = findKindEntry(kindEntries, enumKind);
		if (entry) members.add(`TSKindId.${entry.member}`);
		const node = nodeMap.nodes.get(enumKind);
		if (!(node instanceof AssembledEnum)) continue;
		for (const value of node.values) {
			const rec = node.resolvedByText.get(value);
			const valueEntry =
				rec !== undefined ? findKindEntry(kindEntries, rec.kind) : findKindEntryForLiteral(kindEntries, value);
			if (valueEntry) members.add(`TSKindId.${valueEntry.member}`);
		}
	}
	for (const text of storageInfo.texts) {
		const entry = findKindEntryForLiteral(kindEntries, text);
		if (entry) members.add(`TSKindId.${entry.member}`);
	}
	return members.size === 0 ? 'number' : [...members].join(' | ');
}

function storageFieldTypeExpr(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	typeExpr: string,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
	if (storageInfo.kind === 'boolean') {
		return 'boolean';
	}
	if (storageInfo.kind === 'bitflag') {
		return 'number';
	}
	if (storageInfo.kind === 'kindEnum') {
		return 'number';
	}
	if (storageInfo.kind === 'mixedEnum') {
		return mixedEnumStorageTypeExpr(f, nodeMap, kindEntries) ?? typeExpr;
	}
	return typeExpr;
}

function mixedEnumStorageTypeExpr(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string | undefined {
	if (!kindEntries) return undefined;
	const parts: string[] = [];
	for (const comp of fieldTypeComponents(f, nodeMap)) {
		if (comp.kind === 'literal') {
			const entry =
				(comp.resolvedKindId !== undefined ? kindEntries.find((e) => e.id === comp.resolvedKindId) : undefined) ??
				findKindEntryForLiteral(kindEntries, comp.value);
			parts.push(entry ? `TSKindId.${entry.member}` : JSON.stringify(comp.value));
		} else if (comp.kind === 'nodeKind') {
			parts.push(isValidIdent(comp.value) ? comp.value : JSON.stringify(comp.rawKind));
		} else {
			missingKindTypes.set(comp.rawKind, comp.value);
			parts.push(comp.value);
		}
	}
	return [...new Set(parts)].join(' | ');
}

function fieldInputHintTypeExpr(
	f: AssembledNonterminal,
	kind: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): string | undefined {
	const owner = nodeMap.nodes.get(kind);
	if (owner instanceof AssembledList && f === canonicalSeparatedListField(owner)) {
		const surface = separatedListSurface(owner, nodeMap, kindEntries);
		return surface.wrapper === undefined ? undefined : surface.elemType;
	}
	const storageInfo = resolveFieldStorageInfo(f, nodeMap, kindEntries);
	if (storageInfo.kind === 'boolean') {
		return `BaseBooleanKeyword<${stringUnion(storageInfo.texts)}>`;
	}
	if (storageInfo.kind === 'bitflag') {
		const constName = resolveBitflagConstName(kind, f, nodeMap) ?? 'number';
		if (constName !== 'number') referencedBitflagConsts.add(constName);
		return `Bitflag<${constName}, number>`;
	}
	if (storageInfo.kind === 'mixedEnum') {
		const nodeParts: string[] = [];
		for (const comp of fieldTypeComponents(f, nodeMap)) {
			if (comp.kind === 'nodeKind')
				nodeParts.push(isValidIdent(comp.value) ? comp.value : JSON.stringify(comp.rawKind));
		}
		const mixedHint = `KindEnum<${stringUnion(storageInfo.texts)}, ${enumStorageDiscriminantExpr(storageInfo, nodeMap, kindEntries)}>`;
		return nodeParts.length > 0 ? `${mixedHint} | ${[...new Set(nodeParts)].join(' | ')}` : mixedHint;
	}
	if (storageInfo.kind === 'kindEnum') {
		const kindEnumExpr = `KindEnum<${stringUnion(storageInfo.texts)}, ${enumStorageDiscriminantExpr(storageInfo, nodeMap, kindEntries)}>`;
		return kindEnumExpr;
	}
	return undefined;
}

function wrapChildrenListHint(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	lookupUnion?: LookupUnion
): string | undefined {
	if (isMultiple(f)) return undefined;
	const kinds = slotKindNames(f);
	if (kinds.length !== 1) return undefined;
	const kind = kinds[0]!;
	const node = nodeMap.nodes.get(kind);
	if (node === undefined || !isWrapChildrenKind(kind, node, nodeMap, kindEntries)) return undefined;
	const target = nodeMap.nodes.get(constructorTargetKind(kind, nodeMap));
	if (target === undefined) return undefined;
	if (!isSlotBearingCompound(target)) {
		return undefined;
	}
	const elementSlot = target.slots.find((slot) => isMultiple(slot)) ?? target.slots[0];
	if (elementSlot === undefined) return undefined;
	return `readonly (${fieldTypeExpr(elementSlot, nodeMap, lookupUnion)})[]`;
}

function fieldLooseHintTypeExpr(
	f: AssembledNonterminal,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	lookupUnion?: LookupUnion
): string | undefined {
	const arms: string[] = [];
	if (f.values.length === 1 && slotKindNames(f).length === 1) {
		const texts = stringConstructibleTexts(slotKindNames(f)[0]!, nodeMap);
		if (texts.length > 0) arms.push(`${fieldTypeExpr(f, nodeMap)} | ${stringUnion(texts)}`);
	}
	const listHint = wrapChildrenListHint(f, nodeMap, kindEntries, lookupUnion);
	if (listHint !== undefined) arms.push(listHint);
	return arms.length > 0 ? arms.join(' | ') : undefined;
}

function emitFieldInputHints(
	lines: string[],
	slots: readonly AssembledNonterminal[],
	kind: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	lookupUnion?: LookupUnion
): void {
	const hintLines = slots
		.map((field) => {
			const hintType = fieldInputHintTypeExpr(field, kind, nodeMap, kindEntries);
			if (!hintType) return undefined;
			const opt = isRequired(field) ? '' : '?';
			const storageInfo = resolveFieldStorageInfo(field, nodeMap, kindEntries);
			if (isMultiple(field) && !storageInfo.collapsesMultiplicity) {
				const arrType = isNonEmpty(field) ? `NonEmptyArray<${hintType}>` : `readonly (${hintType})[]`;
				return `    readonly ${quoteKey(field.name)}${opt}: ${arrType};`;
			}
			return `    readonly ${quoteKey(field.name)}${opt}: ${hintType};`;
		})
		.filter((line): line is string => line !== undefined);
	if (hintLines.length > 0) {
		lines.push('  readonly __inputHints__?: {');
		lines.push(...hintLines);
		lines.push('  };');
	}
	const fromHintLines = slots
		.map((field) => {
			const hintType = fieldLooseHintTypeExpr(field, nodeMap, kindEntries, lookupUnion);
			if (!hintType) return undefined;
			const opt = isRequired(field) ? '' : '?';
			return `    readonly ${quoteKey(field.name)}${opt}: ${hintType};`;
		})
		.filter((line): line is string => line !== undefined);
	if (fromHintLines.length > 0) {
		lines.push('  readonly __looseHints__?: {');
		lines.push(...fromHintLines);
		lines.push('  };');
	}
}

function quoteKey(key: string): string {
	return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

function emitNamespaceSugarBlock(
	lines: string[],
	kind: string,
	node: AssembledNode,
	refineInfo: RefineKindInfo | undefined,
	nsKey: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined,
	wires: PolymorphWires
): void {
	lines.push(`export namespace ${node.typeName} {`);
	if (refineInfo && refineInfo.forms.length > 0) {
		emitRefineFormSubNamespaces(lines, node, refineInfo, nsKey, nodeMap, kindEntries);
		const defaultForm = refineInfo.forms[0]!;
		const defaultShortName = refineFormTypeName(node.typeName, defaultForm.name).slice(node.typeName.length);
		lines.push(`  /** Default form: '${defaultForm.name}' (first-declared). */`);
		lines.push(`  export type Config = ${defaultShortName}.Config;`);
	} else {
		lines.push(`  export type Config = ${widenNumericSlots(omitRegistered(`ConfigFor<${nsKey}>`, node), node)};`);
	}
	const spelling = spellingTypeOf(node, nodeMap, kindEntries);
	if (spelling !== undefined) lines.push(`  export type Options = ${spelling};`);
	const aliasContent = aliasContentTypeExpr(node, nodeMap, kindEntries);
	if (aliasContent !== undefined) lines.push(`  export type Types = SupertypeSurface<${aliasContent}, BoundByKindId>;`);
	const surface = emitsPlainBuiltAlias(kind, node, { nodeMap, kindEntries })
		? builtTypeSurfaceOf(node, nodeMap, kindEntries)
		: undefined;
	if (surface !== undefined) emitNodeSurfaceInterfaces(lines, surface, '  ', groupSeatHints(node, nodeMap, kindEntries).length > 0);
	else {
		lines.push(`  export type Bound = BoundFor<${nsKey}>;`);
		lines.push(`  export type Parsed = BoundFor<${nsKey}>;`);
	}
	const looseConfig = omitRegistered(`LooseConfigFor<${nsKey}>`, node);
	const widenedLooseConfig = widenNumericSlots(looseConfig, node);
	const looseWidened = widenedLooseConfig === looseConfig ? '' : ` | ${widenedLooseConfig}`;
	const bareInterior = bareInteriorText(kind, node);
	const bareText = bareInterior === undefined ? '' : ' | string';
	const bareContent = lexedContentSlot(node);
	const bareShape = (bareContent === undefined ? undefined : numericSlotShape(bareContent)) ?? numericLeafShape(kind, node) ?? bareInterior?.number;
	lines.push(`  export type Loose = ${omitRegistered(`LooseFor<${nsKey}>`, node)}${looseWidened}${bareText}${bareShape === undefined ? '' : ` | ${numberInputType(bareShape)}`};`);
	lines.push(`  export type LooseConfig = ${widenedLooseConfig};`);
	if (surface !== undefined) {
		const rows = seatedRowsOf(node, wires, surface) ?? surface;
		lines.push(`  export type BuildArgs = ${rows.buildArgs};`);
		lines.push(`  export type LooseArgs = ${rows.looseArgs};`);
	} else {
		lines.push(`  export type BuildArgs = BuildArgsFor<${nsKey}>;`);
		lines.push(`  export type LooseArgs = LooseArgsFor<${nsKey}>;`);
	}
	lines.push(`  export type Kind = ${kindIdOrNever(kind, nodeMap, kindEntries)};`);
	lines.push('}');
}

function emitRefineFormSubNamespaces(
	lines: string[],
	node: AssembledNode,
	refineInfo: RefineKindInfo,
	nsKey: string,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): void {
	const parentTypeName = node.typeName;
	for (const form of refineInfo.forms) {
		const formType = refineFormTypeName(parentTypeName, form.name);
		const shortName = formType.slice(parentTypeName.length);
		lines.push(`  export namespace ${shortName} {`);
		const narrowed = form.narrowedFields;
		const base =
			narrowed.length > 0
				? `Omit<ConfigFor<${nsKey}>, ${narrowed.map((n) => JSON.stringify(snakeToCamel(n.fieldName))).join(' | ')}>`
				: `ConfigFor<${nsKey}>`;
		lines.push(`    export type Config = ${omitRegistered(base, node)};`);
		const formSpelling = spellingTypeOf(node, nodeMap, kindEntries);
		if (formSpelling !== undefined) lines.push(`    export type Options = ${formSpelling};`);
		const surface = refineFormBuiltTypeSurfaceOf(node, form, refineInfo, nodeMap, kindEntries);
		if (surface !== undefined) {
			emitNodeSurfaceInterfaces(lines, surface, '    ');
			lines.push(`    export type BuildArgs = ${surface.buildArgs};`);
			lines.push(`    export type LooseArgs = ${surface.looseArgs};`);
		}
		lines.push('  }');
	}
}
