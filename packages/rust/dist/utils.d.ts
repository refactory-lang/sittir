import type { AnyNodeData, AnyTreeNodeOf, ByteRange, Edit } from '@sittir/types';
import type { BlockComment, LineComment, NamespaceMap } from './types.js';
import { hasKind, coerceBooleanKeywordStorage, coerceBitflagStorage } from '@sittir/common/utils';
export { hasKind, coerceBooleanKeywordStorage, coerceBitflagStorage };
export declare function isNodeData<K extends keyof NamespaceMap>(v: NamespaceMap[K]['Node'] | NamespaceMap[K]['Loose'] | NamespaceMap[K]['Tree']): v is NamespaceMap[K]['Node'];
export declare function isNodeData(v: unknown): v is AnyNodeData;
export declare function isTreeNode<K extends keyof NamespaceMap>(v: NamespaceMap[K]['Tree'] | NamespaceMap[K]['Node']): v is NamespaceMap[K]['Tree'];
export declare function isTreeNode(v: unknown): v is AnyTreeNodeOf;
export declare const methodsEngine: {
    render(node: AnyNodeData): string;
    toEdit(node: AnyNodeData, startOrRange: number | ByteRange, endPos?: number): Edit;
};
export declare function withMethods<T extends object>(node: T, engine: typeof methodsEngine): T & {
    $render(): string;
    $toEdit(startOrRange: number | ByteRange, endPos?: number): Edit;
    $replace(target: {
        range(): ByteRange;
    }): Edit;
    $trivia(...args: (BlockComment | LineComment | {
        leading?: (BlockComment | LineComment)[];
        trailing?: (BlockComment | LineComment)[];
    })[]): AnyNodeData;
};
export declare function isNodeOfKind<K extends keyof NamespaceMap>(v: unknown, kind: K): v is NamespaceMap[K]['Node'];
export declare function hasKindOf<K extends keyof NamespaceMap>(v: object, kind: K): v is {
    kind: K;
} & NamespaceMap[K]['Loose'];
/**
 * @deprecated Native transport projection is a no-op. Wrap already projects
 * read nodes into transport shape, and factories already store transport-shaped
 * data at construction time.
 */
export declare function toNativeRenderTransport(node: unknown): unknown;
export declare function coerceKindEnumStorage<T = unknown>(value: unknown, byText?: readonly (readonly [string, number])[]): T;
//# sourceMappingURL=utils.d.ts.map