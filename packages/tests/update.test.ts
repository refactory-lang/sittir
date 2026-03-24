import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('update_expression', () => {
  it('should create a update_expression node via builder', () => {
    const builder = ir.update(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('update_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.update(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
