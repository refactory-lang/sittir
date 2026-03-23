import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BracketedType, Crate, GenericType, Identifier, Metavariable, ScopedIdentifier, ScopedTypeIdentifier, Self, Super, TypeIdentifier } from '../types.js';


class ScopedTypeIdentifierBuilder extends Builder<ScopedTypeIdentifier> {
  private _name: Builder<TypeIdentifier>;
  private _path?: Builder<BracketedType | Crate | GenericType | Identifier | Metavariable | ScopedIdentifier | Self | Super>;

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  path(value: Builder<BracketedType | Crate | GenericType | Identifier | Metavariable | ScopedIdentifier | Self | Super>): this {
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
      name: this._name.build(ctx),
      path: this._path?.build(ctx),
    } as ScopedTypeIdentifier;
  }

  override get nodeKind(): string { return 'scoped_type_identifier'; }

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
  name: Builder<TypeIdentifier> | string;
  path?: Builder<BracketedType | Crate | GenericType | Identifier | Metavariable | ScopedIdentifier | Self | Super>;
}

export namespace scoped_type_identifier {
  export function from(options: ScopedTypeIdentifierOptions): ScopedTypeIdentifierBuilder {
    const _ctor = options.name;
    const b = new ScopedTypeIdentifierBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.path !== undefined) b.path(options.path);
    return b;
  }
}
