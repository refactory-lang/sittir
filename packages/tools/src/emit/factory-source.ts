import {
	buildFactoryNodeFromReference,
	type FactoryDispatchArtifacts,
	type FactoryDispatchOpts,
	type IrEntry,
	type IrSurface,
	type Seat,
	type SeatTable
} from '../validate/common.ts';
import type { FactoryShape } from '../codegen-surface.ts';

export interface PrintContext {
	readonly grammar: string;
	readonly kindNameFromId: (id: number) => string | undefined;
	readonly memberNameOfId: (id: number) => string | undefined;
	readonly irPathOfKind: (kind: string) => string;
	readonly delimiterArmOfId: (id: number) => string | undefined;
	readonly seats?: SeatTable;
	readonly unboundKinds?: ReadonlySet<string>;
	readonly slotKinds?: Record<string, Record<string, readonly string[]>>;
	readonly textLeafKinds?: ReadonlySet<string>;
	readonly enumKinds?: ReadonlySet<string>;
	readonly keywordKinds?: ReadonlySet<string>;
	readonly slotStorage?: Record<string, Record<string, string>>;
	readonly memberIdOfText?: (text: string) => number | undefined;
	readonly triviaByHandle?: ReadonlyMap<number, NodeTrivia>;
}

export interface NodeTrivia {
	readonly leading: readonly string[];
	readonly trailing: readonly string[];
}

export class Printed {
	readonly $named = true as const;
	constructor(
		readonly $type: number | string,
		readonly source: string,
		readonly kind?: string,
		readonly handle?: number,
		readonly argsSource?: string
	) {}
}

export interface ReadNodeLike {
	readonly $type?: string | number;
	readonly $text?: string;
	readonly $nodeHandle?: number;
	readonly $triviaData?: { leading?: readonly unknown[]; trailing?: readonly unknown[] };
}

const INDENT = '\t';

function pad(depth: number): string {
	return INDENT.repeat(depth);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Printed);
}

function triviaSuffix(trivia: NodeTrivia | undefined, ctx: PrintContext): string {
	if (trivia === undefined || (trivia.leading.length === 0 && trivia.trailing.length === 0)) return '';
	const parts: string[] = [];
	if (trivia.leading.length > 0) parts.push(`leading: ${printValue(trivia.leading, ctx, 0)}`);
	if (trivia.trailing.length > 0) parts.push(`trailing: ${printValue(trivia.trailing, ctx, 0)}`);
	return `.$trivia({ ${parts.join(', ')} })`;
}

function reindent(source: string, depth: number): string {
	return depth === 0 ? source : source.replace(/\n/g, `\n${pad(depth)}`);
}

function printRawNode(node: Record<string, unknown>, ctx: PrintContext, depth: number): string | undefined {
	const slotKeys = Object.keys(node).filter((k) => k.startsWith('_') && node[k] !== undefined);
	if (slotKeys.length === 1) {
		const kind = slotKeys[0]!.slice(1);
		const value = node[slotKeys[0]!];
		if (typeof value === 'string') {
			if (ctx.textLeafKinds?.has(kind)) return `${ctx.irPathOfKind(kind)}(${JSON.stringify(value)})`;
			const id = ctx.memberIdOfText?.(value);
			return id === undefined ? JSON.stringify(value) : printValue(id, ctx, depth);
		}
		return printValue(value, ctx, depth);
	}
	if (slotKeys.length === 0 && typeof node.$text === 'string') {
		const id = ctx.memberIdOfText?.(node.$text);
		if (id !== undefined) return printValue(id, ctx, depth);
		if (typeof node.$type === 'number' && ctx.memberNameOfId(node.$type) !== undefined) {
			return printValue(node.$type, ctx, depth);
		}
		return JSON.stringify(node.$text);
	}
	return undefined;
}

