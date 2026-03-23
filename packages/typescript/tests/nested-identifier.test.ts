import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('nested_identifier', () => {
  it('should create a nested_identifier node via builder', () => {
    const builder = ir.nested_identifier(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('nested_identifier');
  });

  it('should render without throwing', () => {
    const builder = ir.nested_identifier(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
