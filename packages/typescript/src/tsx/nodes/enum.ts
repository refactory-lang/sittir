import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EnumBody, EnumDeclaration, Identifier } from '../types.js';


class EnumBuilder extends Builder<EnumDeclaration> {
  private _body!: Builder<EnumBody>;
  private _name: Builder<Identifier>;

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  body(value: Builder<EnumBody>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('enum');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): EnumDeclaration {
    return {
      kind: 'enum_declaration',
      body: this._body?.build(ctx),
      name: this._name.build(ctx),
    } as EnumDeclaration;
  }

  override get nodeKind(): string { return 'enum_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'enum', type: 'enum' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { EnumBuilder };

export function enum_(name: Builder<Identifier>): EnumBuilder {
  return new EnumBuilder(name);
}

export interface EnumDeclarationOptions {
  body: Builder<EnumBody>;
  name: Builder<Identifier> | string;
}

export namespace enum_ {
  export function from(options: EnumDeclarationOptions): EnumBuilder {
    const _ctor = options.name;
    const b = new EnumBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
