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
	sliceSpan,
	type HostOptions,
	type HostedText,
	type ReparseHosts
} from '@sittir/common';
import { hydrateTriviaEntry, inEngine, type EngineHandle } from '@sittir/common/utils';
import {
	carryRead,
	carrySource,
	holdTree,
	readDerivedSides,
	readTrivia,
	spanOf,
	treeTokenOf,
	type TriviaView
} from '@sittir/common/utils';
import {
	isCoordinate,
	readNode,
	metricsEnabled,
	mapTriviaEntries,
	projectInterior,
	storedSlotReader,
	isDataKey,
	type TokenInterior
} from '@sittir/common/utils';
import type * as TS from 'web-tree-sitter';

import type { AnyUntypedNode, Engine, LanguageAPI, NodeLayout, NodeTrivia, ParseOptions, TransportCoordinate } from '@sittir/types';
import type { TriviaSides } from '@sittir/common';
import type { TreeHandle } from '@sittir/common/utils';
import { load } from '../codegen-surface.ts';
import { languageByName } from '../languages.ts';
import {
	grammarModulePath,
	importGrammarModule,
	type FactoryEntry,
	type GrammarModules,
	type Hydrate
} from '../grammar-internals.ts';
import { grammarPackageDir, grammarRequire, isGrammar, upstreamPackage } from '@sittir/codegen/grammars';
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
const { pluralize, snakeToCamel } = await load('modelNodeMap');

