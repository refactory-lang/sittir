import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { BracketedType, Crate, GenericType, Identifier, Metavariable, ScopedIdentifier, Self, Super } from '../types.js';
import { bracketed_type } from './bracketed-type.js';
import type { BracketedTypeOptions } from './bracketed-type.js';
import { generic_type } from './generic-type.js';
import type { GenericTypeOptions } from './generic-type.js';


class ScopedIdentifierBuilder extends Builder<ScopedIdentifier> {
  private _path?: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | BracketedType | GenericType>;
  private _name: Builder<Identifier | Super>;

  constructor(name: Builder<Identifier | Super>) {
    super();
    this._name = name;
  }

  path(value: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | BracketedType | GenericType>): this {
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

  build(ctx?: RenderContext): ScopedIdentifier {
    return {
      kind: 'scoped_identifier',
      path: this._path ? this._path.build(ctx) : undefined,
      name: this._name.build(ctx),
    } as ScopedIdentifier;
  }

  override get nodeKind(): 'scoped_identifier' { return 'scoped_identifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._path) parts.push({ kind: 'builder', builder: this._path, fieldName: 'path' });
    parts.push({ kind: 'token', text: '::', type: '::' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    return parts;
  }
}

export type { ScopedIdentifierBuilder };

export function scoped_identifier(name: Builder<Identifier | Super>): ScopedIdentifierBuilder {
  return new ScopedIdentifierBuilder(name);
}

export interface ScopedIdentifierOptions {
  nodeKind: 'scoped_identifier';
  path?: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | BracketedType | GenericType> | BracketedTypeOptions | GenericTypeOptions;
  name: Builder<Identifier | Super> | LeafOptions<'identifier'> | LeafOptions<'super'>;
}

export namespace scoped_identifier {
  export function from(options: Omit<ScopedIdentifierOptions, 'nodeKind'>): ScopedIdentifierBuilder {
    const _raw = options.name;
    let _ctor: Builder<Identifier | Super>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'identifier': _ctor = new LeafBuilder('identifier', (_raw as LeafOptions).text!); break;
        case 'super': _ctor = new LeafBuilder('super', (_raw as LeafOptions).text ?? 'super'); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new ScopedIdentifierBuilder(_ctor);
    if (options.path !== undefined) {
      const _v = options.path;
      if (_v instanceof Builder) {
        b.path(_v);
      } else {
        switch (_v.nodeKind) {
          case 'bracketed_type': b.path(bracketed_type.from(_v)); break;
          case 'generic_type': b.path(generic_type.from(_v)); break;
        }
      }
    }
    return b;
  }
}
