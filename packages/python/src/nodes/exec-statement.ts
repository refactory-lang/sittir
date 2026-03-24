import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExecStatement, Expression, Identifier, String } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';


class ExecStatementBuilder extends Builder<ExecStatement> {
  private _code: Builder<String | Identifier>;
  private _children: Builder<Expression>[] = [];

  constructor(code: Builder<String | Identifier>) {
    super();
    this._code = code;
  }

  children(...value: Builder<Expression>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('exec');
    if (this._code) parts.push(this.renderChild(this._code, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExecStatement {
    return {
      kind: 'exec_statement',
      code: this._code.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as ExecStatement;
  }

  override get nodeKind(): 'exec_statement' { return 'exec_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'exec', type: 'exec' });
    if (this._code) parts.push({ kind: 'builder', builder: this._code, fieldName: 'code' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { ExecStatementBuilder };

export function exec_statement(code: Builder<String | Identifier>): ExecStatementBuilder {
  return new ExecStatementBuilder(code);
}

export interface ExecStatementOptions {
  nodeKind: 'exec_statement';
  code: Builder<String | Identifier> | string | Omit<StringOptions, 'nodeKind'>;
  children?: Builder<Expression> | (Builder<Expression>)[];
}

export namespace exec_statement {
  export function from(options: Omit<ExecStatementOptions, 'nodeKind'>): ExecStatementBuilder {
    const _ctor = options.code;
    const b = new ExecStatementBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor instanceof Builder ? _ctor : string.from(_ctor));
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