export function printValue(value: unknown, ctx: PrintContext, depth: number): string {
	if (value instanceof Printed) {
		const trivia = value.handle === undefined ? undefined : ctx.triviaByHandle?.get(value.handle);
		const inline =
			value.kind !== undefined && value.argsSource !== undefined && ctx.unboundKinds?.has(value.kind)
				? value.argsSource
				: value.source;
		return reindent(inline, depth) + triviaSuffix(trivia, ctx);
	}
	if (typeof value === 'string') return JSON.stringify(value);
	if (typeof value === 'boolean') return String(value);
	if (typeof value === 'number') {
		const member = ctx.memberNameOfId(value);
		if (member === undefined) throw new Error(`emit-factory-source: kind id ${value} has no TSKindId member`);
		return `TSKindId.${member}`;
	}
	if (Array.isArray(value)) return `[${value.map((v) => printValue(v, ctx, depth)).join(', ')}]`;
	if (isPlainObject(value)) {
		if ('$type' in value) {
			const raw = printRawNode(value, ctx, depth);
			if (raw !== undefined) return raw;
		}
		const entries = Object.entries(value).filter(
			([k, v]) => v !== undefined && !k.startsWith('$') && !(Array.isArray(v) && v.length === 0)
		);
		if (entries.length === 0) return '{}';
		const body = entries.map(([k, v]) => `${pad(depth + 1)}${k}: ${printValue(v, ctx, depth + 1)},`).join('\n');
		return `{\n${body}\n${pad(depth)}}`;
	}
	return String(value);
}

function printListOptions(options: Record<string, unknown>, ctx: PrintContext): string {
	const parts: string[] = [];
	if (typeof options.delimiter === 'number') {
		parts.push(`delimiter: ${ctx.delimiterArmOfId(options.delimiter) ?? options.delimiter}`);
	}
	if (typeof options.separator === 'number') parts.push(`separator: ${printValue(options.separator, ctx, 0)}`);
	return `{ ${parts.join(', ')} }`;
}

export function triviaOf(node: ReadNodeLike | undefined): NodeTrivia | undefined {
	const trivia = node?.$triviaData;
	if (!trivia) return undefined;
	const texts = (list: readonly unknown[] | undefined): string[] =>
		(list ?? []).map((t) => (t as ReadNodeLike).$text).filter((t): t is string => typeof t === 'string');
	const leading = texts(trivia.leading);
	const trailing = texts(trivia.trailing);
	return leading.length === 0 && trailing.length === 0 ? undefined : { leading, trailing };
}

function handleOf(value: unknown): number | undefined {
	if (!isPlainObject(value)) return undefined;
	const handle = value.$nodeHandle;
	return typeof handle === 'number' ? handle : undefined;
}

function textLeafOfSlot(kind: string, property: string, ctx: PrintContext): string | undefined {
	const kinds = ctx.slotKinds?.[kind]?.[property];
	if (kinds === undefined || ctx.textLeafKinds === undefined) return undefined;
	return kinds.find((k) => ctx.textLeafKinds!.has(k));
}

function printVerbatimText(
	text: string,
	leaf: string | undefined,
	ctx: PrintContext,
	slotKinds: readonly string[] = []
): unknown {
	if (leaf !== undefined) return new Printed(leaf, `${ctx.irPathOfKind(leaf)}(${JSON.stringify(text)})`, leaf);
	if (slotKinds.length === 1 && ctx.keywordKinds?.has(slotKinds[0]!)) return true;
	const id = ctx.memberIdOfText?.(text);
	if (id !== undefined) return id;
	if (ctx.textLeafKinds?.has('identifier')) {
		return new Printed('identifier', `${ctx.irPathOfKind('identifier')}(${JSON.stringify(text)})`, 'identifier');
	}
	return text;
}

function wrapTextLeaves(kind: string, config: unknown, ctx: PrintContext): unknown {
	if (!isPlainObject(config)) return config;
	const out: Record<string, unknown> = {};
	for (const [property, value] of Object.entries(config)) {
		if (ctx.slotStorage?.[kind]?.[property] === 'boolean') {
			out[property] = value === undefined || value === false || value === null ? undefined : true;
			continue;
		}
		const leaf = textLeafOfSlot(kind, property, ctx);
		const kinds = ctx.slotKinds?.[kind]?.[property] ?? [];
		const wrap = (v: unknown): unknown => (typeof v === 'string' ? printVerbatimText(v, leaf, ctx, kinds) : v);
		out[property] = Array.isArray(value) ? value.map(wrap) : wrap(value);
	}
	return out;
}

