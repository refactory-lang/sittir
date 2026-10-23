import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	NO_REPARSE_HOSTS,
	applyHost,
	createEngine,
	detachCoordinates,
	dumpMetrics,
	hostTemplateFor,
	type HostOptions,
	type HostedText,
	type ReparseHosts
} from '@sittir/common';
import { coordinateOf, hydrateTriviaEntry } from '@sittir/common/utils';
import { scopeBuilders } from '@sittir/common/engine';
import {
	carryRead,
	carryPlace,
	carrySourceStamp,
	holdTree,
	sideOf,
	sidesOf,
	nodeText,
	spanOf,
	sourceTextOf,
	treeTokenOf,
	type KindView
} from '@sittir/common/utils';
import {
	isNode,
	treeOf,
	type TriviaSideName,
	isCoordinate,
	metricsEnabled,
	mapTriviaEntries,
	projectInterior,
	storedSlotReader,
	isDataKey,
	type TokenInterior
} from '@sittir/common/utils';
import type * as TS from 'web-tree-sitter';
import type { DisplayFamilies } from './display-families.ts';

import type { AnyUntypedNode, Engine, LanguageAPI, NativeLanguageEngine, NodeLayout, NodeStorage, NodeTrivia, ParseOptions, NodeCoordinate, TriviaEntry } from '@sittir/types';
import type { TriviaSides } from '@sittir/common';
import type { TreeHandle } from '@sittir/common/utils';
import { invoke, load } from '../codegen-surface.ts';
import { languageByName } from '../languages.ts';
import {
	grammarModulePath,
	importGrammarModule,
	type FactoryEntry,
	type GrammarModules,
	type Hydrate
} from '../grammar-internals.ts';
import { UPSTREAM_WASM, grammarPackageDir, grammarRequire, isGrammar, upstreamPackage } from '@sittir/codegen/grammars';
import { CORPUS_ROOT, localCorpusPath, upstreamCorpusDir } from '../corpus/layout.ts';
import type {
	CodegenSurface,
	PolymorphVariantMap,
	FactoryShape,
	FactorySlotMeta,
	OpaqueFacts
} from '../codegen-surface.ts';

const loadWebTreeSitter: CodegenSurface['engineLoader']['loadWebTreeSitter'] = (await load('engineLoader'))
	.loadWebTreeSitter;
const { opaqueFacts, readFacts } = await load('opaqueFacts');
const { assertNativeBinaryFresh, hostBinaryFreshnessFor } = await load('nativeBinaryFreshness');
const { slotPropertyName, storageKeyOf } = await load('modelNodeMap');
const { factorySlotMetaOf, slotKindsOf, valueNameOf } = await load('nodeModelRead');

type SlotArity = 'one' | 'many';
type SlotOrigin = 'field' | 'kind';
interface SlotModel {
	readonly name: string;
	readonly key: string;
	readonly storageKey: string;
	readonly arity: SlotArity;
	readonly metadata: OpaqueFacts;
}
function createNamedSlotModel(name: string, key: string, arity: SlotArity): SlotModel {
	return { name, key, storageKey: `_${name}`, arity, metadata: opaqueFacts({ origin: 'field' satisfies SlotOrigin }) };
}

export interface CorpusEntry {
	name: string;
	source: string;
}

export type TSNode = TS.Node;
export type TSTree = TS.Tree;

const CORPUS_HEADER =
	/^(={3,})([^=\r\n][^\r\n]*)?\r?\n((?:(?:[^=\r\n]|\s+:)[^\r\n]*\r?\n)+)===+([^=\r\n][^\r\n]*)?\r?\n/gm;
const CORPUS_DIVIDER = /^(-{3,})([^-\r\n][^\r\n]*)?\r?\n/gm;

export function parseCorpus(content: string, grammar?: string): CorpusEntry[] {
	const headers = [...content.matchAll(CORPUS_HEADER)];
	const firstSuffix = headers[0]?.[2];
	const tests = headers.filter((h) => h[2] === firstSuffix && h[4] === firstSuffix);
	const entries: CorpusEntry[] = [];
	tests.forEach((header, index) => {
		const bodyStart = header.index + header[0].length;
		const bodyEnd = tests[index + 1]?.index ?? content.length;
		const body = content.slice(bodyStart, bodyEnd);
		const divider = [...body.matchAll(CORPUS_DIVIDER)]
			.filter((d) => d[2] === firstSuffix)
			.reduce<RegExpExecArray | RegExpMatchArray | undefined>(
				(best, d) => (best === undefined || d[1]!.length >= best[1]!.length ? d : best),
				undefined
			);
		if (divider === undefined) return;
		const [nameLine = '', ...markers] = header[3]!.split(/\r?\n/).filter((line) => line.length > 0);
		const attributes = markers.map((line) => line.trim().match(/^:([a-z-]+)(?:\((.+?)\))?$/)).filter((m) => m !== null);
		const declaredLanguage = attributes.find((m) => m[1] === 'language')?.[2];
		if (grammar !== undefined && declaredLanguage !== undefined && declaredLanguage !== grammar) return;
		const expected = body.slice(divider.index! + divider[0].length);
		if (attributes.some((m) => m[1] === 'error') || /\((ERROR|MISSING)\b/.test(expected)) return;
		let source = body.slice(0, divider.index);
		if (source.endsWith('\n')) source = source.slice(0, -1);
		if (source.endsWith('\r')) source = source.slice(0, -1);
		if (source.trim().length === 0) return;
		entries.push({ name: nameLine.trim(), source });
	});
	return entries;
}

export function loadCorpusEntries(grammar: string): CorpusEntry[] {
	const upstreamDir = upstreamCorpusDir(grammar);
	const files = existsSync(upstreamDir)
		? readdirSync(upstreamDir)
				.filter((f) => f.endsWith('.txt'))
				.sort()
				.map((f) => join(upstreamDir, f))
		: [];
	const local = localCorpusPath(grammar);
	if (existsSync(local)) files.push(local);
	const entries = files.flatMap((file) => parseCorpus(readFileSync(file, 'utf-8'), grammar));
	if (entries.length === 0) {
		throw new Error(
			`corpus: grammar '${grammar}' has no corpus entries under ${join(CORPUS_ROOT, grammar)}; run \`sittir tool fetch-corpus --grammar ${grammar}\``
		);
	}
	return entries;
}

export { loadWebTreeSitter };

export type NativeEngine = Engine<LanguageAPI>;

/**
 * The grammar's own native engine, under the grammar-generic `Engine`. It takes
 * render options untyped, so a tool can hand a tree's inferred layer
 * (`TreeHandle.options`) to a render of data detached from that tree; the
 * generic `Engine` types render options as `never`.
 */
export async function nativeLanguageEngineOf(grammar: string): Promise<NativeLanguageEngine<LanguageAPI>> {
	return (await (await languageByName(grammar)).load()).createNative();
}

export type FixtureReplay = (input: AnyUntypedNode, options?: object) => string;

export async function fixtureReplayOf(grammar: string): Promise<FixtureReplay> {
	const native = await nativeLanguageEngineOf(grammar);
	return (input, options) => native.render(input, options).toString();
}

export function kindViewOf(engine: NativeEngine): KindView {
	return {
		isWrapper: (kindId) => engine.trivia.rebuildWrappers.has(kindId)
	};
}

const cachedNativeEngines = new Map<
	string,
	{ engine: Promise<NativeEngine>; binaryMtimeMs: number; profile?: string | undefined }
>();

const NODE_STORAGES: readonly NodeStorage[] = ['object', 'arena'];

export function parseNodeStorage(value: string): NodeStorage {
	const storage = NODE_STORAGES.find((known) => known === value);
	if (storage === undefined) throw new Error(`node storage '${value}' is none of ${NODE_STORAGES.join(', ')}`);
	return storage;
}

let validationNodeStorage: NodeStorage = 'object';

export function useValidationNodeStorage(storage: NodeStorage): void {
	if (storage === validationNodeStorage) return;
	if (cachedNativeEngines.size > 0) {
		throw new Error(`validation reads trees as '${validationNodeStorage}' storage already; choose '${storage}' before the first engine loads`);
	}
	validationNodeStorage = storage;
}

export function validationStorage(): NodeStorage {
	return validationNodeStorage;
}

async function createNativeEngine(grammar: string): Promise<NativeEngine> {
	const engine = await createEngine(await languageByName(grammar), { verifyStructure: 'runtime', nodeStorage: validationNodeStorage });
	const profile = engine.diagnostics.buildProfile;
	if (profile === 'debug' && process.env.SITTIR_ALLOW_DEBUG_VALIDATE !== '1') {
		throw new Error(
			`Native engine for '${grammar}' is a DEBUG build — debug binaries are refused for ` +
				`validation (known segfault class). Rebuild release (\`gen\` without --native-debug), ` +
				`or set SITTIR_ALLOW_DEBUG_VALIDATE=1 to override.`
		);
	}
	return engine;
}

export function loadNativeEngine(grammar: string): Promise<NativeEngine> {
	const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url)).replace(/\/$/, '');
	const binaries = hostBinaryFreshnessFor(repoRoot, grammar);
	const binaryMtimeMs = binaries.length > 0 ? Math.max(...binaries.map((b) => b.binaryMtimeMs)) : 0;

	const cached = cachedNativeEngines.get(grammar);
	if (cached) {
		if (cached.binaryMtimeMs !== binaryMtimeMs) {
			return Promise.reject(
				new Error(
					`Native engine for '${grammar}' was rebuilt after this process loaded it — ` +
						`napi modules cannot be reloaded in-process. Re-run the command in a fresh process.`
				)
			);
		}
		return cached.engine;
	}

	assertNativeBinaryFresh(repoRoot, grammar);

	const engine = createNativeEngine(grammar);
	const entry: NonNullable<ReturnType<typeof cachedNativeEngines.get>> = { engine, binaryMtimeMs };
	cachedNativeEngines.set(grammar, entry);
	engine.then(
		(loaded) => {
			entry.profile = loaded.diagnostics.buildProfile;
		},
		() => cachedNativeEngines.delete(grammar)
	);
	return engine;
}

