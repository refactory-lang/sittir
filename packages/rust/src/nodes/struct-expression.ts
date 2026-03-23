import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { StructExpression } from '../types.js';


class StructBuilder extends BaseBuilder<StructExpression> {
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
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): StructExpression {
    return {
      kind: 'struct_expression',
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
    } as unknown as StructExpression;
  }

  override get nodeKind(): string { return 'struct_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export function struct_(name: BaseBuilder): StructBuilder {
  return new StructBuilder(name);
}
