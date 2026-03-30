import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('class_static_block', () => {
  it('should create a class_static_block node via builder', () => {
    const builder = ir.class_static_block(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('class_static_block');
  });

  it('should render without throwing', () => {
    const builder = ir.class_static_block(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
