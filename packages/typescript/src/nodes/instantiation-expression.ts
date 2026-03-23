import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, Identifier, InstantiationExpression, MemberExpression, SubscriptExpression, TypeArguments } from '../types.js';


class InstantiationExpressionBuilder extends Builder<InstantiationExpression> {
  private _function?: Builder<Identifier | MemberExpression | SubscriptExpression>;
  private _typeArguments: Builder<TypeArguments>;
  private _children: Builder<Expression>[] = [];

  constructor(typeArguments: Builder<TypeArguments>) {
    super();
    this._typeArguments = typeArguments;
  }

  function(value: Builder<Identifier | MemberExpression | SubscriptExpression>): this {
    this._function = value;
    return this;
  }

  children(...value: Builder<Expression>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    if (this._function) parts.push(this.renderChild(this._function, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): InstantiationExpression {
    return {
      kind: 'instantiation_expression',
      function: this._function?.build(ctx),
      typeArguments: this._typeArguments.build(ctx),
      children: this._children[0]?.build(ctx),
    } as InstantiationExpression;
  }

  override get nodeKind(): string { return 'instantiation_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    if (this._function) parts.push({ kind: 'builder', builder: this._function, fieldName: 'function' });
    return parts;
  }
}

export type { InstantiationExpressionBuilder };

export function instantiation_expression(typeArguments: Builder<TypeArguments>): InstantiationExpressionBuilder {
  return new InstantiationExpressionBuilder(typeArguments);
}

export interface InstantiationExpressionOptions {
  function?: Builder<Identifier | MemberExpression | SubscriptExpression>;
  typeArguments: Builder<TypeArguments>;
  children?: Builder<Expression> | (Builder<Expression>)[];
}

export namespace instantiation_expression {
  export function from(options: InstantiationExpressionOptions): InstantiationExpressionBuilder {
    const b = new InstantiationExpressionBuilder(options.typeArguments);
    if (options.function !== undefined) b.function(options.function);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
