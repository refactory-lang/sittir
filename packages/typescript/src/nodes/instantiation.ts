import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, Identifier, InstantiationExpression, MemberExpression, SubscriptExpression, TypeArguments } from '../types.js';


class InstantiationBuilder extends Builder<InstantiationExpression> {
  private _function?: Builder;
  private _typeArguments: Builder;
  private _children: Builder[] = [];

  constructor(typeArguments: Builder) {
    super();
    this._typeArguments = typeArguments;
  }

  function(value: Builder): this {
    this._function = value;
    return this;
  }

  children(...value: Builder[]): this {
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
      function: this._function ? this.renderChild(this._function, ctx) : undefined,
      typeArguments: this.renderChild(this._typeArguments, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as InstantiationExpression;
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

export type { InstantiationBuilder };

export function instantiation(typeArguments: Builder): InstantiationBuilder {
  return new InstantiationBuilder(typeArguments);
}

export interface InstantiationExpressionOptions {
  function?: Builder<Identifier | MemberExpression | SubscriptExpression>;
  typeArguments: Builder<TypeArguments>;
  children?: Builder<Expression> | (Builder<Expression>)[];
}

export namespace instantiation {
  export function from(options: InstantiationExpressionOptions): InstantiationBuilder {
    const b = new InstantiationBuilder(options.typeArguments);
    if (options.function !== undefined) b.function(options.function);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
