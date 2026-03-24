import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('function_declaration', () => {
  it('should create a function_declaration node via builder', () => {
    const builder = ir.functionDeclaration(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('function_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.functionDeclaration(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
