import type { AnyNodeData, EngineIdentity, Rendered } from '@sittir/types';

export interface LiveEngine extends EngineIdentity {
	render(node: AnyNodeData): Rendered;
}

export interface EngineHandle {
	current: LiveEngine | EngineIdentity;
}

let active: EngineHandle | undefined;

export function inEngine<T>(handle: EngineHandle, fn: () => T): T {
	const previous = active;
	active = handle;
	try {
		return fn();
	} finally {
		active = previous;
	}
}

export function currentHandle(): EngineHandle | undefined {
	return active;
}

export function isLive(current: EngineHandle['current']): current is LiveEngine {
	return 'render' in current;
}
