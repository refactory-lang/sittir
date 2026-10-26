type Place = { readonly list: unknown[]; readonly index: number } | { readonly node: Record<string, unknown>; readonly key: string };

type Step<V> = { readonly visit: V; readonly place: Place } | { readonly then: () => void };

export class Below<V> {
	readonly #steps: Step<V>[] = [];
	#then: (() => void) | undefined;

	into(list: unknown[], index: number, visit: V): void {
		this.#steps.push({ visit, place: { list, index } });
	}

	at(node: Record<string, unknown>, key: string, visit: V): void {
		node[key] = undefined;
		this.#steps.push({ visit, place: { node, key } });
	}

	then(after: () => void): void {
		this.#then = after;
	}

	drainInto(pending: Step<V>[]): void {
		if (this.#then !== undefined) pending.push({ then: this.#then });
		for (let index = this.#steps.length - 1; index >= 0; index -= 1) pending.push(this.#steps[index]!);
		this.#steps.length = 0;
		this.#then = undefined;
	}
}

export function copyDown<V>(root: V, step: (visit: V, below: Below<V>) => unknown): unknown {
	const result: unknown[] = [undefined];
	const pending: Step<V>[] = [{ visit: root, place: { list: result, index: 0 } }];
	const below = new Below<V>();
	for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
		if ('then' in next) {
			next.then();
			continue;
		}
		const value = step(next.visit, below);
		if ('list' in next.place) next.place.list[next.place.index] = value;
		else next.place.node[next.place.key] = value;
		below.drainInto(pending);
	}
	return result[0];
}

export function copyEntries<V>(list: readonly unknown[], below: Below<V>, visit: (entry: unknown, index: number) => V): unknown[] {
	const out = new Array<unknown>(list.length);
	list.forEach((entry, index) => below.into(out, index, visit(entry, index)));
	return out;
}
