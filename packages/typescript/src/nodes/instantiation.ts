import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { InstantiationExpression } from '../types.js';


class InstantiationBuilder extends BaseBuilder<InstantiationExpression> {
  private _function?: BaseBuilder;
  private _typeArguments: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(typeArguments: BaseBuilder) {
    super();
    this._typeArguments = typeArguments;
  }

  function(value: BaseBuilder): this {
    this._function = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
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
    return parts;
  }
}

export function instantiation(typeArguments: BaseBuilder): InstantiationBuilder {
  return new InstantiationBuilder(typeArguments);
}
