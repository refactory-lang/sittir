import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('property_signature', () => {
  it('should create a property_signature node via builder', () => {
    const builder = ir.property_signature(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('property_signature');
  });

  it('should render without throwing', () => {
    const builder = ir.property_signature(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
