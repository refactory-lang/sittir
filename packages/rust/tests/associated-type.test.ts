import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('associated_type', () => {
  it('should create a associated_type node via builder', () => {
    const builder = ir.associated_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('associated_type');
  });

  it('should render without throwing', () => {
    const builder = ir.associated_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
