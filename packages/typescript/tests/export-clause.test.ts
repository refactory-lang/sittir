import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('export_clause', () => {
  it('should create a export_clause node via builder', () => {
    const builder = ir.export_clause();
    const node = builder.build();
    expect(node.kind).toBe('export_clause');
  });

  it('should render without throwing', () => {
    const builder = ir.export_clause();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
