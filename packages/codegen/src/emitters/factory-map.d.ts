/**
 * Emits factory-map.json5 — validator-only factory metadata.
 *
 * Three maps consumed by `validate-factory-roundtrip` / `validate-from` /
 * `nodeToConfig` to dispatch factories correctly against readNode
 * output. They live in JSON5 (and not inside `factories.ts`) because:
 *
 *   1. They're pure data — no function references or type dependencies.
 *   2. Users constructing AST via factories never need them; only the
 *      validator harness does.
 *   3. Keeping them out of `factories.ts` tightens the user-facing
 *      surface and lets the emitter stay focused on factory emission.
 *
 * The function-valued `_factoryMap` stays in `factories.ts` — it can't
 * round-trip through JSON.
 */
import type { NodeMap } from '../compiler/types.ts';
import type { FactoryShape } from './shared.ts';
import type { PolymorphVariantMap } from '../polymorph-variant.ts';
export interface EmitFactoryMapConfig {
    grammar: string;
    nodeMap: NodeMap;
}
export type { FactoryShape } from './shared.ts';
export interface FactorySlotMeta {
    readonly unnamed: boolean;
    readonly slotCount: number;
    readonly required: boolean;
    readonly multiple: boolean;
    readonly nonEmpty: boolean;
}
export interface FactoryMapData {
    readonly factoryShapes: Readonly<Record<string, FactoryShape>>;
    readonly fieldAliasMap: Readonly<Record<string, Readonly<Record<string, string>>>>;
    readonly factoryFields: Readonly<Record<string, readonly string[]>>;
    readonly factorySlots: Readonly<Record<string, Readonly<Record<string, FactorySlotMeta>>>>;
    /**
     * Polymorph variant discriminators. For each polymorph parent kind a
     * descriptor telling `nodeToConfig` how to stamp `$variant` on the
     * derived config.
     *
     *   source='override' — variant inferred from the first named child's
     *     kind. The `childKind` map is `<parent_childKind>: <variantName>`.
     *   source='promoted' — variant inferred from field-presence. The
     *     `fields` map is `<variantName>: [<fieldPropertyName>...]`
     *     (match if every listed field is present on the config).
     *
     * The dispatcher's switch on `config.$variant` expects the tag to be
     * present; validators and legacy readNode→factory paths use this map
     * to derive it from the parsed tree.
     */
    readonly polymorphVariants: PolymorphVariantMap;
}
export declare function buildFactoryMap(nodeMap: NodeMap): FactoryMapData;
export declare function emitFactoryMap(config: EmitFactoryMapConfig): string;
export declare function expandRuntimeDiscriminatorKinds(discriminatorKinds: readonly string[], nodeMap: NodeMap): string[];
//# sourceMappingURL=factory-map.d.ts.map