export async function loadNativeRender(grammar: string): Promise<(node: AnyUntypedNode) => string> {
	const engine = await loadNativeEngine(grammar);
	return (node) => engine.render(node).toString();
}

export function cachedNativeEngineProfile(grammar: string): string | undefined {
	return cachedNativeEngines.get(grammar)?.profile;
}

export function readNativeTree(
	engine: NativeEngine,
	source: string,
	options?: ParseOptions
): { root: AnyUntypedNode; tree: TreeHandle } {
	return engine.diagnostics.parseAndRead(source, options) as { root: AnyUntypedNode; tree: TreeHandle };
}

export async function buildReadHandle(grammar: string, source: string): Promise<TreeHandle> {
	return readNativeTree(await loadNativeEngine(grammar), source).tree;
}

export function nativeNodeIsKind(
	d: AnyUntypedNode,
	kind: string,
	kindNameFromId: ((id: number) => string | undefined) | undefined
): boolean {
	return (kindNameFromId?.(d.$type) ?? String(d.$type)) === kind;
}

export interface WrappedCandidate {
	readonly node: TypedNode;
	readonly span: { start: number; end: number } | undefined;
}

export function wrappedNodesOfKind(
	root: unknown,
	accessorOf: SlotAccessorOf,
	kind: string,
	kindNameFromId: ((id: number) => string | undefined) | undefined
): WrappedCandidate[] {
	const found: WrappedCandidate[] = [];
	const visit = (node: TypedNode): void => {
		if (nativeNodeIsKind(node as unknown as AnyUntypedNode, kind, kindNameFromId)) found.push({ node, span: spanOf(node) });
		const sides = sidesOf(node);
		if (sides === undefined) return;
		for (const entries of [sides.leading, sides.trailing, sides.inner]) {
			for (const entry of entries ?? []) if (typeof entry === 'object') walkWrappedTree(hydrateTriviaEntry(entry), accessorOf, visit);
		}
	};
	walkWrappedTree(root, accessorOf, visit);
	return found;
}

export function findWrappedNode(
	root: unknown,
	accessorOf: SlotAccessorOf,
	kind: string,
	kindNameFromId: ((id: number) => string | undefined) | undefined,
	span?: { readonly start: number; readonly end: number }
): TypedNode | undefined {
	return wrappedNodesOfKind(root, accessorOf, kind, kindNameFromId).find(
		(candidate) => span === undefined || (candidate.span?.start === span.start && candidate.span?.end === span.end)
	)?.node;
}

function nodeType(node: TS.Node): string {
	return node.type;
}

export function findFirst(
	node: TS.Node,
	kind: string,
	kindOf: (node: TS.Node) => string = nodeType
): TS.Node | null {
	if (kindOf(node) === kind && node.isNamed) return node;
	for (const child of node.children) {
		const found = findFirst(child, kind, kindOf);
		if (found) return found;
	}
	return null;
}

export function collectKinds(node: TS.Node, kindOf: (node: TS.Node) => string = nodeType): Set<string> {
	const kinds = new Set<string>();

	function walk(n: TS.Node) {
		if (n.isNamed) kinds.add(kindOf(n));
		for (const child of n.children) walk(child);
	}
	walk(node);
	return kinds;
}

export function buildKindToSupertypes(
	rawEntries: readonly { type: string; subtypes?: readonly { type: string }[] }[],
	modelSubtypes: Readonly<Record<string, readonly string[]>>
): Map<string, string[]> {
	const result = new Map<string, string[]>();
	const add = (member: string, supertype: string): void => {
		const existing = result.get(member) ?? [];
		if (!existing.includes(supertype)) existing.push(supertype);
		result.set(member, existing);
	};
	for (const entry of rawEntries) for (const sub of entry.subtypes ?? []) add(sub.type, entry.type);
	for (const [supertype, members] of Object.entries(modelSubtypes)) for (const member of members) add(member, supertype);
	return result;
}

export type WrapForReparseResult = HostedText;

const reparseHostsCache = new Map<string, ReparseHosts>();

export async function loadReparseHosts(grammar: string): Promise<ReparseHosts> {
	const cached = reparseHostsCache.get(grammar);
	if (cached !== undefined) return cached;
	const loaded = (await importGrammarModule(grammar, 'reparse-hosts.ts'))?.REPARSE_HOSTS ?? NO_REPARSE_HOSTS;
	reparseHostsCache.set(grammar, loaded);
	return loaded;
}

export function setDerivedReparseHosts(grammar: string, derived: Readonly<Record<string, string>>): void {
	const declared = reparseHostsCache.get(grammar);
	if (declared === undefined) throw new Error(`reparse hosts for '${grammar}' are not loaded; await loadReparseHosts('${grammar}') first`);
	reparseHostsCache.set(grammar, { ...declared, hosts: { ...derived, ...declared.hosts } });
}

export function wrapForReparse(
	rendered: string,
	kind: string,
	grammar: string,
	kindToSupertypes: Map<string, string[]>,
	opts?: HostOptions
): WrapForReparseResult | null {
	const hosts = reparseHostsCache.get(grammar);
	if (hosts === undefined)
		throw new Error(`reparse hosts for '${grammar}' are not loaded; await loadReparseHosts('${grammar}') first`);
	const template = hostTemplateFor(kind, hosts, kindToSupertypes, opts);
	return template === undefined ? null : applyHost(template, rendered, opts?.parse);
}

export function upstreamWasmPath(grammar: string): string | undefined {
	if (!isGrammar(grammar)) return undefined;
	const built = join(grammarPackageDir(grammar), '.sittir', UPSTREAM_WASM);
	if (existsSync(built)) return built;
	const upstream = upstreamPackage(grammar);
	try {
		return grammarRequire(grammar).resolve(`${upstream}/${upstream}.wasm`);
	} catch {
		throw new Error(
			`no upstream parser for '${grammar}': neither .sittir/${UPSTREAM_WASM} nor a published ${upstream}.wasm; build it with \`pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${grammar} --compile-parser\``
		);
	}
}

async function wrapExportOf<K extends keyof GrammarModules['wrap.ts']>(
	grammar: string,
	name: K
): Promise<GrammarModules['wrap.ts'][K] | null> {
	try {
		const mod = await importGrammarModule(grammar, 'wrap.ts');
		if (!mod) return null;
		return mod[name] ?? null;
	} catch (e) {
		console.error(`[validators] failed to load wrap module for ${grammar}: ${(e as Error).message}`);
		return null;
	}
}

/** The grammar's wrapped read: the root (or the node a coordinate names) read `depth` levels down (one when absent) and wrapped. */
export async function readNodeOf(
	grammar: string
): Promise<((tree: TreeHandle, coordinate?: NodeCoordinate, depth?: number) => unknown) | null> {
	const [wrapNode, hydrate] = await Promise.all([wrapExportOf(grammar, 'wrapNode'), wrapExportOf(grammar, 'hydrate')]);
	if (wrapNode === null || hydrate === null) return null;
	return (tree, coordinate, depth) => {
		if (coordinate !== undefined) return hydrate(coordinate, tree, depth);
		if (tree.read === undefined) throw new Error('readNodeOf: the tree has no native read');
		return wrapNode(tree.read(0, depth), tree);
	};
}

export function hydrateOf(grammar: string): Promise<Hydrate | null> {
	return wrapExportOf(grammar, 'hydrate');
}

export interface Seat {
	readonly kind: string;
	readonly shape: 'arm' | 'flatten' | 'elements' | 'tuple' | 'forwarded';
	readonly mount?: string;
	readonly seated?: true;
}

export type SeatTable = Record<string, Record<string, Record<string, Seat>>>;

export interface LoadedNodeModel {
	readonly displayUnions: DisplayFamilies;
	readonly root: string | undefined;
	readonly irKeys: Record<string, string>;
	readonly modelTypes: Record<string, string>;
	readonly typeNames: Record<string, string>;
	readonly renamedFrom: Record<string, string>;
	readonly splitFrom: Record<string, string>;
	readonly leafPatterns: Record<string, RegExp>;
	readonly hoistedKinds: ReadonlySet<string>;
	readonly oneSurfaceKinds: ReadonlySet<string>;
	readonly seats: SeatTable;
	readonly slotKinds: Record<string, Record<string, readonly string[]>>;
	readonly slotNames: Record<string, readonly string[]>;
	readonly slotStorage: Record<string, Record<string, string>>;
	/** Each kind's slots by storage key, to the accessor that reads it; a kind with no slots maps to `{}`. */
	readonly slotAccessors: Record<string, Record<string, string>>;
	readonly factoryShapes: Record<string, FactoryShape>;
	readonly factoryFields: Record<string, readonly string[]>;
	readonly factorySlots: Record<string, Record<string, FactorySlotMeta>>;
	readonly fieldAliasMap: Record<string, Record<string, string>>;
	readonly polymorphVariants: PolymorphVariantMap;
	readonly builderPaths: Readonly<Record<string, readonly string[]>>;
	readonly builderPathAlternates: Readonly<Record<string, readonly (readonly string[])[]>>;
	readonly subtypes: Record<string, readonly string[]>;
	readonly slotRequired: Record<string, Record<string, boolean>>;
	readonly slotMultiple: Record<string, Record<string, boolean>>;
	readonly slotDefaults: Record<string, Record<string, string>>;
	readonly bareAccepts: Record<string, readonly string[]>;
	readonly textLeavesThrough: Record<string, readonly string[]>;
	readonly forwardsTo: Record<string, string>;
	readonly listDefaults: Record<string, string>;
	readonly listElementKinds: Record<string, readonly string[]>;
	/** Each list kind whose separator is chosen per instance, with the separators it may hold. */
	readonly listSeparators: Record<string, readonly string[]>;
	readonly fullForms: Record<string, ModelFullForm>;
	/** Whether a node with these grammar and display ids is a relaxed keyword: the model's table read as the generated reader reads it. */
	readonly relaxes: (grammar: number, display: number) => boolean;
}

