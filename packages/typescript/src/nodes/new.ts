import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Arguments, NewExpression, PrimaryExpression, TypeArguments } from '../types.js';


class NewBuilder extends Builder<NewExpression> {
  private _arguments?: Builder;
  private _constructor: Builder;
  private _typeArguments?: Builder;

  constructor(constructor: Builder) {
    super();
    this._constructor = constructor;
  }

  arguments(value: Builder): this {
    this._arguments = value;
    return this;
  }

  typeArguments(value: Builder): this {
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
      arguments: this._arguments ? this.renderChild(this._arguments, ctx) : undefined,
      constructor: this.renderChild(this._constructor, ctx),
      typeArguments: this._typeArguments ? this.renderChild(this._typeArguments, ctx) : undefined,
    } as unknown as NewExpression;
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

export type { NewBuilder };

export function new_(constructor: Builder): NewBuilder {
  return new NewBuilder(constructor);
}

export interface NewExpressionOptions {
  arguments?: Builder<Arguments>;
  constructor: Builder<PrimaryExpression>;
  typeArguments?: Builder<TypeArguments>;
}

export namespace new_ {
  export function from(options: NewExpressionOptions): NewBuilder {
    const b = new NewBuilder(options.constructor);
    if (options.arguments !== undefined) b.arguments(options.arguments);
    if (options.typeArguments !== undefined) b.typeArguments(options.typeArguments);
    return b;
  }
}