/**
 * Text leaves inside a seated config belong to the group, not the parent: a
 * spliced or flattened-arm key and an element-seat object carry the child's
 * slot names. Wrap with the parent's slot map first so its own slots win,
 * then with each seat's kind for what the parent does not declare.
 */
function wrapSeatedConfig(kind: string, config: unknown, ctx: PrintContext): unknown {
	let out = wrapTextLeaves(kind, config, ctx);
	const slots = ctx.seats?.[kind];
	if (slots === undefined || !isPlainObject(out)) return out;
	for (const [slotName, table] of Object.entries(slots)) {
		for (const seat of Object.values(table)) {
			if (seat.shape === 'elements') {
				const key = camelCase(slotName);
				const value = (out as Record<string, unknown>)[key];
				if (!Array.isArray(value)) continue;
				out = {
					...(out as Record<string, unknown>),
					[key]: value.map((e) => (isPlainObject(e) ? wrapTextLeaves(seat.kind, e, ctx) : e))
				};
				continue;
			}
			out = wrapTextLeaves(seat.kind, out, ctx);
		}
	}
	return out;
}

function wrapDirectArg(kind: string, value: unknown, ctx: PrintContext): unknown {
	if (typeof value !== 'string') return value;
	const properties = Object.keys(ctx.slotKinds?.[kind] ?? {});
	const property = properties.length === 1 ? properties[0] : undefined;
	const leaf = property === undefined ? undefined : textLeafOfSlot(kind, property, ctx);
	const kinds = property === undefined ? [] : (ctx.slotKinds?.[kind]?.[property] ?? []);
	return printVerbatimText(value, leaf, ctx, kinds);
}

function camelCase(kind: string): string {
	return kind.replace(/^_+/, '').replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
}

export function printingFactoryMap(
	realShapes: Record<string, FactoryShape>,
	kindIdOfName: (kind: string) => number | undefined,
	ctx: PrintContext
): Record<string, (...args: unknown[]) => Printed> {
	const map: Record<string, (...args: unknown[]) => Printed> = {};
	const kinds = Object.keys(realShapes);
	for (const kind of kinds) {
		const shape: FactoryShape = realShapes[kind]!;
		const path = ctx.irPathOfKind(kind);
		const id = kindIdOfName(kind) ?? kind;
		const publicName = kind.replace(/^_+/, '');
		const entry = (...args: unknown[]): Printed => {
			switch (shape) {
				case 'text': {
					const text = String(args[0] ?? '');
					if (ctx.enumKinds?.has(kind)) {
						const member = ctx.memberIdOfText?.(text);
						return new Printed(id, member === undefined ? JSON.stringify(text) : printValue(member, ctx, 0), kind);
					}
					return new Printed(id, `${path}(${JSON.stringify(text)})`, kind);
				}
				case 'direct':
				case 'forwarded': {
					const value = wrapDirectArg(kind, args[0], ctx);
					const argSource = value === undefined ? '' : printValue(value, ctx, 0);
					return new Printed(id, `${path}.strict(${argSource})`, kind, handleOf(value), argSource);
				}
				case 'spread': {
					const argSource = args.map((a) => printValue(a, ctx, 0)).join(', ');
					return new Printed(id, `${path}.strict(${argSource})`, kind, undefined, argSource);
				}
				case 'elements': {
					const [first, ...rest] = args;
					const hasOptions =
						isPlainObject(first) && !('$type' in first) && ('delimiter' in first || 'separator' in first);
					const elements = (hasOptions ? rest : args).map((a) => printValue(a, ctx, 0));
					const head = hasOptions ? [printListOptions(first as Record<string, unknown>, ctx)] : [];
					const argSource = [...head, ...elements].join(', ');
					return new Printed(id, `${path}.strict(${argSource})`, kind, undefined, argSource);
				}
				case 'config':
				default: {
					const wrapped = wrapSeatedConfig(kind, args[0] ?? {}, ctx);
					const argSource = printValue(wrapped, ctx, 0);
					return new Printed(id, `${path}.strict(${argSource})`, kind, handleOf(args[0]), argSource);
				}
			}
		};
		map[kind] = entry;
		if (!(publicName in map) && !kinds.includes(publicName)) map[publicName] = entry;
	}
	return map;
}