export interface ModelFullForm {
	readonly open: { readonly texts: readonly string[] };
	readonly close: { readonly texts: readonly string[] };
}

interface RelaxationFacts {
	readonly word?: { readonly display: number; readonly tokens: readonly number[] };
	readonly displays: readonly { readonly display: number; readonly tokens: readonly number[] }[];
}

/**
 * Whether a node with these grammar and display ids reads as its display id:
 * a relaxed keyword of the word rule (`relaxes` in kind_ids.rs), or any node
 * shown as an alias of the word rule, whose display the reader stamps.
 */
export function relaxesOf(table: RelaxationFacts | null | undefined): (grammar: number, display: number) => boolean {
	return (grammar, display) =>
		table !== undefined &&
		table !== null &&
		((table.word?.display === display && table.word.tokens.includes(grammar)) || table.displays.some((site) => site.display === display));
}

interface ParsedNodeModel {
	displayUnions?: DisplayFamilies;
	root?: string | null;
	relaxes?: RelaxationFacts | null;
	nodes?: ReadonlyArray<{
		kind: string;
		irKey?: string;
		builderPath?: readonly string[];
		builderPathAlternates?: readonly (readonly string[])[];
		modelType?: string;
		typeName?: string;
		seated?: true;
		renamedFrom?: string;
		splitFrom?: string;
		slots?: ReadonlyArray<{
			name: string;
			accessor: string;
			required?: boolean;
			multiple?: boolean;
			nonEmpty?: boolean;
			storage?: string;
			registered?: boolean;
			optionDefault?: number | string;
			values?: ReadonlyArray<ParsedSlotValue>;
		}>;
		elementSeats?: readonly Seat[];
		elementKinds?: readonly string[];
		oneSurface?: boolean;
		factoryShape?: FactoryShape;
		factoryFields?: readonly string[];
		subtypes?: readonly string[];
		bareAccepts?: readonly string[];
		textLeavesThrough?: readonly string[];
		forwardsTo?: string;
		defaultDelimiter?: string;
		separatorCandidates?: readonly string[];
		leafPattern?: string;
		fullForm?: ModelFullForm;
	}>;
	fieldAliasMap?: Record<string, Record<string, string>>;
	polymorphVariants?: PolymorphVariantMap;
}

interface ParsedSlotValue {
	kind?: string;
	multiplicity?: string;
	seat?: Seat;
	name?: string;
	parseKind?: string;
	default?: true;
}

const EMPTY_NODE_MODEL: LoadedNodeModel = {
	displayUnions: {},
	root: undefined,
	irKeys: {},
	modelTypes: {},
	typeNames: {},
	renamedFrom: {},
	splitFrom: {},
	leafPatterns: {},
	hoistedKinds: new Set(),
	oneSurfaceKinds: new Set(),
	seats: {},
	slotKinds: {},
	slotNames: {},
	slotStorage: {},
	slotAccessors: {},
	factoryShapes: {},
	factoryFields: {},
	factorySlots: {},
	fieldAliasMap: {},
	polymorphVariants: {},
	builderPaths: {},
	builderPathAlternates: {},
	subtypes: {},
	slotRequired: {},
	slotMultiple: {},
	slotDefaults: {},
	bareAccepts: {},
	textLeavesThrough: {},
	forwardsTo: {},
	listDefaults: {},
	listElementKinds: {},
	listSeparators: {},
	fullForms: {},
	relaxes: () => false
};

export function readNodeModelFile(grammar: string): string | undefined {
	const p = grammarModulePath(grammar, 'node-model.json5');
	if (!p) return undefined;
	try {
		return readFileSync(p, 'utf-8');
	} catch {
		return undefined;
	}
}

function regexOfLiteral(literal: string): RegExp {
	const end = literal.lastIndexOf('/');
	return new RegExp(literal.slice(1, end), literal.slice(end + 1));
}

export async function loadNodeModel(grammar: string): Promise<LoadedNodeModel> {
	const raw = readNodeModelFile(grammar);
	return raw === undefined ? EMPTY_NODE_MODEL : parseNodeModel(raw);
}

export async function loadBoundNameOf(grammar: string): Promise<(name: string) => string> {
	return invoke('bind', 'boundNameOf', (await loadNodeModel(grammar)).renamedFrom);
}

export function parseNodeModel(text: string): LoadedNodeModel {
	const model = JSON.parse(text) as ParsedNodeModel;
	const renamedFrom: Record<string, string> = {};
	const splitFrom: Record<string, string> = {};
	const irKeys: Record<string, string> = {};
	const builderPaths: Record<string, readonly string[]> = {};
	const builderPathAlternates: Record<string, readonly (readonly string[])[]> = {};
	const modelTypes: Record<string, string> = {};
	const typeNames: Record<string, string> = {};
	const leafPatterns: Record<string, RegExp> = {};
	const hoistedKinds = new Set<string>();
	const oneSurfaceKinds = new Set<string>();
	const seats: SeatTable = {};
	const seatAt = (kind: string, slot: string, seat: Seat): void => {
		((seats[kind] ??= {})[slot] ??= {})[seat.kind] = seat;
	};
	const slotKinds: Record<string, Record<string, readonly string[]>> = {};
	const slotNames: Record<string, readonly string[]> = {};
	const slotStorage: Record<string, Record<string, string>> = {};
	const slotAccessors: Record<string, Record<string, string>> = {};
	const factoryShapes: Record<string, FactoryShape> = {};
	const factoryFields: Record<string, readonly string[]> = {};
	const subtypes: Record<string, readonly string[]> = {};
	const slotRequired: Record<string, Record<string, boolean>> = {};
	const slotMultiple: Record<string, Record<string, boolean>> = {};
	const slotDefaults: Record<string, Record<string, string>> = {};
	const bareAccepts: Record<string, readonly string[]> = {};
	const textLeavesThrough: Record<string, readonly string[]> = {};
	const forwardsTo: Record<string, string> = {};
	const listDefaults: Record<string, string> = {};
	const listElementKinds: Record<string, readonly string[]> = {};
	const listSeparators: Record<string, readonly string[]> = {};
	const fullForms: Record<string, ModelFullForm> = {};
	const factorySlots: Record<string, Record<string, FactorySlotMeta>> = {};
	for (const node of model.nodes ?? []) {
		if (node.irKey !== undefined) irKeys[node.kind] = node.irKey;
		if (node.builderPath !== undefined) builderPaths[node.kind] = node.builderPath;
		if (node.builderPathAlternates !== undefined) builderPathAlternates[node.kind] = node.builderPathAlternates;
		if (node.modelType !== undefined) modelTypes[node.kind] = node.modelType;
		if (node.typeName !== undefined) typeNames[node.kind] = node.typeName;
		if (node.renamedFrom !== undefined) renamedFrom[node.kind] = node.renamedFrom;
		if (node.splitFrom !== undefined) splitFrom[node.kind] = node.splitFrom;
		if (node.leafPattern !== undefined) leafPatterns[node.kind] = regexOfLiteral(node.leafPattern);
		if (node.seated === true) hoistedKinds.add(node.kind);
		if (node.oneSurface === true) oneSurfaceKinds.add(node.kind);
		for (const seat of node.elementSeats ?? []) seatAt(node.kind, '*', seat);
		slotAccessors[node.kind] = Object.fromEntries((node.slots ?? []).map((slot) => [storageKeyOf(slot.name), slotPropertyName(slot)]));
		if (node.slots !== undefined) {
			for (const slot of node.slots) {
				for (const value of slot.values ?? []) {
					if (value.seat !== undefined) seatAt(node.kind, slot.name, value.seat);
					const valueName = valueNameOf(value);
					if (value.default === true && valueName !== undefined) {
						(slotDefaults[node.kind] ??= {})[slotPropertyName(slot)] = valueName;
					}
				}
			}
			slotKinds[node.kind] = Object.fromEntries(node.slots.map((slot) => [slotPropertyName(slot), slotKindsOf(slot)]));
			slotNames[node.kind] = node.slots.map((slot) => slot.name);
			if (node.factoryShape !== undefined) {
				factorySlots[node.kind] = Object.fromEntries(node.slots.map((slot) => [slot.name, factorySlotMetaOf(slot)]));
			}
			slotRequired[node.kind] = Object.fromEntries(
				node.slots.map((slot) => [slotPropertyName(slot), slot.required === true])
			);
			slotMultiple[node.kind] = Object.fromEntries(
				node.slots.map((slot) => [slotPropertyName(slot), slot.multiple === true])
			);
			slotStorage[node.kind] = Object.fromEntries(
				node.slots.flatMap((slot) => (slot.storage === undefined ? [] : [[slotPropertyName(slot), slot.storage]]))
			);
		}
		if (node.factoryShape !== undefined) factoryShapes[node.kind] = node.factoryShape;
		if (node.factoryFields !== undefined) factoryFields[node.kind] = node.factoryFields;
		if (node.subtypes !== undefined) subtypes[node.kind] = node.subtypes;
		if (node.bareAccepts !== undefined) bareAccepts[node.kind] = node.bareAccepts;
		if (node.textLeavesThrough !== undefined) textLeavesThrough[node.kind] = node.textLeavesThrough;
		if (node.forwardsTo !== undefined) forwardsTo[node.kind] = node.forwardsTo;
		if (node.defaultDelimiter !== undefined) {
			listDefaults[node.kind] = node.defaultDelimiter;
		}
		if (node.elementKinds !== undefined) listElementKinds[node.kind] = node.elementKinds;
		if (node.separatorCandidates !== undefined) listSeparators[node.kind] = node.separatorCandidates;
		if (node.fullForm !== undefined) fullForms[node.kind] = node.fullForm;
	}
	return {
		root: model.root ?? undefined,
		displayUnions: model.displayUnions ?? {},
		irKeys,
		modelTypes,
		typeNames,
		renamedFrom,
		splitFrom,
		leafPatterns,
		hoistedKinds,
		oneSurfaceKinds,
		seats,
		slotKinds,
		slotNames,
		slotStorage,
		slotAccessors,
		factoryShapes,
		factoryFields,
		factorySlots,
		fieldAliasMap: model.fieldAliasMap ?? {},
		polymorphVariants: model.polymorphVariants ?? {},
		builderPaths,
		builderPathAlternates,
		subtypes,
		slotRequired,
		slotMultiple,
		slotDefaults,
		bareAccepts,
		textLeavesThrough,
		forwardsTo,
		listDefaults,
		listElementKinds,
		listSeparators,
		fullForms,
		relaxes: relaxesOf(model.relaxes)
	};
}