type SlotArity = 'one' | 'many';
type SlotOrigin = 'field' | 'kind';
interface SlotModel {
	readonly name: string;
	readonly storageKey: string;
	readonly arity: SlotArity;
	readonly metadata: OpaqueFacts;
}
function createNamedSlotModel(name: string, arity: SlotArity): SlotModel {
	return { name, storageKey: `_${name}`, arity, metadata: opaqueFacts({ origin: 'field' satisfies SlotOrigin }) };
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

export function triviaViewOf(engine: NativeEngine): TriviaView {
	return {
		trivia: (node) => readTrivia(node, engine.diagnostics.lineGapsOf),
		derived: (node) => readDerivedSides(node, engine.diagnostics.lineGapsOf),
		isWrapper: (kindId) => engine.trivia.rebuildWrappers.has(kindId),
		isList: (kindId) => engine.trivia.listKinds.has(kindId)
	};
}

const cachedNativeEngines = new Map<
	string,
	{ engine: Promise<NativeEngine>; binaryMtimeMs: number; profile?: string | undefined }
>();

async function createNativeEngine(grammar: string): Promise<NativeEngine> {
	const engine = await createEngine(await languageByName(grammar));
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

/** Where a native search found a node: its coordinate when it has one, and the transport as the whole-tree read holds it, or neither for the root. */
export interface NativeNodeCoords {
	coordinate?: TransportCoordinate;
	embeddedData?: AnyUntypedNode;
}

/** The node a native search found, read one level down. */
export function readNativeAt(handle: TreeHandle, coords: NativeNodeCoords): AnyUntypedNode {
	if (coords.embeddedData !== undefined) return coords.embeddedData;
	if (handle.read === undefined) throw new Error('readNativeAt: the tree has no native read');
	return (coords.coordinate === undefined ? handle.read(0) : readNode(handle, coords.coordinate)) as AnyUntypedNode;
}

function storedChildren(d: AnyUntypedNode): readonly AnyUntypedNode[] {
	const out: AnyUntypedNode[] = [];
	for (const [key, value] of Object.entries(d)) {
		if (!key.startsWith('_')) continue;
		for (const entry of Array.isArray(value) ? value : [value]) {
			if (entry !== null && typeof entry === 'object' && '$type' in entry) out.push(entry as AnyUntypedNode);
		}
	}
	return out;
}

function storedTriviaEntries(d: AnyUntypedNode): readonly AnyUntypedNode[] {
	const trivia = d.$_layout?.trivia;
	if (trivia === undefined) return [];
	return [trivia.leading, trivia.trailing, ...Object.values(trivia.inner ?? {})].flatMap((entries) => (entries ?? []) as AnyUntypedNode[]);
}

function coordsOf(d: AnyUntypedNode): NativeNodeCoords {
	if (isCoordinate(d)) return { coordinate: d };
	const at = d.$_layout?.at;
	return at === undefined ? { embeddedData: d } : { coordinate: at, embeddedData: d };
}

export function nativeNodeIsKind(
	d: AnyUntypedNode,
	kind: string,
	kindNameFromId: ((id: number) => string | undefined) | undefined
): boolean {
	return (typeof d.$type === 'number' ? (kindNameFromId?.(d.$type) ?? String(d.$type)) : d.$type) === kind;
}

/** Every node of `kind` in the tree, in document order, each with where it was found and its span. */
export function walkNativeForKind(
	handle: TreeHandle,
	kind: string,
	kindNameFromId?: (id: number) => string | undefined
): NativeCandidateCoords[] {
	if (handle.read === undefined) return [];
	const results: NativeCandidateCoords[] = [];
	const visit = (d: AnyUntypedNode, coords: NativeNodeCoords): void => {
		if (nativeNodeIsKind(d, kind, kindNameFromId)) results.push({ coords, span: spanOf(d) });
		const node = isCoordinate(d) ? (readNode(handle, d, Infinity) as AnyUntypedNode) : d;
		for (const entry of storedTriviaEntries(node)) visit(entry, coordsOf(entry));
		for (const child of storedChildren(node)) visit(child, coordsOf(child));
	};
	visit(handle.read(0, Infinity) as AnyUntypedNode, {});
	return results;
}

/** The first node of `kind` (at `span` when given), or null. */
export function findNativeNodeId(
	handle: TreeHandle,
	kind: string,
	kindNameFromId?: (id: number) => string | undefined,
	span?: { readonly start: number; readonly end: number }
): NativeNodeCoords | null {
	const found = walkNativeForKind(handle, kind, kindNameFromId).find(
		(candidate) => span === undefined || (candidate.span?.start === span.start && candidate.span?.end === span.end)
	);
	return found?.coords ?? null;
}

export interface NativeCandidateCoords {
	coords: NativeNodeCoords;
	span: { start: number; end: number } | undefined;
}

export function findFirst(node: TS.Node, kind: string): TS.Node | null {
	if (node.type === kind && node.isNamed) return node;
	for (const child of node.children) {
		const found = findFirst(child, kind);
		if (found) return found;
	}
	return null;
}

export function collectKinds(node: TS.Node): Set<string> {
	const kinds = new Set<string>();

	function walk(n: TS.Node) {
		if (n.isNamed) kinds.add(n.type);
		for (const child of n.children) walk(child);
	}
	walk(node);
	return kinds;
}

export function buildKindToSupertypes(
	rawEntries: { type: string; named: boolean; subtypes?: { type: string }[] }[]
): Map<string, string[]> {
	const result = new Map<string, string[]>();
	for (const entry of rawEntries) {
		if (!entry.subtypes) continue;
		for (const sub of entry.subtypes) {
			const existing = result.get(sub.type) ?? [];
			existing.push(entry.type);
			result.set(sub.type, existing);
		}
	}
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
	return template === undefined ? null : applyHost(template, rendered);
}

export function upstreamWasmPath(grammar: string): string | undefined {
	if (!isGrammar(grammar)) return undefined;
	const upstream = upstreamPackage(grammar);
	try {
		return grammarRequire(grammar).resolve(`${upstream}/${upstream}.wasm`);
	} catch {
		return undefined;
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
): Promise<((tree: TreeHandle, coordinate?: TransportCoordinate, depth?: number) => unknown) | null> {
	const [wrapNode, hydrate] = await Promise.all([wrapExportOf(grammar, 'wrapNode'), wrapExportOf(grammar, 'hydrate')]);
	if (wrapNode === null || hydrate === null) return null;
	return (tree, coordinate, depth) => {
		if (coordinate !== undefined) return hydrate(coordinate, tree, depth);
		if (tree.read === undefined) throw new Error('readNodeOf: the tree has no native read');
		return wrapNode(tree.read(0, depth), tree);
	};
}

export function loadWrapNode(grammar: string): Promise<((data: AnyUntypedNode, tree: TreeHandle) => unknown) | null> {
	return wrapExportOf(grammar, 'wrapNode');
}

export function hydrateOf(grammar: string): Promise<Hydrate | null> {
	return wrapExportOf(grammar, 'hydrate');
}

export interface Seat {
	readonly kind: string;
	readonly shape: 'arm' | 'flatten' | 'elements' | 'tuple';
	readonly mount?: string;
	readonly seated?: true;
}

export type SeatTable = Record<string, Record<string, Record<string, Seat>>>;

export interface LoadedNodeModel {
	readonly root: string | undefined;
	readonly irKeys: Record<string, string>;
	readonly modelTypes: Record<string, string>;
	readonly leafPatterns: Record<string, RegExp>;
	readonly hoistedKinds: ReadonlySet<string>;
	readonly oneSurfaceKinds: ReadonlySet<string>;
	readonly seats: SeatTable;
	readonly slotKinds: Record<string, Record<string, readonly string[]>>;
	readonly slotStorage: Record<string, Record<string, string>>;
	readonly factoryShapes: Record<string, FactoryShape>;
	readonly factoryFields: Record<string, readonly string[]>;
	readonly factorySlots: Record<string, Record<string, FactorySlotMeta>>;
	readonly fieldAliasMap: Record<string, Record<string, string>>;
	readonly polymorphVariants: PolymorphVariantMap;
	readonly variantRoutes: Readonly<Record<string, string>>;
	readonly subtypes: Record<string, readonly string[]>;
	readonly slotRequired: Record<string, Record<string, boolean>>;
	readonly slotMultiple: Record<string, Record<string, boolean>>;
	readonly slotDefaults: Record<string, Record<string, string>>;
	readonly bareAccepts: Record<string, readonly string[]>;
	readonly textLeavesThrough: Record<string, readonly string[]>;
	readonly forwardsTo: Record<string, string>;
	readonly listDefaults: Record<string, string>;
	readonly listElementKinds: Record<string, readonly string[]>;
	readonly fullForms: Record<string, ModelFullForm>;
	readonly innerGapsKeyed: boolean;
}

export interface ModelFullForm {
	readonly open: { readonly texts: readonly string[] };
	readonly close: { readonly texts: readonly string[] };
}

interface ParsedNodeModel {
	root?: string | null;
	nodes?: ReadonlyArray<{
		kind: string;
		irKey?: string;
		modelType?: string;
		seated?: true;
		slots?: ReadonlyArray<{
			name: string;
			propertyName: string;
			required?: boolean;
			multiple?: boolean;
			kinds?: readonly string[];
			storage?: string;
			values?: ReadonlyArray<{ seat?: Seat; name?: string; default?: true }>;
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
		leafPattern?: string;
		fullForm?: ModelFullForm;
	}>;
	innerGapsKeyed?: boolean;
	factorySlots?: Record<string, Record<string, FactorySlotMeta>>;
	fieldAliasMap?: Record<string, Record<string, string>>;
	polymorphVariants?: PolymorphVariantMap;
	variantRoutes?: Record<string, string>;
}

const EMPTY_NODE_MODEL: LoadedNodeModel = {
	root: undefined,
	irKeys: {},
	modelTypes: {},
	leafPatterns: {},
	hoistedKinds: new Set(),
	oneSurfaceKinds: new Set(),
	seats: {},
	slotKinds: {},
	slotStorage: {},
	factoryShapes: {},
	factoryFields: {},
	factorySlots: {},
	fieldAliasMap: {},
	polymorphVariants: {},
	variantRoutes: {},
	subtypes: {},
	slotRequired: {},
	slotMultiple: {},
	slotDefaults: {},
	bareAccepts: {},
	textLeavesThrough: {},
	forwardsTo: {},
	listDefaults: {},
	listElementKinds: {},
	fullForms: {},
	innerGapsKeyed: false
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
	if (raw === undefined) return EMPTY_NODE_MODEL;
	const model = JSON.parse(raw) as ParsedNodeModel;
	const irKeys: Record<string, string> = {};
	const modelTypes: Record<string, string> = {};
	const leafPatterns: Record<string, RegExp> = {};
	const hoistedKinds = new Set<string>();
	const oneSurfaceKinds = new Set<string>();
	const seats: SeatTable = {};
	const seatAt = (kind: string, slot: string, seat: Seat): void => {
		((seats[kind] ??= {})[slot] ??= {})[seat.kind] = seat;
	};
	const slotKinds: Record<string, Record<string, readonly string[]>> = {};
	const slotStorage: Record<string, Record<string, string>> = {};
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
	const fullForms: Record<string, ModelFullForm> = {};
	for (const node of model.nodes ?? []) {
		if (node.irKey !== undefined) irKeys[node.kind] = node.irKey;
		if (node.modelType !== undefined) modelTypes[node.kind] = node.modelType;
		if (node.leafPattern !== undefined) leafPatterns[node.kind] = regexOfLiteral(node.leafPattern);
		if (node.seated === true) hoistedKinds.add(node.kind);
		if (node.oneSurface === true) oneSurfaceKinds.add(node.kind);
		for (const seat of node.elementSeats ?? []) seatAt(node.kind, '*', seat);
		if (node.slots !== undefined) {
			for (const slot of node.slots) {
				for (const value of slot.values ?? []) {
					if (value.seat !== undefined) seatAt(node.kind, slot.name, value.seat);
					if (value.default === true && value.name !== undefined) {
						(slotDefaults[node.kind] ??= {})[snakeToCamel(slot.name)] = value.name;
					}
				}
			}
			slotKinds[node.kind] = Object.fromEntries(node.slots.map((slot) => [snakeToCamel(slot.name), slot.kinds ?? []]));
			slotRequired[node.kind] = Object.fromEntries(
				node.slots.map((slot) => [snakeToCamel(slot.name), slot.required === true])
			);
			slotMultiple[node.kind] = Object.fromEntries(
				node.slots.map((slot) => [snakeToCamel(slot.name), slot.multiple === true])
			);
			slotStorage[node.kind] = Object.fromEntries(
				node.slots.flatMap((slot) => (slot.storage === undefined ? [] : [[snakeToCamel(slot.name), slot.storage]]))
			);
		}
		if (node.factoryShape !== undefined) factoryShapes[node.kind] = node.factoryShape;
		if (node.factoryFields !== undefined) factoryFields[node.kind] = node.factoryFields;
		if (node.subtypes !== undefined) subtypes[node.kind] = node.subtypes;
		if (node.bareAccepts !== undefined) bareAccepts[node.kind] = node.bareAccepts;
		if (node.textLeavesThrough !== undefined) textLeavesThrough[node.kind] = node.textLeavesThrough;
		if (node.forwardsTo !== undefined) forwardsTo[node.kind] = node.forwardsTo;
		if (node.defaultDelimiter !== undefined) listDefaults[node.kind] = node.defaultDelimiter;
		if (node.elementKinds !== undefined) listElementKinds[node.kind] = node.elementKinds;
		if (node.fullForm !== undefined) fullForms[node.kind] = node.fullForm;
	}
	return {
		root: model.root ?? undefined,
		irKeys,
		modelTypes,
		leafPatterns,
		hoistedKinds,
		oneSurfaceKinds,
		seats,
		slotKinds,
		slotStorage,
		factoryShapes,
		factoryFields,
		factorySlots: model.factorySlots ?? {},
		fieldAliasMap: model.fieldAliasMap ?? {},
		polymorphVariants: model.polymorphVariants ?? {},
		variantRoutes: model.variantRoutes ?? {},
		subtypes,
		slotRequired,
		slotMultiple,
		slotDefaults,
		bareAccepts,
		textLeavesThrough,
		forwardsTo,
		listDefaults,
		listElementKinds,
		fullForms,
		innerGapsKeyed: model.innerGapsKeyed === true
	};
}

export function walkWrappedTree(
	root: unknown,
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
		for (const k of Object.keys(w)) {
			if (!k.startsWith('_')) continue;
			const v = resolveWrappedStorageValue(w, k, onAccessorThrow);
			if (hasNumericType(v)) recurse(v);
			else if (Array.isArray(v)) for (const x of v) if (hasNumericType(x)) recurse(x);
		}
	};
	recurse(root);
}

export function materialize(root: unknown, onAccessorThrow?: (rec: AccessorThrowRecord) => void): AnyUntypedNode {
	return materializeValue(root, onAccessorThrow) as AnyUntypedNode;
}

export function materializeDetached(
	root: unknown,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): AnyUntypedNode {
	return holdingTreeOf(root, detachCoordinates(materialize(root, onAccessorThrow)));
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

function materializeValue(value: unknown, onAccessorThrow?: (rec: AccessorThrowRecord) => void): unknown {
	if (Array.isArray(value)) {
		return value.map((entry) => materializeValue(entry, onAccessorThrow));
	}
	if (!hasNumericType(value)) return value;
	const materialized: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		if (!isDataKey(key)) continue;
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
								entries.map((entry) => materializeValue(hydrateTriviaEntry(entry), onAccessorThrow))
							)
						};
			continue;
		}
		if (key.startsWith('_')) {
			const resolved = resolveWrappedStorageValue(value, key, onAccessorThrow);
			if (resolved === undefined) continue;
			materialized[key] = materializeValue(resolved, onAccessorThrow);
			continue;
		}
		materialized[key] = materializeValue(raw, onAccessorThrow);
	}
	carrySource(value, materialized);
	return carryRead(value, materialized);
}

