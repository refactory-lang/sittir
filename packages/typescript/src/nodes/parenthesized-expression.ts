import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallExpression, Expression, Identifier, MemberExpression, ParenthesizedExpression, SequenceExpression, TypeAnnotation } from '../types.js';


class ParenthesizedExpressionBuilder extends Builder<ParenthesizedExpression> {
  private _type?: Builder<TypeAnnotation>;
  private _children: Builder<CallExpression | Expression | Identifier | MemberExpression | SequenceExpression>[] = [];

  constructor(children: Builder<CallExpression | Expression | Identifier | MemberExpression | SequenceExpression>) {
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
      type: this._type?.build(ctx),
      children: this._children[0]?.build(ctx),
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

export function parenthesized_expression(children: Builder<CallExpression | Expression | Identifier | MemberExpression | SequenceExpression>): ParenthesizedExpressionBuilder {
  return new ParenthesizedExpressionBuilder(children);
}

export interface ParenthesizedExpressionOptions {
  type?: Builder<TypeAnnotation>;
  children: Builder<CallExpression | Expression | Identifier | MemberExpression | SequenceExpression> | (Builder<CallExpression | Expression | Identifier | MemberExpression | SequenceExpression>)[];
}

export namespace parenthesized_expression {
  export function from(options: ParenthesizedExpressionOptions): ParenthesizedExpressionBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ParenthesizedExpressionBuilder(_ctor);
    if (options.type !== undefined) b.type(options.type);
    return b;
  }
}
