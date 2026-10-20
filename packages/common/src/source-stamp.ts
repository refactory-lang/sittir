import type { SourceMember } from '@sittir/types';
import { Source } from './source.ts';

const STAMP = Symbol('sittir.source-stamp') as typeof SourceMember;

type Stamped = { [STAMP]?: Source };

const readSource = {
	get(this: Stamped): Source | undefined {
		return this[STAMP];
	},
	enumerable: false,
	configurable: true
};

export function stampSource<T extends object>(node: T, source: Source): T {
	Object.defineProperties(node, {
		[STAMP]: { value: source, enumerable: true, configurable: true },
		$source: readSource
	});
	return node;
}

export function stampBuilt<T extends object>(node: T): T {
	return stampSource(node, Source.Factory);
}

export function sourceStampOf(node: object): Source | undefined {
	return (node as Stamped)[STAMP];
}

export function carrySourceStamp<T extends object>(from: object, to: T): T {
	const source = sourceStampOf(from);
	if (source !== undefined) stampSource(to, source);
	return to;
}
