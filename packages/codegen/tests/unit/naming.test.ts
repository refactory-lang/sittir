import { describe, it, expect } from 'vitest';
import { toFactoryName, toTypeName, toBuilderClassName, toShortName, toFileName, toGrammarTypeName, toFieldName } from '../../src/naming.ts';

describe('naming', () => {
  it('toFactoryName: struct_item → structItem', () => expect(toFactoryName('struct_item')).toBe('structItem'));
  it('toFactoryName: function_declaration → functionDeclaration', () => expect(toFactoryName('function_declaration')).toBe('functionDeclaration'));
  it('toTypeName: struct_item → StructItem', () => expect(toTypeName('struct_item')).toBe('StructItem'));
  it('toBuilderClassName: struct_item → StructBuilder', () => expect(toBuilderClassName('struct_item')).toBe('StructBuilder'));
  it('toBuilderClassName: function_item → FunctionBuilder', () => expect(toBuilderClassName('function_item')).toBe('FunctionBuilder'));
  it('toShortName: struct_item → struct_', () => expect(toShortName('struct_item')).toBe('struct_'));
  it('toShortName: function_item → fn', () => expect(toShortName('function_item')).toBe('fn'));
  it('toShortName: use_declaration → use_', () => expect(toShortName('use_declaration')).toBe('use_'));
  it('toShortName: if_expression → if_', () => expect(toShortName('if_expression')).toBe('if_'));
  it('toShortName: attribute_item → attribute', () => expect(toShortName('attribute_item')).toBe('attribute'));
  it('toShortName: source_file → file', () => expect(toShortName('source_file')).toBe('file'));
  it('toFileName: struct_item → struct', () => expect(toFileName('struct_item')).toBe('struct'));
  it('toFileName: function_item → function', () => expect(toFileName('function_item')).toBe('function'));
  it('toFileName: source_file → source-file', () => expect(toFileName('source_file')).toBe('source-file'));
  it('toGrammarTypeName: rust → RustTypes', () => expect(toGrammarTypeName('rust')).toBe('RustTypes'));
  it('toFieldName: return_type → returnType', () => expect(toFieldName('return_type')).toBe('returnType'));
});
