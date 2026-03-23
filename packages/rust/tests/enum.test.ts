import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('enum_item', () => {
  it('should create a enum_item node via builder', () => {
    const builder = ir.enum(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('enum_item');
  });

  it('should render without throwing', () => {
    const builder = ir.enum(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
