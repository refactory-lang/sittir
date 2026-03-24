/**
 * Emits test files for IR node kinds.
 * - Per-node tests (emitTest): builder-only API verifying build(), renderImpl(), toCST(), render('fast')
 * - Leaf tests (emitLeafTests): verifies LeafBuilder.build() returns objects (not strings) with correct kind
 */

import type { NodeMeta, FieldMeta } from '../grammar-reader.ts';
import { collectRequiredTokens, listLeafKinds, listNamedKeywords, listNodeKinds, listSupertypes, readGrammarNode } from '../grammar-reader.ts';
import { toShortName, toIrKey, toFieldName, toFactoryName } from '../naming.ts';
import { selectConstructorField } from './builder.ts';

export interface EmitTestConfig {
  grammar: string;
  node: NodeMeta;
  fileName?: string;
  irPropertyKey?: string;
  /** Import path for the builder module (default: '../src/builder.js') */
  sourceImportPath?: string;
}

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Resolve the ir namespace property key for a node kind, matching fluent emitter logic. */
function resolveIrKey(kind: string, irKeyCounts: Map<string, number>): string {
  const key = toIrKey(kind);
  const isDuplicate = (irKeyCounts.get(key) ?? 0) > 1;
  return isDuplicate ? toFactoryName(kind) : key;
}

/**
 * Generate a type-safe constructor argument expression for a field.
 * Returns e.g. `ir.identifier('test')` for leaf fields,
 * `ir.block()` for branch fields, or `ir.identifier('test') as any` as fallback.
 * Recursively resolves constructor args for node kinds (up to depth limit).
 */
interface CtorArgContext {
  grammar: string;
  leafKinds: Set<string>;
  /** Named keywords — leaf kinds with fixed text (zero-arg factories). */
  keywords: Set<string>;
  nodeKinds: Set<string>;
  supertypeMap: Map<string, string[]>;
  irKeyCounts: Map<string, number>;
  branchKeys: Set<string>;
}

function buildCtorArgContext(grammar: string): CtorArgContext {
  const nodeKindsList = listNodeKinds(grammar);
  const irKeyCounts = new Map<string, number>();
  for (const kind of nodeKindsList) {
    const key = toIrKey(kind);
    irKeyCounts.set(key, (irKeyCounts.get(key) ?? 0) + 1);
  }
  // Build the set of branch node property keys (same as fluent emitter)
  const branchKeys = new Set<string>();
  for (const kind of nodeKindsList) {
    const key = toIrKey(kind);
    const isDuplicate = (irKeyCounts.get(key) ?? 0) > 1;
    branchKeys.add(isDuplicate ? toFactoryName(kind) : key);
  }
  return {
    grammar,
    leafKinds: new Set(listLeafKinds(grammar)),
    keywords: new Set(listNamedKeywords(grammar).keys()),
    nodeKinds: new Set(nodeKindsList),
    supertypeMap: new Map(listSupertypes(grammar).map(st => [st.name, st.subtypes])),
    irKeyCounts,
    branchKeys,
  };
}

function buildCtorArg(
  field: FieldMeta | { namedTypes: string[]; multiple: boolean },
  ctx: CtorArgContext,
  depth = 0,
): string {
  if (depth > 3) return `ir.identifier('test') as any`;

  // Expand namedTypes: replace supertypes with their subtypes
  const expandedTypes: string[] = [];
  for (const nt of field.namedTypes) {
    const subtypes = ctx.supertypeMap.get(nt);
    if (subtypes) {
      expandedTypes.push(...subtypes);
    } else {
      expandedTypes.push(nt);
    }
  }

  // Prefer leaf kinds (simplest possible expression)
  for (const nt of expandedTypes) {
    if (ctx.leafKinds.has(nt)) {
      const leafKey = resolveLeafIrKey(nt, ctx.branchKeys);
      if (leafKey) {
        // Keywords are zero-arg; other leaves take 'test'
        return ctx.keywords.has(nt) ? `ir.${leafKey}()` : `ir.${leafKey}('test')`;
      }
    }
  }

  // Then node kinds, preferring ones that don't require constructor args
  for (const nt of expandedTypes) {
    if (ctx.nodeKinds.has(nt)) {
      try {
        const nodeMeta = readGrammarNode(ctx.grammar, nt);
        const ctorParam = selectConstructorField(nodeMeta, ctx.grammar);
        if (!ctorParam) {
          return `ir.${resolveIrKey(nt, ctx.irKeyCounts)}()`;
        }
      } catch { /* continue */ }
    }
  }

  // Finally, node kinds that require constructor args (recurse)
  for (const nt of expandedTypes) {
    if (ctx.nodeKinds.has(nt)) {
      return buildNodeExpr(nt, ctx, depth);
    }
  }

  // Fallback — unresolvable type
  return `ir.identifier('test') as any`;
}

