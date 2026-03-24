import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('static_item', () => {
  it('should create a static_item node via builder', () => {
    const builder = ir.static(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('static_item');
  });

  it('should render without throwing', () => {
    const builder = ir.static(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