function resolveWrappedStorageValue(
	node: TypedNode,
	storageKey: string,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): unknown {
	if (!storageKey.startsWith('_')) return node[storageKey];
	for (const accessorName of accessorCandidatesForStorageKey(storageKey)) {
		const accessor = storedSlotReader(node, accessorName);
		if (typeof accessor === 'function' && accessor.length === 0) {
			try {
				return (accessor as () => unknown).call(node);
			} catch (e) {
				const message = (e as Error).message;
				const type = (node as any).$type;
				process.stderr.write(
					`[accessor-throw] key=${storageKey} accessor=${accessorName} type=${type} err=${message}\n`
				);
				onAccessorThrow?.({ key: storageKey, accessor: accessorName, type, message });
				return node[storageKey];
			}
		}
	}
	return node[storageKey];
}

export function accessorCandidatesForStorageKey(storageKey: string): readonly string[] {
	if (!storageKey.startsWith('_')) return [];
	const base = snakeToCamel(storageKey.slice(1));
	const plural = pluralize(base);
	return plural === base ? [base] : [base, plural];
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
	readonly scope?: EngineHandle;
}

const factoryScopes = new Map<string, Promise<EngineHandle>>();

export function factoryScope(grammar: string): Promise<EngineHandle> {
	let scope = factoryScopes.get(grammar);
	if (scope === undefined) {
		scope = loadNativeEngine(grammar).then((engine) => ({ current: engine }));
		factoryScopes.set(grammar, scope);
	}
	return scope;
}