export function wrappedNodesOf(root: unknown, accessorOf: SlotAccessorOf): TypedNode[] {
	const nodes: TypedNode[] = [];
	walkWrappedTree(root, accessorOf, (node) => nodes.push(node));
	return nodes;
}

export function walkWrappedTree(
	root: unknown,
	accessorOf: SlotAccessorOf,
	visit: (w: TypedNode) => void,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): void {
	const seen = new Set<number>();
	const recurse = (w: unknown): void => {
		if (!hasNumericType(w)) return;
		if (isCoordinate(w)) {
			if (seen.has(w.$treeHandle)) return;
			seen.add(w.$treeHandle);
		}
		visit(w);
		for (const [, v] of slotValuesOf(w, accessorOf, onAccessorThrow)) {
			if (hasNumericType(v)) recurse(v);
			else if (Array.isArray(v)) for (const x of v) if (hasNumericType(x)) recurse(x);
		}
	};
	recurse(root);
}

export function materialize(root: unknown, accessorOf: SlotAccessorOf, onAccessorThrow?: (rec: AccessorThrowRecord) => void): AnyUntypedNode {
	return materializeValue(root, accessorOf, onAccessorThrow) as AnyUntypedNode;
}

export function materializeDetached(
	root: unknown,
	accessorOf: SlotAccessorOf,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): AnyUntypedNode {
	return holdingTreeOf(root, detachCoordinates(materialize(root, accessorOf, onAccessorThrow)));
}

export function materializeShallow(
	root: unknown,
	accessorOf: SlotAccessorOf,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): AnyUntypedNode {
	const ownRow = typeof root === 'object' && root !== null ? coordinateOf(root)?.$treeHandle : undefined;
	const asCoordinate = (value: unknown): unknown => {
		if (Array.isArray(value)) return value.map(asCoordinate);
		if (!hasNumericType(value)) return value;
		const at = coordinateOf(value);
		return at !== undefined && at.$treeHandle !== ownRow ? holdingTreeOf(value, at) : materializeValue(value, accessorOf, onAccessorThrow);
	};
	return holdingTreeOf(root, materializeValue(root, accessorOf, onAccessorThrow, asCoordinate) as AnyUntypedNode);
}

/**
 * Make `copy` hold the tree `original` holds, and return it. A copy made by
 * string keys, by JSON or by `detachCoordinates` holds no tree, and its
 * coordinates are refused at render; a tool that copies read data and still
 * renders it passes the tree on here.
 */
export function holdingTreeOf<T>(original: unknown, copy: T): T {
	const token = original !== null && typeof original === 'object' ? treeTokenOf(original) : undefined;
	if (token !== undefined) holdTree(copy, token);
	return copy;
}

/**
 * Detach `node` in place and keep it holding its tree, so the text-only
 * coordinates the detach leaves still render.
 */
export function detachedHoldingTree<T>(node: T): T {
	const token = node !== null && typeof node === 'object' ? treeTokenOf(node) : undefined;
	const detached = detachCoordinates(node);
	if (token !== undefined) holdTree(detached, token);
	return detached;
}

export interface AccessorThrowRecord {
	readonly key: string;
	readonly accessor: string;
	readonly type: unknown;
	readonly message: string;
}

export interface ValidatorSkip {
	readonly entry: string;
	readonly reason: string;
	readonly kind?: string;
	readonly input?: string;
}

function materializeValue(
	value: unknown,
	accessorOf: SlotAccessorOf,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void,
	slotValue: (value: unknown) => unknown = (inner) => materializeValue(inner, accessorOf, onAccessorThrow)
): unknown {
	if (Array.isArray(value)) {
		return value.map((entry) => materializeValue(entry, accessorOf, onAccessorThrow, slotValue));
	}
	if (!hasNumericType(value)) return value;
	const { accessors } = accessorOf(value.$type);
	const materialized: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		if (!isDataKey(key)) continue;
		if (key === '$text') {
			materialized.$text = nodeText(value);
			continue;
		}
		const raw = (value as Record<string, unknown>)[key];
		if (typeof raw === 'function') continue;
		if (key === '$_layout' && raw != null) {
			const layout = raw as NodeLayout;
			materialized.$_layout =
				layout.trivia === undefined
					? layout
					: {
							...layout,
							trivia: mapTriviaEntries(layout.trivia as TriviaSides<unknown>, (entries) =>
								entries.map((entry) => materializeValue(hydrateTriviaEntry(entry), accessorOf, onAccessorThrow))
							)
						};
			continue;
		}
		if (key.startsWith('_') && accessors[key] !== undefined) continue;
		materialized[key] = materializeValue(raw, accessorOf, onAccessorThrow);
	}
	for (const [storageKey, resolved] of slotValuesOf(value, accessorOf, onAccessorThrow)) {
		if (resolved !== undefined) materialized[storageKey] = slotValue(resolved);
	}
	carryPlace(value, materialized);
	carrySourceStamp(value, materialized);
	return carryRead(value, materialized);
}

export function slotValuesOf(
	node: TypedNode,
	accessorOf: SlotAccessorOf,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): [storageKey: string, value: unknown][] {
	const { kind, accessors, delimiter } = accessorOf(node.$type);
	const values = Object.entries(accessors).flatMap(([storageKey, accessor]): [string, unknown][] => {
		const read = storedSlotReader(node, accessor);
		if (typeof read !== 'function' || read.length !== 0) {
			if (Object.hasOwn(node, storageKey)) throw new Error(`slotValuesOf: ${kind} stores ${storageKey}, but has no reader ${accessor}()`);
			return [];
		}
		try {
			return [[storageKey, (read as () => unknown).call(node)]];
		} catch (e) {
			const message = (e as Error).message;
			process.stderr.write(`[accessor-throw] key=${storageKey} accessor=${accessor} type=${node.$type} err=${message}\n`);
			onAccessorThrow?.({ key: storageKey, accessor, type: node.$type, message });
			return [];
		}
	});
	if (delimiter && typeof node.delimiter === 'number') values.push([storageKeyOf('delimiter'), node.delimiter]);
	return values;
}

/** A kind and its slots: each storage key to the accessor that reads it, and whether it is a list whose delimiter is chosen per instance. */
export interface KindSlots {
	readonly kind: string;
	readonly accessors: Readonly<Record<string, string>>;
	readonly delimiter: boolean;
}

/** A kind's slots, by the node's stamped kind id. */
export type SlotAccessorOf = (typeId: number) => KindSlots;

export function slotAccessorOf(
	model: Pick<LoadedNodeModel, 'slotAccessors' | 'listDefaults'>,
	kindNameFromId: (id: number) => string | undefined
): SlotAccessorOf {
	return (typeId) => {
		const kind = kindNameFromId(typeId);
		const accessors = kind === undefined ? undefined : model.slotAccessors[kind];
		if (kind === undefined || accessors === undefined) throw new Error(`slotAccessorOf: ${kind ?? `kind id ${typeId}`} is not in the node model`);
		return { kind, accessors, delimiter: model.listDefaults[kind] !== undefined };
	};
}

/** A kind's slot name as a config builds it and its accessor reads it, from the model's slot name. */
export function slotNameOf(model: Pick<LoadedNodeModel, 'slotAccessors'>): (kind: string, slot: string) => string {
	return (kind, slot) => {
		const name = model.slotAccessors[kind]?.[storageKeyOf(slot)];
		if (name === undefined) throw new Error(`slotNameOf: ${kind} has no slot ${slot} in the node model`);
		return name;
	};
}

export interface TypedNode {
	readonly $type: number;
	readonly [k: string]: unknown;
}
function hasNumericType(v: unknown): v is TypedNode {
	return !!v && typeof v === 'object' && typeof (v as { $type?: unknown }).$type === 'number';
}

export type IrEntry = { readonly strict?: (...args: unknown[]) => unknown } & Record<string, unknown>;

export interface IrSurface {
	readonly entries: Record<string, IrEntry>;
	readonly seats: SeatTable;
	readonly modelTypes: Record<string, string>;
}

export async function loadScopedFactoryMap<T extends Record<string, unknown>>(grammar: string, map: T): Promise<T> {
	return scopeBuilders(await loadNativeEngine(grammar), map);
}

export async function loadIrSurface(grammar: string): Promise<IrSurface | undefined> {
	const mod = await importGrammarModule(grammar, 'ir.ts');
	if (mod?.ir === undefined) return undefined;
	const model = await loadNodeModel(grammar);
	const entries: Record<string, IrEntry> = {};
	const engine = await loadNativeEngine(grammar);
	for (const [kind, irKey] of Object.entries(model.irKeys)) {
		const entry = mod.ir[irKey];
		if (entry !== null && (typeof entry === 'object' || typeof entry === 'function')) entries[kind] = scopeBuilders(engine, entry as IrEntry);
	}
	return { entries, seats: model.seats, modelTypes: model.modelTypes };
}

export async function loadKindNames(grammar: string): Promise<ReadonlyMap<number, string> | undefined> {
	try {
		const typesModule = await importGrammarModule(grammar, 'types.ts');
		if (!typesModule) return undefined;
		return typesModule.KIND_DISPLAY_NAMES;
	} catch {
		return undefined;
	}
}

