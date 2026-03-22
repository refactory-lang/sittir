import { describe, it, expect } from 'vitest';
import { readGrammarNode } from '../../../src/grammar-reader.ts';
import { emitBuilder } from '../../../src/emitters/builder.ts';

describe('emitBuilder', () => {
  it('should emit factory + builder for struct_item', () => {
    const meta = readGrammarNode('rust', 'struct_item');
    const source = emitBuilder({ grammar: 'rust', node: meta });
    expect(source).toContain('export function structItem(config: StructItemConfig): StructItem');
    expect(source).toContain('class StructBuilder implements BuilderTerminal<StructItem>');
    expect(source).toContain('build(): StructItem');
    expect(source).toContain('render(): string');
    expect(source).toContain('renderSilent(): string');
  });

  it('should use name as constructor param for struct_item', () => {
    const meta = readGrammarNode('rust', 'struct_item');
    const source = emitBuilder({ grammar: 'rust', node: meta });
    expect(source).toContain('constructor(name: string)');
  });

  it('should generate fluent setters for optional fields', () => {
    const meta = readGrammarNode('rust', 'function_item');
    const source = emitBuilder({ grammar: 'rust', node: meta });
    expect(source).toContain('returnType(');
    expect(source).toContain('body(');
  });

  it('should emit attribute_item builder with children in constructor', () => {
    const meta = readGrammarNode('rust', 'attribute_item');
    const source = emitBuilder({ grammar: 'rust', node: meta });
    expect(source).toContain('class AttributeBuilder');
    expect(source).toContain('export function attribute(');
  });

  it('should emit short-name export function', () => {
    const meta = readGrammarNode('rust', 'use_declaration');
    const source = emitBuilder({ grammar: 'rust', node: meta });
    expect(source).toContain('export function use_(');
  });
});
