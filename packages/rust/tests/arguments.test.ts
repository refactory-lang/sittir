import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('arguments', () => {
  it('should create a arguments node via builder', () => {
    const builder = ir.arguments();
    const node = builder.build();
    expect(node.kind).toBe('arguments');
  });

  it('should render without throwing', () => {
    const builder = ir.arguments();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
