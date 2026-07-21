import type { AnyNodeData, AnyTreeNodeOf, ByteRange, Edit, NodeTrivia } from '@sittir/types';

/**
 * @forFutureUse ADR-0018 (docs/adr/0018-dehoist-nodedata-surface.md) —
 * runtime shape backing the `$with` update namespace. Not yet wired into
 * generated output; scaffolding only.
 */
export interface WithMethodsRuntime<T extends object = AnyNodeData> {
	$render(): string;
	$toEdit(startOrRange: number | ByteRange, endPos?: number): Edit;
	$replace(target: { range(): ByteRange }): Edit;
	$trivia(...args: unknown[]): T & WithMethodsRuntime<T>;
}

export interface WithMethodsEngine {
	render(node: AnyNodeData): string;
	toEdit(node: AnyNodeData, startOrRange: number | ByteRange, endPos?: number): Edit;
}

export function withMethods<T extends AnyNodeData>(node: T, engine: WithMethodsEngine): T & WithMethodsRuntime<T> {
	return Object.assign(node, {
		$render(this: AnyNodeData): string {
			return engine.render(this);
		},
		$toEdit(this: AnyNodeData, startOrRange: number | ByteRange, endPos?: number): Edit {
			return engine.toEdit(this, startOrRange, endPos);
		},
		$replace(this: AnyNodeData, target: { range(): ByteRange }): Edit {
			return engine.toEdit(this, target.range());
		},
		$trivia(this: AnyNodeData, ...args: unknown[]) {
			setTriviaData(this, toTriviaData(args));
			return this as unknown as T & WithMethodsRuntime<T>;
		}
	});
}

/**
 * Attach `accessors` to `node` as non-enumerable own properties (ADR-0018
 * FR-002 / SC-004). Generated factories build the `$`-metadata + `_`-storage
 * object literal first, then route every accessor method through this helper
 * instead of inlining `<name>() { ... }` as an ordinary (enumerable) literal
 * property — `Object.keys(node)` must expose only `$`- and `_`-prefixed keys.
 */
export function withAccessors<T extends object, A extends Record<string, unknown>>(node: T, accessors: A): T & A {
	for (const key of Object.keys(accessors)) {
		Object.defineProperty(node, key, { value: accessors[key], enumerable: false, writable: true, configurable: true });
	}
	return node as T & A;
}

export function isNodeData(v: unknown): v is AnyNodeData {
	if (v === null || typeof v !== 'object') return false;
	const o = v as Record<string, unknown>;
	if (typeof o.$type !== 'number') return false;
	const hasStoredFields = Object.keys(o).some((k) => k.startsWith('_'));
	return (
		hasStoredFields ||
		typeof o.$text === 'string' ||
		o.$other !== undefined ||
		o.$source === 0 ||
		o.$source === 1 ||
		o.$source === 2
	);
}

export function isTreeNode(v: unknown): v is AnyTreeNodeOf {
	if (v === null || typeof v !== 'object') return false;
	const o = v as Record<string, unknown>;
	return typeof o.type === 'string' && typeof o.field === 'function' && typeof o.text === 'function';
}

export function hasKind(v: object): v is { kind: string } & Record<string, unknown> {
	return 'kind' in v && typeof (v as Record<string, unknown>).kind === 'string';
}

export function coerceBooleanKeywordStorage(value: unknown): true | undefined {
	if (value === undefined || value === null || value === false) return undefined;
	if (Array.isArray(value)) return value.length > 0 ? true : undefined;
	return true;
}

export function coerceBitflagStorage(value: unknown, texts: readonly string[]): number | undefined {
	if (value === undefined || value === null || value === false) return undefined;
	if (typeof value === 'number') return value === 0 ? undefined : value;
	if (Array.isArray(value)) {
		let acc = 0;
		for (const item of value) {
			const bits = coerceBitflagStorage(item, texts) ?? 0;
			acc |= bits;
		}
		return acc === 0 ? undefined : acc;
	}
	const text = extractNodeText(value);
	if (text === undefined) return undefined;
	const index = texts.indexOf(text);
	if (index < 0) return undefined;
	return 1 << index;
}

function extractNodeText(value: unknown): string | undefined {
	if (typeof value === 'string') return value;
	if (isNodeData(value)) {
		return typeof value.$text === 'string' ? value.$text : undefined;
	}
	if (isRecord(value) && typeof value.$text === 'string') return value.$text;
	return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toTriviaData(args: readonly unknown[]): NodeTrivia {
	if (args.length === 1 && isTriviaObject(args[0])) {
		return args[0];
	}
	return { leading: args as readonly AnyNodeData[] };
}

function isTriviaObject(value: unknown): value is NodeTrivia {
	return isRecord(value) && ('leading' in value || 'trailing' in value);
}

function setTriviaData(node: AnyNodeData, triviaData: NodeTrivia): void {
	(node as unknown as Record<string, unknown>).$triviaData = triviaData;
}
