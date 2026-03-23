import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExportSpecifier, Identifier } from '../types.js';


class ExportSpecifierBuilder extends Builder<ExportSpecifier> {
  private _alias?: Builder<Identifier>;
  private _name: Builder<Identifier>;

  constructor(name: Builder<Identifier>) {
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
    if (this._alias) {
      parts.push('as');
      if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExportSpecifier {
    return {
      kind: 'export_specifier',
      alias: this._alias?.build(ctx),
      name: this._name.build(ctx),
    } as ExportSpecifier;
  }

  override get nodeKind(): string { return 'export_specifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._alias) {
      parts.push({ kind: 'token', text: 'as', type: 'as' });
      if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    }
    return parts;
  }
}

export type { ExportSpecifierBuilder };

export function export_specifier(name: Builder<Identifier>): ExportSpecifierBuilder {
  return new ExportSpecifierBuilder(name);
}

export interface ExportSpecifierOptions {
  alias?: Builder<Identifier>;
  name: Builder<Identifier>;
}

export namespace export_specifier {
  export function from(options: ExportSpecifierOptions): ExportSpecifierBuilder {
    const b = new ExportSpecifierBuilder(options.name);
    if (options.alias !== undefined) b.alias(options.alias);
    return b;
  }
}
