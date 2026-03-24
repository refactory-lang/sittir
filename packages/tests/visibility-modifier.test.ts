import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('visibility_modifier', () => {
  it('should create a visibility_modifier node via builder', () => {
    const builder = ir.visibility_modifier();
    const node = builder.build();
    expect(node.kind).toBe('visibility_modifier');
  });

  it('should render without throwing', () => {
    const builder = ir.visibility_modifier();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
