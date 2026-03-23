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
    return parts;
  }
}

export function labeled(body: Child): LabeledBuilder {
  return new LabeledBuilder(body);
}
