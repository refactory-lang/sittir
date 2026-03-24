import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ParenthesizedExpression, SequenceExpression, TypeAnnotation } from '../types.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';
import { sequence_expression } from './sequence-expression.js';
import type { SequenceExpressionOptions } from './sequence-expression.js';


class ParenthesizedExpressionBuilder extends Builder<ParenthesizedExpression> {
  private _type?: Builder<TypeAnnotation>;
  private _children: Builder<Expression | SequenceExpression>[] = [];

  constructor(children: Builder<Expression | SequenceExpression>) {
    super();
    this._children = [children];
  }

  type(value: Builder<TypeAnnotation>): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ParenthesizedExpression {
    return {
      kind: 'parenthesized_expression',
      type: this._type ? this._type.build(ctx) : undefined,
      children: this._children[0]!.build(ctx),
    } as ParenthesizedExpression;
  }

  override get nodeKind(): 'parenthesized_expression' { return 'parenthesized_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { ParenthesizedExpressionBuilder };

export function parenthesized_expression(children: Builder<Expression | SequenceExpression>): ParenthesizedExpressionBuilder {
  return new ParenthesizedExpressionBuilder(children);
}

export interface ParenthesizedExpressionOptions {
  nodeKind: 'parenthesized_expression';
  type?: Builder<TypeAnnotation> | Omit<TypeAnnotationOptions, 'nodeKind'>;
  children: Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'> | (Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'>)[];
}

export namespace parenthesized_expression {
  export function from(options: Omit<ParenthesizedExpressionOptions, 'nodeKind'>): ParenthesizedExpressionBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ParenthesizedExpressionBuilder(_ctor instanceof Builder ? _ctor : sequence_expression.from(_ctor));
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v));
    }
    return b;
  }
}
