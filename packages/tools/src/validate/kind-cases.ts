export type CasesByKind = Readonly<Record<string, number>>;

export class KindCases {
	readonly #counts = new Map<string, number>();

	add(kind: string, count = 1): void {
		this.#counts.set(kind, (this.#counts.get(kind) ?? 0) + count);
	}

	remove(kind: string): void {
		const count = this.#counts.get(kind) ?? 0;
		if (count === 0) throw new Error(`KindCases.remove: no case of '${kind}' is counted`);
		if (count === 1) this.#counts.delete(kind);
		else this.#counts.set(kind, count - 1);
	}

	has(kind: string): boolean {
		return this.#counts.has(kind);
	}

	get total(): number {
		let total = 0;
		for (const count of this.#counts.values()) total += count;
		return total;
	}

	byKind(): CasesByKind {
		return Object.fromEntries([...this.#counts].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
	}
}
