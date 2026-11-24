import { sourceTextOf } from '../node-data.ts';
import { slotReader } from '../record-view.ts';
import { storedSlotRead } from '../stored-slot.ts';

export type Node = { readonly $type: number };

export type Other = (node: Node, container?: Node) => unknown;

export interface Found {
	readonly found: unknown;
	readonly many: boolean;
	readonly fitted?: false;
}

export interface Placed {
	readonly name: string;
	readonly slot: string;
	readonly index: number;
	readonly spelling?: string;
	readonly path?: string;
	readonly flag?: string;
}

const holders = new WeakMap<object, Node>();

export const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null && typeof (value as Node).$type === 'number';

export const kindOf = (value: unknown): number | undefined => (typeof value === 'number' ? value : isNode(value) ? value.$type : undefined);

export const present = (value: unknown): boolean => value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0);

export const slotOf = (node: unknown, key: string): unknown => {
	if (!isNode(node)) return undefined;
	const read = slotReader(node, key);
	return typeof read === 'function' ? (read as () => unknown).call(node) : read;
};

export { storedSlotRead };

export const storedTrue = (node: unknown, accessor: string, storage: string): unknown => (isNode(node) ? storedSlotRead(node, accessor, storage) : undefined);

export const stored = (node: unknown, accessor: string, storage: string): readonly unknown[] => {
	const value = storedTrue(node, accessor, storage);
	return Array.isArray(value) ? value.filter((item) => item !== null) : value === undefined || value === null ? [] : [value];
};

export const textOf = (value: unknown): string | undefined => (typeof value === 'string' ? value : isNode(value) ? sourceTextOf(value) : undefined);

export const texts = (items: readonly unknown[]): readonly string[] => items.flatMap((item) => textOf(item) ?? []);

export const one = (items: readonly string[]): string | undefined => (items.length === 1 ? items[0] : undefined);

export const only = <T>(items: readonly T[]): readonly T[] => (items.length === 1 ? items : []);

export const step = (at: unknown, read: (node: Node) => unknown, kinds: ReadonlySet<number> | undefined): unknown => {
	if (Array.isArray(at)) return at.flatMap((item) => [step(item, read, kinds) ?? []].flat());
	if (!isNode(at)) return undefined;
	const reached = read(at);
	if (reached === undefined || reached === null || kinds === undefined) return reached ?? undefined;
	return Array.isArray(reached) ? reached.filter((item) => kinds.has(kindOf(item) ?? -1)) : kinds.has(kindOf(reached) ?? -1) ? reached : undefined;
};

export const seated = (value: unknown, holder: unknown, many: boolean): Found => {
	if (isNode(value) && isNode(holder)) holders.set(value, holder);
	return { found: value, many };
};

export const joined = (parts: readonly Found[]): Found => ({ found: parts.flatMap((part) => [part.found].flat()), many: parts.some((part) => part.many) });

export const pick = (candidates: readonly ({ readonly value: unknown; readonly fitted: boolean } | undefined)[]): { readonly value: unknown; readonly fitted: boolean } | undefined => {
	const held = candidates.filter((candidate) => candidate !== undefined && candidate.value !== null);
	return held.find((candidate) => candidate!.fitted) ?? held[0];
};

export const readValue = (value: unknown, reader: (item: unknown, container: Node | undefined) => unknown): unknown =>
	Array.isArray(value) ? value.map((item) => reader(item, isNode(item) ? holders.get(item) : undefined)) : reader(value, isNode(value) ? holders.get(value) : undefined);

export const place = (
	placed: Placed[],
	taken: Set<number>,
	items: readonly unknown[],
	name: string,
	slot: string,
	test: (item: unknown, index: number) => boolean,
	spelling: (index: number) => string | undefined,
	path: string | undefined,
	flag: string | undefined
): void => {
	if (placed.some((held) => held.name === name)) return;
	const index = items.findIndex(test);
	if (index < 0) return;
	taken.add(index);
	const spelled = spelling(index);
	placed.push({ name, slot, index, ...(spelled === undefined ? {} : { spelling: spelled }), ...(path === undefined ? {} : { path }), ...(flag === undefined ? {} : { flag }) });
};

export const placedPath = (placed: readonly Placed[]): string | undefined => placed.find((held) => held.path !== undefined)?.path;

export const atOf = (placed: readonly Placed[]): Readonly<Record<string, { readonly index: number; readonly spelling?: string }>> =>
	Object.fromEntries(placed.map(({ name, index, spelling }) => [name, spelling === undefined ? { index } : { index, spelling }]));

export const untaken = (items: unknown, placed: readonly Placed[], slot: string): unknown => {
	const indices = new Set(placed.flatMap((held) => (held.slot === slot ? [held.index] : [])));
	return indices.size === 0 || !Array.isArray(items) ? items : items.filter((_, i) => !indices.has(i));
};

export const integerOf = (value: bigint | undefined, bigint: boolean): number | bigint | undefined =>
	value === undefined || bigint || value > BigInt(Number.MAX_SAFE_INTEGER) ? value : Number(value);

export const floatOf = (text: string): number | undefined => {
	const digits = text.replace(/(?<=\d)_(?=\d)/g, '');
	if (!/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(digits)) return undefined;
	const value = Number(digits);
	return Number.isFinite(value) ? value : undefined;
};
