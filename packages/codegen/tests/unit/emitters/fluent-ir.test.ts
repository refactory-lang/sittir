import { describe, it, expect } from 'vitest';
import { emitFluentIr } from '../../../src/emitters/fluent-ir.ts';
import { emitFluent } from '../../../src/emitters/fluent.ts';

describe('emitFluentIr', () => {
  const config = {
    grammar: 'rust',
    nodeKinds: ['struct_item', 'function_item', 'use_declaration'],
    leafKinds: ['identifier', 'type_identifier'],
  };

  it('should emit ir namespace with branch and leaf builders', () => {
    const source = emitFluentIr(config);

    // Imports
    expect(source).toContain("import { struct_ } from './nodes/struct.js'");
    expect(source).toContain("import { function_ } from './nodes/function.js'");
    expect(source).toContain("import { use_declaration } from './nodes/use-declaration.js'");
    expect(source).toContain("import { LeafBuilder } from '@sittir/types'");

    // ir namespace declaration
    expect(source).toContain('export const ir =');

    // Branch builder entries (irKey: importBinding)
    expect(source).toContain('struct');
    expect(source).toContain('struct_');
    expect(source).toContain('function_');
    expect(source).toContain('useDeclaration');
    expect(source).toContain('use_declaration');

    // Leaf builders
    expect(source).toContain("identifier");
    expect(source).toContain("new LeafBuilder('identifier', text)");
    expect(source).toContain("typeIdentifier");
    expect(source).toContain("new LeafBuilder('type_identifier', text)");
  });

  it('should match old emitter key fragments', () => {
    const oldOutput = emitFluent(config);
    const newOutput = emitFluentIr(config);

    // Both should contain the same key fragments
    for (const fragment of [
      'struct_',
      'function_',
      'use_declaration',
      'LeafBuilder',
      '@sittir/types',
      'identifier',
      'typeIdentifier',
      'export const ir',
      'as const',
    ]) {
      expect(newOutput).toContain(fragment);
      expect(oldOutput).toContain(fragment);
    }
  });
});
