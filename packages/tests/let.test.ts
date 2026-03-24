import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('let_declaration', () => {
  it('should create a let_declaration node via builder', () => {
    const builder = ir.let(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('let_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.let(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
