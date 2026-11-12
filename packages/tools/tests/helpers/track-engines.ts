type Created = { [Symbol.dispose](): void };

const made: Created[] = [];

export function trackingEngines<M extends { createEngine: (...args: never[]) => Promise<Created> }>(actual: M): M {
	const createEngine = async (...args: Parameters<M['createEngine']>): Promise<Created> => {
		const engine = await actual.createEngine(...args);
		if (Symbol.dispose in engine) made.push(engine);
		return engine;
	};
	return { ...actual, createEngine };
}

export function releaseTrackedEngines(): void {
	for (const engine of made.splice(0)) engine[Symbol.dispose]();
}
