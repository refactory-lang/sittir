import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Declaration, Decorator, ExportClause, ExportStatement, Expression, Identifier, NamespaceExport, String } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';
import { decorator } from './decorator.js';
import type { DecoratorOptions } from './decorator.js';


class ExportStatementBuilder extends Builder<ExportStatement> {
  private _source?: Builder<String>;
  private _decorator: Builder<Decorator>[] = [];
  private _declaration?: Builder<Declaration>;
  private _value?: Builder<Expression>;
  private _children: Builder<NamespaceExport | ExportClause | Expression | Identifier>[] = [];

  constructor(...children: Builder<NamespaceExport | ExportClause | Expression | Identifier>[]) {
    super();
    this._children = children;
  }

  source(value: Builder<String>): this {
    this._source = value;
    return this;
  }

  decorator(...value: Builder<Decorator>[]): this {
    this._decorator = value;
    return this;
  }

  declaration(value: Builder<Declaration>): this {
    this._declaration = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    parts.push('export');
    if (this._declaration) parts.push(this.renderChild(this._declaration, ctx));
    if (this._source) parts.push(this.renderChild(this._source, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExportStatement {
    return {
      kind: 'export_statement',
      source: this._source?.build(ctx),
      decorator: this._decorator.map(c => c.build(ctx)),
      declaration: this._declaration?.build(ctx),
      value: this._value?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as ExportStatement;
  }

  override get nodeKind(): string { return 'export_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
    parts.push({ kind: 'token', text: 'export', type: 'export' });
    if (this._declaration) parts.push({ kind: 'builder', builder: this._declaration, fieldName: 'declaration' });
    if (this._source) parts.push({ kind: 'builder', builder: this._source, fieldName: 'source' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { ExportStatementBuilder };

export function export_statement(...children: Builder<NamespaceExport | ExportClause | Expression | Identifier>[]): ExportStatementBuilder {
  return new ExportStatementBuilder(...children);
}

export interface ExportStatementOptions {
  source?: Builder<String> | StringOptions;
  decorator?: Builder<Decorator> | DecoratorOptions | (Builder<Decorator> | DecoratorOptions)[];
  declaration?: Builder<Declaration>;
  value?: Builder<Expression>;
  children?: Builder<NamespaceExport | ExportClause | Expression | Identifier> | (Builder<NamespaceExport | ExportClause | Expression | Identifier>)[];
}

export namespace export_statement {
  export function from(options: ExportStatementOptions): ExportStatementBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ExportStatementBuilder(..._arr);
    if (options.source !== undefined) {
      const _v = options.source;
      b.source(_v instanceof Builder ? _v : string.from(_v as StringOptions));
    }
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr.map(_v => _v instanceof Builder ? _v : decorator.from(_v as DecoratorOptions)));
    }
    if (options.declaration !== undefined) b.declaration(options.declaration);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
