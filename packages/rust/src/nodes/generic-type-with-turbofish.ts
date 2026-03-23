import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericTypeWithTurbofish } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class GenericTypeWithTurbofishBuilder extends BaseBuilder<GenericTypeWithTurbofish> {
  private _type: Child;
  private _typeArguments!: Child;

  constructor(type_: Child) {
    super();
    this._type = type_;
  }

  typeArguments(value: Child): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    parts.push('::');
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenericTypeWithTurbofish {
    return {
      kind: 'generic_type_with_turbofish',
      type: this.renderChild(this._type, ctx),
      typeArguments: this._typeArguments ? this.renderChild(this._typeArguments, ctx) : undefined,
    } as unknown as GenericTypeWithTurbofish;
  }

  override get nodeKind(): string { return 'generic_type_with_turbofish'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    parts.push({ kind: 'token', text: '::', type: '::' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export function generic_type_with_turbofish(type_: Child): GenericTypeWithTurbofishBuilder {
  return new GenericTypeWithTurbofishBuilder(type_);
}
