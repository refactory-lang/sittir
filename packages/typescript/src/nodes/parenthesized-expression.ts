import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ParenthesizedExpression, SequenceExpression, TypeAnnotation } from '../types.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';


class ParenthesizedExpressionBuilder extends Builder<ParenthesizedExpression> {
  private _type?: Builder<TypeAnnotation>;
  private _children: Builder<Expression | SequenceExpression>[] = [];

  constructor(...children: Builder<Expression | SequenceExpression>[]) {
    super();
    this._children = children;
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
      type: this._type?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as ParenthesizedExpression;
  }

  override get nodeKind(): string { return 'parenthesized_expression'; }

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

export function parenthesized_expression(...children: Builder<Expression | SequenceExpression>[]): ParenthesizedExpressionBuilder {
  return new ParenthesizedExpressionBuilder(...children);
}

export interface ParenthesizedExpressionOptions {
  type?: Builder<TypeAnnotation> | TypeAnnotationOptions;
  children?: Builder<Expression | SequenceExpression> | (Builder<Expression | SequenceExpression>)[];
}

export namespace parenthesized_expression {
  export function from(options: ParenthesizedExpressionOptions): ParenthesizedExpressionBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ParenthesizedExpressionBuilder(..._arr);
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v as TypeAnnotationOptions));
    }
    return b;
  }
}