export async function loadStorageKindNameFromId(
	grammar: string
): Promise<((id: number) => string | undefined) | undefined> {
	try {
		const typesModule = await importGrammarModule(grammar, 'types.ts');
		if (!typesModule) return undefined;
		const kindNames = typesModule.KIND_NAMES;
		return kindNames ? (id: number) => kindNames.get(id) : undefined;
	} catch {
		return undefined;
	}
}

export async function loadIsLeafKind(grammar: string): Promise<(kindId: number) => boolean> {
	const kindNameFromId = await loadKindNameFromId(grammar);
	const { modelTypes } = await loadNodeModel(grammar);
	return (kindId) => {
		const name = kindNameFromId?.(kindId);
		return isLeafModelType(name === undefined ? undefined : modelTypes[name]);
	};
}

export function isLeafModelType(modelType: string | undefined): boolean {
	return modelType === 'pattern' || modelType === 'enum' || isUnitModelType(modelType);
}

export function isUnitModelType(modelType: string | undefined): boolean {
	return modelType === 'keyword' || modelType === 'punctuation';
}

export async function loadKindNameFromId(grammar: string): Promise<((id: number) => string | undefined) | undefined> {
	try {
		const typesModule = await importGrammarModule(grammar, 'types.ts');
		if (!typesModule) return undefined;
		const kindNames = typesModule.KIND_DISPLAY_NAMES;
		if (kindNames) {
			return (id: number) => kindNames.get(id);
		}
		const rawFn = typesModule.kindNameFromId;
		if (!rawFn) return undefined;
		return (id: number) => {
			try {
				return rawFn(id);
			} catch {
				return undefined;
			}
		};
	} catch {
		return undefined;
	}
}

export async function loadCanonicalKindNameFromId(
	grammar: string
): Promise<((id: number) => string | undefined) | undefined> {
	try {
		const typesModule = await importGrammarModule(grammar, 'types.ts');
		if (!typesModule) return undefined;
		const kindNames = typesModule.KIND_NAMES;
		if (!kindNames) return undefined;
		return (id: number) => kindNames.get(id);
	} catch {
		return undefined;
	}
}

export async function loadSlotAccessorOf(grammar: string): Promise<SlotAccessorOf> {
	const kindNameFromId = await loadStorageKindNameFromId(grammar);
	if (kindNameFromId === undefined) throw new Error(`loadSlotAccessorOf: ${grammar} has no kind name table`);
	return slotAccessorOf(await loadNodeModel(grammar), kindNameFromId);
}

export async function loadKindIdFromName(grammar: string): Promise<((name: string) => number) | undefined> {
	try {
		const typesModule = await importGrammarModule(grammar, 'types.ts');
		if (!typesModule) return undefined;
		return typesModule.kindIdFromName;
	} catch {
		return undefined;
	}
}

export async function loadLanguageForGrammar(grammar: string): Promise<{
	Parser: typeof TS.Parser;
	Language: typeof TS.Language;
	lang: TS.Language;
	isOverride: boolean;
}> {
	const { assertGeneratedManifestsClean } = await load('generatedManifest');
	if (isGrammar(grammar)) assertGeneratedManifestsClean([grammar]);
	const { Parser, Language } = await loadWebTreeSitter();

	const overrideWasm = join(grammarPackageDir(grammar), '.sittir', 'parser.wasm');
	if (existsSync(overrideWasm)) {
		const lang = await Language.load(overrideWasm);
		return { Parser, Language, lang, isOverride: true };
	}

	const baseWasm = upstreamWasmPath(grammar);
	if (baseWasm === undefined)
		throw new Error(`no parser wasm for grammar '${grammar}': neither .sittir/parser.wasm nor an upstream package`);
	const lang = await Language.load(baseWasm);
	return { Parser, Language, lang, isOverride: false };
}

export type { FactoryEntry, Hydrate } from '../grammar-internals.ts';

export interface NodeToConfigOpts {
	readonly accessorOf: SlotAccessorOf;
	readonly placeText?: boolean;
	readonly shownKind?: string;
	readonly interiorOf?: (kind: string) => TokenInterior | undefined;
	readonly tree?: TreeHandle;
	readonly hydrate?: Hydrate;
	readonly factoryMap?: Record<string, FactoryEntry>;
	readonly factoryShapes?: Record<string, FactoryShape>;
	readonly fieldAliasMap?: Record<string, Record<string, string>>;
	readonly factoryFields?: Record<string, readonly string[]>;
	readonly factorySlots?: Record<string, Record<string, FactorySlotMeta>>;
	readonly omitOptionDefaults?: boolean;
	readonly cstNodeKindHint?: string;
	readonly firstNamedChildKindHint?: string;
	readonly namedChildKindHints?: readonly string[];
	readonly _parentKind?: string;
	readonly _fieldName?: string;
	readonly _depth?: number;
	readonly kindNameFromId?: (id: number) => string | undefined;
	readonly surface?: IrSurface;
}

export interface ReadNodeLike {
	readonly $type?: number;
	readonly $text?: string | (() => string);
	readonly $named?: boolean;
	readonly $_layout?: NodeLayout;
}

function isAnonTokenPassthrough(c: ReadNodeLike): boolean {
	return c.$named === false;
}

function shouldHaltRecursion(
	depth: number,
	tree: NodeToConfigOpts['tree'],
	factoryMap: NodeToConfigOpts['factoryMap']
): boolean {
	return depth > 64 || !tree || !factoryMap;
}

function resolveAliasedKind(
	rawKind: string,
	parentKind: string | undefined,
	fieldName: string | undefined,
	fieldAliasMap: NodeToConfigOpts['fieldAliasMap']
): string {
	if (fieldAliasMap && parentKind && fieldName) {
		const key = `${parentKind}.${fieldName}`;
		const targetMap = fieldAliasMap[key];
		if (targetMap && targetMap[rawKind]) return targetMap[rawKind]!;
	}
	return rawKind;
}

function resolveChild(child: unknown, opts: NodeToConfigOpts): unknown {
	if (child == null) return child;
	if (typeof child === 'string' || typeof child === 'number') return child;
	if (typeof child !== 'object') return child;
	const c = child as ReadNodeLike;
	if (isAnonTokenPassthrough(c)) return child;
	const { tree, factoryMap, fieldAliasMap, _depth = 0, _parentKind, _fieldName } = opts;
	if (shouldHaltRecursion(_depth, tree, factoryMap)) return child;
	const hydrated = hydrateForConfig(c, opts);
	if (opts.placeText === true && _parentKind !== undefined && opts.factoryShapes?.[_parentKind] === 'placed') {
		const text = readNodeText(hydrated, opts);
		if (text !== '') return text;
	}
	const rawTypeId = hydrated.$type ?? c.$type;
	const rawKind = rawTypeId !== undefined ? (opts.kindNameFromId?.(rawTypeId) ?? String(rawTypeId)) : undefined;
	if (!rawKind) return hydrated;
	let kind = resolveAliasedKind(rawKind, _parentKind, _fieldName, fieldAliasMap);
	let factory = factoryMap![kind];
	if (!factory && kind.startsWith('_')) {
		const strippedKind = kind.slice(1);
		const strippedFactory = factoryMap![strippedKind];
		if (strippedFactory) {
			kind = strippedKind;
			factory = strippedFactory;
		}
	}
	if (!factory) {
		const inner = soleWrappedNode(hydrated, opts);
		return inner === undefined ? hydrated : resolveChild(inner, { ...opts, _depth: _depth + 1 });
	}
	return buildWithFactory(hydrated, kind, factory, { ...opts, _depth: _depth + 1 });
}

function soleWrappedNode(hydrated: ReadNodeLike, opts: NodeToConfigOpts): ReadNodeLike | undefined {
	const rec = hydrated as unknown as Record<string, unknown>;
	const keys = Object.keys(rec).filter((k) => k.startsWith('_') && rec[k] !== undefined);
	if (keys.length !== 1) return undefined;
	const value = rec[keys[0]!];
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
	const kind = rawChildKindName(value, opts.kindNameFromId);
	if (kind === undefined) return undefined;
	const has = opts.factoryMap?.[kind] ?? (kind.startsWith('_') ? opts.factoryMap?.[kind.slice(1)] : undefined);
	return has === undefined ? undefined : (value as ReadNodeLike);
}

function readNodeText(node: ReadNodeLike, opts: NodeToConfigOpts): string {
	const text = sourceTextOf(node as object, opts.tree);
	if (text !== undefined) return text;
	const rec = node as unknown as Record<string, unknown>;
	const keys = Object.keys(rec).filter((k) => k.startsWith('_') && rec[k] !== undefined);
	const wrapped = keys.length === 1 ? rec[keys[0]!] : undefined;
	return wrapped !== null && typeof wrapped === 'object' && !Array.isArray(wrapped) ? readNodeText(wrapped as ReadNodeLike, opts) : '';
}

function hydrateForConfig(c: ReadNodeLike, opts: NodeToConfigOpts): ReadNodeLike {
	const { tree, hydrate } = opts;
	return tree !== undefined && hydrate !== undefined && isCoordinate(c) ? (hydrate(c, tree) as ReadNodeLike) : c;
}

const ARM_ROUTE = Symbol('armRoute');
const FLATTENED = Symbol('flattened');
const POSITIONAL = Symbol('positional');
const SEAT_KIND = Symbol('seatKind');

interface ArmRoute {
	readonly mount: string;
	readonly args: readonly unknown[] | undefined;
}

function armRouteOf(config: Record<string, unknown>): ArmRoute | undefined {
	return (config as Record<symbol, unknown>)[ARM_ROUTE] as ArmRoute | undefined;
}

function positionalOf(config: Record<string, unknown>): readonly unknown[] | undefined {
	return (config as Record<symbol, unknown>)[POSITIONAL] as readonly unknown[] | undefined;
}

function flattenedOf(config: Record<string, unknown>): true | readonly unknown[] | undefined {
	return (config as Record<symbol, true | readonly unknown[] | undefined>)[FLATTENED];
}

function readValueKind(value: unknown, opts: NodeToConfigOpts): string | undefined {
	if (typeof value === 'number') return opts.kindNameFromId?.(value);
	return rawChildKindName(value, opts.kindNameFromId);
}

