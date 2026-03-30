import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('throw_statement', () => {
  it('should create a throw_statement node via builder', () => {
    const builder = ir.throw(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('throw_statement');
  });

  it('should render without throwing', () => {
    const builder = ir.throw(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
