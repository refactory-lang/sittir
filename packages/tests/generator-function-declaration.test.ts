import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('generator_function_declaration', () => {
  it('should create a generator_function_declaration node via builder', () => {
    const builder = ir.generatorFunctionDeclaration(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('generator_function_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.generatorFunctionDeclaration(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
