import { describe, it, expect } from 'vitest';
import { readGrammarNode, listNodeKinds, listLeafKinds, listSupertypes } from '../../../src/grammar-reader.ts';
import { emitBuilder } from '../../../src/emitters/builder.ts';

const nodeKinds = listNodeKinds('rust');
const leafKinds = listLeafKinds('rust');
const supertypes = listSupertypes('rust');

function emit(kind: string) {
  const meta = readGrammarNode('rust', kind);
  return emitBuilder({ grammar: 'rust', node: meta, nodeKinds, leafKinds, supertypes });
}

describe('emitBuilder', () => {
  it('should emit builder class extending Builder for struct_item', () => {
    const source = emit('struct_item');
    expect(source).toContain('class StructBuilder extends Builder<StructItem>');
    expect(source).toContain('renderImpl(ctx?: RenderContext): string');
    expect(source).toContain(`build(ctx?: RenderContext): StructItem`);
  });

  it('should use wide Builder type for constructor and setters (precise types on .from())', () => {
    const source = emit('struct_item');
    expect(source).toContain('constructor(name: Builder)');
  });

  it('should generate fluent setters with wide Builder type', () => {
    const source = emit('function_item');
    expect(source).toContain('returnType(value: Builder): this');
  });

  it('should use rest params for multiple fields', () => {
    const source = emit('ordered_field_declaration_list');
    // type field is multiple → rest params
    expect(source).toMatch(/type\(\.\.\.value:/);
  });

  it('should include render heuristics in renderImpl', () => {
    const source = emit('struct_item');
    expect(source).toContain("parts.push('struct')");
    expect(source).toContain('this.renderChild(this._name, ctx)');
  });

  it('should import from @sittir/types not @sittir/types + render/validate', () => {
    const source = emit('struct_item');
    // struct_item has leaf-typed fields (name: type_identifier) so LeafBuilder is imported
    expect(source).toContain("from '@sittir/types'");
    expect(source).not.toContain('renderImpl} from');
    expect(source).not.toContain('assertValidSync');
  });

  it('should import referenced types from types.js', () => {
    const source = emit('struct_item');
    expect(source).toMatch(/import type \{.*StructItem.*\} from '\.\.\/types\.js'/);
  });

  it('should export builder type', () => {
    const source = emit('struct_item');
    expect(source).toContain('export type { StructBuilder }');
  });

  it('should emit short-name export function', () => {
    const source = emit('use_declaration');
    expect(source).toContain('export function use_(');
  });

  it('should not emit factory functions', () => {
    const source = emit('struct_item');
    expect(source).not.toContain('export function structItem(');
  });

  it('should emit options interface for .from() API', () => {
    const source = emit('struct_item');
    expect(source).toContain('export interface StructItemOptions');
    // name field is required (type_identifier → leaf → accepts string)
    expect(source).toMatch(/name: Builder<TypeIdentifier> \| string/);
  });

  it('should emit namespace with .from() method', () => {
    const source = emit('struct_item');
    expect(source).toContain('export namespace struct_');
    expect(source).toContain('export function from(options: StructItemOptions): StructBuilder');
  });

  it('should resolve strings to LeafBuilder in .from() for leaf-typed fields', () => {
    const source = emit('struct_item');
    // Constructor field 'name' is type_identifier (leaf) → string resolution
    expect(source).toContain("new LeafBuilder('type_identifier'");
  });

  it('should normalize arrays in .from() for multiple fields', () => {
    const source = emit('ordered_field_declaration_list');
    // type is multiple → Array.isArray normalization
    expect(source).toContain('Array.isArray');
  });

  it('should import LeafBuilder when .from() has leaf-typed fields', () => {
    const source = emit('struct_item');
    expect(source).toContain("import { Builder, LeafBuilder } from '@sittir/types'");
  });

  it('should not import LeafBuilder when no leaf-typed fields exist', () => {
    const source = emit('if_expression');
    // if_expression fields are all branch types (no single leaf kind)
    expect(source).toContain("import { Builder } from '@sittir/types'");
    expect(source).not.toContain('LeafBuilder');
  });
});
