import type { PortableCondition, PortableReadEntry, PortableTable, QuerySlots, QuerySubject, SlotRoutes } from '@sittir/types';
import { holds, slotItems } from './query.ts';

type Node = { readonly $type: number; readonly $subType?: unknown };
type Context = readonly Node[] | undefined;

const isNode = (value: unknown): value is Node =>
	typeof value === 'object' && value !== null && typeof (value as Node).$type === 'number';

const sameRoutes = (a: SlotRoutes, b: SlotRoutes): boolean =>
	a.fields.length === b.fields.length &&
	a.kinds.length === b.kinds.length &&
	a.fields.every((field, i) => field === b.fields[i]) &&
	a.kinds.every((kind, i) => kind === b.kinds[i]);

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
	const textOf = (item: unknown): string | undefined =>
		typeof item === 'number' ? table.fixedText[item] : isNode(item) ? (item as { readonly $text?: string }).$text : undefined;
	const conditionHolds = (condition: PortableCondition, node: Node, context: Context): boolean => {
		const holder = condition.up === 0 ? node : context?.[context.length - condition.up];
		if (holder === undefined) return false;
		let reached: readonly unknown[] = [holder];
		for (const step of condition.via) reached = reached.filter(isNode).flatMap((n) => itemsIn(n, step));
		return reached.some((item) => {
			const texts = (subject: QuerySubject): readonly string[] =>
				('self' in subject ? [item] : isNode(item) ? itemsIn(item, subject) : []).flatMap((i) => textOf(i) ?? []);
			return holds(condition.plan, texts);
		});
	};
	const classify = (node: Node, context: Context): string | undefined =>
		table.entries[node.$type]?.find((entry) => placed(entry, context) && entry.test.every((c) => conditionHolds(c, node, context)))
			?.path;
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
			exact
				? (node: unknown): boolean => isNode(node) && admitted.has(node.$type)
				: (node: unknown, context?: readonly Node[]): boolean =>
						isNode(node) && admitted.has(node.$type) && under(path, typeof node.$subType === 'string' ? node.$subType : classify(node, context))
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