export function scopedBuilders<T extends object>(value: T, scope: EngineHandle): T {
	return new Proxy(value, {
		apply: (target, self, args) =>
			inEngine(scope, () => Reflect.apply(target as unknown as (...a: unknown[]) => unknown, self, args)),
		get: (target, key, receiver) => {
			const member = Reflect.get(target, key, receiver);
			return typeof member === 'function' || (typeof member === 'object' && member !== null && key !== 'prototype')
				? scopedBuilders(member, scope)
				: member;
		}
	});
}

export async function loadScopedFactoryMap<T extends Record<string, unknown>>(grammar: string, map: T): Promise<T> {
	return scopedBuilders(map, await factoryScope(grammar));
}

export async function loadIrSurface(grammar: string): Promise<IrSurface | undefined> {
	const mod = await importGrammarModule(grammar, 'ir.ts');
	if (mod?.ir === undefined) return undefined;
	const model = await loadNodeModel(grammar);
	const entries: Record<string, IrEntry> = {};
	const scope = await factoryScope(grammar);
	for (const [kind, irKey] of Object.entries(model.irKeys)) {
		const entry = mod.ir[irKey];
		if (entry !== null && (typeof entry === 'object' || typeof entry === 'function')) entries[kind] = entry as IrEntry;
	}
	return { entries, seats: model.seats, modelTypes: model.modelTypes, scope };
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
		const modelType = name === undefined ? undefined : modelTypes[name];
		return modelType === 'pattern' || modelType === 'enum' || isUnitModelType(modelType);
	};
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
	readonly $type?: string | number;
	readonly $text?: string;
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
	const rawTypeId = hydrated.$type ?? c.$type;
	const rawKind =
		rawTypeId !== undefined
			? typeof rawTypeId === 'number'
				? (opts.kindNameFromId?.(rawTypeId) ?? String(rawTypeId))
				: rawTypeId
			: undefined;
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
	if (typeof node.$text === 'string') return node.$text;
	const source = opts.tree?.source;
	const span = spanOf(node);
	return span !== undefined && source !== undefined ? sliceSpan(source, span) : '';
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
		const config = carryElementTrivia(element, nodeToConfig(element, childOpts(opts)), opts);
		return withSeatKind(config, seat.kind);
	});
}

