import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, ExternCrateDeclaration, Identifier, VisibilityModifier } from '../types.js';


class ExternCrateBuilder extends Builder<ExternCrateDeclaration> {
  private _alias?: Builder<Identifier>;
  private _name: Builder<Identifier>;
  private _children: Builder<Crate | VisibilityModifier>[] = [];

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  alias(value: Builder<Identifier>): this {
    this._alias = value;
    return this;
  }

  children(...value: Builder<Crate | VisibilityModifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('extern');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._alias) {
      parts.push('as');
      if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    }
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExternCrateDeclaration {
    return {
      kind: 'extern_crate_declaration',
      alias: this._alias?.build(ctx),
      name: this._name.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as ExternCrateDeclaration;
  }

  override get nodeKind(): string { return 'extern_crate_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'extern', type: 'extern' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._alias) {
      parts.push({ kind: 'token', text: 'as', type: 'as' });
      if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    }
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export type { ExternCrateBuilder };

export function extern_crate(name: Builder<Identifier>): ExternCrateBuilder {
  return new ExternCrateBuilder(name);
}

export interface ExternCrateDeclarationOptions {
  alias?: Builder<Identifier> | string;
  name: Builder<Identifier> | string;
  children?: Builder<Crate | VisibilityModifier> | (Builder<Crate | VisibilityModifier>)[];
}

export namespace extern_crate {
  export function from(options: ExternCrateDeclarationOptions): ExternCrateBuilder {
    const _ctor = options.name;
    const b = new ExternCrateBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.alias !== undefined) {
      const _v = options.alias;
      b.alias(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
