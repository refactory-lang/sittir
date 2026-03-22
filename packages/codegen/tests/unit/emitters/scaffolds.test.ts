import { describe, it, expect } from 'vitest';
import { emitRenderScaffold } from '../../../src/emitters/render-scaffold.ts';
import { emitValidate, emitValidateFast } from '../../../src/emitters/validate.ts';
import { emitRenderValid } from '../../../src/emitters/render-valid.ts';
import { emitConfig } from '../../../src/emitters/config.ts';
import { emitTest } from '../../../src/emitters/test.ts';
import type { NodeMeta } from '../../../src/grammar-reader.ts';

const sampleNodes: NodeMeta[] = [
  {
    kind: 'struct_item',
    fields: [
      { name: 'name', required: true, multiple: false, types: ['type_identifier'] },
      { name: 'body', required: true, multiple: false, types: ['field_declaration_list'] },
    ],
    hasChildren: false,
  },
  {
    kind: 'function_item',
    fields: [
      { name: 'name', required: true, multiple: false, types: ['identifier'] },
      { name: 'parameters', required: true, multiple: false, types: ['parameters'] },
      { name: 'body', required: true, multiple: false, types: ['block'] },
    ],
    hasChildren: false,
  },
];

describe('emitRenderScaffold', () => {
  it('should import the union type from types.ts', () => {
    const source = emitRenderScaffold({ grammar: 'rust', nodes: sampleNodes });
    expect(source).toContain("import type { RustIrNode } from './types.js'");
  });

  it('should contain the indent helper', () => {
    const source = emitRenderScaffold({ grammar: 'rust', nodes: sampleNodes });
    expect(source).toContain('export function indent(');
  });

  it('should contain renderSilent with switch cases', () => {
    const source = emitRenderScaffold({ grammar: 'rust', nodes: sampleNodes });
    expect(source).toContain('export function renderSilent(node: RustIrNode): string');
    expect(source).toContain("case 'struct_item':");
    expect(source).toContain("case 'function_item':");
    // Render cases now contain heuristic-based implementations instead of TODOs
    expect(source).toContain('renderChild');
    expect(source).toContain("parts.push('struct')");
    expect(source).toContain("parts.push('function')");
  });

  it('should contain render function calling assertValid', () => {
    const source = emitRenderScaffold({ grammar: 'rust', nodes: sampleNodes });
    expect(source).toContain('export function render(node: RustIrNode): string');
    expect(source).toContain('assertValid(renderSilent(node))');
  });

  it('should import assertValid from validate-fast', () => {
    const source = emitRenderScaffold({ grammar: 'rust', nodes: sampleNodes });
    expect(source).toContain("import { assertValid } from './validate-fast.js'");
  });

  it('should work for a different grammar', () => {
    const source = emitRenderScaffold({ grammar: 'go', nodes: [sampleNodes[0]] });
    expect(source).toContain('GoIrNode');
  });
});

describe('emitValidate', () => {
  it('should import from codemod:ast-grep', () => {
    const source = emitValidate({ grammar: 'rust' });
    expect(source).toContain("import { parse } from 'codemod:ast-grep/rust'");
  });

  it('should export validate function', () => {
    const source = emitValidate({ grammar: 'rust' });
    expect(source).toContain('export function validate(source: string): ValidationResult');
  });

  it('should export assertValid function', () => {
    const source = emitValidate({ grammar: 'rust' });
    expect(source).toContain('export function assertValid(source: string): string');
  });

  it('should check for ERROR nodes', () => {
    const source = emitValidate({ grammar: 'rust' });
    expect(source).toContain('ERROR');
  });
});

describe('emitValidateFast', () => {
  it('should export validate function', () => {
    const source = emitValidateFast({ grammar: 'rust' });
    expect(source).toContain('export function validate(source: string): ValidationResult');
  });

  it('should export assertValid function', () => {
    const source = emitValidateFast({ grammar: 'rust' });
    expect(source).toContain('export function assertValid(source: string): string');
  });

  it('should check brace matching', () => {
    const source = emitValidateFast({ grammar: 'rust' });
    expect(source).toContain('Mismatched braces');
  });

  it('should check paren matching', () => {
    const source = emitValidateFast({ grammar: 'rust' });
    expect(source).toContain('Mismatched parens');
  });

  it('should check bracket matching', () => {
    const source = emitValidateFast({ grammar: 'rust' });
    expect(source).toContain('Mismatched brackets');
  });

  it('should contain TODO for language-specific keyword checks', () => {
    const source = emitValidateFast({ grammar: 'rust' });
    expect(source).toContain('TODO: add rust-specific keyword checks');
  });
});

describe('emitRenderValid', () => {
  it('should import renderSilent from render.ts', () => {
    const source = emitRenderValid({ grammar: 'rust' });
    expect(source).toContain("import { renderSilent } from './render.js'");
  });

  it('should import assertValid from validate-fast.ts', () => {
    const source = emitRenderValid({ grammar: 'rust' });
    expect(source).toContain("import { assertValid } from './validate-fast.js'");
  });

  it('should export render function', () => {
    const source = emitRenderValid({ grammar: 'rust' });
    expect(source).toContain('export function render(node: RustIrNode): string');
  });

  it('should import the union type', () => {
    const source = emitRenderValid({ grammar: 'rust' });
    expect(source).toContain("import type { RustIrNode } from './types.js'");
  });
});

describe('emitConfig', () => {
  it('should import defineConfig from vitest', () => {
    const source = emitConfig({ grammar: 'rust' });
    expect(source).toContain("import { defineConfig } from 'vitest/config'");
  });

  it('should contain ast-grep alias', () => {
    const source = emitConfig({ grammar: 'rust' });
    expect(source).toContain("'codemod:ast-grep/rust'");
    expect(source).toContain('ast-grep-rust.ts');
  });

  it('should include test config', () => {
    const source = emitConfig({ grammar: 'rust' });
    expect(source).toContain("include: ['tests/**/*.test.ts']");
  });
});

describe('emitTest', () => {
  const node: NodeMeta = sampleNodes[0];

  it('should import the factory function', () => {
    const source = emitTest({ grammar: 'rust', node });
    expect(source).toContain("import { structItem } from '../src/nodes/struct.js'");
  });

  it('should import the fluent API', () => {
    const source = emitTest({ grammar: 'rust', node });
    expect(source).toContain("import { ir } from '../src/fluent.js'");
  });

  it('should contain a factory build test', () => {
    const source = emitTest({ grammar: 'rust', node });
    expect(source).toContain('should create a struct_item node via factory');
    expect(source).toContain("expect(node.kind).toBe('struct_item')");
  });

  it('should contain a fluent API build test', () => {
    const source = emitTest({ grammar: 'rust', node });
    expect(source).toContain('should create a struct_item node via fluent API');
    expect(source).toContain('ir.struct_(');
  });

  it('should contain a kind check test', () => {
    const source = emitTest({ grammar: 'rust', node });
    expect(source).toContain('should have the correct kind');
  });

  it('should include required fields in minimal config', () => {
    const source = emitTest({ grammar: 'rust', node });
    expect(source).toContain("name: '' /* TODO */");
    expect(source).toContain("body: '' /* TODO */");
  });
});
