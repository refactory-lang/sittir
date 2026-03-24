import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('source_file', () => {
  it('should create a source_file node via builder', () => {
    const builder = ir.file();
    const node = builder.build();
    expect(node.kind).toBe('source_file');
  });

  it('should render without throwing', () => {
    const builder = ir.file();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
