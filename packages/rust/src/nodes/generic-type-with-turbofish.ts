import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericTypeWithTurbofish, ScopedIdentifier, TypeArguments, TypeIdentifier } from '../types.js';


class GenericTypeWithTurbofishBuilder extends Builder<GenericTypeWithTurbofish> {
  private _type: Builder<ScopedIdentifier | TypeIdentifier>;
  private _typeArguments!: Builder<TypeArguments>;

  constructor(type_: Builder<ScopedIdentifier | TypeIdentifier>) {
    super();
    this._type = type_;
  }

  typeArguments(value: Builder<TypeArguments>): this {
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
      type: this._type.build(ctx),
      typeArguments: this._typeArguments?.build(ctx),
    } as GenericTypeWithTurbofish;
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

export type { GenericTypeWithTurbofishBuilder };

export function generic_type_with_turbofish(type_: Builder<ScopedIdentifier | TypeIdentifier>): GenericTypeWithTurbofishBuilder {
  return new GenericTypeWithTurbofishBuilder(type_);
}

export interface GenericTypeWithTurbofishOptions {
  type: Builder<ScopedIdentifier | TypeIdentifier>;
  typeArguments: Builder<TypeArguments>;
}

export namespace generic_type_with_turbofish {
  export function from(options: GenericTypeWithTurbofishOptions): GenericTypeWithTurbofishBuilder {
    const b = new GenericTypeWithTurbofishBuilder(options.type);
    if (options.typeArguments !== undefined) b.typeArguments(options.typeArguments);
    return b;
  }
}
