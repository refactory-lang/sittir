import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ForInClause, GeneratorExpression, IfClause } from '../types.js';
import { for_in_clause } from './for-in-clause.js';
import type { ForInClauseOptions } from './for-in-clause.js';
import { if_clause } from './if-clause.js';
import type { IfClauseOptions } from './if-clause.js';


class GeneratorExpressionBuilder extends Builder<GeneratorExpression> {
  private _body: Builder<Expression>;
  private _children: Builder<ForInClause | IfClause>[] = [];

  constructor(body: Builder<Expression>) {
    super();
    this._body = body;
  }

  children(...value: Builder<ForInClause | IfClause>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GeneratorExpression {
    return {
      kind: 'generator_expression',
      body: this._body.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as GeneratorExpression;
  }

  override get nodeKind(): 'generator_expression' { return 'generator_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { GeneratorExpressionBuilder };

export function generator_expression(body: Builder<Expression>): GeneratorExpressionBuilder {
  return new GeneratorExpressionBuilder(body);
}

export interface GeneratorExpressionOptions {
  nodeKind: 'generator_expression';
  body: Builder<Expression>;
  children?: Builder<ForInClause | IfClause> | ForInClauseOptions | IfClauseOptions | (Builder<ForInClause | IfClause> | ForInClauseOptions | IfClauseOptions)[];
}

export namespace generator_expression {
  export function from(options: Omit<GeneratorExpressionOptions, 'nodeKind'>): GeneratorExpressionBuilder {
    const b = new GeneratorExpressionBuilder(options.body);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'for_in_clause': return for_in_clause.from(_v);   case 'if_clause': return if_clause.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