function carryElementTrivia(
	element: ReadNodeLike,
	config: Record<string, unknown>,
	opts: NodeToConfigOpts
): Record<string, unknown> {
	if (element.$_layout?.trivia === undefined) return config;
	const built = Object.values(config).filter((v) => v !== null && typeof v === 'object' && !Array.isArray(v));
	if (built.length === 1) carryTrivia(element, built[0], opts);
	return config;
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
	const key = slotConfigKey(slot);
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
	const key = slotConfigKey(slot);
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
			out[key] = args;
			if ((opts.factoryShapes?.[parentKind] ?? 'config') !== 'config') {
				Object.defineProperty(out, POSITIONAL, { value: args, enumerable: false });
			}
			return;
		}
		case 'arm':
			projectArmSlot(seat, parentKind, slot, value, opts, out);
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
	const registeredKeys = Object.keys(config).filter((key) => slotMeta[key]?.registered === true);
	if (registeredKeys.length === 0) return { base: config, registered: undefined };
	const base: Record<string, unknown> = { ...config };
	const registered: Record<string, unknown> = {};
	for (const key of registeredKeys) {
		if (opts.omitOptionDefaults !== true || base[key] !== slotMeta[key]!.optionDefault) registered[key] = base[key];
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
		return carryTrivia(
			referenceData,
			(irStrictFor(kind, undefined, opts) ?? factory)(readNodeText(referenceData, opts)),
			opts
		);
	}
	const config = nodeToConfig(referenceData, opts);
	const built = (irStrictFor(kind, config, opts) ?? factory)(...factoryArgs(kind, shape, config, referenceData, opts));
	return carryTrivia(referenceData, built, opts);
}

