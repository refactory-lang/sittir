import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('class_declaration', () => {
  it('should create a class_declaration node via builder', () => {
    const builder = ir.class(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('class_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.class(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
