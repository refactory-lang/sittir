import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('expression_statement', () => {
  it('should create a expression_statement node via builder', () => {
    const builder = ir.expression(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('expression_statement');
  });

  it('should render without throwing', () => {
    const builder = ir.expression(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
