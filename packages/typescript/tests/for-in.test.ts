import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('for_in_statement', () => {
  it('should create a for_in_statement node via builder', () => {
    const builder = ir.for_in(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('for_in_statement');
  });

  it('should render without throwing', () => {
    const builder = ir.for_in(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
