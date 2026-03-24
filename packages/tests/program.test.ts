import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('program', () => {
  it('should create a program node via builder', () => {
    const builder = ir.file();
    const node = builder.build();
    expect(node.kind).toBe('program');
  });

  it('should render without throwing', () => {
    const builder = ir.file();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
