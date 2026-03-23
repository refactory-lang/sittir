import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('match_expression', () => {
  it('should create a match_expression node via builder', () => {
    const builder = ir.match(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('match_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.match(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
