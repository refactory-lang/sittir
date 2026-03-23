import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Chevron, Expression, PrintStatement } from '../types.js';


class PrintStatementBuilder extends Builder<PrintStatement> {
  private _argument: Builder<Expression>[] = [];
  private _children: Builder<Chevron>[] = [];

  constructor() { super(); }

  argument(...value: Builder<Expression>[]): this {
    this._argument = value;
    return this;
  }

  children(...value: Builder<Chevron>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('print');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._argument.length > 0) parts.push(this.renderChildren(this._argument, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): PrintStatement {
    return {
      kind: 'print_statement',
      argument: this._argument.map(c => c.build(ctx)),
      children: this._children[0]?.build(ctx),
    } as PrintStatement;
  }

  override get nodeKind(): string { return 'print_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'print', type: 'print' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    for (const child of this._argument) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'argument' });
    }
    return parts;
  }
}

export type { PrintStatementBuilder };

export function print_statement(): PrintStatementBuilder {
  return new PrintStatementBuilder();
}

export interface PrintStatementOptions {
  argument?: Builder<Expression> | (Builder<Expression>)[];
  children?: Builder<Chevron> | (Builder<Chevron>)[];
}

export namespace print_statement {
  export function from(options: PrintStatementOptions): PrintStatementBuilder {
    const b = new PrintStatementBuilder();
    if (options.argument !== undefined) {
      const _v = options.argument;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.argument(..._arr);
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
