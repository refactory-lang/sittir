import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Arguments, CallExpression, Expression, TemplateString, TypeArguments } from '../types.js';


class CallExpressionBuilder extends Builder<CallExpression> {
  private _arguments!: Builder<Arguments | TemplateString>;
  private _function: Builder<Expression>;
  private _typeArguments?: Builder<TypeArguments>;

  constructor(function_: Builder<Expression>) {
    super();
    this._function = function_;
  }

  arguments(value: Builder<Arguments | TemplateString>): this {
    this._arguments = value;
    return this;
  }

  typeArguments(value: Builder<TypeArguments>): this {
    this._typeArguments = value;
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
      arguments: this._arguments?.build(ctx),
      function: this._function.build(ctx),
      typeArguments: this._typeArguments?.build(ctx),
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

export function call_expression(function_: Builder<Expression>): CallExpressionBuilder {
  return new CallExpressionBuilder(function_);
}

export interface CallExpressionOptions {
  arguments: Builder<Arguments | TemplateString>;
  function: Builder<Expression>;
  typeArguments?: Builder<TypeArguments>;
}

export namespace call_expression {
  export function from(options: CallExpressionOptions): CallExpressionBuilder {
    const b = new CallExpressionBuilder(options.function);
    if (options.arguments !== undefined) b.arguments(options.arguments);
    if (options.typeArguments !== undefined) b.typeArguments(options.typeArguments);
    return b;
  }
}
