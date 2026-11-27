/** An engine as an edit test drives it: it parses a source, and renders a root. */
export interface EditableEngine {
	parse(source: string): unknown;
	render(root: never): { toString(): string };
}

interface Rebuildable {
	readonly $with?: Readonly<Record<string, (...values: readonly unknown[]) => Rebuildable>>;
	$render(): unknown;
	readonly [slot: string]: unknown;
}

const isNode = (value: unknown): value is Rebuildable => typeof value === 'object' && value !== null && typeof (value as { $render?: unknown }).$render === 'function';

const slotsOf = (node: Rebuildable): readonly string[] => (node.$with === undefined ? [] : Object.keys(node.$with));

const valueOf = (node: Rebuildable, slot: string): unknown => {
	const read = node[slot];
	return typeof read === 'function' ? (read as () => unknown).call(node) : undefined;
};

const valuesOf = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : [value]);

/** `node` rebuilt with its own value through its first slot that holds one; a node with no such slot, a leaf, as it is. */
function rebuilt(node: Rebuildable): Rebuildable {
	for (const slot of slotsOf(node)) {
		const value = valueOf(node, slot);
		if (value !== undefined) return node.$with![slot]!(...valuesOf(value));
	}
	return node;
}

/** The rebuilt `node` and the rebuilt node under it that renders as `text`: the first such node, holders before what they hold, rebuilt, and each holder from it up to `node` rebuilt over the rebuilt child; none when no node renders as `text`. */
function rebuiltAt(node: Rebuildable, text: string): { readonly root: Rebuildable; readonly node: Rebuildable } | undefined {
	if (String(node.$render()) === text) {
		const own = rebuilt(node);
		return { root: own, node: own };
	}
	for (const slot of slotsOf(node)) {
		const items = valuesOf(valueOf(node, slot));
		for (const [at, item] of items.entries()) {
			if (!isNode(item)) continue;
			const child = rebuiltAt(item, text);
			if (child === undefined) continue;
			return { root: node.$with![slot]!(...items.map((other, position) => (position === at ? child.root : other))), node: child.node };
		}
	}
	return undefined;
}

/**
 * `source` parsed by `engine` after one edit, made as the product makes it: the first node,
 * holders before what they hold, that renders as `text` is rebuilt with its own values
 * (`$with`), and so is each of its holders up to the root, each over the rebuilt child in the
 * slot it came from. Each rebuilt node renders from its template, its gaps from the options,
 * and every node the edit left alone renders as its source. Answers the rebuilt root and the
 * rebuilt node.
 *
 * The walk from the root down is test support for what `$set` will do in place: once `$set`
 * lands, this helper edits through it and the walk goes.
 */
export function edited(engine: EditableEngine, source: string, text: string): { readonly root: unknown; readonly node: unknown } {
	const root = engine.parse(source);
	if (!isNode(root)) throw new Error('a parse answers a root node');
	const rebuiltRoot = rebuiltAt(root, text);
	if (rebuiltRoot === undefined) throw new Error(`no node renders as ${JSON.stringify(text)}`);
	return rebuiltRoot;
}

/** The render of `source` after the edit `edited` makes at `text`. */
export function editedRender(engine: EditableEngine, source: string, text: string): string {
	return engine.render(edited(engine, source, text).root as never).toString();
}
