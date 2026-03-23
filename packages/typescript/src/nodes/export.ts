import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExportStatement } from '../types.js';


class ExportBuilder extends BaseBuilder<ExportStatement> {
  private _declaration?: BaseBuilder;
  private _decorator: BaseBuilder[] = [];
  private _source?: BaseBuilder;
  private _value?: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor() { super(); }

  declaration(value: BaseBuilder): this {
    this._declaration = value;
    return this;
  }

  decorator(value: BaseBuilder[]): this {
    this._decorator = value;
    return this;
  }

  source(value: BaseBuilder): this {
    this._source = value;
    return this;
  }

  value(value: BaseBuilder): this {
    this._value = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('export');
    parts.push('*');
    parts.push('from');
    if (this._source) parts.push(this.renderChild(this._source, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExportStatement {
    return {
      kind: 'export_statement',
      declaration: this._declaration ? this.renderChild(this._declaration, ctx) : undefined,
      decorator: this._decorator.map(c => this.renderChild(c, ctx)),
      source: this._source ? this.renderChild(this._source, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ExportStatement;
  }

  override get nodeKind(): string { return 'export_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'export', type: 'export' });
    parts.push({ kind: 'token', text: '*', type: '*' });
    parts.push({ kind: 'token', text: 'from', type: 'from' });
    if (this._source) parts.push({ kind: 'builder', builder: this._source, fieldName: 'source' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function export_(): ExportBuilder {
  return new ExportBuilder();
}
