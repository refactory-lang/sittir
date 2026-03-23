import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, ExternCrateDeclaration, Identifier, VisibilityModifier } from '../types.js';


class ExternCrateDeclarationBuilder extends Builder<ExternCrateDeclaration> {
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
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('extern');
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'extern', type: 'extern' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._alias) {
      parts.push({ kind: 'token', text: 'as', type: 'as' });
      if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    }
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export type { ExternCrateDeclarationBuilder };

export function extern_crate_declaration(name: Builder<Identifier>): ExternCrateDeclarationBuilder {
  return new ExternCrateDeclarationBuilder(name);
}

export interface ExternCrateDeclarationOptions {
  alias?: Builder<Identifier> | string;
  name: Builder<Identifier> | string;
  children?: Builder<Crate | VisibilityModifier> | (Builder<Crate | VisibilityModifier>)[];
}

export namespace extern_crate_declaration {
  export function from(options: ExternCrateDeclarationOptions): ExternCrateDeclarationBuilder {
    const _ctor = options.name;
    const b = new ExternCrateDeclarationBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
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
