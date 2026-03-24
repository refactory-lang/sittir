import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('reference_type', () => {
  it('should create a reference_type node via builder', () => {
    const builder = ir.reference_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('reference_type');
  });

  it('should render without throwing', () => {
    const builder = ir.reference_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