function seatForSlotValue(
	parentKind: string | undefined,
	slotName: string,
	value: unknown,
	opts: NodeToConfigOpts
): Seat | undefined {
	const surface = opts.surface;
	if (surface === undefined || parentKind === undefined) return undefined;
	const table = surface.seats[parentKind]?.[slotName] ?? surface.seats[parentKind]?.['*'];
	if (table === undefined) return undefined;
	if (Array.isArray(value)) return Object.values(table).find((seat) => seat.shape === 'elements');
	if (typeof value === 'string') {
		const textArms = Object.values(table).filter(
			(seat) => seat.shape === 'arm' && surface.modelTypes[seat.kind] === 'pattern'
		);
		return textArms.length === 1 ? textArms[0] : undefined;
	}
	const kind = readValueKind(value, opts);
	return kind === undefined ? undefined : table[kind];
}

export function withSeatKind<C extends Record<string, unknown>>(config: C, seatKind: string): C {
	Object.defineProperty(config, SEAT_KIND, { value: seatKind, enumerable: false });
	return config;
}

export function seatKindOf(config: unknown): string | undefined {
	return typeof config === 'object' && config !== null ? (config as { [SEAT_KIND]?: string })[SEAT_KIND] : undefined;
}

function childOpts(opts: NodeToConfigOpts): NodeToConfigOpts {
	return { ...opts, _depth: (opts._depth ?? 0) + 1 };
}

function projectElements(
	items: readonly unknown[],
	seat: Seat,
	parentKind: string | undefined,
	slotName: string | undefined,
	opts: NodeToConfigOpts
): unknown[] {
	return items.map((item) => {
		if (readValueKind(item, opts) !== seat.kind) {
			return resolveChild(item, memberValueOpts(opts, parentKind, slotName));
		}
		const element = hydrateForConfig(item as ReadNodeLike, opts);
		const config = nodeToConfig(element, childOpts(opts));
		carryGroupTrivia(element, 'elements', config, opts);
		return withSeatKind(config, seat.kind);
	});
}

/** Groups whose trivia had no built child to move to, by seat shape: the cases a seat cannot spell. */
export const seatedTriviaEdges: { readonly seat: string; readonly group: string; readonly children: string }[] = [];

/**
 * A seated group has no ir object, so its own trivia moves onto the children
 * the call builds: leading entries to the first built child, trailing entries to
 * the last. A moved trailing entry keeps its place relative to what follows the
 * group: its tokens-between grows by the group's own tokens after that child
 * (a trailing delimiter). One rule for every seat shape; a group with trivia
 * and no built child at that edge is recorded in `seatedTriviaEdges`.
 */
function carryGroupTrivia(group: ReadNodeLike, seat: string, container: Record<string, unknown>, opts: NodeToConfigOpts): void {
	const resolved = groupSides(group, opts);
	if (resolved === undefined) return;
	const holders: { holder: Record<string, unknown>; key: string }[] = [];
	for (const [key, value] of Object.entries(container)) {
		if (Array.isArray(value)) value.forEach((_, index) => holders.push({ holder: value as unknown as Record<string, unknown>, key: String(index) }));
		else holders.push({ holder: container, key });
	}
	const move = (at: { holder: Record<string, unknown>; key: string } | undefined, side: 'leading' | 'trailing', entries: readonly unknown[] | undefined): void => {
		if (entries === undefined || entries.length === 0) return;
		const child = at?.holder[at.key];
		if (at === undefined || typeof child !== 'object' || child === null) {
			seatedTriviaEdges.push({ seat, group: String(group.$type), children: at === undefined ? 'none' : typeof child });
			return;
		}
		const built = child as { $_layout?: NodeLayout };
		const existing = built.$_layout?.trivia as Record<string, readonly unknown[] | undefined> | undefined;
		const trivia = { ...existing, [side]: side === 'leading' ? [...entries, ...(existing?.leading ?? [])] : [...(existing?.trailing ?? []), ...entries] } as NodeTrivia;
		at.holder[at.key] = Object.assign(Object.create(Object.getPrototypeOf(built)), built, { $_layout: { ...built.$_layout, trivia } });
	};
	const nodes = (entries: readonly unknown[] | undefined) => entries?.filter((entry) => typeof entry !== 'number');
	move(holders[0], 'leading', nodes(resolved.leading));
	move(holders[holders.length - 1], 'trailing', nodes(resolved.trailing));
}

function projectArmSlot(
	seat: Seat,
	parentKind: string,
	slot: SlotModel,
	value: unknown,
	opts: NodeToConfigOpts,
	out: Record<string, unknown>
): void {
	if (seat.mount === undefined) throw new Error(`ir surface: arm seat ${seat.kind} on ${parentKind} has no mount`);
	const key = slot.key;
	const setRoute = (mount: string, args: readonly unknown[] | undefined): void => {
		const existing = armRouteOf(out);
		const composed = existing === undefined ? mount : `${existing.mount}.${mount}`;
		Object.defineProperty(out, ARM_ROUTE, {
			value: { mount: composed, args } satisfies ArmRoute,
			enumerable: false,
			configurable: true
		});
	};
	const modelType = opts.surface?.modelTypes[seat.kind];
	if (typeof value === 'number' || isUnitModelType(modelType))
		return setRoute(seat.mount, undefined);
	const childShape = opts.factoryShapes?.[seat.kind] ?? 'config';
	if (typeof value === 'string' || modelType === 'pattern' || childShape === 'text') {
		const args = [
			typeof value === 'string' ? value : readNodeText(hydrateForConfig(value as ReadNodeLike, opts), opts)
		];
		out[key] = args;
		return setRoute(seat.mount, args);
	}
	const child = hydrateForConfig(value as ReadNodeLike, opts);
	const inner = childOpts(opts);
	const config = nodeToConfig(child, inner);
	const nested = armRouteOf(config);
	const mount = nested === undefined ? seat.mount : `${seat.mount}.${nested.mount}`;
	const parentShape = opts.factoryShapes?.[parentKind] ?? 'config';
	if (parentShape === 'config' && childShape === 'config') {
		if (seat.seated === true) out[key] = config;
		else Object.assign(out, config);
		return setRoute(mount, undefined);
	}
	const args = factoryArgs(seat.kind, childShape, config, child, inner);
	if (seat.seated === true && nested === undefined) {
		if (args.length !== 1) {
			throw new Error(
				`ir surface: seated arm ${seat.kind} on ${parentKind} takes ${args.length} arguments; a seated arm takes one`
			);
		}
		out[key] = args[0];
	} else {
		out[key] = args;
	}
	setRoute(mount, args);
}

function projectSeatedSlot(
	seat: Seat,
	parentKind: string,
	slot: SlotModel,
	value: unknown,
	opts: NodeToConfigOpts,
	out: Record<string, unknown>
): void {
	const key = slot.key;
	switch (seat.shape) {
		case 'flatten': {
			const groupNode = hydrateForConfig(value as ReadNodeLike, opts);
			const inner = childOpts(opts);
			const group = nodeToConfig(groupNode, inner);
			const nested = armRouteOf(group);
			if (nested !== undefined) {
				throw new Error(
					`ir surface: ${seat.kind}.${nested.mount} is an arm route inside a group flattened on ${parentKind}; the flatten has no spelling for it`
				);
			}
			carryGroupTrivia(groupNode, 'flatten', group, inner);
			Object.assign(out, group);
			const groupShape = opts.factoryShapes?.[seat.kind] ?? 'config';
			const flattened = groupShape === 'config' ? true : factoryArgs(seat.kind, groupShape, group, groupNode, inner);
			Object.defineProperty(out, FLATTENED, { value: flattened, enumerable: false });
			return;
		}
		case 'elements':
			out[key] = projectElements(Array.isArray(value) ? value : value === undefined ? [] : [value], seat, parentKind, slot.name, opts);
			return;
		case 'tuple': {
			const child = hydrateForConfig(value as ReadNodeLike, opts);
			const inner = childOpts(opts);
			const childShape = opts.factoryShapes?.[seat.kind] ?? 'config';
			const args = factoryArgs(seat.kind, childShape, nodeToConfig(child, inner), child, inner);
			carryGroupTrivia(child, 'tuple', args as unknown as Record<string, unknown>, opts);
			out[key] = args;
			if ((opts.factoryShapes?.[parentKind] ?? 'config') !== 'config') {
				Object.defineProperty(out, POSITIONAL, { value: args, enumerable: false });
			}
			return;
		}
		case 'arm':
			projectArmSlot(seat, parentKind, slot, value, opts, out);
			return;
		case 'forwarded':
			assignSlotToConfig(slot, value, memberValueOpts(opts, parentKind, slot.name), out);
			return;
	}
}

function splitRegisteredSlots(
	kind: string,
	config: Record<string, unknown>,
	opts: Pick<NodeToConfigOpts, 'factorySlots' | 'omitOptionDefaults'>
): { readonly base: Record<string, unknown>; readonly registered: Record<string, unknown> | undefined } {
	const slotMeta = opts.factorySlots?.[kind];
	if (slotMeta === undefined) return { base: config, registered: undefined };
	const metaOf = (key: string): FactorySlotMeta | undefined => Object.values(slotMeta).find((meta) => meta.propertyName === key);
	const registeredKeys = Object.keys(config).filter((key) => metaOf(key)?.registered === true);
	if (registeredKeys.length === 0) return { base: config, registered: undefined };
	const base: Record<string, unknown> = { ...config };
	const registered: Record<string, unknown> = {};
	for (const key of registeredKeys) {
		if (opts.omitOptionDefaults !== true || base[key] !== metaOf(key)!.optionDefault) registered[key] = base[key];
		delete base[key];
	}
	return { base, registered: Object.keys(registered).length > 0 ? registered : undefined };
}

