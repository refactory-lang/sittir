import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericType } from '../types.js';


class GenericTypeBuilder extends BaseBuilder<GenericType> {
  private _type: BaseBuilder;
  private _typeArguments!: BaseBuilder;

  constructor(type_: BaseBuilder) {
    super();
    this._type = type_;
  }

  typeArguments(value: BaseBuilder): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenericType {
    return {
      kind: 'generic_type',
      type: this.renderChild(this._type, ctx),
      typeArguments: this._typeArguments ? this.renderChild(this._typeArguments, ctx) : undefined,
    } as unknown as GenericType;
  }

  override get nodeKind(): string { return 'generic_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export function generic_type(type_: BaseBuilder): GenericTypeBuilder {
  return new GenericTypeBuilder(type_);
}
