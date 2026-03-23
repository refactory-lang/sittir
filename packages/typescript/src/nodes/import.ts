import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportStatement } from '../types.js';


class ImportBuilder extends BaseBuilder<ImportStatement> {
  private _source?: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor() { super(); }

  source(value: BaseBuilder): this {
    this._source = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('import');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('from');
    if (this._source) parts.push(this.renderChild(this._source, ctx));
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
    parts.push({ kind: 'token', text: 'import', type: 'import' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'from', type: 'from' });
    if (this._source) parts.push({ kind: 'builder', builder: this._source, fieldName: 'source' });
    return parts;
  }
}

export function import_(): ImportBuilder {
  return new ImportBuilder();
}