/** Build an expression for a node kind, recursively resolving its constructor arg if needed. */
function buildNodeExpr(kind: string, ctx: CtorArgContext, depth: number): string {
  const irKey = resolveIrKey(kind, ctx.irKeyCounts);

  // Check if this node kind requires a constructor arg
  try {
    const nodeMeta = readGrammarNode(ctx.grammar, kind);
    const ctorParam = selectConstructorField(nodeMeta, ctx.grammar);
    if (ctorParam) {
      let innerArg: string;
      if (ctorParam.source === 'children') {
        const childMeta = nodeMeta.children ?? { namedTypes: [], multiple: false };
        innerArg = buildCtorArg(childMeta, ctx, depth + 1);
      } else {
        const field = nodeMeta.fields.find(f => f.name === ctorParam.name);
        if (field) {
          innerArg = buildCtorArg(field, ctx, depth + 1);
        } else {
          innerArg = '';
        }
      }
      return innerArg ? `ir.${irKey}(${innerArg})` : `ir.${irKey}()`;
    }
  } catch {
    // Grammar node not found — fall through
  }

  return `ir.${irKey}()`;
}

export function emitTest(config: EmitTestConfig): string {
  const { grammar, node } = config;
  const shortName = toShortName(node.kind);

  const irKey = config.irPropertyKey ?? (shortName.endsWith('_') ? shortName.slice(0, -1) : shortName);

  const argCtx = buildCtorArgContext(grammar);
  const ctorParam = selectConstructorField(node, grammar);
  let ctorArg = '';
  if (ctorParam) {
    if (ctorParam.source === 'children') {
      const childMeta = node.children ?? { namedTypes: [], multiple: false };
      const arg = buildCtorArg(childMeta, argCtx);
      ctorArg = childMeta.multiple ? `${arg}, ${arg}` : arg;
    } else {
      const field = node.fields.find(f => f.name === ctorParam.name);
      if (field) {
        const arg = buildCtorArg(field, argCtx);
        ctorArg = field.multiple ? `${arg}, ${arg}` : arg;
      }
    }
  }

  const requiredTokens = collectRequiredTokens(grammar, node.kind);

  const lines: string[] = [];

  lines.push(`import { describe, it, expect } from 'vitest';`);
  const importPath = config.sourceImportPath ?? '../src/builder.js';
  lines.push(`import { ir } from '${importPath}';`);
  lines.push('');

  lines.push(`describe('${node.kind}', () => {`);

  // Build test — verify kind and constructor field structure
  lines.push(`  it('should build with correct kind', () => {`);
  lines.push(`    const builder = ir.${irKey}(${ctorArg});`);
  lines.push(`    const node = builder.build();`);
  lines.push(`    expect(node.kind).toBe('${node.kind}');`);

  // Assert constructor field value is a built node (not a rendered string)
  if (ctorParam) {
    if (ctorParam.source === 'field' && ctorParam.name !== 'kind') {
      const fieldName = toFieldName(ctorParam.name);
      const field = node.fields.find(f => f.name === ctorParam.name);
      if (field?.multiple) {
        lines.push(`    expect(Array.isArray((node as any).${fieldName})).toBe(true);`);
        lines.push(`    expect((node as any).${fieldName}.length).toBeGreaterThan(0);`);
        lines.push(`    expect((node as any).${fieldName}[0]).toHaveProperty('kind');`);
      } else {
        lines.push(`    expect((node as any).${fieldName}).toHaveProperty('kind');`);
      }
    } else if (ctorParam.source === 'children') {
      if (node.children?.multiple) {
        lines.push(`    expect(Array.isArray((node as any).children)).toBe(true);`);
        lines.push(`    expect((node as any).children.length).toBeGreaterThan(0);`);
        lines.push(`    expect((node as any).children[0]).toHaveProperty('kind');`);
      } else {
        lines.push(`    expect((node as any).children).toHaveProperty('kind');`);
      }
    }
  }

  lines.push('  });');
  lines.push('');

  // Token assertion test (only when builder has required content to render tokens around)
  if (requiredTokens.length > 0 && ctorParam) {
    lines.push(`  it('should render required grammar tokens', () => {`);
    lines.push(`    const builder = ir.${irKey}(${ctorArg});`);
    lines.push(`    const source = builder.renderImpl();`);
    for (const token of requiredTokens) {
      lines.push(`    expect(source).toContain('${escapeString(token)}');`);
    }
    lines.push('  });');
    lines.push('');
  }

  // CST test
  lines.push(`  it('should produce a valid CST node', () => {`);
  lines.push(`    const builder = ir.${irKey}(${ctorArg});`);
  lines.push(`    const cst = builder.toCST();`);
  lines.push(`    expect(cst.type).toBe('${node.kind}');`);
  lines.push(`    expect(cst.isNamed).toBe(true);`);
  lines.push(`    expect(cst.startIndex).toBe(0);`);
  lines.push(`    expect(cst.endIndex).toBe(cst.text.length);`);
  lines.push('  });');
  lines.push('');

  // Fast validation test
  lines.push(`  it('should pass fast validation', () => {`);
  lines.push(`    const builder = ir.${irKey}(${ctorArg});`);
  lines.push(`    expect(() => builder.render('fast')).not.toThrow();`);
  lines.push('  });');

  lines.push('});');
  lines.push('');

  return lines.join('\n');
}

