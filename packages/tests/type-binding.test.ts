import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_binding', () => {
  it('should create a type_binding node via builder', () => {
    const builder = ir.type_binding(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('type_binding');
  });

  it('should render without throwing', () => {
    const builder = ir.type_binding(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
