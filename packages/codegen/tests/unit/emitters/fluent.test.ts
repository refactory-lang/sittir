import { describe, it, expect } from 'vitest';
import { emitFluent } from '../../../src/emitters/fluent.ts';

describe('emitFluent', () => {
  it('should emit ir namespace with branch and leaf builders', () => {
    const source = emitFluent({
      grammar: 'rust',
      nodeKinds: ['struct_item', 'function_item', 'use_declaration'],
      leafKinds: ['identifier', 'type_identifier'],
    });
    expect(source).toContain("import { struct_ } from './nodes/struct.js'");
    expect(source).toContain("import { fn } from './nodes/function.js'");
    expect(source).toContain("import { use_ } from './nodes/use.js'");
    expect(source).toContain("import { LeafBuilder } from '@sittir/types'");
    expect(source).toContain('export const ir =');
    expect(source).toContain('struct: struct_');
    expect(source).toContain('fn');
    expect(source).toContain('use: use_');
    // Leaf builders
    expect(source).toContain("identifier: (text: string) => new LeafBuilder('identifier', text)");
    expect(source).toContain("typeIdentifier: (text: string) => new LeafBuilder('type_identifier', text)");
  });
});
