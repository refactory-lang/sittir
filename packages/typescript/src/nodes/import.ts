import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportStatement } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ImportBuilder extends BaseBuilder<ImportStatement> {
  private _source?: Child;
  private _children: Child[] = [];

  constructor() { super(); }

  source(value: Child): this {
    this._source = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('import');
    if (this._source) parts.push(this.renderChild(this._source, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportStatement {
    return {
      kind: 'import_statement',
      source: this._source ? this.renderChild(this._source, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ImportStatement;
  }

  override get nodeKind(): string { return 'import_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'import' });
    if (this._source) parts.push({ kind: 'builder', builder: this._source, fieldName: 'source' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function import_(): ImportBuilder {
  return new ImportBuilder();
}
