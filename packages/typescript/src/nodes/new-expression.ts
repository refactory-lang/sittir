import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Arguments, NewExpression, PrimaryExpression, TypeArguments } from '../types.js';


class NewExpressionBuilder extends Builder<NewExpression> {
  private _arguments?: Builder<Arguments>;
  private _constructor: Builder<PrimaryExpression>;
  private _typeArguments?: Builder<TypeArguments>;

  constructor(constructor: Builder<PrimaryExpression>) {
    super();
    this._constructor = constructor;
  }

  arguments(value: Builder<Arguments>): this {
    this._arguments = value;
    return this;
  }

  typeArguments(value: Builder<TypeArguments>): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('new');
    if (this._constructor) parts.push(this.renderChild(this._constructor, ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    if (this._arguments) parts.push(this.renderChild(this._arguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NewExpression {
    return {
      kind: 'new_expression',
      arguments: this._arguments?.build(ctx),
      constructor: this._constructor.build(ctx),
      typeArguments: this._typeArguments?.build(ctx),
    } as NewExpression;
  }

  override get nodeKind(): string { return 'new_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'new', type: 'new' });
    if (this._constructor) parts.push({ kind: 'builder', builder: this._constructor, fieldName: 'constructor' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    if (this._arguments) parts.push({ kind: 'builder', builder: this._arguments, fieldName: 'arguments' });
    return parts;
  }
}

export type { NewExpressionBuilder };

export function new_expression(constructor: Builder<PrimaryExpression>): NewExpressionBuilder {
  return new NewExpressionBuilder(constructor);
}

export interface NewExpressionOptions {
  arguments?: Builder<Arguments>;
  constructor: Builder<PrimaryExpression>;
  typeArguments?: Builder<TypeArguments>;
}

export namespace new_expression {
  export function from(options: NewExpressionOptions): NewExpressionBuilder {
    const b = new NewExpressionBuilder(options.constructor);
    if (options.arguments !== undefined) b.arguments(options.arguments);
    if (options.typeArguments !== undefined) b.typeArguments(options.typeArguments);
    return b;
  }
}