function carryTrivia(source: ReadNodeLike, built: unknown, opts: NodeToConfigOpts): unknown {
	const trivia = source.$_layout?.trivia;
	if (trivia === undefined || built === null || typeof built !== 'object') return built;
	const record = built as { $_layout?: NodeLayout };
	record.$_layout = {
		...record.$_layout,
		trivia: mapTriviaEntries(trivia as TriviaSides<unknown>, (entries) => entries.map((entry) => resolveChild(entry, childOpts(opts)))) as NodeTrivia
	};
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
	const camelName = rawName?.replace(/_([a-z])/g, (_m: string, c: string) => c.toUpperCase());
	const record = config as Record<string, unknown>;
	if (camelName !== undefined) return record[camelName];
	return getChildFactoryArgs(kind, record, factorySlots, factoryFields)[0];
}

function isIdentifierShapedFieldKey(key: string): boolean {
	return /^[a-zA-Z_][\w]*$/.test(key);
}

function slotOrigin(slot: SlotModel): SlotOrigin {
	return readFacts<{ origin: SlotOrigin }>(slot.metadata).origin;
}

function slotConfigKey(slot: SlotModel): string {
	return slotOrigin(slot) === 'kind' ? slot.name : snakeToCamel(slot.name);
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
	if (unnamed && slotMeta.slotCount > 1) return 'many';
	return slotMeta.multiple ? 'many' : 'one';
}

