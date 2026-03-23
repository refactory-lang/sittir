import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { NewExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class NewBuilder extends BaseBuilder<NewExpression> {
  private _arguments?: Child;
  private _constructor: Child;
  private _typeArguments?: Child;

  constructor(constructor: Child) {
    super();
    this._constructor = constructor;
  }

  arguments(value: Child): this {
    this._arguments = value;
    return this;
  }

  typeArguments(value: Child): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('new');
    if (this._arguments) parts.push(this.renderChild(this._arguments, ctx));
    if (this._constructor) parts.push(this.renderChild(this._constructor, ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
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
    parts.push({ kind: 'token', text: 'new' });
    if (this._arguments) parts.push({ kind: 'builder', builder: this._arguments, fieldName: 'arguments' });
    if (this._constructor) parts.push({ kind: 'builder', builder: this._constructor, fieldName: 'constructor' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export function new_(constructor: Child): NewBuilder {
  return new NewBuilder(constructor);
}