function factoryArgs(
	kind: string,
	shape: FactoryShape,
	config: Record<string, unknown>,
	referenceData: ReadNodeLike,
	opts: NodeToConfigOpts
): readonly unknown[] {
	const route = armRouteOf(config);
	if (shape === 'config') {
		const { base, registered } = splitRegisteredSlots(kind, config, opts);
		const listOptions = separatedListFactoryOptions(referenceData);
		const options = {
			...(listOptions?.separator !== undefined && !('separator' in base) ? { separator: listOptions.separator } : {}),
			...(listOptions?.delimiter !== undefined && !('delimiter' in base) ? { delimiter: listOptions.delimiter } : {}),
			...registered
		};
		return Object.keys(options).length > 0 ? [base, options] : [base];
	}
	if (route !== undefined) return route.args ?? [];
	const positional = positionalOf(config);
	if (positional !== undefined) return positional;
	if (shape === 'direct' || shape === 'forwarded') {
		const { base, registered } = splitRegisteredSlots(kind, config, opts);
		const flattened = flattenedOf(config);
		const value =
			flattened === undefined ? directFactoryValue(kind, base, opts.factorySlots, opts.factoryFields) : flattened === true ? base : flattened[0];
		return registered === undefined ? [value] : [value, registered];
	}
	const { base, registered } = splitRegisteredSlots(kind, config, opts);
	const elements = getChildFactoryArgs(kind, base, opts.factorySlots, opts.factoryFields);
	const options = shape === 'elements' ? separatedListFactoryOptions(referenceData) : registered;
	return options !== undefined ? [options, ...elements] : elements;
}

function walkMount(entry: IrEntry, mount: string): IrEntry | undefined {
	let at: IrEntry | undefined = entry;
	for (const segment of mount.split('.')) {
		if (at === undefined) return undefined;
		at = at[segment] as IrEntry | undefined;
	}
	return at;
}

function irStrictFor(
	kind: string,
	config: Record<string, unknown> | undefined,
	opts: NodeToConfigOpts
): ((...args: unknown[]) => unknown) | undefined {
	const entry = opts.surface?.entries[kind];
	if (entry === undefined) return undefined;
	const route = config === undefined ? undefined : armRouteOf(config);
	const target = route === undefined ? entry : walkMount(entry, route.mount);
	const strict = target?.strict;
	if (typeof strict === 'function') return strict;
	if (typeof target === 'function') return target as (...args: unknown[]) => unknown;
	throw new Error(`ir surface: ${kind}${route === undefined ? '' : `.${route.mount}`}.strict is not a function`);
}

function buildWithFactory(
	referenceData: ReadNodeLike,
	kind: string,
	entry: FactoryEntry,
	opts: NodeToConfigOpts
): unknown {
	const shape = opts.factoryShapes?.[kind] ?? 'config';
	if (shape === 'constant') return entry;
	const factory = entry as (...args: unknown[]) => unknown;
	if (shape === 'text') {
		return writeSides(referenceData, (irStrictFor(kind, undefined, opts) ?? factory)(readNodeText(referenceData, opts)), opts);
	}
	const config = nodeToConfig(referenceData, opts);
	const built = (irStrictFor(kind, config, opts) ?? factory)(...factoryArgs(kind, shape, config, referenceData, opts));
	return writeSides(referenceData, built, opts);
}

export function tableSides(source: ReadNodeLike, accessorOf: SlotAccessorOf, build: (read: unknown) => unknown): NodeTrivia | undefined {
	const entries = (side: TriviaSideName): readonly TriviaEntry[] =>
		sideOf(source as object, side).flatMap((entry): TriviaEntry[] => {
			if (!isCoordinate(entry)) return isNode(entry) || typeof entry === 'number' ? [entry] : [];
			const comment = hydrateTriviaEntry(entry);
			const built = build(holdingTreeOf(comment, materialize(comment, accessorOf)));
			if (!isNode(built)) throw new Error(`ir lane: a comment built to ${JSON.stringify(built)}, not a node`);
			return [built];
		});
	const [leading, trailing, inner] = [entries('leading'), entries('trailing'), entries('inner')];
	if (leading.length === 0 && trailing.length === 0 && inner.length === 0) return undefined;
	return { leading, trailing, ...(inner.length > 0 && { inner }) };
}

/** A read node's sides as the call builds them: from its tree's table while it holds one, else the trivia its copy carries. */
function groupSides(source: ReadNodeLike, opts: NodeToConfigOpts): NodeTrivia | undefined {
	const tree = treeOf(source as object);
	const carried = source.$_layout?.trivia;
	if (tree !== undefined) return tableSides(source, opts.accessorOf, (read) => resolveChild(read, { ...childOpts(opts), tree }));
	return carried && (mapTriviaEntries(carried, (entries) => entries.map((entry) => resolveChild(entry, childOpts(opts)))) as NodeTrivia);
}

function writeSides(source: ReadNodeLike, built: unknown, opts: NodeToConfigOpts): unknown {
	if (built === null || typeof built !== 'object') return built;
	const trivia = groupSides(source, opts);
	if (trivia === undefined) return built;
	const record = built as { $_layout?: NodeLayout };
	record.$_layout = { ...record.$_layout, trivia };
	return built;
}

function directFactoryValue(
	kind: string,
	config: unknown,
	factorySlots: NodeToConfigOpts['factorySlots'],
	factoryFields: NodeToConfigOpts['factoryFields']
): unknown {
	const slotNames = Object.keys(factorySlots?.[kind] ?? {});
	const rawName = slotNames.length === 1 ? slotNames[0] : factoryFields?.[kind]?.[0];
	const record = config as Record<string, unknown>;
	if (rawName !== undefined) return record[slotKeyOf(factorySlots, kind, rawName)];
	return getChildFactoryArgs(kind, record, factorySlots, factoryFields)[0];
}

function isIdentifierShapedFieldKey(key: string): boolean {
	return /^[a-zA-Z_][\w]*$/.test(key);
}

function slotOrigin(slot: SlotModel): SlotOrigin {
	return readFacts<{ origin: SlotOrigin }>(slot.metadata).origin;
}

export function slotKeyOf(factorySlots: NodeToConfigOpts['factorySlots'], kind: string, name: string): string {
	const key = factorySlots?.[kind]?.[name]?.propertyName;
	if (key === undefined) throw new Error(`nodeToConfig: ${kind}.${name} has no slot in the node model`);
	return key;
}

function memberValueOpts(
	opts: NodeToConfigOpts,
	parentKind: string | undefined,
	fieldName: string | undefined
): NodeToConfigOpts {
	return {
		...opts,
		_parentKind: parentKind,
		_fieldName: fieldName,
		firstNamedChildKindHint: undefined,
		namedChildKindHints: undefined
	};
}

function resolveMemberValue(value: readonly unknown[] | unknown, childOpts: NodeToConfigOpts): unknown {
	return Array.isArray(value) ? value.map((item) => resolveChild(item, childOpts)) : resolveChild(value, childOpts);
}

function lookupFactorySlotMeta(opts: NodeToConfigOpts, slot: SlotModel): FactorySlotMeta | undefined {
	const parentKind = opts._parentKind;
	return parentKind ? opts.factorySlots?.[parentKind]?.[slot.name] : undefined;
}

function slotModelArityFromMeta(slotMeta: FactorySlotMeta | undefined, unnamed: boolean): 'one' | 'many' {
	if (!slotMeta) return unnamed ? 'many' : 'one';
	return slotMeta.multiple ? 'many' : 'one';
}

function createNamedConfigSlotModel(
	parentKind: string | undefined,
	name: string,
	factorySlots: NodeToConfigOpts['factorySlots']
): SlotModel {
	if (parentKind === undefined) throw new Error(`nodeToConfig: slot ${name} has no parent kind`);
	return createNamedSlotModel(name, slotKeyOf(factorySlots, parentKind, name), slotModelArityFromMeta(factorySlots?.[parentKind]?.[name], false));
}

function hasDeclaredFactorySlot(parentKind: string | undefined, name: string, opts: NodeToConfigOpts): boolean {
	if (!parentKind) return false;
	if (opts.factorySlots?.[parentKind]?.[name] !== undefined) return true;
	return opts.factoryFields?.[parentKind]?.includes(name) ?? false;
}

function shouldNormalizeConfigSlotAsMany(slot: SlotModel, slotMeta: FactorySlotMeta | undefined): boolean {
	return slotModelArityFromMeta(slotMeta, slotOrigin(slot) === 'kind') === 'many';
}

function rawChildKindName(
	value: unknown,
	kindNameFromId: ((id: number) => string | undefined) | undefined
): string | undefined {
	if (value == null || typeof value !== 'object') return undefined;
	const rawType = (value as ReadNodeLike).$type;
	return typeof rawType === 'number' ? kindNameFromId?.(rawType) : undefined;
}

function narrowSingularUnnamedChildrenValue(
	slot: SlotModel,
	value: readonly unknown[] | unknown,
	childOpts: NodeToConfigOpts,
	slotMeta: FactorySlotMeta | undefined
): readonly unknown[] | unknown {
	if (
		slotOrigin(slot) !== 'kind' ||
		slot.name !== 'children' ||
		!slotMeta ||
		slotMeta.multiple
	) {
		return value;
	}
	if (!Array.isArray(value) || value.length <= 1) return value;
	const hintedKind =
		childOpts.namedChildKindHints?.length === 1 ? childOpts.namedChildKindHints[0] : childOpts.firstNamedChildKindHint;
	if (hintedKind) {
		const hinted = value.filter((item) => rawChildKindName(item, childOpts.kindNameFromId) === hintedKind);
		if (hinted.length === 1) return hinted[0]!;
	}
	const named = value.filter(
		(item): item is ReadNodeLike => item != null && typeof item === 'object' && (item as ReadNodeLike).$named !== false
	);
	if (named.length === 1) return named[0];
	return value;
}

