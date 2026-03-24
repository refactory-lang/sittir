import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Arguments, NewExpression, PrimaryExpression, TypeArguments } from '../types.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';
import { arguments_ } from './arguments.js';
import type { ArgumentsOptions } from './arguments.js';


class NewExpressionBuilder extends Builder<NewExpression> {
  private _constructor: Builder<PrimaryExpression>;
  private _typeArguments?: Builder<TypeArguments>;
  private _arguments?: Builder<Arguments>;

  constructor(constructor: Builder<PrimaryExpression>) {
    super();
    this._constructor = constructor;
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
    parts.push('new');
    if (this._constructor) parts.push(this.renderChild(this._constructor, ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    if (this._arguments) parts.push(this.renderChild(this._arguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NewExpression {
    return {
      kind: 'new_expression',
      constructor: this._constructor.build(ctx),
      typeArguments: this._typeArguments ? this._typeArguments.build(ctx) : undefined,
      arguments: this._arguments ? this._arguments.build(ctx) : undefined,
    } as NewExpression;
  }

  override get nodeKind(): 'new_expression' { return 'new_expression'; }

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
  nodeKind: 'new_expression';
  constructor: Builder<PrimaryExpression>;
  typeArguments?: Builder<TypeArguments> | Omit<TypeArgumentsOptions, 'nodeKind'>;
  arguments?: Builder<Arguments> | Omit<ArgumentsOptions, 'nodeKind'>;
}

export namespace new_expression {
  export function from(options: Omit<NewExpressionOptions, 'nodeKind'>): NewExpressionBuilder {
    const b = new NewExpressionBuilder(options.constructor);
    if (options.typeArguments !== undefined) {
      const _v = options.typeArguments;
      b.typeArguments(_v instanceof Builder ? _v : type_arguments.from(_v));
    }
    if (options.arguments !== undefined) {
      const _v = options.arguments;
      b.arguments(_v instanceof Builder ? _v : arguments_.from(_v));
    }
    return b;
  }
}
