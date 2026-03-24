import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('member_expression', () => {
  it('should create a member_expression node via builder', () => {
    const builder = ir.member(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('member_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.member(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
