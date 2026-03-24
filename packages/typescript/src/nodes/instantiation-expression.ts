import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, Identifier, Import, InstantiationExpression, MemberExpression, SubscriptExpression, TypeArguments } from '../types.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';
import { member_expression } from './member-expression.js';
import type { MemberExpressionOptions } from './member-expression.js';
import { subscript_expression } from './subscript-expression.js';
import type { SubscriptExpressionOptions } from './subscript-expression.js';


class InstantiationExpressionBuilder extends Builder<InstantiationExpression> {
  private _typeArguments: Builder<TypeArguments>;
  private _function?: Builder<Identifier | Import | MemberExpression | SubscriptExpression>;
  private _children: Builder<Expression>[] = [];

  constructor(typeArguments: Builder<TypeArguments>) {
    super();
    this._typeArguments = typeArguments;
  }

  function(value: Builder<Identifier | Import | MemberExpression | SubscriptExpression>): this {
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
      typeArguments: this._typeArguments.build(ctx),
      function: this._function ? this._function.build(ctx) : undefined,
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as InstantiationExpression;
  }

  override get nodeKind(): 'instantiation_expression' { return 'instantiation_expression'; }

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
  nodeKind: 'instantiation_expression';
  typeArguments: Builder<TypeArguments> | Omit<TypeArgumentsOptions, 'nodeKind'>;
  function?: Builder<Identifier | Import | MemberExpression | SubscriptExpression> | MemberExpressionOptions | SubscriptExpressionOptions;
  children?: Builder<Expression> | (Builder<Expression>)[];
}

export namespace instantiation_expression {
  export function from(options: Omit<InstantiationExpressionOptions, 'nodeKind'>): InstantiationExpressionBuilder {
    const _ctor = options.typeArguments;
    const b = new InstantiationExpressionBuilder(_ctor instanceof Builder ? _ctor : type_arguments.from(_ctor));
    if (options.function !== undefined) {
      const _v = options.function;
      if (_v instanceof Builder) {
        b.function(_v);
      } else {
        switch (_v.nodeKind) {
          case 'member_expression': b.function(member_expression.from(_v)); break;
          case 'subscript_expression': b.function(subscript_expression.from(_v)); break;
        }
      }
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
