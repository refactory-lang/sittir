import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExecStatement, Expression, Identifier, String } from '../types.js';


class ExecBuilder extends Builder<ExecStatement> {
  private _code: Builder<Identifier | String>;
  private _children: Builder<Expression>[] = [];

  constructor(code: Builder<Identifier | String>) {
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
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExecStatement {
    return {
      kind: 'exec_statement',
      code: this._code.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as ExecStatement;
  }

  override get nodeKind(): string { return 'exec_statement'; }

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

export type { ExecBuilder };

export function exec(code: Builder<Identifier | String>): ExecBuilder {
  return new ExecBuilder(code);
}

export interface ExecStatementOptions {
  code: Builder<Identifier | String>;
  children?: Builder<Expression> | (Builder<Expression>)[];
}

export namespace exec {
  export function from(options: ExecStatementOptions): ExecBuilder {
    const b = new ExecBuilder(options.code);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
