import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { InternalModule } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class InternalModuleBuilder extends BaseBuilder<InternalModule> {
  private _body?: Child;
  private _name: Child;

  constructor(name: Child) {
    super();
    this._name = name;
  }

  body(value: Child): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._body) {
      parts.push('{');
      parts.push(this.renderChild(this._body, ctx));
      parts.push('}');
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): InternalModule {
    return {
      kind: 'internal_module',
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
    } as unknown as InternalModule;
  }

  override get nodeKind(): string { return 'internal_module'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._body) {
      parts.push({ kind: 'token', text: '{', type: '{' });
      parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
      parts.push({ kind: 'token', text: '}', type: '}' });
    }
    return parts;
  }
}

export function internal_module(name: Child): InternalModuleBuilder {
  return new InternalModuleBuilder(name);
}