function createNamedConfigSlotModel(
	parentKind: string | undefined,
	name: string,
	factorySlots: NodeToConfigOpts['factorySlots']
): SlotModel {
	const slotMeta = parentKind ? factorySlots?.[parentKind]?.[name] : undefined;
	return createNamedSlotModel(name, slotModelArityFromMeta(slotMeta, false));
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
	if (typeof rawType === 'string') return rawType;
	if (typeof rawType === 'number') return kindNameFromId?.(rawType);
	return undefined;
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
		slotMeta.multiple ||
		slotMeta.slotCount !== 1
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
	const configKey = declaredField ? snakeToCamel(declaredField) : 'children';
	const childrenValue = childConfig[configKey];
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
		out[slotConfigKey(slot)] = normalized;
	}
}

function getMissingDeclaredFields(
	declaredFields: readonly string[] | undefined,
	out: Record<string, unknown>
): string[] {
	if (!declaredFields) return [];
	return declaredFields.filter((name) => {
		const camel = snakeToCamel(name);
		return out[camel] === undefined;
	});
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
	const missing = new Set(getMissingDeclaredFields(declaredFields, out));
	if (missing.size === 0) return;
	const anonymousEntries = namedSlotEntries.filter(
		([key, value]) => !isIdentifierShapedFieldKey(key) && isAnonymousTokenNode(value)
	);
	const used = new Set<number>();
	const assign = (fieldName: string, entryIndex: number): void => {
		const entry = anonymousEntries[entryIndex]?.[1];
		if (!entry) return;
		assignSlotToConfig(
			createNamedSlotModel(fieldName, 'one'),
			entry,
			memberValueOpts(opts, parentKind, fieldName),
			out
		);
		missing.delete(fieldName);
		used.add(entryIndex);
	};

	if (missing.has('semicolon')) {
		const semicolonIndex = anonymousEntries.findIndex(([, value]) => (value as ReadNodeLike).$text === ';');
		if (semicolonIndex >= 0) assign('semicolon', semicolonIndex);
	}
	if (missing.has('opening')) {
		const openingIndex = anonymousEntries.findIndex(
			([, value], index) => !used.has(index) && isOpeningDelimiter((value as ReadNodeLike).$text)
		);
		if (openingIndex >= 0) assign('opening', openingIndex);
	}
	if (missing.has('closing')) {
		const closingIndex = anonymousEntries.findLastIndex(
			([, value], index) => !used.has(index) && isClosingDelimiter((value as ReadNodeLike).$text)
		);
		if (closingIndex >= 0) assign('closing', closingIndex);
	}
}

export function nodeToConfig(data: ReadNodeLike, opts: NodeToConfigOpts = {}): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	const rec = data as unknown as Record<string, unknown>;
	const interior = opts.shownKind === undefined ? undefined : opts.interiorOf?.(opts.shownKind);
	const unprojected =
		interior !== undefined &&
		typeof data.$text === 'string' &&
		!interior.slots.some((slot) => rec[`_${slot.name}`] !== undefined);
	const parentKind = unprojected
		? opts.shownKind
		: data.$type !== undefined
			? typeof data.$type === 'number'
				? (opts.kindNameFromId?.(data.$type) ?? String(data.$type))
				: data.$type
			: undefined;
	const namedSlotEntries: [string, unknown][] = [];
	for (const key of Object.keys(rec)) {
		if (key.startsWith('_')) {
			namedSlotEntries.push([key.slice(1), rec[key]]);
		}
	}
	if (unprojected) {
		for (const [name, value] of Object.entries(projectInterior(data.$text as string, interior, opts.shownKind!))) {
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
	readonly tree?: unknown;
	readonly hydrate?: Hydrate;
}

export function buildFactoryNodeFromReference(
	referenceData: ReadNodeLike,
	kind: string,
	artifacts: FactoryDispatchArtifacts,
	opts: FactoryDispatchOpts = {}
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
		tree: opts.tree,
		hydrate: opts.hydrate
	} as NodeToConfigOpts;
	const build = () => buildWithFactory(referenceData, kind, factory, configOpts);
	return surface?.scope === undefined ? build() : inEngine(surface.scope, build);
}
