import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('literal_type', () => {
  it('should create a literal_type node via builder', () => {
    const builder = ir.literal_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('literal_type');
  });

  it('should render without throwing', () => {
    const builder = ir.literal_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
