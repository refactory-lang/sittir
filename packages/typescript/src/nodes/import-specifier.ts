import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, ImportSpecifier } from '../types.js';


class ImportSpecifierBuilder extends Builder<ImportSpecifier> {
  private _alias?: Builder;
  private _name: Builder;

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  alias(value: Builder): this {
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
      alias: this._alias ? this.renderChild(this._alias, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
    } as unknown as ImportSpecifier;
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

export function import_specifier(name: Builder): ImportSpecifierBuilder {
  return new ImportSpecifierBuilder(name);
}

export interface ImportSpecifierOptions {
  alias?: Builder<Identifier> | string;
  name: Builder<Identifier>;
}

export namespace import_specifier {
  export function from(options: ImportSpecifierOptions): ImportSpecifierBuilder {
    const b = new ImportSpecifierBuilder(options.name);
    if (options.alias !== undefined) {
      const _v = options.alias;
      b.alias(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    return b;
  }
}
