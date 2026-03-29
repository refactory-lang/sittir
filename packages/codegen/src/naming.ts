/**
 * Naming conventions for converting tree-sitter grammar node kinds
 * to TypeScript identifiers.
 *
 * Also contains pipeline Step 10 functions: applyNaming, nameModel, nameField.
 */

import type { NodeModel, FieldModel } from './node-model.ts';
import { isBranch, isContainer } from './node-model.ts';

const SUFFIXES = ['_item'] as const;

const JS_RESERVED = new Set([
  'if', 'for', 'while', 'class', 'import', 'export', 'type', 'in', 'do',
  'switch', 'return', 'break', 'continue', 'default', 'new', 'delete',
  'throw', 'try', 'catch', 'finally', 'with', 'yield', 'super', 'this',
  'void', 'typeof', 'instanceof', 'enum', 'const', 'let', 'var',
  'function', 'extends', 'implements', 'interface', 'package', 'private',
  'protected', 'public', 'static', 'struct', 'use', 'arguments', 'await',
  'eval', 'abstract', 'true', 'false', 'null', 'undefined',
]);

const SHORT_NAME_ALIASES: Record<string, string> = {};

/** Convert snake_case to camelCase */
function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Convert snake_case to PascalCase */
function snakeToPascal(s: string): string {
  const camel = snakeToCamel(s);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/** Strip known suffixes from a kind string */
function stripSuffix(kind: string): string {
  for (const suffix of SUFFIXES) {
    if (kind.endsWith(suffix)) {
      return kind.slice(0, -suffix.length);
    }
  }
  return kind;
}

/** snake_case to camelCase: `struct_item` -> `structItem` */
export function toFactoryName(kind: string): string {
  const name = snakeToCamel(kind);
  if (JS_RESERVED.has(name)) {
    return name + '_';
  }
  return name;
}

/**
 * Raw kind name + trailing underscore for factory function names.
 * All factories get the suffix uniformly — no reserved-word special cases.
 * Assign uses `factories[kind + '_']` for dynamic lookup.
 */
export function toRawFactoryName(kind: string): string {
  return kind + '_';
}

/** snake_case to PascalCase: `struct_item` -> `StructItem` */
export function toTypeName(kind: string): string {
  return snakeToPascal(kind);
}

/** Strip suffix, PascalCase + "Builder": `struct_item` -> `StructBuilder` */
export function toBuilderClassName(kind: string): string {
  return snakeToPascal(stripSuffix(kind)) + 'Builder';
}

/**
 * Ergonomic short name for fluent API.
 * Uses hardcoded aliases for common kinds, strips suffixes,
 * and appends `_` if the result is a JS reserved word.
 */
export function toShortName(kind: string): string {
  if (SHORT_NAME_ALIASES[kind] !== undefined) {
    return SHORT_NAME_ALIASES[kind];
  }
  const shortName = stripSuffix(kind);
  if (JS_RESERVED.has(shortName)) {
    return shortName + '_';
  }
  return shortName;
}

/**
 * CamelCase ir namespace property key.
 * Strips suffixes, applies aliases, converts to camelCase.
 * `struct_item` -> `struct`, `array_type` -> `arrayType`, `function_item` -> `fn`
 */
export function toIrKey(kind: string): string {
  const short = toShortName(kind);
  const base = short.endsWith('_') ? short.slice(0, -1) : short;
  return snakeToCamel(base);
}

/** kebab-case without suffix: `struct_item` -> `struct` */
export function toFileName(kind: string): string {
  const stripped = stripSuffix(kind);
  return stripped.replace(/_/g, '-');
}

/** PascalCase + "Types": `rust` -> `RustTypes` */
export function toGrammarTypeName(grammar: string): string {
  return snakeToPascal(grammar) + 'Types';
}

/** snake_case to camelCase: `return_type` -> `returnType` */
export function toFieldName(field: string): string {
  return snakeToCamel(field);
}

/**
 * Convert a field name to a safe parameter/variable name.
 * Like toFieldName but also escapes JS reserved words with trailing underscore.
 */
export function toParamName(field: string): string {
  const name = snakeToCamel(field);
  if (JS_RESERVED.has(name)) {
    return name + '_';
  }
  return name;
}

/**
 * Resolve file names for a set of kinds, falling back to full kebab-case
 * when suffix stripping would cause collisions.
 *
 * @returns Map from kind -> file name (without extension)
 */
export function resolveFileNames(kinds: string[]): Map<string, string> {
  // First pass: try stripped names
  const strippedToKinds = new Map<string, string[]>();
  for (const kind of kinds) {
    const stripped = toFileName(kind);
    if (!strippedToKinds.has(stripped)) strippedToKinds.set(stripped, []);
    strippedToKinds.get(stripped)!.push(kind);
  }

  // Second pass: for collisions, use full kebab-case
  const result = new Map<string, string>();
  for (const [stripped, colliding] of strippedToKinds) {
    if (colliding.length === 1) {
      result.set(colliding[0]!, stripped);
    } else {
      for (const kind of colliding) {
        result.set(kind, kind.replace(/_/g, '-'));
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Pipeline Step 10: applyNaming
// ---------------------------------------------------------------------------

/**
 * Compute typeName (PascalCase) and factoryName (camelCase) on each model.
 * Compute propertyName (camelCase) on each field.
 */
export function applyNaming(models: Map<string, NodeModel>): void {
  for (const model of models.values()) {
    nameModel(model);
    if (isBranch(model)) {
      for (const field of model.fields) nameField(field);
    }
  }
}

function nameModel(model: NodeModel): void {
  const kind = model.kind.replace(/^_/, '');
  model.typeName = snakeToPascal(kind);
  model.factoryName = toFactoryName(kind);
}

function nameField(field: FieldModel): void {
  field.propertyName = snakeToCamel(field.name);
}
