import { describe, it, expect } from 'vitest';
import { emitTypes } from '../../../src/emitters/types.ts';

describe('emitTypes', () => {
  it('should emit types for rust struct_item and function_item', () => {
    const source = emitTypes({ grammar: 'rust', nodeKinds: ['struct_item', 'function_item'] });
    expect(source).toContain("import type RustTypes from '@codemod.com/jssg-types/langs/rust'");
    expect(source).toContain('export type RustGrammar = RustTypes');
    expect(source).toContain("export type StructItem = NodeType<RustGrammar, 'struct_item'>");
    expect(source).toContain('export type StructItemConfig = BuilderConfig<RustGrammar, StructItem>');
    expect(source).toContain("export type FunctionItem = NodeType<RustGrammar, 'function_item'>");
    expect(source).toContain('export type RustIrNode =');
    expect(source).toContain('| StructItem');
    expect(source).toContain("export type { ValidationResult }");
  });

  it('should work for go grammar', () => {
    const source = emitTypes({ grammar: 'go', nodeKinds: ['function_declaration'] });
    expect(source).toContain("import type GoTypes from '@codemod.com/jssg-types/langs/go'");
    expect(source).toContain('export type GoGrammar = GoTypes');
    expect(source).toContain('export type GoIrNode =');
  });
});
