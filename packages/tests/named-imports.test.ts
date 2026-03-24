import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('named_imports', () => {
  it('should create a named_imports node via builder', () => {
    const builder = ir.named_imports();
    const node = builder.build();
    expect(node.kind).toBe('named_imports');
  });

  it('should render without throwing', () => {
    const builder = ir.named_imports();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
