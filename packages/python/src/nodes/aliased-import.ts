import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AliasedImport, DottedName, Identifier } from '../types.js';
import { dotted_name } from './dotted-name.js';
import type { DottedNameOptions } from './dotted-name.js';


class AliasedImportBuilder extends Builder<AliasedImport> {
  private _name: Builder<DottedName>;
  private _alias!: Builder<Identifier>;

  constructor(name: Builder<DottedName>) {
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
    parts.push('as');
    if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AliasedImport {
    return {
      kind: 'aliased_import',
      name: this._name.build(ctx),
      alias: this._alias ? this._alias.build(ctx) : undefined,
    } as AliasedImport;
  }

  override get nodeKind(): 'aliased_import' { return 'aliased_import'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    return parts;
  }
}

export type { AliasedImportBuilder };

export function aliased_import(name: Builder<DottedName>): AliasedImportBuilder {
  return new AliasedImportBuilder(name);
}

export interface AliasedImportOptions {
  nodeKind: 'aliased_import';
  name: Builder<DottedName> | Omit<DottedNameOptions, 'nodeKind'>;
  alias: Builder<Identifier> | string;
}

export namespace aliased_import {
  export function from(options: Omit<AliasedImportOptions, 'nodeKind'>): AliasedImportBuilder {
    const _ctor = options.name;
    const b = new AliasedImportBuilder(_ctor instanceof Builder ? _ctor : dotted_name.from(_ctor));
    if (options.alias !== undefined) {
      const _v = options.alias;
      b.alias(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    return b;
  }
}
