import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericTypeWithTurbofish, ScopedIdentifier, TypeArguments, TypeIdentifier } from '../types.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';


class GenericTypeWithTurbofishBuilder extends Builder<GenericTypeWithTurbofish> {
  private _type: Builder<TypeIdentifier | ScopedIdentifier>;
  private _typeArguments!: Builder<TypeArguments>;

  constructor(type_: Builder<TypeIdentifier | ScopedIdentifier>) {
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
      typeArguments: this._typeArguments ? this._typeArguments.build(ctx) : undefined,
    } as GenericTypeWithTurbofish;
  }

  override get nodeKind(): 'generic_type_with_turbofish' { return 'generic_type_with_turbofish'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    parts.push({ kind: 'token', text: '::', type: '::' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export type { GenericTypeWithTurbofishBuilder };

export function generic_type_with_turbofish(type_: Builder<TypeIdentifier | ScopedIdentifier>): GenericTypeWithTurbofishBuilder {
  return new GenericTypeWithTurbofishBuilder(type_);
}

export interface GenericTypeWithTurbofishOptions {
  nodeKind: 'generic_type_with_turbofish';
  type: Builder<TypeIdentifier | ScopedIdentifier> | string | Omit<ScopedIdentifierOptions, 'nodeKind'>;
  typeArguments: Builder<TypeArguments> | Omit<TypeArgumentsOptions, 'nodeKind'>;
}

export namespace generic_type_with_turbofish {
  export function from(options: Omit<GenericTypeWithTurbofishOptions, 'nodeKind'>): GenericTypeWithTurbofishBuilder {
    const _ctor = options.type;
    const b = new GenericTypeWithTurbofishBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor instanceof Builder ? _ctor : scoped_identifier.from(_ctor));
    if (options.typeArguments !== undefined) {
      const _v = options.typeArguments;
      b.typeArguments(_v instanceof Builder ? _v : type_arguments.from(_v));
    }
    return b;
  }
}
