import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Chevron, Expression, PrintStatement } from '../types.js';
import { chevron } from './chevron.js';
import type { ChevronOptions } from './chevron.js';


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
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._argument.length > 0) {
      parts.push(',');
      if (this._argument.length > 0) parts.push(this.renderChildren(this._argument, ', ', ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): PrintStatement {
    return {
      kind: 'print_statement',
      argument: this._argument.map(c => c.build(ctx)),
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as PrintStatement;
  }

  override get nodeKind(): 'print_statement' { return 'print_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._argument.length > 0) {
      parts.push({ kind: 'token', text: ',', type: ',' });
      for (const child of this._argument) {
        parts.push({ kind: 'builder', builder: child, fieldName: 'argument' });
      }
    }
    return parts;
  }
}

export type { PrintStatementBuilder };

export function print_statement(): PrintStatementBuilder {
  return new PrintStatementBuilder();
}

export interface PrintStatementOptions {
  nodeKind: 'print_statement';
  argument?: Builder<Expression> | (Builder<Expression>)[];
  children?: Builder<Chevron> | Omit<ChevronOptions, 'nodeKind'> | (Builder<Chevron> | Omit<ChevronOptions, 'nodeKind'>)[];
}

export namespace print_statement {
  export function from(options: Omit<PrintStatementOptions, 'nodeKind'>): PrintStatementBuilder {
    const b = new PrintStatementBuilder();
    if (options.argument !== undefined) {
      const _v = options.argument;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.argument(..._arr);
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : chevron.from(_x)));
    }
    return b;
  }
}
