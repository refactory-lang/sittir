import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('import_clause', () => {
  it('should create a import_clause node via builder', () => {
    const builder = ir.import_clause([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('import_clause');
  });

  it('should render without throwing', () => {
    const builder = ir.import_clause([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