/**
 * The printing counterpart of a grammar's `ir` bindings: every kind's
 * `strict`, plus one entry per mount name its seats declare, printing
 * `ir.<parent>.<mount>.strict(…)`. Handing this to
 * `buildFactoryNodeFromReference` as the surface makes the printer take the
 * same seat projection the validators take, so the emitted spelling is the
 * one `ir-render-parse` builds rather than a second derivation of it.
 */
export function printingIrSurface(
	map: Record<string, (...args: unknown[]) => Printed>,
	kindIdOfName: (kind: string) => number | undefined,
	modelTypes: Record<string, string>,
	ctx: PrintContext
): IrSurface {
	const entries: Record<string, IrEntry> = {};
	for (const [kind, strict] of Object.entries(map)) {
		const entry: Record<string, unknown> = { strict };
		const path = ctx.irPathOfKind(kind);
		const id = kindIdOfName(kind) ?? kind;
		for (const table of Object.values(ctx.seats?.[kind] ?? {})) {
			for (const seat of Object.values(table)) {
				if (seat.shape !== 'arm' || seat.mount === undefined || seat.mount in entry) continue;
				entry[seat.mount] = { strict: mountPrinter(path, seat, kind, id, ctx) };
			}
		}
		entries[kind] = entry as IrEntry;
	}
	return { entries, seats: ctx.seats ?? {}, modelTypes };
}

function mountPrinter(
	path: string,
	seat: Seat,
	parentKind: string,
	id: number | string,
	ctx: PrintContext
): (...args: unknown[]) => Printed {
	return (...args: unknown[]): Printed => {
		const printed = args.map((a) => printValue(isPlainObject(a) ? wrapSeatedConfig(parentKind, a, ctx) : a, ctx, 0));
		const argSource = printed.join(', ');
		return new Printed(id, `${path}.${seat.mount!}.strict(${argSource})`, parentKind, handleOf(args[0]), argSource);
	};
}

export function printFactorySource(
	root: ReadNodeLike,
	rootKind: string,
	artifacts: FactoryDispatchArtifacts,
	opts: FactoryDispatchOpts,
	ctx: PrintContext
): string {
	const printed = buildFactoryNodeFromReference(root, rootKind, artifacts, opts);
	if (!(printed instanceof Printed)) {
		throw new Error(`emit-factory-source: no factory for root kind '${rootKind}'`);
	}
	return printed.source + triviaSuffix(triviaOf(root), ctx);
}

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import {
	TYPES_MODULE_PATHS,
	buildReadHandle,
	loadKindIdFromName,
	loadKindNameFromId,
	loadLanguageForGrammar,
	loadNodeModel,
	loadReadTreeNode,
	walkWrappedTree
} from '../validate/common.ts';
import { invoke } from '../codegen-surface.ts';
import type { GeneratedIdTables, GeneratedKindEntry } from '../../../codegen/src/compiler/generated-metadata.ts';

interface TypesModule {
	readonly KIND_NAMES: ReadonlyMap<number, string>;
	readonly TSKindId: Record<number, string | number>;
	readonly Delimiter: Record<number, string | number>;
}

function pascalCase(name: string): string {
	const c = camelCase(name.replace(/[^A-Za-z0-9_]+/g, '_'));
	return c.charAt(0).toUpperCase() + c.slice(1);
}

function withPublicNames<T>(record: Record<string, T>): Record<string, T> {
	const out: Record<string, T> = { ...record };
	for (const [kind, value] of Object.entries(record)) {
		const publicName = kind.replace(/^_+/, '');
		if (!(publicName in out)) out[publicName] = value;
	}
	return out;
}

/**
 * A hoisted kind the overlay wires privately has an `irKey` but no `ir`
 * binding, so its factory path would not resolve. Until a seat names it, its
 * printed call collapses to its arguments, spliced into the parent by hand.
 * The census tracks exactly this set.
 */
function unseatedHoistedKinds(model: { hoistedKinds: ReadonlySet<string>; seats: SeatTable }): ReadonlySet<string> {
	const seated = new Set<string>();
	for (const slots of Object.values(model.seats)) {
		for (const table of Object.values(slots)) for (const seat of Object.values(table)) seated.add(seat.kind);
	}
	const out = new Set<string>();
	for (const kind of model.hoistedKinds) {
		if (seated.has(kind)) continue;
		out.add(kind);
		out.add(kind.replace(/^_+/, ''));
	}
	return out;
}

