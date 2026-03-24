import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_item', () => {
  it('should create a type_item node via builder', () => {
    const builder = ir.type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('type_item');
  });

  it('should render without throwing', () => {
    const builder = ir.type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
