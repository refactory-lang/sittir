import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('continue_statement', () => {
  it('should create a continue_statement node via builder', () => {
    const builder = ir.continue();
    const node = builder.build();
    expect(node.kind).toBe('continue_statement');
  });

  it('should render without throwing', () => {
    const builder = ir.continue();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
