import type { NodeMap } from '../compiler/types.ts';
import { memberKindsOf } from '../compiler/model/supertype-members.ts';
import { expandToConcreteParseKinds } from './shared.ts';

export function membershipKindsOf(names: readonly string[], nodeMap: NodeMap): string[] {
	return [...new Set(expandToConcreteParseKinds(names, nodeMap).flatMap((kind) => memberKindsOf(kind, nodeMap)))];
}
