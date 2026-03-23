import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BracketedType, Crate, GenericType, Identifier, Metavariable, ScopedIdentifier, Self, Super } from '../types.js';


class ScopedIdentifierBuilder extends Builder<ScopedIdentifier> {
  private _name: Builder<Identifier | Super>;
  private _path?: Builder<BracketedType | Crate | GenericType | Identifier | Metavariable | ScopedIdentifier | Self | Super>;

  constructor(name: Builder<Identifier | Super>) {
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

  build(ctx?: RenderContext): ScopedIdentifier {
    return {
      kind: 'scoped_identifier',
      name: this._name.build(ctx),
      path: this._path?.build(ctx),
    } as ScopedIdentifier;
  }

  override get nodeKind(): string { return 'scoped_identifier'; }

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
  name: Builder<Identifier | Super>;
  path?: Builder<BracketedType | Crate | GenericType | Identifier | Metavariable | ScopedIdentifier | Self | Super>;
}

export namespace scoped_identifier {
  export function from(options: ScopedIdentifierOptions): ScopedIdentifierBuilder {
    const b = new ScopedIdentifierBuilder(options.name);
    if (options.path !== undefined) b.path(options.path);
    return b;
  }
}
