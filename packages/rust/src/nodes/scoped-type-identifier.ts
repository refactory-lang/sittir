import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BracketedType, Crate, GenericType, Identifier, Metavariable, ScopedIdentifier, ScopedTypeIdentifier, Self, Super, TypeIdentifier } from '../types.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';
import { generic_type } from './generic-type.js';
import type { GenericTypeOptions } from './generic-type.js';
import { bracketed_type } from './bracketed-type.js';
import type { BracketedTypeOptions } from './bracketed-type.js';


class ScopedTypeIdentifierBuilder extends Builder<ScopedTypeIdentifier> {
  private _path?: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | GenericType | BracketedType>;
  private _name: Builder<TypeIdentifier>;

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  path(value: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | GenericType | BracketedType>): this {
    this._path = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._path) parts.push(this.renderChild(this._path, ctx));
    parts.push('::');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ScopedTypeIdentifier {
    return {
      kind: 'scoped_type_identifier',
      path: this._path ? this._path.build(ctx) : undefined,
      name: this._name.build(ctx),
    } as ScopedTypeIdentifier;
  }

  override get nodeKind(): 'scoped_type_identifier' { return 'scoped_type_identifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._path) parts.push({ kind: 'builder', builder: this._path, fieldName: 'path' });
    parts.push({ kind: 'token', text: '::', type: '::' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    return parts;
  }
}

export type { ScopedTypeIdentifierBuilder };

export function scoped_type_identifier(name: Builder<TypeIdentifier>): ScopedTypeIdentifierBuilder {
  return new ScopedTypeIdentifierBuilder(name);
}

export interface ScopedTypeIdentifierOptions {
  nodeKind: 'scoped_type_identifier';
  path?: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | GenericType | BracketedType> | ScopedIdentifierOptions | GenericTypeOptions | BracketedTypeOptions;
  name: Builder<TypeIdentifier> | string;
}

export namespace scoped_type_identifier {
  export function from(options: Omit<ScopedTypeIdentifierOptions, 'nodeKind'>): ScopedTypeIdentifierBuilder {
    const _ctor = options.name;
    const b = new ScopedTypeIdentifierBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.path !== undefined) {
      const _v = options.path;
      if (_v instanceof Builder) {
        b.path(_v);
      } else {
        switch (_v.nodeKind) {
          case 'scoped_identifier': b.path(scoped_identifier.from(_v)); break;
          case 'generic_type': b.path(generic_type.from(_v)); break;
          case 'bracketed_type': b.path(bracketed_type.from(_v)); break;
        }
      }
    }
    return b;
  }
}