function normalizeConfigSlotValue(
	slot: SlotModel,
	value: readonly unknown[] | unknown,
	childOpts: NodeToConfigOpts,
	slotMeta: FactorySlotMeta | undefined
): unknown {
	const narrowed = narrowSingularUnnamedChildrenValue(slot, value, childOpts, slotMeta);
	const resolved = resolveMemberValue(narrowed, childOpts);
	if (shouldNormalizeConfigSlotAsMany(slot, slotMeta)) {
		const items: readonly unknown[] = Array.isArray(resolved) ? resolved : resolved == null ? [] : [resolved];
		if (slotMeta?.nonEmpty && items.length === 0) {
			throw new TypeError(`nodeToConfig: repeated slot ${JSON.stringify(slot.name)} requires at least one value`);
		}
		return items;
	}
	if (Array.isArray(resolved)) {
		if (resolved.length === 0) {
			if (slotMeta?.required) {
				throw new TypeError(`nodeToConfig: singular slot ${JSON.stringify(slot.name)} requires one value`);
			}
			return undefined;
		}
		if (resolved.length !== 1) {
			throw new TypeError(
				`nodeToConfig: singular slot ${JSON.stringify(slot.name)} received ${resolved.length} values`
			);
		}
		return resolved[0];
	}
	if (resolved == null && slotMeta?.required) {
		throw new TypeError(`nodeToConfig: singular slot ${JSON.stringify(slot.name)} requires one value`);
	}
	return resolved;
}

export function getChildFactoryArgs(
	kind: string,
	childConfig: Record<string, unknown>,
	factorySlots: NodeToConfigOpts['factorySlots'],
	factoryFields?: Record<string, readonly string[]>
): readonly unknown[] {
	const declaredField = factoryFields?.[kind]?.[0];
	const childrenValue = childConfig[declaredField ? slotKeyOf(factorySlots, kind, declaredField) : 'children'];
	const childrenMeta = factorySlots?.[kind]?.[declaredField ?? 'children'];
	if (slotModelArityFromMeta(childrenMeta, true) === 'one') {
		return childrenValue == null ? [] : [childrenValue];
	}
	if (Array.isArray(childrenValue)) return childrenValue;
	return childrenValue == null ? [] : [childrenValue];
}

function assignSlotToConfig(
	slot: SlotModel,
	value: readonly unknown[] | unknown,
	childOpts: NodeToConfigOpts,
	out: Record<string, unknown>
): void {
	const normalized = normalizeConfigSlotValue(slot, value, childOpts, lookupFactorySlotMeta(childOpts, slot));
	if (normalized !== undefined) {
		out[slot.key] = normalized;
	}
}

function getMissingDeclaredFields(
	parentKind: string,
	declaredFields: readonly string[],
	factorySlots: NodeToConfigOpts['factorySlots'],
	out: Record<string, unknown>
): string[] {
	return declaredFields.filter((name) => out[slotKeyOf(factorySlots, parentKind, name)] === undefined);
}

function isAnonymousTokenNode(value: unknown): value is ReadNodeLike {
	return value != null && typeof value === 'object' && (value as ReadNodeLike).$named === false;
}

function isOpeningDelimiter(text: string | undefined): boolean {
	return text === '{' || text === '{|' || text === '[' || text === '(' || text === '<';
}

function isClosingDelimiter(text: string | undefined): boolean {
	return text === '}' || text === '|}' || text === ']' || text === ')' || text === '>';
}

function promoteAnonymousTokenFields(
	declaredFields: readonly string[] | undefined,
	namedSlotEntries: readonly [string, unknown][],
	opts: NodeToConfigOpts,
	parentKind: string | undefined,
	out: Record<string, unknown>
): void {
	if (!declaredFields || !parentKind) return;
	const missing = new Set(getMissingDeclaredFields(parentKind, declaredFields, opts.factorySlots, out));
	if (missing.size === 0) return;
	const anonymousEntries = namedSlotEntries.filter(
		([key, value]) => !isIdentifierShapedFieldKey(key) && isAnonymousTokenNode(value)
	);
	const used = new Set<number>();
	const assign = (fieldName: string, entryIndex: number): void => {
		const entry = anonymousEntries[entryIndex]?.[1];
		if (!entry) return;
		assignSlotToConfig(
			createNamedSlotModel(fieldName, slotKeyOf(opts.factorySlots, parentKind, fieldName), 'one'),
			entry,
			memberValueOpts(opts, parentKind, fieldName),
			out
		);
		missing.delete(fieldName);
		used.add(entryIndex);
	};

	if (missing.has('semicolon')) {
		const semicolonIndex = anonymousEntries.findIndex(([, value]) => nodeText(value) === ';');
		if (semicolonIndex >= 0) assign('semicolon', semicolonIndex);
	}
	if (missing.has('opening')) {
		const openingIndex = anonymousEntries.findIndex(
			([, value], index) => !used.has(index) && isOpeningDelimiter(nodeText(value))
		);
		if (openingIndex >= 0) assign('opening', openingIndex);
	}
	if (missing.has('closing')) {
		const closingIndex = anonymousEntries.findLastIndex(
			([, value], index) => !used.has(index) && isClosingDelimiter(nodeText(value))
		);
		if (closingIndex >= 0) assign('closing', closingIndex);
	}
}

export function nodeToConfig(data: ReadNodeLike, opts: NodeToConfigOpts): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	const rec = data as unknown as Record<string, unknown>;
	const interior = opts.shownKind === undefined ? undefined : opts.interiorOf?.(opts.shownKind);
	const text = nodeText(data);
	const unprojected =
		interior !== undefined &&
		text !== undefined &&
		!interior.slots.some((slot) => rec[`_${slot.name}`] !== undefined);
	const parentKind = unprojected
		? opts.shownKind
		: data.$type !== undefined
			? (opts.kindNameFromId?.(data.$type) ?? String(data.$type))
			: undefined;
	const namedSlotEntries: [string, unknown][] = [];
	for (const key of Object.keys(rec)) {
		if (key.startsWith('_')) {
			namedSlotEntries.push([key.slice(1), rec[key]]);
		}
	}
	if (unprojected) {
		for (const [name, value] of Object.entries(projectInterior(text!, interior, opts.shownKind!))) {
			if (value !== undefined && value !== false) namedSlotEntries.push([name, value]);
		}
	}
	for (const [k, v] of namedSlotEntries) {
		if (v === undefined) continue;
		if (!isIdentifierShapedFieldKey(k)) continue;
		if (!hasDeclaredFactorySlot(parentKind, k, opts)) continue;
		const slot = createNamedConfigSlotModel(parentKind, k, opts.factorySlots);
		const seat = seatForSlotValue(parentKind, k, v, opts);
		if (seat !== undefined && parentKind !== undefined) {
			projectSeatedSlot(seat, parentKind, slot, v, opts, out);
			continue;
		}
		assignSlotToConfig(slot, v, memberValueOpts(opts, parentKind, k), out);
	}
	promoteAnonymousTokenFields(
		parentKind ? opts.factoryFields?.[parentKind] : undefined,
		namedSlotEntries,
		opts,
		parentKind,
		out
	);
	return out;
}

export function emitValidatorMetrics(): void {
	if (!metricsEnabled) return;
	const backend: 'ts' | 'native' = process.env.SITTIR_BACKEND === 'native' ? 'native' : 'ts';
	dumpMetrics(backend);
}

export function dedupeMismatchesByContainment<T extends { entry?: string; start: number; end: number }>(
	mismatches: readonly T[]
): T[] {
	return mismatches.filter(
		(m, i) =>
			!mismatches.some(
				(n, j) =>
					j !== i && n.entry === m.entry && n.start >= m.start && n.end <= m.end && (n.start > m.start || n.end < m.end)
			)
	);
}

export function separatedListFactoryOptions(data: unknown): { separator?: number; delimiter?: number } | undefined {
	const rec = (data ?? {}) as Record<string, unknown>;
	const delimiter = typeof rec['_delimiter'] === 'number' ? rec['_delimiter'] : undefined;
	const separator = typeof rec['_separator'] === 'number' ? rec['_separator'] : undefined;
	const options: { separator?: number; delimiter?: number } = {};
	if (separator !== undefined) options.separator = separator;
	if (delimiter !== undefined) options.delimiter = delimiter;
	return Object.keys(options).length > 0 ? options : undefined;
}

export interface FactoryDispatchArtifacts {
	readonly factoryMap: Record<string, FactoryEntry>;
	readonly factoryShapes: Record<string, FactoryShape>;
	readonly fieldAliasMap: Record<string, Record<string, string>>;
	readonly factoryFields: Record<string, readonly string[]>;
	readonly factorySlots: Record<string, Record<string, FactorySlotMeta>>;
	readonly surface?: IrSurface;
	readonly omitOptionDefaults?: boolean;
}

export interface FactoryDispatchOpts {
	readonly cstNodeKindHint?: string;
	readonly firstNamedChildKindHint?: string;
	readonly namedChildKindHints?: readonly string[];
	readonly kindNameFromId?: (id: number) => string | undefined;
	readonly accessorOf: SlotAccessorOf;
	readonly tree?: TreeHandle;
	readonly hydrate?: Hydrate;
	readonly placeText?: boolean;
}

export function buildFactoryNodeFromReference(
	referenceData: ReadNodeLike,
	kind: string,
	artifacts: FactoryDispatchArtifacts,
	opts: FactoryDispatchOpts
): unknown | null {
	const { factoryMap, factoryShapes, fieldAliasMap, factoryFields, factorySlots, surface, omitOptionDefaults } =
		artifacts;
	const factory = factoryMap[kind];
	if (!factory) return null;
	const configOpts = {
		factoryMap,
		factoryShapes,
		fieldAliasMap,
		factoryFields,
		factorySlots,
		surface,
		omitOptionDefaults,
		cstNodeKindHint: opts.cstNodeKindHint,
		firstNamedChildKindHint: opts.firstNamedChildKindHint,
		namedChildKindHints: opts.namedChildKindHints,
		kindNameFromId: opts.kindNameFromId,
		accessorOf: opts.accessorOf,
		tree: opts.tree,
		hydrate: opts.hydrate,
		placeText: opts.placeText
	} as NodeToConfigOpts;
	return buildWithFactory(referenceData, kind, factory, configOpts);
}
