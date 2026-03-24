import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('constraint', () => {
  it('should create a constraint node via builder', () => {
    const builder = ir.constraint(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('constraint');
  });

  it('should render without throwing', () => {
    const builder = ir.constraint(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
