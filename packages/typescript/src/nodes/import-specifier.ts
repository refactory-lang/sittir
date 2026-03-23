import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, ImportSpecifier, String } from '../types.js';


class ImportSpecifierBuilder extends Builder<ImportSpecifier> {
  private _name: Builder<Identifier | String>;
  private _alias?: Builder<Identifier>;

  constructor(name: Builder<Identifier | String>) {
    super();
    this._name = name;
  }

  alias(value: Builder<Identifier>): this {
    this._alias = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportSpecifier {
    return {
      kind: 'import_specifier',
      name: this._name.build(ctx),
      alias: this._alias?.build(ctx),
    } as ImportSpecifier;
  }

  override get nodeKind(): string { return 'import_specifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    return parts;
  }
}

export type { ImportSpecifierBuilder };

export function import_specifier(name: Builder<Identifier | String>): ImportSpecifierBuilder {
  return new ImportSpecifierBuilder(name);
}

export interface ImportSpecifierOptions {
  name: Builder<Identifier | String> | string;
  alias?: Builder<Identifier> | string;
}

export namespace import_specifier {
  export function from(options: ImportSpecifierOptions): ImportSpecifierBuilder {
    const _ctor = options.name;
    const b = new ImportSpecifierBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.alias !== undefined) {
      const _v = options.alias;
      b.alias(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    return b;
  }
}
