import { describe, it, expect } from 'vitest';
import { readGrammarNode } from '../../../src/grammar-reader.ts';
import { emitBuilder } from '../../../src/emitters/builder.ts';

describe('emitBuilder', () => {
  it('should emit builder class extending BaseBuilder for struct_item', () => {
    const meta = readGrammarNode('rust', 'struct_item');
    const source = emitBuilder({ grammar: 'rust', node: meta });
    expect(source).toContain('class StructBuilder extends BaseBuilder<StructItem>');
    expect(source).toContain('renderImpl(ctx?: RenderContext): string');
    expect(source).toContain(`build(ctx?: RenderContext): StructItem`);
  });

  it('should use Child type for constructor param', () => {
    const meta = readGrammarNode('rust', 'struct_item');
    const source = emitBuilder({ grammar: 'rust', node: meta });
    expect(source).toContain('constructor(name: Child)');
  });

  it('should generate fluent setters with Child type', () => {
    const meta = readGrammarNode('rust', 'function_item');
    const source = emitBuilder({ grammar: 'rust', node: meta });
    expect(source).toContain('returnType(value: Child): this');
    expect(source).toContain('body(value: Child): this');
  });

  it('should include render heuristics in renderImpl', () => {
    const meta = readGrammarNode('rust', 'struct_item');
    const source = emitBuilder({ grammar: 'rust', node: meta });
    expect(source).toContain("parts.push('struct')");
    expect(source).toContain('this.renderChild(this._name, ctx)');
  });

  it('should import from @sittir/types not @sittir/types + render/validate', () => {
    const meta = readGrammarNode('rust', 'struct_item');
    const source = emitBuilder({ grammar: 'rust', node: meta });
    expect(source).toContain("import { BaseBuilder } from '@sittir/types'");
    expect(source).not.toContain('renderImpl} from');
    expect(source).not.toContain('assertValidSync');
  });

  it('should emit short-name export function', () => {
    const meta = readGrammarNode('rust', 'use_declaration');
    const source = emitBuilder({ grammar: 'rust', node: meta });
    expect(source).toContain('export function use_(');
  });

  it('should not emit factory functions', () => {
    const meta = readGrammarNode('rust', 'struct_item');
    const source = emitBuilder({ grammar: 'rust', node: meta });
    expect(source).not.toContain('export function structItem(');
  });
});
