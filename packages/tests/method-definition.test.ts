import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('method_definition', () => {
  it('should create a method_definition node via builder', () => {
    const builder = ir.method_definition(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('method_definition');
  });

  it('should render without throwing', () => {
    const builder = ir.method_definition(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
