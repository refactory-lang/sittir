import type { AnyUntypedNode, EngineIdentity, Rendered, TriviaFacts } from '@sittir/types';
import type { EngineHandle, LiveEngine } from '../../src/engine-scope.ts';

export function triviaFacts(comment?: (text: string) => AnyUntypedNode): TriviaFacts {
	return {
		kindName: (type) => (type === 9 ? 'comment' : undefined),
		kinds: new Set(['comment']),
		innerGaps: {},
		rebuildWrappers: new Set<number>(),
		listKinds: new Set<number>(),
		...(comment === undefined ? {} : { comment })
	};
}

export function liveHandle(
	options: { readonly render?: (node: AnyUntypedNode | number) => string; readonly trivia?: TriviaFacts } = {}
): EngineHandle {
	const live: LiveEngine = {
		language: { name: 'fake', fileTypes: [], load: () => Promise.reject(new Error('type-only')) },
		renderModuleHash: 'hash',
		options: undefined,
		trivia: options.trivia ?? triviaFacts(),
		render: (node) => ({ toString: () => options.render?.(node) ?? '' }) as Rendered,
		query: () => {
			throw new Error('fake engine has no parsed trees');
		}
	};
	return { current: live };
}

export function detach(handle: EngineHandle): EngineIdentity {
	const { render: _render, query: _query, ...identity } = handle.current as LiveEngine;
	handle.current = identity;
	return identity;
}
