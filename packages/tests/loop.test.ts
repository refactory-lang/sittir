import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('loop_expression', () => {
  it('should create a loop_expression node via builder', () => {
    const builder = ir.loop(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('loop_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.loop(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
