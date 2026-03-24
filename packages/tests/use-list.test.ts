import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('use_list', () => {
  it('should create a use_list node via builder', () => {
    const builder = ir.use_list();
    const node = builder.build();
    expect(node.kind).toBe('use_list');
  });

  it('should render without throwing', () => {
    const builder = ir.use_list();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
