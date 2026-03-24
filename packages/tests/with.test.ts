import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('with_statement', () => {
  it('should create a with_statement node via builder', () => {
    const builder = ir.with(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('with_statement');
  });

  it('should render without throwing', () => {
    const builder = ir.with(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
