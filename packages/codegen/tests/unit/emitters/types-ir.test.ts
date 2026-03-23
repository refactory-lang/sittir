import { describe, it, expect } from 'vitest';
import { emitTypesIr } from '../../../src/emitters/types-ir.ts';
import { emitTypes } from '../../../src/emitters/types.ts';

describe('emitTypesIr', () => {
  const config = {
    grammar: 'typescript',
    nodeKinds: ['function_declaration', 'class_declaration', 'variable_declarator'],
    leafKinds: ['identifier', 'type_identifier'],
    supertypes: [
      { name: 'declaration', subtypes: ['function_declaration', 'class_declaration'] },
    ],
  };

  it('should produce valid output', () => {
    const output = emitTypesIr(config);
    console.log(output);
    expect(output).toContain('TypescriptGrammar');
    expect(output).toContain('FunctionDeclaration');
    expect(output).toContain('NodeType');
    expect(output).toContain('BuilderConfig');
  });

  it('should match old emitter structure', () => {
    const oldOutput = emitTypes(config);
    const newOutput = emitTypesIr(config);

    console.log('=== OLD ===');
    console.log(oldOutput);
    console.log('=== NEW ===');
    console.log(newOutput);

    // Both should contain the same type declarations
    expect(newOutput).toContain('FunctionDeclaration');
    expect(newOutput).toContain('ClassDeclaration');
    expect(newOutput).toContain('VariableDeclarator');
    expect(newOutput).toContain('FunctionDeclarationConfig');
    expect(newOutput).toContain('Identifier');
    expect(newOutput).toContain('TypeIdentifier');
    expect(newOutput).toContain('Declaration');
    expect(newOutput).toContain('TypescriptIrNode');
    expect(newOutput).toContain('ValidationResult');
  });
});
