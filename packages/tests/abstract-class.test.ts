import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('abstract_class_declaration', () => {
  it('should create a abstract_class_declaration node via builder', () => {
    const builder = ir.abstract_class(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('abstract_class_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.abstract_class(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
