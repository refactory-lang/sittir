import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('use_declaration', () => {
  it('should create a use_declaration node via builder', () => {
    const builder = ir.use(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('use_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.use(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
