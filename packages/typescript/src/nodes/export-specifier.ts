import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExportSpecifier, Identifier, String } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';


class ExportSpecifierBuilder extends Builder<ExportSpecifier> {
  private _name: Builder<Identifier | String>;
  private _alias?: Builder<Identifier | String>;

  constructor(name: Builder<Identifier | String>) {
    super();
    this._name = name;
  }

  alias(value: Builder<Identifier | String>): this {
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
      name: this._name.build(ctx),
      alias: this._alias ? this._alias.build(ctx) : undefined,
    } as ExportSpecifier;
  }

  override get nodeKind(): 'export_specifier' { return 'export_specifier'; }

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

export function export_specifier(name: Builder<Identifier | String>): ExportSpecifierBuilder {
  return new ExportSpecifierBuilder(name);
}

export interface ExportSpecifierOptions {
  nodeKind: 'export_specifier';
  name: Builder<Identifier | String> | string | Omit<StringOptions, 'nodeKind'>;
  alias?: Builder<Identifier | String> | string | Omit<StringOptions, 'nodeKind'>;
}

export namespace export_specifier {
  export function from(options: Omit<ExportSpecifierOptions, 'nodeKind'>): ExportSpecifierBuilder {
    const _ctor = options.name;
    const b = new ExportSpecifierBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor instanceof Builder ? _ctor : string.from(_ctor));
    if (options.alias !== undefined) {
      const _v = options.alias;
      b.alias(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v instanceof Builder ? _v : string.from(_v));
    }
    return b;
  }
}
