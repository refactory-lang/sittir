import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('attribute', () => {
  it('should create a attribute node via builder', () => {
    const builder = ir.attribute(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('attribute');
  });

  it('should render without throwing', () => {
    const builder = ir.attribute(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
