import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { WithStatement } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class WithBuilder extends BaseBuilder<WithStatement> {
  private _body: Child;
  private _object!: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  object(value: Child): this {
    this._object = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('with');
    if (this._object) parts.push(this.renderChild(this._object, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WithStatement {
    return {
      kind: 'with_statement',
      body: this.renderChild(this._body, ctx),
      object: this._object ? this.renderChild(this._object, ctx) : undefined,
    } as unknown as WithStatement;
  }

  override get nodeKind(): string { return 'with_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'with', type: 'with' });
    if (this._object) parts.push({ kind: 'builder', builder: this._object, fieldName: 'object' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export function with_(body: Child): WithBuilder {
  return new WithBuilder(body);
}
