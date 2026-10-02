import { currentHandle, renderText, triviaInner, triviaInnerAt, triviaSide } from '../../src/utils.ts';

/** A node written the way the emitters write one: the data and its members in one literal, bound to the engine in scope. */
export function withMembers<T extends object>(data: T): T & Record<string, any> {
	const handle = currentHandle();
	const node: Record<string, any> = {
		...data,
		$render: () => renderText(handle, node),
		$trivia: {
			leading: (...items: unknown[]) => triviaSide(node, handle, 'leading', items),
			trailing: (...items: unknown[]) => triviaSide(node, handle, 'trailing', items),
			inner: (...items: unknown[]) => triviaInner(node, handle, items),
			innerAt: (gap: string, ...items: unknown[]) => triviaInnerAt(node, handle, gap, items)
		},
		$engine: handle && (() => handle.current)
	};
	return node as T & Record<string, any>;
}
