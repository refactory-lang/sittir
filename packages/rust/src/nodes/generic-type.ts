import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { GenericType, Identifier, ScopedTypeIdentifier, TypeArguments, TypeIdentifier } from '../types.js';
import { scoped_type_identifier } from './scoped-type-identifier.js';
import type { ScopedTypeIdentifierOptions } from './scoped-type-identifier.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';


class GenericTypeBuilder extends Builder<GenericType> {
  private _type: Builder<TypeIdentifier | Identifier | ScopedTypeIdentifier>;
  private _typeArguments!: Builder<TypeArguments>;

  constructor(type_: Builder<TypeIdentifier | Identifier | ScopedTypeIdentifier>) {
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
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenericType {
    return {
      kind: 'generic_type',
      type: this._type.build(ctx),
      typeArguments: this._typeArguments ? this._typeArguments.build(ctx) : undefined,
    } as GenericType;
  }

  override get nodeKind(): 'generic_type' { return 'generic_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export type { GenericTypeBuilder };

export function generic_type(type_: Builder<TypeIdentifier | Identifier | ScopedTypeIdentifier>): GenericTypeBuilder {
  return new GenericTypeBuilder(type_);
}

export interface GenericTypeOptions {
  nodeKind: 'generic_type';
  type: Builder<TypeIdentifier | Identifier | ScopedTypeIdentifier> | LeafOptions<'type_identifier'> | LeafOptions<'identifier'> | ScopedTypeIdentifierOptions;
  typeArguments: Builder<TypeArguments> | Omit<TypeArgumentsOptions, 'nodeKind'>;
}

export namespace generic_type {
  export function from(options: Omit<GenericTypeOptions, 'nodeKind'>): GenericTypeBuilder {
    const _raw = options.type;
    let _ctor: Builder<TypeIdentifier | Identifier | ScopedTypeIdentifier>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'scoped_type_identifier': _ctor = scoped_type_identifier.from(_raw); break;
        case 'type_identifier': _ctor = new LeafBuilder('type_identifier', (_raw as LeafOptions).text!); break;
        case 'identifier': _ctor = new LeafBuilder('identifier', (_raw as LeafOptions).text!); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new GenericTypeBuilder(_ctor);
    if (options.typeArguments !== undefined) {
      const _v = options.typeArguments;
      b.typeArguments(_v instanceof Builder ? _v : type_arguments.from(_v));
    }
    return b;
  }
}
