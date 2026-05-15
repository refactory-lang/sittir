/**
 * compiler/generated-metadata.ts — late tree-sitter artifact metadata.
 *
 * Rule identity and classification are built earlier from Evaluate's rule
 * tree; generated IDs are a secondary layer and never participate in that
 * foundational catalog construction.
 */
import { type GeneratedMetadataCatalog, type KindParserMetadata, type RuleCatalog } from './types.ts';
/**
 * One row of the parser symbol catalog (KindID runtime migration design,
 * 2026-04-30). When `id` / `parser` are absent, the kind exists in the
 * codegen rule set but tree-sitter inlined it during parser compilation —
 * presence is `TSGrammar` only, not `TSInternals`. A row's mere existence
 * here is the canonical record of "this kind is reachable from the
 * grammar"; downstream code reads `parser` to discover whether it also
 * surfaces at runtime.
 */
export interface GeneratedIdEntry {
    readonly id?: number;
    /** Parser-origin metadata; absent iff the kind has no parser symbol. */
    readonly parser?: KindParserMetadata;
}
export type GeneratedIdTable = ReadonlyMap<string, number | GeneratedIdEntry> | Record<string, number | GeneratedIdEntry>;
export interface GeneratedIdTables {
    readonly kindIds?: GeneratedIdTable;
    readonly fieldIds?: GeneratedIdTable;
    readonly sourceArtifact: string;
}
export interface GeneratedKindEntry {
    readonly kind: string;
    readonly id: number;
    readonly symbolName?: string;
    readonly anon?: boolean;
}
export interface TreeSitterLanguageMetadata {
    readonly nodeTypeCount: number;
    readonly fieldCount: number;
    nodeTypeForId(id: number): string | null;
    nodeTypeIsVisible(id: number): boolean;
    nodeTypeIsNamed(id: number): boolean;
    fieldNameForId(id: number): string | null;
}
export declare function loadGeneratedIdTables(grammar: string): Promise<GeneratedIdTables | undefined>;
export declare function deriveGeneratedIdTablesFromLanguage(language: TreeSitterLanguageMetadata, sourceArtifact: string): GeneratedIdTables;
export declare function deriveGeneratedIdTablesFromParserCSource(source: string, sourceArtifact: string): Promise<GeneratedIdTables>;
export declare function deriveGeneratedMetadata(ruleCatalog: RuleCatalog, tables: GeneratedIdTables): GeneratedMetadataCatalog;
export declare function collectGeneratedKindEntries(tables: GeneratedIdTables | undefined): readonly GeneratedKindEntry[];
export declare function findGeneratedKindEntry(entries: readonly GeneratedKindEntry[], kind: string): GeneratedKindEntry | undefined;
//# sourceMappingURL=generated-metadata.d.ts.map