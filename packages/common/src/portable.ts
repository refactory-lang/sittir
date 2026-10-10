import type { PortableCondition, PortableReadEntry, PortableStep, PortableTable, QuerySlots, QuerySubject, SlotRoutes } from '@sittir/types';
import { holds, slotItems } from './query.ts';
import { spanSlicer, type ByteSpan } from './span.ts';
import { treeOf } from './tree-token.ts';
import { spanOf } from './utils.ts';

type Node = { readonly $type: number; readonly $subType?: unknown; readonly $text?: string };
type Context = readonly Node[] | undefined;

type Item = Node | number;

const isNode = (value: unknown): value is Node =>
	typeof value === 'object' && value !== null && typeof (value as Node).$type === 'number';

const asItem = (value: unknown): Item | undefined => (typeof value === 'number' || isNode(value) ? value : undefined);

const kindOf = (item: Item): number => (typeof item === 'number' ? item : item.$type);

const sameRoutes = (a: SlotRoutes, b: SlotRoutes): boolean =>
	a.fields.length === b.fields.length &&
	a.kinds.length === b.kinds.length &&
	a.fields.every((field, i) => field === b.fields[i]) &&
	a.kinds.every((kind, i) => kind === b.kinds[i]);

const anchored = (items: readonly unknown[], anchor: PortableStep['anchor']): readonly unknown[] =>
	anchor === undefined ? items : anchor === 'first' ? items.slice(0, 1) : items.slice(-1);

function placed(entry: PortableReadEntry, context: Context): boolean {
	if (entry.within.length === 0) return true;
	if (context === undefined || context.length < entry.within.length) return false;
	return entry.within.every((kind, i) => kind === null || context[context.length - 1 - i]?.$type === kind);
}

export function portableSurface<Kinds, Is>(table: PortableTable, querySlots: QuerySlots): { readonly kinds: Kinds; readonly is: Is } {
	const itemsIn = (node: Node, routes: SlotRoutes): readonly unknown[] => {
		const accessor = querySlots[node.$type]?.find(([, r]) => sameRoutes(r, routes))?.[0];
		return accessor === undefined ? [] : slotItems(node, accessor);
	};
	const slicers = new WeakMap<object, (span: ByteSpan) => string>();
	const sliceOf = (node: Node): string | undefined => {
		const tree = treeOf(node);
		const span = spanOf(node);
		if (tree?.source === undefined || span === undefined) return undefined;
		let slice = slicers.get(tree);
		if (slice === undefined) slicers.set(tree, (slice = spanSlicer(tree.source)));
		return slice(span);
	};
	const textOf = (item: unknown): string | undefined =>
		typeof item === 'number' ? table.fixedText[item] : isNode(item) ? (item.$text ?? sliceOf(item)) : undefined;
	const conditionHolds = (condition: PortableCondition, node: Item, context: Context): boolean => {
		const holder: Item | undefined = condition.up === 0 ? node : context?.[context.length - condition.up];
		if (holder === undefined) return false;
		let reached: readonly unknown[] = [holder];
		for (const step of condition.via) reached = reached.filter(isNode).flatMap((n) => anchored(itemsIn(n, step), step.anchor));
		const subjects = (subject: QuerySubject): readonly unknown[] =>
			reached.flatMap((item) => ('self' in subject ? [item] : isNode(item) ? itemsIn(item, subject) : []));
		return holds(
			condition.plan,
			(subject) => subjects(subject).flatMap((i) => textOf(i) ?? []),
			(subject) => subjects(subject).flatMap((i) => {
				const item = asItem(i);
				return item === undefined ? [] : [kindOf(item)];
			})
		);
	};
	const classify = (item: Item, context: Context): string | undefined =>
		table.entries[kindOf(item)]?.find((entry) => placed(entry, context) && entry.test.every((c) => conditionHolds(c, item, context)))?.path;
	const kinds = new Map<string, object>([['', {}]]);
	const guards = new Map<string, object>([['', {}]]);
	const paths = Object.keys(table.paths);
	const under = (path: string, read: string | undefined): boolean => read !== undefined && (read === path || read.startsWith(`${path}.`));
	for (const path of paths) {
		const { ids, exact } = table.paths[path]!;
		const admitted = new Set(ids);
		kinds.set(path, { $ids: Object.freeze([...ids]) });
		guards.set(
			path,
			(node: unknown, context?: readonly Node[]): boolean => {
				const item = asItem(node);
				if (item === undefined || !admitted.has(kindOf(item))) return false;
				if (exact) return true;
				if (typeof item !== 'number' && typeof item.$subType === 'string') return under(path, item.$subType);
				return under(path, classify(item, context));
			}
		);
	}
	const link = (at: string, name: string, path: string): void => {
		for (const nodes of [kinds, guards])
			Object.defineProperty(nodes.get(at)!, name, { value: nodes.get(path), enumerable: true, configurable: false, writable: false });
	};
	for (const path of paths) {
		const cut = path.lastIndexOf('.');
		link(cut < 0 ? '' : path.slice(0, cut), path.slice(cut + 1), path);
	}
	for (const [under, name, path] of table.aliases) link(under, name, path);
	for (const node of [...kinds.values(), ...guards.values()]) Object.freeze(node);
	return Object.freeze({ kinds: kinds.get('') as Kinds, is: guards.get('') as Is });
}
