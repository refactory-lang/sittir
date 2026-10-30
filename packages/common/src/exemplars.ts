import { Source } from './source.ts';
import { SOURCE } from './source-stamp.ts';
import { TREE } from './tree-token.ts';

const vacant = (): undefined => undefined;

function unkeptKind(kept: readonly object[], node: object): number | undefined {
	const kind = (node as { readonly $type?: unknown }).$type;
	return typeof kind === 'number' && kept[kind] === undefined ? kind : undefined;
}

export function keepExemplar<T extends object>(exemplars: object[], node: T): T {
	const kind = unkeptKind(exemplars, node);
	if (kind !== undefined) exemplars[kind] = layoutShell(node);
	return node;
}

export function keepLayout<T extends object>(layouts: object[], node: T): T {
	if (unkeptKind(layouts, node) !== undefined) keepLayouts(layouts, node);
	return node;
}

function isBuiltLiteral(value: object): boolean {
	return (value as { readonly [SOURCE]?: unknown })[SOURCE] === Source.Factory && !Object.hasOwn(value, TREE);
}

function keepLayouts(layouts: object[], root: object): void {
	const open: unknown[] = [root];
	while (open.length > 0) {
		const value = open.pop();
		if (Array.isArray(value)) {
			for (const item of value) open.push(item);
			continue;
		}
		if (typeof value !== 'object' || value === null || !isBuiltLiteral(value)) continue;
		const kind = unkeptKind(layouts, value);
		if (kind === undefined) continue;
		layouts[kind] = layoutShell(value);
		for (const held of Object.values(value)) open.push(held);
	}
}

export function layoutShell(node: object): object {
	const shell: Record<PropertyKey, unknown> = { ...node };
	const keys = Reflect.ownKeys(shell);
	let items = 0;
	while (keys[items] === String(items)) items++;
	for (let index = items - 1; index >= 0; index--) delete shell[index];
	for (let at = items; at < keys.length; at++) {
		const key = keys[at]!;
		const value = shell[key];
		const held = vacated(value);
		if (held !== value) shell[key] = held;
	}
	return shell;
}

function vacated(value: unknown): unknown {
	switch (typeof value) {
		case 'function':
			return vacant;
		case 'object':
			return value === null ? null : undefined;
		case 'string':
			return '';
		default:
			return value;
	}
}
