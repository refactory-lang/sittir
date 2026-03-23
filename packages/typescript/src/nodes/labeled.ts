import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LabeledStatement } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class LabeledBuilder extends BaseBuilder<LabeledStatement> {
  private _body: Child;
  private _label!: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  label(value: Child): this {
    this._label = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('labeled');
    if (this._label) parts.push(this.renderChild(this._label, ctx));
    if (this._body) {
      parts.push('{');
      parts.push(this.renderChild(this._body, ctx));
      parts.push('}');
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LabeledStatement {
    return {
      kind: 'labeled_statement',
      body: this.renderChild(this._body, ctx),
      label: this._label ? this.renderChild(this._label, ctx) : undefined,
    } as unknown as LabeledStatement;
  }

  override get nodeKind(): string { return 'labeled_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'labeled' });
    if (this._label) parts.push({ kind: 'builder', builder: this._label, fieldName: 'label' });
    if (this._body) {
      parts.push({ kind: 'token', text: '{', type: '{' });
      parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
      parts.push({ kind: 'token', text: '}', type: '}' });
    }
    return parts;
  }
}

export function labeled(body: Child): LabeledBuilder {
  return new LabeledBuilder(body);
}
