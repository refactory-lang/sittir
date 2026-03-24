import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('let_condition', () => {
  it('should create a let_condition node via builder', () => {
    const builder = ir.let_condition(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('let_condition');
  });

  it('should render without throwing', () => {
    const builder = ir.let_condition(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
