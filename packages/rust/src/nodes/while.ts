import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, Label, LetChain, LetCondition, WhileExpression } from '../types.js';


class WhileBuilder extends Builder<WhileExpression> {
  private _body!: Builder;
  private _condition: Builder<Expression | LetChain | LetCondition>;
  private _children: Builder<Label>[] = [];

  constructor(condition: Builder<Expression | LetChain | LetCondition>) {
    super();
    this._condition = condition;
  }

  body(value: Builder): this {
    this._body = value;
    return this;
  }

  children(...value: Builder<Label>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('while');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WhileExpression {
    return {
      kind: 'while_expression',
      body: this._body?.build(ctx),
      condition: this._condition.build(ctx),
      children: this._children[0]?.build(ctx),
    } as WhileExpression;
  }

  override get nodeKind(): string { return 'while_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'while', type: 'while' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { WhileBuilder };

export function while_(condition: Builder<Expression | LetChain | LetCondition>): WhileBuilder {
  return new WhileBuilder(condition);
}

export interface WhileExpressionOptions {
  body: Builder;
  condition: Builder<Expression | LetChain | LetCondition>;
  children?: Builder<Label> | (Builder<Label>)[];
}

export namespace while_ {
  export function from(options: WhileExpressionOptions): WhileBuilder {
    const b = new WhileBuilder(options.condition);
    if (options.body !== undefined) b.body(options.body);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
