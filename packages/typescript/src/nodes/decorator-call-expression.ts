import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Arguments, DecoratorCallExpression, Identifier, MemberExpression, TypeArguments } from '../types.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';
import { arguments_ } from './arguments.js';
import type { ArgumentsOptions } from './arguments.js';


class DecoratorCallExpressionBuilder extends Builder<DecoratorCallExpression> {
  private _function: Builder<Identifier | MemberExpression>;
  private _typeArguments?: Builder<TypeArguments>;
  private _arguments!: Builder<Arguments>;

  constructor(function_: Builder<Identifier | MemberExpression>) {
    super();
    this._function = function_;
  }

  typeArguments(value: Builder<TypeArguments>): this {
    this._typeArguments = value;
    return this;
  }

  arguments(value: Builder<Arguments>): this {
    this._arguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._function) parts.push(this.renderChild(this._function, ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    if (this._arguments) parts.push(this.renderChild(this._arguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DecoratorCallExpression {
    return {
      kind: 'decorator_call_expression',
      function: this._function.build(ctx),
      typeArguments: this._typeArguments?.build(ctx),
      arguments: this._arguments?.build(ctx),
    } as DecoratorCallExpression;
  }

  override get nodeKind(): string { return 'decorator_call_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._function) parts.push({ kind: 'builder', builder: this._function, fieldName: 'function' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    if (this._arguments) parts.push({ kind: 'builder', builder: this._arguments, fieldName: 'arguments' });
    return parts;
  }
}

export type { DecoratorCallExpressionBuilder };

export function decorator_call_expression(function_: Builder<Identifier | MemberExpression>): DecoratorCallExpressionBuilder {
  return new DecoratorCallExpressionBuilder(function_);
}

export interface DecoratorCallExpressionOptions {
  function: Builder<Identifier | MemberExpression> | string;
  typeArguments?: Builder<TypeArguments> | TypeArgumentsOptions;
  arguments: Builder<Arguments> | ArgumentsOptions;
}

export namespace decorator_call_expression {
  export function from(options: DecoratorCallExpressionOptions): DecoratorCallExpressionBuilder {
    const _ctor = options.function;
    const b = new DecoratorCallExpressionBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.typeArguments !== undefined) {
      const _v = options.typeArguments;
      b.typeArguments(_v instanceof Builder ? _v : type_arguments.from(_v as TypeArgumentsOptions));
    }
    if (options.arguments !== undefined) {
      const _v = options.arguments;
      b.arguments(_v instanceof Builder ? _v : arguments_.from(_v as ArgumentsOptions));
    }
    return b;
  }
}
