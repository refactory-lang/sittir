import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExportSpecifier, Identifier } from '../types.js';


class ExportSpecifierBuilder extends Builder<ExportSpecifier> {
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
    if (this._alias) {
      parts.push('as');
      if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExportSpecifier {
    return {
      kind: 'export_specifier',
      alias: this._alias ? this.renderChild(this._alias, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
    } as unknown as ExportSpecifier;
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

export function export_specifier(name: Builder): ExportSpecifierBuilder {
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
