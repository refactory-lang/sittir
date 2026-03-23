import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('do_statement', () => {
  it('should create a do_statement node via builder', () => {
    const builder = ir.do(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('do_statement');
  });

  it('should render without throwing', () => {
    const builder = ir.do(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
