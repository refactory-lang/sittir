import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EnumDeclaration } from '../types.js';


class EnumBuilder extends BaseBuilder<EnumDeclaration> {
  private _body!: BaseBuilder;
  private _name: BaseBuilder;

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  body(value: BaseBuilder): this {
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
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
    } as unknown as EnumDeclaration;
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

export function enum_(name: BaseBuilder): EnumBuilder {
  return new EnumBuilder(name);
}
