import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('export_statement', () => {
  it('should create a export_statement node via builder', () => {
    const builder = ir.export();
    const node = builder.build();
    expect(node.kind).toBe('export_statement');
  });

  it('should render without throwing', () => {
    const builder = ir.export();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
