import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Arguments, CallExpression, Expression, Import, NewExpression, PrimaryExpression, TemplateString, TypeArguments } from '../types.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';


class CallExpressionBuilder extends Builder<CallExpression> {
  private _function: Builder<Expression | Import | PrimaryExpression | NewExpression>;
  private _typeArguments?: Builder<TypeArguments>;
  private _arguments!: Builder<Arguments | TemplateString>;

  constructor(function_: Builder<Expression | Import | PrimaryExpression | NewExpression>) {
    super();
    this._function = function_;
  }

  typeArguments(value: Builder<TypeArguments>): this {
    this._typeArguments = value;
    return this;
  }

  arguments(value: Builder<Arguments | TemplateString>): this {
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

  build(ctx?: RenderContext): CallExpression {
    return {
      kind: 'call_expression',
      function: this._function.build(ctx),
      typeArguments: this._typeArguments?.build(ctx),
      arguments: this._arguments?.build(ctx),
    } as CallExpression;
  }

  override get nodeKind(): string { return 'call_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._function) parts.push({ kind: 'builder', builder: this._function, fieldName: 'function' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    if (this._arguments) parts.push({ kind: 'builder', builder: this._arguments, fieldName: 'arguments' });
    return parts;
  }
}

export type { CallExpressionBuilder };

export function call_expression(function_: Builder<Expression | Import | PrimaryExpression | NewExpression>): CallExpressionBuilder {
  return new CallExpressionBuilder(function_);
}

export interface CallExpressionOptions {
  function: Builder<Expression | Import | PrimaryExpression | NewExpression>;
  typeArguments?: Builder<TypeArguments> | TypeArgumentsOptions;
  arguments: Builder<Arguments | TemplateString>;
}

export namespace call_expression {
  export function from(options: CallExpressionOptions): CallExpressionBuilder {
    const b = new CallExpressionBuilder(options.function);
    if (options.typeArguments !== undefined) {
      const _v = options.typeArguments;
      b.typeArguments(_v instanceof Builder ? _v : type_arguments.from(_v as TypeArgumentsOptions));
    }
    if (options.arguments !== undefined) b.arguments(options.arguments);
    return b;
  }
}