function irPathResolver(irKeys: Record<string, string>): (kind: string) => string {
	return (kind: string): string => `ir.${irKeys[kind] ?? camelCase(kind)}`;
}

interface DrillHandle {
	readonly read?: (nodeHandle: number, childIndex: number) => unknown;
}

function isShallowEntry(value: unknown): value is { $nodeHandle: number; $childIndex: number } {
	return (
		isPlainObject(value) && typeof value.$nodeHandle === 'number' && typeof value.$childIndex === 'number'
	);
}

interface MaterializeContext {
	readonly handle: DrillHandle;
	readonly kindNameFromId: (id: number) => string | undefined;
	readonly seats: SeatTable;
	readonly factoryFields: Record<string, readonly string[]>;
}

function materialize(node: unknown, mctx: MaterializeContext, depth = 0): unknown {
	if (!isPlainObject(node) || mctx.handle.read === undefined || depth > 256) return node;
	const out: Record<string, unknown> = { ...node };
	for (const [key, value] of Object.entries(node)) {
		if (!key.startsWith('_')) continue;
		const drill = (entry: unknown): unknown =>
			isShallowEntry(entry)
				? materialize(mctx.handle.read!(entry.$nodeHandle, entry.$childIndex), mctx, depth + 1)
				: entry;
		out[key] = Array.isArray(value) ? value.map(drill) : drill(value);
	}
	seatFormChild(out, mctx);
	return out;
}

/**
 * A read stores an arm's value under the child's own kind (`_delim_token_tree_paren`)
 * when the parent's slot carries no label. Move it to the slot the seat names
 * so `nodeToConfig` sees a declared slot and the seat projection applies.
 */
function seatFormChild(node: Record<string, unknown>, mctx: MaterializeContext): void {
	const kind = typeof node.$type === 'number' ? mctx.kindNameFromId(node.$type) : undefined;
	if (kind === undefined) return;
	const slots = mctx.seats[kind];
	if (slots === undefined) return;
	for (const [key, value] of Object.entries(node)) {
		if (!key.startsWith('_')) continue;
		const childKind = key.slice(1);
		for (const [slotName, table] of Object.entries(slots)) {
			if (table[childKind] === undefined && table[`_${childKind}`] === undefined) continue;
			if (slotName === childKind || node[`_${slotName}`] !== undefined) continue;
			node[`_${slotName}`] = value;
			delete node[key];
			return;
		}
	}
}

function catalogEntriesOf(tables: GeneratedIdTables | undefined): GeneratedKindEntry[] {
	const kindIds = tables?.kindIds;
	if (kindIds === undefined) return [];
	const rows = kindIds instanceof Map ? [...kindIds.entries()] : Object.entries(kindIds);
	return rows.map(([kind, value]) =>
		typeof value === 'number'
			? { kind, id: value }
			: { kind, id: value.id ?? -1, symbolName: value.parser?.symbolName, anon: value.parser?.anon }
	);
}

function collectTrivia(root: unknown): Map<number, NodeTrivia> {
	const out = new Map<number, NodeTrivia>();
	walkWrappedTree(root, (node) => {
		const like = node as ReadNodeLike;
		const trivia = triviaOf(like);
		if (trivia !== undefined && typeof like.$nodeHandle === 'number') out.set(like.$nodeHandle, trivia);
	});
	return out;
}

