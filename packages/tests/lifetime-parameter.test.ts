import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('lifetime_parameter', () => {
  it('should create a lifetime_parameter node via builder', () => {
    const builder = ir.lifetime_parameter(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('lifetime_parameter');
  });

  it('should render without throwing', () => {
    const builder = ir.lifetime_parameter(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
