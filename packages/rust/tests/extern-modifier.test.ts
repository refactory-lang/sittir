import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('extern_modifier', () => {
  it('should create a extern_modifier node via builder', () => {
    const builder = ir.extern_modifier();
    const node = builder.build();
    expect(node.kind).toBe('extern_modifier');
  });

  it('should render without throwing', () => {
    const builder = ir.extern_modifier();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
