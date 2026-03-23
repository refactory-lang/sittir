import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TryStatement } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TryBuilder extends BaseBuilder<TryStatement> {
  private _body: Child;
  private _finalizer?: Child;
  private _handler?: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  finalizer(value: Child): this {
    this._finalizer = value;
    return this;
  }

  handler(value: Child): this {
    this._handler = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('try');
    if (this._finalizer) parts.push(this.renderChild(this._finalizer, ctx));
    if (this._handler) parts.push(this.renderChild(this._handler, ctx));
    if (this._body) {
      parts.push('{');
      parts.push(this.renderChild(this._body, ctx));
      parts.push('}');
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TryStatement {
    return {
      kind: 'try_statement',
      body: this.renderChild(this._body, ctx),
      finalizer: this._finalizer ? this.renderChild(this._finalizer, ctx) : undefined,
      handler: this._handler ? this.renderChild(this._handler, ctx) : undefined,
    } as unknown as TryStatement;
  }

  override get nodeKind(): string { return 'try_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'try' });
    if (this._finalizer) parts.push({ kind: 'builder', builder: this._finalizer, fieldName: 'finalizer' });
    if (this._handler) parts.push({ kind: 'builder', builder: this._handler, fieldName: 'handler' });
    if (this._body) {
      parts.push({ kind: 'token', text: '{', type: '{' });
      parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
      parts.push({ kind: 'token', text: '}', type: '}' });
    }
    return parts;
  }
}

export function try_(body: Child): TryBuilder {
  return new TryBuilder(body);
}
