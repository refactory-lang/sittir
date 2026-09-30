export function nativeShownKindId<T>(node: { readonly $type: T }): T;
export function nativeShownKindId<T>(node: { readonly $type?: T }): T | undefined;
export function nativeShownKindId<T>(node: { readonly $type?: T }): T | undefined {
	return (node as { readonly $displayType?: T }).$displayType ?? node.$type;
}
