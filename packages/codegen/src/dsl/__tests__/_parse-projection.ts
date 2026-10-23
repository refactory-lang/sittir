import { LABELS_KEY } from '../wire/options-block.ts';

export interface ProjectableGrammar {
	readonly rules: Readonly<Record<string, unknown>>;
	readonly splitFrom?: Readonly<Record<string, string>>;
	readonly supertypes?: readonly unknown[];
	readonly inline?: readonly unknown[];
	readonly options?: Readonly<Record<string, unknown>>;
}

export interface Projection {
	readonly rules: Record<string, unknown>;
	readonly splitFrom: Record<string, string>;
	readonly supertypes: unknown[];
	readonly inline: unknown[];
	readonly options: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export function withoutIds(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(withoutIds);
	if (!isRecord(value)) return value;
	return Object.fromEntries(
		Object.entries(value)
			.filter(([key]) => key !== 'id')
			.map(([key, inner]) => [key, withoutIds(inner)])
	);
}

export function projection(grammar: ProjectableGrammar): Projection {
	const splitFrom = grammar.splitFrom ?? {};
	const names = new Map<string, string>();
	const collect = (node: unknown): void => {
		if (Array.isArray(node)) return node.forEach(collect);
		if (!isRecord(node)) return;
		const content = node.content;
		if (node.type === 'ALIAS' && node.named === true && typeof node.value === 'string' && isRecord(content) && content.type === 'SYMBOL') {
			const copy = content.name as string;
			if (copy in splitFrom && node.value !== splitFrom[copy]) names.set(copy, node.value);
		}
		Object.values(node).forEach(collect);
	};
	Object.values(grammar.rules).forEach(collect);

	const rename = (name: string): string => names.get(name) ?? name;
	const unalias = (node: unknown): unknown => {
		if (Array.isArray(node)) return node.map(unalias);
		if (!isRecord(node)) return node;
		const content = node.content;
		if (node.type === 'ALIAS' && node.named === true && isRecord(content) && content.type === 'SYMBOL' && names.has(content.name as string))
			return { ...content, name: rename(content.name as string) };
		if (node.type === 'SYMBOL' && typeof node.name === 'string') return { ...node, name: rename(node.name) };
		return Object.fromEntries(Object.entries(node).map(([key, inner]) => [key, unalias(inner)]));
	};
	const headOf = (path: string): string => path.replace(/^[^/]*/, (head) => rename(head));
	const optionsOf = (options: Readonly<Record<string, unknown>>): Record<string, unknown> =>
		Object.fromEntries(
			Object.entries(options).map(([key, value]) =>
				key === LABELS_KEY && isRecord(value)
					? [key, Object.fromEntries(Object.entries(value).map(([path, target]) => [headOf(path), typeof target === 'string' ? headOf(target) : target]))]
					: [rename(key), value]
			)
		);

	return {
		rules: Object.fromEntries(Object.entries(grammar.rules).map(([name, body]) => [rename(name), unalias(body)])),
		splitFrom: Object.fromEntries(Object.entries(splitFrom).map(([name, base]) => [rename(name), base])),
		supertypes: (grammar.supertypes ?? []).map((entry) => (typeof entry === 'string' ? rename(entry) : unalias(entry))),
		inline: (grammar.inline ?? []).map((entry) => (typeof entry === 'string' ? rename(entry) : unalias(entry))),
		options: optionsOf(grammar.options ?? {})
	};
}
