import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElseClause, ExceptClause, FinallyClause, TryStatement } from '../types.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';
import { except_clause } from './except-clause.js';
import type { ExceptClauseOptions } from './except-clause.js';
import { else_clause } from './else-clause.js';
import type { ElseClauseOptions } from './else-clause.js';
import { finally_clause } from './finally-clause.js';
import type { FinallyClauseOptions } from './finally-clause.js';


class TryStatementBuilder extends Builder<TryStatement> {
  private _body: Builder<Block>;
  private _children: Builder<ExceptClause | ElseClause | FinallyClause>[] = [];

  constructor(body: Builder<Block>) {
    super();
    this._body = body;
  }

  children(...value: Builder<ExceptClause | ElseClause | FinallyClause>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('try');
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TryStatement {
    return {
      kind: 'try_statement',
      body: this._body.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as TryStatement;
  }

  override get nodeKind(): 'try_statement' { return 'try_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'try', type: 'try' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    return parts;
  }
}

export type { TryStatementBuilder };

export function try_statement(body: Builder<Block>): TryStatementBuilder {
  return new TryStatementBuilder(body);
}

export interface TryStatementOptions {
  nodeKind: 'try_statement';
  body: Builder<Block> | Omit<BlockOptions, 'nodeKind'>;
  children?: Builder<ExceptClause | ElseClause | FinallyClause> | ExceptClauseOptions | ElseClauseOptions | FinallyClauseOptions | (Builder<ExceptClause | ElseClause | FinallyClause> | ExceptClauseOptions | ElseClauseOptions | FinallyClauseOptions)[];
}

export namespace try_statement {
  export function from(options: Omit<TryStatementOptions, 'nodeKind'>): TryStatementBuilder {
    const _ctor = options.body;
    const b = new TryStatementBuilder(_ctor instanceof Builder ? _ctor : block.from(_ctor));
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'except_clause': return except_clause.from(_v);   case 'else_clause': return else_clause.from(_v);   case 'finally_clause': return finally_clause.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
