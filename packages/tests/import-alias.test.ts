import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('import_alias', () => {
  it('should create a import_alias node via builder', () => {
    const builder = ir.import_alias([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('import_alias');
  });

  it('should render without throwing', () => {
    const builder = ir.import_alias([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
