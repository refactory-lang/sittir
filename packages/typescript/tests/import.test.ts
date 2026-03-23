import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('import_statement', () => {
  it('should create a import_statement node via builder', () => {
    const builder = ir.import();
    const node = builder.build();
    expect(node.kind).toBe('import_statement');
  });

  it('should render without throwing', () => {
    const builder = ir.import();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
