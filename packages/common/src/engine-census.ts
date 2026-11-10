interface Census {
	live: number;
}

const KEY = Symbol.for('sittir.engineCensus');

const census = ((globalThis as Record<symbol, Census | undefined>)[KEY] ??= { live: 0 });

export function engineOpened(): void {
	census.live += 1;
}

export function engineClosed(): void {
	census.live -= 1;
}

export function liveEngineCount(): number {
	return census.live;
}