export interface EmitLeafTestsConfig {
  leafKinds: string[];
  nodeKinds: string[];
  /** Named keywords — zero-arg leaf factories. */
  keywords?: Set<string>;
  /** Import path for the builder module (default: '../src/builder.js') */
  sourceImportPath?: string;
}

/**
 * Resolve the ir namespace property key for a leaf kind,
 * matching the fluent emitter's collision-aware logic.
 */
function resolveLeafIrKey(kind: string, usedKeys: Set<string>): string | null {
  let propName = toIrKey(kind);

  if (usedKeys.has(propName)) {
    propName = toFactoryName(kind);
    if (usedKeys.has(propName)) return null;
  }
  return propName;
}

/**
 * Emit a single test file covering all leaf kinds.
 * Verifies that LeafBuilder.build() returns `{ kind: K }` objects — not strings.
 * This catches regressions if ExpandOneKind reverts to LeafBrand (branded strings).
 */
export function emitLeafTests(config: EmitLeafTestsConfig): string {
  const importPath = config.sourceImportPath ?? '../src/builder.js';

  // Build the same usedPropertyKeys set as the fluent emitter
  const irKeyCounts = new Map<string, number>();
  for (const kind of config.nodeKinds) {
    const key = toIrKey(kind);
    irKeyCounts.set(key, (irKeyCounts.get(key) ?? 0) + 1);
  }
  const usedKeys = new Set<string>();
  for (const kind of config.nodeKinds) {
    const key = toIrKey(kind);
    const isDuplicate = (irKeyCounts.get(key) ?? 0) > 1;
    usedKeys.add(isDuplicate ? toFactoryName(kind) : key);
  }

  const lines: string[] = [];

  lines.push(`import { describe, it, expect } from 'vitest';`);
  lines.push(`import { ir } from '${importPath}';`);
  lines.push(`import { LeafBuilder } from '@sittir/types';`);
  lines.push('');

  lines.push(`describe('leaf nodes', () => {`);

  // Test that LeafBuilder.build() returns objects, not strings
  lines.push(`  it('build() should return an object with kind, not a string', () => {`);
  lines.push(`    const leaf = new LeafBuilder('identifier', 'test');`);
  lines.push(`    const node = leaf.build();`);
  lines.push(`    expect(typeof node).toBe('object');`);
  lines.push(`    expect(node).not.toBeNull();`);
  lines.push(`    expect(node).toHaveProperty('kind', 'identifier');`);
  lines.push(`    expect(typeof node).not.toBe('string');`);
  lines.push('  });');
  lines.push('');

  // Test each leaf kind via ir namespace
  for (const kind of config.leafKinds) {
    const propName = resolveLeafIrKey(kind, usedKeys);
    if (!propName) continue;
    const isKeyword = config.keywords?.has(kind) ?? false;
    lines.push(`  it('ir.${propName}() should build a { kind } object', () => {`);
    lines.push(`    const builder = ${isKeyword ? `ir.${propName}()` : `ir.${propName}('test')`};`);
    lines.push(`    const node = builder.build();`);
    lines.push(`    expect(typeof node).toBe('object');`);
    lines.push(`    expect(node).toHaveProperty('kind', '${kind}');`);
    lines.push('  });');
    lines.push('');
  }

  // Test renderImpl returns the text
  lines.push(`  it('renderImpl() should return the leaf text', () => {`);
  lines.push(`    const leaf = new LeafBuilder('identifier', 'hello');`);
  lines.push(`    expect(leaf.renderImpl()).toBe('hello');`);
  lines.push('  });');
  lines.push('');

  // Test toCST
  lines.push(`  it('toCST() should produce a valid CST node', () => {`);
  lines.push(`    const leaf = new LeafBuilder('identifier', 'test');`);
  lines.push(`    const cst = leaf.toCST();`);
  lines.push(`    expect(cst.type).toBe('identifier');`);
  lines.push(`    expect(cst.isNamed).toBe(true);`);
  lines.push(`    expect(cst.text).toBe('test');`);
  lines.push('  });');

  lines.push('});');
  lines.push('');

  return lines.join('\n');
}