export async function emitFactorySourceText(grammar: string, source: string, exportName: string): Promise<string> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const tree = parser.parse(source);
	if (!tree || tree.rootNode.hasError) throw new Error(`emit-factory-source: the ${grammar} parse has errors`);
	const readTreeNode = await loadReadTreeNode(grammar);
	if (!readTreeNode) throw new Error(`emit-factory-source: no wrap module for ${grammar}`);
	const kindIdFromName = await loadKindIdFromName(grammar);
	const handle = buildReadHandle(grammar, tree, source, 'native', kindIdFromName);
	const model = await loadNodeModel(grammar);
	const typesPath = TYPES_MODULE_PATHS[grammar];
	if (!typesPath) throw new Error(`emit-factory-source: no types module for ${grammar}`);
	const types = (await import(new URL(`../validate/${typesPath}`, import.meta.url).pathname)) as TypesModule;
	const displayNameFromId = await loadKindNameFromId(grammar);
	const kindNameFromId = (id: number): string | undefined => types.KIND_NAMES.get(id) ?? displayNameFromId?.(id);
	const idOfName = new Map<string, number>();
	for (const [id, name] of types.KIND_NAMES) {
		if (!idOfName.has(name)) idOfName.set(name, id);
		const display = displayNameFromId?.(id);
		if (display !== undefined && !idOfName.has(display)) idOfName.set(display, id);
	}
	const memberOf = (table: Record<number, string | number>, id: number): string | undefined =>
		typeof table[id] === 'string' ? (table[id] as string) : undefined;
	const catalog = catalogEntriesOf(await invoke('generatedMetadata', 'loadGeneratedIdTables', grammar));
	const { findEntryForLiteralText } = await import('../../../codegen/src/compiler/generated-metadata.ts');
	const root = materialize(readTreeNode(handle), {
		handle: handle as DrillHandle,
		kindNameFromId,
		seats: model.seats,
		factoryFields: withPublicNames(model.factoryFields)
	}) as ReadNodeLike;
	const textLeafKinds = new Set(Object.keys(model.modelTypes).filter((k) => model.modelTypes[k] === 'pattern'));
	const ctx: PrintContext = {
		grammar,
		kindNameFromId,
		memberNameOfId: (id) => memberOf(types.TSKindId, id),
		irPathOfKind: irPathResolver(withPublicNames(model.irKeys)),
		seats: model.seats,
		slotKinds: withPublicNames(model.slotKinds),
		textLeafKinds,
		enumKinds: new Set(Object.keys(model.modelTypes).filter((k) => model.modelTypes[k] === 'enum')),
		unboundKinds: unseatedHoistedKinds(model),
		slotStorage: withPublicNames(model.slotStorage),
		keywordKinds: new Set(Object.keys(model.modelTypes).filter((k) => model.modelTypes[k] === 'token')),
		memberIdOfText: (text) => findEntryForLiteralText(catalog, text)?.id ?? idOfName.get(text),
		delimiterArmOfId: (id) => {
			const member = memberOf(types.Delimiter, id);
			return member === undefined ? undefined : `Delimiter.${member}`;
		},
		triviaByHandle: collectTrivia(root)
	};
	const factoryShapes: Record<string, FactoryShape> = withPublicNames(model.factoryShapes);
	const factoryMap = printingFactoryMap(model.factoryShapes, (kind) => idOfName.get(kind), ctx);
	const artifacts: FactoryDispatchArtifacts = {
		factoryMap,
		surface: printingIrSurface(factoryMap, (kind) => idOfName.get(kind), model.modelTypes, ctx),
		factoryShapes,
		fieldAliasMap: withPublicNames(model.fieldAliasMap),
		factoryFields: withPublicNames(model.factoryFields),
		factorySlots: withPublicNames(model.factorySlots),
	};
	const rootKind = typeof root.$type === 'number' ? kindNameFromId(root.$type) : root.$type;
	if (!rootKind) throw new Error(`emit-factory-source: root kind id ${String(root.$type)} is not in the catalog`);
	const body = printFactorySource(root, rootKind, artifacts, { kindNameFromId, tree: handle }, ctx);
	return [
		'// @generated by `sittir tool emit-factory-source`; do not edit.',
		`import { ir, TSKindId, Delimiter } from '@sittir/${grammar}';`,
		'',
		`export function ${exportName}() {`,
		`\treturn ${body.replace(/\n/g, '\n\t')};`,
		'}',
		''
	].join('\n');
}

export interface EmitFactorySourceOptions {
	readonly grammar: string;
	readonly file: string;
	readonly exportName?: string;
	readonly out?: string;
}

export async function run(opts: EmitFactorySourceOptions): Promise<number> {
	const file = resolve(opts.file);
	const source = readFileSync(file, 'utf8');
	const exportName = opts.exportName ?? `rebuild${pascalCase(basename(file).replace(/\.[^.]+$/, ''))}`;
	const printed = await emitFactorySourceText(opts.grammar, source, exportName);
	if (opts.out) writeFileSync(resolve(opts.out), printed);
	else process.stdout.write(printed);
	return 0;
}
